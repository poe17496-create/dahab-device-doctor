import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// الجداول التي سيتم نسخها احتياطياً
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
 * POST - إنشاء نسخة احتياطية جديدة
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tables, description } = body;

    // تحديد الجداول المطلوب نسخها (أو نسخ الكل)
    const tablesToBackup = tables && tables.length > 0 ? tables : TABLES_TO_BACKUP;

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
    for (const tableName of tablesToBackup) {
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

    // حفظ النسخة الاحتياطية في جدول database_backups
    const backupId = `backup_${Date.now()}`;
    const { error: insertError } = await supabaseAdmin
      .from('database_backups')
      .insert({
        backup_data: backupData,
        description: description || 'نسخة احتياطية يدوية',
        tables_count: backupData.metadata.tablesCount,
        total_records: backupData.metadata.totalRecords,
        size_estimate: backupData.metadata.sizeEstimate,
        created_by: 'admin',
      } as any);

    if (insertError) {
      // إذا لم يكن الجدول موجوداً، نقوم بإنشائه
      console.error('Error saving backup to database:', insertError);
      // إرجاع البيانات مباشرة إذا فشل الحفظ
      return NextResponse.json({
        success: true,
        backup: backupData,
        message: 'تم إنشاء النسخة الاحتياطية بنجاح (لم يتم حفظها في قاعدة البيانات)',
      });
    }

    return NextResponse.json({
      success: true,
      backupId,
      backup: backupData,
      message: 'تم إنشاء النسخة الاحتياطية بنجاح',
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { error: 'فشل إنشاء النسخة الاحتياطية' },
      { status: 500 }
    );
  }
}

/**
 * GET - الحصول على قائمة النسخ الاحتياطية
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // محاولة جلب النسخ من جدول database_backups
    const { data: backups, error } = await supabaseAdmin
      .from('database_backups')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      // إذا لم يكن الجدول موجوداً، نعيد قائمة فارغة
      return NextResponse.json({
        backups: [],
        message: 'لا توجد نسخ احتياطية حالياً',
      });
    }

    return NextResponse.json({
      backups: backups || [],
      total: backups?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching backups:', error);
    return NextResponse.json(
      { error: 'فشل جلب النسخ الاحتياطية' },
      { status: 500 }
    );
  }
}
