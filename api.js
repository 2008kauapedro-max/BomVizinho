/* ROMMO painel – cliente da API (Supabase Auth + RPC) sem bibliotecas. A sessão fica só nesta aba (sessionStorage). */
(()=>{
const C=window.ROMMO_CONFIG||{},K="rommo_admin_sessao";
let sess=null;try{sess=JSON.parse(sessionStorage.getItem(K)||"null")}catch(e){}
const salva=s=>{sess=s;try{s?sessionStorage.setItem(K,JSON.stringify(s)):sessionStorage.removeItem(K)}catch(e){}};
const base=()=>String(C.SUPABASE_URL||"").replace(/\/$/,"");
const cfgOk=()=>!!(C.SUPABASE_URL&&C.SUPABASE_ANON_KEY);
function hdr(tok){const h={apikey:C.SUPABASE_ANON_KEY,"Content-Type":"application/json"};const t=tok||(/^eyJ/.test(C.SUPABASE_ANON_KEY)?C.SUPABASE_ANON_KEY:null);if(t)h.Authorization="Bearer "+t;return h}
async function req(path,body,tok,method="POST"){
 const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),20000);
 try{
  const r=await fetch(base()+path,{method,headers:hdr(tok),body:body===undefined?undefined:JSON.stringify(body),signal:ctl.signal});
  let d=null;try{d=await r.json()}catch(e){}
  if(!r.ok){const e=new Error("erro");e.status=r.status;e.codigo=(d&&(d.message||d.error_code||d.msg))||"erro";throw e}
  return d;
 }catch(e){if(e.name==="AbortError"){e.codigo="timeout"}else if(!e.codigo){e.codigo="rede"}throw e}
 finally{clearTimeout(t)}
}
const guarda=d=>salva({access:d.access_token,refresh:d.refresh_token,exp:Math.floor(Date.now()/1000)+(d.expires_in||3600),email:(d.user&&d.user.email)||"",uid:d.user&&d.user.id});
async function renova(){
 if(!sess)throw Object.assign(new Error("sessao"),{codigo:"sessao_expirada"});
 if(sess.exp-Math.floor(Date.now()/1000)>60)return;
 try{const d=await req("/auth/v1/token?grant_type=refresh_token",{refresh_token:sess.refresh});guarda(d)}
 catch(e){salva(null);throw Object.assign(new Error("sessao"),{codigo:"sessao_expirada"})}
}
window.API={
 cfgOk,logado:()=>!!sess,email:()=>sess?sess.email:"",
 async login(email,senha){const d=await req("/auth/v1/token?grant_type=password",{email,password:senha});guarda(d)},
 async logout(){const s=sess;salva(null);if(s){try{await req("/auth/v1/logout",undefined,s.access)}catch(e){}}},
 recuperar:email=>req("/auth/v1/recover",{email}),
 async novaSenha(tokenRec,senha){await req("/auth/v1/user",{password:senha},tokenRec,"PUT")},
 async rpc(fn,args){
  await renova();
  try{return await req("/rest/v1/rpc/"+fn,args||{},sess.access)}
  catch(e){if(e.status===401){salva(null);e.codigo="sessao_expirada"}throw e}
 }
};
})();
