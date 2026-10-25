const STATUSES = new Set(['recebido','em_analise','aguardando_cliente','confirmado','em_separacao','pronto','despachado','concluido','cancelado']);
const corsHeaders = {'Access-Control-Allow-Origin':'same-origin','Access-Control-Allow-Credentials':'true','Vary':'Origin'};
const json = (data,status=200,headers={}) => new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...corsHeaders,...headers}});
const fail = (code,status=400) => json({error:code},status);
const now = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();
async function sha256(s){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function cookieVal(req,name){const raw=req.headers.get('Cookie')||'';const m=raw.match(new RegExp('(?:^|;\\s*)'+name+'=([^;]+)'));return m?decodeURIComponent(m[1]):''}
function setCookie(value,maxAge){return `rommo_session=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`}
async function body(req){try{return await req.json()}catch{return null}}
async function requireAdmin(req,env){const raw=cookieVal(req,'rommo_session');if(!raw)return null;const hash=await sha256(raw);const row=await env.DB.prepare('SELECT email, expires_at FROM admin_sessions WHERE token_hash=?').bind(hash).first();if(!row||row.expires_at<Math.floor(Date.now()/1000)){if(row)await env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(hash).run();return null}return {email:row.email,hash}}
async function route(req,env){const url=new URL(req.url),path=url.pathname,method=req.method;
 if(method==='OPTIONS')return new Response(null,{status:204,headers:{...corsHeaders,'Access-Control-Allow-Methods':'GET,POST,PATCH,OPTIONS','Access-Control-Allow-Headers':'Content-Type'}});
 if(path==='/api/health'&&method==='GET')return json({ok:true,service:'rommo-api'});
 if(path==='/api/orders'&&method==='POST'){
  const p=await body(req);if(!p||typeof p!=='object')return fail('dados_invalidos');
  const name=String(p.customer?.name||'').trim(),phone=String(p.customer?.phone||'').replace(/\D/g,''),email=String(p.customer?.email||'').trim().slice(0,160),customerNote=String(p.customerNote||'').trim().slice(0,1000);
  const delivery=String(p.delivery?.type||'');const payment=String(p.payment?.method||'');const items=Array.isArray(p.items)?p.items:[];
  if(name.length<3||phone.length<10||phone.length>11||!['Entrega','Retirada na loja'].includes(delivery)||!payment||!items.length||items.length>50|| (email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))return fail('dados_invalidos');
  if(delivery==='Entrega'&&(!/^\d{8}$/.test(String(p.delivery?.postalCode||'').replace(/\D/g,''))||!p.delivery?.street||!p.delivery?.number||!p.delivery?.city||!p.delivery?.state))return fail('dados_invalidos');
  const key=String(p.idempotencyKey||'');if(!/^[a-zA-Z0-9-]{16,80}$/.test(key))return fail('dados_invalidos');
  const prior=await env.DB.prepare('SELECT code FROM orders WHERE idempotency_key=?').bind(key).first();if(prior)return json({ok:true,code:prior.code,duplicate:true});
  let subtotal=0,checked=[];
  for(const item of items){const id=Number(item.productId),qty=Number(item.quantity);if(!Number.isInteger(id)||!Number.isInteger(qty)||qty<1||qty>999)return fail('quantidade_invalida');const prod=await env.DB.prepare('SELECT id,name,price_cents FROM products WHERE id=? AND active=1').bind(id).first();if(!prod)return fail('produto_invalido',409);if(Number(item.unitPriceCents)!==prod.price_cents)return fail('preco_desatualizado',409);const line=prod.price_cents*qty;subtotal+=line;checked.push({id:prod.id,name:prod.name,price:prod.price_cents,qty,line,note:String(item.note||'').slice(0,500)});}
  if(!Number.isSafeInteger(subtotal)||subtotal<0)return fail('dados_invalidos');
  const id=uuid(),d=new Date(),code=`${String(d.getFullYear()).slice(-2)}${String(d.getMonth()+1).padStart(2,'0')}-${crypto.randomUUID().slice(0,6).toUpperCase()}`;
  const a=p.delivery||{},pay=p.payment||{};
  try{
   await env.DB.prepare(`INSERT INTO orders(id,code,idempotency_key,status,customer_name,customer_phone,customer_email,customer_note,delivery_type,postal_code,street,street_number,complement,district,city,state,payment_method,payment_change,subtotal_cents) VALUES(?,?,?,'recebido',?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id,code,key,name,phone,email||null,customerNote||null,delivery,delivery==='Entrega'?String(a.postalCode||'').replace(/\D/g,''):null,delivery==='Entrega'?String(a.street||'').trim():null,delivery==='Entrega'?String(a.number||'').trim():null,String(a.complement||'').trim(),delivery==='Entrega'?String(a.district||'').trim():null,delivery==='Entrega'?String(a.city||'').trim():'Planaltina',delivery==='Entrega'?String(a.state||'').trim().toUpperCase():'GO',payment,String(pay.change||'').slice(0,50),subtotal).run();
   for(const x of checked)await env.DB.prepare('INSERT INTO order_items(order_id,product_id,product_name,unit_price_cents,quantity,subtotal_cents,note) VALUES(?,?,?,?,?,?,?)').bind(id,x.id,x.name,x.price,x.qty,x.line,x.note).run();
   await env.DB.prepare("INSERT INTO order_history(order_id,event_type,detail) VALUES(?,'pedido_criado','Pedido recebido pelo site')").bind(id).run();
  }catch(e){if(String(e).includes('UNIQUE')){const old=await env.DB.prepare('SELECT code FROM orders WHERE idempotency_key=?').bind(key).first();if(old)return json({ok:true,code:old.code,duplicate:true})}return fail('erro_interno',500)}
  return json({ok:true,code,id},201);
 }
 if(path.startsWith('/api/admin/')){
  if(path==='/api/admin/login'&&method==='POST'){
   const p=await body(req);const email=String(p?.email||'').trim().toLowerCase(),password=String(p?.password||'');
   if(!env.ADMIN_EMAIL||!env.ADMIN_PASSWORD)return fail('admin_nao_configurado',503);
   if(email!==String(env.ADMIN_EMAIL).trim().toLowerCase()||password!==env.ADMIN_PASSWORD){await new Promise(r=>setTimeout(r,350));return fail('credenciais_invalidas',401)}
   const maxAge=p?.remember===false?60*60*12:60*60*24*7;const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join(''),hash=await sha256(token),expires=Math.floor(Date.now()/1000)+maxAge;
   await env.DB.prepare('INSERT INTO admin_sessions(token_hash,email,expires_at) VALUES(?,?,?)').bind(hash,email,expires).run();
   return json({ok:true,email},200,{'Set-Cookie':setCookie(token,maxAge)});
  }
  if(path==='/api/admin/logout'&&method==='POST'){
   const raw=cookieVal(req,'rommo_session');if(raw)await env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(await sha256(raw)).run();
   return json({ok:true},200,{'Set-Cookie':setCookie('',0)});
  }
  const admin=await requireAdmin(req,env);if(!admin)return fail('nao_autorizado',401);
  if(path==='/api/admin/me'&&method==='GET')return json({email:admin.email});
  if(path==='/api/admin/orders'&&method==='GET'){
   const status=url.searchParams.get('status')||'',group=url.searchParams.get('group')||'',q=(url.searchParams.get('q')||'').trim().slice(0,100),limit=Math.min(10,Math.max(1,Number(url.searchParams.get('limit')||10)));
   const beforeDate=url.searchParams.get('beforeDate')||'',beforeId=url.searchParams.get('beforeId')||'';
   let where=' WHERE 1=1',args=[];
   if(group==='new'){where+=' AND o.status=\'recebido\''}else if(group==='active'){where+=" AND o.status NOT IN ('recebido','concluido','cancelado')"}else if(group==='done'){where+=" AND o.status IN ('concluido','cancelado')"}else if(group==='overdue'){where+=" AND o.status NOT IN ('concluido','cancelado') AND o.created_at<=?";args.push(new Date(Date.now()-30*60*1000).toISOString())}if(status&&STATUSES.has(status)){where+=' AND o.status=?';args.push(status)}
   if(q){where+=' AND (o.code LIKE ? OR o.customer_name LIKE ? OR o.customer_phone LIKE ? OR o.customer_email LIKE ?)';args.push(`%${q}%`,`%${q}%`,`%${q}%`,`%${q}%`)}
   const totalRow=await env.DB.prepare('SELECT COUNT(*) AS total FROM orders o'+where).bind(...args).first();
   let pageWhere=where,pageArgs=[...args];
   if(beforeDate&&beforeId){pageWhere+=' AND (o.created_at < ? OR (o.created_at = ? AND o.id < ?))';pageArgs.push(beforeDate,beforeDate,beforeId)}
   const direction=group==='overdue'?'ASC':'DESC';const sql='SELECT o.*, (SELECT COUNT(*) FROM order_items i WHERE i.order_id=o.id) AS item_count, (SELECT COALESCE(SUM(quantity),0) FROM order_items i WHERE i.order_id=o.id) AS unit_count FROM orders o'+pageWhere+' ORDER BY o.created_at '+direction+',o.id '+direction+' LIMIT ?';
   pageArgs.push(limit+1);const result=await env.DB.prepare(sql).bind(...pageArgs).all(),all=result.results||[],hasMore=all.length>limit,orders=all.slice(0,limit),last=orders[orders.length-1];
   return json({orders,total:Number(totalRow?.total||0),hasMore,nextCursor:hasMore&&last?{created_at:last.created_at,id:last.id}:null});
  }
  if(path==='/api/admin/orders/delete-by-date'&&method==='POST'){
   const p=await body(req),from=String(p?.from||''),to=String(p?.to||''),confirmation=String(p?.confirmation||'');
   const validDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v+'T00:00:00.000Z'))&&new Date(v+'T00:00:00.000Z').toISOString().slice(0,10)===v;
   if(!validDate(from)||!validDate(to)||from>to||confirmation!=='CONFIRMO A EXCLUSÃO')return fail('confirmacao_ou_datas_invalidas');
   const start=from+'T00:00:00.000Z',endDate=new Date(Date.parse(to+'T00:00:00.000Z')+86400000).toISOString().slice(0,10),end=endDate+'T00:00:00.000Z';
   const count=await env.DB.prepare('SELECT COUNT(*) AS total FROM orders WHERE created_at >= ? AND created_at < ?').bind(start,end).first();
   const deleted=Number(count?.total||0);
   if(deleted){await env.DB.prepare('DELETE FROM orders WHERE created_at >= ? AND created_at < ?').bind(start,end).run()}
   return json({ok:true,deleted,from,to});
  }
  const detail=path.match(/^\/api\/admin\/orders\/([0-9a-f-]+)$/i);
  if(detail&&method==='GET'){
   const order=await env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(detail[1]).first();if(!order)return fail('nao_encontrado',404);
   const items=await env.DB.prepare('SELECT * FROM order_items WHERE order_id=? ORDER BY id').bind(detail[1]).all();const history=await env.DB.prepare('SELECT * FROM order_history WHERE order_id=? ORDER BY id DESC').bind(detail[1]).all();
   await env.DB.prepare("UPDATE orders SET seen_at=COALESCE(seen_at,?) WHERE id=?").bind(now(),detail[1]).run();return json({order,items:items.results||[],history:history.results||[]});
  }
  const upd=path.match(/^\/api\/admin\/orders\/([0-9a-f-]+)\/status$/i);
  if(upd&&method==='PATCH'){
   const p=await body(req),status=String(p?.status||'');if(!STATUSES.has(status))return fail('status_invalido');const order=await env.DB.prepare('SELECT status,version FROM orders WHERE id=?').bind(upd[1]).first();if(!order)return fail('nao_encontrado',404);if(p?.version!==undefined&&Number(p.version)!==order.version)return fail('conflito',409);
   await env.DB.prepare('UPDATE orders SET status=?,updated_at=?,version=version+1 WHERE id=?').bind(status,now(),upd[1]).run();await env.DB.prepare('INSERT INTO order_history(order_id,actor,event_type,detail) VALUES(?,?,?,?)').bind(upd[1],admin.email,'status',`${order.status} → ${status}${p?.note?': '+String(p.note).slice(0,500):''}`).run();return json({ok:true});
  }
  if(path==='/api/admin/summary'&&method==='GET'){
   const c=await env.DB.prepare("SELECT COUNT(*) AS total, SUM(CASE WHEN status='recebido' THEN 1 ELSE 0 END) AS novos, SUM(CASE WHEN status NOT IN ('concluido','cancelado') THEN 1 ELSE 0 END) AS abertos FROM orders").first();return json(c||{total:0,novos:0,abertos:0});
  }
  return fail('rota_nao_encontrada',404);
 }
 return env.ASSETS.fetch(req);
}
export default {async fetch(req,env){try{return await route(req,env)}catch(e){return fail('erro_interno',500)}}};
