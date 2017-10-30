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
  $('#source-usdbrl-tip').html(data.sourceValues.USD)
}

function renderXBTUSD (data) {
  $('#source-xbtusd').html(data.sourceValues.BITWAGE_XBTUSD)
}

function renderPricesSummary(data) {
  $('.results > .prices-summary > .exchanges > .row').html(data.PricesSummary.map(template))
}

function renderUSDBRL(data) {
  $('.results > .usdbrl > .exchanges > .row').html(data.USDBRL.map(template))
}

function renderUSDBRLActive(data) {
  $('.results > .usdbrl-active > .exchanges > .row').html(data.USDBRLACTIVEACTION.map(template))
}

function renderUSDBRLPassive(data) {
  $('.results > .usdbrl-passive > .exchanges > .row').html(data.USDBRLPASSIVEACTION.map(template))
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

$(document).ready(function(){
  tippy('#prices-tip', {
    html: document.querySelector('#price-tip-template'),
    arrow: true,
    animation: 'fade',
    size: 'regular',
    theme: 'bitwages',
    trigger: 'mouseenter focus click',
  })
  tippy('#usdbrl-tip', {
    html: document.querySelector('#usdbrl-tip-template'),
    arrow: true,
    animation: 'fade',
    size: 'regular',
    theme: 'bitwages',
    trigger: 'mouseenter focus click',
  })
  tippy('#usdbrl-active-tip', {
    html: document.querySelector('#usdbrl-active-tip-template'),
    arrow: true,
    animation: 'fade',
    size: 'regular',
    theme: 'bitwages',
    trigger: 'mouseenter focus click',
  })
  tippy('#usdbrl-passive-tip', {
    html: document.querySelector('#usdbrl-passive-tip-template'),
    arrow: true,
    animation: 'fade',
    size: 'regular',
    theme: 'bitwages',
    trigger: 'mouseenter focus click',
  })
})