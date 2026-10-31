/* BomVizinho – checkout: registra pedido na API Cloudflare e abre WhatsApp para continuidade do atendimento. */
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
 <div class="w ckw"><form id="ckf" class="checkout-form" novalidate onsubmit="return false">
 <div class="ck-progress" aria-label="Etapas do pedido"><div class="ck-progress-top"><b id="ck-step-title">Etapa 1 de 3</b><span id="ck-step-caption">Seus dados</span></div><div class="ck-progress-track"><i id="ck-progress-fill"></i></div><div class="ck-step-dots"><span class="active">1. Seus dados</span><span>2. Entrega e pagamento</span><span>3. Conferir pedido</span></div></div>
 <section class="cks" data-step="1"><h3><span>1</span>Seus dados</h3>
  <div class="g2">${lbl("nome","Nome completo *",`type="text" autocomplete="name" value="${v("nome")}"`)}${lbl("tel","WhatsApp / telefone *",`type="tel" inputmode="tel" autocomplete="tel" placeholder="(61) 90000-0000" value="${v("tel")}"`,"Informe um telefone com DDD")}</div>${lbl("email","E-mail (opcional)",`type="email" autocomplete="email" placeholder="voce@exemplo.com" value="${v("email")}"`)}<label id="l-observacao">Observação do pedido (opcional)<textarea id="f-observacao" maxlength="1000" rows="3" placeholder="Alguma informação importante para a equipe?">${v("observacao")}</textarea></label></section>
 <section class="cks" data-step="2"><h3><span>2</span>Entrega</h3>
  <div class="ops" id="ops-ent">${ENTREGAS.map((e,i)=>`<label class="op ${i?"":"sel"}"><input type="radio" name="ent" value="${e.v}" ${i?"":"checked"}><b>${e.t}</b><small>${e.s}</small></label>`).join("")}</div>
  <div id="endbox">
   <div class="cep">${lbl("cep","CEP *",`type="text" inputmode="numeric" autocomplete="postal-code" placeholder="00000-000" value="${v("cep")}"`,"Informe o CEP (8 números)")}<small id="cepst"></small></div>
   <div class="g3">${lbl("rua","Rua / avenida *",`type="text" autocomplete="address-line1" value="${v("rua")}"`)}${lbl("num","Número *",`type="text" value="${v("num")}"`,"Informe o número")}</div>
   ${lbl("comp","Complemento",`type="text" placeholder="Apto, bloco, casa..." value="${v("comp")}"`)}
   <div class="g4">${lbl("bairro","Bairro *",`type="text" value="${v("bairro")}"`)}${lbl("cidade","Cidade *",`type="text" autocomplete="address-level2" value="${v("cidade")}"`)}${lbl("uf","UF *",`type="text" maxlength="2" autocomplete="address-level1" value="${v("uf")}"`,"UF")}</div>
   ${lbl("referencia","Ponto de referência (opcional)",`type="text" placeholder="Ex.: perto do mercado, entrada da fazenda..." value="${v("referencia")}"`)}<label id="l-obsentrega">Observação da entrega (opcional)<textarea id="f-obsentrega" maxlength="500" rows="2" placeholder="Instruções para localizar o endereço ou combinar o recebimento">${v("obsentrega")}</textarea></label>
  </div></section>
 <section class="cks" data-step="2"><h3><span>3</span>Pagamento</h3>
  <div class="ops" id="ops-pag">${PAGAMENTOS.map(p=>`<label class="op"><input type="radio" name="pag" value="${p}"><b>${p}</b></label>`).join("")}</div>
  <div id="trocobox" hidden>${lbl("troco","Precisa de troco? Para quanto?",`type="text" inputmode="decimal" placeholder="Ex.: 200,00"`)}</div>
  <p class="nota">O valor do frete e as opções de pagamento serão confirmados antes da conclusão da compra. O pagamento ainda não é processado automaticamente pelo site.</p>
  <p id="pagerr" style="color:#c63b32;font-size:13px;font-weight:600;margin-top:8px" hidden>Escolha uma forma de pagamento.</p></section>
 </form>
 <section id="ck-review" class="cks ck-review" data-step="3" hidden><h3><span>✓</span>Confira se está tudo certinho</h3><p class="ck-review-intro" id="ck-review-greeting">Dê uma olhadinha nos seus dados e nos produtos antes de finalizar.</p><div id="ck-review-content"></div><p class="nota">O frete e o valor final da entrega serão combinados com a equipe pelo WhatsApp. O total abaixo considera os produtos.</p></section>
 <div class="ck-step-actions"><button type="button" class="btn o" id="ck-back" hidden>Voltar</button><button type="button" class="btn" id="ck-next">Continuar <span aria-hidden="true">→</span></button><button type="button" class="btn wa" id="ck-finish" hidden onclick="ckEnviar()"><svg class="ic"><use href="#i-wa"/></svg> Confirmar e continuar no WhatsApp</button></div>
 <aside class="cksum" id="ck-side-summary"><h3>Resumo do pedido</h3><div class="rs">${itens}</div>
  <div class="tt"><p><span>Produtos</span><span>${brl(totalCarrinho())}</span></p><p><span>Frete</span><span>A combinar</span></p><div class="tot"><span>Total</span><b>${brl(totalCarrinho())}</b></div></div>
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
 document.getElementById('ck-next').onclick=()=>ckNext();document.getElementById('ck-back').onclick=()=>ckShowStep(Math.max(1,ckStep-1));ckShowStep(1);
}
let ckStep=1;
function ckFirst(){return (val('nome').trim().split(/\s+/)[0]||'').replace(/[<>]/g,'')}
function ckShowStep(n){ckStep=Math.max(1,Math.min(3,n));document.querySelectorAll('#ckf .cks[data-step],#ck-review').forEach(el=>el.hidden=Number(el.dataset.step)!==ckStep);const titles={1:['Seus dados','Vamos começar'],2:['Entrega e pagamento',`${ckFirst()?ckFirst()+', falta só mais um pouquinho':'Agora, como você prefere receber?'}`],3:['Conferir pedido',`${ckFirst()?ckFirst()+', confira se está tudo certinho':'Confira se está tudo certinho'}`]};document.getElementById('ck-step-title').textContent=`Etapa ${ckStep} de 3`;document.getElementById('ck-step-caption').textContent=titles[ckStep][0];document.getElementById('ck-progress-fill').style.width=(ckStep/3*100)+'%';document.querySelectorAll('.ck-step-dots span').forEach((e,i)=>{e.classList.toggle('active',i+1<=ckStep);e.classList.toggle('current',i+1===ckStep)});document.getElementById('ck-back').hidden=ckStep===1;document.getElementById('ck-next').hidden=ckStep===3;document.getElementById('ck-finish').hidden=ckStep!==3;document.getElementById('ck-side-summary').hidden=ckStep===3;if(ckStep===3)ckRenderReview();document.getElementById('ck').scrollTo({top:0,behavior:'smooth'});}
function ckValidateStep(n){let first=null;const mark=(id,bad)=>{const l=document.getElementById('l-'+id);if(l){l.classList.toggle('bad',bad);if(bad&&!first)first=l}};if(n===1){mark('nome',val('nome').trim().length<3);mark('tel',dig(val('tel')).length<10)}if(n===2){if(ehEntrega()){mark('cep',dig(val('cep')).length!==8);['rua','num','bairro','cidade'].forEach(k=>mark(k,!val(k)));mark('uf',val('uf').length!==2)}const pag=document.querySelector('#ckf input[name="pag"]:checked');document.getElementById('pagerr').hidden=!!pag;if(!pag&&!first)first=document.getElementById('ops-pag')}if(first){first.scrollIntoView({behavior:'smooth',block:'center'});first.querySelector?.('input')?.focus?.();return false}return true}
function ckNext(){if(ckStep<3){if(!ckValidateStep(ckStep))return;gravaSalvo();ckShowStep(ckStep+1)}}
function ckRenderReview(){const name=ckFirst();document.getElementById('ck-review-greeting').textContent=`${name?name+', dê':'Dê'} uma última olhadinha nos seus dados, na entrega e nos produtos selecionados.`;const ent=document.querySelector('#ckf input[name="ent"]:checked')?.value||'';const pag=document.querySelector('#ckf input[name="pag"]:checked')?.value||'Não selecionado';const addr=ehEntrega()?`${val('rua')}, ${val('num')}${val('comp')?' - '+val('comp'):''}, ${val('bairro')}, ${val('cidade')}/${val('uf')} · CEP ${val('cep')}`:'Retirada na loja';const items=cart.map(i=>{const p=P.find(x=>x.id===i.id);return `<div class="ck-review-item"><img src="${esc(productImageFor(p))}" alt="" loading="lazy" onerror="this.style.display='none'"><div><b>${esc(p.n)}</b><small>${i.q} × ${brl(p.p)}</small></div><strong>${brl(i.q*p.p)}</strong></div>`}).join('');document.getElementById('ck-review-content').innerHTML=`<div class="ck-review-block"><h4>Seus dados</h4><p><b>${esc(val('nome'))}</b><br>${esc(val('tel'))}${val('email')?'<br>'+esc(val('email')):''}</p></div><div class="ck-review-block"><h4>Entrega</h4><p>${esc(addr)}</p><p><b>Pagamento:</b> ${esc(pag)}</p></div><div class="ck-review-block"><h4>Produtos do pedido</h4>${items}<div class="ck-review-total"><span>Total dos produtos</span><b>${brl(totalCarrinho())}</b></div><p class="muted">Frete: a combinar com a equipe.</p></div>`}
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
 const linhas=[`PEDIDO BOMVIZINHO ${codigo}`,`Cliente: ${val("nome")}`,`WhatsApp: ${val("tel")}`,`E-mail: ${val("email")||"Não informado"}`,`Entrega: ${casa?"Entrega em endereço":"Retirada na loja"}`];
 if(casa)linhas.push(`Endereço: ${val("rua")}, ${val("num")}${val("comp")?" - "+val("comp"):""}, ${val("bairro")}, ${val("cidade")}/${val("uf")} · CEP ${val("cep")}`,`Referência: ${val("referencia")||"Não informada"}`,`Observação da entrega: ${val("obsentrega")||"Nenhuma"}`);
 linhas.push(`Pagamento: ${pag}`,`Troco: ${val("troco")||"Não informado"}`,"", "PRODUTOS:");
 cart.forEach(i=>{const p=P.find(x=>x.id===i.id);linhas.push(`• ${p.n} — ${i.q} x ${brl(p.p)} = ${brl(p.p*i.q)}${i.obs?" | Obs.: "+i.obs:""}`)});
 linhas.push("",`Quantidade total: ${qtd} unidade(s) em ${cart.length} produto(s)`,`Total dos produtos: ${brl(total)}`,`Frete: ${casa?"a combinar":"retirada na loja"}`,`Observação do pedido: ${val("observacao")||"Nenhuma"}`,"", "Pedido registrado no site. Favor confirmar o frete e as condições finais pelo WhatsApp.");
 return linhas.join("\n");
}
let ckBusy=false;
async function ckEnviar(){
 if(!cart.length||ckBusy)return;if(!ckValidateStep(1)||!ckValidateStep(2))return;
 const btn=document.getElementById("ckgo");ckBusy=true;if(btn){btn.disabled=true;btn.textContent="Registrando pedido…"}
 const waTab=window.open('about:blank','_blank');
 try{
  const ent=document.querySelector('#ckf input[name="ent"]:checked').value,casa=ent===ENTREGAS[0].v,pag=document.querySelector('#ckf input[name="pag"]:checked').value;
  const payload={idempotencyKey:(crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2)),customer:{name:val("nome"),phone:dig(val("tel")),email:val("email")},customerNote:[val("observacao")?`Observação do pedido: ${val("observacao")}`:"",casa&&val("referencia")?`Ponto de referência: ${val("referencia")}`:"",casa&&val("obsentrega")?`Observação da entrega: ${val("obsentrega")}` : ""].filter(Boolean).join("\n").slice(0,1000),delivery:{type:ent,postalCode:dig(val("cep")),street:val("rua"),number:val("num"),complement:val("comp"),district:val("bairro"),city:val("cidade"),state:val("uf")},payment:{method:pag,change:val("troco")},items:cart.map(i=>({productId:i.id,quantity:i.q,unitPriceCents:Math.round(P.find(p=>p.id===i.id).p*100),note:i.obs||""}))};
  const resp=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});let result={};try{result=await resp.json()}catch(e){}
  if(!resp.ok||!result.ok)throw new Error(result.error||'erro_registro');
  gravaSalvo();ckMsg=ckMonta(`#${result.code}`);ckSent=true;
  ckc.innerHTML=`<div class="ok2"><div class="ok"><svg class="ic"><use href="#i-ok"/></svg></div><h2>Obrigado, ${esc(ckFirst()||'por escolher a BomVizinho')}!</h2><p>Seu pedido <strong>#${esc(result.code)}</strong> foi registrado com sucesso. Estamos preparando as informações para você continuar o atendimento pelo WhatsApp.</p><div class="ck-processing"><span class="ck-spinner"></span><b>Preparando seu atendimento…</b><small>Você será encaminhado em instantes.</small></div>${WHATS?`<button class="btn wa" onclick="wa(ckMsg)"><svg class="ic"><use href="#i-wa"/></svg>Abrir WhatsApp agora</button>`:`<p class="nota">O pedido foi salvo. O contato oficial da loja ainda precisa ser configurado; guarde o código do pedido.</p>`}<button class="btn o" onclick="closeCheckout()">Voltar à loja</button></div>`;ck.scrollTop=0;
  if(WHATS){const url=`https://api.whatsapp.com/send?phone=${WHATS}&text=${encodeURIComponent(ckMsg)}`;setTimeout(()=>{if(waTab){waTab.location.href=url}else{wa(ckMsg)}},3200)}else if(waTab){waTab.close()}
 }catch(e){if(waTab)waTab.close();const msg={dados_invalidos:'Confira os dados e tente novamente.',produto_invalido:'Um produto não está mais disponível. Atualize a página.',preco_desatualizado:'O preço mudou. Atualize a página e tente novamente.',quantidade_invalida:'Confira as quantidades do carrinho.',preco_desatualizado:'O preço mudou. Atualize a página.'}[e.message]||'Não foi possível registrar o pedido agora. Seus dados continuam nesta tela. Tente novamente ou fale com a equipe pelo WhatsApp.';let err=document.getElementById('ck-api-err');if(!err){err=document.createElement('p');err.id='ck-api-err';err.style.cssText='color:#b42318;font-weight:600;margin-top:12px';(document.getElementById('ck-finish')||document.getElementById('ck-next'))?.insertAdjacentElement('afterend',err)}err.textContent=msg;
 }finally{ckBusy=false;if(btn){btn.disabled=false;btn.innerHTML='<svg class="ic"><use href="#i-wa"/></svg>Registrar pedido e abrir WhatsApp'}}
}
function openCheckout(){if(!cart.length)return;closeAll();ckSent=false;ckDraw();ck.classList.add("on");ck.setAttribute("aria-hidden","false");ck.scrollTop=0;trava()}
function closeCheckout(){if(ckSent){cart=[];save({guestEdit:true});drawCart();ckSent=false}ck.classList.remove("on");ck.setAttribute("aria-hidden","true");trava()}
function backToCart(){if(ckSent){closeCheckout();return}ck.classList.remove("on");ck.setAttribute("aria-hidden","true");trava();openCart()}
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&ck.classList.contains("on")&&!document.getElementById("pgv").classList.contains("on"))backToCart()});
