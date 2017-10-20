const retrieveBTCSummary = require('./lib/fetchData')
const cache = new require('./lib/cache.js')({
  fn: retrieveBTCSummary,
  minutes: 1,
  log: 'Index'
})

module.exports = (req, res) => {
  return cache.resolve()
}
