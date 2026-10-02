import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Supabase is not configured',
      }, { status: 400 });
    }

    const adminPassword = process.env.ADMIN_PASSWORD || 'X7#K9@mP2$Qw8!Rz5*Ln3';

    // حذف المستخدم القديم إذا موجود
    await supabaseAdmin.from('users').delete().eq('username', 'D3V1N_X9_ADMIN');

    // إنشاء مستخدم admin جديد
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        email: 'dahab@doctor.com',
        username: 'D3V1N_X9_ADMIN',
        password: adminPassword,
        name: 'المهندس إسلام دهب (المشرف العام ومطور المنظومة)',
        role: 'admin',
        specialty: 'كبير مهندسي الإلكترونيات والميكروسولديرنج ومطور أنظمة دهب',
        is_active: true,
      })
      .select();

    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Failed to create admin user',
        error: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '✅ Admin user created successfully',
      user: data,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Error creating admin user',
      error: error.message,
    }, { status: 500 });
  }
}
