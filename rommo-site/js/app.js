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
let cat="todos",term="",cart=[],customerAccount=null,cartSyncTimer=null,cartSyncPending=false,cartSyncInFlight=false,customerMode="login",catalogReady=Promise.resolve(false);try{cart=JSON.parse(localStorage.getItem("rommo_cart")||"[]")}catch(e){}
function normalizeCartItems(items){const byId=new Map();for(const row of Array.isArray(items)?items:[]){const id=Number(row?.id??row?.product_id??row?.productId),quantity=Number(row?.q??row?.quantity);if(!Number.isInteger(id)||id<1||!Number.isInteger(quantity)||quantity<1)continue;const current=byId.get(id);if(current)current.q=Math.min(999,current.q+quantity);else byId.set(id,{id,q:Math.min(999,quantity),obs:String(row?.obs??row?.note??'').slice(0,500)})}return [...byId.values()]}
function mergeCartItems(localItems,accountItems,sameAccount){const merged=new Map();for(const item of normalizeCartItems(accountItems))merged.set(item.id,{...item});for(const item of normalizeCartItems(localItems)){const current=merged.get(item.id);if(!current)merged.set(item.id,{...item});else{current.q=Math.min(999,sameAccount?Math.max(current.q,item.q):current.q+item.q);current.obs=item.obs||current.obs}}return [...merged.values()]}
try{cart=normalizeCartItems(cart).filter(i=>P.some(p=>p.id===i.id))}catch(e){cart=[]}
const save=(options={})=>{cart=normalizeCartItems(cart).filter(i=>P.some(p=>p.id===i.id));try{localStorage.setItem("rommo_cart",JSON.stringify(cart));if(customerAccount)localStorage.setItem("rommo_cart_owner",String(customerAccount.id));else if(options.guestEdit)localStorage.removeItem("rommo_cart_owner")}catch(e){};if(options.sync!==false)scheduleCustomerCartSync()};
async function customerApi(path,opts={}){const r=await fetch('/api/customer'+path,{credentials:'same-origin',headers:{'Content-Type':'application/json',...(opts.headers||{})},...opts});let d={};try{d=await r.json()}catch{}if(!r.ok){const error=new Error(d.error||'Não foi possível concluir.');error.status=r.status;throw error}return d}
function customerFeedback(msg,error=false){const signed=$('#customerSigned'),el=signed&&!signed.hidden?$('#customerSignedFeedback'):$('#customerFeedback');if(el){el.textContent=msg;el.dataset.error=error?'1':'0'}}
function customerErrorMessage(error){return ({credenciais_invalidas:'E-mail ou senha incorretos.',email_ja_cadastrado:'Já existe uma conta com este e-mail.',dados_invalidos:'Confira os dados. A senha precisa ter pelo menos 10 caracteres.',nao_autorizado:'Sua sessão expirou. Entre novamente.'})[error.message]||error.message}
function setCustomerMode(mode){customerMode=mode;document.querySelectorAll('[data-customer-mode]').forEach(b=>b.classList.toggle('active',b.dataset.customerMode===mode));$('#customerNameWrap').hidden=mode!=='register';$('#customerPhoneWrap').hidden=mode!=='register';$('#customerConsentWrap').hidden=mode!=='register';$('#customerForm').elements.name.required=mode==='register';$('#customerForm').elements.phone.required=mode==='register';$('#customerForm').elements.password.autocomplete=mode==='register'?'new-password':'current-password';$('#customerSubmit').textContent=mode==='register'?'Criar conta':'Entrar';customerFeedback('')}
function openCustomerAccount(){const m=$('#customerModal');m.classList.add('open');m.setAttribute('aria-hidden','false');if(customerAccount)renderCustomerSigned();else setCustomerMode('login')}
function closeCustomerAccount(){const m=$('#customerModal');m.classList.remove('open');m.setAttribute('aria-hidden','true')}
function renderCustomerSigned(){if(!customerAccount)return;$('#customerForm').hidden=true;$('#customerSigned').hidden=false;$('#customerSigned').innerHTML=`<p>Você entrou como <b>${escapeCustomer(customerAccount.name)}</b>.</p><p>${escapeCustomer(customerAccount.email)}</p><p>${escapeCustomer(customerAccount.phone||'')}</p><p>Seu carrinho está salvo nesta conta.</p><label class="customer-consent"><input id="customerConsentPreference" type="checkbox" ${customerAccount.marketingConsent?'checked':''}> Aceito receber lembretes sobre produtos que deixei no carrinho pelo WhatsApp.</label><p id="customerSignedFeedback" class="customer-signed-feedback" role="status"></p><button type="button" class="btn" id="customerSavePreference">Salvar preferência</button><button type="button" class="btn ol" id="customerLogout">Sair da conta</button>`;$('#customerSavePreference').onclick=async e=>{const b=e.currentTarget;b.disabled=true;try{const d=await customerApi('/preferences',{method:'PATCH',body:JSON.stringify({marketingConsent:$('#customerConsentPreference').checked})});customerAccount.marketingConsent=d.marketingConsent;customerFeedback('Preferência de mensagens atualizada.')}catch(err){customerFeedback(customerErrorMessage(err),true)}finally{b.disabled=false}};$('#customerLogout').onclick=async()=>{const b=$('#customerLogout');b.disabled=true;try{await customerApi('/logout',{method:'POST',body:'{}'});customerAccount=null;$('#customerForm').hidden=false;$('#customerSigned').hidden=true;setCustomerMode('login');customerFeedback('Você saiu da conta.')}catch(err){customerFeedback(customerErrorMessage(err),true);b.disabled=false}}}
function escapeCustomer(v){return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function scheduleCustomerCartSync(){if(!customerAccount)return;clearTimeout(cartSyncTimer);cartSyncTimer=setTimeout(syncCustomerCart,450)}
async function syncCustomerCart(){if(!customerAccount)return;if(cartSyncInFlight){cartSyncPending=true;return}cartSyncInFlight=true;try{do{cartSyncPending=false;const items=normalizeCartItems(cart).map(i=>({productId:i.id,quantity:i.q,note:i.obs}));await customerApi('/cart',{method:'PUT',body:JSON.stringify({items})})}while(cartSyncPending&&customerAccount)}catch(e){console.warn('Carrinho ainda não sincronizado:',e.message)}finally{cartSyncInFlight=false}}
async function loadCustomerAccount(){try{await catalogReady;const d=await customerApi('/me');customerAccount=d.customer;const saved=await customerApi('/cart');const sameAccount=localStorage.getItem('rommo_cart_owner')===String(customerAccount.id),remote=normalizeCartItems(saved.items||[]).filter(i=>P.some(p=>p.id===i.id));cart=mergeCartItems(cart,remote,sameAccount).filter(i=>P.some(p=>p.id===i.id));const needsSync=JSON.stringify(normalizeCartItems(cart))!==JSON.stringify(remote);save({sync:needsSync});drawCart();if($('#customerModal')?.classList.contains('open'))renderCustomerSigned()}catch(e){customerAccount=null;if(e.status===401){try{localStorage.removeItem('rommo_cart_owner')}catch{}}}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-customer-mode]');if(b)setCustomerMode(b.dataset.customerMode)});
$('#customerForm')?.addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget,b=$('#customerSubmit');b.disabled=true;b.textContent='Aguarde…';try{await catalogReady;const payload={email:f.elements.email.value.trim(),password:f.elements.password.value};const path=customerMode==='register'?'/register':'/login';if(customerMode==='register'){payload.name=f.elements.name.value.trim();payload.phone=f.elements.phone.value.trim();payload.marketingConsent=!!f.elements.consent.checked}const d=await customerApi(path,{method:'POST',body:JSON.stringify(payload)});customerAccount=d.customer;$('#customerForm').hidden=true;renderCustomerSigned();customerFeedback('Conta conectada.');if(customerMode==='register'){save({sync:false});await syncCustomerCart()}else await loadCustomerAccount();closeCustomerAccount()}catch(err){customerFeedback(customerErrorMessage(err),true)}finally{b.disabled=false;b.textContent=customerMode==='register'?'Criar conta':'Entrar'}});
$('#customerModal')?.addEventListener('click',e=>{if(e.target.id==='customerModal')closeCustomerAccount()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#customerModal')?.classList.contains('open'))closeCustomerAccount()});

const pct=p=>p.o?Math.round((1-p.p/p.o)*100):0;
/* imagens: aceita .jpg .jpeg .png .webp (testa uma por uma) */
const EXTS=[".jpg",".jpeg",".png",".webp"];
function achaImg(src,cb){const base=src.replace(/\.(jpe?g|png|webp)$/i,""),l=[src,...EXTS.map(e=>base+e)];(function t(i){if(i>=l.length)return;const im=new Image();im.onload=()=>cb(l[i]);im.onerror=()=>t(i+1);im.src=l[i]})(0)}
function aplicaImgs(){document.querySelectorAll("[data-img]").forEach(el=>{achaImg(el.dataset.img,u=>{el.style.backgroundImage=`url("${u}")`;el.classList.add("carregou")})})}
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
 drawOffers();
}
function drawOffers(){
 const offers=P.filter(p=>Number(p.o)>Number(p.p)&&Number(p.o)>0).slice(0,3);
 $("#og").innerHTML=offers.length?offers.map(card).join(""):`<div class="offers-empty"><strong>Novidades chegando</strong><span>As ofertas serão exibidas aqui assim que houver descontos cadastrados.</span><button class="btn ol" onclick="setCat('todos')">Ver todos os produtos</button></div>`;
}
function showOffers(){drawOffers();go("ofertas")}
function drawProducts(){
 $("#tabs").innerHTML=CATS.map(c=>`<button class="${c.id===cat?"on":""}" onclick="setCat('${c.id}',1)">${c.n}</button>`).join("");
 const l=P.filter(p=>(cat==="todos"||p.cat===cat)&&(p.n+" "+cc(p.cat).n).toLowerCase().includes(term));
 $("#pt").textContent=term?`Resultados para “${term}”`:cat==="todos"?"Todos os produtos":cc(cat).n;
 $("#grid").innerHTML=l.length?l.map(card).join(""):`<p class="empty">Nenhum produto encontrado. Tente outra busca.</p>`;
 reveal();
}
const go=id=>document.getElementById(id).scrollIntoView({behavior:"smooth"});
function setCat(id,stay){cat=id;term="";const q=$("#q");if(q)q.value="";drawProducts();if(!stay)go("produtos")}
/* banner */
let hi=0,ht;
function drawHero(){
 $("#hero").innerHTML=HERO.map((s,i)=>`<div class="sl ${i?"":"on"} ${s.soImagem?"io":""}" style="--c:${s.c}"><div class="bg" data-img="${s.img}"></div><div class="w"><span class="hero-eyebrow"><i></i> BOM VIZINHO <b>•</b> FERRAMENTAS & EQUIPAMENTOS</span><h1>${s.t}</h1><p>${s.p}</p><button class="btn hero-cta" onclick="setCat('${s.cat}')">${s.b}<span aria-hidden="true">↗</span></button><div class="hero-proof"><span>●</span> Produtos para casa, obra e agro</div></div></div>`).join("");
 aplicaImgs();ht=setInterval(()=>hg(hi+1),6500);
}
function hg(n){hi=(n+HERO.length)%HERO.length;document.querySelectorAll(".sl").forEach((e,i)=>e.classList.toggle("on",i===hi));document.querySelectorAll(".dots button").forEach((e,i)=>e.classList.toggle("on",i===hi));clearInterval(ht);ht=setInterval(()=>hg(hi+1),6500)}
/* carrinho */
function add(id){const it=cart.find(i=>Number(i.id)===Number(id));it?it.q=Math.min(999,it.q+1):cart.push({id:Number(id),q:1,obs:""});save({guestEdit:true});drawCart();$("#mn").textContent=P.find(p=>p.id===id).n;$("#ov").classList.add("on");$("#md").classList.add("on");
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
function comprar(id){closeProduct();if(!cart.find(i=>Number(i.id)===Number(id)))cart.push({id:Number(id),q:1,obs:""});save({guestEdit:true});drawCart();openCheckout()}
function chg(id,d){const it=cart.find(i=>Number(i.id)===Number(id));if(!it)return;it.q+=d;if(it.q<1)cart=cart.filter(i=>Number(i.id)!==Number(id));save({guestEdit:true});drawCart()}
const rem=id=>{cart=cart.filter(i=>Number(i.id)!==Number(id));save({guestEdit:true});drawCart()},obs=(id,v)=>{const item=cart.find(i=>Number(i.id)===Number(id));if(!item)return;item.obs=v;save({guestEdit:true})};
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
$("#q").addEventListener("input",e=>{term=e.target.value.toLowerCase().trim();cat="todos";drawProducts();if(term)go("produtos")});
const searchToggle=$("#searchToggle"),searchForm=$("#searchForm"),searchClose=$("#searchClose");
function toggleSearch(force){const open=typeof force==="boolean"?force:!document.body.classList.contains("search-open");document.body.classList.toggle("search-open",open);searchToggle?.setAttribute("aria-expanded",String(open));if(open){setTimeout(()=>$("#q")?.focus(),80)}else{$("#q").value="";term="";drawProducts()}}
searchToggle?.addEventListener("click",()=>toggleSearch());searchClose?.addEventListener("click",()=>toggleSearch(false));
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeAll();closeProduct();toggleSearch(false)}});
drawHero();drawStatic();drawProducts();drawCart();aplicaImgs();reveal();
/* Sincroniza a vitrine com o catálogo ativo do banco. A lista local continua como fallback se a API estiver indisponível. */
catalogReady=(async function syncCatalogFromServer(){
 try{
  const response=await fetch('/api/products',{credentials:'same-origin',headers:{'Accept':'application/json'}});
  if(!response.ok) return false;
  const payload=await response.json();
  if(!Array.isArray(payload.products)) return false;
  const categoryMap={'elétricas':'eletricas','eletricas':'eletricas','manuais':'manuais','kits':'kits','irrigação':'irrigacao','irrigacao':'irrigacao','agropecuária':'agro','agro':'agro','jardim':'jardim','construção':'construcao','construcao':'construcao','limpeza':'limpeza','segurança':'manuais'};
  const slugify=s=>String(s||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const serverProducts=payload.products.map(p=>{
   const raw=slugify(p.category),cat=categoryMap[raw]||raw.replace(/[^a-z0-9]+/g,'-');
   return {id:Number(p.id),cat,n:String(p.name||'Produto'),p:Number(p.price_cents||0)/100,o:null,r:0,v:0,img:p.image_url||'',description:p.description||'',stock:Number(p.stock||0),sku:p.sku||''};
  }).filter(p=>Number.isInteger(p.id)&&p.id>0&&Number.isFinite(p.p)&&p.p>=0);
  if(!serverProducts.length) return false;
  P=serverProducts;
  /* Remove itens antigos do carrinho que não existem mais no catálogo ativo. */
  cart=cart.filter(item=>P.some(p=>p.id===Number(item.id)));
  save();drawStatic();drawProducts();drawCart();drawOffers();
  }catch(err){console.info('Catálogo local mantido; API indisponível.',err);return false}
})();
catalogReady.then(()=>loadCustomerAccount());
