const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/); // Try with anon key, wait, we need to be logged in as a retailer.
// Actually, service role key can bypass RLS, but if RLS is the issue we wouldn't catch it.
const serviceKeyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const url = urlMatch ? urlMatch[1].trim() : '';
const serviceKey = serviceKeyMatch ? serviceKeyMatch[1].trim() : '';

const supabase = createClient(url, serviceKey);

async function test() {
  console.log("Fetching a retailer and a product...");
  const { data: retailer } = await supabase.from('users').select('id').eq('role', 'retailer').limit(1).single();
  const { data: product } = await supabase.from('products').select('*').limit(1).single();

  if (!retailer || !product) {
    console.log("No retailer or product found.");
    return;
  }

  console.log(`Retailer: ${retailer.id}, Product: ${product.id}`);

  // Try creating an order
  console.log("Inserting order...");
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      wholesaler_id: product.wholesaler_id,
      retailer_id: retailer.id,
      total_amount: product.price,
      status: "pending",
      source: "online",
    })
    .select("id")
    .single();

  if (orderError) {
    console.error("ORDER ERROR:", orderError);
    return;
  }
  console.log("Order created:", order.id);

  console.log("Inserting order item...");
  const orderItems = [{
    order_id: order.id,
    product_id: product.id,
    quantity: 1,
    price_at_time: product.price,
  }];

  const { error: itemError } = await supabase.from("order_items").insert(orderItems);
  
  if (itemError) {
    console.error("ITEM ERROR:", itemError);
  } else {
    console.log("Item inserted successfully!");
  }
  
  // Clean up
  await supabase.from("orders").delete().eq("id", order.id);
}

test();
