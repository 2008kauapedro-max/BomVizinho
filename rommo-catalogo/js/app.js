/* ROMMO — catálogo limpo: abertura, capa que encolhe, vitrine e pedido pelo WhatsApp */
(() => {
"use strict";
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const brl = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
const linhaDe = cat => LINHAS.find(l => l.cats.includes(cat)) || LINHAS[1];
const foto = p => p.img || `assets/cat/${p.cat}.svg`;
/* ordem da vitrine: destaques, depois quem tem estoque, depois os mais caros (máquinas e kits na frente de parafuso) */
const peso = p => (p.destaque ? 1e6 : 0) + (p.est > 0 ? 1e5 : 0) + Math.min(p.p, 9e4);
const seloDe = p => p.selo || (p.est <= 0 ? "consultar" : "");
const porId = id => PRODUTOS.find(p => p.id === Number(id));
const desc = p => (p.de && p.de > p.p ? Math.round((1 - p.p / p.de) * 100) : 0);
const guardar = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
const sessao = { get(k) { try { return sessionStorage.getItem(k); } catch { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch {} } };

/* ---------- WhatsApp ---------- */
function abrirZap(txt) {
  const url = `https://wa.me/${LOJA.whatsapp}?text=${encodeURIComponent(txt)}`;
  /* "noopener" faz o window.open devolver null e a página ia embora junto: abre normal e corta o vínculo */
  const w = window.open(url, "_blank");
  if (w) { try { w.opener = null; } catch {} } else location.href = url;
}
const cupomOk = () => (typeof CUPOM !== "undefined" ? CUPOM : {}).codigo;
const assin = () => cupomOk() ? `\n\nVim pelo site — cupom *${CUPOM.codigo}*` : "";
const somaLista = itens => itens.reduce((s, { p, q }) => s + p.p * q, 0);
const MSG = {
  geral: () => "Olá, ROMMO! Vim pelo catálogo e quero atendimento." + assin(),
  busca: () => `Olá, ROMMO! Procurei "${$("#busca").value.trim()}" no catálogo e não encontrei. Vocês têm?` + assin(),
  oferta: () => "Olá, ROMMO! Vi as ofertas no catálogo e quero saber mais." + assin(),
  produto: (p, q) => `Olá, ROMMO! Quero este produto do catálogo:\n\n*${p.nome}*${p.cod ? ` (cód. ${p.cod})` : ""}\nQuantidade: ${q}\nPreço: ${brl(p.p)} cada\n\nTem disponível?` + assin(),
  lista: itens => `Olá, ROMMO! Montei esta lista no catálogo:\n\n${itens.map(({ p, q }) => `• ${q}x ${p.nome}${p.cod ? ` (cód. ${p.cod})` : ""} — ${brl(p.p * q)}`).join("\n")}\n\n*Total: ${brl(somaLista(itens))}*\n\nTem tudo disponível?` + assin(),
  kit: k => `Olá, ROMMO! Quero o kit *${k.nome}* do catálogo:\n\n${k.itens.map(porId).filter(Boolean).map(p => `• 1x ${p.nome} — ${brl(p.p)}`).join("\n")}\n\n*Total: ${brl(k.itens.map(porId).filter(Boolean).reduce((s, p) => s + p.p, 0))}*\n\nTem tudo disponível?` + assin(),
};

/* ---------- Cartão (um modelo só) ---------- */
const SELOS = { "mais-vendido": ["Mais vendido", "vendido", "Top vendas"], ultimas: ["Últimas unidades", "ultimas", "Acabando"], consultar: ["Sob consulta: pergunte no WhatsApp", "consultar", "Sob consulta"] };
const etiqueta = p => desc(p) ? `<span class="etiqueta">-${desc(p)}%</span>` : p.novo ? `<span class="etiqueta novo">Novo</span>` : "";
const selosDe = p => [desc(p) ? `<span class="selo-f desc">-${desc(p)}% de desconto</span>` : "", SELOS[seloDe(p)] ? `<span class="selo-f ${SELOS[seloDe(p)][1]}">${SELOS[seloDe(p)][0]}</span>` : "", p.novo ? `<span class="selo-f novo">Novo</span>` : ""].join("");
const cartao = p => `<button class="cartao" type="button" data-prod="${p.id}">
  <span class="foto"><img src="${foto(p)}" alt="" loading="lazy" decoding="async" width="560" height="560">${etiqueta(p)}<span class="mais" data-add="${p.id}" role="button" aria-label="Adicionar à lista">+</span></span>
  <span class="info">${SELOS[seloDe(p)] ? `<span class="selo-c ${SELOS[seloDe(p)][1]}" title="${SELOS[seloDe(p)][0]}">${SELOS[seloDe(p)][2]}</span>` : `<span class="selo-c" aria-hidden="true"></span>`}<span class="nome">${esc(p.nome)}</span>
  <span class="de${p.de ? "" : " sem"}">${p.de ? brl(p.de) : ""}</span><span class="preco">${brl(p.p)}</span></span>
</button>`;

/* ---------- Página inicial (vitrine) ---------- */
/* cartão grande do carrossel de ofertas */
const oferta = p => `<button class="oferta" type="button" data-prod="${p.id}">
  <span class="foto"><img src="${foto(p)}" alt="" decoding="async" width="560" height="560">${desc(p) ? `<span class="etiqueta">-${desc(p)}%</span>` : ""}</span>
  <span class="o-info"><span class="nome">${esc(p.nome)}</span>
  <span class="preco">${brl(p.p)}${p.de ? `<span class="de">${brl(p.de)}</span>` : ""}</span>
  ${p.de ? `<span class="o-eco">Economize ${brl(p.de - p.p)}</span>` : `<span class="o-eco o-cat">${esc((typeof CATEGORIAS !== "undefined" && CATEGORIAS[p.cat]) || linhaDe(p.cat).nome)}</span>`}</span>
</button>`;

function montar() {
  let ofertas = PRODUTOS.filter(desc).sort((a, b) => desc(b) - desc(a));
  const temOferta = ofertas.length > 0;
  if (!temOferta) {  /* sem ofertas cadastradas: o bloco amarelo mostra os destaques */
    ofertas = PRODUTOS.filter(p => p.destaque && p.est > 0).slice(0, 8);
    $("#of-titulo").textContent = "Destaques da semana"; $("#relogio").hidden = true;
    const v = $("#ofertas .ver"); v.dataset.loja = ""; v.dataset.ordem = "";
  }
  $("#trilho-ofertas").innerHTML = ofertas.map(oferta).join("");
  $("#pontos").innerHTML = ofertas.map(() => "<i></i>").join("");
  $("#ofertas").hidden = !ofertas.length;
  $("#abas").innerHTML = `<button class="aba" type="button" role="tab" data-aba="">Destaques</button>` +
    LINHAS.map(l => `<button class="aba" type="button" role="tab" data-aba="${l.id}" style="--c:${l.cor}"><i></i>${esc(l.nome)}</button>`).join("");
  aba("");

  /* cupom */
  if (cupomOk()) { $("#cupom-cod").textContent = CUPOM.codigo; $("#cupom-txt").textContent = CUPOM.texto; $("#cupom").hidden = false; }
  /* campanha */
  if (temOferta && campanhaAtiva()) $("#of-titulo").textContent = CAMPANHA.titulo;
  /* kits prontos */
  const kits = (typeof KITS !== "undefined" ? KITS : []).filter(k => k.itens.some(porId));
  if (kits.length) {
    $("#kits-trilho").innerHTML = kits.map(k => {
      const ps = k.itens.map(porId).filter(Boolean), tot = ps.reduce((s, p) => s + p.p, 0);
      return `<div class="kit" style="--c:${k.cor || "#15150f"}">
        <button class="kit-abrir" type="button" data-kit="${k.id}" aria-label="Ver o kit ${esc(k.nome)}">
          <span class="kit-fotos">${ps.slice(0, 3).map(p => `<img src="${foto(p)}" alt="" loading="lazy">`).join("")}</span>
          <b>${esc(k.nome)}</b><small>${ps.length} itens · ${brl(tot)}</small>
        </button>
        <button class="kit-add" type="button" data-kit-add="${k.id}">+ Adicionar kit</button>
      </div>`;
    }).join("");
    $("#kits").hidden = false;
  }
  diaMontar();

  const ig = `https://www.instagram.com/${LOJA.instagram}/`;
  if (INSTAGRAM_POSTS.length) montarInsta();
  $("#c-insta").href = ig; $("#c-insta-txt").textContent = "@" + LOJA.instagram;
  $("#c-zap").textContent = LOJA.whatsappVisivel;
  const lugar = [LOJA.nomeNoMapa, LOJA.endereco].filter(Boolean).join(", ") || LOJA.cidade;
  $("#c-mapa").href = LOJA.mapa || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lugar)}`;
  $("#c-rota").href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(lugar)}`;
  $("#mapa-frame").src = `https://maps.google.com/maps?q=${encodeURIComponent(lugar)}&z=16&hl=pt-BR&output=embed`;
  $("#m-rota").href = $("#c-rota").href; $("#m-end").textContent = LOJA.cidade;
  $("#m-insta").href = ig; $("#m-insta-txt").textContent = "@" + LOJA.instagram; $("#m-zap").textContent = LOJA.whatsappVisivel;
  $("#menu-linhas").innerHTML = LINHAS.map(l => `<button class="menu-sub" type="button" data-loja="${l.id}"><i style="background:${l.cor}"></i>${esc(l.nome)}</button>`).join("");
  $("#c-cidade").textContent = LOJA.cidade; $("#c-end").textContent = LOJA.endereco || ""; $("#c-ref").textContent = LOJA.referencia || "";
  $("#ano").textContent = new Date().getFullYear();
  $("#chips").innerHTML = `<button class="chip" type="button" role="tab" data-filtro="">Tudo</button>` + (PRODUTOS.some(desc) ? `<button class="chip oferta-chip" type="button" role="tab" data-filtro="ofertas"><i></i>Ofertas</button>` : "") +
    LINHAS.map(l => `<button class="chip" type="button" role="tab" data-filtro="${l.id}" style="--c:${l.cor}"><i></i>${l.nome}</button>`).join("");
}

/* ---------- Vitrine por abas: 6 produtos de cada vez ---------- */
function aba(id) {
  let itens;
  /* não repete o mesmo produto em vários tamanhos na vitrine */
  const unicos = l => { const vistos = new Set(); return l.filter(p => !p.grupo || (!vistos.has(p.grupo) && vistos.add(p.grupo))); };
  if (!id) itens = unicos(PRODUTOS.filter(p => p.destaque || p.novo).sort((a, b) => peso(b) - peso(a)));
  else itens = unicos(PRODUTOS.filter(p => linhaDe(p.cat).id === id).sort((a, b) => peso(b) - peso(a)));
  const l = LINHAS.find(x => x.id === id);
  const g = $("#vitrine");
  g.innerHTML = itens.slice(0, 6).map(cartao).join("");
  if (!reduz) g.animate?.([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: "ease-out" });
  const v = $("#ver-tudo"); v.dataset.loja = id;
  v.textContent = l ? `Ver todos de ${l.nome}` : "Ver todos os produtos";
  $$(".aba").forEach(b => { const on = b.dataset.aba === id; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); });
}
$("#abas").addEventListener("click", e => { const b = e.target.closest(".aba"); if (!b) return; aba(b.dataset.aba); b.scrollIntoView({ inline: "center", block: "nearest", behavior: reduz ? "auto" : "smooth" }); });

/* ---------- Campanha e oferta do dia ---------- */
function campanhaAtiva() { const c = (typeof CAMPANHA !== "undefined" ? CAMPANHA : null); return !!(c && c.ativa && c.titulo && (!c.fim || new Date(c.fim) > new Date())); }
function produtoDoDia() {
  const of = PRODUTOS.filter(desc); if (!of.length) return null;
  const d = new Date(), n = Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
  return of[n % of.length];
}
function diaMontar() {
  const p = produtoDoDia(); if (!p) return;
  $("#dia-card").innerHTML = `<button class="dia" type="button" data-prod="${p.id}">
    <span class="dia-foto"><img src="${foto(p)}" alt="" loading="lazy"><span class="etiqueta">-${desc(p)}%</span></span>
    <span class="dia-info"><span class="nome">${esc(p.nome)}</span>
      <span class="dia-preco"><s>${brl(p.de)}</s><b>${brl(p.p)}</b></span>
      <span class="dia-eco">Você economiza ${brl(p.de - p.p)}</span></span>
    <span class="mais" data-add="${p.id}" role="button" aria-label="Adicionar à lista">+</span>
  </button>`;
  $("#dia").hidden = false;
}
const ateMeiaNoite = () => { const d = new Date(), f = new Date(d); f.setHours(24, 0, 0, 0); let s = Math.max(0, Math.floor((f - d) / 1000)); const h = Math.floor(s / 3600); s %= 3600; return `Acaba em ${h}h ${String(Math.floor(s / 60)).padStart(2, "0")}min`; };

/* ---------- Kits ---------- */
const kitPorId = id => (typeof KITS !== "undefined" ? KITS : []).find(k => k.id === id);
function adicionarKit(k) {
  const ps = k.itens.map(porId).filter(Boolean);
  ps.forEach(p => { const i = lista.find(x => x.id === p.id); if (i) i.q = Math.min(99, i.q + 1); else lista.push({ id: p.id, q: 1 }); });
  salvarLista(); avisar(`Kit adicionado: ${ps.length} itens`);
  const b = $("#lista-qtd"); b.classList.remove("pulo"); void b.offsetWidth; b.classList.add("pulo");
}
function verKit(k) {
  const ps = k.itens.map(porId).filter(Boolean), tot = ps.reduce((s, p) => s + p.p, 0);
  abrirFolha(`<h2>${esc(k.nome)}</h2><p class="sub">${esc(k.desc || "")}</p>
    <div class="grade">${ps.map(cartao).join("")}</div>
    <div class="total"><span>Total do kit</span><b>${brl(tot)}</b></div>
    <div class="f-acoes">
      <button class="btn btn-zap btn-largo" type="button" id="k-zap"><svg viewBox="0 0 24 24"><use href="#i-zap"/></svg>Pedir o kit no WhatsApp</button>
      <button class="btn btn-claro btn-largo" type="button" id="k-add">Adicionar kit à lista</button>
    </div>`, "Kit");
  $("#k-zap").onclick = () => abrirZap(MSG.kit(k));
  $("#k-add").onclick = () => { fecharFolha(); adicionarKit(k); };
}

/* ---------- Compartilhar produto ---------- */
async function compartilhar(p) {
  const url = `${location.origin}${location.pathname}?p=${p.id}`, texto = `${p.nome} por ${brl(p.p)} na ROMMO`;
  try { if (navigator.share) { await navigator.share({ title: p.nome, text: texto, url }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
  window.open(`https://wa.me/?text=${encodeURIComponent(texto + "\n" + url)}`, "_blank", "noopener");
}
function abrirLink() {
  const id = new URLSearchParams(location.search).get("p");
  if (id && porId(id)) { verProduto(id); try { history.replaceState(history.state, "", location.pathname); } catch {} }
}

/* ---------- Instagram: posts oficiais (só carrega quando chega perto) ---------- */
function montarInsta() {
  const box = $("#insta-posts");
  box.innerHTML = INSTAGRAM_POSTS.slice(0, 3).map(u => {
    const link = String(u).split("?")[0].replace(/\/?$/, "/");
    return /^https:\/\/www\.instagram\.com\/(p|reel)\/[\w-]+\/$/.test(link)
      ? `<blockquote class="instagram-media" data-instgrm-permalink="${esc(link)}" data-instgrm-version="14"><a href="${esc(link)}" target="_blank" rel="noopener">Ver no Instagram</a></blockquote>` : "";
  }).join("");
  if (!box.innerHTML.trim()) return;
  box.hidden = false;
  const carregar = () => { const s = document.createElement("script"); s.async = true; s.src = "https://www.instagram.com/embed.js"; document.body.appendChild(s); };
  if (!("IntersectionObserver" in window)) return carregar();
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); carregar(); } }, { rootMargin: "600px" });
  io.observe(box);
}

/* ---------- Carrossel de ofertas: o do meio cresce, os lados recuam ---------- */
function carrossel() {
  const t = $("#trilho-ofertas"), pts = $$("#pontos i");
  const cards = $$(".oferta", t); if (!cards.length) return;
  let pedido = 0, atual = -1;
  function pintar() {
    pedido = 0;
    const meio = t.scrollLeft + t.clientWidth / 2;
    let melhor = 0, md = 1e9;
    cards.forEach((c, i) => {
      const centro = c.offsetLeft + c.offsetWidth / 2, d = (centro - meio) / c.offsetWidth;
      const a = Math.min(Math.abs(d), 1.4);
      if (!reduz) c.style.transform = `scale(${1 - a * .12}) translateY(${a * 10}px)`;
      c.style.opacity = 1 - Math.min(a, 1) * .45;
      if (Math.abs(d) < md) { md = Math.abs(d); melhor = i; }
    });
    if (melhor !== atual) { atual = melhor; pts.forEach((p, i) => p.classList.toggle("on", i === melhor)); cards.forEach((c, i) => c.classList.toggle("ativo", i === melhor)); }
  }
  t.addEventListener("scroll", () => { if (!pedido) pedido = requestAnimationFrame(pintar); }, { passive: true });
  addEventListener("resize", pintar);
  pintar();
  if (reduz || cards.length < 2) return;
  /* passa sozinho a cada 4s, para quando a pessoa toca */
  let parado = false, tPausa;
  const pausar = () => { parado = true; clearTimeout(tPausa); tPausa = setTimeout(() => parado = false, 8000); };
  ["pointerdown", "touchstart", "wheel"].forEach(ev => t.addEventListener(ev, pausar, { passive: true }));
  let visivel = false;
  if ("IntersectionObserver" in window) new IntersectionObserver(es => visivel = es[0].isIntersecting, { threshold: .5 }).observe(t);
  setInterval(() => {
    if (parado || !visivel || document.hidden || lojaAberta || aberta) return;
    const prox = cards[(atual + 1) % cards.length];
    t.scrollTo({ left: prox.offsetLeft - (t.clientWidth - prox.offsetWidth) / 2, behavior: "smooth" });
  }, 4000);
}

/* ---------- Loja: todos os produtos, com busca, linhas e ordem ---------- */
let filtro = "", lojaAberta = false, rolagemCasa = 0;
const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
/* ---------- Busca inteligente ----------
   Procura no nome, nos apelidos (tags) e nos sinônimos. Primeiro vem o que a pessoa
   procurou; quando acaba, aparecem os produtos relacionados. */
const PARADAS = new Set(["de", "da", "do", "das", "dos", "com", "para", "por", "e", "a", "o", "em", "kit", "jogo", "pecas", "peca"]);
const raiz = w => w.length > 4 ? w.replace(/oes$|aes$/, "ao").replace(/es$|s$/, "") : w;
const palavras = t => norm(t).split(/[^a-z0-9]+/).filter(w => w && !PARADAS.has(w));
const SIN = (typeof SINONIMOS !== "undefined" ? SINONIMOS : []).map(g => g.map(norm));
const INDICE = new Map(PRODUTOS.map(p => {
  const nome = palavras(p.nome), extra = palavras((p.tags || "") + " " + ((typeof CATEGORIAS !== "undefined" && CATEGORIAS[p.cat]) || ""));
  const texto = " " + [...nome, ...extra].join(" ") + " ";
  SIN.forEach(g => { if (g.some(t => texto.includes(" " + t))) g.forEach(t => extra.push(...palavras(t))); });
  const l = linhaDe(p.cat);
  return [p.id, { nome, extra, linha: palavras(l.nome + " " + p.cat + " " + ((typeof CATEGORIAS !== "undefined" && CATEGORIAS[p.cat]) || "")), todas: new Set([...nome, ...extra].map(raiz)) }];
}));
const bate = (lista, t) => lista.some(w => w.startsWith(t) || raiz(w) === t);
function buscar(q, base) {
  const toks = palavras(q).map(raiz);
  if (!toks.length) return { achados: [], rel: [] };
  const pontos = new Map(), parcial = new Map();
  base.forEach(p => {
    const ix = INDICE.get(p.id); let soma = 0, todos = true, algum = 0;
    toks.forEach(t => {
      const v = bate(ix.nome, t) ? (ix.nome[0].startsWith(t) ? 14 : 10) : bate(ix.extra, t) ? 7 : 0;
      if (v) { soma += v; algum++; } else { todos = false; if (bate(ix.linha, t)) algum += .5; }
    });
    if (todos) pontos.set(p, soma); else if (algum) parcial.set(p, algum * 3);
  });
  const achados = [...pontos.keys()].sort((a, b) => pontos.get(b) - pontos.get(a));
  /* relacionados: mesmo grupo, mesma categoria, palavras em comum, mesma linha */
  const rel = new Map(parcial);
  achados.forEach(a => {
    const ia = INDICE.get(a.id);
    base.forEach(p => {
      if (pontos.has(p)) return;
      const ip = INDICE.get(p.id);
      let r = (a.grupo && p.grupo === a.grupo ? 8 : 0) + (p.cat === a.cat ? 5 : 0) + (linhaDe(p.cat) === linhaDe(a.cat) ? 1 : 0);
      ip.todas.forEach(w => { if (w.length > 3 && ia.todas.has(w)) r += 2; });
      if (r) rel.set(p, Math.max(rel.get(p) || 0, r));
    });
  });
  return { achados, rel: [...rel.keys()].sort((a, b) => rel.get(b) - rel.get(a)).slice(0, 24) };
}
function parecidos(p) {
  const mesmos = p.grupo ? PRODUTOS.filter(x => x !== p && x.grupo === p.grupo) : [];
  const ip = INDICE.get(p.id), nota = new Map();
  PRODUTOS.forEach(x => {
    if (x === p || mesmos.includes(x)) return;
    let r = (x.cat === p.cat ? 6 : 0) + (linhaDe(x.cat) === linhaDe(p.cat) ? 2 : 0);
    INDICE.get(x.id).todas.forEach(w => { if (w.length > 3 && ip.todas.has(w)) r += 3; });
    if (r) nota.set(x, r);
  });
  return { mesmos, outros: [...nota.keys()].sort((a, b) => nota.get(b) - nota.get(a)).slice(0, 12) };
}

function grade() {
  const bruto = $("#busca").value.trim(), q = norm(bruto), ordem = $("#ordem").value;
  const base = PRODUTOS.filter(p => !filtro || (filtro === "ofertas" ? desc(p) > 0 : linhaDe(p.cat).id === filtro));
  let itens = base, rel = [];
  if (q) ({ achados: itens, rel } = buscar(q, base));
  const ordenar = l => {
    if (ordem === "menor") return l.slice().sort((a, b) => a.p - b.p);
    if (ordem === "maior") return l.slice().sort((a, b) => b.p - a.p);
    if (ordem === "ofertas") return l.slice().sort((a, b) => desc(b) - desc(a));
    if (ordem === "az") return l.slice().sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    return q ? l : l.slice().sort((a, b) => peso(b) - peso(a));
  };
  itens = ordenar(itens);
  let html = itens.map(cartao).join("");
  if (rel.length) html += `<p class="sep">${itens.length ? "Relacionados" : `Não achamos “${esc(bruto)}”. Veja parecidos:`}</p>` + rel.map(cartao).join("");
  $("#grade").innerHTML = html;
  $("#vazio").hidden = itens.length > 0;
  $("#busca-limpa").hidden = !q;
  $("#conta").textContent = q ? `${itens.length} ${itens.length === 1 ? "resultado" : "resultados"}` : `${itens.length} ${itens.length === 1 ? "produto" : "produtos"}`;
  $$(".chip").forEach(c => { const on = c.dataset.filtro === filtro; c.classList.toggle("on", on); c.setAttribute("aria-selected", on); });
}
function abrirLoja(linha, focar, ordem) {
  filtro = linha || "";
  $("#ordem").value = ordem || "";
  if (!lojaAberta) {
    rolagemCasa = scrollY; lojaAberta = true;
    try { history.pushState({ rommo: "loja" }, ""); } catch {}
  }
  document.body.classList.add("na-loja");
  $("#loja").hidden = false; $("#app").hidden = true;
  grade(); scrollTo(0, 0);
  $(`.chip[data-filtro="${filtro}"]`)?.scrollIntoView({ inline: "center", block: "nearest" });
  if (focar) setTimeout(() => $("#busca").focus(), 60);
}
function fecharLoja() {
  if (!lojaAberta) return; lojaAberta = false;
  document.body.classList.remove("na-loja");
  $("#loja").hidden = true; $("#app").hidden = false;
  scrollTo(0, rolagemCasa); medir(true);
}
$("#busca").addEventListener("input", () => { if ($("#busca").value.trim()) filtro = ""; grade(); });
$("#busca").addEventListener("keydown", e => { if (e.key === "Enter") e.target.blur(); });
$("#busca-limpa").addEventListener("click", () => { $("#busca").value = ""; grade(); $("#busca").focus(); });
$("#ordem").addEventListener("change", grade);
$("#loja-voltar").addEventListener("click", () => history.back());
$("#chips").addEventListener("click", e => { const c = e.target.closest(".chip"); if (!c) return; filtro = c.dataset.filtro; grade(); scrollTo(0, 0); });

/* ---------- Lista ---------- */
let lista = guardar.get("rommo_lista", []).filter(i => porId(i.id));
const itensLista = () => lista.map(i => ({ p: porId(i.id), q: i.q }));
function salvarLista() {
  guardar.set("rommo_lista", lista);
  const n = lista.reduce((s, i) => s + i.q, 0);
  const s = $("#lista-qtd"); s.textContent = n > 99 ? "99+" : n; s.hidden = !n;
  $("#menu-qtd").textContent = n ? n : "";
}
let tAviso;
function avisar(t) { const a = $("#aviso"); a.textContent = t; a.classList.add("on"); clearTimeout(tAviso); tAviso = setTimeout(() => a.classList.remove("on"), 1700); }

/* ---------- Folha ---------- */
const folha = $("#folha"), fundo = $("#fundo");
let aberta = false;
function abrirFolha(html, rotulo) {
  $("#aviso").classList.remove("on");
  folha.innerHTML = `<div class="alca"></div><button class="fechar" type="button" data-fechar aria-label="Fechar">×</button>${html}`;
  folha.setAttribute("aria-label", rotulo);
  folha.hidden = false; folha.scrollTop = 0; aberta = true;
  document.body.classList.add("travado");
  requestAnimationFrame(() => { fundo.classList.add("on"); folha.classList.add("on"); });
}
function fecharFolha() {
  if (!aberta) return; aberta = false;
  folha.classList.remove("on"); fundo.classList.remove("on"); document.body.classList.remove("travado");
  setTimeout(() => { if (!aberta) folha.hidden = true; }, 330);
}

function verProduto(id) {
  const p = porId(id); if (!p) return;
  let q = 1;
  abrirFolha(`<div class="f-foto"><img src="${foto(p)}" alt="${esc(p.nome)}"></div>
    <p class="f-cat">${esc((typeof CATEGORIAS !== "undefined" && CATEGORIAS[p.cat]) || linhaDe(p.cat).nome)}${p.cod ? ` · cód. ${esc(p.cod)}` : ""}</p>
    <h2 class="f-nome">${esc(p.nome)}</h2>
    ${selosDe(p) ? `<div class="f-selos">${selosDe(p)}</div>` : ""}
    <div class="f-preco"><b>${brl(p.p)}</b>${p.de ? `<s>${brl(p.de)}</s><em>Economize ${brl(p.de - p.p)}</em>` : ""}</div>
    <div class="f-qtd"><span>Quantidade</span><div class="passo"><button type="button" data-q="-1" aria-label="Diminuir">−</button><b id="f-q">1</b><button type="button" data-q="1" aria-label="Aumentar">+</button></div></div>
    <div class="f-acoes">
      <button class="btn btn-zap btn-largo" type="button" id="f-zap"><svg viewBox="0 0 24 24"><use href="#i-zap"/></svg>Pedir no WhatsApp</button>
      <button class="btn btn-claro btn-largo" type="button" id="f-lista">Adicionar à lista</button>
    </div>
    <div class="f-extra">
      ${cupomOk() ? `<span class="f-cupom">Cupom <b>${esc(CUPOM.codigo)}</b> já vai na mensagem</span>` : "<span></span>"}
      <button class="f-share" type="button" id="f-share"><svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5"/></svg>Compartilhar</button>
    </div>
    ${(() => { const c = (p.combina || []).map(porId).filter(Boolean); return c.length ? `<h3 class="f-sub">Combina com</h3><div class="combina">${c.map(x => `<button class="comb" type="button" data-prod="${x.id}"><span class="ft"><img src="${foto(x)}" alt=""></span><span class="comb-txt"><b>${esc(x.nome)}</b><small>${brl(x.p)}</small></span><span class="mais" data-add="${x.id}" role="button" aria-label="Adicionar à lista">+</span></button>`).join("")}</div>` : ""; })()}
    ${(() => { const { mesmos, outros } = parecidos(p); return (mesmos.length ? `<h3 class="f-sub">Outros modelos</h3><div class="trilho">${mesmos.map(cartao).join("")}</div>` : "") +
      (outros.length ? `<h3 class="f-sub">Você também pode gostar</h3><div class="grade">${outros.map(cartao).join("")}</div>` : ""); })()}`, "Produto");
  folha.querySelectorAll("[data-q]").forEach(b => b.onclick = () => { q = Math.max(1, Math.min(99, q + Number(b.dataset.q))); $("#f-q").textContent = q; });
  $("#f-zap").onclick = () => abrirZap(MSG.produto(p, q));
  $("#f-share").onclick = () => compartilhar(p);
  $("#f-lista").onclick = () => {
    fecharFolha(); adicionar(p.id, q);
  };
}

function verLista() {
  const desenhar = () => {
    const itens = itensLista();
    if (!itens.length) { fecharFolha(); return; }
    const total = itens.reduce((s, { p, q }) => s + p.p * q, 0);
    abrirFolha(`<h2>Sua lista</h2>${itens.map(({ p, q }) => `<div class="item"><span class="ft"><img src="${foto(p)}" alt=""></span>
      <div><b>${esc(p.nome)}</b><small>${brl(p.p)} cada</small></div>
      <div class="passo"><button type="button" data-li="${p.id}" data-d="-1" aria-label="Diminuir">${q === 1 ? "×" : "−"}</button><b>${q}</b><button type="button" data-li="${p.id}" data-d="1" aria-label="Aumentar">+</button></div></div>`).join("")}
      <div class="total"><span>Total</span><b>${brl(total)}</b></div>
      ${(() => { const m = (typeof META !== "undefined" ? META : {}); if (!m.valor) return ""; const falta = m.valor - total, pc = Math.min(100, total / m.valor * 100);
        return `<div class="meta ${falta <= 0 ? "ok" : ""}"><p>${falta > 0 ? `Faltam <b>${brl(falta)}</b> para ganhar ${esc(m.premio)}` : `Você ganhou <b>${esc(m.premio)}</b>!`}</p><div class="meta-barra"><i style="width:${pc}%"></i></div></div>`; })()}
      ${cupomOk() ? `<p class="l-cupom">Cupom <b>${esc(CUPOM.codigo)}</b> · ${esc(CUPOM.texto)} — já vai na mensagem</p>` : ""}
      <button class="btn btn-zap btn-largo" type="button" id="l-zap"><svg viewBox="0 0 24 24"><use href="#i-zap"/></svg>Enviar lista no WhatsApp</button>`, "Sua lista");
    folha.querySelectorAll("[data-li]").forEach(b => b.onclick = () => {
      const i = lista.find(x => x.id === Number(b.dataset.li)); if (!i) return;
      i.q += Number(b.dataset.d); if (i.q < 1) lista = lista.filter(x => x !== i);
      salvarLista(); desenhar();
    });
    $("#l-zap").onclick = () => abrirZap(MSG.lista(itensLista()));
  };
  desenhar();
}
$("#btn-lista").addEventListener("click", () => { if (lista.length) verLista(); else avisar("Sua lista está vazia"); });
function adicionar(id, q = 1) {
  const i = lista.find(x => x.id === id); if (i) i.q = Math.min(99, i.q + q); else lista.push({ id, q });
  salvarLista(); avisar("Adicionado à lista");
  const b = $("#lista-qtd"); b.classList.remove("pulo"); void b.offsetWidth; b.classList.add("pulo");
}

/* ---------- Menu lateral ---------- */
const menu = $("#menu"), menuFundo = $("#menu-fundo");
let menuAberto = false;
function abrirMenu() {
  menuAberto = true; menu.hidden = false; document.body.classList.add("travado");
  $("#btn-menu").setAttribute("aria-expanded", "true");
  requestAnimationFrame(() => { menu.classList.add("on"); menuFundo.classList.add("on"); });
}
function fecharMenu() {
  if (!menuAberto) return; menuAberto = false;
  menu.classList.remove("on"); menuFundo.classList.remove("on");
  if (!aberta) document.body.classList.remove("travado");
  $("#btn-menu").setAttribute("aria-expanded", "false");
  setTimeout(() => { if (!menuAberto) menu.hidden = true; }, 300);
}
$("#btn-menu").addEventListener("click", abrirMenu);
$("#menu-fechar").addEventListener("click", fecharMenu);
menuFundo.addEventListener("click", fecharMenu);
$("#menu-lista").addEventListener("click", () => { fecharMenu(); $("#btn-lista").click(); });

/* página "Como comprar" (abre como folha) */
const INFO = {
  como: () => `<h2>Como comprar pelo site</h2>
    <p class="sub">É um catálogo: você escolhe aqui e fecha o pedido com a gente pelo WhatsApp.</p>
    <ol class="info-passos">
      <li><b>1</b><div><strong>Escolha os produtos</strong><span>Use a busca, as abas ou as ofertas. Toque no produto para ver foto, preço e modelos parecidos.</span></div></li>
      <li><b>2</b><div><strong>Monte sua lista</strong><span>Toque no <em>+</em> ou em “Adicionar à lista”. A lista fica no carrinho, no topo da tela.</span></div></li>
      <li><b>3</b><div><strong>Envie no WhatsApp</strong><span>Abra a lista e toque em “Enviar lista no WhatsApp”. A mensagem já vai pronta com os produtos e o total.</span></div></li>
      <li><b>4</b><div><strong>Combine com a gente</strong><span>Confirmamos estoque, preço, pagamento e como você vai receber ou retirar.</span></div></li>
    </ol>
    <div class="info-perg"><strong>Preciso pagar pelo site?</strong><span>Não. O pagamento é combinado direto com a loja pelo WhatsApp.</span></div>
    <div class="info-perg"><strong>Não achei o que procuro.</strong><span>Fale com a gente: a loja tem mais produtos do que os que aparecem aqui.</span></div>
    <button class="btn btn-zap btn-largo" type="button" data-zap="geral"><svg viewBox="0 0 24 24"><use href="#i-zap"/></svg>Falar no WhatsApp</button>`,
};

/* ---------- Aviso antes de sair (uma vez por visita) ---------- */
function antesDeSair() {
  if (sessao.get("rommo_sair")) return false;
  sessao.set("rommo_sair", "1");
  const itens = itensLista();
  const ofertas = PRODUTOS.filter(desc).sort((a, b) => desc(b) - desc(a));
  if (itens.length) {
    abrirFolha(`<h2>Sua lista não foi enviada</h2><p class="sub">${itens.length} ${itens.length === 1 ? "produto esperando" : "produtos esperando"}. Envie e a gente já separa pra você.</p>
      <button class="btn btn-zap btn-largo" type="button" id="s-zap"><svg viewBox="0 0 24 24"><use href="#i-zap"/></svg>Enviar lista no WhatsApp</button>
      <button class="sair-outra" type="button" id="s-sair">Sair mesmo assim</button>`, "Antes de sair");
  } else {
    const temOferta = ofertas.length > 0;
    const mostra = temOferta ? ofertas : PRODUTOS.filter(p => p.destaque && p.est > 0).slice(0, 8);
    abrirFolha(`<h2>Antes de ir, veja ${temOferta ? "as ofertas" : "os destaques"}</h2><p class="sub">${temOferta ? relogioTexto(true) : "Os produtos mais procurados da ROMMO."}</p><div class="trilho">${mostra.map(cartao).join("")}</div>
      <button class="btn btn-escuro btn-largo" type="button" id="s-ver"><svg viewBox="0 0 24 24"><path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/></svg>${temOferta ? "Ver todas as ofertas" : "Ver os destaques"}</button>
      <button class="sair-outra" type="button" id="s-sair">Sair mesmo assim</button>`, "Antes de sair");
    /* fica no site: abre as ofertas (ou os destaques) */
    $("#s-ver").onclick = () => {
      fecharFolha(); guarda = true;
      try { history.pushState({ rommo: 1 }, ""); } catch {}
      if (temOferta) abrirLoja("ofertas", false, "ofertas");
      else { const o = $("#ofertas"); if (o) scrollTo({ top: o.getBoundingClientRect().top + scrollY - 70, behavior: reduz ? "auto" : "smooth" }); }
    };
  }
  if ($("#s-zap")) $("#s-zap").onclick = () => abrirZap(MSG.lista(itens));
  $("#s-sair").onclick = () => { fecharFolha(); history.back(); };
  return true;
}
let guarda = false;
function armarGuarda() { if (guarda || sessao.get("rommo_sair")) return; try { history.pushState({ rommo: 1 }, ""); guarda = true; } catch {} }
addEventListener("popstate", () => {
  if (menuAberto) { fecharMenu(); try { history.pushState(lojaAberta ? { rommo: "loja" } : { rommo: 1 }, ""); } catch {} return; }
  if (aberta) { fecharFolha(); try { history.pushState(lojaAberta ? { rommo: "loja" } : { rommo: 1 }, ""); } catch {} return; }
  if (lojaAberta) { fecharLoja(); return; }
  guarda = false;
  if (!antesDeSair()) history.back();
});
document.addEventListener("mouseout", e => { if (!e.relatedTarget && e.clientY <= 0 && document.body.classList.contains("capa-fora") && !aberta) antesDeSair(); });

/* ---------- Relógio das ofertas (renova todo domingo 23h59) ---------- */
function fimSemana() { const d = new Date(); d.setHours(23, 59, 59, 0); d.setDate(d.getDate() + ((7 - d.getDay()) % 7)); return d; }
function relogioTexto(frase) {
  const alvo = campanhaAtiva() && CAMPANHA.fim ? new Date(CAMPANHA.fim) : fimSemana();
  let s = Math.max(0, Math.floor((alvo - Date.now()) / 1000));
  const d = Math.floor(s / 86400); s %= 86400; const h = Math.floor(s / 3600); s %= 3600; const m = Math.floor(s / 60);
  const t = d ? `${d}d ${h}h` : `${h}h ${String(m).padStart(2, "0")}min`;
  return frase ? `Os preços especiais acabam em ${t}.` : `Acaba em ${t}`;
}
const relogio = () => { $("#relogio").textContent = relogioTexto(); $("#dia-relogio").textContent = ateMeiaNoite(); };

/* ---------- Cliques ---------- */
function rolarPara(el) { const y = el.getBoundingClientRect().top + scrollY - 66; scrollTo({ top: Math.max(0, y), behavior: reduz ? "auto" : "smooth" }); }
document.addEventListener("click", e => {
  const t = e.target;
  if (menuAberto && t.closest("#menu a, #menu button")) fecharMenu();
  const inf = t.closest("[data-info]"); if (inf && INFO[inf.dataset.info]) { abrirFolha(INFO[inf.dataset.info](), "Como comprar"); return; }
  const ka = t.closest("[data-kit-add]"); if (ka) { const k = kitPorId(ka.dataset.kitAdd); if (k) adicionarKit(k); return; }
  const kv = t.closest("[data-kit]"); if (kv) { const k = kitPorId(kv.dataset.kit); if (k) verKit(k); return; }
  if (t.closest("#cupom")) { avisar(`Cupom ${CUPOM.codigo} já vai na sua mensagem`); return; }
  const z = t.closest("[data-zap]"); if (z) { abrirZap((MSG[z.dataset.zap] || MSG.geral)()); return; }
  const ad = t.closest("[data-add]"); if (ad) { adicionar(Number(ad.dataset.add)); ad.classList.add("ok"); setTimeout(() => ad.classList.remove("ok"), 900); return; }
  const pr = t.closest("[data-prod]"); if (pr) { verProduto(pr.dataset.prod); return; }
  const lj = t.closest("[data-loja]"); if (lj) { abrirLoja(lj.dataset.loja, lj.dataset.focar, lj.dataset.ordem); return; }
  if (t.closest("[data-fechar]") || t === fundo) { fecharFolha(); return; }
  const a = t.closest('a[href="#inicio"]'); if (a) { e.preventDefault(); if (lojaAberta) { history.back(); return; } scrollTo({ top: D, behavior: reduz ? "auto" : "smooth" }); }
});
addEventListener("keydown", e => { if (e.key === "Escape") { fecharFolha(); fecharMenu(); } });

/* ---------- Capa em tela cheia que encolhe até o palco ----------
   Mede só quando a largura muda (a barra do navegador do celular não bagunça a animação). */
const capa = $("#capa"), cImg = $(".capa-img"), cUi = $(".capa-ui"), palco = $("#inicio"), main = $("#app");
let D = 600, M = null, quadro = 0, larg = 0, alt = 0;
const suave = p => p * p * (3 - 2 * p);
function medir(forcar) {
  const w = document.documentElement.clientWidth;
  if (reduz || lojaAberta || (!forcar && w === larg)) return;
  larg = w; alt = innerHeight;
  D = Math.round(Math.min(alt * 0.8, 680));
  main.style.paddingTop = (D + 68) + "px";
  const r = palco.getBoundingClientRect();
  M = { t: r.top + scrollY, l: r.left, w: r.width, h: r.height };
  atualizar();
}
function atualizar() {
  quadro = 0; if (!M || lojaAberta) return;
  const y = scrollY, p = Math.min(1, Math.max(0, y / D));
  document.body.classList.toggle("capa-fora", p > 0.85);
  if (p >= 1) { capa.style.visibility = "hidden"; return; }
  capa.style.visibility = "";
  const e = suave(p), vw = document.documentElement.clientWidth, vh = alt, topo = M.t - y;
  const T = Math.max(0, topo) * e, L = M.l * e, R = Math.max(0, vw - M.l - M.w) * e, B = Math.max(0, vh - topo - M.h) * e;
  cImg.style.clipPath = `inset(${T.toFixed(1)}px ${R.toFixed(1)}px ${B.toFixed(1)}px ${L.toFixed(1)}px round ${(18 * e).toFixed(1)}px)`;
  cImg.style.opacity = p > 0.9 ? Math.max(0, 1 - (p - 0.9) / 0.1) : 1;
  cUi.style.opacity = Math.max(0, 1 - p * 3);
}
if (reduz) { capa.hidden = true; document.body.classList.add("capa-fora"); main.style.paddingTop = "72px"; }
else {
  addEventListener("scroll", () => { if (!quadro) quadro = requestAnimationFrame(atualizar); }, { passive: true });
  addEventListener("resize", () => medir(false));
  addEventListener("orientationchange", () => setTimeout(() => medir(true), 300));
  try { history.scrollRestoration = "manual"; } catch {}
}
addEventListener("scroll", () => { if (scrollY > 40) armarGuarda(); }, { passive: true });

/* ---------- Tela de carregamento ---------- */
function carregamento() {
  const L = $("#ld"), B = $("#ldb"), T = $("#ldp"), W = $("#ldw");
  const fim = () => { document.body.classList.remove("ldg"); document.body.classList.add("pronto"); setTimeout(abrirLink, 400); };
  if (!L) return fim();
  const DUR = reduz ? 600 : 4200, t0 = Date.now();
  let ok = false, saiu = false, fi = 0;
  const frases = ["Separando as ferramentas", "Ligando a irrigação", "Preparando o campo", "Conferindo as ofertas"];
  const giro = setInterval(() => { fi = (fi + 1) % frases.length; W.textContent = frases[fi]; W.animate?.([{ transform: "translateY(100%)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 360, easing: "cubic-bezier(.2,.8,.2,1)" }); }, 1000);
  const tick = setInterval(() => {
    const pr = Math.min((Date.now() - t0) / DUR, 1), v = ok && pr >= 1 ? 100 : Math.min(pr * 100, 96);
    B.style.width = v + "%"; T.textContent = Math.round(v) + "%";
    if (v >= 100 && !saiu) { saiu = true; clearInterval(tick); clearInterval(giro); setTimeout(() => { scrollTo(0, 0); L.classList.add("out"); fim(); setTimeout(() => L.remove(), 1000); }, 300); }
  }, 40);
  const pronto = () => { ok = true; };
  if (document.readyState === "complete") pronto(); else addEventListener("load", pronto);
  setTimeout(pronto, 6500);
}

/* ---------- Início ---------- */
montar(); carrossel(); grade(); salvarLista(); relogio(); setInterval(relogio, 30000);
if (!reduz) { scrollTo(0, 0); medir(true); addEventListener("load", () => medir(true)); document.fonts?.ready.then(() => medir(true)); }
carregamento();
})();
