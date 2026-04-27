const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const serviceKeyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const url = urlMatch ? urlMatch[1].trim() : '';
const serviceKey = serviceKeyMatch ? serviceKeyMatch[1].trim() : '';

const supabaseAdmin = createClient(url, serviceKey);

async function inspect() {
  console.log("--- PUBLIC.USERS TABLE ---");
  const { data: users, error } = await supabaseAdmin.from('users').select('*');
  console.log(users);
  
  console.log("\n--- AUTH.USERS METADATA ---");
  const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (authUsers && authUsers.users) {
    authUsers.users.forEach(u => {
       console.log(`ID: ${u.id}, Email: ${u.email}, Meta:`, u.user_metadata);
    });
  }
}

inspect();
