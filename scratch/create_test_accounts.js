
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1/', '');
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestAccounts() {
  console.log('Creating test accounts...');

  const accounts = [
    { name: 'Pro Tester', password: 'password123', tier: 'pro', total_uploads: 0 },
    { name: 'Enterprise Tester', password: 'password123', tier: 'enterprise', total_uploads: 0 }
  ];

  for (const account of accounts) {
    // Check if exists
    const { data: existing } = await supabase
      .from('companies')
      .select('id')
      .ilike('name', account.name)
      .single();

    if (existing) {
      console.log(`Account ${account.name} already exists. Updating tier to ${account.tier}...`);
      const { error } = await supabase
        .from('companies')
        .update({ tier: account.tier, password: account.password })
        .eq('id', existing.id);
      
      if (error) console.error(`Error updating ${account.name}:`, error);
      else console.log(`Successfully updated ${account.name}`);
    } else {
      console.log(`Creating new account ${account.name}...`);
      const { error } = await supabase
        .from('companies')
        .insert([account]);
      
      if (error) console.error(`Error creating ${account.name}:`, error);
      else console.log(`Successfully created ${account.name}`);
    }
  }
}

createTestAccounts();
