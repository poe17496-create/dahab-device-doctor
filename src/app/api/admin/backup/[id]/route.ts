import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * DELETE - حذف نسخة احتياطية
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const backupId = params.id;

    if (!backupId) {
      return NextResponse.json(
        { error: 'معرف النسخة الاحتياطية مطلوب' },
        { status: 400 }
      );
    }

    // @ts-ignore - supabaseAdmin is checked above
    const { error } = await supabaseAdmin
      .from('database_backups')
      .delete()
      .eq('id', backupId);

    if (error) {
      return NextResponse.json(
        { error: 'فشل حذف النسخة الاحتياطية' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف النسخة الاحتياطية بنجاح',
    });
  } catch (error) {
    console.error('Error deleting backup:', error);
    return NextResponse.json(
      { error: 'فشل حذف النسخة الاحتياطية' },
      { status: 500 }
    );
  }
}

/**
 * GET - تحميل نسخة احتياطية كملف JSON
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const backupId = params.id;

    if (!backupId) {
      return NextResponse.json(
        { error: 'معرف النسخة الاحتياطية مطلوب' },
        { status: 400 }
      );
    }

    // @ts-ignore - supabaseAdmin is checked above
    const { data: backupRecord, error } = await supabaseAdmin
      .from('database_backups')
      .select('*')
      .eq('id', backupId)
      .single();

    if (error || !backupRecord) {
      return NextResponse.json(
        { error: 'النسخة الاحتياطية غير موجودة' },
        { status: 404 }
      );
    }

    // @ts-ignore - backup_data property exists in database
    const backupData = backupRecord.backup_data;
    const jsonStr = JSON.stringify(backupData, null, 2);

    return new NextResponse(jsonStr, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="dahab_backup_${backupId}.json"`,
      },
    });
  } catch (error) {
    console.error('Error downloading backup:', error);
    return NextResponse.json(
      { error: 'فشل تحميل النسخة الاحتياطية' },
      { status: 500 }
    );
  }
}
