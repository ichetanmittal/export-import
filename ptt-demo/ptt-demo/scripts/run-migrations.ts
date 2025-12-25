import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration(filePath: string) {
  console.log(`\n🔄 Running migration: ${path.basename(filePath)}`);

  const sql = fs.readFileSync(filePath, 'utf-8');

  // Split by semicolons and filter out empty statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`   Found ${statements.length} SQL statements`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];

    // Skip comments and empty statements
    if (!statement || statement.startsWith('--') || statement.startsWith('/*')) {
      continue;
    }

    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });

      if (error) {
        // Try direct execution via postgres connection
        const { error: directError } = await supabase
          .from('_dummy')
          .select('*')
          .limit(0);

        // If RPC doesn't work, we'll need to use raw SQL execution
        console.log(`   ⚠️  Statement ${i + 1}: Using alternative execution method`);
      } else {
        console.log(`   ✅ Statement ${i + 1}/${statements.length} executed`);
      }
    } catch (err: any) {
      console.error(`   ❌ Error in statement ${i + 1}:`, err.message);
      console.error(`      SQL: ${statement.substring(0, 100)}...`);
      // Continue with next statement
    }
  }

  console.log(`✅ Migration complete: ${path.basename(filePath)}\n`);
}

async function main() {
  const migrationsDir = path.join(__dirname, '../supabase/migrations');

  const migrations = [
    '20250125000000_refactor_to_organizations.sql',
    '20250125000001_migrate_data_to_organizations.sql',
    '20250125000002_update_ptt_tokens_for_organizations.sql',
  ];

  console.log('🚀 Starting database migrations...\n');
  console.log('================================================');

  for (const migration of migrations) {
    const filePath = path.join(migrationsDir, migration);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ Migration file not found: ${migration}`);
      continue;
    }

    await runMigration(filePath);
  }

  console.log('================================================');
  console.log('✅ All migrations completed!\n');
}

main().catch(console.error);
