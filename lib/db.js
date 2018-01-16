const dynamoose = require('dynamoose')
const dynamoURL = process.env.dynamoURL || 'defaultDynamoDbUrl'

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

function getApiResponses ({start}) {
  if (!start) {
    let today = new Date()
    start = today - (1000 * 60 * 60 * 24 * 2) * 5
  }
  return Api
    .scan('timestamp')
    .gt(new Date(parseInt(start)).getTime())
    .exec()
}

module.exports = {
  dynamoose,
  Api,
  saveApiResponse,
  getApiResponses
}