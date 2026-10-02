import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// Load JSON files
const icDatabasePath = path.join(process.cwd(), 'src/data/ic_database.json');
const schematicsMatrixPath = path.join(process.cwd(), 'src/lib/hardwareSchematicsMatrix.json');

interface ICRecord {
  partNumber: string;
  category: string;
  deviceFamily: string;
  function: string;
  compatibles: string[];
  commonSymptoms: string;
  diodeReadings: string;
}

interface BoardRecord {
  brand: string;
  model: string;
  boardCode: string;
  category: string;
  year?: number;
  mainChips?: Record<string, any>;
  powerRails?: Record<string, any>;
  keyComponents?: Record<string, any>;
  cpu?: string;
  gpu?: string;
  pmic?: string;
  audioCodec?: string;
  wifiModule?: string;
  bluetoothModule?: string;
  displayDriver?: string;
  touchController?: string;
  storageController?: string;
}

// POST - Migrate IC Database to Supabase
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode = 'all' } = body; // 'all', 'ic', 'schematics'

    const results = {
      icDatabase: { success: 0, failed: 0, errors: [] as string[] },
      schematics: { success: 0, failed: 0, errors: [] as string[] },
    };

    // Migrate IC Database
    if (mode === 'all' || mode === 'ic') {
      if (fs.existsSync(icDatabasePath)) {
        const icDatabase: ICRecord[] = JSON.parse(fs.readFileSync(icDatabasePath, 'utf-8'));
        console.log(`Starting migration of ${icDatabase.length} IC records...`);

        for (const ic of icDatabase) {
          try {
            const { error } = await supabaseAdmin
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
              results.icDatabase.failed++;
              results.icDatabase.errors.push(`${ic.partNumber}: ${error.message}`);
            } else {
              results.icDatabase.success++;
            }
          } catch (error: any) {
            results.icDatabase.failed++;
            results.icDatabase.errors.push(`${ic.partNumber}: ${error.message}`);
          }
        }
      } else {
        results.icDatabase.errors.push('ic_database.json not found');
      }
    }

    // Migrate Schematics Matrix
    if (mode === 'all' || mode === 'schematics') {
      if (fs.existsSync(schematicsMatrixPath)) {
        const schematicsMatrix: BoardRecord[] = JSON.parse(fs.readFileSync(schematicsMatrixPath, 'utf-8'));
        console.log(`Starting migration of ${schematicsMatrix.length} board records...`);

        for (const board of schematicsMatrix) {
          try {
            // Insert board record
            const { data: boardData, error: boardError } = await supabaseAdmin
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
              results.schematics.failed++;
              results.schematics.errors.push(`${board.boardCode}: ${boardError.message}`);
              continue;
            }

            const boardId = boardData?.[0]?.id;

            // Extract and insert donor boards
            if (board.mainChips && boardId) {
              for (const [role, chipName] of Object.entries(board.mainChips)) {
                try {
                  const { error: donorError } = await supabaseAdmin
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
                      onConflict: null
                    });

                  if (donorError) {
                    // Don't count donor board errors as critical
                    console.warn(`Warning inserting donor board for ${chipName}:`, donorError.message);
                  }
                } catch (error: any) {
                  console.warn(`Warning processing donor board ${chipName}:`, error.message);
                }
              }
            }

            results.schematics.success++;
          } catch (error: any) {
            results.schematics.failed++;
            results.schematics.errors.push(`${board.boardCode}: ${error.message}`);
          }
        }
      } else {
        results.schematics.errors.push('hardwareSchematicsMatrix.json not found');
      }
    }

    return NextResponse.json({
      success: true,
      message: 'تم ترحيل البيانات بنجاح',
      results,
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'فشل في ترحيل البيانات',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// GET - Check migration status
export async function GET() {
  try {
    const [icCount, schematicsCount, donorCount] = await Promise.all([
      supabaseAdmin.from('ic_database').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('hardware_schematics_matrix').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('donor_boards').select('id', { count: 'exact', head: true }),
    ]);

    return NextResponse.json({
      success: true,
      status: {
        icDatabase: icCount.count || 0,
        schematicsMatrix: schematicsCount.count || 0,
        donorBoards: donorCount.count || 0,
      },
    });
  } catch (error: any) {
    console.error('Status check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'فشل في فحص الحالة',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
