// WEB-9: moved out of index.html; the CSP (script-src 'self') blocks inline scripts.
(function () {
  var modal = document.getElementById('coming-soon');
  var last = null;
  function open(e) { e.preventDefault(); last = e.currentTarget; modal.hidden = false; document.body.classList.add('modal-open'); modal.querySelector('[data-close].btn-primary').focus(); }
  function close() { modal.hidden = true; document.body.classList.remove('modal-open'); if (last) last.focus(); }
  document.querySelectorAll('.js-coming-soon').forEach(function (b) { b.addEventListener('click', open); });
  modal.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', close); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) close(); });
  var toggle = document.querySelector('.nav-toggle'), links = document.getElementById('nav-links');
  toggle.addEventListener('click', function () { var on = links.classList.toggle('open'); toggle.setAttribute('aria-expanded', on ? 'true' : 'false'); });
  links.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { links.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }); });
})();
