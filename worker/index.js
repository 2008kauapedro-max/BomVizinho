const STATUSES = new Set(['recebido','em_analise','aguardando_cliente','confirmado','em_separacao','pronto','despachado','concluido','cancelado']);
const corsHeaders = {'Access-Control-Allow-Origin':'same-origin','Access-Control-Allow-Credentials':'true','Vary':'Origin'};
const json = (data,status=200,headers={}) => new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...corsHeaders,...headers}});
const fail = (code,status=400) => json({error:code},status);
const now = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();
async function sha256(s){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function cookieVal(req,name){const raw=req.headers.get('Cookie')||'';const m=raw.match(new RegExp('(?:^|;\\s*)'+name+'=([^;]+)'));if(!m)return '';try{return decodeURIComponent(m[1])}catch{return ''}}
function safeEqual(left,right){const a=new TextEncoder().encode(String(left)),b=new TextEncoder().encode(String(right));let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a[i]||0)^(b[i]||0);return diff===0}
function setCookie(value,maxAge){return `rommo_session=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`}
async function body(req){try{return await req.json()}catch{return null}}
async function requireCustomer(req,env){const raw=cookieVal(req,'bv_customer');if(!raw)return null;const hash=await sha256(raw);const row=await env.DB.prepare('SELECT customer_id,expires_at FROM customer_sessions WHERE token_hash=?').bind(hash).first();if(!row||row.expires_at<Math.floor(Date.now()/1000)){if(row)await env.DB.prepare('DELETE FROM customer_sessions WHERE token_hash=?').bind(hash).run();return null}return {id:row.customer_id,hash}}
async function passwordHash(password,salt){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:210000,hash:'SHA-256'},key,256);return [...new Uint8Array(bits)].map(x=>x.toString(16).padStart(2,'0')).join('')}
const customerCookie=(value,maxAge)=>`bv_customer=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
async function requireAdmin(req,env){const raw=cookieVal(req,'rommo_session');if(!raw)return null;const hash=await sha256(raw);const row=await env.DB.prepare('SELECT email, expires_at FROM admin_sessions WHERE token_hash=?').bind(hash).first();if(!row||row.expires_at<Math.floor(Date.now()/1000)){if(row)await env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(hash).run();return null}return {email:row.email,hash}}
async function route(req,env){const url=new URL(req.url),path=url.pathname,method=req.method;
 if(method==='OPTIONS')return new Response(null,{status:204,headers:{...corsHeaders,'Access-Control-Allow-Methods':'GET,POST,PATCH,OPTIONS','Access-Control-Allow-Headers':'Content-Type'}});
 if(path==='/api/health'&&method==='GET')return json({ok:true,service:'rommo-api'});
 if(path==='/api/products'&&method==='GET'){const result=await env.DB.prepare('SELECT id,name,category,description,price_cents,image_url,stock,sku FROM products WHERE active=1 ORDER BY category,name').all();return json({products:result.results||[]})}
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
 // Customer account and persistent cart API
 if(path==='/api/customer/register'&&method==='POST'){
  const p=await body(req),name=String(p?.name||'').trim(),email=String(p?.email||'').trim().toLowerCase(),phone=String(p?.phone||'').replace(/\D/g,''),password=String(p?.password||'');
  if(name.length<2||name.length>120||email.length>160||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||phone.length<10||phone.length>13||password.length<10||password.length>128)return fail('dados_invalidos');
  const id=uuid(),salt=Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join(''),hash=await passwordHash(password,salt);
  try{await env.DB.prepare('INSERT INTO customers(id,name,email,phone,password_hash,password_salt,marketing_consent) VALUES(?,?,?,?,?,?,?)').bind(id,name,email,phone,hash,salt,p.marketingConsent===true?1:0).run()}catch(e){if(String(e).includes('UNIQUE'))return fail('email_ja_cadastrado',409);throw e}
  const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join(''),tokenHash=await sha256(token),expires=Math.floor(Date.now()/1000)+60*60*24*30;
  await env.DB.prepare('INSERT INTO customer_sessions(token_hash,customer_id,expires_at) VALUES(?,?,?)').bind(tokenHash,id,expires).run();
  return json({ok:true,customer:{id,name,email,phone,marketingConsent:p.marketingConsent===true}},201,{'Set-Cookie':customerCookie(token,60*60*24*30)});
 }
 if(path==='/api/customer/login'&&method==='POST'){
  const p=await body(req),email=String(p?.email||'').trim().toLowerCase(),password=String(p?.password||'');if(email.length>160||password.length>128)return fail('credenciais_invalidas',401);const c=await env.DB.prepare('SELECT id,name,email,phone,password_hash,password_salt,marketing_consent FROM customers WHERE email=?').bind(email).first();
  if(!c){if(password)await passwordHash(password,'bomvizinho-login-dummy-salt-v1');return fail('credenciais_invalidas',401)}
  if(!password||!safeEqual(await passwordHash(password,c.password_salt),c.password_hash))return fail('credenciais_invalidas',401);
  const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join(''),expires=Math.floor(Date.now()/1000)+60*60*24*30;await env.DB.prepare('INSERT INTO customer_sessions(token_hash,customer_id,expires_at) VALUES(?,?,?)').bind(await sha256(token),c.id,expires).run();
  return json({ok:true,customer:{id:c.id,name:c.name,email:c.email,phone:c.phone,marketingConsent:!!c.marketing_consent}},200,{'Set-Cookie':customerCookie(token,60*60*24*30)});
 }
 if(path==='/api/customer/logout'&&method==='POST'){const raw=cookieVal(req,'bv_customer');if(raw)await env.DB.prepare('DELETE FROM customer_sessions WHERE token_hash=?').bind(await sha256(raw)).run();return json({ok:true},200,{'Set-Cookie':customerCookie('',0)});}
 if(path.startsWith('/api/customer/')){
  const customer=await requireCustomer(req,env);if(!customer)return fail('nao_autorizado',401);
  if(path==='/api/customer/me'&&method==='GET'){const c=await env.DB.prepare('SELECT id,name,email,phone,marketing_consent FROM customers WHERE id=?').bind(customer.id).first();return c?json({customer:{id:c.id,name:c.name,email:c.email,phone:c.phone,marketingConsent:!!c.marketing_consent}}):fail('nao_encontrado',404)}
  if(path==='/api/customer/preferences'&&method==='PATCH'){
   const p=await body(req);if(typeof p?.marketingConsent!=='boolean')return fail('dados_invalidos');const r=await env.DB.prepare('UPDATE customers SET marketing_consent=?,updated_at=? WHERE id=?').bind(p.marketingConsent?1:0,now(),customer.id).run();if(!r.meta?.changes)return fail('nao_encontrado',404);return json({ok:true,marketingConsent:p.marketingConsent});
  }
  if(path==='/api/customer/cart'&&method==='GET'){const activity=now();await env.DB.prepare('UPDATE customer_carts SET updated_at=?,recovered_at=? WHERE customer_id=?').bind(activity,activity,customer.id).run();const r=await env.DB.prepare('SELECT i.product_id,i.quantity,i.note,p.name,p.category,p.price_cents,p.image_url,p.active FROM customer_cart_items i JOIN products p ON p.id=i.product_id WHERE i.customer_id=? ORDER BY p.name').bind(customer.id).all();return json({items:r.results||[]})}
  if(path==='/api/customer/cart'&&method==='PUT'){
   const p=await body(req);if(!Array.isArray(p?.items))return fail('carrinho_invalido');const items=p.items;if(items.length>100)return fail('carrinho_invalido');const byId=new Map();
   for(const x of items){if(!x||typeof x!=='object')return fail('carrinho_invalido');const id=Number(x.productId),quantity=Number(x.quantity);if(!Number.isInteger(id)||id<1||!Number.isInteger(quantity)||quantity<1||quantity>999)return fail('carrinho_invalido');const existing=byId.get(id);if(existing&&existing.quantity+quantity>999)return fail('carrinho_invalido');byId.set(id,{id,quantity:(existing?.quantity||0)+quantity,note:String(x.note||existing?.note||'').slice(0,500)})}
   if(byId.size>50)return fail('carrinho_invalido');for(const x of byId.values()){const prod=await env.DB.prepare('SELECT id FROM products WHERE id=? AND active=1').bind(x.id).first();if(!prod)return fail('produto_invalido',409)}
   const statements=[env.DB.prepare('INSERT INTO customer_carts(customer_id,updated_at,reminder_sent_at,recovered_at) VALUES(?,?,NULL,NULL) ON CONFLICT(customer_id) DO UPDATE SET updated_at=excluded.updated_at,reminder_sent_at=NULL,recovered_at=NULL').bind(customer.id,now()),env.DB.prepare('DELETE FROM customer_cart_items WHERE customer_id=?').bind(customer.id),...Array.from(byId.values(),x=>env.DB.prepare('INSERT INTO customer_cart_items(customer_id,product_id,quantity,note) VALUES(?,?,?,?)').bind(customer.id,x.id,x.quantity,x.note))];await env.DB.batch(statements);return json({ok:true,count:byId.size});
  }
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
  if(path==='/api/admin/products'&&method==='GET'){
   const q=(url.searchParams.get('q')||'').trim().slice(0,100),active=url.searchParams.get('active');let sql='SELECT id,name,category,description,price_cents,image_url,stock,sku,active,updated_at FROM products WHERE 1=1',args=[];
   if(q){sql+=' AND (name LIKE ? OR category LIKE ? OR sku LIKE ?)';args.push(`%${q}%`,`%${q}%`,`%${q}%`)}if(active==='1'||active==='0'){sql+=' AND active=?';args.push(Number(active))}sql+=' ORDER BY updated_at DESC,id DESC';const r=await env.DB.prepare(sql).bind(...args).all();return json({products:r.results||[]});
  }
  if(path==='/api/admin/products'&&method==='POST'){
   const p=await body(req);if(!p||typeof p!=='object')return fail('dados_invalidos');const name=String(p.name||'').trim().slice(0,160),category=String(p.category||'').trim().slice(0,80),description=String(p.description||'').trim().slice(0,2000),sku=String(p.sku||'').trim().slice(0,60),image=String(p.image_url||'').trim().slice(0,1000),price=Number(p.price_cents),stock=Number(p.stock);
   if(name.length<2||!category||!Number.isSafeInteger(price)||price<0||!Number.isInteger(stock)||stock<0||stock>1000000|| (image&&!/^https:\/\//i.test(image)&&!/^\/assets\//i.test(image)))return fail('dados_invalidos');
   try{const r=await env.DB.prepare('INSERT INTO products(name,category,description,price_cents,image_url,stock,sku,active,updated_at) VALUES(?,?,?,?,?,?,?, ?,?)').bind(name,category,description,price,image,stock,sku,p.active===false?0:1,now()).run();return json({ok:true,id:r.meta?.last_row_id},201)}catch(e){if(String(e).includes('UNIQUE'))return fail('sku_duplicado',409);throw e}
  }
  const productRoute=path.match(/^\/api\/admin\/products\/(\d+)$/);
  if(productRoute&&method==='PATCH'){
   const id=Number(productRoute[1]),p=await body(req);if(!p||typeof p!=='object')return fail('dados_invalidos');const name=String(p.name||'').trim().slice(0,160),category=String(p.category||'').trim().slice(0,80),description=String(p.description||'').trim().slice(0,2000),sku=String(p.sku||'').trim().slice(0,60),image=String(p.image_url||'').trim().slice(0,1000),price=Number(p.price_cents),stock=Number(p.stock),active=p.active===false?0:1;
   if(name.length<2||!category||!Number.isSafeInteger(price)||price<0||!Number.isInteger(stock)||stock<0||stock>1000000||(image&&!/^https:\/\//i.test(image)&&!/^\/assets\//i.test(image)))return fail('dados_invalidos');
   try{const r=await env.DB.prepare('UPDATE products SET name=?,category=?,description=?,price_cents=?,image_url=?,stock=?,sku=?,active=?,updated_at=? WHERE id=?').bind(name,category,description,price,image,stock,sku,active,now(),id).run();if(!r.meta?.changes)return fail('nao_encontrado',404);return json({ok:true})}catch(e){if(String(e).includes('UNIQUE'))return fail('sku_duplicado',409);throw e}
  }
  if(path==='/api/admin/settings'&&method==='GET'){const r=await env.DB.prepare('SELECT setting_key,setting_value,updated_at FROM store_settings ORDER BY setting_key').all();return json({settings:r.results||[]})}
  if(path==='/api/admin/settings'&&method==='PUT'){const p=await body(req);if(!p||typeof p.settings!=='object'||Array.isArray(p.settings))return fail('dados_invalidos');const allowed=new Set(['store_name','whatsapp','store_email','instagram','address','delivery_notes','payment_methods']);for(const [k,v] of Object.entries(p.settings)){if(!allowed.has(k)||typeof v!=='string'||v.length>1000)return fail('configuracao_invalida');await env.DB.prepare('INSERT INTO store_settings(setting_key,setting_value,updated_at) VALUES(?,?,?) ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value,updated_at=excluded.updated_at').bind(k,v,now()).run()}return json({ok:true})}

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
  if(path==='/api/admin/abandoned-carts'&&method==='GET'){
   const requestedMinutes=Number(url.searchParams.get('minutes')||60),minutes=Number.isFinite(requestedMinutes)?Math.min(10080,Math.max(30,Math.floor(requestedMinutes))):60;const cutoff=new Date(Date.now()-minutes*60000).toISOString();
   const r=await env.DB.prepare(`SELECT c.id,c.name,c.email,c.phone,c.marketing_consent,cc.updated_at,cc.reminder_sent_at,COUNT(ci.product_id) AS product_count,COALESCE(SUM(ci.quantity),0) AS unit_count FROM customer_carts cc JOIN customers c ON c.id=cc.customer_id JOIN customer_cart_items ci ON ci.customer_id=c.id WHERE cc.updated_at<=? AND cc.recovered_at IS NULL AND c.marketing_consent=1 GROUP BY c.id ORDER BY cc.updated_at ASC LIMIT 200`).bind(cutoff).all();
   const rows=[];for(const c of r.results||[]){const items=await env.DB.prepare('SELECT p.name,ci.quantity FROM customer_cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.customer_id=? ORDER BY p.name').bind(c.id).all();rows.push({...c,items:items.results||[]})}return json({carts:rows,minimum_idle_minutes:minutes});
  }
  if(path.match(/^\/api\/admin\/abandoned-carts\/[0-9a-f-]+\/reminded$/i)&&method==='POST'){
   const id=path.split('/')[4];const r=await env.DB.prepare('UPDATE customer_carts SET reminder_sent_at=? WHERE customer_id=? AND recovered_at IS NULL AND EXISTS (SELECT 1 FROM customers WHERE customers.id=customer_carts.customer_id AND marketing_consent=1)').bind(now(),id).run();if(!r.meta?.changes)return fail('nao_encontrado',404);return json({ok:true});
  }
  if(path==='/api/admin/summary'&&method==='GET'){
   const c=await env.DB.prepare("SELECT COUNT(*) AS total, SUM(CASE WHEN status='recebido' THEN 1 ELSE 0 END) AS novos, SUM(CASE WHEN status NOT IN ('concluido','cancelado') THEN 1 ELSE 0 END) AS abertos FROM orders").first();return json(c||{total:0,novos:0,abertos:0});
  }
  return fail('rota_nao_encontrada',404);
 }
 return env.ASSETS.fetch(req);
}
export default {async fetch(req,env){try{return await route(req,env)}catch(e){return fail('erro_interno',500)}}};
