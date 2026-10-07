import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET - Fetch engineering references with filtering
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const referenceType = searchParams.get('referenceType');
    const manufacturer = searchParams.get('manufacturer');
    const partNumber = searchParams.get('partNumber');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabaseAdmin
      .from('engineering_references')
      .select('*', { count: 'exact' })
      .order('reliability_score', { ascending: false })
      .range(offset, offset + limit - 1);

    if (referenceType) {
      query = query.eq('reference_type', referenceType);
    }
    if (manufacturer) {
      query = query.ilike('manufacturer', `%${manufacturer}%`);
    }
    if (partNumber) {
      query = query.ilike('part_number', `%${partNumber}%`);
    }
    if (category) {
      query = query.ilike('category', `%${category}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching engineering references:', error);
      return NextResponse.json(
        { error: 'فشل في جلب المراجع الهندسية' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      references: data,
      total: count,
      limit,
      offset
    });
  } catch (error) {
    console.error('Engineering references API error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}

// POST - Create new engineering reference
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      title,
      description,
      referenceType,
      manufacturer,
      partNumber,
      category,
      url,
      pdfUrl,
      pages,
      publicationDate,
      tags,
      source,
      isOfficial,
      userId
    } = body;

    // Validation
    if (!title || !referenceType) {
      return NextResponse.json(
        { error: 'العنوان ونوع المرجع مطلوبان' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('engineering_references')
      .insert({
        title,
        description,
        reference_type: referenceType,
        manufacturer,
        part_number: partNumber,
        category,
        url,
        pdf_url: pdfUrl,
        pages,
        publication_date: publicationDate,
        tags,
        source,
        is_official: isOfficial,
        created_by: userId,
        reliability_score: isOfficial ? 100 : 50
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating engineering reference:', error);
      return NextResponse.json(
        { error: 'فشل في إنشاء المرجع الهندسي' },
        { status: 500 }
      );
    }

    return NextResponse.json({ reference: data }, { status: 201 });
  } catch (error) {
    console.error('Engineering references API error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}
