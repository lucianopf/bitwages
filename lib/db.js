const dynamoose = require('dynamoose')
const dynamoURL = process.env.dynamoURL || 'https://db-dynamo.wedeploy.io'

dynamoose.AWS.config.update({
  accessKeyId: process.env.accessKeyId || 'defaultKey',
  secretAccessKey: process.env.secretAccessKey || 'defaultKey',
  region: process.env.region || 'defaultKey'
})
dynamoose.local(dynamoURL)

const Api = dynamoose.model('api', {
  id: {
    type: Number,
    hashKey: true,
    index: true
  },
  timestamp: {
    type: Date,
    index: true
  },
  PricesSummary: Array,
  percentageOverBitwage: Array,
  USDBRL: Array,
  USDBRLACTIVEACTION: Array,
  USDBRLPASSIVEACTION: Array,
  sourceValues: Object
})

function saveApiResponse (data) {
  var response = new Api(Object.assign({
    id: Math.floor(Math.random() * new Date().getTime()),
    timestamp: new Date().getTime()
  }, data));
  return response.save()
}

module.exports = {
  dynamoose,
  Api,
  saveApiResponse
}