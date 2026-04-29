// LuxeHome — Booking Flow (JAMstack, no backend)
(function () {
  'use strict';

  var flowEl = document.getElementById('bookingFlow');
  if (!flowEl) return;



  var propertyTitle  = flowEl.dataset.title  || 'LuxeHome Property';
  var priceRaw       = flowEl.dataset.price  || '';
  var propertyStatus = flowEl.dataset.status || '';



  var priceMatch = priceRaw.replace(/,/g, '').match(/[\d]+(\.\d+)?/);
  var basePrice  = priceMatch ? parseFloat(priceMatch[0]) : 0;
  var vatRate    = 0.15;
  var vatAmount  = Math.round(basePrice * vatRate * 100) / 100;
  var totalPrice = Math.round((basePrice + vatAmount) * 100) / 100;

  function fmt(n) {
    return '€' + n.toLocaleString('en-IE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  

  var stepBooking   = document.getElementById('stepBooking');
  var stepCheckout  = document.getElementById('stepCheckout');
  var stepAgreement = document.getElementById('stepAgreement');
  var paypalWrap    = document.getElementById('paypalButtonContainer');

  

  var elBase  = document.getElementById('summaryBase');
  var elVat   = document.getElementById('summaryVat');
  var elTotal = document.getElementById('summaryTotal');
  var elPayBtn = document.getElementById('payBtn');

  if (elBase)  elBase.textContent  = fmt(basePrice);
  if (elVat)   elVat.textContent   = fmt(vatAmount)  + ' (15%)';
  if (elTotal) elTotal.textContent = fmt(totalPrice);
  if (elPayBtn) elPayBtn.textContent = 'Pay ' + fmt(totalPrice);

  

  var bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    bookingForm.addEventListener('submit', function (e) {
      e.preventDefault();

      

      var inputs = bookingForm.querySelectorAll('[required]');
      var valid  = true;
      inputs.forEach(function (inp) {
        if (!inp.value.trim()) {
          inp.classList.add('field-error');
          valid = false;
        } else {
          inp.classList.remove('field-error');
        }
      });
      if (!valid) {
        bookingForm.querySelector('.booking-error').style.display = 'block';
        return;
      }
      bookingForm.querySelector('.booking-error').style.display = 'none';

      stepBooking.style.display  = 'none';
      stepCheckout.style.display = 'block';
      stepCheckout.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    

    bookingForm.querySelectorAll('input, select, textarea').forEach(function (inp) {
      inp.addEventListener('input', function () { inp.classList.remove('field-error'); });
    });
  }

  
  
  var payBtn = document.getElementById('payBtn');
  if (payBtn) {
    payBtn.addEventListener('click', function () {
      stepCheckout.style.display  = 'none';
      stepAgreement.style.display = 'block';
      stepAgreement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      initSignature();
    });
  }

  

  var sigCanvas, sigCtx, drawing = false;

  function initSignature() {
    sigCanvas = document.getElementById('sigCanvas');
    if (!sigCanvas || sigCanvas._init) return;
    sigCanvas._init = true;
    sigCtx = sigCanvas.getContext('2d');
    sigCtx.strokeStyle = '#1a3c5e';
    sigCtx.lineWidth   = 2.5;
    sigCtx.lineCap     = 'round';

    function getPos(e) {
      var r = sigCanvas.getBoundingClientRect();
      var src = e.touches ? e.touches[0] : e;
      return { x: src.clientX - r.left, y: src.clientY - r.top };
    }

    sigCanvas.addEventListener('mousedown',  function (e) { drawing = true; var p = getPos(e); sigCtx.beginPath(); sigCtx.moveTo(p.x, p.y); });
    sigCanvas.addEventListener('mousemove',  function (e) { if (!drawing) return; var p = getPos(e); sigCtx.lineTo(p.x, p.y); sigCtx.stroke(); });
    sigCanvas.addEventListener('mouseup',    function ()  { drawing = false; });
    sigCanvas.addEventListener('mouseleave', function ()  { drawing = false; });
    sigCanvas.addEventListener('touchstart', function (e) { e.preventDefault(); drawing = true; var p = getPos(e); sigCtx.beginPath(); sigCtx.moveTo(p.x, p.y); }, { passive: false });
    sigCanvas.addEventListener('touchmove',  function (e) { e.preventDefault(); if (!drawing) return; var p = getPos(e); sigCtx.lineTo(p.x, p.y); sigCtx.stroke(); }, { passive: false });
    sigCanvas.addEventListener('touchend',   function ()  { drawing = false; });
  }

  

  window.toggleSigMode = function (mode) {
    var drawWrap = document.getElementById('sigDrawWrap');
    var typeWrap = document.getElementById('sigTypeWrap');
    var btnDraw  = document.getElementById('sigBtnDraw');
    var btnType  = document.getElementById('sigBtnType');
    if (mode === 'draw') {
      drawWrap.style.display = 'block';
      typeWrap.style.display = 'none';
      btnDraw.classList.add('sig-mode-active');
      btnType.classList.remove('sig-mode-active');
      initSignature();
    } else {
      drawWrap.style.display = 'none';
      typeWrap.style.display = 'block';
      btnType.classList.add('sig-mode-active');
      btnDraw.classList.remove('sig-mode-active');
    }
  };

  window.clearSignature = function () {
    if (sigCanvas && sigCtx) sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
  };

  

  var completePayBtn = document.getElementById('completePayBtn');
  if (completePayBtn) {
    completePayBtn.addEventListener('click', function () {
      var agreeCheck = document.getElementById('agreeCheck');
      var agreeErr   = document.getElementById('agreeError');

    

      if (!agreeCheck.checked) {
        agreeErr.style.display = 'block';
        return;
      }
      agreeErr.style.display = 'none';

      

      var sigMode  = document.querySelector('.sig-mode-active');
      var sigValid = false;
      if (sigMode && sigMode.id === 'sigBtnType') {
        var typed = document.getElementById('sigTyped');
        sigValid  = typed && typed.value.trim().length > 1;
      } else {
        

        if (sigCanvas) {
          var data = sigCtx.getImageData(0, 0, sigCanvas.width, sigCanvas.height).data;
          for (var i = 3; i < data.length; i += 4) { if (data[i] > 0) { sigValid = true; break; } }
        }
      }
      var sigErr = document.getElementById('sigError');
      if (!sigValid) {
        sigErr.style.display = 'block';
        return;
      }
      sigErr.style.display = 'none';

      

      var selectedMethod = document.querySelector('input[name="payMethod"]:checked');
      var method = selectedMethod ? selectedMethod.value : 'paypal';

      stepAgreement.style.display   = 'none';
      paypalWrap.style.display      = 'block';
      paypalWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });

      renderPayPal(method);
    });
  }

  
  
  var paypalRendered = false;
  function renderPayPal(method) {
    if (paypalRendered) return;
    paypalRendered = true;

    var container = document.getElementById('paypalButtonContainer');

    if (typeof paypal === 'undefined') {
      container.innerHTML = '<p class="paypal-error">PayPal SDK failed to load. Please refresh and try again.</p>';
      return;
    }

    paypal.Buttons({
      style: {
        layout: 'vertical',
        color:  'blue',
        shape:  'rect',
        label:  'pay'
      },
      createOrder: function (data, actions) {
        return actions.order.create({
          purchase_units: [{
            description: propertyTitle,
            amount: {
              value:         totalPrice.toFixed(2),
              currency_code: 'EUR'
            }
          }]
        });
      },
      onApprove: function (data, actions) {
        return actions.order.capture().then(function (details) {
          alert('Payment successful! Thank you, ' + (details.payer && details.payer.name ? details.payer.name.given_name : 'valued customer') + '. Your booking is confirmed.');
          const successUrl = document.getElementById('bookingFlow').dataset.successUrl || '/success/';
          window.location.href = successUrl;
        });
      },
      onError: function () {
        alert('Payment could not be completed. Please try again or contact us at info@luxehome.lu.');
      },
      onCancel: function () {
        paypalWrap.style.display      = 'none';
        stepAgreement.style.display   = 'block';
        stepAgreement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }).render('#paypalButtonContainer');
  }

})();
