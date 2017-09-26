const request = require('request-promise-cache')
const _get = require('lodash.get')
const exchanges = ['FLW', 'FOX', 'MBT', 'ARN', 'Bitwage']
const exchangesLabels = {
    FLW: 'FlowBTC',
    FOX: 'FoxBit',
    MBT: 'Mercado Bitcoin',
    ARN: 'Arena Bitcoin',
    B2U: 'BitcoinToYou',
    LOC: 'LocalBitcoins',
    NEG: 'Negocie Coins',
    Bitwage: 'Bitwage'
}

const exchangeTaxes = {
    FLW: {
        deposit: 0.005,
        receiveBTC: 0,
        transferBRL: 0.01,
        transferBTC: 0.001,
        passiveAction: 0.0035,
        activeAction: 0.0035
    },
    FOX: {
        deposit: 0,
        receiveBTC: 0,
        transferBRL: 0.0139,
        transferBTC: 0.00045,
        passiveAction: 0.0025,
        activeAction: 0.005
    },
    MBT: {
        deposit: 0.0199,
        receiveBTC: 0,
        transferBRL: 0.0199,
        transferBTC: 0,
        passiveAction: 0.003,
        activeAction: 0.007
    },
    ARN: {
        deposit: 0,
        receiveBTC: 0,
        transferBRL: 0.0039,
        transferBTC: 0.0015,
        passiveAction: 0.0025,
        activeAction: 0.0025
    },
    B2U: {
        deposit: 0.0189,
        receiveBTC: 0,
        transferBRL: 0.0189,
        transferBTC: 0.0005,
        passiveAction: 0.0025,
        activeAction: 0.006
    },
    LOC: {
        deposit: 0,
        receiveBTC: 0,
        transferBRL: 0,
        transferBTC: 0,
        passiveAction: 0,
        activeAction: 0
    },
    NEG: {
        deposit: 0,
        receiveBTC: 0,
        transferBRL: 0.005,
        transferBTC: 0.0004,
        passiveAction: 0.003,
        activeAction: 0.004
    },
    Bitwage: {
        deposit: 0,
        receiveBTC: 0,
        transferBRL: 0,
        transferBTC: 0.025,
        passiveAction: 0,
        activeAction: 0
    }
}

function fetch (url) {
    return request({
        url: url,
        cacheKey: url,
        cacheTTL: 5,
        cacheLimit: 12
    })
    .then(res => _get(res, 'response.body'))
}

function handleError (type) {
    switch (type) {
        case 'nodata':
        throw new Error('There was no data fetched.')
    }
}

function logOutput (data) {
    return {
        PricesSummary:  data
            .sort((a, b) => a.priceAfterTaxes < b.priceAfterTaxes)
            .map(el => Object.assign({}, {id: el.id, value: el.priceAfterTaxes})),
        percentageOverBitwage: data
            .sort((a, b) => a.priceAfterTaxes < b.priceAfterTaxes)
            .map(el => Object.assign({}, { id: el.id, value: el.priceAfterTaxes })),
        USDBRL: data
            .sort((a, b) => a.USDBRL < b.USDBRL)
            .map(el => Object.assign({}, { id: el.id, value: el.USDBRL })),
        USDBRLACTIVEACTION: data
            .sort((a, b) => a.USDBRL < b.USDBRL)
            .map(el => {
                return Object.assign({},
                        {
                            id: el.id,
                            value: parseFloat(el.USDBRL - (el.USDBRL * el.activeAction)).toFixed(2)
                        }
                );
            }),
        USDBRLPASSIVEACTION: data
            .sort((a, b) => a.USDBRL < b.USDBRL)
            .map(el => {
                return Object.assign({},
                        {
                            id: el.id,
                            value: parseFloat(el.USDBRL - (el.USDBRL * el.passiveAction)).toFixed(2)
                        }
                );
            }),
    }
}

function fetchUSDBRL () {
    return fetch('https://economia.awesomeapi.com.br/json/USD-BRL/1')
        .then(parseRequest)
}

function gatherAvgUSDBRL (response) {
    return (parseFloat(_get(response, '0.high')) + parseFloat(_get(response, '0.low'))) / 2
}

function calculateUSDBRL (data) {
    return fetchUSDBRL()
        .then(response => {
            const USD = gatherAvgUSDBRL(response)
            return data.map(exchange => {
                exchange.USDBRL = parseFloat(exchange.percentageOverBitwage / 100 * USD).toFixed(2)
                return exchange
            })
        })
}

function calculatePercentages (data) {
    const bitwagePrice = _get(data.filter(el => el.id === 'Bitwage'), '0.priceAfterTaxes')
    return data.map(el => {
        el.percentageOverBitwage = (el.priceAfterTaxes / bitwagePrice) * 100
        el.percentageOverBitwage = el.percentageOverBitwage.toFixed(2)
        return el
    })
}

function convertCurrency (data) {
    return data.map(el => {
        el.price = parseFloat(el.price).toFixed(2) || el
        el.priceAfterTaxes = parseFloat(el.priceAfterTaxes).toFixed(2)
        return el
    })
}

function swapLabelToName (data, exchangesLabels) {
    return data.map(el => Object.assign(el, { id: _get(exchangesLabels, el.id) }))
}

function applyTaxes (data, exchangeTaxes) {
    return data.map(el => {
        let elTaxes = _get(exchangeTaxes, el.id)
        if (el.id === 'Bitwage') {
            el.priceAfterTaxes = el.price + (el.price * elTaxes.transferBTC)
        } else {
            el.priceAfterTaxes = el.price - (el.price * elTaxes.receiveBTC)
            el.priceAfterTaxes = el.priceAfterTaxes * (1 - elTaxes.transferBRL)
        }

        //This will be used later to calculate the real tickers
        el.activeAction = elTaxes.activeAction;
        el.passiveAction = elTaxes.passiveAction;
        return el
    })
}

function calculateRawDolar (response) {
    const bitwageBTC = _get(JSON.parse(response[0]), 'XBTUSD')
    return fetchUSDBRL()
    .then(responseDollar => {
        const USD = gatherAvgUSDBRL(responseDollar)

        const bitwageObj = {
            id: 'Bitwage',
            price: parseFloat(bitwageBTC) * USD
        }

        const data = response[1]
        return data.map(el => {
            return el
        }).concat(bitwageObj)
    });
}

function fetchBitwage (data) {
    return Promise.all([
        fetch('https://api.bitwage.com/v1/ticker/XBTUSD'),
        data
    ])
}

function filterExchanges (data, exchanges) {
    return data.filter(el => exchanges.includes(el.id))
}

function getLastRatios (data) {
    return data.map(el => Object.assign({ id: _get(el, 'id'), price: _get(el, 'last')}))
}

function arrayrify (data) {
    return Object.keys(data).map(elementKey => {
        return Object.assign(data[elementKey], { id: elementKey })
    })
}

function getExchanges (data) {
    return _get(data, 'ticker_1h.exchanges') || handleError('nodata')
}

function parseRequest (data) {
    return JSON.parse(data)
}

function retrieveBTCSummary () {
    return fetch('http://api.bitvalor.com/v1/ticker.json')
        .then(parseRequest)
        .then(getExchanges)
        .then(arrayrify)
        .then(getLastRatios)
        .then(fetchBitwage)
        .then(calculateRawDolar)
        .then(ratios => filterExchanges(ratios, exchanges))
        .then(ratios => applyTaxes(ratios, exchangeTaxes))
        .then(convertCurrency)
        .then(calculatePercentages)
        .then(calculateUSDBRL)
        .then(ratios => swapLabelToName(ratios, exchangesLabels))
        .then(logOutput)
        .catch(console.log)
}

module.exports = retrieveBTCSummary
