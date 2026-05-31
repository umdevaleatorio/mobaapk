const fs = require('fs');

async function check() {
  const file = fs.readFileSync('agropet-admin/src/data/datasources/supabase/client.ts', 'utf8');
  const urlMatch = file.match(/supabaseUrl\s*=\s*'([^']+)'/);
  const keyMatch = file.match(/supabaseAnonKey\s*=\s*'([^']+)'/);
  
  if (!urlMatch || !keyMatch) {
    console.log('No credentials');
    return;
  }
  
  const url = urlMatch[1];
  const key = keyMatch[1];
  
  const res = await fetch(url + '/rest/v1/orders?select=id,status,delivery_address&order=created_at.desc&limit=5', {
    headers: {
      'apikey': key,
      'Authorization': 'Bearer ' + key
    }
  });
  
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
check();
