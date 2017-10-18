const request = require('request-promise-cache')
const _get = require('lodash.get')

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

module.exports = {
  fetch,
  handleError
}