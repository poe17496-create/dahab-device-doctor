import { NextRequest, NextResponse } from 'next/server';
import { RepairSession } from '@/lib/types';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { rateLimitMiddleware } from '@/lib/rate-limit';
import { sanitizeString } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Rate limiting: 30 requests per minute per IP
    const rateLimitResult = await rateLimitMiddleware(req, 30, 60 * 1000);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'تجاوزت الحد المسموح من الطلبات، يرجى الانتظار دقيقة.' 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '30',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          }
        }
      );
    }

    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ sessions: [] });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    // Sanitize ID if provided
    const sanitizedId = id ? sanitizeString(id, 100) : null;

    if (sanitizedId) {
      const { data, error } = await supabaseAdmin
        .from('diagnosis_history')
        .select('*')
        .eq('id', sanitizedId)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 });
      }

      const session = data.device_info as RepairSession;
      return NextResponse.json({ session });
    }

    const { data, error } = await supabaseAdmin
      .from('diagnosis_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching sessions:', error);
      return NextResponse.json({ error: 'فشل في استرجاع سجلات الذاكرة' }, { status: 500 });
    }

    const sessions = (data || []).map((row: any) => row.device_info as RepairSession);
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('API Memory GET error:', error);
    return NextResponse.json({ error: 'فشل في استرجاع سجلات الذاكرة' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 20 requests per minute per IP (lower for write operations)
    const rateLimitResult = await rateLimitMiddleware(req, 20, 60 * 1000);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'تجاوزت الحد المسموح من الطلبات، يرجى الانتظار دقيقة.' 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          }
        }
      );
    }

    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const body = await req.json();

    if (body.action === 'appendMessage') {
      const { sessionId, message } = body;
      
      // Sanitize inputs
      const sanitizedSessionId = sessionId ? sanitizeString(sessionId, 100) : null;
      
      if (!sanitizedSessionId || !message) {
        return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 });
      }

      // جلب الجلسة الحالية
      const { data: currentData } = await supabaseAdmin
        .from('diagnosis_history')
        .select('*')
        .eq('id', sanitizedSessionId)
        .single();

      if (!currentData) {
        return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 });
      }

      const session = currentData.device_info as RepairSession;
      session.messages.push(message);
      session.updatedAt = new Date().toISOString();

      // تحديث الجلسة
      const { error } = await supabaseAdmin
        .from('diagnosis_history')
        .update({
          device_info: session,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) {
        return NextResponse.json({ error: 'فشل في تحديث الجلسة' }, { status: 500 });
      }

      return NextResponse.json({ session });
    }

    // حفظ الجلسة بالكامل
    const session: RepairSession = body.session;
    if (!session || !session.id) {
      return NextResponse.json({ error: 'بيانات الجلسة غير صالحة' }, { status: 400 });
    }

    // Sanitize session ID
    const sanitizedSessionId = sanitizeString(session.id, 100);

    const { error } = await supabaseAdmin.from('diagnosis_history').upsert({
      id: sanitizedSessionId,
      user_id: null, // يمكن إضافة user_id لاحقاً
      device_info: session,
      symptoms: session.messages.map((m) => m.text).slice(0, 5),
      diagnosis: session.messages[session.messages.length - 1]?.text || '',
      confidence: 0.8,
      created_at: session.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error saving session:', error);
      return NextResponse.json({ error: 'فشل في حفظ الجلسة' }, { status: 500 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('API Memory POST error:', error);
    return NextResponse.json({ error: 'فشل في حفظ سجل الذاكرة' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Rate limiting: 10 requests per minute per IP (very low for delete operations)
    const rateLimitResult = await rateLimitMiddleware(req, 10, 60 * 1000);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'تجاوزت الحد المسموح من الطلبات، يرجى الانتظار دقيقة.' 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          }
        }
      );
    }

    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'معرف الجلسة مطلوب' }, { status: 400 });
    }

    // Sanitize ID
    const sanitizedId = sanitizeString(id, 100);

    const { error } = await supabaseAdmin.from('diagnosis_history').delete().eq('id', sanitizedId);

    if (error) {
      console.error('Error deleting session:', error);
      return NextResponse.json({ error: 'فشل في حذف الجلسة' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'تم حذف الجلسة بنجاح' });
  } catch (error) {
    console.error('API Memory DELETE error:', error);
    return NextResponse.json({ error: 'فشل في حذف سجل الذاكرة' }, { status: 500 });
  }
}
