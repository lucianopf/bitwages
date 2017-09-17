const retrieveBTCSummary = require('./lib/fetchData')

module.exports = (req, res) => {
  return 'Testing deploy speed'
  return retrieveBTCSummary()
    .catch(err => {
      console.log(err.response.statusMessage)
    })
}