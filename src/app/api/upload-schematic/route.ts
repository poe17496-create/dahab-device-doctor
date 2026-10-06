import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API Endpoint: Upload Schematic
 * رفع مخطط هندسي جديد للقاعدة
 */

interface UploadSchematicRequest {
  schematicName: string;
  schematicUrl: string;
  deviceModel?: string;
  boardType?: string;
  description?: string;
  components?: any[];
  nets?: any[];
}

export async function POST(req: NextRequest) {
  try {
    const body: UploadSchematicRequest = await req.json();
    const { schematicName, schematicUrl, deviceModel, boardType, description, components, nets } = body;

    // Validate required fields
    if (!schematicName || !schematicUrl) {
      return NextResponse.json(
        { success: false, error: 'Schematic name and URL are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: 'Supabase configuration not found' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Insert schematic into database
    const { data, error } = await supabase
      .from('schematics')
      .insert({
        schematic_name: schematicName,
        schematic_url: schematicUrl,
        device_model: deviceModel || null,
        board_type: boardType || null,
        description: description || null,
        components: components || [],
        nets: nets || [],
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      schematic: data,
    });
  } catch (error: any) {
    console.error('Error uploading schematic:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload schematic' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch schematics
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deviceModel = searchParams.get('deviceModel');
    const boardType = searchParams.get('boardType');
    const schematicName = searchParams.get('schematicName');

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: 'Supabase configuration not found' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase.from('schematics').select('*');

    // Apply filters if provided
    if (deviceModel) {
      query = query.eq('device_model', deviceModel);
    }
    if (boardType) {
      query = query.eq('board_type', boardType);
    }
    if (schematicName) {
      query = query.ilike('schematic_name', `%${schematicName}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      schematics: data || [],
    });
  } catch (error: any) {
    console.error('Error fetching schematics:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch schematics' },
      { status: 500 }
    );
  }
}
