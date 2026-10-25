ALTER TABLE orders ADD COLUMN customer_email TEXT;
ALTER TABLE orders ADD COLUMN customer_note TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);
