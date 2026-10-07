import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateGuestTrials() {
  console.log('=== Migrating guest_trials table ===');

  try {
    // إضافة عمود identifier (معرف فريد مدمج)
    const { error: identifierError } = await supabase.rpc('add_column_if_not_exists', {
      table_name: 'guest_trials',
      column_name: 'identifier',
      column_type: 'text'
    });

    if (identifierError) {
      console.log('Adding identifier column manually...');
      // إذا فشلت الدالة، نحاول إضافة العمود مباشرة
      // ملاحظة: قد تحتاج إلى تنفيذ هذا يدوياً في Supabase SQL Editor
      console.log('Please run this SQL in Supabase SQL Editor:');
      console.log(`
-- إضافة عمود identifier
ALTER TABLE guest_trials ADD COLUMN IF NOT EXISTS identifier text;

-- إضافة عمود session_id
ALTER TABLE guest_trials ADD COLUMN IF NOT EXISTS session_id text;

-- إنشاء index على identifier لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_guest_trials_identifier ON guest_trials(identifier);

-- إنشاء index على session_id
CREATE INDEX IF NOT EXISTS idx_guest_trials_session_id ON guest_trials(session_id);
      `);
    }

    // إضافة عمود session_id
    const { error: sessionError } = await supabase.rpc('add_column_if_not_exists', {
      table_name: 'guest_trials',
      column_name: 'session_id',
      column_type: 'text'
    });

    if (sessionError) {
      console.log('Session column may need manual addition');
    }

    // إنشاء index على identifier
    const { error: indexError } = await supabase.rpc('create_index_if_not_exists', {
      index_name: 'idx_guest_trials_identifier',
      table_name: 'guest_trials',
      column_name: 'identifier'
    });

    if (indexError) {
      console.log('Index may need manual creation');
    }

    console.log('Migration script completed. Please check the output above for any manual SQL commands needed.');
  } catch (error) {
    console.error('Migration error:', error);
  }
}

migrateGuestTrials();
