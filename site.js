/* Gold Outlook LK: shared script for home, calculator, karats and learn pages.
   1) header and footer  2) gold artwork (SVG)  3) scroll reveal  4) live prices (window.GoldData) */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- header and footer ---------- */
  var PAGES = [['index.html', 'home'], ['prices.html', 'prices'], ['calculator.html', 'calc'], ['karats.html', 'karat'], ['learn.html', 'learn']];
  var T = {
    en: { home: 'Home', prices: 'Live prices', calc: 'Calculator', karat: 'Karat guide', learn: 'Learn', tag: 'Gold prices for Sri Lanka, in plain language', pages: 'Pages', shops: 'Shops', shopnow: 'Shop prices today', post: 'Jewellers: post your price',
      fine: 'Prices are for information only and are not financial advice. Shop prices come from jewellers’ own rate pages and change through the day, so always confirm the price, the purity and the making charges with your jeweller before you buy or sell.' },
    si: { home: 'මුල් පිටුව', prices: 'සජීවී මිල', calc: 'ගණකය', karat: 'කැරට් මාර්ගෝපදේශය', learn: 'දැනගන්න', tag: 'ශ්‍රී ලංකාවේ රන් මිල, සරල භාෂාවෙන්', pages: 'පිටු', shops: 'වෙළඳසැල්', shopnow: 'අද වෙළඳසැල් මිල', post: 'ජුවලර්ස්: ඔබේ මිල පළ කරන්න',
      fine: 'මිල ගණන් තොරතුරු සඳහා පමණි, මූල්‍ය උපදෙස් නොවේ. වෙළඳසැල් මිල ජුවලර්වරුන්ගේ මිල පිටුවලින් ලබාගන්නා අතර දවස පුරා වෙනස් වේ. මිලදී ගැනීමට හෝ විකිණීමට පෙර මිල, සංශුද්ධතාව සහ මැදීමේ ගාස්තු ඔබේ ජුවලර්ගෙන් තහවුරු කරගන්න.' },
    ta: { home: 'முகப்பு', prices: 'நேரடி விலை', calc: 'கணிப்பான்', karat: 'காரட் வழிகாட்டி', learn: 'அறிய', tag: 'இலங்கைக்கான தங்க விலை, எளிய மொழியில்', pages: 'பக்கங்கள்', shops: 'கடைகள்', shopnow: 'இன்றைய கடை விலைகள்', post: 'நகைக்கடைக்காரர்கள்: உங்கள் விலையைப் பதிவிடுங்கள்',
      fine: 'விலைகள் தகவலுக்காக மட்டுமே, நிதி ஆலோசனை அல்ல. கடை விலைகள் நகைக்கடைகளின் சொந்த விலைப் பக்கங்களிலிருந்து எடுக்கப்படுகின்றன, நாள் முழுவதும் மாறும். வாங்கும் அல்லது விற்கும் முன் விலை, தூய்மை, செய்கூலி ஆகியவற்றை உங்கள் நகைக்கடையில் உறுதிப்படுத்துங்கள்.' }
  };
  var LANGS = [['en', 'EN'], ['si', 'සිං'], ['ta', 'தமி']];
  var lang = 'en';
  try { var sv = localStorage.getItem('gollk-lang'); if (sv && T[sv]) lang = sv; else { var nl = (navigator.language || '').slice(0, 2); if (T[nl]) lang = nl; } } catch (e) {}
  var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  function headerHTML() {
    return '<header class="site-header"><div class="container"><a class="logo" href="index.html"><i>Au</i>Gold Outlook LK</a>' +
      '<nav class="menu" aria-label="Main">' + PAGES.map(function (p) { return '<a href="' + p[0] + '"' + (p[0] === here ? ' class="on" aria-current="page"' : '') + '>' + T[lang][p[1]] + '</a>'; }).join('') + '</nav>' +
      '<div class="langs" role="group" aria-label="Language">' + LANGS.map(function (l) { return '<button type="button" data-lang="' + l[0] + '" aria-pressed="' + (l[0] === lang) + '">' + l[1] + '</button>'; }).join('') + '</div>' +
      '<button class="burger" type="button" aria-label="Menu" aria-expanded="false">☰</button></div></header>';
  }
  function footerHTML() {
    var x = T[lang];
    return '<footer class="site-footer"><div class="container"><div class="cols"><div><div class="logo" style="margin-bottom:10px"><i>Au</i>Gold Outlook LK</div><div>' + x.tag + '</div></div>' +
      '<div><b style="color:var(--cream)">' + x.pages + '</b><br>' + PAGES.map(function (p) { return '<a href="' + p[0] + '">' + x[p[1]] + '</a>'; }).join('<br>') + '</div>' +
      '<div><b style="color:var(--cream)">' + x.shops + '</b><br><a href="prices.html#shops">' + x.shopnow + '</a><br><a href="shop.html">' + x.post + '</a></div></div>' +
      '<p class="fine">' + x.fine + '</p></div></footer>';
  }
  var h = $('#site-header'), f = $('#site-footer');
  if (h) h.outerHTML = headerHTML();
  if (f) f.outerHTML = footerHTML();
  function wireHeader() {
    var bg = $('.burger'), mn = $('.menu');
    if (bg && mn) bg.addEventListener('click', function () { var o = mn.classList.toggle('open'); bg.setAttribute('aria-expanded', o); bg.textContent = o ? '✕' : '☰'; });
    var lg = $('.site-header .langs');
    if (lg) lg.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('button[data-lang]') : null; if (!b) return;
      setLang(b.getAttribute('data-lang'));
    });
  }
  /* Changing language: save it, redraw the bar and footer, and tell the page (window event "gollk-lang") so it can redraw its own text. */
  function setLang(l) {
    if (!T[l] || l === lang) return;
    lang = l; try { localStorage.setItem('gollk-lang', l); } catch (e) {}
    document.documentElement.lang = l;
    var hd = $('.site-header'), ft = $('.site-footer');
    if (hd) { var open = $('.menu', hd).classList.contains('open'); hd.outerHTML = headerHTML(); wireHeader(); if (open) { $('.menu').classList.add('open'); $('.burger').setAttribute('aria-expanded', true); $('.burger').textContent = '✕'; } }
    if (ft) ft.outerHTML = footerHTML();
    window.dispatchEvent(new CustomEvent('gollk-lang', { detail: { lang: l } }));
  }
  document.documentElement.lang = lang;
  wireHeader();

  /* ---------- gold artwork ---------- */
  var uid = 0;
  var DEFS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
    '<linearGradient id="gF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffeaa3"/><stop offset=".45" stop-color="#f0c04e"/><stop offset="1" stop-color="#b9801f"/></linearGradient>' +
    '<linearGradient id="gT" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffbe0"/><stop offset="1" stop-color="#f6d77a"/></linearGradient>' +
    '<linearGradient id="gS" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c18a22"/><stop offset="1" stop-color="#6f450a"/></linearGradient>' +
    '<radialGradient id="gC" cx=".3" cy=".25" r=".9"><stop offset="0" stop-color="#fff3c4"/><stop offset=".5" stop-color="#f0c04e"/><stop offset="1" stop-color="#9a6a14"/></radialGradient>' +
    '<linearGradient id="gH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a5a10"/><stop offset=".3" stop-color="#fff0b8"/><stop offset=".55" stop-color="#e8b84a"/><stop offset="1" stop-color="#8a5a10"/></linearGradient>' +
    '<linearGradient id="gR" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffc2cf"/><stop offset=".45" stop-color="#e0204a"/><stop offset="1" stop-color="#6f0a24"/></linearGradient>' +
    '<linearGradient id="gD" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#bfe9ff"/><stop offset="1" stop-color="#7aa8e8"/></linearGradient>' +
    '<linearGradient id="gW" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
    '</defs></svg>';
  document.body.insertAdjacentHTML('afterbegin', DEFS);

  function bar(x, y, w, hh, d, label) {
    var id = 'c' + (++uid), fr = 'M' + x + ',' + y + ' L' + (x + w) + ',' + y + ' L' + (x + w - 10) + ',' + (y + hh) + ' L' + (x + 10) + ',' + (y + hh) + ' Z';
    return '<clipPath id="' + id + '"><path d="' + fr + '"/></clipPath>' +
      '<path d="M' + (x + d) + ',' + (y - d * .6) + ' L' + (x + w + d) + ',' + (y - d * .6) + ' L' + (x + w) + ',' + y + ' L' + x + ',' + y + ' Z" fill="url(#gT)"/>' +
      '<path d="M' + (x + w) + ',' + y + ' L' + (x + w + d) + ',' + (y - d * .6) + ' L' + (x + w + d - 10) + ',' + (y + hh - d * .6) + ' L' + (x + w - 10) + ',' + (y + hh) + ' Z" fill="url(#gS)"/>' +
      '<path d="' + fr + '" fill="url(#gF)"/>' +
      '<g clip-path="url(#' + id + ')"><rect class="bar-shine" x="' + x + '" y="' + y + '" width="' + (w * .35) + '" height="' + hh + '" fill="url(#gW)" style="transform-box:fill-box"/></g>' +
      '<rect x="' + (x + w * .16) + '" y="' + (y + hh * .2) + '" width="' + (w * .68) + '" height="' + (hh * .6) + '" rx="6" fill="none" stroke="#8a5a10" stroke-opacity=".45"/>' +
      '<text x="' + (x + w / 2) + '" y="' + (y + hh * .52) + '" text-anchor="middle" font-family="Playfair Display,serif" font-weight="700" font-size="' + (hh * .27) + '" fill="#7a4d0c" fill-opacity=".85">' + label + '</text>' +
      '<text x="' + (x + w / 2) + '" y="' + (y + hh * .76) + '" text-anchor="middle" font-family="sans-serif" font-size="' + (hh * .13) + '" letter-spacing="2" fill="#7a4d0c" fill-opacity=".7">FINE GOLD 999.9</text>';
  }
  var ART = {
    bars: function () { return '<svg viewBox="0 0 450 330" role="img" aria-label="Stack of gold bars">' + '<ellipse cx="225" cy="318" rx="200" ry="10" fill="#000" opacity=".4"/>' + bar(28, 232, 170, 76, 26, '1 oz') + bar(228, 232, 170, 76, 26, '1 oz') + bar(125, 146, 180, 80, 28, '10 g') + '</svg>'; },
    coin: function () { return '<svg viewBox="0 0 100 100" role="img" aria-label="Gold coin"><circle cx="50" cy="50" r="48" fill="url(#gC)" stroke="#8a5a10" stroke-width="1.5"/><circle cx="50" cy="50" r="43" fill="none" stroke="#7a4d0c" stroke-opacity=".5" stroke-width="2.4" stroke-dasharray="1.6 2.6"/><circle cx="50" cy="50" r="35" fill="none" stroke="#fff3c4" stroke-opacity=".6" stroke-width="1.2"/><text x="50" y="61" text-anchor="middle" font-family="Playfair Display,serif" font-weight="800" font-size="34" fill="#7a4d0c" fill-opacity=".8">Au</text><path d="M18 30 Q30 14 52 12" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/></svg>'; },
    ring: function () { return '<svg viewBox="0 0 200 210" role="img" aria-label="Gold ring with a gem"><ellipse cx="100" cy="196" rx="70" ry="8" fill="#000" opacity=".35"/><circle cx="100" cy="132" r="56" fill="none" stroke="url(#gH)" stroke-width="13"/><circle cx="100" cy="132" r="49" fill="none" stroke="#6f450a" stroke-opacity=".5" stroke-width="2"/><path d="M82 86 L100 70 L118 86 Z" fill="url(#gF)"/><polygon points="76,50 124,50 138,32 100,10 62,32" fill="url(#gD)" stroke="#fff" stroke-opacity=".8" stroke-width="1"/><polygon points="62,32 76,50 100,32" fill="#fff" fill-opacity=".45"/><polygon points="138,32 124,50 100,32" fill="#7aa8e8" fill-opacity=".5"/><polygon points="76,50 124,50 100,32" fill="#bfe9ff" fill-opacity=".7"/><path d="M64 110 Q60 140 78 170" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/></svg>'; },
    necklace: function () { return '<svg viewBox="0 0 300 230" role="img" aria-label="Gold necklace with a ruby pendant"><path d="M22 14 Q150 236 278 14" fill="none" stroke="#6f450a" stroke-width="7" stroke-linecap="round" stroke-dasharray="7 3" opacity=".6"/><path d="M22 12 Q150 234 278 12" fill="none" stroke="url(#gH)" stroke-width="6" stroke-linecap="round" stroke-dasharray="7 3"/><circle cx="150" cy="124" r="6" fill="url(#gC)"/><path d="M150 132 C 120 160, 128 196, 150 206 C 172 196, 180 160, 150 132 Z" fill="url(#gF)" stroke="#8a5a10" stroke-width="1.5"/><path d="M150 148 C 134 166, 138 188, 150 194 C 162 188, 166 166, 150 148 Z" fill="url(#gR)"/><path d="M143 162 Q142 174 147 182" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round"/></svg>'; },
    bangle: function () { return '<svg viewBox="0 0 240 200" role="img" aria-label="Gold bangle"><ellipse cx="120" cy="186" rx="86" ry="8" fill="#000" opacity=".35"/><ellipse cx="120" cy="96" rx="100" ry="76" fill="none" stroke="url(#gH)" stroke-width="20"/><ellipse cx="120" cy="96" rx="100" ry="76" fill="none" stroke="#6f450a" stroke-opacity=".55" stroke-width="20" stroke-dasharray="2 9"/><ellipse cx="120" cy="96" rx="89" ry="65" fill="none" stroke="#fff3c4" stroke-opacity=".55" stroke-width="1.6"/><path d="M40 70 Q60 28 120 22" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="3.2" stroke-linecap="round"/></svg>'; }
  };
  function enhance(root) {
    root = root || document;
    $$('[data-art]', root).forEach(function (el) { if (el.firstChild) return; var a = ART[el.getAttribute('data-art')]; if (a) el.innerHTML = a(); });
    /* sparkles: <div class="sparkles" data-n="14"> */
    $$('.sparkles', root).forEach(function (el) {
      if (el.firstChild) return;
      var n = +el.getAttribute('data-n') || 12, s = '';
      for (var i = 0; i < n; i++) s += '<i style="left:' + (Math.random() * 96).toFixed(1) + '%;top:' + (Math.random() * 96).toFixed(1) + '%;animation-delay:' + (-Math.random() * 4).toFixed(2) + 's;animation-duration:' + (3 + Math.random() * 3).toFixed(1) + 's;transform:scale(' + (0.6 + Math.random()).toFixed(2) + ')"></i>';
      el.innerHTML = s;
    });
    /* photo slots: <figure class="photo"><div class="art" data-art="ring"></div><img data-src="images/x.jpg"> ...
       The image is only added if the file exists, so the drawn art shows until you add a real photo. */
    $$('.photo img[data-src]', root).forEach(function (im) {
      var t = new Image(); t.onload = function () { im.src = im.getAttribute('data-src'); im.alt = im.getAttribute('data-alt') || im.alt || ''; im.style.opacity = 1; var a = im.parentNode.querySelector('.art'); if (a) a.style.opacity = 0; }; t.onerror = function () { im.remove(); }; t.src = im.getAttribute('data-src');
    });
    /* scroll reveal */
    var rv = $$('.reveal:not(.in)', root);
    if ('IntersectionObserver' in window && !reduce) {
      if (!enhance.io) enhance.io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); enhance.io.unobserve(e.target); } }); }, { threshold: .15, rootMargin: '0px 0px -6% 0px' });
      rv.forEach(function (el) { enhance.io.observe(el); });
    } else rv.forEach(function (el) { el.classList.add('in'); });
    /* tilt on hover: <div data-tilt> */
    if (!reduce) $$('[data-tilt]', root).forEach(function (el) {
      if (el._tilt) return; el._tilt = 1;
      el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; el.style.transform = 'perspective(800px) rotateY(' + (x * 9).toFixed(2) + 'deg) rotateX(' + (-y * 9).toFixed(2) + 'deg) translateY(-4px)'; });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  enhance(document);
  var par = $$('[data-par]');
  if (par.length && !reduce) {
    var tick = false;
    window.addEventListener('scroll', function () { if (tick) return; tick = true; requestAnimationFrame(function () { var y = window.scrollY; par.forEach(function (el) { el.style.transform = 'translateY(' + (y * parseFloat(el.getAttribute('data-par'))).toFixed(1) + 'px)'; }); tick = false; }); }, { passive: true });
  }
  /* ---------- number helpers ---------- */
  var nf = function (v, d) { return Number(v).toLocaleString('en-US', { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 }); };
  var rs = function (v) { return 'Rs ' + nf(v, 0); };
  function ageText(d) { var m = Math.max(0, Math.round((Date.now() - d.getTime()) / 60000)); return m < 60 ? m + ' min' : m < 2880 ? Math.floor(m / 60) + ' h' : Math.floor(m / 1440) + ' days'; }
  /* animate a number up or down: set(el, 327928, rs) */
  function setNum(el, to, fmt) {
    if (!el) return; fmt = fmt || nf;
    if (!(to >= 0)) { el.textContent = '-'; el._v = undefined; return; }
    var from = el._v === undefined ? 0 : el._v; el._v = to;
    if (reduce || from === to) { el.textContent = fmt(to); return; }
    var t0 = performance.now(), dur = 1100; cancelAnimationFrame(el._raf);
    (function step(t) { var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(from + (to - from) * e); if (p < 1) el._raf = requestAnimationFrame(step); })(t0);
  }

  /* ---------- live prices ----------
     Same sources as the main site: the live Worker (LIVE_URL in config.js) first, then data/latest.json and data/retail.json. */
  var KG = 31.1035, KARATS = [24, 22, 21, 18], subs = [], last = null, busy = false;
  var CFG = window.GOLD_CONFIG || {};
  function getJSON(u, ms) {
    var ctl = window.AbortController ? new AbortController() : null, to = setTimeout(function () { if (ctl) ctl.abort(); }, ms || 8000);
    return fetch(u, { cache: 'no-store', signal: ctl ? ctl.signal : undefined }).then(function (r) { clearTimeout(to); return r.ok ? r.json() : Promise.reject(); });
  }
  function build(j, retail, isLive) {
    var spot = parseFloat(j.gold_usd_oz), fx = parseFloat(j.usdlkr), up = new Date(j.updated);
    if (!(spot > 0 && fx > 0) || isNaN(up.getTime())) return null;
    var d = { spot: spot, fx: fx, updated: up, live: isLive, checked: Date.now(), retail: null, sells: {}, buys: {}, estSell: {}, estBuy: {}, hasRetail: false };
    d.world = function (k) { return k / 24 * spot / KG * fx; };            /* LKR per gram of k-karat gold at the world price */
    d.worldSov = function (k) { return d.world(k) * 8; };
    var src = retail && retail.sources || [], s = src.filter(function (x) { return x.primary; })[0] || src[0];
    var s22 = s && parseFloat(s.sell_22k_sovereign), b22 = s && parseFloat(s.buy_22k_sovereign), at = s && new Date(s.at);
    if (s22 > 0) {
      d.hasRetail = true; d.retail = { name: s.name || 'Ran Lanka', url: s.url || '', at: at };
      KARATS.forEach(function (k) {
        var sv = parseFloat(s['sell_' + k + 'k_sovereign']), bv = parseFloat(s['buy_' + k + 'k_sovereign']);
        if (k === 22) { sv = s22; bv = b22; }
        if (!(sv > 0)) { sv = s22 * k / 22; d.estSell[k] = true; }
        if (!(bv > 0) && b22 > 0) { bv = Math.round(sv * b22 / s22 / 100) * 100; d.estBuy[k] = true; }
        d.sells[k] = sv; d.buys[k] = bv > 0 ? bv : 0;
      });
    }
    return d;
  }
  function publish(d) { last = d; GoldData.d = d; subs.forEach(function (fn) { try { fn(d); } catch (e) { if (window.console) console.error(e); } }); }
  function load() {
    if (busy || document.hidden) return; busy = true;
    var done = function () { busy = false; };
    var fallback = function () {
      return Promise.all([getJSON('data/latest.json'), getJSON('data/retail.json').catch(function () { return null; })]).then(function (r) { var d = build(r[0], r[1], false); if (d) publish(d); });
    };
    var p = CFG.LIVE_URL ? getJSON(CFG.LIVE_URL + (CFG.LIVE_URL.indexOf('?') > -1 ? '&' : '?') + '_=' + Date.now()).then(function (j) {
      var rt = j.retail && j.retail.sources && j.retail.sources.length ? Promise.resolve(j.retail) : getJSON('data/retail.json').catch(function () { return null; });
      return rt.then(function (r) { var d = build(j, r, true); if (!d) return Promise.reject(); publish(d); });
    }).catch(fallback) : fallback();
    p.catch(function () {}).then(done, done);
  }
  var GoldData = window.GoldData = {
    d: null, enhance: enhance, nf: nf, rs: rs, ageText: ageText, setNum: setNum, KARATS: KARATS, reduce: reduce,
    on: function (fn) { subs.push(fn); if (last) fn(last); },
    start: function () { load(); setInterval(load, Math.max(10, CFG.LIVE_EVERY_SECONDS || 15) * 1000 * 2); }
  };
  /* Everything with data-live-start in <body> begins loading prices right away. */
  if (document.body.hasAttribute('data-live')) GoldData.start();
  document.addEventListener('visibilitychange', function () { if (!document.hidden) load(); });
})();
