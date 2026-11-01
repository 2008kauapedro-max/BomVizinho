-- Relaciona pedidos autenticados ao cliente e ao ciclo atual do carrinho.
-- As colunas são opcionais; pedidos anteriores continuam intactos e sem associação presumida.
ALTER TABLE orders ADD COLUMN customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE customer_carts ADD COLUMN completed_order_id TEXT REFERENCES orders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_customer_created ON orders(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_carts_order ON customer_carts(completed_order_id);
