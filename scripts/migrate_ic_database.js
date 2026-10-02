/**
 * Migration Script: IC Database to Supabase
 * This script migrates data from local JSON files to Supabase database
 *
 * Usage: node scripts/migrate_ic_database.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

// Load JSON files
const icDatabasePath = path.join(__dirname, '../src/data/ic_database.json');
const schematicsMatrixPath = path.join(__dirname, '../src/lib/hardwareSchematicsMatrix.json');

let icDatabase = [];
let schematicsMatrix = [];

try {
  if (fs.existsSync(icDatabasePath)) {
    icDatabase = JSON.parse(fs.readFileSync(icDatabasePath, 'utf-8'));
    console.log(`✓ Loaded ${icDatabase.length} IC records from ic_database.json`);
  } else {
    console.warn('⚠ ic_database.json not found, skipping...');
  }
} catch (error) {
  console.error('Error loading ic_database.json:', error);
}

try {
  if (fs.existsSync(schematicsMatrixPath)) {
    schematicsMatrix = JSON.parse(fs.readFileSync(schematicsMatrixPath, 'utf-8'));
    console.log(`✓ Loaded ${schematicsMatrix.length} board records from hardwareSchematicsMatrix.json`);
  } else {
    console.warn('⚠ hardwareSchematicsMatrix.json not found, skipping...');
  }
} catch (error) {
  console.error('Error loading hardwareSchematicsMatrix.json:', error);
}

/**
 * Migrate IC Database
 */
async function migrateICDatabase() {
  console.log('\n=== Migrating IC Database ===');

  for (const ic of icDatabase) {
    try {
      const { error } = await supabase
        .from('ic_database')
        .upsert({
          part_number: ic.partNumber,
          category: ic.category,
          device_family: ic.deviceFamily,
          function: ic.function,
          compatibles: ic.compatibles || [],
          common_symptoms: ic.commonSymptoms,
          diode_readings: ic.diodeReadings,
        }, {
          onConflict: 'part_number'
        });

      if (error) {
        console.error(`✗ Error inserting ${ic.partNumber}:`, error.message);
      } else {
        console.log(`✓ Inserted: ${ic.partNumber}`);
      }
    } catch (error) {
      console.error(`✗ Error processing ${ic.partNumber}:`, error.message);
    }
  }

  console.log('✓ IC Database migration completed');
}

/**
 * Migrate Hardware Schematics Matrix
 */
async function migrateSchematicsMatrix() {
  console.log('\n=== Migrating Hardware Schematics Matrix ===');

  for (const board of schematicsMatrix) {
    try {
      // Insert board record
      const { data: boardData, error: boardError } = await supabase
        .from('hardware_schematics_matrix')
        .upsert({
          brand: board.brand,
          model: board.model,
          board_code: board.boardCode,
          category: board.category,
          year: board.year,
          main_chips: board.mainChips || {},
          power_rails: board.powerRails || {},
          key_components: board.keyComponents || {},
          cpu: board.cpu,
          gpu: board.gpu,
          pmic: board.pmic,
          audio_codec: board.audioCodec,
          wifi_module: board.wifiModule,
          bluetooth_module: board.bluetoothModule,
          display_driver: board.displayDriver,
          touch_controller: board.touchController,
          storage_controller: board.storageController,
        }, {
          onConflict: 'board_code'
        });

      if (boardError) {
        console.error(`✗ Error inserting board ${board.boardCode}:`, boardError.message);
        continue;
      }

      const boardId = boardData?.[0]?.id;

      // Extract and insert donor boards
      if (board.mainChips && boardId) {
        for (const [role, chipName] of Object.entries(board.mainChips)) {
          try {
            const { error: donorError } = await supabase
              .from('donor_boards')
              .upsert({
                board_id: boardId,
                brand: board.brand,
                model: board.model,
                board_code: board.boardCode,
                category: board.category,
                role_on_board: `${role}: ${chipName}`,
                chip_name: String(chipName),
              }, {
                onConflict: null // No unique constraint on donor_boards
              });

            if (donorError) {
              console.error(`✗ Error inserting donor board for ${chipName}:`, donorError.message);
            }
          } catch (error) {
            console.error(`✗ Error processing donor board ${chipName}:`, error.message);
          }
        }
      }

      console.log(`✓ Inserted: ${board.brand} ${board.model} [${board.boardCode}]`);
    } catch (error) {
      console.error(`✗ Error processing board ${board.boardCode}:`, error.message);
    }
  }

  console.log('✓ Hardware Schematics Matrix migration completed');
}

/**
 * Main migration function
 */
async function main() {
  console.log('=== IC Database Migration to Supabase ===\n');

  try {
    // Migrate IC Database
    if (icDatabase.length > 0) {
      await migrateICDatabase();
    }

    // Migrate Schematics Matrix
    if (schematicsMatrix.length > 0) {
      await migrateSchematicsMatrix();
    }

    console.log('\n=== Migration Completed Successfully ===');
  } catch (error) {
    console.error('\n=== Migration Failed ===');
    console.error(error);
    process.exit(1);
  }
}

// Run migration
main();
