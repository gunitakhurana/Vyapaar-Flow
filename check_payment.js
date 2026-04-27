const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const url = urlMatch ? urlMatch[1].trim() : '';
const key = keyMatch ? keyMatch[1].trim() : '';

async function check() {
  const updateRes = await fetch(`${url}/rest/v1/orders?id=not.is.null&limit=1`, {
    method: 'PATCH',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ payment_method: 'UPI' })
  });
  const updateData = await updateRes.json();
  console.log("Update test UPI:", updateData);

  const testProcessing = await fetch(`${url}/rest/v1/orders?id=not.is.null&limit=1`, {
    method: 'PATCH',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ payment_method: 'Cash' })
  });
  const processData = await testProcessing.json();
  console.log("Update test Cash:", processData);
}

check();
