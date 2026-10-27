/* BomVizinho — "Engenharia em cada detalhe": vista explodida sincronizada com a rolagem.
   As peças são recortes reais de uma foto de estúdio (assets/engenharia/*.webp) movidos por transform;
   não é um modelo 3D. Sem dependências externas. Respeita prefers-reduced-motion. */
(function () {
  "use strict";
  var sec = document.getElementById("engenharia");
  if (!sec) return;
  var frame = sec.querySelector(".eng-frame"),
    scene = sec.querySelector(".eng-scene"),
    cam = sec.querySelector(".eng-cam"),
    floor = sec.querySelector(".eng-floor"),
    prog = sec.querySelector(".eng-prog i"),
    legend = sec.querySelector(".eng-legend"),
    steps = [].slice.call(sec.querySelectorAll(".eng-steps li")),
    header = document.querySelector("header"),
    bar = document.querySelector(".bar");

  /* r = [x, y, largura, altura] da peça na imagem original (820x590);
     o = deslocamento da vista explodida; d = atraso de saída (escalonamento);
     a = ponto de ancoragem do rótulo */
  var PARTS = {
    carcaca: { r: [433, 19, 350, 262], o: [40, -48], d: 0.0, a: [660, 30] },
    anel: { r: [400, 19, 147, 150], o: [-62, 0], d: 0.06, a: [472, 24] },
    empunhadura: { r: [546, 168, 210, 250], o: [24, 74], d: 0.06, a: [560, 330] },
    mandril: { r: [239, 36, 161, 130], o: [-165, 0], d: 0.12, a: [320, 40] },
    bateria: { r: [399, 410, 346, 154], o: [24, 176], d: 0.14, a: [412, 520] },
    broca: { r: [29, 72, 223, 49], o: [-285, -12], d: 0.18, a: [130, 78] }
  };
  var NAMES = Object.keys(PARTS), SW = 820, SH = 590;
  NAMES.forEach(function (n) {
    var P = PARTS[n];
    P.el = sec.querySelector('.eng-part[data-part="' + n + '"]');
    P.lab = sec.querySelector('.eng-lab[data-part="' + n + '"]');
  });

  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var STATIC_P = 0.5; /* composição estática (vista explodida completa) */
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var smooth = function (t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  var ease = function (t) { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  /* cronograma da desmontagem: 0 = montada, 1 = totalmente explodida */
  function E(p) {
    if (p < 0.19) return 0;
    if (p < 0.5) return ease((p - 0.19) / 0.31);
    if (p < 0.68) return 1;
    if (p < 0.92) return 1 - ease((p - 0.68) / 0.24);
    return 0;
  }
  function Ei(p, d) { return ease((E(p) - d) / (1 - d)); }

  var fw = 0, fh = 0, sw = 0, u = 1, ex = 1, keys = [], ready = false, lastP = -1, raf = 0, live = false;

  function partBox(n, p) {
    var P = PARTS[n], e = Ei(p, P.d) * ex;
    return [P.r[0] + P.o[0] * e, P.r[1] + P.o[1] * e, P.r[0] + P.r[2] + P.o[0] * e, P.r[1] + P.r[3] + P.o[1] * e];
  }
  function groupBox(names, p) {
    var b = [1e9, 1e9, -1e9, -1e9];
    names.forEach(function (n) {
      var q = partBox(n, p);
      b[0] = Math.min(b[0], q[0]); b[1] = Math.min(b[1], q[1]); b[2] = Math.max(b[2], q[2]); b[3] = Math.max(b[3], q[3]);
    });
    return b;
  }
  function fit(b, fill, max) {
    var s = Math.min((fill * fw) / ((b[2] - b[0]) * u), (fill * fh) / ((b[3] - b[1]) * u));
    return Math.min(s, max || 9);
  }
  function key(p, spec) {
    if (spec.S) return { p: p, S: spec.S, x: spec.f[0], y: spec.f[1] };
    var names = spec.g || NAMES, b = groupBox(names, p);
    if (!spec.g) b[1] -= 50; /* folga no topo para os rótulos */
    return { p: p, S: fit(b, spec.fill || 0.9, spec.max || 2.3), x: (b[0] + b[2]) / 2, y: (b[1] + b[3]) / 2 };
  }
  function build() {
    var rf = frame.getBoundingClientRect();
    fw = rf.width; fh = rf.height;
    if (!fw || !fh) return false;
    NAMES.forEach(function (n) { var t = PARTS[n].lab && PARTS[n].lab.querySelector(".t"); PARTS[n].tw = t ? t.offsetWidth : 0; });
    sw = Math.min(0.94 * fw, 0.9 * fh * SW / SH); scene.style.width = sw.toFixed(1) + "px"; u = sw / SW;
    ex = clamp(fw / 900, 0.55, 1);
    keys = [
      key(0.0, { S: 1, f: [410, 295] }),
      key(0.08, { S: 1.9, f: [335, 100] }),
      key(0.155, { S: 1.7, f: [520, 200] }),
      key(0.3, { fill: 0.86 }),
      key(0.5, { fill: 0.86 }),
      key(0.565, { g: ["broca", "mandril", "anel"], fill: 0.84 }),
      key(0.625, { g: ["carcaca"], fill: 0.78 }),
      key(0.67, { g: ["empunhadura", "bateria"], fill: 0.82 }),
      key(0.74, { fill: 0.86 }),
      key(0.92, { S: 1, f: [410, 295] }),
      key(1.0, { S: 1.05, f: [410, 295] })
    ];
    return true;
  }
  function camAt(p) {
    var i = 0;
    while (i < keys.length - 2 && p > keys[i + 1].p) i++;
    var a = keys[i], b = keys[i + 1], t = clamp((p - a.p) / (b.p - a.p), 0, 1);
    t = 0.35 * t + 0.65 * smooth(t);
    return { S: a.S + (b.S - a.S) * t, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  }

  var lastStep = -1;
  function render(p) {
    if (!ready) return;
    var c = camAt(p), S = c.S, tx = sw / 2 - S * c.x * u, ty = (sw * SH / SW) / 2 - S * c.y * u;
    cam.style.transform = "translate3d(" + tx.toFixed(2) + "px," + ty.toFixed(2) + "px,0) scale(" + S.toFixed(4) + ")";
    var sh = sw * SH / SW, ox = (fw - sw) / 2, oy = (fh - sh) / 2, e = E(p), fl = 0;
    NAMES.forEach(function (n) {
      var P = PARTS[n], ei = Ei(p, P.d) * ex;
      if (P.el) P.el.style.transform = "translate3d(" + (P.o[0] * ei * u).toFixed(2) + "px," + (P.o[1] * ei * u).toFixed(2) + "px,0)";
      if (P.lab) {
        var X = ox + tx + S * (P.a[0] + P.o[0] * ei) * u, Y = oy + ty + S * (P.a[1] + P.o[1] * ei) * u;
        var vis = smooth((e - 0.88) / 0.12);
        P.lab.style.transform = "translate3d(" + X.toFixed(1) + "px," + Y.toFixed(1) + "px,0)";
        var tw = P.tw || 0;
        P.lab.style.setProperty("--sx", Math.max(0, X + tw / 2 + 12 - fw).toFixed(1) + "px");
        P.lab.style.opacity = X < 8 || X > fw - 8 || Y < 8 || Y > fh - 8 ? 0 : vis.toFixed(3);
      }
    });
    if (floor) floor.style.transform = "translateX(" + (e * 24 * u).toFixed(1) + "px) scale(" + (1 + 0.5 * e).toFixed(3) + "," + (1 + 0.15 * e).toFixed(3) + ")", floor.style.opacity = (1 - 0.45 * e).toFixed(3);
    if (legend) legend.style.opacity = smooth((e - 0.88) / 0.12).toFixed(3);
    if (prog) prog.style.transform = "scaleX(" + clamp(p, 0, 1).toFixed(4) + ")";
    var st = p < 0.04 || p >= 0.92 && p < 0.99 ? (p < 0.04 ? 0 : 3) : p < 0.19 ? 1 : p < 0.68 ? 2 : 3;
    if (p >= 0.99) st = 0;
    if (st !== lastStep) { lastStep = st; steps.forEach(function (li, i) { li.classList.toggle("on", i === st); }); }
  }

  /* offsets de empilhamento: o cabeçalho é "sticky" e a barra inferior é fixa no celular */
  var lastTop = -1, lastBot = -1;
  function measure() {
    var top = header ? Math.round(header.getBoundingClientRect().height) : 0, bot = 0;
    if (bar && getComputedStyle(bar).display !== "none") bot = Math.round(bar.getBoundingClientRect().height);
    if (top !== lastTop) { sec.style.setProperty("--eng-top", top + "px"); lastTop = top; }
    if (bot !== lastBot) { sec.style.setProperty("--eng-bot", bot + "px"); lastBot = bot; }
  }
  function progress() {
    var r = sec.getBoundingClientRect(), st = sec.querySelector(".eng-sticky").getBoundingClientRect().height,
      total = sec.offsetHeight - st;
    if (total <= 0) return 0;
    return clamp((lastTop - r.top) / total, 0, 1);
  }
  function tick() {
    raf = 0;
    var r = sec.getBoundingClientRect(), vh = innerHeight;
    if (r.bottom < -200 || r.top > vh + 200) return; /* fora da tela: não trabalha */
    measure();
    var p = progress();
    if (Math.abs(p - lastP) < 0.0004) return;
    lastP = p; render(p);
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(tick); }
  function relayout() {
    measure();
    if (build()) { ready = true; lastP = -1; reduce ? render(STATIC_P) : schedule(); }
  }

  /* carregamento sob demanda: só baixa as peças quando a seção se aproxima da tela */
  function load() {
    if (live) return; live = true;
    var imgs = NAMES.map(function (n) { return PARTS[n].el; }).filter(Boolean);
    Promise.all(imgs.map(function (im) {
      return new Promise(function (ok, no) {
        im.onload = function () { ok(); }; im.onerror = no; im.src = im.getAttribute("data-src");
      });
    })).then(function () {
      sec.classList.add("eng-live");
      relayout();
    }).catch(function () { /* se algo falhar, o pôster estático continua visível */
      sec.classList.remove("eng-scroll"); sec.style.removeProperty("--eng-track");
    });
  }

  if (!reduce) {
    sec.classList.add("eng-scroll");
    var small = matchMedia("(max-width: 900px)").matches;
    sec.style.setProperty("--eng-track", small ? "190vh" : "240vh");
    addEventListener("scroll", schedule, { passive: true });
  }
  addEventListener("resize", function () {
    if (!reduce) sec.style.setProperty("--eng-track", matchMedia("(max-width: 900px)").matches ? "190vh" : "240vh");
    if (live) relayout();
  });
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); load(); }
    }, { rootMargin: "700px 0px" });
    io.observe(sec);
  } else load();
})();
