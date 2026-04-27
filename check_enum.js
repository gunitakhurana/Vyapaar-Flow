const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const url = urlMatch ? urlMatch[1].trim() : '';
const key = keyMatch ? keyMatch[1].trim() : '';

async function check() {
  const res = await fetch(`${url}/rest/v1/rpc/get_order_status_enum`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
     // fallback to pg_enum via graphql or some other way? Or just test known values
     const testValues = ['approved', 'shipped', 'rejected', 'completed', 'delivered'];
     for (const val of testValues) {
        const updateRes = await fetch(`${url}/rest/v1/orders?id=not.is.null&limit=1`, {
          method: 'PATCH',
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ status: val })
        });
        const updateData = await updateRes.json();
        if (!updateData.code || updateData.code !== '22P02') {
           console.log(`Valid enum: ${val}`);
        } else {
           console.log(`Invalid enum: ${val}`);
        }
     }
  }
}

check();
