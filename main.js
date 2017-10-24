function PricesSummary() {
  axios.get('https://bitwages.now.sh/')
    .then(function(response) {
      var content = response.data.PricesSummary.map(function(item) {
        return template(item);
      });
      $('.exchanges').html(content);
      console.warn('content loaded...');
    })
    .catch(function(error) {
      return error;
    });
}

PricesSummary();
setInterval(PricesSummary, 60000);

function template(item) {
  return `
    <div class="col-md-6">
    <div class="card">
        <h4>${item.id}</h4>
        <hr class="divider">
        <h4><strong>R$ ${item.value}</strong></h4>
    </div>
    </div>
    `;
};