const retrieveBTCSummary = require('./lib/fetchData')

module.exports = (req, res) => {
  return retrieveBTCSummary()
    .catch(err => {
      console.log(err.response.statusMessage)
    })
}