/* ROMMO – finalização: dados do cliente, entrega, pagamento e envio do pedido para o WhatsApp */
const ck=document.getElementById("ck"),ckc=document.getElementById("ckc");
let ckSent=false,ckMsg="";
const $f=id=>document.getElementById("f-"+id),val=id=>($f(id)?$f(id).value.trim():"");
const dig=v=>v.replace(/\D/g,"");
const mTel=v=>{v=dig(v).slice(0,11);return v.length>10?`(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`:v.length>6?`(${v.slice(0,2)}) ${v.slice(2,6)}-${v.slice(6)}`:v.length>2?`(${v.slice(0,2)}) ${v.slice(2)}`:v}
const mCep=v=>{v=dig(v).slice(0,8);return v.length>5?v.slice(0,5)+"-"+v.slice(5):v}
const CAMPOS=["nome","tel","mail","cep","rua","num","comp","bairro","cidade","uf","ref"];
const lerSalvo=()=>{try{return JSON.parse(localStorage.getItem("rommo_cli")||"{}")}catch(e){return{}}};
const gravaSalvo=()=>{try{const o={};CAMPOS.forEach(c=>o[c]=val(c));localStorage.setItem("rommo_cli",JSON.stringify(o))}catch(e){}};
const totalCarrinho=()=>cart.reduce((a,i)=>a+i.q*P.find(p=>p.id===i.id).p,0);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

function lbl(id,txt,extra="",err="Campo obrigatório"){return`<label data-e="${err}" id="l-${id}">${txt}<input id="f-${id}" ${extra}></label>`}
function ckDraw(){
 const s=lerSalvo(),v=k=>esc(s[k]||"");
 const itens=cart.map(i=>{const p=P.find(x=>x.id===i.id);return`<div class="ri">${img(p)}<div><b>${p.n}</b><small>${i.q} x ${brl(p.p)}${i.obs?` • Obs: ${esc(i.obs)}`:""}</small></div><em>${brl(p.p*i.q)}</em></div>`}).join("");
 ckc.innerHTML=`<div class="ckh"><div class="w"><h1>Finalizar pedido</h1><p>Preencha seus dados para a nossa equipe concluir o pedido pelo WhatsApp.</p></div></div>
 <div class="w ckw"><form id="ckf" novalidate onsubmit="return false">
 <section class="cks"><h3><span>1</span>Seus dados</h3>
  <div class="g2">${lbl("nome","Nome completo *",`type="text" autocomplete="name" value="${v("nome")}"`)}${lbl("tel","WhatsApp / telefone *",`type="tel" inputmode="tel" autocomplete="tel" placeholder="(61) 90000-0000" value="${v("tel")}"`,"Informe um telefone com DDD")}</div>
  ${lbl("mail","E-mail (opcional)",`type="email" autocomplete="email" value="${v("mail")}"`,"E-mail inválido")}</section>
 <section class="cks"><h3><span>2</span>Entrega</h3>
  <div class="ops" id="ops-ent">${ENTREGAS.map((e,i)=>`<label class="op ${i?"":"sel"}"><input type="radio" name="ent" value="${e.v}" ${i?"":"checked"}><b>${e.t}</b><small>${e.s}</small></label>`).join("")}</div>
  <div id="endbox">
   <div class="cep">${lbl("cep","CEP *",`type="text" inputmode="numeric" autocomplete="postal-code" placeholder="00000-000" value="${v("cep")}"`,"Informe o CEP (8 números)")}<small id="cepst"></small></div>
   <div class="g3">${lbl("rua","Rua / avenida *",`type="text" autocomplete="address-line1" value="${v("rua")}"`)}${lbl("num","Número *",`type="text" value="${v("num")}"`,"Informe o número")}</div>
   ${lbl("comp","Complemento",`type="text" placeholder="Apto, bloco, casa..." value="${v("comp")}"`)}
   <div class="g4">${lbl("bairro","Bairro *",`type="text" value="${v("bairro")}"`)}${lbl("cidade","Cidade *",`type="text" autocomplete="address-level2" value="${v("cidade")}"`)}${lbl("uf","UF *",`type="text" maxlength="2" autocomplete="address-level1" value="${v("uf")}"`,"UF")}</div>
   ${lbl("ref","Ponto de referência",`type="text" placeholder="Próximo a..." value="${v("ref")}"`)}
  </div></section>
 <section class="cks"><h3><span>3</span>Pagamento</h3>
  <div class="ops" id="ops-pag">${PAGAMENTOS.map(p=>`<label class="op"><input type="radio" name="pag" value="${p}"><b>${p}</b></label>`).join("")}</div>
  <div id="trocobox" hidden>${lbl("troco","Precisa de troco? Para quanto?",`type="text" inputmode="decimal" placeholder="Ex.: 200,00"`)}</div>
  <p class="nota">O pagamento é combinado com a nossa equipe no WhatsApp, junto com o valor do frete.</p>
  <p id="pagerr" style="color:#c63b32;font-size:13px;font-weight:600;margin-top:8px" hidden>Escolha uma forma de pagamento.</p></section>
 <section class="cks"><h3><span>4</span>Observações do pedido</h3><label>Algum detalhe para a equipe? (opcional)<textarea id="f-obs" placeholder="Horário de entrega, orientações, etc."></textarea></label></section>
 </form>
 <aside class="cksum"><h3>Resumo do pedido</h3><div class="rs">${itens}</div>
  <div class="tt"><p><span>Produtos</span><span>${brl(totalCarrinho())}</span></p><p><span>Frete</span><span>A combinar</span></p><div class="tot"><span>Total</span><b>${brl(totalCarrinho())}</b></div></div>
  <button class="btn wa" id="ckgo" onclick="ckEnviar()"><svg class="ic"><use href="#i-wa"/></svg>Enviar pedido pelo WhatsApp</button>
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
  st.className="ok";st.textContent="Endereço encontrado. Confira e informe o número.";$f("num").focus()}
 catch(e){st.textContent="Não foi possível buscar o CEP agora. Preencha manualmente."}
}
const ehEntrega=()=>document.querySelector('#ckf input[name="ent"]:checked').value===ENTREGAS[0].v;
function ckValida(){
 let primeiro=null;const marca=(id,ruim)=>{const l=document.getElementById("l-"+id);l.classList.toggle("bad",ruim);if(ruim&&!primeiro)primeiro=l};
 marca("nome",val("nome").length<3);marca("tel",dig(val("tel")).length<10);
 marca("mail",val("mail")!==""&&!/^\S+@\S+\.\S+$/.test(val("mail")));
 if(ehEntrega()){marca("cep",dig(val("cep")).length!==8);["rua","num","bairro","cidade"].forEach(k=>marca(k,!val(k)));marca("uf",val("uf").length!==2)}
 const pag=document.querySelector('#ckf input[name="pag"]:checked');document.getElementById("pagerr").hidden=!!pag;if(!pag&&!primeiro)primeiro=document.getElementById("ops-pag");
 if(primeiro){primeiro.scrollIntoView({behavior:"smooth",block:"center"});return false}return true;
}
function ckMonta(){
 let t=0,m=`*NOVO PEDIDO – ${LOJA}*\n━━━━━━━━━━━━━━━\n\n*ITENS DO PEDIDO*\n\n`;
 cart.forEach((i,k)=>{const p=P.find(x=>x.id===i.id),s=p.p*i.q;t+=s;m+=`*${k+1}. ${p.n}*\n• Quantidade: ${i.q}\n• Valor unitário: ${brl(p.p)}\n• Subtotal: ${brl(s)}\n`;if(i.obs.trim())m+=`• Observação: ${i.obs.trim()}\n`;m+="\n"});
 m+=`━━━━━━━━━━━━━━━\n*TOTAL DOS PRODUTOS: ${brl(t)}*\n(Frete a combinar)\n\n*DADOS DO CLIENTE*\n• Nome: ${val("nome")}\n• Telefone: ${val("tel")}\n`;
 if(val("mail"))m+=`• E-mail: ${val("mail")}\n`;
 const ent=document.querySelector('#ckf input[name="ent"]:checked').value;
 m+=`\n*ENTREGA*\n• Tipo: ${ent}\n`;
 if(ent===ENTREGAS[0].v){m+=`• CEP: ${val("cep")}\n• Endereço: ${val("rua")}, nº ${val("num")}${val("comp")?" - "+val("comp"):""}\n• Bairro: ${val("bairro")}\n• Cidade/UF: ${val("cidade")} - ${val("uf")}\n`;if(val("ref"))m+=`• Referência: ${val("ref")}\n`}
 const pag=document.querySelector('#ckf input[name="pag"]:checked').value;
 m+=`\n*PAGAMENTO*\n• Forma: ${pag}\n`;if(pag==="Dinheiro"&&val("troco"))m+=`• Troco para: R$ ${val("troco")}\n`;
 if(val("obs"))m+=`\n*OBSERVAÇÕES*\n${val("obs")}\n`;
 return m+`\nAguardo a confirmação do pedido. Obrigado!`;
}
function ckEnviar(){
 if(!cart.length)return;if(!ckValida())return;
 gravaSalvo();ckMsg=ckMonta();wa(ckMsg);ckSent=true;
 ckc.innerHTML=`<div class="ok2"><div class="ok"><svg class="ic"><use href="#i-ok"/></svg></div><h2>Pedido enviado para o WhatsApp</h2><p>Envie a mensagem na conversa que abriu para a nossa equipe confirmar o seu pedido. Se o WhatsApp não abriu, toque no botão abaixo.</p>
 <button class="btn wa" onclick="wa(ckMsg)"><svg class="ic"><use href="#i-wa"/></svg>Abrir WhatsApp novamente</button><button class="btn o" onclick="closeCheckout()">Voltar à loja</button></div>`;
 ck.scrollTop=0;
}
function openCheckout(){if(!cart.length)return;closeAll();ckSent=false;ckDraw();ck.classList.add("on");ck.setAttribute("aria-hidden","false");ck.scrollTop=0;trava()}
function closeCheckout(){if(ckSent){cart=[];save();drawCart();ckSent=false}ck.classList.remove("on");ck.setAttribute("aria-hidden","true");trava()}
function backToCart(){if(ckSent){closeCheckout();return}ck.classList.remove("on");ck.setAttribute("aria-hidden","true");trava();openCart()}
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&ck.classList.contains("on")&&!document.getElementById("pgv").classList.contains("on"))backToCart()});
