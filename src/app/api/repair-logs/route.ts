import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET - Fetch repair logs for a user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const deviceBrand = searchParams.get('deviceBrand');
    const deviceModel = searchParams.get('deviceModel');
    const outcome = searchParams.get('outcome');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from('repair_logs')
      .select('*, case_studies(*)', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (deviceBrand) {
      query = query.ilike('device_brand', `%${deviceBrand}%`);
    }
    if (deviceModel) {
      query = query.ilike('device_model', `%${deviceModel}%`);
    }
    if (outcome) {
      query = query.eq('outcome', outcome);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching repair logs:', error);
      return NextResponse.json(
        { error: 'فشل في جلب سجلات الإصلاح' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      repairLogs: data,
      total: count,
      limit,
      offset
    });
  } catch (error) {
    console.error('Repair logs API error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}

// POST - Create new repair log
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      caseStudyId,
      userId,
      deviceBrand,
      deviceModel,
      serialNumber,
      symptoms,
      initialDiagnosis,
      stepsTaken,
      toolsUsed,
      partsReplaced,
      measurements,
      finalDiagnosis,
      outcome,
      timeSpent,
      cost,
      lessonsLearned,
      images,
      notes
    } = body;

    // Validation
    if (!userId || !deviceBrand || !deviceModel || !symptoms || !stepsTaken) {
      return NextResponse.json(
        { error: 'جميع الحقول المطلوبة يجب ملؤها' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('repair_logs')
      .insert({
        case_study_id: caseStudyId,
        user_id: userId,
        device_brand: deviceBrand,
        device_model: deviceModel,
        serial_number: serialNumber,
        symptoms,
        initial_diagnosis: initialDiagnosis,
        steps_taken: stepsTaken,
        tools_used: toolsUsed,
        parts_replaced: partsReplaced,
        measurements,
        final_diagnosis: finalDiagnosis,
        outcome,
        time_spent: timeSpent,
        cost,
        lessons_learned: lessonsLearned,
        images,
        notes
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating repair log:', error);
      return NextResponse.json(
        { error: 'فشل في إنشاء سجل الإصلاح' },
        { status: 500 }
      );
    }

    return NextResponse.json({ repairLog: data }, { status: 201 });
  } catch (error) {
    console.error('Repair logs API error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}
