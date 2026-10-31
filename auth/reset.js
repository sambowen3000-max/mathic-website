// MA-292 (31 Oct 2026): the reset-password email links here with a one-time
// token hash. On an iPhone with Mathic installed the Universal Link opens the
// app instead and this page is never shown. Anywhere else (a Mac, a friend's
// phone) this page exchanges the hash with Supabase and lets the parent set a
// new password, so a click outside the phone no longer wastes the link.
//
// The key below is Supabase's publishable key: it is public by design (the app
// ships it) and only grants what row-level security allows.
(function () {
  'use strict';

  var SUPABASE_URL = 'https://vpycxybvsnrkmqvtlpok.supabase.co';
  var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_hAPz5uE-iws3W1WVTJ6KXQ_3wQTMx1Z';
  var MIN_PASSWORD = 8;
  var MAX_PASSWORD_BYTES = 72;

  // Same wording as the app's password rules (SEC-6).
  var TEXT = {
    mismatch: "Those passwords don't match — give it another try.",
    tooShort: 'Your password needs at least 8 characters.',
    tooLong: 'Your password can be up to 72 characters.',
    repeated: 'That password repeats itself. Try three random words instead.',
    containsEmail: "Your password can't include your email address.",
    samePassword: 'Your new password must be different from your old one.',
    weak: "That's one of the most common passwords. Try three random words instead.",
    pwned: 'That password has appeared in a data breach. Try three random words instead.',
    characters: "That password doesn't meet the character rules. Try three random words instead.",
    failed: 'Something went wrong. Please request a new reset link.',
  };

  // Supabase explains a weak_password rejection in error.weak_password.reasons:
  // 'length', 'characters' (the project's character rule) or 'pwned' (seen in a breach).
  function weakPasswordText(err) {
    var reasons = (err && err.weak_password && err.weak_password.reasons) || [];
    if (reasons.indexOf('pwned') !== -1) return TEXT.pwned;
    if (reasons.indexOf('length') !== -1) return TEXT.tooShort;
    if (reasons.indexOf('characters') !== -1) return TEXT.characters;
    return TEXT.weak;
  }

  var states = ['checking', 'form', 'done', 'expired'];
  function show(name) {
    states.forEach(function (s) {
      document.getElementById('state-' + s).hidden = s !== name;
    });
  }

  function utf8Bytes(s) {
    var n = 0;
    for (var i = 0; i < s.length; i++) {
      var c = s.codePointAt(i);
      if (c > 0xffff) i++;
      n += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
    }
    return n;
  }
  function isRepeated(pw) {
    for (var unit = 1; unit <= pw.length / 2; unit++) {
      if (pw.length % unit === 0 && pw.slice(0, unit).repeat(pw.length / unit) === pw) return true;
    }
    return false;
  }
  function alnum(s) { return s.toLowerCase().replace(/[^a-z0-9]/g, ''); }
  function checkPassword(pw, email) {
    if (Array.from(pw).length < MIN_PASSWORD) return 'tooShort';
    if (utf8Bytes(pw) > MAX_PASSWORD_BYTES) return 'tooLong';
    var local = alnum((email || '').split('@')[0] || '');
    if (local.length >= 3 && alnum(pw).indexOf(local) !== -1) return 'containsEmail';
    if (isRepeated(pw.toLowerCase())) return 'repeated';
    return null;
  }

  var params = new URLSearchParams(window.location.search);
  var tokenHash = params.get('token_hash');
  var type = params.get('type') || 'recovery';

  if (!tokenHash || !window.supabase) { show('expired'); return; }

  // Drop the hash from the address bar and history so it is not re-sent or bookmarked.
  try { history.replaceState(null, '', '/auth/reset'); } catch (e) { /* ignore */ }

  var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  var email = '';
  client.auth.verifyOtp({ token_hash: tokenHash, type: type }).then(function (res) {
    if (res.error || !res.data || !res.data.session) { show('expired'); return; }
    email = (res.data.session.user && res.data.session.user.email) || '';
    show('form');
    document.getElementById('password').focus();
  }).catch(function () { show('expired'); });

  var form = document.getElementById('reset-form');
  var errorBox = document.getElementById('form-error');
  var submit = document.getElementById('submit');

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    errorBox.textContent = '';
    var pw = document.getElementById('password').value;
    var confirm = document.getElementById('confirm').value;
    if (pw !== confirm) { errorBox.textContent = TEXT.mismatch; return; }
    var broken = checkPassword(pw, email);
    if (broken) { errorBox.textContent = TEXT[broken]; return; }

    submit.disabled = true;
    client.auth.updateUser({ password: pw }).then(function (res) {
      submit.disabled = false;
      if (res.error) {
        var code = res.error.code || '';
        errorBox.textContent =
          code === 'same_password' ? TEXT.samePassword :
          code === 'weak_password' ? weakPasswordText(res.error) :
          TEXT.failed;
        return;
      }
      client.auth.signOut().catch(function () { /* nothing to keep */ });
      show('done');
    }).catch(function () {
      submit.disabled = false;
      errorBox.textContent = TEXT.failed;
    });
  });
})();
