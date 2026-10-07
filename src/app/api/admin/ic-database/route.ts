import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET: Get all IC entries
export async function GET() {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ ics: [], total: 0 });
    }

    const { data, error } = await supabaseAdmin
      .from('ic_database')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching IC database:', error);
      return NextResponse.json({ error: 'فشل في جلب قاعدة بيانات الآيسي' }, { status: 500 });
    }

    return NextResponse.json({ ics: data || [], total: data?.length || 0 });
  } catch (err: any) {
    return NextResponse.json({ error: 'فشل في جلب قاعدة بيانات الآيسي', details: err?.message }, { status: 500 });
  }
}

// POST: Add new IC entry
export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const body = await req.json();
    const {
      part_number,
      manufacturer,
      description,
      package_type,
      category,
      datasheet_url,
      pinout,
      specifications,
      alternates,
    } = body;

    if (!part_number || !description || !category) {
      return NextResponse.json(
        { error: 'رقم الآيسي، الوصف، والفئة مطلوبة' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from('ic_database').insert({
      part_number,
      manufacturer: manufacturer || 'غير محدد',
      description,
      package_type: package_type || 'BGA',
      category,
      datasheet_url,
      pinout: pinout || {},
      specifications: specifications || {},
      alternates: alternates || [],
    } as any);

    if (error) {
      console.error('Error adding IC:', error);
      return NextResponse.json({ error: 'فشل في إضافة الآيسي', details: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'تم إضافة الآيسي بنجاح',
    });
  } catch (err: any) {
    console.error('IC Add Error:', err);
    return NextResponse.json({ error: 'فشل في إضافة الآيسي', details: err?.message }, { status: 500 });
  }
}

// DELETE: Delete IC entry
export async function DELETE(req: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'معرف الآيسي مطلوب' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('ic_database').delete().eq('id', id);

    if (error) {
      console.error('Error deleting IC:', error);
      return NextResponse.json({ error: 'فشل في حذف الآيسي' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'تم حذف الآيسي بنجاح' });
  } catch (err: any) {
    return NextResponse.json({ error: 'فشل في حذف الآيسي' }, { status: 500 });
  }
}
