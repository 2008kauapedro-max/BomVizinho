/* ROMMO — catálogo: abertura, capa que encolhe, vitrines, lista e pedido pelo WhatsApp */
(() => {
"use strict";
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const brl = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
const linhaDe = cat => LINHAS.find(l => l.cats.includes(cat)) || LINHAS[1];
const foto = p => p.img || `assets/produtos/${p.id}.webp`;
const porId = id => PRODUTOS.find(p => p.id === Number(id));
const desconto = p => p.de && p.de > p.p ? Math.round((1 - p.p / p.de) * 100) : 0;
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const sessao = {
  get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch {} },
};

/* ---------- WhatsApp ---------- */
const zapUrl = txt => `https://wa.me/${LOJA.whatsapp}?text=${encodeURIComponent(txt)}`;
function abrirZap(txt) {
  const url = zapUrl(txt);
  const w = window.open(url, "_blank", "noopener");
  if (!w) location.href = url;
}
const MSG = {
  geral: () => "Olá, ROMMO! Vim pelo catálogo e quero atendimento.",
  busca: () => `Olá, ROMMO! Procurei no catálogo por "${$("#busca").value.trim()}" e não encontrei. Vocês têm?`,
  oferta: () => "Olá, ROMMO! Vi as ofertas da semana no catálogo e quero saber mais.",
  produto: (p, q) => `Olá, ROMMO! Quero este produto do catálogo:\n\n*${p.nome}*\nQuantidade: ${q}\nPreço: ${brl(p.p)} cada\n\nPode confirmar se tem disponível?`,
  lista: itens => {
    const linhas = itens.map(({ p, q }) => `• ${q}x ${p.nome} — ${brl(p.p * q)}`);
    const total = itens.reduce((s, { p, q }) => s + p.p * q, 0);
    return `Olá, ROMMO! Montei esta lista no catálogo:\n\n${linhas.join("\n")}\n\n*Total aproximado: ${brl(total)}*\n\nPode confirmar disponibilidade e entrega?`;
  },
};

/* ---------- Cartões ---------- */
const selo = p => desconto(p) ? `<span class="selo-desc">-${desconto(p)}%</span>` : p.novo ? `<span class="selo-novo">Novo</span>` : "";
const mini = p => `<button class="mini" type="button" data-prod="${p.id}">
  <span class="foto"><img src="${foto(p)}" alt="" loading="lazy" decoding="async" width="520" height="520">${selo(p)}</span>
  <span class="nome">${esc(p.nome)}</span>
  ${p.de ? `<span class="de">${brl(p.de)}</span>` : ""}<span class="preco">${brl(p.p)}</span>
</button>`;
const card = p => {
  const l = linhaDe(p.cat);
  return `<article class="card" style="--c:${l.cor}">
  <button type="button" data-prod="${p.id}" aria-label="${esc(p.nome)}">
    <span class="foto"><img src="${foto(p)}" alt="" loading="lazy" decoding="async" width="520" height="520">${selo(p)}<span class="faixa"></span></span>
    <span class="nome">${esc(p.nome)}</span>
    <span class="valores"><span class="preco">${brl(p.p)}</span>${p.de ? `<span class="de">${brl(p.de)}</span>` : ""}</span>
  </button>
  <button class="pedir" type="button" data-pedir="${p.id}"><svg viewBox="0 0 24 24"><use href="#i-zap"/></svg>Pedir</button>
</article>`;
};

/* ---------- Seções ---------- */
function montar() {
  const conta = id => PRODUTOS.filter(p => linhaDe(p.cat).id === id).length;
  $("#linhas-grid").innerHTML = LINHAS.map(l => `<button class="linha" type="button" data-linha="${l.id}" style="--c:${l.cor};--k:${l.tinta}">
    <img src="${l.icone}" alt="" width="64" height="64"><span class="qtd">${conta(l.id)} ${conta(l.id) === 1 ? "item" : "itens"}</span>
    <span><b>${l.nome}</b><small>${l.frase}</small></span></button>`).join("");

  const ofertas = PRODUTOS.filter(desconto).sort((a, b) => desconto(b) - desconto(a));
  $("#trilho-ofertas").innerHTML = ofertas.map(mini).join("");
  const procurados = PRODUTOS.filter(p => p.destaque && !p.de).concat(PRODUTOS.filter(p => p.novo && !p.destaque));
  $("#trilho-procurados").innerHTML = procurados.map(mini).join("");

  $("#vitrines").innerHTML = LINHAS.filter(l => l.id !== "agro").map(l => `<button class="vitrine" type="button" data-linha="${l.id}" style="--c:${l.cor};background-image:url('${l.foto}')">
    <div><b>${l.nome}</b><span>Ver ${conta(l.id)} produtos</span></div></button>`).join("");

  $("#chips").innerHTML = `<button class="chip on" type="button" role="tab" aria-selected="true" data-filtro="todas">Tudo</button>` +
    LINHAS.map(l => `<button class="chip" type="button" role="tab" aria-selected="false" data-filtro="${l.id}" style="--c:${l.cor}"><i></i>${l.nome}</button>`).join("");

  const ig = `https://www.instagram.com/${LOJA.instagram}/`;
  ["#topo-insta", "#at-insta", "#insta-link"].forEach(s => { $(s).href = ig; });
  $("#insta-link").textContent = "@" + LOJA.instagram;
  const posts = INSTAGRAM_POSTS.length ? INSTAGRAM_POSTS.slice(0, 6) : [
    { img: "assets/fotos/ferramentas.webp", link: ig }, { img: "assets/produtos/12.webp", link: ig, branco: 1 },
    { img: "assets/fotos/irrigacao-campo.webp", link: ig }, { img: "assets/produtos/2.webp", link: ig, branco: 1 },
    { img: "assets/fotos/linha-eletrica.webp", link: ig }, { img: "assets/produtos/11.webp", link: ig, branco: 1 }];
  $("#insta-grade").innerHTML = posts.map(p => `<a href="${esc(p.link)}" target="_blank" rel="noopener" class="${p.branco ? "branco" : ""}" aria-label="Abrir no Instagram"><img src="${esc(p.img)}" alt="" loading="lazy" decoding="async"></a>`).join("");

  $("#at-mapa").href = LOJA.mapa; $("#at-cidade").innerHTML = esc(LOJA.cidade) + (LOJA.referencia ? `<small>${esc(LOJA.referencia)}</small>` : "");
  if (LOJA.slogan) $("#at-texto").textContent = `${LOJA.slogan} Tire dúvidas, peça orçamento e combine a entrega pelo WhatsApp.`;
  $("#at-tel").href = "tel:+" + LOJA.whatsapp; $("#at-num").textContent = LOJA.whatsappVisivel;
  if (LOJA.horario) { $("#horario").textContent = LOJA.horario; $("#horario").hidden = false; }
  $("#ano").textContent = new Date().getFullYear();
  desenharGrade();
}

/* ---------- Catálogo com filtro e busca ---------- */
let filtro = "todas";
const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
function desenharGrade() {
  const q = norm($("#busca").value.trim());
  const itens = PRODUTOS.filter(p => (filtro === "todas" || linhaDe(p.cat).id === filtro) && (!q || norm(p.nome).includes(q)));
  $("#grade").innerHTML = itens.map(card).join("");
  $("#conta").textContent = `${itens.length} ${itens.length === 1 ? "produto" : "produtos"}`;
  $("#vazio").hidden = itens.length > 0;
  $("#busca-limpa").hidden = !q;
}
function filtrar(id) {
  filtro = id;
  $$(".chip").forEach(c => { const on = c.dataset.filtro === id; c.classList.toggle("on", on); c.setAttribute("aria-selected", on); });
  desenharGrade();
}

/* ---------- Lista (vários produtos num pedido só) ---------- */
let lista = store.get("rommo_lista", []).filter(i => porId(i.id));
const itensLista = () => lista.map(i => ({ p: porId(i.id), q: i.q }));
function salvarLista() {
  store.set("rommo_lista", lista);
  const n = lista.reduce((s, i) => s + i.q, 0);
  $("#doca-qtd").textContent = n; $("#doca-qtd").hidden = !n;
}
function porNaLista(id, q) {
  const i = lista.find(x => x.id === id);
  if (i) i.q = Math.min(99, i.q + q); else lista.push({ id, q });
  salvarLista(); avisar("Adicionado à sua lista");
}
let tAviso;
function avisar(t) { const a = $("#aviso"); a.textContent = t; a.classList.add("on"); clearTimeout(tAviso); tAviso = setTimeout(() => a.classList.remove("on"), 1800); }

/* ---------- Folhas ---------- */
let aberta = null;
function abrir(id) {
  fechar(true);
  $("#aviso").classList.remove("on");
  aberta = $(id); aberta.hidden = false;
  document.body.classList.add("folha-aberta");
  requestAnimationFrame(() => { $("#fundo").classList.add("on"); aberta.classList.add("on"); });
  aberta.scrollTop = 0;
  setTimeout(() => aberta && aberta.querySelector(".fechar")?.focus({ preventScroll: true }), 300);
}
function fechar(rapido) {
  if (!aberta) return;
  const f = aberta; aberta = null;
  f.classList.remove("on"); $("#fundo").classList.remove("on");
  document.body.classList.remove("folha-aberta");
  if (rapido) f.hidden = true; else setTimeout(() => { if (aberta !== f) f.hidden = true; }, 380);
}

function folhaProduto(id) {
  const p = porId(id); if (!p) return;
  const l = linhaDe(p.cat), d = desconto(p);
  let q = 1;
  const rel = PRODUTOS.filter(x => x.id !== p.id && linhaDe(x.cat).id === l.id).concat(PRODUTOS.filter(x => x.id !== p.id && linhaDe(x.cat).id !== l.id && x.destaque)).slice(0, 8);
  const f = $("#folha-produto");
  f.innerHTML = `<div class="alca"></div><button class="fechar" type="button" data-fechar aria-label="Fechar">×</button>
   <div class="fp-foto"><img src="${foto(p)}" alt="${esc(p.nome)}">${selo(p)}</div>
   <span class="fp-linha" style="--c:${l.cor}"><i></i>${l.nome}</span>
   <h2 class="fp-nome">${esc(p.nome)}</h2>
   <div class="fp-valores"><span class="fp-preco">${brl(p.p)}</span>${p.de ? `<span class="fp-de">${brl(p.de)}</span><span class="fp-eco">Economize ${brl(p.de - p.p)}</span>` : ""}</div>
   <div class="fp-qtd"><span>Quantidade</span><div class="passo"><button type="button" data-q="-1" aria-label="Diminuir">−</button><b id="fp-q">1</b><button type="button" data-q="1" aria-label="Aumentar">+</button></div></div>
   <div class="fp-acoes">
     <button class="btn btn-zap btn-largo" type="button" id="fp-zap"><svg viewBox="0 0 24 24"><use href="#i-zap"/></svg>Pedir no WhatsApp</button>
     <div class="fp-mini"><button class="btn btn-contorno" type="button" id="fp-lista">Adicionar à lista</button>${navigator.share ? `<button class="btn btn-contorno" type="button" id="fp-enviar">Enviar pra alguém</button>` : ""}</div>
   </div>
   <p class="fp-nota">${d ? "Oferta válida enquanto durar o estoque." : "Você confirma estoque e entrega direto com a gente."}</p>
   ${rel.length ? `<h3 class="rel-titulo">Combina com</h3><div class="trilho">${rel.map(mini).join("")}</div>` : ""}`;
  f.querySelectorAll("[data-q]").forEach(b => b.onclick = () => { q = Math.max(1, Math.min(99, q + Number(b.dataset.q))); $("#fp-q").textContent = q; });
  $("#fp-zap").onclick = () => abrirZap(MSG.produto(p, q));
  $("#fp-lista").onclick = () => { porNaLista(p.id, q); fechar(); };
  const env = $("#fp-enviar");
  if (env) env.onclick = () => navigator.share({ title: p.nome, text: `${p.nome} por ${brl(p.p)} na ROMMO`, url: location.origin + location.pathname + "#p" + p.id }).catch(() => {});
  abrir("#folha-produto");
  try { history.replaceState(null, "", "#p" + p.id); } catch {}
}

function folhaLista() {
  const f = $("#folha-lista");
  const desenhar = () => {
    const itens = itensLista();
    const total = itens.reduce((s, { p, q }) => s + p.p * q, 0);
    f.innerHTML = `<div class="alca"></div><button class="fechar" type="button" data-fechar aria-label="Fechar">×</button><h2>Sua lista</h2>` +
      (itens.length ? itens.map(({ p, q }) => `<div class="lista-item"><span class="foto"><img src="${foto(p)}" alt=""></span><div><b>${esc(p.nome)}</b>
        <div class="linha2"><strong>${brl(p.p * q)}</strong><div class="passo"><button type="button" data-li="${p.id}" data-d="-1" aria-label="Diminuir">${q === 1 ? "×" : "−"}</button><b>${q}</b><button type="button" data-li="${p.id}" data-d="1" aria-label="Aumentar">+</button></div></div></div></div>`).join("") +
        `<div class="lista-total"><span>Total aproximado</span><b>${brl(total)}</b></div>
         <button class="btn btn-zap btn-largo" type="button" id="lista-zap"><svg viewBox="0 0 24 24"><use href="#i-zap"/></svg>Enviar lista no WhatsApp</button>
         <p class="fp-nota">A gente confirma estoque, frete e forma de pagamento por lá.</p>`
      : `<div class="lista-vazia"><p>Sua lista está vazia.</p><button class="btn btn-amarelo" type="button" data-ir="catalogo">Ver o catálogo</button></div>`);
    f.querySelectorAll("[data-li]").forEach(b => b.onclick = () => {
      const i = lista.find(x => x.id === Number(b.dataset.li)); if (!i) return;
      i.q += Number(b.dataset.d); if (i.q < 1) lista = lista.filter(x => x !== i);
      salvarLista(); desenhar();
    });
    const z = $("#lista-zap"); if (z) z.onclick = () => abrirZap(MSG.lista(itensLista()));
  };
  desenhar(); abrir("#folha-lista");
}

/* ---------- Aviso antes de sair ---------- */
function folhaSair() {
  if (sessao.get("rommo_sair")) return false;
  sessao.set("rommo_sair", "1");
  const f = $("#folha-sair"), itens = itensLista();
  const ofertas = PRODUTOS.filter(desconto).sort((a, b) => desconto(b) - desconto(a));
  f.innerHTML = `<div class="alca"></div><button class="fechar" type="button" data-fechar aria-label="Fechar">×</button><div class="sair-tiles"><i></i><i></i><i></i><i></i></div>` +
    (itens.length
      ? `<h2>Sua lista ainda não foi enviada</h2><p class="sub">São ${itens.length} ${itens.length === 1 ? "produto" : "produtos"} esperando. Envie agora e a gente já separa pra você.</p>
         <button class="btn btn-zap btn-largo" type="button" id="sair-zap"><svg viewBox="0 0 24 24"><use href="#i-zap"/></svg>Enviar lista no WhatsApp</button>`
      : `<h2>Antes de ir, veja as ofertas da semana</h2><p class="sub">${textoRelogio(true)}</p><div class="trilho">${ofertas.map(mini).join("")}</div>
         <div style="margin-top:14px"><button class="btn btn-zap btn-largo" type="button" id="sair-zap"><svg viewBox="0 0 24 24"><use href="#i-zap"/></svg>Tirar dúvida no WhatsApp</button></div>`) +
    `<div class="sair-sec"><button type="button" id="sair-mesmo">Sair do catálogo</button></div>`;
  $("#sair-zap").onclick = () => abrirZap(itens.length ? MSG.lista(itens) : MSG.oferta());
  $("#sair-mesmo").onclick = () => { fechar(true); history.back(); };
  abrir("#folha-sair");
  return true;
}
let guarda = false;
function armarGuarda() { if (guarda || sessao.get("rommo_sair")) return; try { history.pushState({ rommo: 1 }, ""); guarda = true; } catch {} }
addEventListener("popstate", () => {
  guarda = false;
  if (aberta) { fechar(); armarGuarda(); return; }
  if (!folhaSair()) history.back();
});
document.addEventListener("mouseout", e => { if (!e.relatedTarget && e.clientY <= 0 && document.body.classList.contains("capa-fora") && !aberta) folhaSair(); });

/* ---------- Relógio das ofertas (renova todo domingo às 23h59) ---------- */
function fimDaSemana() { const d = new Date(); d.setHours(23, 59, 59, 0); d.setDate(d.getDate() + ((7 - d.getDay()) % 7)); return d; }
function textoRelogio(frase) {
  let s = Math.max(0, Math.floor((fimDaSemana() - Date.now()) / 1000));
  const dd = Math.floor(s / 86400); s %= 86400; const hh = Math.floor(s / 3600); s %= 3600; const mm = Math.floor(s / 60);
  const t = dd ? `${dd}d ${String(hh).padStart(2, "0")}h ${String(mm).padStart(2, "0")}min` : `${String(hh).padStart(2, "0")}h ${String(mm).padStart(2, "0")}min ${String(s % 60).padStart(2, "0")}s`;
  return frase ? `Os preços especiais acabam em ${t}.` : `Termina em <b>${t}</b>`;
}
function relogio() { $("#relogio").innerHTML = textoRelogio(); }

/* ---------- Navegação ---------- */
function ir(id) {
  fechar(true);
  const el = document.getElementById(id); if (!el) return;
  const y = id === "inicio" ? capaFim() : el.getBoundingClientRect().top + scrollY - 70;
  scrollTo({ top: Math.max(0, y), behavior: reduz ? "auto" : "smooth" });
}
document.addEventListener("click", e => {
  const t = e.target;
  const zap = t.closest("[data-zap]"); if (zap) { abrirZap((MSG[zap.dataset.zap] || MSG.geral)()); return; }
  const ped = t.closest("[data-pedir]"); if (ped) { abrirZap(MSG.produto(porId(ped.dataset.pedir), 1)); return; }
  const pr = t.closest("[data-prod]"); if (pr) { folhaProduto(pr.dataset.prod); return; }
  const li = t.closest("[data-linha]"); if (li) { filtrar(li.dataset.linha); ir("catalogo"); return; }
  const fi = t.closest("[data-filtro]"); if (fi) { filtrar(fi.dataset.filtro); return; }
  const go = t.closest("[data-ir]"); if (go) { e.preventDefault(); ir(go.dataset.ir); return; }
  const ac = t.closest("[data-acao]");
  if (ac) { if (ac.dataset.acao === "lista") folhaLista(); if (ac.dataset.acao === "buscar") { ir("catalogo"); setTimeout(() => $("#busca").focus(), reduz ? 0 : 450); } return; }
  if (t.closest("[data-fechar]") || t.id === "fundo") { fechar(); try { history.replaceState(null, "", location.pathname); } catch {} return; }
  const a = t.closest('a[href^="#"]'); if (a && a.getAttribute("href").length > 1) { e.preventDefault(); ir(a.getAttribute("href").slice(1)); }
});
addEventListener("keydown", e => { if (e.key === "Escape" && aberta) fechar(); });
$("#busca").addEventListener("input", () => { if (filtro !== "todas" && $("#busca").value) filtrar("todas"); else desenharGrade(); });
$("#busca-limpa").addEventListener("click", () => { $("#busca").value = ""; desenharGrade(); $("#busca").focus(); });

/* doca: item ativo conforme a seção na tela */
const docaBtns = $$(".doca [data-ir]");
const io = new IntersectionObserver(es => es.forEach(en => {
  if (!en.isIntersecting) return;
  const id = en.target.id === "catalogo" || en.target.id === "insta" || en.target.id === "atendimento" ? "" : en.target.id;
  docaBtns.forEach(b => b.classList.toggle("ativo", b.dataset.ir === id));
}), { rootMargin: "-45% 0px -50% 0px" });
["inicio", "linhas", "ofertas", "catalogo", "insta", "atendimento"].forEach(id => io.observe(document.getElementById(id)));

/* ---------- Capa em tela cheia que encolhe até o palco ---------- */
const capa = $("#capa"), cImg = $(".capa-img"), cUi = $(".capa-ui"), palco = $("#inicio"), main = $("#app");
let D = 600, M = null, quadro = 0;
const suave = p => p * p * (3 - 2 * p);
const capaFim = () => D;
function medir() {
  D = Math.round(Math.min(innerHeight * 0.82, 720));
  main.style.paddingTop = (D + 72) + "px";
  const r = palco.getBoundingClientRect();
  M = { t: r.top + scrollY, l: r.left, w: r.width, h: r.height };
  atualizar();
}
function atualizar() {
  quadro = 0; if (!M) return;
  const y = scrollY, p = Math.min(1, Math.max(0, y / D));
  document.body.classList.toggle("capa-fora", p > 0.82);
  if (p >= 1) { if (capa.style.display !== "none") capa.style.display = "none"; return; }
  if (capa.style.display === "none") capa.style.display = "";
  const e = suave(p), vw = innerWidth, vh = innerHeight, topo = M.t - y;
  const T = Math.max(0, topo) * e, L = M.l * e, R = Math.max(0, vw - M.l - M.w) * e, B = Math.max(0, vh - topo - M.h) * e;
  cImg.style.clipPath = `inset(${T.toFixed(1)}px ${R.toFixed(1)}px ${B.toFixed(1)}px ${L.toFixed(1)}px round ${(22 * e).toFixed(1)}px)`;
  cImg.style.opacity = p > 0.88 ? Math.max(0, 1 - (p - 0.88) / 0.12) : 1;
  cUi.style.opacity = Math.max(0, 1 - p * 3);
}
if (reduz) { capa.style.display = "none"; document.body.classList.add("capa-fora"); main.style.paddingTop = "76px"; }
else {
  addEventListener("scroll", () => { if (!quadro) quadro = requestAnimationFrame(atualizar); }, { passive: true });
  addEventListener("resize", medir);
  try { history.scrollRestoration = "manual"; } catch {}
}
addEventListener("scroll", () => { if (scrollY > 40) armarGuarda(); }, { passive: true });

/* ---------- Tela de carregamento ---------- */
function carregamento() {
  const L = $("#ld"), B = $("#ldb"), T = $("#ldp"), W = $("#ldw");
  const fim = () => { document.body.classList.remove("ldg"); document.body.classList.add("pronto"); };
  if (!L) return fim();
  const DUR = reduz ? 600 : 4200, t0 = Date.now();
  let ok = false, saiu = false;
  const frases = ["Separando as ferramentas", "Ligando a irrigação", "Preparando o campo", "Conferindo as ofertas"];
  let fi = 0;
  const giro = setInterval(() => {
    fi = (fi + 1) % frases.length; W.textContent = frases[fi];
    W.animate?.([{ transform: "translateY(100%)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 360, easing: "cubic-bezier(.2,.8,.2,1)" });
  }, 1000);
  const tick = setInterval(() => {
    const pr = Math.min((Date.now() - t0) / DUR, 1), v = ok && pr >= 1 ? 100 : Math.min(pr * 100, 96);
    B.style.width = v + "%"; T.textContent = Math.round(v) + "%";
    if (v >= 100 && !saiu) {
      saiu = true; clearInterval(tick); clearInterval(giro);
      setTimeout(() => { scrollTo(0, 0); L.classList.add("out"); fim(); setTimeout(() => L.remove(), 1000); }, 300);
    }
  }, 40);
  const pronto = () => { ok = true; };
  if (document.readyState === "complete") pronto(); else addEventListener("load", pronto);
  setTimeout(pronto, 6500);
}

/* ---------- Início ---------- */
montar(); salvarLista(); relogio(); setInterval(relogio, 1000);
if (!reduz) { scrollTo(0, 0); medir(); addEventListener("load", medir); document.fonts?.ready.then(medir); }
carregamento();
const m = location.hash.match(/^#p(\d+)$/);
if (m && porId(m[1])) addEventListener("load", () => setTimeout(() => folhaProduto(m[1]), reduz ? 0 : 4600), { once: true });
})();
