// WEB-9: moved out of index.html; the CSP (script-src 'self') blocks inline scripts.
(function () {
  var modal = document.getElementById('coming-soon');
  var last = null;
  function open(e) { e.preventDefault(); last = e.currentTarget; modal.hidden = false; document.body.classList.add('modal-open'); document.getElementById('wl-email').focus(); }
  function close() { modal.hidden = true; document.body.classList.remove('modal-open'); if (last) last.focus(); }
  document.querySelectorAll('.js-coming-soon').forEach(function (b) { b.addEventListener('click', open); });
  modal.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', close); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) close(); });
  var toggle = document.querySelector('.nav-toggle'), links = document.getElementById('nav-links');
  toggle.addEventListener('click', function () { var on = links.classList.toggle('open'); toggle.setAttribute('aria-expanded', on ? 'true' : 'false'); });
  links.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { links.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }); });
})();

// WAIT-1: launch waitlist. Calls join_launch_waitlist() with the publishable key
// (the same public key the /auth pages use); the table itself is not readable.
(function () {
  var form = document.getElementById('waitlist-form');
  if (!form) return;
  var input = document.getElementById('wl-email');
  var status = form.querySelector('.wl-status');
  var btn = form.querySelector('button[type=submit]');
  var URL = 'https://vpycxybvsnrkmqvtlpok.supabase.co/rest/v1/rpc/join_launch_waitlist';
  var KEY = 'sb_publishable_hAPz5uE-iws3W1WVTJ6KXQ_3wQTMx1Z';
  function say(text, isErr) { status.textContent = text; status.classList.toggle('err', !!isErr); }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = input.value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) { say('Please check your email address.', true); input.focus(); return; }
    btn.disabled = true; say('');
    fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: KEY }, body: JSON.stringify({ p_email: email }) })
      .then(function (r) {
        if (r.ok) { form.reset(); say("Thanks! We'll email you once, when Mathic is live."); return; }
        return r.json().catch(function () { return {}; }).then(function (b) {
          say(b && b.code === '22023' ? 'Please check your email address.' : "Sorry, that didn't work. Please try again in a minute.", true);
        });
      })
      .catch(function () { say("Sorry, that didn't work. Please try again in a minute.", true); })
      .then(function () { btn.disabled = false; });
  });
})();
