/* Premium hero: builds the animated gold scene, loads real photo/video if present, adds dust + mouse parallax */
(function () {
  var stage = document.querySelector('.stage.pro'); if (!stage) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- richly shaded gold bar (brushed metal, bevel, grain, hallmark) ---- */
  var n = 0;
  function bar(x, y, w, h, d, label, cls) {
    var id = 'hb' + (++n), sk = 14;
    var front = 'M' + x + ',' + y + ' L' + (x + w) + ',' + y + ' L' + (x + w - sk) + ',' + (y + h) + ' L' + (x + sk) + ',' + (y + h) + ' Z';
    var top = 'M' + (x + d) + ',' + (y - d * .55) + ' L' + (x + w + d) + ',' + (y - d * .55) + ' L' + (x + w) + ',' + y + ' L' + x + ',' + y + ' Z';
    var side = 'M' + (x + w) + ',' + y + ' L' + (x + w + d) + ',' + (y - d * .55) + ' L' + (x + w + d - sk) + ',' + (y + h - d * .55) + ' L' + (x + w - sk) + ',' + (y + h) + ' Z';
    return '<g class="' + cls + '">' +
      '<path d="' + top + '" fill="url(#hTop)"/><path d="' + top + '" filter="url(#hGrain)" opacity=".35"/>' +
      '<path d="' + side + '" fill="url(#hSide)"/><path d="' + side + '" filter="url(#hGrain)" opacity=".3"/>' +
      '<path d="' + front + '" fill="url(#hFront)"/><path d="' + front + '" filter="url(#hBrush)" opacity=".4"/>' +
      '<path d="' + front + '" fill="none" stroke="#fff6cf" stroke-opacity=".75" stroke-width="1.4"/>' +
      '<path d="M' + x + ',' + (y + 1) + ' L' + (x + w) + ',' + (y + 1) + '" stroke="#fffdf0" stroke-width="2" stroke-opacity=".9"/>' +
      '<clipPath id="' + id + '"><path d="' + front + '"/></clipPath>' +
      '<g clip-path="url(#' + id + ')"><rect class="bar-shine" x="' + x + '" y="' + y + '" width="' + w * .3 + '" height="' + h + '" fill="url(#hShine)" style="transform-box:fill-box" transform="skewX(-18)"/></g>' +
      '<rect x="' + (x + w * .17) + '" y="' + (y + h * .2) + '" width="' + w * .66 + '" height="' + h * .6 + '" rx="5" fill="rgba(90,52,6,.12)" stroke="#7a4d0c" stroke-opacity=".6" stroke-width="1.2"/>' +
      '<text x="' + (x + w / 2) + '" y="' + (y + h * .5) + '" text-anchor="middle" font-family="Playfair Display,serif" font-weight="800" font-size="' + h * .27 + '" fill="#6a4008" style="paint-order:stroke" stroke="#fff3c4" stroke-opacity=".55" stroke-width=".8">' + label + '</text>' +
      '<text x="' + (x + w / 2) + '" y="' + (y + h * .72) + '" text-anchor="middle" font-family="sans-serif" font-weight="600" font-size="' + h * .115 + '" letter-spacing="2.2" fill="#6a4008" fill-opacity=".85">FINE GOLD 999.9</text></g>';
  }
  var DEFS = '<defs>' +
    '<linearGradient id="hFront" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff4be"/><stop offset=".22" stop-color="#ffd966"/><stop offset=".5" stop-color="#e7aa2c"/><stop offset=".72" stop-color="#ffd569"/><stop offset="1" stop-color="#a8700f"/></linearGradient>' +
    '<linearGradient id="hTop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#fff0b0"/><stop offset="1" stop-color="#f2cc66"/></linearGradient>' +
    '<linearGradient id="hSide" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9992a"/><stop offset=".6" stop-color="#9a6410"/><stop offset="1" stop-color="#5e3a06"/></linearGradient>' +
    '<linearGradient id="hShine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
    '<filter id="hGrain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .45  0 0 0 0 .27  0 0 0 0 .03  0 0 0 .9 -.2"/><feComposite in2="SourceAlpha" operator="in"/></filter>' +
    '<filter id="hBrush" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".004 .9" numOctaves="2" seed="9"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 .93  0 0 0 0 .62  0 0 0 1.2 -.35"/><feComposite in2="SourceAlpha" operator="in"/></filter>' +
    '</defs>';
  function stack() {
    return DEFS + bar(26, 238, 176, 80, 28, '1 oz', 'bar1') + bar(236, 238, 176, 80, 28, '1 oz', 'bar2') + bar(128, 148, 186, 84, 30, '10 g', 'bar3');
  }
  var svgOpen = '<svg viewBox="0 0 470 340" role="img" aria-label="Stack of fine gold bars">';

  /* ---- scene markup ---- */
  var chip = stage.querySelector('.chip'); if (chip) chip.parentNode.removeChild(chip);
  stage.innerHTML = '<div class="glow"></div><div class="rays"></div>' +
    '<div class="media" id="hero-media"></div>' +
    '<div class="scene"><div class="floor"></div>' +
    '<div class="reflect">' + svgOpen + stack().replace(/id="(h[A-Za-z0-9]+)"/g, 'id="r$1"').replace(/#(h[A-Za-z0-9]+)/g, '#r$1').replace(/(hTop|hSide|hFront|hShine|hGrain|hBrush)/g, '$1') + '</svg></div>' +
    '<div class="stack">' + svgOpen + stack() + '</svg></div>' +
    ['c1', 'c2', 'c3'].map(function (c) { return '<div class="coinwrap ' + c + '"><div class="coin3d"><div class="face"><b>Au</b></div><div class="face back"><b>999.9</b></div><div class="edge"></div></div></div>'; }).join('') +
    '</div><canvas class="dust" aria-hidden="true"></canvas>';
  if (chip) stage.appendChild(chip);

  /* ---- real video / photo (used automatically if the file exists) ---- */
  var holder = stage.querySelector('#hero-media');
  function useVideo(src, poster) {
    var v = document.createElement('video');
    v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true; v.preload = 'auto'; v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    if (poster) v.poster = poster;
    v.addEventListener('canplay', function () { holder.insertBefore(v, holder.firstChild); holder.insertAdjacentHTML('beforeend', '<div class="sweep"></div>'); holder.classList.add('on'); v.play().catch(function () {}); }, { once: true });
    v.addEventListener('error', function () { usePhoto('images/hero.jpg'); }, { once: true });
    v.src = src;
  }
  function usePhoto(src) {
    var im = new Image();
    im.onload = function () { holder.innerHTML = ''; holder.appendChild(im); holder.insertAdjacentHTML('beforeend', '<div class="sweep"></div>'); holder.classList.add('on'); };
    im.alt = 'Gold bars and coins'; im.src = src;
  }
  var saveData = navigator.connection && navigator.connection.saveData;
  if (!reduce && !saveData) useVideo('images/hero.mp4', 'images/hero.jpg'); else usePhoto('images/hero.jpg');

  /* ---- floating gold dust ---- */
  var cv = stage.querySelector('canvas.dust'), cx = cv.getContext('2d'), P = [], W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1), raf;
  function size() { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function mk(init) { return { x: Math.random() * W, y: init ? Math.random() * H : H + 10, r: .6 + Math.random() * 2.2, vy: .15 + Math.random() * .5, vx: (Math.random() - .5) * .25, a: Math.random() * 6.28, s: .01 + Math.random() * .03, t: Math.random() * 6.28 }; }
  function init() { size(); P = []; for (var i = 0; i < 46; i++) P.push(mk(true)); }
  function frame() {
    cx.clearRect(0, 0, W, H);
    for (var i = 0; i < P.length; i++) {
      var p = P[i]; p.y -= p.vy; p.x += p.vx + Math.sin(p.a) * .25; p.a += p.s; p.t += .05;
      if (p.y < -10) P[i] = mk(false);
      var tw = .35 + .65 * Math.abs(Math.sin(p.t)), g = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      g.addColorStop(0, 'rgba(255,240,180,' + (.95 * tw) + ')'); g.addColorStop(.35, 'rgba(240,192,78,' + (.5 * tw) + ')'); g.addColorStop(1, 'rgba(240,192,78,0)');
      cx.fillStyle = g; cx.beginPath(); cx.arc(p.x, p.y, p.r * 4, 0, 6.283); cx.fill();
    }
    raf = requestAnimationFrame(frame);
  }
  init();
  if (!reduce) {
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { if (es[0].isIntersecting) { if (!raf) frame(); } else { cancelAnimationFrame(raf); raf = 0; } }).observe(stage); else frame();
  }
  window.addEventListener('resize', init);

  /* ---- mouse parallax ---- */
  if (!reduce && window.matchMedia('(hover:hover)').matches) {
    var st = stage.querySelector('.stack');
    stage.addEventListener('mousemove', function (e) {
      var r = stage.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      st.style.setProperty('--px', (x * -14).toFixed(1) + 'px'); st.style.setProperty('--py', (y * -10).toFixed(1) + 'px');
      stage.style.transform = 'rotateY(' + (x * 6).toFixed(2) + 'deg) rotateX(' + (y * -5).toFixed(2) + 'deg)';
    });
    stage.addEventListener('mouseleave', function () { stage.style.transform = ''; st.style.setProperty('--px', '0px'); st.style.setProperty('--py', '0px'); });
    stage.style.transition = 'transform .4s ease-out';
  }
})();
