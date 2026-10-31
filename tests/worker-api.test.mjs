import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, test } from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workerSource = readFileSync(join(root, 'worker/index.js'), 'utf8');
const worker = (await import(`data:text/javascript;base64,${Buffer.from(workerSource).toString('base64')}`)).default;
const databases = new Set();
const sampleCustomer = {
  name: 'Cliente de Teste', phone: '61999990000', email: 'cliente.qa@example.test',
  password: 'senha-forte-local-123', marketingConsent: true,
};

class LocalD1Statement {
  constructor(db, sql, values = []) { this.db = db; this.sql = sql; this.values = values; }
  bind(...values) { return new LocalD1Statement(this.db, this.sql, values); }
  async first() { return this.db.prepare(this.sql).get(...this.values) ?? null; }
  async all() { return { results: this.db.prepare(this.sql).all(...this.values) }; }
  async run() {
    const result = this.db.prepare(this.sql).run(...this.values);
    return { meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) } };
  }
}

class LocalD1 {
  constructor(db) { this.db = db; }
  prepare(sql) { return new LocalD1Statement(this.db, sql); }
  async batch(statements) {
    this.db.exec('BEGIN');
    try {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      this.db.exec('COMMIT');
      return results;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
}

function createEnv() {
  const db = new DatabaseSync(':memory:');
  databases.add(db);
  db.exec('PRAGMA foreign_keys=ON');
  const migrations = readdirSync(join(root, 'migrations')).filter(name => name.endsWith('.sql')).sort();
  for (const name of migrations.filter(name => name !== '0005_customer_accounts_and_carts.sql')) {
    db.exec(readFileSync(join(root, 'migrations', name), 'utf8'));
  }
  db.exec(readFileSync(join(root, 'seed_products.sql'), 'utf8'));
  const before = db.prepare('SELECT COUNT(*) AS total FROM products').get().total;
  const firstProduct = db.prepare('SELECT id,name,price_cents FROM products WHERE id=1').get();
  db.exec(readFileSync(join(root, 'migrations/0005_customer_accounts_and_carts.sql'), 'utf8'));
  assert.equal(Number(db.prepare('SELECT COUNT(*) AS total FROM products').get().total), Number(before), 'a migração de contas não apaga produtos');
  assert.deepEqual(db.prepare('SELECT id,name,price_cents FROM products WHERE id=1').get(), firstProduct, 'a migração preserva os produtos existentes');
  return {
    DB: new LocalD1(db),
    ADMIN_EMAIL: 'equipe.qa@example.test',
    ADMIN_PASSWORD: 'senha-admin-local-123',
    ASSETS: { fetch: async () => new Response('not found', { status: 404 }) },
    db,
  };
}

async function call(env, path, { method = 'GET', body, cookie } = {}) {
  const headers = new Headers();
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  if (cookie) headers.set('Cookie', cookie);
  const response = await worker.fetch(new Request(`https://loja.example.test${path}`, {
    method, headers, ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  }), env);
  let data = {};
  try { data = await response.json(); } catch {}
  return { response, data };
}

async function register(env, overrides = {}) {
  const { response, data } = await call(env, '/api/customer/register', {
    method: 'POST', body: { ...sampleCustomer, ...overrides },
  });
  assert.equal(response.status, 201, JSON.stringify(data));
  return { customer: data.customer, cookie: response.headers.get('Set-Cookie').split(';')[0] };
}

async function adminCookie(env) {
  const { response } = await call(env, '/api/admin/login', {
    method: 'POST', body: { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD },
  });
  assert.equal(response.status, 200);
  return response.headers.get('Set-Cookie').split(';')[0];
}

afterEach(() => {
  for (const db of databases) db.close();
  databases.clear();
});

test('a loja expõe Minha conta e mantém o acesso no layout de celular', () => {
  const html = readFileSync(join(root, 'rommo-site/index.html'), 'utf8');
  const css = readFileSync(join(root, 'rommo-site/css/style.css'), 'utf8');
  const app = readFileSync(join(root, 'rommo-site/js/app.js'), 'utf8');
  assert.match(html, /class="account-trigger"[^>]*>Minha conta/);
  assert.match(html, /id="customerModal"/);
  assert.match(css, /\.account-trigger\{[^}]*white-space:nowrap/);
  assert.match(css, /@media\(max-width:380px\)\{\.account-trigger/);
  assert.match(app, /catalogReady\.then\(\(\)=>loadCustomerAccount\(\)\)/);
  assert.match(app, /rommo_cart_owner/);
  assert.match(html, /name="name"[^>]*minlength="2"/);
  assert.match(html, /name="phone" type="tel"/);
  assert.match(html, /name="email" type="email"/);
  assert.match(html, /name="password" type="password"[^>]*minlength="10"/);
});

test('abrir o WhatsApp não registra envio; o registro exige ação separada', () => {
  const panel = readFileSync(join(root, 'rommo-site/gestao-6f2a/painel.js'), 'utf8');
  const openAt = panel.indexOf("querySelectorAll('[data-abandoned-wa]')");
  const markAt = panel.indexOf("querySelectorAll('[data-mark-reminded]')");
  assert.notEqual(openAt, -1);
  assert.notEqual(markAt, -1);
  const whatsappHandler = panel.slice(openAt, markAt);
  assert.match(whatsappHandler, /window\.open/);
  assert.doesNotMatch(whatsappHandler, /\/reminded/);
  const markHandler = panel.slice(markAt);
  assert.match(markHandler, /confirm\(/);
  assert.match(markHandler, /\/reminded/);
});

test('cadastro valida dados, impede e-mail duplicado e nunca grava senha em texto puro', async () => {
  const env = createEnv();
  const invalid = await call(env, '/api/customer/register', { method: 'POST', body: { ...sampleCustomer, email: 'inválido' } });
  assert.equal(invalid.response.status, 400);
  const account = await register(env);
  assert.equal(account.customer.email, sampleCustomer.email);
  const customerRow = env.db.prepare('SELECT password_hash,password_salt,marketing_consent FROM customers WHERE id=?').get(account.customer.id);
  assert.notEqual(customerRow.password_hash, sampleCustomer.password);
  assert.notEqual(customerRow.password_hash, customerRow.password_salt);
  assert.equal(customerRow.marketing_consent, 1);
  const duplicate = await call(env, '/api/customer/register', {
    method: 'POST', body: { ...sampleCustomer, email: sampleCustomer.email.toUpperCase() },
  });
  assert.equal(duplicate.response.status, 409);
  assert.equal(duplicate.data.error, 'email_ja_cadastrado');
  const setCookie = (await call(env, '/api/customer/register', { method: 'POST', body: { ...sampleCustomer, email: 'cookie.qa@example.test' } })).response.headers.get('Set-Cookie');
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /Secure/);
  assert.match(setCookie, /SameSite=Lax/);
});

test('login, recuperação da sessão e logout usam o cookie HttpOnly', async () => {
  const env = createEnv();
  const account = await register(env);
  const failed = await call(env, '/api/customer/login', { method: 'POST', body: { email: sampleCustomer.email, password: 'senha errada' } });
  assert.equal(failed.response.status, 401);
  const login = await call(env, '/api/customer/login', { method: 'POST', body: { email: sampleCustomer.email, password: sampleCustomer.password } });
  assert.equal(login.response.status, 200);
  const cookie = login.response.headers.get('Set-Cookie').split(';')[0];
  assert.match(cookie, /^bv_customer=/);
  const me = await call(env, '/api/customer/me', { cookie });
  assert.equal(me.response.status, 200);
  assert.equal(me.data.customer.id, account.customer.id);
  assert.equal(me.data.customer.marketingConsent, true);
  const logout = await call(env, '/api/customer/logout', { method: 'POST', cookie });
  assert.equal(logout.response.status, 200);
  assert.match(logout.response.headers.get('Set-Cookie'), /Max-Age=0/);
  const privateAfterLogout = await call(env, '/api/customer/me', { cookie });
  assert.equal(privateAfterLogout.response.status, 401);
});

test('salva, normaliza, recupera e remove itens do carrinho entre dispositivos', async () => {
  const env = createEnv();
  const account = await register(env);
  const invalidShape = await call(env, '/api/customer/cart', { method: 'PUT', cookie: account.cookie, body: { items: 'não é uma lista' } });
  assert.equal(invalidShape.response.status, 400);
  const save = await call(env, '/api/customer/cart', {
    method: 'PUT', cookie: account.cookie,
    body: { items: [
      { productId: 1, quantity: 2, note: '220V' },
      { productId: 1, quantity: 3 },
    ] },
  });
  assert.equal(save.response.status, 200);
  assert.equal(save.data.count, 1);
  const otherDevice = await call(env, '/api/customer/cart', { cookie: account.cookie });
  assert.equal(otherDevice.response.status, 200);
  assert.equal(otherDevice.data.items.length, 1);
  assert.equal(otherDevice.data.items[0].quantity, 5);
  assert.equal(otherDevice.data.items[0].note, '220V');
  const overflow = await call(env, '/api/customer/cart', {
    method: 'PUT', cookie: account.cookie,
    body: { items: [{ productId: 1, quantity: 700 }, { productId: 1, quantity: 400 }] },
  });
  assert.equal(overflow.response.status, 400);
  const afterRejectedUpdate = await call(env, '/api/customer/cart', { cookie: account.cookie });
  assert.equal(afterRejectedUpdate.data.items[0].quantity, 5, 'a request rejected during validation keeps the cart intact');
  const clear = await call(env, '/api/customer/cart', { method: 'PUT', cookie: account.cookie, body: { items: [] } });
  assert.equal(clear.response.status, 200);
  assert.equal((await call(env, '/api/customer/cart', { cookie: account.cookie })).data.items.length, 0);
});

test('todas as rotas privadas de cliente e de administração exigem uma sessão', async () => {
  const env = createEnv();
  for (const path of ['/api/customer/me', '/api/customer/cart', '/api/customer/preferences']) {
    const result = await call(env, path, { method: path.endsWith('/preferences') ? 'PATCH' : 'GET', body: path.endsWith('/preferences') ? { marketingConsent: true } : undefined });
    assert.equal(result.response.status, 401, path);
  }
  for (const path of ['/api/admin/me', '/api/admin/products', '/api/admin/settings', '/api/admin/orders', '/api/admin/summary', '/api/admin/abandoned-carts']) {
    const result = await call(env, path);
    assert.equal(result.response.status, 401, path);
  }
});

test('clientes podem atualizar ou retirar o consentimento de mensagens', async () => {
  const env = createEnv();
  const account = await register(env, { marketingConsent: false });
  const enabled = await call(env, '/api/customer/preferences', { method: 'PATCH', cookie: account.cookie, body: { marketingConsent: true } });
  assert.equal(enabled.response.status, 200);
  assert.equal(enabled.data.marketingConsent, true);
  const disabled = await call(env, '/api/customer/preferences', { method: 'PATCH', cookie: account.cookie, body: { marketingConsent: false } });
  assert.equal(disabled.response.status, 200);
  const invalid = await call(env, '/api/customer/preferences', { method: 'PATCH', cookie: account.cookie, body: { marketingConsent: 'yes' } });
  assert.equal(invalid.response.status, 400);
  assert.equal((await call(env, '/api/customer/me', { cookie: account.cookie })).data.customer.marketingConsent, false);
});

test('rotas administrativas são privadas e carrinhos listados exigem consentimento', async () => {
  const env = createEnv();
  const consented = await register(env, { email: 'consent.qa@example.test', marketingConsent: true });
  const optedOut = await register(env, { email: 'optout.qa@example.test', marketingConsent: false });
  for (const account of [consented, optedOut]) {
    const saved = await call(env, '/api/customer/cart', { method: 'PUT', cookie: account.cookie, body: { items: [{ productId: 2, quantity: 4 }] } });
    assert.equal(saved.response.status, 200);
    env.db.prepare('UPDATE customer_carts SET updated_at=? WHERE customer_id=?').run(new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), account.customer.id);
  }
  assert.equal((await call(env, '/api/admin/abandoned-carts?minutes=180')).response.status, 401);
  const admin = await adminCookie(env);
  const list = await call(env, '/api/admin/abandoned-carts?minutes=180', { cookie: admin });
  assert.equal(list.response.status, 200);
  assert.equal(list.data.carts.length, 1);
  const cart = list.data.carts[0];
  assert.equal(cart.id, consented.customer.id);
  assert.equal(cart.name, sampleCustomer.name);
  assert.equal(cart.email, 'consent.qa@example.test');
  assert.equal(cart.phone, sampleCustomer.phone);
  assert.equal(cart.items[0].quantity, 4);
  assert.ok(cart.updated_at);
  assert.equal(cart.reminder_sent_at, null);
  const marked = await call(env, `/api/admin/abandoned-carts/${cart.id}/reminded`, { method: 'POST', cookie: admin, body: {} });
  assert.equal(marked.response.status, 200);
  assert.ok(env.db.prepare('SELECT reminder_sent_at FROM customer_carts WHERE customer_id=?').get(cart.id).reminder_sent_at);
  const refused = await call(env, `/api/admin/abandoned-carts/${optedOut.customer.id}/reminded`, { method: 'POST', cookie: admin, body: {} });
  assert.equal(refused.response.status, 404);
});

test('retirar consentimento remove o carrinho da lista e impede registrar lembrete', async () => {
  const env = createEnv();
  const account = await register(env, { email: 'revoke.qa@example.test', marketingConsent: true });
  await call(env, '/api/customer/cart', { method: 'PUT', cookie: account.cookie, body: { items: [{ productId: 3, quantity: 1 }] } });
  env.db.prepare('UPDATE customer_carts SET updated_at=? WHERE customer_id=?').run(new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), account.customer.id);
  const admin = await adminCookie(env);
  assert.equal((await call(env, '/api/admin/abandoned-carts?minutes=60', { cookie: admin })).data.carts.length, 1);
  await call(env, '/api/customer/preferences', { method: 'PATCH', cookie: account.cookie, body: { marketingConsent: false } });
  assert.equal((await call(env, '/api/admin/abandoned-carts?minutes=60', { cookie: admin })).data.carts.length, 0);
  const marked = await call(env, `/api/admin/abandoned-carts/${account.customer.id}/reminded`, { method: 'POST', cookie: admin, body: {} });
  assert.equal(marked.response.status, 404);
});
