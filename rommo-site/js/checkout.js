/* ROMMO – checkout: registra pedido na API Cloudflare e abre WhatsApp para continuidade do atendimento. */
const ck=document.getElementById("ck"),ckc=document.getElementById("ckc");
let ckSent=false,ckMsg="";
const $f=id=>document.getElementById("f-"+id),val=id=>($f(id)?$f(id).value.trim():"");
const dig=v=>v.replace(/\D/g,"");
const mTel=v=>{v=dig(v).slice(0,11);return v.length>10?`(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`:v.length>6?`(${v.slice(0,2)}) ${v.slice(2,6)}-${v.slice(6)}`:v.length>2?`(${v.slice(0,2)}) ${v.slice(2)}`:v}
const mCep=v=>{v=dig(v).slice(0,8);return v.length>5?v.slice(0,5)+"-"+v.slice(5):v}
const CAMPOS=["nome","tel","email","observacao","cep","rua","num","comp","bairro","cidade","uf","referencia","obsentrega"];
const lerSalvo=()=>{try{return JSON.parse(localStorage.getItem("rommo_cli")||"{}")}catch(e){return{}}};
const gravaSalvo=()=>{try{const o={};CAMPOS.forEach(c=>o[c]=val(c));localStorage.setItem("rommo_cli",JSON.stringify(o))}catch(e){}};
const totalCarrinho=()=>cart.reduce((a,i)=>a+i.q*P.find(p=>p.id===i.id).p,0);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

function lbl(id,txt,extra="",err="Campo obrigatório"){return`<label data-e="${err}" id="l-${id}">${txt}<input id="f-${id}" ${extra}></label>`}
function ckDraw(){
 const s=lerSalvo(),v=k=>esc(s[k]||"");
 const itens=cart.map(i=>{const p=P.find(x=>x.id===i.id);return`<div class="ri">${img(p)}<div><b>${p.n}</b><small>${i.q} x ${brl(p.p)}${i.obs?` • Obs: ${esc(i.obs)}`:""}</small></div><em>${brl(p.p*i.q)}</em></div>`}).join("");
 ckc.innerHTML=`<div class="ckh"><div class="w"><h1>Finalizar pedido</h1><p>Preencha seus dados para registrar o pedido e continuar o atendimento pelo WhatsApp.</p></div></div>
 <div class="w ckw"><form id="ckf" novalidate onsubmit="return false">
 <section class="cks"><h3><span>1</span>Seus dados</h3>
  <div class="g2">${lbl("nome","Nome completo *",`type="text" autocomplete="name" value="${v("nome")}"`)}${lbl("tel","WhatsApp / telefone *",`type="tel" inputmode="tel" autocomplete="tel" placeholder="(61) 90000-0000" value="${v("tel")}"`,"Informe um telefone com DDD")}</div>${lbl("email","E-mail (opcional)",`type="email" autocomplete="email" placeholder="voce@exemplo.com" value="${v("email")}"`)}<label id="l-observacao">Observação do pedido (opcional)<textarea id="f-observacao" maxlength="1000" rows="3" placeholder="Alguma informação importante para a equipe?">${v("observacao")}</textarea></label></section>
 <section class="cks"><h3><span>2</span>Entrega</h3>
  <div class="ops" id="ops-ent">${ENTREGAS.map((e,i)=>`<label class="op ${i?"":"sel"}"><input type="radio" name="ent" value="${e.v}" ${i?"":"checked"}><b>${e.t}</b><small>${e.s}</small></label>`).join("")}</div>
  <div id="endbox">
   <div class="cep">${lbl("cep","CEP *",`type="text" inputmode="numeric" autocomplete="postal-code" placeholder="00000-000" value="${v("cep")}"`,"Informe o CEP (8 números)")}<small id="cepst"></small></div>
   <div class="g3">${lbl("rua","Rua / avenida *",`type="text" autocomplete="address-line1" value="${v("rua")}"`)}${lbl("num","Número *",`type="text" value="${v("num")}"`,"Informe o número")}</div>
   ${lbl("comp","Complemento",`type="text" placeholder="Apto, bloco, casa..." value="${v("comp")}"`)}
   <div class="g4">${lbl("bairro","Bairro *",`type="text" value="${v("bairro")}"`)}${lbl("cidade","Cidade *",`type="text" autocomplete="address-level2" value="${v("cidade")}"`)}${lbl("uf","UF *",`type="text" maxlength="2" autocomplete="address-level1" value="${v("uf")}"`,"UF")}</div>
   ${lbl("referencia","Ponto de referência (opcional)",`type="text" placeholder="Ex.: perto do mercado, entrada da fazenda..." value="${v("referencia")}"`)}<label id="l-obsentrega">Observação da entrega (opcional)<textarea id="f-obsentrega" maxlength="500" rows="2" placeholder="Instruções para localizar o endereço ou combinar o recebimento">${v("obsentrega")}</textarea></label>
  </div></section>
 <section class="cks"><h3><span>3</span>Pagamento</h3>
  <div class="ops" id="ops-pag">${PAGAMENTOS.map(p=>`<label class="op"><input type="radio" name="pag" value="${p}"><b>${p}</b></label>`).join("")}</div>
  <div id="trocobox" hidden>${lbl("troco","Precisa de troco? Para quanto?",`type="text" inputmode="decimal" placeholder="Ex.: 200,00"`)}</div>
  <p class="nota">O pagamento é combinado com a nossa equipe no WhatsApp, junto com o valor do frete.</p>
  <p id="pagerr" style="color:#c63b32;font-size:13px;font-weight:600;margin-top:8px" hidden>Escolha uma forma de pagamento.</p></section>
 </form>
 <aside class="cksum"><h3>Resumo do pedido</h3><div class="rs">${itens}</div>
  <div class="tt"><p><span>Produtos</span><span>${brl(totalCarrinho())}</span></p><p><span>Frete</span><span>A combinar</span></p><div class="tot"><span>Total</span><b>${brl(totalCarrinho())}</b></div></div>
  <button class="btn wa" id="ckgo" onclick="ckEnviar()"><svg class="ic"><use href="#i-wa"/></svg>Registrar pedido e abrir WhatsApp</button>
  <span class="fn">Ao enviar, você concorda com os <a href="#/termos" style="color:var(--g);text-decoration:underline">Termos de uso</a> e a <a href="#/privacidade" style="color:var(--g);text-decoration:underline">Política de privacidade</a>.</span></aside></div>`;
 ckLiga();
}
function ckLiga(){
 $f("tel").addEventListener("input",e=>e.target.value=mTel(e.target.value));
 $f("cep").addEventListener("input",e=>{e.target.value=mCep(e.target.value);if(dig(e.target.value).length===8)buscaCep()});
 $f("uf").addEventListener("input",e=>e.target.value=e.target.value.toUpperCase().replace(/[^A-Z]/g,""));
 document.querySelectorAll("#ckf label.op input").forEach(r=>r.addEventListener("change",()=>{
  document.querySelectorAll(`#ckf input[name="${r.name}"]`).forEach(x=>x.closest(".op").classList.toggle("sel",x.checked));
  if(r.name==="ent")document.getElementById("endbox").hidden=r.value!==ENTREGAS[0].v;
  if(r.name==="pag"){document.getElementById("trocobox").hidden=r.value!=="Dinheiro";document.getElementById("pagerr").hidden=true}}));
 document.querySelectorAll("#ckf label[data-e] input").forEach(i=>i.addEventListener("input",()=>i.closest("label").classList.remove("bad")));
}
async function buscaCep(){
 const c=dig(val("cep")),st=document.getElementById("cepst");st.className="";st.textContent="Buscando endereço...";
 try{const r=await fetch(`https://viacep.com.br/ws/${c}/json/`),d=await r.json();
  if(d.erro){st.textContent="CEP não encontrado. Preencha o endereço manualmente.";return}
  if(d.logradouro)$f("rua").value=d.logradouro;if(d.bairro)$f("bairro").value=d.bairro;$f("cidade").value=d.localidade||"";$f("uf").value=d.uf||"";
  ["rua","bairro","cidade","uf"].forEach(k=>$f(k).closest("label").classList.remove("bad"));
  st.className="cepok";st.textContent="Endereço encontrado. Confira e informe o número.";$f("num").focus()}
 catch(e){st.textContent="Não foi possível buscar o CEP agora. Preencha manualmente."}
}
const ehEntrega=()=>document.querySelector('#ckf input[name="ent"]:checked').value===ENTREGAS[0].v;
function ckValida(){
 let primeiro=null;const marca=(id,ruim)=>{const l=document.getElementById("l-"+id);l.classList.toggle("bad",ruim);if(ruim&&!primeiro)primeiro=l};
 marca("nome",val("nome").length<3);marca("tel",dig(val("tel")).length<10);
 if(ehEntrega()){marca("cep",dig(val("cep")).length!==8);["rua","num","bairro","cidade"].forEach(k=>marca(k,!val(k)));marca("uf",val("uf").length!==2)}
 const pag=document.querySelector('#ckf input[name="pag"]:checked');document.getElementById("pagerr").hidden=!!pag;if(!pag&&!primeiro)primeiro=document.getElementById("ops-pag");
 if(primeiro){primeiro.scrollIntoView({behavior:"smooth",block:"center"});return false}return true;
}
function ckMonta(codigo=""){
 const ent=document.querySelector('#ckf input[name="ent"]:checked').value,casa=ent===ENTREGAS[0].v,pag=document.querySelector('#ckf input[name="pag"]:checked').value;
 const total=totalCarrinho(),qtd=cart.reduce((a,i)=>a+i.q,0);
 const linhas=[`PEDIDO ROMMO ${codigo}`,`Cliente: ${val("nome")}`,`WhatsApp: ${val("tel")}`,`Entrega: ${casa?"Entrega em endereço":"Retirada na loja"}`,`Pagamento: ${pag}`,`Itens: ${qtd} unidade(s) em ${cart.length} produto(s)`,`Produtos: ${brl(total)}`,`Frete: ${casa?"a combinar":"não se aplica (retirada)"}`,"Consulte os dados completos pelo código no painel ROMMO."];
 return linhas.filter(Boolean).join("\n");
}
let ckBusy=false;
async function ckEnviar(){
 if(!cart.length||ckBusy)return;if(!ckValida())return;
 const btn=document.getElementById("ckgo");ckBusy=true;if(btn){btn.disabled=true;btn.textContent="Registrando pedido…"}
 const waTab=window.open('about:blank','_blank');
 try{
  const ent=document.querySelector('#ckf input[name="ent"]:checked').value,casa=ent===ENTREGAS[0].v,pag=document.querySelector('#ckf input[name="pag"]:checked').value;
  const payload={idempotencyKey:(crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2)),customer:{name:val("nome"),phone:dig(val("tel")),email:val("email")},customerNote:[val("observacao")?`Observação do pedido: ${val("observacao")}`:"",casa&&val("referencia")?`Ponto de referência: ${val("referencia")}`:"",casa&&val("obsentrega")?`Observação da entrega: ${val("obsentrega")}` : ""].filter(Boolean).join("\n").slice(0,1000),delivery:{type:ent,postalCode:dig(val("cep")),street:val("rua"),number:val("num"),complement:val("comp"),district:val("bairro"),city:val("cidade"),state:val("uf")},payment:{method:pag,change:val("troco")},items:cart.map(i=>({productId:i.id,quantity:i.q,unitPriceCents:Math.round(P.find(p=>p.id===i.id).p*100),note:i.obs||""}))};
  const resp=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});let result={};try{result=await resp.json()}catch(e){}
  if(!resp.ok||!result.ok)throw new Error(result.error||'erro_registro');
  gravaSalvo();ckMsg=ckMonta(`#${result.code}`);if(waTab){waTab.location.href=`https://api.whatsapp.com/send?phone=${WHATS}&text=${encodeURIComponent(ckMsg)}`}else{wa(ckMsg)}ckSent=true;
  ckc.innerHTML=`<div class="ok2"><div class="ok"><svg class="ic"><use href="#i-ok"/></svg></div><h2>Pedido registrado!</h2><p>Seu pedido <strong>#${esc(result.code)}</strong> foi registrado. O WhatsApp vai abrir para você continuar o atendimento.</p><button class="btn wa" onclick="wa(ckMsg)"><svg class="ic"><use href="#i-wa"/></svg>Abrir WhatsApp novamente</button><button class="btn o" onclick="closeCheckout()">Voltar à loja</button></div>`;ck.scrollTop=0;
 }catch(e){if(waTab)waTab.close();const msg={dados_invalidos:'Confira os dados e tente novamente.',produto_invalido:'Um produto não está mais disponível. Atualize a página.',preco_desatualizado:'O preço mudou. Atualize a página e tente novamente.',quantidade_invalida:'Confira as quantidades do carrinho.',preco_desatualizado:'O preço mudou. Atualize a página.'}[e.message]||'Não foi possível registrar o pedido agora. Seus dados continuam nesta tela. Tente novamente ou fale com a equipe pelo WhatsApp.';let err=document.getElementById('ck-api-err');if(!err){err=document.createElement('p');err.id='ck-api-err';err.style.cssText='color:#b42318;font-weight:600;margin-top:12px';btn?.insertAdjacentElement('afterend',err)}err.textContent=msg;
 }finally{ckBusy=false;if(btn){btn.disabled=false;btn.innerHTML='<svg class="ic"><use href="#i-wa"/></svg>Registrar pedido e abrir WhatsApp'}}
}
function openCheckout(){if(!cart.length)return;closeAll();ckSent=false;ckDraw();ck.classList.add("on");ck.setAttribute("aria-hidden","false");ck.scrollTop=0;trava()}
function closeCheckout(){if(ckSent){cart=[];save();drawCart();ckSent=false}ck.classList.remove("on");ck.setAttribute("aria-hidden","true");trava()}
function backToCart(){if(ckSent){closeCheckout();return}ck.classList.remove("on");ck.setAttribute("aria-hidden","true");trava();openCart()}
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&ck.classList.contains("on")&&!document.getElementById("pgv").classList.contains("on"))backToCart()});