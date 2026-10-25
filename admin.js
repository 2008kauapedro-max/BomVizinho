/* ROMMO painel – interface. Todo dado de cliente entra na tela por textContent (nunca innerHTML) = sem XSS. */
(()=>{
const $=s=>document.querySelector(s);
const h=(t,a,...c)=>{const e=document.createElement(t);if(a)for(const k in a){const v=a[k];if(v==null||v===false)continue;if(k==="class")e.className=v;else if(k.startsWith("on"))e.addEventListener(k.slice(2),v);else e.setAttribute(k,v===true?"":v)}for(const x of c.flat(9)){if(x==null||x===false)continue;e.append(x&&x.nodeType?x:document.createTextNode(String(x)))}return e};
const brl=c=>(c/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const dt=i=>i?new Date(i).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo",day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"—";
const reaisCent=s=>{s=String(s).trim().replace(/[R$\s]/g,"");if(!s)return null;if(s.includes(","))s=s.replace(/\./g,"").replace(",",".");const n=Number(s);return isFinite(n)&&n>=0?Math.round(n*100):null};
const tel=d=>d.length===11?`(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`:d.length===10?`(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`:d;
const cep=c=>/^\d{8}$/.test(c||"")?c.slice(0,5)+"-"+c.slice(5):(c||"");
const ST={recebido:"Recebido",em_analise:"Em análise",aguardando_cliente:"Aguardando cliente",confirmado:"Confirmado",em_separacao:"Em separação",pronto:"Pronto para despacho",despachado:"Enviado / retirado",concluido:"Concluído",cancelado:"Cancelado"};
const FR={pendente:"Pendente de cálculo pela equipe",calculado:"Calculado (falta informar o cliente)",informado:"Informado ao cliente",aceito:"Aceito pelo cliente",sem_cobranca:"Sem cobrança de frete"};
const PG={nao_verificado:"Não verificado",aguardando:"Aguardando pagamento",confirmado:"Pagamento confirmado",recusado:"Pagamento recusado"};
const NEXT={recebido:["em_analise","aguardando_cliente"],em_analise:["aguardando_cliente","confirmado"],aguardando_cliente:["em_analise","confirmado"],confirmado:["em_separacao","aguardando_cliente"],em_separacao:["pronto","confirmado"],pronto:["despachado","em_separacao"],despachado:["concluido"],concluido:[],cancelado:["em_analise"]};
const ACAO={em_analise:"Iniciar análise",aguardando_cliente:"Aguardar cliente",confirmado:"Confirmar pedido",em_separacao:"Iniciar separação",pronto:"Marcar como pronto",despachado:"Registrar despacho / retirada",concluido:"Concluir pedido"};
const ERR={nao_autorizado:"Seu usuário não tem acesso ao painel.",conflito:"Este pedido foi alterado por outra pessoa. Os dados foram recarregados.",transicao_invalida:"Mudança de status não permitida. Use “Alterar manualmente” com uma justificativa.",justificativa_obrigatoria:"Informe a justificativa.",frete_nao_confirmado:"O frete ainda não foi aceito pelo cliente. Informe uma justificativa para confirmar mesmo assim.",sem_despacho:"O pedido não tem despacho/retirada registrado. Informe uma justificativa.",frete_invalido:"Valor de frete inválido.",pedido_encerrado:"Pedido já encerrado.",nao_encontrado:"Pedido não encontrado.",sessao_expirada:"Sua sessão expirou. Entre novamente.",timeout:"A conexão demorou demais. Tente de novo.",rede:"Sem conexão com o servidor. Tente de novo.",sem_mudanca:"O pedido já está nesse status."};
const msgErr=e=>ERR[e&&e.codigo]||"Não foi possível concluir a operação. Tente novamente.";
const pill=(txt,cls)=>h("span",{class:"pill "+cls},txt);
const S={cont:null,filtros:{busca:"",status:"",de:"",ate:"",ordem:"desc",pagina:1,acao:false},ultimo:null,live:true,recTok:null};
let rota=null,tmr=null;

/* ---------- utilidades de UI ---------- */
function toast(t){const e=h("div",{class:"toast",role:"status"},t);document.body.append(e);setTimeout(()=>e.remove(),5000)}
function dialogo({titulo,texto,notaMin=0,ok="Confirmar",perigo=false,rotuloNota="Justificativa"}){
 return new Promise(res=>{
  const ta=notaMin?h("textarea",{class:"in",maxlength:"500","aria-label":rotuloNota,placeholder:`${rotuloNota} (mínimo ${notaMin} caracteres)`}):null,er=h("div",{class:"err",role:"alert",hidden:true});
  const d=h("dialog",{"aria-label":titulo}),fim=v=>{d.close();d.remove();res(v)};
  d.append(h("h3",null,titulo),h("p",null,texto||""),ta,er,h("div",{class:"acts"},
   h("button",{class:"btn o",type:"button",onclick:()=>fim(null)},"Voltar"),
   h("button",{class:"btn"+(perigo?" r":""),type:"button",onclick:()=>{const n=ta?ta.value.trim():"";if(ta&&n.length<notaMin){er.hidden=false;er.textContent=`Escreva pelo menos ${notaMin} caracteres.`;return}fim({nota:n})}},ok)));
  d.addEventListener("cancel",e=>{e.preventDefault();fim(null)});document.body.append(d);d.showModal();if(ta)ta.focus();
 });
}
const marca=()=>h("div",{class:"marca"},h("span",{class:"q"},[1,2,3,4].map(n=>h("img",{src:`../assets/logo/quad-${n}.png`,alt:""}))),h("div",null,h("b",null,"ROMMO"),h("small",null,"PAINEL DE PEDIDOS")));
const waLink=(telefone,msg)=>{const d=String(telefone).replace(/\D/g,"");const n=(d.length===10||d.length===11)?"55"+d:d;return `https://api.whatsapp.com/send?phone=${n}&text=${encodeURIComponent(msg)}`};

/* ---------- login ---------- */
function viewLogin(msg){
 let falhas=0,bloq=0;
 const em=h("input",{class:"in",type:"email",autocomplete:"username",required:true}),sn=h("input",{class:"in",type:"password",autocomplete:"current-password",required:true}),er=h("div",{class:"err",role:"alert",hidden:!msg},msg||""),ok=h("div",{class:"okm",role:"status",hidden:true}),bt=h("button",{class:"btn full",type:"button"},"Entrar");
 const entrar=async()=>{
  if(Date.now()<bloq){er.hidden=false;er.textContent="Aguarde alguns segundos antes de tentar de novo.";return}
  er.hidden=true;bt.disabled=true;bt.textContent="Entrando...";
  try{await API.login(em.value.trim(),sn.value);S.cont=null;go("#/")}
  catch(e){falhas++;if(falhas>=5){bloq=Date.now()+30000*(falhas-4)}er.hidden=false;er.textContent=(e.codigo==="rede"||e.codigo==="timeout")?msgErr(e):"E-mail ou senha incorretos."}   /* mensagem genérica: não revela se o e-mail existe */
  bt.disabled=false;bt.textContent="Entrar"};
 bt.onclick=entrar;[em,sn].forEach(i=>i.addEventListener("keydown",e=>{if(e.key==="Enter")entrar()}));
 const rec=h("button",{class:"lk",type:"button",onclick:async()=>{if(!em.value.trim()){er.hidden=false;er.textContent="Digite seu e-mail e clique de novo.";return}try{await API.recuperar(em.value.trim())}catch(e){}er.hidden=true;ok.hidden=false;ok.textContent="Se o e-mail estiver cadastrado, enviamos um link para criar uma nova senha."}},"Esqueci minha senha");
 return h("div",{class:"login"},h("div",{class:"lbox"},marca(),h("h1",null,"Acesso da equipe"),h("p",{class:"s"},"Área restrita a funcionários autorizados."),er,ok,h("label",{class:"f"},"E-mail",em),h("label",{class:"f"},"Senha",sn),bt,h("div",null,rec)));
}
function viewNovaSenha(){
 const a=h("input",{class:"in",type:"password",autocomplete:"new-password"}),b=h("input",{class:"in",type:"password",autocomplete:"new-password"}),er=h("div",{class:"err",role:"alert",hidden:true});
 return h("div",{class:"login"},h("div",{class:"lbox"},marca(),h("h1",null,"Criar nova senha"),er,h("label",{class:"f"},"Nova senha (mínimo 10 caracteres)",a),h("label",{class:"f"},"Repita a senha",b),
  h("button",{class:"btn full",type:"button",onclick:async()=>{if(a.value.length<10||a.value!==b.value){er.hidden=false;er.textContent="A senha precisa ter 10+ caracteres e ser igual nos dois campos.";return}try{await API.novaSenha(S.recTok,a.value);S.recTok=null;go("#/");toast("Senha alterada. Entre com a nova senha.");draw()}catch(e){er.hidden=false;er.textContent="Link inválido ou expirado. Peça um novo."}}},"Salvar nova senha")));
}

/* ---------- estrutura ---------- */
function shell(ativo,titulo,corpo,acoes){
 const n=S.cont?S.cont.novos:0,nav=(href,txt,id,b)=>h("a",{href,class:ativo===id?"on":"","aria-current":ativo===id?"page":null},txt,b>0?h("span",{class:"badge"},b):null);
 const sair=h("button",{class:"btn o sm",type:"button",onclick:async()=>{await API.logout();S.cont=null;go("#/");draw()}},"Sair");
 return h("div",{class:"app"},
  h("aside",{class:"side"},marca(),h("nav",{"aria-label":"Principal"},nav("#/","Painel","painel",0),nav("#/pedidos","Pedidos","pedidos",n)),h("div",{class:"user"},API.email(),h("div",null,sair))),
  h("main",{class:"main"},h("div",{class:"mbar"},nav("#/","Painel","painel",0),nav("#/pedidos","Pedidos","pedidos",n),h("button",{type:"button",onclick:async()=>{await API.logout();S.cont=null;go("#/");draw()}},"Sair")),
   h("div",{class:"top"},h("h1",null,titulo),h("div",{class:"acts"},h("span",{class:"live"+(S.live?"":" off"),id:"live"},h("i"),S.live?"Atualização automática":"Sem conexão — tentando de novo"),acoes)),corpo));
}
const go=hash=>{if(location.hash===hash)draw();else location.hash=hash};

/* ---------- lista / linhas ---------- */
function linha(p){
 return h("a",{class:"row"+(p.visto?"":" novo"),href:"#/pedido/"+p.id},
  h("div",{class:"c1"},h("span",{class:"cod"},"#"+p.codigo),h("small",null,dt(p.criado_em))),
  h("div",{class:"c2"},p.cliente_nome,h("small",null,`${p.qtd_produtos} produto(s) • ${p.qtd_unidades} un.`)),
  h("div",{class:"c3"},pill(p.entrega_tipo==="Entrega"?(FR[p.frete_situacao]||p.frete_situacao).split(" (")[0]:"Retirada na loja","f-"+p.frete_situacao)),
  h("div",{class:"c4"},h("span",{class:"money"},p.total_centavos==null?brl(p.subtotal_centavos):brl(p.total_centavos)),h("small",null,p.total_centavos==null?"produtos • total aguarda frete":"total final")),
  h("div",{class:"c5"},pill(ST[p.status]||p.status,"s-"+p.status)),
  h("div",{class:"c6"},h("span",{class:"btn sm o"},p.visto?"Abrir":"Abrir (novo)")));
}
const cabecalho=()=>h("div",{class:"row h"},h("div",null,"Pedido"),h("div",null,"Cliente"),h("div",{class:"c3"},"Frete"),h("div",{class:"c4"},"Valores"),h("div",null,"Status"),h("div"));
const vazio=(t,s)=>h("div",{class:"vazio"},h("b",null,t),s);

/* ---------- painel ---------- */
async function viewPainel(){
 const [c,rec,acao]=await Promise.all([API.rpc("contagens"),API.rpc("listar_pedidos",{tamanho:8}),API.rpc("listar_pedidos",{acao:true,tamanho:8})]);
 S.cont=c;S.ultimo=c.total;
 const k=(num,txt,href,alerta)=>h("a",{class:"kpi"+(alerta?" alert":""),href},h("b",null,num),h("span",null,txt));
 const ps=c.por_status||{};
 const cards=h("div",{class:"cards"},k(c.novos,"Novos (não vistos)","#/pedidos",c.novos>0),k(c.acao,"Precisam de ação","#/pedidos?acao=1",c.acao>0),k(c.frete_pendente,"Com frete pendente","#/pedidos?acao=1",c.frete_pendente>0),
  Object.keys(ST).map(s=>k(ps[s]||0,ST[s],"#/pedidos?status="+s,false)));
 const lista=(arr,vz)=>arr.length?[cabecalho(),arr.map(linha)]:vazio(vz[0],vz[1]);
 return shell("painel","Painel",[cards,h("div",{class:"cols"},
  h("section",{class:"panel"},h("h2",null,"Precisam de ação"),lista(acao.itens,["Nada pendente","Todos os pedidos estão em dia."])),
  h("section",{class:"panel"},h("h2",null,"Pedidos mais recentes"),lista(rec.itens,["Nenhum pedido ainda","Quando um cliente finalizar uma compra no site, o pedido aparece aqui."]))
 )]);
}

/* ---------- pedidos ---------- */
async function viewPedidos(q){
 const F=S.filtros;if(q){F.status=q.get("status")||"";F.acao=q.get("acao")==="1";F.pagina=1}
 const r=await API.rpc("listar_pedidos",{busca:F.busca,status:F.status,de:F.de,ate:F.ate,ordem:F.ordem,pagina:F.pagina,tamanho:20,acao:F.acao});
 const aplica=()=>{F.pagina=1;draw()};let tb;
 const busca=h("input",{class:"in",type:"search",value:F.busca,placeholder:"Número, nome ou telefone","aria-label":"Buscar"});
 busca.addEventListener("input",()=>{clearTimeout(tb);tb=setTimeout(()=>{F.busca=busca.value;aplica()},400)});
 const sel=h("select",{class:"in","aria-label":"Status",onchange:e=>{F.status=e.target.value;F.acao=false;aplica()}},h("option",{value:""},"Todos os status"),Object.keys(ST).map(s=>h("option",{value:s,selected:F.status===s},ST[s])));
 const de=h("input",{class:"in",type:"date",value:F.de,"aria-label":"De",onchange:e=>{F.de=e.target.value;aplica()}}),ate=h("input",{class:"in",type:"date",value:F.ate,"aria-label":"Até",onchange:e=>{F.ate=e.target.value;aplica()}});
 const ord=h("select",{class:"in","aria-label":"Ordenação",onchange:e=>{F.ordem=e.target.value;aplica()}},h("option",{value:"desc",selected:F.ordem==="desc"},"Mais recentes primeiro"),h("option",{value:"asc",selected:F.ordem==="asc"},"Mais antigos primeiro"));
 const filt=h("div",{class:"filt"},h("label",null,h("span",{class:"sr"},"Buscar"),busca),h("label",null,h("span",{class:"sr"},"Status"),sel),h("label",null,h("span",{class:"sr"},"De"),de),h("label",null,h("span",{class:"sr"},"Até"),ate),h("label",null,h("span",{class:"sr"},"Ordem"),ord));
 const pgs=Math.max(1,Math.ceil(r.total/r.tamanho));
 const pag=h("div",{class:"pag"},h("span",null,`${r.total} pedido(s) • página ${Math.min(F.pagina,pgs)} de ${pgs}`),h("div",{class:"acts"},
  h("button",{class:"btn o sm",type:"button",disabled:F.pagina<=1,onclick:()=>{F.pagina--;draw()}},"Anterior"),h("button",{class:"btn o sm",type:"button",disabled:F.pagina>=pgs,onclick:()=>{F.pagina++;draw()}},"Próxima")));
 const limpar=(F.busca||F.status||F.de||F.ate||F.acao)?h("button",{class:"btn o sm",type:"button",onclick:()=>{Object.assign(F,{busca:"",status:"",de:"",ate:"",pagina:1,acao:false});go("#/pedidos")}},"Limpar filtros"):null;
 const filtrado=F.busca||F.status||F.de||F.ate||F.acao;
 return shell("pedidos","Pedidos",h("section",{class:"panel"},filt,F.acao?h("div",{class:"okm"},"Mostrando só pedidos que precisam de ação."):null,
  r.itens.length?[cabecalho(),r.itens.map(linha),pag]:(filtrado?vazio("Nenhum pedido encontrado","Ajuste os filtros ou a busca."):vazio("Nenhum pedido ainda","Quando um cliente finalizar uma compra no site, o pedido aparece aqui.")))
  ,limpar);
}

/* ---------- detalhe ---------- */
const kv=(...p)=>h("dl",{class:"kv"},p.map(([k,v,w])=>[h("dt",null,k),h("dd",{class:w?"warn":""},v)]));
async function viewPedido(id){
 if(!/^[0-9a-f-]{36}$/i.test(id))return shell("pedidos","Pedido",vazio("Pedido inválido",""));
 const d=await API.rpc("obter_pedido",{p_id:id}),p=d.pedido,itens=d.itens,hist=d.historico;
 const recarrega=async(msg)=>{if(msg)toast(msg);draw()};
 const falha=async e=>{toast(msgErr(e));if(e.codigo==="conflito"||e.codigo==="sessao_expirada")draw()};
 const run=async fn=>{try{await fn();}catch(e){await falha(e)}};
 const casa=p.entrega_tipo==="Entrega";
 /* ações de status */
 const mudar=async novo=>{
  let o;
  if(novo==="cancelado")o=await dialogo({titulo:"Cancelar pedido",texto:"Informe o motivo do cancelamento. Essa ação fica registrada no histórico.",notaMin:5,ok:"Cancelar pedido",perigo:true,rotuloNota:"Motivo"});
  else if(p.status==="cancelado")o=await dialogo({titulo:"Reabrir pedido",texto:"Informe o motivo da reabertura.",notaMin:5,ok:"Reabrir",rotuloNota:"Motivo"});
  else if(novo==="confirmado"&&!["aceito","sem_cobranca"].includes(p.frete_situacao))o=await dialogo({titulo:"Frete ainda não confirmado",texto:"O cliente não aceitou o frete (ou ele não foi definido). Para confirmar mesmo assim, registre a justificativa.",notaMin:10,ok:"Confirmar mesmo assim"});
  else o=await dialogo({titulo:ACAO[novo]||"Alterar status",texto:`Mudar o status para “${ST[novo]}”?`});
  if(!o)return;run(async()=>{await API.rpc("atualizar_status",{p_id:id,p_versao:p.versao,p_novo:novo,p_nota:o.nota||null});await recarrega("Status atualizado")});
 };
 const manual=async()=>{
  const s=h("select",{class:"in","aria-label":"Novo status"},Object.keys(ST).filter(x=>x!==p.status).map(x=>h("option",{value:x},ST[x])));
  const ta=h("textarea",{class:"in",maxlength:"500",placeholder:"Justificativa (mínimo 10 caracteres)","aria-label":"Justificativa"}),er=h("div",{class:"err",role:"alert",hidden:true}),dl=h("dialog",{"aria-label":"Alterar status manualmente"});
  const fim=()=>{dl.close();dl.remove()};
  dl.append(h("h3",null,"Alterar status manualmente"),h("p",null,"Use apenas para corrigir um engano. A justificativa fica no histórico."),s,ta,er,h("div",{class:"acts"},h("button",{class:"btn o",type:"button",onclick:fim},"Voltar"),h("button",{class:"btn",type:"button",onclick:()=>{if(ta.value.trim().length<10){er.hidden=false;er.textContent="Escreva pelo menos 10 caracteres.";return}const n=s.value,t=ta.value.trim();fim();run(async()=>{await API.rpc("atualizar_status",{p_id:id,p_versao:p.versao,p_novo:n,p_nota:t});await recarrega("Status atualizado")})}},"Alterar")));
  dl.addEventListener("cancel",e=>{e.preventDefault();fim()});document.body.append(dl);dl.showModal();
 };
 const final=["concluido","cancelado"].includes(p.status);
 const ident=h("section",{class:"panel"},h("div",{class:"acts"},h("h2",null,"Pedido #"+p.codigo),pill(ST[p.status],"s-"+p.status)),
  kv(["Recebido em",dt(p.criado_em)],["Última atualização",dt(p.atualizado_em)]),h("hr",{class:"sep"}),
  h("div",{class:"acts"},(NEXT[p.status]||[]).map((n,i)=>h("button",{class:"btn"+(i?" o":""),type:"button",onclick:()=>mudar(n)},p.status==="cancelado"?"Reabrir pedido":ACAO[n])),
   !final?h("button",{class:"btn r",type:"button",onclick:()=>mudar("cancelado")},"Cancelar pedido"):null,
   p.status!=="concluido"?h("button",{class:"btn o sm",type:"button",onclick:manual},"Alterar manualmente…"):null));
 /* cliente */
 const msgCli=()=>{const n=p.cliente_nome.split(" ")[0],cod="#"+p.codigo;
  if(p.frete_situacao==="pendente"&&casa)return `Olá, ${n}! Recebemos o seu pedido ${cod}. Estamos verificando o valor e o prazo de entrega. Nossa equipe entrará em contato para confirmar esses detalhes.`;
  if(["calculado","informado"].includes(p.frete_situacao))return `Olá, ${n}! O frete do seu pedido ${cod} ficou em ${brl(p.frete_centavos)}${p.frete_prazo?` (prazo: ${p.frete_prazo})`:""}. O total final é ${brl(p.total_centavos)}. Podemos confirmar o pedido?`;
  return `Olá, ${n}! Seu pedido ${cod} está ${p.status==="recebido"||p.status==="em_analise"?"em análise":"confirmado"}. Total: ${p.total_centavos==null?"a definir":brl(p.total_centavos)}. Qualquer dúvida é só chamar.`};
 const cli=h("section",{class:"panel"},h("h2",null,"Cliente"),kv(["Nome",p.cliente_nome],["Telefone",tel(p.cliente_tel),!/^\d{10,11}$/.test(p.cliente_tel)]),
  h("div",{class:"msgbox"},msgCli()),
  h("div",{class:"acts"},h("a",{class:"btn wa",href:waLink(p.cliente_tel,msgCli()),target:"_blank",rel:"noopener noreferrer"},"Abrir conversa no WhatsApp"),
   h("button",{class:"btn o",type:"button",onclick:async()=>{try{await navigator.clipboard.writeText(msgCli());toast("Mensagem copiada")}catch(e){toast("Não foi possível copiar")}}},"Copiar mensagem")),
  h("p",{class:"s"},"A mensagem só é enviada quando você clica no WhatsApp e confirma lá. Notas internas nunca entram nela."));
 /* entrega */
 const ent=casa?h("section",{class:"panel"},h("h2",null,"Entrega"),kv(["Modalidade","Entrega"],["CEP",cep(p.cep),!/^\d{8}$/.test(p.cep||"")],["Endereço",p.rua,!p.rua||p.rua.length<2],["Número",p.numero||"—",!p.numero||/^[A-Za-z]{2}$/.test(p.numero)],["Complemento",p.complemento||"—"],["Bairro",p.bairro,!p.bairro],["Cidade",p.cidade,!p.cidade],["Estado (UF)",p.uf,!/^[A-Z]{2}$/.test(p.uf||"")]),
   [p.cep,p.rua,p.numero,p.bairro,p.cidade,p.uf].every(Boolean)&&/^\d{8}$/.test(p.cep)&&/^[A-Z]{2}$/.test(p.uf)?null:h("div",{class:"err"},"Algum campo do endereço parece incompleto ou fora do padrão (marcado em amarelo). Confira com o cliente.")):
  h("section",{class:"panel"},h("h2",null,"Entrega"),kv(["Modalidade","Retirada na loja"]));
 /* produtos */
 const un=itens.reduce((a,i)=>a+i.quantidade,0);
 const prod=h("section",{class:"panel"},h("h2",null,`Produtos (${itens.length} tipo(s) • ${un} unidade(s))`),itens.map(i=>h("div",{class:"it"},h("b",null,i.nome),h("span",{class:"v"},brl(i.subtotal_centavos)),h("small",null,`${i.quantidade} x ${brl(i.preco_unit_centavos)}${i.obs?` • Obs. do cliente: ${i.obs}`:""}`))));
 /* pagamento */
 const sp=h("select",{class:"in","aria-label":"Situação do pagamento"},Object.keys(PG).map(k=>h("option",{value:k,selected:p.pagamento_status===k},PG[k])));
 const pagt=h("section",{class:"panel"},h("h2",null,"Pagamento"),kv(["Forma escolhida pelo cliente",p.pagamento_forma],["Troco",p.pagamento_troco||"—"],["Situação",pill(PG[p.pagamento_status],"p-"+p.pagamento_status)]),
  h("p",{class:"s"},"A escolha do cliente no site não comprova pagamento. Só marque como confirmado após conferir o recebimento."),
  h("label",{class:"f"},"Atualizar situação",sp),h("button",{class:"btn o",type:"button",onclick:()=>run(async()=>{if(sp.value===p.pagamento_status)return;await API.rpc("atualizar_pagamento",{p_id:id,p_versao:p.versao,p_status:sp.value});await recarrega("Pagamento atualizado")})},"Salvar situação"));
 /* frete */
 const fs=h("select",{class:"in","aria-label":"Situação do frete"},Object.keys(FR).map(k=>h("option",{value:k,selected:p.frete_situacao===k},FR[k]))),
  fv=h("input",{class:"in",inputmode:"decimal",placeholder:"Ex.: 85,00","aria-label":"Valor do frete",value:p.frete_centavos?String(p.frete_centavos/100).replace(".",","):""}),
  fm=h("input",{class:"in",maxlength:"60","aria-label":"Modalidade",placeholder:"Ex.: transportadora, motoboy",value:p.frete_modalidade||""}),
  fp=h("input",{class:"in",maxlength:"60","aria-label":"Prazo",placeholder:"Ex.: 2 dias úteis",value:p.frete_prazo||""}),
  fo=h("textarea",{class:"in",maxlength:"300","aria-label":"Observações logísticas",placeholder:"Observações logísticas"},p.frete_obs||""),fe=h("div",{class:"err",role:"alert",hidden:true});
 const frete=h("section",{class:"panel"},h("h2",null,"Frete"),pill(FR[p.frete_situacao],"f-"+p.frete_situacao),
  p.frete_atualizado_em?h("p",{class:"s"},`Última alteração: ${dt(p.frete_atualizado_em)}${p.frete_atualizado_por?" por "+p.frete_atualizado_por:""}`):null,
  final?h("p",{class:"s"},"Pedido encerrado: frete bloqueado."):[
  h("hr",{class:"sep"}),h("label",{class:"f"},"Situação",fs),h("div",{class:"g2"},h("label",{class:"f"},"Valor (R$)",fv),h("label",{class:"f"},"Prazo",fp)),h("label",{class:"f"},"Modalidade",fm),h("label",{class:"f"},"Observações logísticas",fo),fe,
  h("button",{class:"btn",type:"button",onclick:()=>run(async()=>{const s=fs.value;let v=null;
   if(["calculado","informado","aceito"].includes(s)){v=reaisCent(fv.value);if(!v||v<=0){fe.hidden=false;fe.textContent="Informe um valor maior que zero. Para frete sem cobrança, escolha “Sem cobrança de frete”.";return}}
   fe.hidden=true;await API.rpc("registrar_frete",{p_id:id,p_versao:p.versao,p_situacao:s,p_valor:v,p_modalidade:fm.value,p_prazo:fp.value,p_obs:fo.value});await recarrega("Frete registrado")})},"Salvar frete")]);
 /* resumo */
 const fr=p.frete_situacao==="pendente"?(casa?h("span",{class:"p"},"Pendente de cálculo pela equipe"):"—"):p.frete_situacao==="sem_cobranca"?"Sem cobrança (confirmado)":brl(p.frete_centavos);
 const res=h("section",{class:"panel"},h("h2",null,"Resumo financeiro"),h("div",{class:"tot"},h("span",null,"Subtotal dos produtos"),h("b",null,brl(p.subtotal_centavos)),p.desconto_centavos>0?[h("span",null,"Descontos"),h("b",null,"− "+brl(p.desconto_centavos))]:null,
  h("span",null,"Frete"),h("b",null,fr),h("span",null,"Total final"),p.total_centavos==null?h("span",{class:"p"},"Aguardando definição do frete"):h("span",{class:"g"},brl(p.total_centavos))));
 /* histórico + nota interna */
 const nt=h("textarea",{class:"in",maxlength:"1000",placeholder:"Nota interna (só a equipe vê)","aria-label":"Nota interna"});
 const desc=x=>x.tipo==="status"?`Status: ${x.de?ST[x.de]+" → ":""}${ST[x.para]||x.para}${x.detalhe?` — ${x.detalhe}`:""}`:x.tipo==="frete"?`Frete: ${FR[x.para]||x.para}${x.detalhe?` — ${x.detalhe}`:""}`:x.tipo==="pagamento"?`Pagamento: ${PG[x.para]||x.para}${x.detalhe?` — ${x.detalhe}`:""}`:x.tipo==="nota"?x.detalhe:"Pedido visualizado";
 const hi=h("section",{class:"panel"},h("h2",null,"Observações internas e histórico"),h("label",{class:"f"},"Adicionar nota interna",nt),
  h("button",{class:"btn o",type:"button",onclick:()=>run(async()=>{if(nt.value.trim().length<2)return;await API.rpc("adicionar_nota",{p_id:id,p_texto:nt.value});await recarrega("Nota adicionada")})},"Salvar nota"),h("hr",{class:"sep"}),
  h("ul",{class:"hist"},hist.map(x=>h("li",{class:x.tipo==="nota"?"nota":""},h("small",null,`${dt(x.criado_em)} • ${x.usuario_nome||"sistema"}${x.tipo==="nota"?" • NOTA INTERNA":""}`),desc(x)))));
 return shell("pedidos","Pedido #"+p.codigo,[ident,h("div",{class:"det"},h("div",null,cli,ent,prod,pagt),h("div",null,frete,res,hi))],h("a",{class:"btn o sm",href:"#/pedidos"},"← Voltar à lista"));
}

/* ---------- roteador ---------- */
async function draw(){
 const raiz=$("#app");
 if(!API.cfgOk()){raiz.replaceChildren(h("div",{class:"login"},h("div",{class:"lbox"},marca(),h("h1",null,"Sistema não configurado"),h("p",{class:"s"},"Preencha SUPABASE_URL e SUPABASE_ANON_KEY em js/config.js (veja ADMIN_SETUP.md).")))); return}
 if(S.recTok){raiz.replaceChildren(viewNovaSenha());return}
 if(!API.logado()){raiz.replaceChildren(viewLogin());return}
 const [path,qs]=location.hash.slice(1).split("?"),q=new URLSearchParams(qs||""),m=(path||"/").match(/^\/pedido\/([\w-]+)$/);
 try{
  const tela=m?await viewPedido(m[1]):path==="/pedidos"?await viewPedidos(q):await viewPainel();
  S.live=true;raiz.replaceChildren(tela);window.scrollTo(0,0);
 }catch(e){
  if(e.codigo==="sessao_expirada"||e.codigo==="nao_autorizado"){const msg=msgErr(e);await API.logout();raiz.replaceChildren(viewLogin(msg));return}
  S.live=false;raiz.replaceChildren(shell("painel","Painel",h("div",{class:"panel"},vazio("Não foi possível carregar",msgErr(e)),h("div",{class:"acts"},h("button",{class:"btn",type:"button",onclick:draw},"Tentar de novo")))));
 }
}
/* ---------- atualização automática (consulta a cada 15 s; pausa com a aba escondida) ---------- */
async function tick(){
 if(!API.logado()||document.hidden||S.recTok)return;
 try{
  const c=await API.rpc("contagens");const antes=S.ultimo;S.cont=c;S.ultimo=c.total;S.live=true;
  const li=$("#live");if(li){li.className="live";li.lastChild.textContent="Atualização automática"}
  if(antes!=null&&c.total>antes){toast(`${c.total-antes} novo(s) pedido(s) recebido(s)`);document.title=`(${c.novos}) ROMMO • Painel de pedidos`;
   if(!/^#\/pedido\//.test(location.hash))draw()}                       /* não recarrega o detalhe: evita perder o que está sendo digitado */
  document.querySelectorAll(".badge").forEach(b=>{if(c.novos>0)b.textContent=c.novos})
 }catch(e){if(e.codigo==="sessao_expirada")return draw();S.live=false;const li=$("#live");if(li){li.className="live off";li.lastChild.textContent="Sem conexão — tentando de novo"}}
}
addEventListener("hashchange",draw);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)tick()});
/* link de recuperação de senha: o token chega no # e é removido da barra de endereço */
(()=>{const p=new URLSearchParams(location.hash.slice(1));if(p.get("type")==="recovery"&&p.get("access_token")){S.recTok=p.get("access_token");history.replaceState(null,"",location.pathname)}})();
draw();tmr=setInterval(tick,15000);
})();
