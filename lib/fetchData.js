const _get = require('lodash.get')
const { exchanges, exchangesLabels, exchangeTaxes } = require('./sources')
const { fetch, handleError } = require('./utils')

const cachedWallTime = require('./cache.js')({
  fn: fetchWalltime,
  minutes: 5,
  log: 'WallTime'
})

function fetchWalltime () {
  const nightmare = require('nightmare')({ show: false, waitTimeout: 30000 })
  return nightmare
    .goto('https://walltime.info/index_pt.html#!login')
    .wait('#order-book-sell-line0-column1 > span:last-child')
    .evaluate(() => document.querySelector('#ratio').value)
    .end()
    .then(result => result.replace('R$ ', '').replace(/\./g, '').replace(',', '.'))
}

function logOutput (data, sourceValues) {
  return {
    PricesSummary: data
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
        )
      }),
    USDBRLPASSIVEACTION: data
      .sort((a, b) => a.USDBRL < b.USDBRL)
      .map(el => {
        return Object.assign({},
          {
            id: el.id,
            value: parseFloat(el.USDBRL - (el.USDBRL * el.passiveAction)).toFixed(2)
          }
        )
      }),
    sourceValues: sourceValues
  }
}

function fetchUSDBRL () {
  return fetch('https://api.bitwage.com/v1/tickers')
    .then(parseRequest)
}

function gatherAvgUSDBRL (response) {
  return (parseFloat(_get(response, 'USDBRL')))
}

function calculateUSDBRL (data, sourceValues) {
  return fetchUSDBRL()
    .then(response => {
      const USD = gatherAvgUSDBRL(response)
      sourceValues.USD = (parseFloat(USD) * 0.96).toFixed(2).toString()
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

    // This will be used later to calculate the real tickers
    el.activeAction = elTaxes.activeAction
    el.passiveAction = elTaxes.passiveAction
    return el
  })
}

function calculateRawDolar (response, sourceValues) {
  const bitwageBTC = sourceValues.BITWAGE_XBTUSD = _get(JSON.parse(response[0]), 'XBTUSD')
  const WallTime = parseFloat(response[1])
  return fetchUSDBRL()
    .then(responseDollar => {
      const USD = gatherAvgUSDBRL(responseDollar)
      const data = response[2]
      return data.concat([
        {
          id: 'Bitwage',
          price: parseFloat(bitwageBTC) * USD
        },
        {
          id: 'WAL',
          price: WallTime
        }
      ])
    })
}

function fetchExternalResources (data) {
  return Promise.all([
    fetch('https://api.bitwage.com/v1/ticker/XBTUSD'),
    cachedWallTime.resolve(),
    data
  ])
}

function filterExchanges (data, exchanges) {
  return data.filter(el => exchanges.includes(el.id))
}

function getLastRatios (data) {
  return data.map(el => Object.assign({ id: _get(el, 'id'), price: _get(el, 'last') }))
}

function arrayrify (data) {
  return Object.keys(data).map(elementKey => {
    return Object.assign(data[elementKey], { id: elementKey })
  })
}

function getExchanges (data) {
  let exchanges = _get(data, 'ticker_12h.exchanges') || handleError('nodata')
  _get(data, 'ticker_1h.exchanges') || handleError('nodata')
    .forEach((el, key) => {
      exchanges[key] = el
      return el
    })
  return exchanges
}

function parseRequest (data) {
  return JSON.parse(data)
}

function retrieveBTCSummary () {
  let sourceValues = {}
  return fetch('http://api.bitvalor.com/v1/ticker.json')
    .then(parseRequest)
    .then(getExchanges)
    .then(arrayrify)
    .then(getLastRatios)
    .then(fetchExternalResources)
    .then(responses => calculateRawDolar(responses, sourceValues))
    .then(ratios => filterExchanges(ratios, exchanges))
    .then(ratios => applyTaxes(ratios, exchangeTaxes))
    .then(convertCurrency)
    .then(calculatePercentages)
    .then(exchanges => calculateUSDBRL(exchanges, sourceValues))
    .then(ratios => swapLabelToName(ratios, exchangesLabels))
    .then(data => logOutput(data, sourceValues))
    .catch(console.log)
}

module.exports = retrieveBTCSummary
