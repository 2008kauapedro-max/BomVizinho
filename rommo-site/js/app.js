/* BomVizinho — catálogo, carrinho e navegação de produtos */
/* entrada ao rolar: só começa depois que a tela de carregamento sai */
let ready=!document.body.classList.contains("ldg");
const io="IntersectionObserver" in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){const el=e.target;io.unobserve(el);el.classList.add("vis");setTimeout(()=>{el.classList.remove("rv","vis");el.style.transitionDelay=""},1100)}}),{threshold:.1,rootMargin:"0px 0px -30px 0px"}):null;
function reveal(){if(!ready||!io)return;
 document.querySelectorAll(".sh,.cat,.card,.pb2,.lj,.bn>div,.cta .w").forEach(el=>{if(el.dataset.rv)return;el.dataset.rv=1;
  el.style.transitionDelay=Math.min([...el.parentNode.children].indexOf(el),8)*70+"ms";el.classList.add("rv");io.observe(el)})}
addEventListener("loaderdone",()=>{ready=true;reveal()},{once:true});setTimeout(()=>{if(!ready){ready=true;reveal()}},8000);
addEventListener("scroll",()=>document.querySelector("header").classList.toggle("sc",scrollY>60),{passive:true});
const $=s=>document.querySelector(s),brl=n=>n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const ic=(n)=>`<svg class="ic"><use href="#i-${n}"/></svg>`,cc=id=>CATS.find(c=>c.id===id)||{id,n:String(id||"Outros").replace(/-/g," "),i:"box"};
let cat="todos",term="",cart=[];try{cart=JSON.parse(localStorage.getItem("rommo_cart")||"[]")}catch(e){}
const save=()=>{try{localStorage.setItem("rommo_cart",JSON.stringify(cart))}catch(e){}};
const pct=p=>p.o?Math.round((1-p.p/p.o)*100):0;
/* imagens: aceita .jpg .jpeg .png .webp (testa uma por uma) */
const EXTS=[".jpg",".jpeg",".png",".webp"];
function achaImg(src,cb){const base=src.replace(/\.(jpe?g|png|webp)$/i,""),l=[src,...EXTS.map(e=>base+e)];(function t(i){if(i>=l.length)return;const im=new Image();im.onload=()=>cb(l[i]);im.onerror=()=>t(i+1);im.src=l[i]})(0)}
function aplicaImgs(){document.querySelectorAll("[data-img]").forEach(el=>{achaImg(el.dataset.img,u=>{el.style.backgroundImage=`url("${u}")`+(el.dataset.fb?","+el.dataset.fb:"");el.classList.add("carregou")})})}
function imgErr(el){const b=el.dataset.b;if(!b){el.remove();return}const L=[".png",".jpg",".jpeg",".webp"],n=(+el.dataset.n||0)+1;if(n>=L.length){el.remove();return}el.dataset.n=n;el.src=b+L[n]}
const productImageFor=p=>{
 const s=String(p.n||"").toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
 const rules=[
  [/pulverizador|bomba costal/ ,"pulverizador-agricola.jpg"],
  [/trena|fita metrica/ ,"trena-profissional.jpg"],
  [/furadeira|parafusadeira|broca/ ,"furadeira-de-impacto.jpg"],
  [/mangueira|irrigacao|gotejamento/ ,"mangueira-para-jardim.jpg"],
  [/tesoura de poda|poda/ ,"tesoura-de-poda.jpg"],
  [/maleta|kit de ferramentas|jogo de ferramentas|ferramentas completo/ ,"maleta-de-ferramentas.jpg"],
  [/chaves|bits|soquete/ ,"jogo-de-chaves.jpg"],
  [/oculos de protecao|oculos|protecao ocular/ ,"oculos-de-protecao.jpg"]
 ];
 const match=rules.find(([re])=>re.test(s));
 return match?`assets/produtos/${match[1]}`:(p.img||`assets/produtos/${p.id}.png`);
};
const img=p=>{const src=productImageFor(p);return `<div class="pi" onclick="openProduct(${p.id})" role="button" tabindex="0" aria-label="Ver detalhes de ${p.n}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openProduct(${p.id})}">${ic(cc(p.cat).i)}<img src="${src}" alt="${p.n}" loading="lazy" onerror="imgErr(this)"></div>`};
const stars=r=>Array.from({length:5},(_,i)=>`<svg class="ic ${i<Math.round(r)?"f":""}" style="${i<Math.round(r)?"":"opacity:.3"}"><use href="#i-star"/></svg>`).join("");
const card=p=>{const d=pct(p),b=d?`-${d}% OFF`:p.t,bc=d?"":p.tc||"";
 return`<article class="card"><div class="product-visual-wrap">${b?`<span class="bd ${bc}">${b}</span>`:""}${img(p)}</div>
 <div class="pb"><small>${cc(p.cat).n}</small><h3 class="product-title" onclick="openProduct(${p.id})" role="button" tabindex="0" onkeydown="if(event.key==='Enter'){openProduct(${p.id})}">${p.n}</h3><div class="st"><em>Consulte disponibilidade</em></div>
 <div class="old">${p.o?`De: <s>${brl(p.o)}</s>`:""}</div><div class="pr"><small>R$</small>${p.p.toLocaleString("pt-BR",{minimumFractionDigits:2})}</div>
 <div class="bt"><button class="btn" onclick="comprar(${p.id})">Comprar agora</button><button class="btn ol" onclick="add(${p.id})">${ic("cart")}Adicionar ao carrinho</button></div></div></article>`};
function drawStatic(){
 $("#nav").innerHTML=CATS.slice(1).map(c=>`<a href="#" onclick="setCat('${c.id}');return false">${c.n}</a>`).join("");
 $("#cg").innerHTML=CATS.slice(1).map(c=>`<button class="cat" onclick="setCat('${c.id}')"><div class="c">${ic(c.i)}<img src="assets/categorias/${c.id}.png" data-b="assets/categorias/${c.id}" alt="" onerror="imgErr(this)"></div>${c.n}</button>`).join("");
 $("#og").innerHTML=P.filter(p=>p.o).slice(0,5).map(card).join("");
}
function drawProducts(){
 $("#tabs").innerHTML=CATS.map(c=>`<button class="${c.id===cat?"on":""}" onclick="setCat('${c.id}',1)">${c.n}</button>`).join("");
 const l=P.filter(p=>(cat==="todos"||p.cat===cat)&&(p.n+cc(p.cat).n).toLowerCase().includes(term));
 $("#pt").textContent=cat==="todos"?"Principais ofertas para você":cc(cat).n;
 $("#grid").innerHTML=l.length?l.map(card).join(""):`<p class="empty">Nenhum produto encontrado. Tente outra busca.</p>`;
 reveal();
}
const go=id=>document.getElementById(id).scrollIntoView({behavior:"smooth"});
function setCat(id,stay){cat=id;drawProducts();if(!stay)go("produtos")}
/* banner */
let hi=0,ht;
function drawHero(){
 $("#hero").innerHTML=HERO.map((s,i)=>`<div class="sl ${i?"":"on"} ${s.soImagem?"io":""}" style="--c:${s.c}"><div class="bg" data-img="${s.img}"></div><div class="w"><span class="hero-eyebrow"><i></i> BOM VIZINHO <b>•</b> FERRAMENTAS & EQUIPAMENTOS</span><h1>${s.t}</h1><p>${s.p}</p><button class="btn hero-cta" onclick="setCat('${s.cat}')">${s.b}<span aria-hidden="true">↗</span></button><div class="hero-proof"><span>●</span> Produtos para casa, obra e agro</div></div></div>`).join("");
 aplicaImgs();ht=setInterval(()=>hg(hi+1),6500);
}
function hg(n){hi=(n+HERO.length)%HERO.length;document.querySelectorAll(".sl").forEach((e,i)=>e.classList.toggle("on",i===hi));document.querySelectorAll(".dots button").forEach((e,i)=>e.classList.toggle("on",i===hi));clearInterval(ht);ht=setInterval(()=>hg(hi+1),6500)}
/* carrinho */
function add(id){const it=cart.find(i=>i.id===id);it?it.q++:cart.push({id,q:1,obs:""});save();drawCart();$("#mn").textContent=P.find(p=>p.id===id).n;$("#ov").classList.add("on");$("#md").classList.add("on");
 document.querySelectorAll(".cnt").forEach(c=>{c.classList.remove("bump");void c.offsetWidth;c.classList.add("bump")})}
/* Detalhe de produto: ficha, compra e produtos relacionados */
function openProduct(id){
 const p=P.find(x=>x.id===id);if(!p)return;
 const related=P.filter(x=>x.id!==id&&(x.cat===p.cat||x.cat!==p.cat)).slice(0,4);
 const d=pct(p),old=p.o?`<div class="detail-old">De <s>${brl(p.o)}</s>${d?` · ${d}% de desconto`:''}</div>`:'';
 const image=p.img||`assets/produtos/${p.id}.png`;
 const desc=p.desc||`Produto da categoria ${cc(p.cat)?.n||'geral'}. Confira as especificações, compatibilidade, medidas, conteúdo da embalagem e garantia com a equipe BomVizinho antes de finalizar a compra. As informações técnicas detalhadas devem ser confirmadas conforme o modelo exato do produto.`;
 $('#detailContent').innerHTML=`<div class="detail-layout"><div><div class="detail-image">${ic(cc(p.cat)?.i||'box')}<img src="${image}" alt="${p.n}" onerror="imgErr(this)"></div></div><div class="detail-info"><div class="detail-category">${cc(p.cat)?.n||'Produto'}</div><h1 id="detailTitle">${p.n}</h1><div class="detail-price">${brl(p.p)}</div>${old}<div class="detail-stock">✓ Disponibilidade e prazo confirmados pela equipe antes do envio.<br>🚚 Envio para todo o Brasil sujeito à cotação de frete por CEP.</div><div class="detail-actions"><button class="btn" onclick="comprar(${p.id})">Comprar agora</button><button class="btn ol" onclick="add(${p.id});closeProduct()">Adicionar ao carrinho</button></div><div class="detail-description"><h3>Sobre este produto</h3><p>${desc}</p><p><strong>Entrega:</strong> informe seu CEP durante a finalização para consultar as opções disponíveis. O valor final do frete será confirmado antes do pagamento até a integração com a transportadora estar configurada.</p><p><strong>Precisa de ajuda?</strong> Nossa equipe pode confirmar detalhes técnicos e compatibilidade.</p></div><button class="btn ol" style="margin-top:14px;width:100%" onclick="wa('Olá! Tenho uma dúvida sobre: ${String(p.n).replace(/'/g,"\'")}')">Consultar produto pelo WhatsApp</button></div></div><section class="detail-related"><h2>Você também pode gostar</h2><div class="grid">${related.map(card).join('')}</div></section>`;
 const view=$('#productDetail');view.classList.add('on');view.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';history.replaceState(null,'',`#produto-${id}`);view.scrollTop=0;
}
function closeProduct(){const view=$('#productDetail');view.classList.remove('on');view.setAttribute('aria-hidden','true');document.body.style.overflow='';if(location.hash.startsWith('#produto-'))history.replaceState(null,'',location.pathname+location.search)}
/* Comprar agora: coloca o produto no carrinho (se ainda não estiver) e vai direto para a finalização */
function comprar(id){closeProduct();if(!cart.find(i=>i.id===id))cart.push({id,q:1,obs:""});save();drawCart();openCheckout()}
function chg(id,d){const it=cart.find(i=>i.id===id);it.q+=d;if(it.q<1)cart=cart.filter(i=>i.id!==id);save();drawCart()}
const rem=id=>{cart=cart.filter(i=>i.id!==id);save();drawCart()},obs=(id,v)=>{cart.find(i=>i.id===id).obs=v;save()};
function drawCart(){
 const n=cart.reduce((a,i)=>a+i.q,0),t=cart.reduce((a,i)=>a+i.q*P.find(p=>p.id===i.id).p,0);
 $("#cnt").textContent=n;$("#cnt2").textContent=n;$("#tt").textContent=brl(t);$("#snd").disabled=!n;
 if(document.activeElement&&document.activeElement.tagName==="TEXTAREA")return;
 $("#its").innerHTML=cart.length?cart.map(i=>{const p=P.find(x=>x.id===i.id);return`<div class="it">${img(p)}<div><h4>${p.n}</h4><div class="v">${brl(p.p)}</div><div class="rw"><div class="qt"><button onclick="chg(${p.id},-1)" aria-label="Diminuir">−</button><span>${i.q}</span><button onclick="chg(${p.id},1)" aria-label="Aumentar">+</button></div><button class="rm" onclick="rem(${p.id})">Remover</button></div></div><textarea placeholder="Observação deste produto (cor, voltagem...)" oninput="obs(${p.id},this.value)">${i.obs}</textarea></div>`}).join(""):`<p class="empty">Seu carrinho está vazio.<br>Adicione produtos para começar.</p>`;
}
function openCart(){drawCart();$("#md").classList.remove("on");$("#ov").classList.add("on");$("#dr").classList.add("on")}
const closeAll=()=>["#ov","#md","#dr"].forEach(s=>$(s).classList.remove("on"));
/* abre o WhatsApp com a mensagem; só "\n" como quebra de linha (vira %0A na URL), sem alterar mais nada */
const wa=m=>{if(!WHATS){alert("O WhatsApp oficial da BomVizinho ainda precisa ser configurado pelo responsável pela loja.");return}window.open(`https://api.whatsapp.com/send?phone=${WHATS}&text=${encodeURIComponent(String(m).replace(/\r\n?/g,"\n"))}`,"_blank")};
$("#q").addEventListener("input",e=>{term=e.target.value.toLowerCase().trim();drawProducts();if(term)go("produtos")});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeAll();closeProduct()}});
drawHero();drawStatic();drawProducts();drawCart();aplicaImgs();reveal();
/* Sincroniza a vitrine com o catálogo ativo do banco. A lista local continua como fallback se a API estiver indisponível. */
(async function syncCatalogFromServer(){
 try{
  const response=await fetch('/api/products',{credentials:'same-origin',headers:{'Accept':'application/json'}});
  if(!response.ok) return;
  const payload=await response.json();
  if(!Array.isArray(payload.products)) return;
  const categoryMap={'elétricas':'eletricas','eletricas':'eletricas','manuais':'manuais','kits':'kits','irrigação':'irrigacao','irrigacao':'irrigacao','agropecuária':'agro','agro':'agro','jardim':'jardim','construção':'construcao','construcao':'construcao','limpeza':'limpeza','segurança':'manuais'};
  const slugify=s=>String(s||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const serverProducts=payload.products.map(p=>{
   const raw=slugify(p.category),cat=categoryMap[raw]||raw.replace(/[^a-z0-9]+/g,'-');
   return {id:Number(p.id),cat,n:String(p.name||'Produto'),p:Number(p.price_cents||0)/100,o:null,r:0,v:0,img:p.image_url||'',description:p.description||'',stock:Number(p.stock||0),sku:p.sku||''};
  }).filter(p=>Number.isInteger(p.id)&&p.id>0&&Number.isFinite(p.p)&&p.p>=0);
  if(!serverProducts.length) return;
  P=serverProducts;
  /* Remove itens antigos do carrinho que não existem mais no catálogo ativo. */
  cart=cart.filter(item=>P.some(p=>p.id===Number(item.id)));
  save();drawStatic();drawProducts();drawCart();
 }catch(err){console.info('Catálogo local mantido; API indisponível.',err)}
})();