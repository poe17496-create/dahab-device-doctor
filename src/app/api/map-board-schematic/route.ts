import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API Endpoint: Map Board to Schematic
 * ربط البورد بالمخطط الهندسي
 */

interface MapBoardSchematicRequest {
  boardName: string;
  schematicId: string;
  alignmentData?: {
    offsetX: number;
    offsetY: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
    referencePoints?: Array<{
      board: { x: number; y: number };
      schematic: { x: number; y: number };
    }>;
  };
  confidenceScore?: number;
  isPrimary?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body: MapBoardSchematicRequest = await req.json();
    const { boardName, schematicId, alignmentData, confidenceScore, isPrimary } = body;

    // Validate required fields
    if (!boardName || !schematicId) {
      return NextResponse.json(
        { success: false, error: 'Board name and schematic ID are required' },
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

    // Get board ID from board name
    const { data: boardData, error: boardError } = await supabase
      .from('boards')
      .select('id')
      .eq('board_name', boardName)
      .single();

    if (boardError || !boardData) {
      return NextResponse.json(
        { success: false, error: 'Board not found' },
        { status: 404 }
      );
    }

    // If this is set as primary, unset any existing primary mappings
    if (isPrimary) {
      await supabase
        .from('board_schematic_mappings')
        .update({ is_primary: false } as any)
        .eq('board_id', boardData.id);
    }

    // Insert or update the mapping
    const { data, error } = await supabase
      .from('board_schematic_mappings')
      .upsert({
        board_id: boardData.id,
        schematic_id: schematicId,
        alignment_data: alignmentData || {},
        confidence_score: confidenceScore || 0.0,
        is_primary: isPrimary || false,
      } as any)
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
      mapping: data,
    });
  } catch (error: any) {
    console.error('Error mapping board to schematic:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to map board to schematic' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch schematic for a board
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const boardName = searchParams.get('boardName');

    if (!boardName) {
      return NextResponse.json(
        { success: false, error: 'Board name is required' },
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

    // Get board ID
    const { data: boardData, error: boardError } = await supabase
      .from('boards')
      .select('id')
      .eq('board_name', boardName)
      .single();

    if (boardError || !boardData) {
      return NextResponse.json(
        { success: false, error: 'Board not found' },
        { status: 404 }
      );
    }

    // Get primary schematic mapping
    const { data: mappingData, error: mappingError } = await supabase
      .from('board_schematic_mappings')
      .select(`
        *,
        schematics (*)
      `)
      .eq('board_id', boardData.id)
      .eq('is_primary', true)
      .single();

    if (mappingError || !mappingData) {
      // Try to get any schematic if no primary is set
      const { data: anyMapping, error: anyMappingError } = await supabase
        .from('board_schematic_mappings')
        .select(`
          *,
          schematics (*)
        `)
        .eq('board_id', boardData.id)
        .limit(1)
        .single();

      if (anyMappingError || !anyMapping) {
        return NextResponse.json(
          { success: false, error: 'No schematic mapping found for this board' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        mapping: anyMapping,
      });
    }

    return NextResponse.json({
      success: true,
      mapping: mappingData,
    });
  } catch (error: any) {
    console.error('Error fetching board schematic mapping:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch board schematic mapping' },
      { status: 500 }
    );
  }
}
