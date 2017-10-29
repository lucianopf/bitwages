function retrieveData() {
  return axios.get('https://bitwages.now.sh/api')
    .then(function(response) {
      data = response.data
      return data
    })
    .then(function(data) {
      console.warn('content loaded...');
      renderPricesSummary(data)
      renderUSDBRL(data)
      renderUSDBRLActive(data)
      renderUSDBRLPassive(data)
      return data
    })
    .then(function(data) {
      renderUSBBRL(data)
      renderXBTUSD(data)
    })
    .catch(console.log)
}

function renderUSBBRL (data) {
  console.log(data.sourceValues.USD)
  $('#source-usdbrl').html(data.sourceValues.USD)
}

function renderXBTUSD (data) {
  $('#source-xbtusd').html(data.sourceValues.BITWAGE_XBTUSD)
}

function renderPricesSummary(data) {
  $('.results > .prices-summary > .exchanges').html(data.PricesSummary.map(template))
}

function renderUSDBRL(data) {
  $('.results > .usdbrl > .exchanges').html(data.USDBRL.map(template))
}

function renderUSDBRLActive(data) {
  $('.results > .usdbrl-active > .exchanges').html(data.USDBRLACTIVEACTION.map(template))
}

function renderUSDBRLPassive(data) {
  $('.results > .usdbrl-passive > .exchanges').html(data.USDBRLPASSIVEACTION.map(template))
}

function template(item, key) {
  return `
    <div class="col-md-4">
    <div class="card">
        <h4>${key + 1} - ${item.id}</h4>
        <hr class="divider">
        <h4><strong>R$ ${item.value}</strong></h4>
    </div>
    </div>
    `;
};

retrieveData()
setInterval(retrieveData, 60000)