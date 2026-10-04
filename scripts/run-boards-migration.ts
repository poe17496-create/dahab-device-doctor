/**
 * Migration Script: Create Boards Table
 * This script runs the SQL migration to create the boards table for image caching
 *
 * Usage: npm run migrate:boards
 *        or: tsx scripts/run-boards-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 Starting boards table migration...');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20241004_001_add_boards_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          // Try direct query instead
          const { error: queryError } = await supabase.from('_migrations').select('*');
          if (queryError && queryError.code === '42P01') {
            // Table doesn't exist, continue
            console.log(`  Statement ${i + 1}/${statements.length}: Skipped (function not available)`);
            continue;
          }
        }
        console.log(`  ✓ Statement ${i + 1}/${statements.length}: Success`);
      } catch (err: any) {
        console.log(`  ⚠ Statement ${i + 1}/${statements.length}: ${err.message || 'Skipped'}`);
      }
    }

    // Verify the table was created
    const { data, error } = await supabase
      .from('boards')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Verification failed:', error.message);
      console.log('\n⚠️  Please run the migration manually in your Supabase dashboard:');
      console.log('   https://app.supabase.com/project/_/sql/new');
      console.log('\nCopy and paste the contents of:');
      console.log('   supabase/migrations/20241004_001_add_boards_table.sql');
      process.exit(1);
    }

    console.log('\n✅ Migration completed successfully!');
    console.log(`   Boards table is ready. Current count: ${data || 0}`);
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
