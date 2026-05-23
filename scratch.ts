import { supabase } from './src/utils/supabase';

async function test() {
  const { data, error } = await supabase.from('companies').select('*').limit(1);
  console.log('Data:', data);
  console.log('Error:', error);
}
test();
