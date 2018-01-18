var activeChart
var defaultHours = 2
var defaultType = 'USDBRL'
var defaultAggregate = false
var localStorageKeyName = 'bitwages'
var maximumAggregate = 30
var fetchedData = {
  hours: 0,
  type: defaultType,
  result: []
}

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

function aggregateData(data) {
  var dataLength;
  Object.keys(data).forEach(function(id) {
    if (!dataLength) {
      dataLength = data[id].length
    }
    if (dataLength < maximumAggregate) {
      return
    }
    var tempArray = [].concat(data[id]).sort((a, b) => a.x - b.x)
    var resultArray = []
    while (tempArray.length) {
      var pushable = tempArray
        .splice(0, dataLength/maximumAggregate)
        .filter(function(e) { return e })
      var timestamp = pushable
        .map(function (e) { return new Date(e.x).getTime() })
      var value = pushable
        .map(function (e) { return parseFloat(e.y) })
        .reduce(function(a, b) { return a + b }, 0)
      resultArray.push({
        x: new Date(timestamp[Math.floor(timestamp.length/2)]),
        y: value/pushable.length
      })
    }
    data[id] = resultArray
  })
  return data
}

function writeLS(data) {
  return window.localStorage.setItem(localStorageKeyName, JSON.stringify(data))
}

function readLS() {
  return JSON.parse(window.localStorage.getItem(localStorageKeyName)) || {}
}

function toggleLegends(data) {
  var title = data.text
  var datasetIndex = data.datasetIndex
  var datasets = activeChart.config.data.datasets
  datasets[datasetIndex].hidden = !datasets[datasetIndex].hidden
  activeChart.update()
  let ls = readLS()
  ls[title] = !ls[title]
  writeLS(ls)
} 

function retrieveHistoricalData(x, type, aggregate) {
  var ONE_HOUR = 60 * 60 * 1000
  var X_HOURS_AGO = new Date().getTime() - (ONE_HOUR * parseFloat(x))
  var fetchMethod
  if (fetchedData.hours === x) {
    fetchMethod = Promise.all([]).then(function() { return fetchedData.result })
  } else {
    fetchMethod = axios.get('https://bitwages.now.sh/api/history?start=' + X_HOURS_AGO)
    .then(function(res) {
      fetchedData = {
        hours: x,
        type: type,
        result: res.data
      }
      return res.data
    })
  }
  return fetchMethod
    .then(function(data) {
      return data
        .map(d => {
          return d[type].map(e => {
            e.timestamp = d.timestamp
            return e
          })
        })
        .reduce((result, actual) => result.concat(actual),[])
        .reduce((result, actual) => {
          result[actual.id] = (result[actual.id] || []).concat({x: new Date(actual.timestamp), y: actual.value})
          return result 
        }, {})
    })
    .then(function(data) {
      if (aggregate) {
        data = aggregateData(data)
      }
      var colors = {
        'FlowBTC': '#F7D600',
        'BitcoinToYou': '#E63946',
        'WallTime': '#628CA1',
        'BitcoinTrade': '#98C63C',
        'Bitwage': '#FDFFFC',
        'Arena Bitcoin': '#30BCED',
        'FoxBit': '#ff625f',
        'Negocie Coins': 'rgb(110, 236, 232)',
        'Mercado Bitcoin': '#F6891D'
      }

      Chart.defaults.global.defaultColor = 'rgba(255,255,255,1)'
      Chart.defaults.global.defaultFontColor = '#FFF'
      var ctx = document.getElementById("myChart").getContext('2d')
      activeChart && activeChart.destroy && activeChart.destroy()
      return activeChart = new Chart(ctx, {
        type: 'line',
        data: {
          datasets: Object.keys(data).map(dataKey => {
            return {
              label: dataKey,
              display: false,
              backgroundColor: colors[dataKey],
              borderColor: colors[dataKey],
              borderWidth: 1,
              pointRadius: 1.5,
              pointHitRadius: 5,
              fill: false,
              steppedLine: false,
              cubicInterpolationMode: 'monotone',
              data: data[dataKey].sort((a, b) => a.x - b.x)
            }
          })
        },
        options: {
          scales: {
            xAxes: [{
                type: 'time',
                distribution: 'series',
                gridLines: {
                  display: false,
                  color: 'rgba(255,255,255, 0.5)'
                }
            }],
            yAxes: [{
              // ticks: {
              //   suggestedMax: 3.75,
              //   suggestedMin: 2.75,
              //   stepSize: 0.10
              // },
              gridLines: {
                display: true,
                color: 'rgba(255,255,255, 0.25)'
              }
            }]
          },
          tooltips: {
            mode: 'index',
            label: function(tooltipItem, data	) {
              console.log(tooltipItem, data)
            }
          },
          legend: {
              onClick: function(e, legendItem) { toggleLegends(legendItem) }
          }
        }
      })
      .render({
        duration: 800,
        lazy: false,
        easing: 'linear'
      })
    })
    .then(function(chart) {
      var ls = readLS()
      var datasets = activeChart.config.data.datasets
      Object.keys(ls).forEach(function(flag) {
        if (ls[flag]) {
          datasets.forEach(function(d) {
            if (d.label === flag) {
              d.hidden = !d.hidden 
            }
          })
        }
      })
      activeChart.update()
    })
    .catch(console.log)
}

function renderUSBBRL (data) {
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
  $('.chart-button').on('click', function(e) {
    var hours = $(this).data('hours')
    var type = $(this).data('type')
    if (hours) defaultHours = hours
    if (type) defaultType = type
    $('.chart-button').each(function() {
      $(this).prop('disabled', $(this).data('hours') === defaultHours || $(this).data('type') === defaultType)
    })
    $(this).prop('disabled', true)
    return retrieveHistoricalData(defaultHours, defaultType, defaultAggregate)
  })

  $('.chart-aggregate').on('click', function(e) {
    defaultAggregate = !defaultAggregate
    $(this).toggleClass('btn-disabled')
    return retrieveHistoricalData(defaultHours, defaultType, defaultAggregate)
  })
  retrieveHistoricalData(defaultHours, defaultType, defaultAggregate)
})

retrieveData()
setInterval(retrieveData, 60000)
