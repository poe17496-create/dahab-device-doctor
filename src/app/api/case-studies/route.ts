import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET - Fetch all case studies with filtering
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deviceBrand = searchParams.get('deviceBrand');
    const deviceModel = searchParams.get('deviceModel');
    const faultCategory = searchParams.get('faultCategory');
    const difficulty = searchParams.get('difficulty');
    const status = searchParams.get('status') || 'verified';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabaseAdmin
      .from('case_studies')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (deviceBrand) {
      query = query.ilike('device_brand', `%${deviceBrand}%`);
    }
    if (deviceModel) {
      query = query.ilike('device_model', `%${deviceModel}%`);
    }
    if (faultCategory) {
      query = query.ilike('fault_category', `%${faultCategory}%`);
    }
    if (difficulty) {
      query = query.eq('difficulty_level', difficulty);
    }

    const { data, error, count } = await query;

    if (error) {
      console.warn('Note on fetching case studies from Supabase:', error);
      return NextResponse.json({
        caseStudies: [],
        total: 0,
        limit,
        offset,
      });
    }

    return NextResponse.json({
      caseStudies: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Case studies API error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}

// POST - Create new case study
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      title,
      description,
      deviceBrand,
      deviceModel,
      deviceCategory,
      faultCategory,
      faultDescription,
      symptoms,
      diagnosis,
      solution,
      requiredTools,
      requiredParts,
      difficultyLevel,
      estimatedTime,
      relatedIcs,
      relatedFaults,
      images,
      videoUrl,
      userId,
      technicianName,
    } = body;

    // Validation
    if (!title || !deviceModel || !solution) {
      return NextResponse.json(
        { error: 'الحقول الأساسية (عنوان العطل، الموديل، والحل المطبق) مطلوبة' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('case_studies')
      .insert({
        title,
        description: description || symptoms || '',
        device_brand: deviceBrand || 'متنوع',
        device_model: deviceModel,
        device_category: deviceCategory || 'mobile',
        fault_category: faultCategory || 'Power & Charging',
        fault_description: faultDescription || symptoms || '',
        symptoms: symptoms || '',
        diagnosis: diagnosis || '',
        solution,
        required_tools: requiredTools || [],
        required_parts: requiredParts || [],
        difficulty_level: difficultyLevel || 'متوسط',
        estimated_time: estimatedTime || '30 دقيقة',
        related_ics: relatedIcs || [],
        related_faults: relatedFaults || [],
        images: images || [],
        video_url: videoUrl || '',
        created_by: userId || technicianName || 'فني صيانة',
        status: 'pending',
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating case study:', error);
      return NextResponse.json(
        { error: 'فشل في إرسال الحالة للمراجعة' },
        { status: 500 }
      );
    }

    return NextResponse.json({ caseStudy: data, success: true }, { status: 201 });
  } catch (error) {
    console.error('Case studies API error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}

// PUT - Approve or update case study status (Admin)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'معرف التجربة والحالة الجديدة مطلوبان' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('case_studies')
      .update({ status } as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating case study in Supabase:', error);
      return NextResponse.json(
        { error: 'فشل في تحديث حالة التجربة' },
        { status: 500 }
      );
    }

    return NextResponse.json({ caseStudy: data, success: true });
  } catch (error) {
    console.error('Case studies PUT error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a case study
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'معرف التجربة مطلوب' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('case_studies')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting case study:', error);
      return NextResponse.json(
        { error: 'فشل في حذف التجربة' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Case studies DELETE error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}
