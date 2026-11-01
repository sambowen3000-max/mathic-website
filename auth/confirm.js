// S14-14 (1 Nov 2026): the sign-up confirmation email links here with a
// one-time token hash. On an iPhone with Mathic installed the Universal Link
// opens the app instead (which signs the parent in). Anywhere else this page
// exchanges the hash with Supabase so the address is confirmed, then tells
// the parent to open the app.
(function () {
  'use strict';

  var SUPABASE_URL = 'https://vpycxybvsnrkmqvtlpok.supabase.co';
  var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_hAPz5uE-iws3W1WVTJ6KXQ_3wQTMx1Z';

  var states = ['checking', 'done', 'expired'];
  function show(name) {
    states.forEach(function (s) { document.getElementById('state-' + s).hidden = s !== name; });
  }

  var params = new URLSearchParams(window.location.search);
  var tokenHash = params.get('token_hash');
  var type = params.get('type') || 'email';

  if (!tokenHash || !window.supabase) { show('expired'); return; }
  try { history.replaceState(null, '', '/auth/confirm'); } catch (e) { /* ignore */ }

  var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  client.auth.verifyOtp({ token_hash: tokenHash, type: type }).then(function (res) {
    if (res.error || !res.data || !res.data.session) { show('expired'); return; }
    // The browser never needs the session; the parent signs in on the phone.
    client.auth.signOut().catch(function () { /* nothing to keep */ });
    show('done');
  }).catch(function () { show('expired'); });
})();
