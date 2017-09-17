const request = require('request-promise-cache')
const _get = require('lodash.get')
const exchanges = ['FLW', 'FOX', 'MBT', 'ARN', 'Coinbase']
const exchangesLabels = {
  FLW: 'FlowBTC',
  FOX: 'FoxBit',
  MBT: 'Mercado Bitcoin',
  ARN: 'Arena Bitcoin',
  B2U: 'BitcoinToYou',
  LOC: 'LocalBitcoins',
  NEG: 'Negocie Coins',
  Coinbase: 'Coinbase'
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
  Coinbase: {
    deposit: 0,
    receiveBTC: 0,
    transferBRL: 0,
    transferBTC: 0.0005,
    passiveAction: 0,
    activeAction: 0
  }
}

function fetch (url) {
  return request({
    url: url,
    cacheKey: url,
    cacheTTL: 1,
    cacheLimit: 12
  })
  .then(res => _get(res, 'response.body'))
}

function handleError (type) {
  switch (type) {
    case 'nodata':
      throw new Error('There was no data fetched.')
      break
  }
}

function logOutput (data) {
  let message = ''
  message += '\nBTCBRL prices after fees summary\n'
  data
    .sort((a, b) => a.priceAfterTaxes < b.priceAfterTaxes)
    .forEach(el => {
      message += `${el.id}: ${el.priceAfterTaxes}\n`
    })
  message += '\nPercentage over Coinbase price\n'
  data
    .sort((a, b) => a.priceAfterTaxes < b.priceAfterTaxes)
    .forEach(el => {
      message += `${el.id}: ${el.percentageOverCoinbase}%\n`
    })
  return message
}

function calculatePercentages (data) {
  const coinbasePrice = _get(data.filter(el => el.id === 'Coinbase'), '0.priceAfterTaxes')
  return data.map(el => {
    el.percentageOverCoinbase = (el.priceAfterTaxes / coinbasePrice) * 100
    el.percentageOverCoinbase = el.percentageOverCoinbase.toFixed(2)
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
    if (el.id === 'Coinbase') {
      el.priceAfterTaxes = el.price - (el.price * elTaxes.transferBTC)
    } else {
      el.priceAfterTaxes = el.price - (el.price * elTaxes.receiveBTC)
      el.priceAfterTaxes = el.priceAfterTaxes * (1 - elTaxes.transferBRL)
    }
    return el
  })
}

function calculateRawDolar (response) {
  const coinbase = _get(JSON.parse(response[0]), 'data.0')
  const coinbaseObj = {
    id: 'Coinbase',
    price: _get(coinbase, 'amount')
  }
  const data = response[1]
  return data.map(el => {
    return el
  }).concat(coinbaseObj)
}

function fetchCoinbase (data) {
  return Promise.all([
    fetch('http://api.coinbase.com/v2/prices/BRL/spot?'),
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
  return _get(data, 'ticker_24h.exchanges') || handleError('nodata')
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
    .then(fetchCoinbase)
    .then(calculateRawDolar)
    .then(ratios => filterExchanges(ratios, exchanges))
    .then(ratios => applyTaxes(ratios, exchangeTaxes))
    .then(convertCurrency)
    .then(calculatePercentages)
    .then(ratios => swapLabelToName(ratios, exchangesLabels))
    .then(logOutput)
}

module.exports = retrieveBTCSummary