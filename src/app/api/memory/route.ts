import { NextRequest, NextResponse } from 'next/server';
import {
  getAllSessions,
  getSessionById,
  saveSession,
  deleteSession,
  appendMessageToSession,
} from '@/lib/jsonMemory';
import { RepairSession } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      let session = getSessionById(id);
      if (!session && isSupabaseConfigured && supabase) {
        try {
          const { data } = await supabase
            .from('diagnostic_logs')
            .select('*')
            .eq('id', id)
            .single();
          if (data && data.data) {
            session = data.data as RepairSession;
          }
        } catch {}
      }

      if (!session) {
        return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 });
      }
      return NextResponse.json({ session });
    }

    const localSessions = getAllSessions();
    let mergedSessions = [...localSessions];

    // جلب ومزامنة الجلسات السحابية من Supabase لضمان عدم ضياع أي سجل عند مسح الكاش
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: cloudLogs, error } = await supabase
          .from('diagnostic_logs')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(100);

        if (!error && Array.isArray(cloudLogs)) {
          const localIds = new Set(localSessions.map((s) => s.id));
          for (const row of cloudLogs) {
            const sess = (row.data || row) as RepairSession;
            if (sess && sess.id && !localIds.has(sess.id)) {
              mergedSessions.push(sess);
            }
          }
        }
      } catch (sbErr) {
        console.warn('Supabase sessions fetch fallback to local:', sbErr);
      }
    }

    mergedSessions.sort(
      (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
    );

    return NextResponse.json({ sessions: mergedSessions });
  } catch (error) {
    console.error('API Memory GET error:', error);
    return NextResponse.json({ error: 'فشل في استرجاع سجلات الذاكرة' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === 'appendMessage') {
      const { sessionId, message } = body;
      if (!sessionId || !message) {
        return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 });
      }
      const updated = appendMessageToSession(sessionId, message);
      return NextResponse.json({ session: updated });
    }

    // حفظ الجلسة بالكامل
    const session: RepairSession = body.session;
    if (!session || !session.id) {
      return NextResponse.json({ error: 'بيانات الجلسة غير صالحة' }, { status: 400 });
    }

    const saved = saveSession(session);

    // مزامنة فورية مع قاعدة بيانات Supabase لضمان الأرشفة السحابية الدائمة
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('diagnostic_logs').upsert({
          id: session.id,
          title: session.title || 'جلسة تشخيص هندسي',
          device_model: session.deviceModel || 'غير محدد',
          device_type: session.deviceType || 'mobile-repair',
          data: session,
          updated_at: new Date().toISOString(),
        });
      } catch (sbErr) {
        console.warn('Supabase session backup notice:', sbErr);
      }
    }

    return NextResponse.json({ session: saved, message: 'تم حفظ الجلسة ومزامنتها بنجاح' });
  } catch (error) {
    console.error('API Memory POST error:', error);
    return NextResponse.json({ error: 'فشل في حفظ بيانات الجلسة' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'يجب تحديد معرف الجلسة' }, { status: 400 });
    }

    const success = deleteSession(id);

    // حذف من Supabase أيضاً
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('diagnostic_logs').delete().eq('id', id);
      } catch (sbErr) {
        console.warn('Supabase delete session notice:', sbErr);
      }
    }

    if (!success) {
      return NextResponse.json({ error: 'تعذر حذف الجلسة أو أنها غير موجودة' }, { status: 404 });
    }

    return NextResponse.json({ message: 'تم حذف الجلسة بنجاح' });
  } catch (error) {
    console.error('API Memory DELETE error:', error);
    return NextResponse.json({ error: 'فشل في حذف الجلسة' }, { status: 500 });
  }
}
