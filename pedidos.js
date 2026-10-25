/* ROMMO – envio do pedido para o banco compartilhado (Supabase). O servidor revalida tudo (preços, quantidades, dados). */
const BACKEND_ATIVO=()=>!!(window.ROMMO_CONFIG&&ROMMO_CONFIG.SUPABASE_URL&&ROMMO_CONFIG.SUPABASE_ANON_KEY);
const centavos=reais=>Math.round(reais*100);                       /* dinheiro sempre em centavos inteiros ao falar com o servidor */
const novaChave=()=>(crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2)+"xxxxxxxxxxxx").replace(/[^a-z0-9-]/gi,"");
async function registrarPedido(payload){
 const C=ROMMO_CONFIG,h={apikey:C.SUPABASE_ANON_KEY,"Content-Type":"application/json"};
 if(/^eyJ/.test(C.SUPABASE_ANON_KEY))h.Authorization="Bearer "+C.SUPABASE_ANON_KEY;
 const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),20000);
 try{
  const r=await fetch(C.SUPABASE_URL.replace(/\/$/,"")+"/rest/v1/rpc/criar_pedido",{method:"POST",headers:h,body:JSON.stringify({p:payload}),signal:ctl.signal});
  let d=null;try{d=await r.json()}catch(e){}
  if(!r.ok){const e=new Error((d&&d.message)||"erro");e.codigo=(d&&d.message)||"erro";throw e}
  if(!d||!d.codigo)throw Object.assign(new Error("resposta_invalida"),{codigo:"resposta_invalida"});   /* só vale como salvo se o servidor devolveu o código */
  return d;
 }catch(e){if(e.name==="AbortError")e.codigo="timeout";else if(!e.codigo)e.codigo="rede";throw e}
 finally{clearTimeout(t)}
}
function msgErro(e){
 const m={dados_invalidos:"Confira os dados informados e tente novamente.",produto_invalido:"Um dos produtos não está mais disponível. Atualize a página e refaça o pedido.",
  preco_desatualizado:"O preço de algum produto mudou. Atualize a página para ver os valores atuais.",quantidade_invalida:"Quantidade inválida em um dos produtos.",
  muitas_tentativas:"Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.",limite_global:"O sistema está com muitos pedidos agora. Tente novamente em alguns minutos."};
 return m[e.codigo]||"Não conseguimos registrar o pedido agora. Verifique sua conexão e tente novamente — seus dados foram mantidos.";
}
