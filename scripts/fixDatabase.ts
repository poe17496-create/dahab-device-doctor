import { supabaseAdmin, isSupabaseConfigured } from '../src/lib/supabase';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runMigration() {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    console.error('❌ Supabase not configured. Please check your .env.local file.');
    process.exit(1);
  }

  console.log('🔧 Fixing IC Database table structure...');

  // Read the migration SQL file
  const migrationPath = join(__dirname, '../supabase/migrations/20241002_000_fix_ic_database.sql');
  const sql = readFileSync(migrationPath, 'utf-8');

  try {
    // Execute the SQL
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    }

    console.log('✅ IC Database table structure fixed successfully!');
    console.log('📝 Now you can run: npm run migrate');
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

runMigration();
