-- Idempotent schema: safe to run on every deploy (npm run db:setup).

CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  price_mnt integer NOT NULL CHECK (price_mnt > 0),
  color_name text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_sizes (
  product_id text NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  size text NOT NULL,
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  position integer NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, size)
);

-- Orders are looked up by a random capability token; only its SHA-256 is stored.
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY,
  number serial UNIQUE,
  token_hash text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'expired', 'cancelled')),
  customer_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL DEFAULT '',
  district text NOT NULL,
  address text NOT NULL,
  note text NOT NULL DEFAULT '',
  subtotal_mnt integer NOT NULL,
  delivery_mnt integer NOT NULL DEFAULT 0,
  total_mnt integer NOT NULL,
  payment_provider text NOT NULL,
  invoice_id text,
  invoice jsonb,
  payment_id text UNIQUE,
  -- Set when a payment arrived after the reservation expired (stock may be short).
  needs_review boolean NOT NULL DEFAULT false,
  checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  paid_at timestamptz
);

CREATE INDEX IF NOT EXISTS orders_pending_expiry ON orders (expires_at) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS order_items (
  order_id uuid NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id text NOT NULL REFERENCES products (id),
  name text NOT NULL,
  size text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price_mnt integer NOT NULL,
  PRIMARY KEY (order_id, product_id, size)
);
