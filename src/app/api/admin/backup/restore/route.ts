import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * POST - استعادة البيانات من نسخة احتياطية
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { backupId, tables } = body;

    if (!backupId) {
      return NextResponse.json(
        { error: 'معرف النسخة الاحتياطية مطلوب' },
        { status: 400 }
      );
    }

    // جلب النسخة الاحتياطية
    const { data: backupRecord, error: fetchError } = await supabaseAdmin
      .from('database_backups')
      .select('*')
      .eq('id', backupId)
      .single();

    if (fetchError || !backupRecord) {
      return NextResponse.json(
        { error: 'النسخة الاحتياطية غير موجودة' },
        { status: 404 }
      );
    }

    const backupData = backupRecord.backup_data;
    const tablesToRestore = tables && tables.length > 0 ? tables : Object.keys(backupData.tables);

    const restoreResults: Record<string, { success: boolean; records: number; error?: string }> = {};

    // استعادة كل جدول
    for (const tableName of tablesToRestore) {
      try {
        const tableData = backupData.tables[tableName];

        if (!tableData || tableData.length === 0) {
          restoreResults[tableName] = {
            success: true,
            records: 0,
          };
          continue;
        }

        // حذف البيانات الحالية أولاً (اختياري - يمكن جعله معلمة)
        // const { error: deleteError } = await supabaseAdmin
        //   .from(tableName)
        //   .delete()
        //   .neq('id', '00000000-0000-0000-0000-000000000000');

        // إدراج البيانات المستعادة
        const { error: insertError } = await supabaseAdmin
          .from(tableName)
          .upsert(tableData, {
            onConflict: 'id',
            ignoreDuplicates: false,
          });

        if (insertError) {
          console.error(`Error restoring table ${tableName}:`, insertError);
          restoreResults[tableName] = {
            success: false,
            records: 0,
            error: insertError.message,
          };
        } else {
          restoreResults[tableName] = {
            success: true,
            records: tableData.length,
          };
        }
      } catch (err) {
        console.error(`Error restoring table ${tableName}:`, err);
        restoreResults[tableName] = {
          success: false,
          records: 0,
          error: 'Unknown error',
        };
      }
    }

    // تسجيل عملية الاستعادة
    const { error: logError } = await supabaseAdmin
      .from('restore_logs')
      .insert({
        backup_id: backupId,
        restored_by: 'admin',
        tables_restored: tablesToRestore,
        results: restoreResults,
        success: Object.values(restoreResults).every(r => r.success),
      });

    if (logError) {
      console.error('Error logging restore operation:', logError);
    }

    const successCount = Object.values(restoreResults).filter(r => r.success).length;
    const totalCount = Object.keys(restoreResults).length;

    return NextResponse.json({
      success: successCount === totalCount,
      message: `تم استعادة ${successCount} من ${totalCount} جدول`,
      results: restoreResults,
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    return NextResponse.json(
      { error: 'فشل استعادة النسخة الاحتياطية' },
      { status: 500 }
    );
  }
}
