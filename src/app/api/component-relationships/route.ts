import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET - Fetch component relationships
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const component = searchParams.get('component');
    const deviceBrand = searchParams.get('deviceBrand');
    const deviceModel = searchParams.get('deviceModel');
    const relationshipType = searchParams.get('relationshipType');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabaseAdmin
      .from('component_relationships')
      .select('*')
      .order('confidence_score', { ascending: false })
      .limit(limit);

    if (component) {
      query = query.or(`source_component.ilike.%${component}%,target_component.ilike.%${component}%`);
    }
    if (deviceBrand) {
      query = query.ilike('device_brand', `%${deviceBrand}%`);
    }
    if (deviceModel) {
      query = query.ilike('device_model', `%${deviceModel}%`);
    }
    if (relationshipType) {
      query = query.eq('relationship_type', relationshipType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching component relationships:', error);
      return NextResponse.json(
        { error: 'فشل في جلب علاقات المكونات' },
        { status: 500 }
      );
    }

    return NextResponse.json({ relationships: data });
  } catch (error) {
    console.error('Component relationships API error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}

// POST - Create new component relationship
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      sourceComponent,
      sourceType,
      targetComponent,
      targetType,
      relationshipType,
      relationshipDescription,
      deviceBrand,
      deviceModel,
      confidenceScore,
      sourceReference,
      userId
    } = body;

    // Validation
    if (!sourceComponent || !sourceType || !targetComponent || !targetType || !relationshipType) {
      return NextResponse.json(
        { error: 'جميع الحقول المطلوبة يجب ملؤها' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('component_relationships')
      .insert({
        source_component: sourceComponent,
        source_type: sourceType,
        target_component: targetComponent,
        target_type: targetType,
        relationship_type: relationshipType,
        relationship_description: relationshipDescription,
        device_brand: deviceBrand,
        device_model: deviceModel,
        confidence_score: confidenceScore || 50,
        source_reference: sourceReference,
        created_by: userId
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating component relationship:', error);
      return NextResponse.json(
        { error: 'فشل في إنشاء علاقة المكونات' },
        { status: 500 }
      );
    }

    return NextResponse.json({ relationship: data }, { status: 201 });
  } catch (error) {
    console.error('Component relationships API error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}
