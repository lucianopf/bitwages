const request = require('request-promise-cache')
const _get = require('lodash.get')

function fetch(url) {
  return request({
    url: url,
    cacheKey: url,
    cacheTTL: 5,
    cacheLimit: 12,
  }).then(res => _get(res, 'response.body'))
}

function handleError(type) {
  switch (type) {
    case 'nodata':
      throw new Error('There was no data fetched.')
  }
}

function retrieveUrl(url) {
  let [path, params] = url.split('?')
  path = path.replace('/api', '')
  params = params ? params.split('&') : []
  params = params.reduce((result, param) => {
    const [key, value] = param.split('=')
    result[key] = value
    return result
  }, {})
  return [path, params]
}

module.exports = {
  fetch,
  handleError,
  retrieveUrl,
}
