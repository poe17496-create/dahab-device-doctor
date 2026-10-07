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

    const newPassword = process.env.ADMIN_PASSWORD;

    // تحديث كلمة مرور المستخدم dahab
    const { error } = await supabaseAdmin
      .from('users')
      .update({ password: newPassword } as any)
      .eq('username', 'dahab');

    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Failed to update password',
        error: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '✅ Admin password updated successfully',
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Error updating password',
      error: error.message,
    }, { status: 500 });
  }
}
