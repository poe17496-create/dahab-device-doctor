import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Supabase is not configured',
      }, { status: 400 });
    }

    const results = {
      users: { success: false, message: '', count: 0 },
      ic_database: { success: false, message: '', count: 0 },
      boardviews: { success: false, message: '', count: 0 },
      commonFaults: { success: false, message: '', count: 0 },
    };

    // 1. ترحيل المستخدمين
    try {
      const usersPath = path.join(process.cwd(), 'data', 'users.json');
      if (fs.existsSync(usersPath)) {
        const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));

        for (const user of usersData) {
          const payload = {
            email: user.email,
            username: user.username,
            password: user.password,
            name: user.name,
            role: user.role,
            specialty: user.specialty,
            is_active: user.active,
            device_id: user.deviceInfo || null,
            expires_at: user.expiresAt || null,
            price: user.price || null,
          };

          const { error } = await supabaseAdmin
            .from('users')
            .upsert(payload, { onConflict: 'username' });

          if (error) {
            console.error('Error migrating user:', user.username, error);
          }
        }

        results.users = {
          success: true,
          message: 'Users migrated successfully',
          count: usersData.length,
        };
      } else {
        results.users = {
          success: true,
          message: 'No users file found (this is ok for new setup)',
          count: 0,
        };
      }
    } catch (error: any) {
      results.users = {
        success: false,
        message: error.message,
        count: 0,
      };
    }

    // 2. ترحيل IC Database
    try {
      // جرب المسارين: data/ و src/data/
      let icPath = path.join(process.cwd(), 'data', 'ic_database.json');
      if (!fs.existsSync(icPath)) {
        icPath = path.join(process.cwd(), 'src', 'data', 'ic_database.json');
      }

      if (fs.existsSync(icPath)) {
        const icData = JSON.parse(fs.readFileSync(icPath, 'utf-8'));

        for (const ic of icData) {
          const payload = {
            ic_number: ic.partNumber,
            ic_name: ic.function || ic.deviceFamily || ic.description || 'No description',
            category: ic.category || 'Other',
            compatibilities: ic.compatibles || [],
            pinout_data: ic.pinout || {},
            datasheet_url: ic.datasheetUrl || null,
          };

          const { error } = await supabaseAdmin
            .from('ic_database')
            .upsert(payload, { onConflict: 'ic_number' });

          if (error) {
            console.error('Error migrating IC:', ic.partNumber, error);
          }
        }

        results.ic_database = {
          success: true,
          message: 'IC database migrated successfully',
          count: icData.length,
        };
      } else {
        results.ic_database = {
          success: true,
          message: 'No IC database file found',
          count: 0,
        };
      }
    } catch (error: any) {
      results.ic_database = {
        success: false,
        message: error.message,
        count: 0,
      };
    }

    // 3. ترحيل Boardviews
    try {
      let boardviewsPath = path.join(process.cwd(), 'data', 'custom_boardviews.json');
      if (!fs.existsSync(boardviewsPath)) {
        boardviewsPath = path.join(process.cwd(), 'src', 'data', 'custom_boardviews.json');
      }

      if (fs.existsSync(boardviewsPath)) {
        const boardviewsData = JSON.parse(fs.readFileSync(boardviewsPath, 'utf-8'));

        for (const bv of boardviewsData) {
          const payload = {
            id: bv.id,
            user_id: bv.userId || null,
            device_name: bv.deviceName,
            model: bv.model,
            brand: bv.brand,
            category: bv.category,
            description: bv.description || null,
            image_url: bv.imageUrl || null,
            specifications: bv.specifications || null,
          };

          const { error } = await supabaseAdmin
            .from('boardviews')
            .upsert(payload, { onConflict: 'id' });

          if (error) {
            console.error('Error migrating boardview:', bv.id, error);
          }
        }

        results.boardviews = {
          success: true,
          message: 'Boardviews migrated successfully',
          count: boardviewsData.length,
        };
      } else {
        results.boardviews = {
          success: true,
          message: 'No boardviews file found',
          count: 0,
        };
      }
    } catch (error: any) {
      results.boardviews = {
        success: false,
        message: error.message,
        count: 0,
      };
    }

    // 4. ترحيل Common Faults
    try {
      let faultsPath = path.join(process.cwd(), 'data', 'commonFaults.json');
      if (!fs.existsSync(faultsPath)) {
        faultsPath = path.join(process.cwd(), 'src', 'data', 'commonFaults.json');
      }

      if (fs.existsSync(faultsPath)) {
        const faultsData = JSON.parse(fs.readFileSync(faultsPath, 'utf-8'));

        for (const fault of faultsData) {
          const payload = {
            device_type: fault.brand || 'mobile',
            device_model: fault.model || 'Unknown',
            fault_title: fault.faultName,
            symptoms: fault.symptoms ? fault.symptoms.join(', ') : '',
            diagnosis: fault.measurementTest || '',
            solution: fault.fixSteps ? fault.fixSteps.join(', ') : '',
            difficulty_level: fault.difficulty || 3,
            status: 'verified',
            media_urls: [],
          };

          const { error } = await supabaseAdmin
            .from('verified_faults')
            .insert(payload);

          if (error) {
            console.error('Error migrating fault:', fault.faultCode, error);
          }
        }

        results.commonFaults = {
          success: true,
          message: 'Common faults migrated successfully',
          count: faultsData.length,
        };
      } else {
        results.commonFaults = {
          success: true,
          message: 'No common faults file found',
          count: 0,
        };
      }
    } catch (error: any) {
      results.commonFaults = {
        success: false,
        message: error.message,
        count: 0,
      };
    }

    const allSuccess = Object.values(results).every(r => r.success);

    return NextResponse.json({
      success: allSuccess,
      message: allSuccess ? '✅ All data migrated to Supabase successfully!' : '⚠️ Migration completed with some errors',
      results,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Migration failed',
      error: error.message,
    }, { status: 500 });
  }
}
