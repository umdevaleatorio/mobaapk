const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function check() {
  const file = fs.readFileSync('agropet-admin/src/data/datasources/supabase/client.ts', 'utf8');
  const urlMatch = file.match(/supabaseUrl\s*=\s*'([^']+)'/);
  const keyMatch = file.match(/supabaseAnonKey\s*=\s*'([^']+)'/);
  
  if (!urlMatch || !keyMatch) {
    console.log('No credentials');
    return;
  }
  
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  const { data, error } = await supabase.rpc('get_triggers');
  console.log(data || error);
}
check();
