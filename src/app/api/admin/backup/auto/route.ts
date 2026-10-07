import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// كلمة سر للحماية من الاستخدام غير المصرح به
const CRON_SECRET = process.env.CRON_SECRET || 'default_secret_change_me';

const TABLES_TO_BACKUP = [
  'users',
  'sessions',
  'cache_entries',
  'ic_database',
  'donor_boards',
  'hardware_schematics_matrix',
  'case_studies',
  'component_relationships',
  'external_references',
  'expert_patterns',
  'guest_logs',
];

interface BackupData {
  version: string;
  timestamp: string;
  tables: Record<string, any[]>;
  metadata: {
    totalRecords: number;
    tablesCount: number;
    sizeEstimate: string;
  };
}

/**
 * POST - إنشاء نسخة احتياطية تلقائية (ل cron jobs)
 * يجب توفير header 'x-cron-secret' للتحقق من المصدر
 */
export async function POST(req: NextRequest) {
  try {
    // التحقق من السر
    const secret = req.headers.get('x-cron-secret');
    if (secret !== CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const backupData: BackupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      tables: {},
      metadata: {
        totalRecords: 0,
        tablesCount: 0,
        sizeEstimate: '0 KB',
      },
    };

    let totalRecords = 0;

    // نسخ كل جدول
    for (const tableName of TABLES_TO_BACKUP) {
      try {
        const { data, error } = await supabaseAdmin
          .from(tableName)
          .select('*');

        if (error) {
          console.error(`Error backing up table ${tableName}:`, error);
          backupData.tables[tableName] = [];
          continue;
        }

        backupData.tables[tableName] = data || [];
        totalRecords += (data || []).length;
        backupData.metadata.tablesCount++;
      } catch (err) {
        console.error(`Error fetching table ${tableName}:`, err);
        backupData.tables[tableName] = [];
      }
    }

    backupData.metadata.totalRecords = totalRecords;

    // تقدير الحجم
    const jsonString = JSON.stringify(backupData);
    const sizeInBytes = new Blob([jsonString]).size;
    const sizeInKB = (sizeInBytes / 1024).toFixed(2);
    backupData.metadata.sizeEstimate = `${sizeInKB} KB`;

    // حفظ النسخة الاحتياطية
    const { error: insertError } = await supabaseAdmin
      .from('database_backups')
      .insert({
        backup_data: backupData,
        description: 'نسخة احتياطية تلقائية (Cron Job)',
        tables_count: backupData.metadata.tablesCount,
        total_records: backupData.metadata.totalRecords,
        size_estimate: backupData.metadata.sizeEstimate,
        created_by: 'cron',
      } as any);

    if (insertError) {
      console.error('Error saving auto backup:', insertError);
      return NextResponse.json({
        success: false,
        error: 'Failed to save backup to database',
      }, { status: 500 });
    }

    // حذف النسخ القديمة (احتفظ بآخر 10 نسخ فقط)
    try {
      const { data: oldBackups } = await supabaseAdmin
        .from('database_backups')
        .select('id')
        .ilike('description', '%تلقائية%')
        .order('created_at', { ascending: false })
        .range(10, 1000); // احتفظ بآخر 10 نسخ فقط

      if (oldBackups && oldBackups.length > 0) {
        const idsToDelete = oldBackups.map((b: any) => b.id);
        await supabaseAdmin
          .from('database_backups')
          .delete()
          .in('id', idsToDelete);
        console.log(`Deleted ${idsToDelete.length} old auto backups`);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up old backups:', cleanupError);
    }

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء النسخة الاحتياطية التلقائية بنجاح',
      metadata: backupData.metadata,
    });
  } catch (error) {
    console.error('Error in auto backup:', error);
    return NextResponse.json(
      { error: 'فشل إنشاء النسخة الاحتياطية التلقائية' },
      { status: 500 }
    );
  }
}
