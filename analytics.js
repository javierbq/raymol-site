// analytics.js — consent-gated Google Analytics 4 for raymol.io.
// GA is loaded ONLY after the visitor accepts via the cookie banner; the
// choice is remembered in localStorage so the banner shows once. Declining
// loads nothing and sets no analytics cookies.
(function () {
  var GA_ID = 'G-L09L440T2F';
  var KEY = 'raymol-analytics-consent'; // "granted" | "denied"

  function loadGA() {
    if (window.__raymolGA) return; window.__raymolGA = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
  }

  var choice = null;
  try { choice = localStorage.getItem(KEY); } catch (e) {}
  if (choice === 'granted') { loadGA(); return; }
  if (choice === 'denied') { return; }

  function remember(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function showBanner() {
    var css = '\
.cc-banner{position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483647;max-width:680px;margin:0 auto;\
background:#fff;border:1px solid #e6e8ec;box-shadow:0 10px 34px rgba(11,13,18,.18);border-radius:14px;\
padding:15px 18px;display:flex;gap:16px;align-items:center;flex-wrap:wrap;\
font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Helvetica Neue",Arial,sans-serif}\
.cc-banner p{margin:0;flex:1 1 240px;font-size:14px;line-height:1.5;color:#0b0d12}\
.cc-banner a{color:#F2542D;text-decoration:none}.cc-banner a:hover{text-decoration:underline}\
.cc-actions{display:flex;gap:10px;flex-shrink:0}\
.cc-banner button{border-radius:999px;padding:9px 18px;font-size:14px;font-weight:600;cursor:pointer;border:1px solid transparent;font-family:inherit}\
.cc-decline{background:transparent;border-color:#d6d9de;color:#0b0d12}\
.cc-accept{background:#F2542D;color:#fff}\
@media(max-width:520px){.cc-banner{flex-direction:column;align-items:stretch}.cc-actions{justify-content:flex-end}}';
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var bar = document.createElement('div');
    bar.className = 'cc-banner';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Cookie consent');
    bar.innerHTML =
      '<p>We use Google Analytics to measure site traffic. ' +
      'See our <a href="/privacy">Privacy Policy</a>.</p>' +
      '<div class="cc-actions">' +
      '<button class="cc-decline" type="button">Decline</button>' +
      '<button class="cc-accept" type="button">Accept</button>' +
      '</div>';
    document.body.appendChild(bar);

    bar.querySelector('.cc-accept').addEventListener('click', function () {
      remember('granted'); loadGA(); bar.remove();
    });
    bar.querySelector('.cc-decline').addEventListener('click', function () {
      remember('denied'); bar.remove();
    });
  }

  if (document.body) showBanner();
  else document.addEventListener('DOMContentLoaded', showBanner);
})();
