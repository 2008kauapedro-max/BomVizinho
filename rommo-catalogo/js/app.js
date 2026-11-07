/* ROMMO — catálogo limpo: abertura, capa que encolhe, vitrine e pedido pelo WhatsApp */
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
const desc = p => (p.de && p.de > p.p ? Math.round((1 - p.p / p.de) * 100) : 0);
const guardar = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
const sessao = { get(k) { try { return sessionStorage.getItem(k); } catch { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch {} } };

/* ---------- WhatsApp ---------- */
function abrirZap(txt) {
  const url = `https://wa.me/${LOJA.whatsapp}?text=${encodeURIComponent(txt)}`;
  const w = window.open(url, "_blank", "noopener");
  if (!w) location.href = url;
}
const MSG = {
  geral: () => "Olá, ROMMO! Vim pelo catálogo e quero atendimento.",
  busca: () => `Olá, ROMMO! Procurei "${$("#busca").value.trim()}" no catálogo e não encontrei. Vocês têm?`,
  oferta: () => "Olá, ROMMO! Vi as ofertas da semana no catálogo e quero saber mais.",
  produto: (p, q) => `Olá, ROMMO! Quero este produto do catálogo:\n\n*${p.nome}*\nQuantidade: ${q}\nPreço: ${brl(p.p)} cada\n\nTem disponível?`,
  lista: itens => `Olá, ROMMO! Montei esta lista no catálogo:\n\n${itens.map(({ p, q }) => `• ${q}x ${p.nome} — ${brl(p.p * q)}`).join("\n")}\n\n*Total: ${brl(itens.reduce((s, { p, q }) => s + p.p * q, 0))}*\n\nTem tudo disponível?`,
};

/* ---------- Cartão (um modelo só) ---------- */
const etiqueta = p => desc(p) ? `<span class="etiqueta">-${desc(p)}%</span>` : p.novo ? `<span class="etiqueta novo">Novo</span>` : "";
const cartao = p => `<button class="cartao" type="button" data-prod="${p.id}">
  <span class="foto"><img src="${foto(p)}" alt="" loading="lazy" decoding="async" width="560" height="560">${etiqueta(p)}</span>
  <span class="nome">${esc(p.nome)}</span>
  <span class="preco">${brl(p.p)}${p.de ? `<span class="de">${brl(p.de)}</span>` : ""}</span>
</button>`;

/* ---------- Montagem ---------- */
let filtro = "";
function montar() {
  $("#atalhos").innerHTML = LINHAS.map(l => `<button class="atalho" type="button" data-linha="${l.id}" aria-pressed="false"><img src="${l.icone}" alt="" width="64" height="64">${l.nome}</button>`).join("");
  const ofertas = PRODUTOS.filter(desc).sort((a, b) => desc(b) - desc(a));
  $("#trilho-ofertas").innerHTML = ofertas.map(cartao).join("");
  $("#ofertas").hidden = !ofertas.length;
  const procurados = PRODUTOS.filter(p => (p.destaque || p.novo) && !p.de);
  $("#trilho-procurados").innerHTML = procurados.map(cartao).join("");
  $("#trilho-procurados").closest(".bloco").hidden = !procurados.length;

  if (INSTAGRAM_POSTS.length) {
    $("#insta-grade").innerHTML = INSTAGRAM_POSTS.slice(0, 6).map(p => `<a href="${esc(p.link)}" target="_blank" rel="noopener" aria-label="Ver post no Instagram"><img src="${esc(p.img)}" alt="" loading="lazy"></a>`).join("");
    $("#insta").hidden = false;
  }
  const ig = `https://www.instagram.com/${LOJA.instagram}/`;
  $("#c-insta").href = ig; $("#c-insta-txt").textContent = "@" + LOJA.instagram;
  $("#c-zap").textContent = LOJA.whatsappVisivel;
  $("#c-mapa").href = LOJA.mapa; $("#c-cidade").textContent = LOJA.cidade; $("#c-ref").textContent = LOJA.referencia || "Ver no mapa";
  $("#ano").textContent = new Date().getFullYear();
  grade();
}

/* ---------- Grade com filtro e busca ---------- */
const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
function grade() {
  const q = norm($("#busca").value.trim());
  const itens = PRODUTOS.filter(p => (!filtro || linhaDe(p.cat).id === filtro) && (!q || norm(p.nome).includes(q)));
  $("#grade").innerHTML = itens.map(cartao).join("");
  $("#vazio").hidden = itens.length > 0;
  $("#busca-limpa").hidden = !q;
  const l = LINHAS.find(x => x.id === filtro);
  $("#catalogo-titulo").textContent = q ? `Resultado para “${$("#busca").value.trim()}”` : l ? l.nome : "Todos os produtos";
  $("#ver-tudo").hidden = !q && !filtro;
  $("#vitrine").hidden = !!(q || filtro);
  $$(".atalho").forEach(b => { const on = b.dataset.linha === filtro; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
}
function escolherLinha(id) {
  filtro = filtro === id ? "" : id;
  $("#busca").value = "";
  grade();
  rolarPara($("#atalhos"));
}
$("#busca").addEventListener("input", () => { filtro = ""; grade(); });
$("#busca").addEventListener("keydown", e => { if (e.key === "Enter") { e.target.blur(); rolarPara($("#catalogo")); } });
$("#busca-limpa").addEventListener("click", () => { $("#busca").value = ""; grade(); $("#busca").focus(); });
$("#ver-tudo").addEventListener("click", () => { filtro = ""; $("#busca").value = ""; grade(); rolarPara($("#atalhos")); });

/* ---------- Lista ---------- */
let lista = guardar.get("rommo_lista", []).filter(i => porId(i.id));
const itensLista = () => lista.map(i => ({ p: porId(i.id), q: i.q }));
function salvarLista() {
  guardar.set("rommo_lista", lista);
  const n = lista.reduce((s, i) => s + i.q, 0);
  $("#lista-qtd").textContent = n; $("#btn-lista").hidden = !n;
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
    <h2 class="f-nome">${esc(p.nome)}</h2>
    <div class="f-preco"><b>${brl(p.p)}</b>${p.de ? `<s>${brl(p.de)}</s><em>Economize ${brl(p.de - p.p)}</em>` : ""}</div>
    <div class="f-qtd"><span>Quantidade</span><div class="passo"><button type="button" data-q="-1" aria-label="Diminuir">−</button><b id="f-q">1</b><button type="button" data-q="1" aria-label="Aumentar">+</button></div></div>
    <div class="f-acoes">
      <button class="btn btn-zap btn-largo" type="button" id="f-zap"><svg viewBox="0 0 24 24"><use href="#i-zap"/></svg>Pedir no WhatsApp</button>
      <button class="btn btn-claro btn-largo" type="button" id="f-lista">Adicionar à lista</button>
    </div>
    <p class="f-nota">Você confirma estoque e entrega com a gente pelo WhatsApp.</p>`, "Produto");
  folha.querySelectorAll("[data-q]").forEach(b => b.onclick = () => { q = Math.max(1, Math.min(99, q + Number(b.dataset.q))); $("#f-q").textContent = q; });
  $("#f-zap").onclick = () => abrirZap(MSG.produto(p, q));
  $("#f-lista").onclick = () => {
    const i = lista.find(x => x.id === p.id); if (i) i.q = Math.min(99, i.q + q); else lista.push({ id: p.id, q });
    salvarLista(); fecharFolha(); avisar("Adicionado à lista");
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
$("#btn-lista").addEventListener("click", verLista);

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
    abrirFolha(`<h2>Antes de ir, veja as ofertas</h2><p class="sub">${relogioTexto(true)}</p><div class="trilho">${ofertas.map(cartao).join("")}</div>
      <button class="btn btn-zap btn-largo" type="button" id="s-zap"><svg viewBox="0 0 24 24"><use href="#i-zap"/></svg>Falar no WhatsApp</button>
      <button class="sair-outra" type="button" id="s-sair">Sair mesmo assim</button>`, "Antes de sair");
  }
  $("#s-zap").onclick = () => abrirZap(itens.length ? MSG.lista(itens) : MSG.oferta());
  $("#s-sair").onclick = () => { fecharFolha(); history.back(); };
  return true;
}
let guarda = false;
function armarGuarda() { if (guarda || sessao.get("rommo_sair")) return; try { history.pushState({ rommo: 1 }, ""); guarda = true; } catch {} }
addEventListener("popstate", () => {
  guarda = false;
  if (aberta) { fecharFolha(); armarGuarda(); return; }
  if (!antesDeSair()) history.back();
});
document.addEventListener("mouseout", e => { if (!e.relatedTarget && e.clientY <= 0 && document.body.classList.contains("capa-fora") && !aberta) antesDeSair(); });

/* ---------- Relógio das ofertas (renova todo domingo 23h59) ---------- */
function fimSemana() { const d = new Date(); d.setHours(23, 59, 59, 0); d.setDate(d.getDate() + ((7 - d.getDay()) % 7)); return d; }
function relogioTexto(frase) {
  let s = Math.max(0, Math.floor((fimSemana() - Date.now()) / 1000));
  const d = Math.floor(s / 86400); s %= 86400; const h = Math.floor(s / 3600); s %= 3600; const m = Math.floor(s / 60);
  const t = d ? `${d}d ${h}h` : `${h}h ${String(m).padStart(2, "0")}min`;
  return frase ? `Os preços especiais acabam em ${t}.` : `Acaba em ${t}`;
}
const relogio = () => { $("#relogio").textContent = relogioTexto(); };

/* ---------- Cliques ---------- */
function rolarPara(el) { const y = el.getBoundingClientRect().top + scrollY - 66; scrollTo({ top: Math.max(0, y), behavior: reduz ? "auto" : "smooth" }); }
document.addEventListener("click", e => {
  const t = e.target;
  const z = t.closest("[data-zap]"); if (z) { abrirZap((MSG[z.dataset.zap] || MSG.geral)()); return; }
  const pr = t.closest("[data-prod]"); if (pr) { verProduto(pr.dataset.prod); return; }
  const li = t.closest("[data-linha]"); if (li) { escolherLinha(li.dataset.linha); return; }
  if (t.closest("[data-fechar]") || t === fundo) { fecharFolha(); return; }
  const a = t.closest('a[href="#inicio"]'); if (a) { e.preventDefault(); scrollTo({ top: D, behavior: reduz ? "auto" : "smooth" }); }
});
addEventListener("keydown", e => { if (e.key === "Escape") fecharFolha(); });

/* ---------- Capa em tela cheia que encolhe até o palco ----------
   Mede só quando a largura muda (a barra do navegador do celular não bagunça a animação). */
const capa = $("#capa"), cImg = $(".capa-img"), cUi = $(".capa-ui"), palco = $("#inicio"), main = $("#app");
let D = 600, M = null, quadro = 0, larg = 0, alt = 0;
const suave = p => p * p * (3 - 2 * p);
function medir(forcar) {
  const w = document.documentElement.clientWidth;
  if (!forcar && w === larg) return;
  larg = w; alt = innerHeight;
  D = Math.round(Math.min(alt * 0.8, 680));
  main.style.paddingTop = (D + 68) + "px";
  const r = palco.getBoundingClientRect();
  M = { t: r.top + scrollY, l: r.left, w: r.width, h: r.height };
  atualizar();
}
function atualizar() {
  quadro = 0; if (!M) return;
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
  const fim = () => { document.body.classList.remove("ldg"); document.body.classList.add("pronto"); };
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
montar(); salvarLista(); relogio(); setInterval(relogio, 30000);
if (!reduz) { scrollTo(0, 0); medir(true); addEventListener("load", () => medir(true)); document.fonts?.ready.then(() => medir(true)); }
carregamento();
})();
