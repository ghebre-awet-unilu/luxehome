
window.handleFormSubmit = function (e) {
  e.preventDefault();
  var form    = e.target;
  var success = document.getElementById('formSuccess');
  var btn     = form.querySelector('button[type="submit"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
  setTimeout(function () {
    form.reset();
    if (btn)     { btn.style.display = 'none'; }
    if (success) { success.style.display = 'block'; }
  }, 800);
};


(function () {
  'use strict';

  var searchInput  = document.getElementById('searchInput');
  var filterType   = document.getElementById('filterType');
  var filterStatus = document.getElementById('filterStatus');
  var clearBtn     = document.getElementById('clearFilters');
  var grid         = document.getElementById('propertyGrid');
  var noResults    = document.getElementById('noResults');
  var resultsCount = document.getElementById('resultsCount');

  if (!grid) return;

  function filterProperties() {
    var query  = searchInput  ? searchInput.value.trim().toLowerCase()  : '';
    var type   = filterType   ? filterType.value   : '';
    var status = filterStatus ? filterStatus.value : '';

    var cards   = grid.querySelectorAll('.property-card');
    var visible = 0;

    cards.forEach(function (card) {
      var title    = (card.dataset.title    || '').toLowerCase();
      var location = (card.dataset.location || '').toLowerCase();
      var cardType = (card.dataset.type     || '');
      var cardStat = (card.dataset.status   || '');

      var matchQuery  = !query  || title.includes(query) || location.includes(query) || cardType.toLowerCase().includes(query);
      var matchType   = !type   || cardType === type;
      var matchStatus = !status || cardStat === status;

      var show = matchQuery && matchType && matchStatus;
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    if (noResults) {
      noResults.style.display = visible === 0 ? 'block' : 'none';
    }

    if (resultsCount) {
      var total = cards.length;
      resultsCount.textContent = visible === total
        ? total + ' propert' + (total === 1 ? 'y' : 'ies') + ' available'
        : 'Showing ' + visible + ' of ' + total + ' properties';
    }
  }

  window.clearAllFilters = function () {
    if (searchInput)  searchInput.value  = '';
    if (filterType)   filterType.value   = '';
    if (filterStatus) filterStatus.value = '';
    filterProperties();
  };

  if (searchInput)  searchInput.addEventListener('input',  filterProperties);
  if (filterType)   filterType.addEventListener('change',  filterProperties);
  if (filterStatus) filterStatus.addEventListener('change', filterProperties);
  if (clearBtn)     clearBtn.addEventListener('click', window.clearAllFilters);

  filterProperties();
})();
