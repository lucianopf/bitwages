const retrieveBTCSummary = require('./lib/fetchData')

module.exports = (req, res) => {
  return retrieveBTCSummary()
    .then(response => Object.assign({ test: '1'}, response))
    .catch(err => {
      console.log(err.response.statusMessage)
    })
}