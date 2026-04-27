const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const url = urlMatch ? urlMatch[1].trim() : '';
const key = keyMatch ? keyMatch[1].trim() : '';

const createTriggerSql = `
CREATE OR REPLACE FUNCTION update_stock_on_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    -- If status changes from pending to shipped/delivered/completed
    IF OLD.status = 'pending' AND NEW.status IN ('shipped', 'delivered', 'completed') THEN
        FOR item IN SELECT product_id, quantity FROM order_items WHERE order_id = NEW.id LOOP
            UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - item.quantity) WHERE id = item.product_id;
        END LOOP;
    -- If status changes from shipped/delivered/completed to rejected/cancelled
    ELSIF OLD.status IN ('shipped', 'delivered', 'completed') AND NEW.status IN ('rejected', 'cancelled', 'pending') THEN
        FOR item IN SELECT product_id, quantity FROM order_items WHERE order_id = NEW.id LOOP
            UPDATE products SET stock_quantity = stock_quantity + item.quantity WHERE id = item.product_id;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS order_status_stock_trigger ON orders;
CREATE TRIGGER order_status_stock_trigger
AFTER UPDATE ON orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_stock_on_order_status_change();
`;

async function applyTrigger() {
  const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: createTriggerSql })
  });
  
  if (res.ok) {
     console.log("Trigger applied successfully via exec_sql");
     return;
  }
  
  // If exec_sql is not available, we can't easily run arbitrary DDL from the REST API without an RPC.
  console.log("exec_sql failed:", await res.text());
}

applyTrigger();
