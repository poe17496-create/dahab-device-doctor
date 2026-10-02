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
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabaseAdmin
      .from('case_studies')
      .select('*', { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

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
      console.error('Error fetching case studies:', error);
      return NextResponse.json(
        { error: 'فشل في جلب الحالات العملية' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      caseStudies: data,
      total: count,
      limit,
      offset
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
      userId
    } = body;

    // Validation
    if (!title || !deviceBrand || !deviceModel || !faultCategory || !symptoms || !diagnosis || !solution) {
      return NextResponse.json(
        { error: 'جميع الحقول المطلوبة يجب ملؤها' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('case_studies')
      .insert({
        title,
        description,
        device_brand: deviceBrand,
        device_model: deviceModel,
        device_category: deviceCategory,
        fault_category: faultCategory,
        fault_description: faultDescription,
        symptoms,
        diagnosis,
        solution,
        required_tools: requiredTools,
        required_parts: requiredParts,
        difficulty_level: difficultyLevel,
        estimated_time: estimatedTime,
        related_ics: relatedIcs,
        related_faults: relatedFaults,
        images,
        video_url: videoUrl,
        created_by: userId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating case study:', error);
      return NextResponse.json(
        { error: 'فشل في إنشاء الحالة العملية' },
        { status: 500 }
      );
    }

    return NextResponse.json({ caseStudy: data }, { status: 201 });
  } catch (error) {
    console.error('Case studies API error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}
