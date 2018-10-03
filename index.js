const { retrieveUrl } = require('./lib/utils')

const indexCache = new require('./lib/cache.js')({
  fn: require('./lib/fetchData'),
  minutes: 1,
  log: 'Index'
})

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  const [path, params] = retrieveUrl(req.url)
  switch(path) {
    case '/history':
      return require('./lib/db').getApiResponses(params)
      break
    case '/favicon.ico':
      break
    default:
      return indexCache.resolve()
      break
  }
}
