import { NextRequest, NextResponse } from 'next/server';

/**
 * API Endpoint: Fetch External Schematic
 * جلب المخططات من مصادر خارجية (خدمات المخططات الهندسية)
 */

interface FetchSchematicRequest {
  boardName: string;
  deviceModel?: string;
  manufacturer?: string;
}

interface ExternalSchematic {
  id: string;
  name: string;
  url: string;
  deviceModel: string;
  manufacturer: string;
  type: 'main' | 'power' | 'display' | 'audio' | 'other';
  source: string;
  thumbnail?: string;
  description?: string;
}

// Simulated external schematic sources (in production, integrate with real APIs)
const EXTERNAL_SOURCES = {
  // Boardview services, Schematic databases, etc.
  'boardview.info': {
    name: 'Boardview.info',
    baseUrl: 'https://api.boardview.info/v1',
  },
  'schematic-net': {
    name: 'Schematic Net',
    baseUrl: 'https://api.schematic-net.com/v2',
  },
  'ifixit': {
    name: 'iFixit Schematics',
    baseUrl: 'https://api.ifixit.com/2.0',
  },
};

export async function POST(req: NextRequest) {
  try {
    const body: FetchSchematicRequest = await req.json();
    const { boardName, deviceModel, manufacturer } = body;

    if (!boardName) {
      return NextResponse.json(
        { success: false, error: 'Board name is required' },
        { status: 400 }
      );
    }

    // Try to fetch from external sources
    const schematics: ExternalSchematic[] = [];

    // Search in Supabase database first
    const supabaseSchematics = await searchSupabaseSchematics(boardName, deviceModel, manufacturer);
    schematics.push(...supabaseSchematics);

    // Try external APIs (in production, implement actual API calls)
    // const externalSchematics = await searchExternalAPIs(boardName, deviceModel, manufacturer);
    // schematics.push(...externalSchematics);

    // If no schematics found, try to generate schematic suggestions
    if (schematics.length === 0) {
      const suggestions = generateSchematicSuggestions(boardName, deviceModel, manufacturer);
      return NextResponse.json({
        success: true,
        schematics: [],
        suggestions,
        message: 'No schematics found. Here are some suggestions.',
      });
    }

    return NextResponse.json({
      success: true,
      schematics,
      count: schematics.length,
    });
  } catch (error: any) {
    console.error('Error fetching external schematic:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch schematic' },
      { status: 500 }
    );
  }
}

async function searchSupabaseSchematics(
  boardName: string,
  deviceModel?: string,
  manufacturer?: string
): Promise<ExternalSchematic[]> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return [];
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase.from('schematics').select('*');

    // Search by device model or board name
    if (deviceModel) {
      query = query.ilike('device_model', `%${deviceModel}%`);
    } else {
      query = query.ilike('schematic_name', `%${boardName}%`);
    }

    if (manufacturer) {
      query = query.ilike('description', `%${manufacturer}%`);
    }

    const { data, error } = await query.limit(10);

    if (error || !data) {
      return [];
    }

    return data.map((item: any) => ({
      id: item.id,
      name: item.schematic_name,
      url: item.schematic_url,
      deviceModel: item.device_model || '',
      manufacturer: item.board_type || '',
      type: 'main' as const,
      source: 'Supabase',
      description: item.description,
    }));
  } catch (error) {
    console.error('Error searching Supabase schematics:', error);
    return [];
  }
}

function generateSchematicSuggestions(
  boardName: string,
  deviceModel?: string,
  manufacturer?: string
): string[] {
  const suggestions: string[] = [];

  // Extract device information from board name
  const lowerBoardName = boardName.toLowerCase();

  // Common device patterns
  if (lowerBoardName.includes('iphone') || lowerBoardName.includes('apple')) {
    suggestions.push('Try searching: "iPhone [Model] Schematic" on Boardview.info');
    suggestions.push('Check: schematics.com for Apple devices');
    suggestions.push('Upload your own schematic if you have one');
  } else if (lowerBoardName.includes('samsung') || lowerBoardName.includes('galaxy')) {
    suggestions.push('Try searching: "Samsung [Model] Schematic" on Schematic Net');
    suggestions.push('Check: Samsung service manuals for schematics');
  } else if (lowerBoardName.includes('macbook') || lowerBoardName.includes('imac')) {
    suggestions.push('Try searching: "MacBook [Model] Boardview" on Boardview.info');
    suggestions.push('Check: ifixit.com for Apple schematics');
  } else if (lowerBoardName.includes('laptop') || lowerBoardName.includes('notebook')) {
    suggestions.push('Try searching: "[Manufacturer] [Model] Schematic"');
    suggestions.push('Check manufacturer service portal for schematics');
  }

  suggestions.push('Upload a schematic image directly');
  suggestions.push('Ask the AI to analyze the board without a schematic');

  return suggestions;
}

// Future: Implement actual external API calls
async function searchExternalAPIs(
  boardName: string,
  deviceModel?: string,
  manufacturer?: string
): Promise<ExternalSchematic[]> {
  // Implement calls to:
  // - Boardview.info API
  // - Schematic Net API
  // - iFixit API
  // - Other schematic databases

  return [];
}
