ALTER TABLE products ADD COLUMN description TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN image_url TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0);
ALTER TABLE products ADD COLUMN sku TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';
UPDATE products SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE updated_at = '';
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku ON products(sku) WHERE sku <> '';
CREATE INDEX IF NOT EXISTS idx_products_active_category ON products(active, category);
CREATE TABLE IF NOT EXISTS store_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

