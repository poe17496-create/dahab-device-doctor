import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Auto-Fetch & Cache API for Board Images
 *
 * Flow:
 * 1. Receive boardName from request
 * 2. Query Supabase boards table for cached image_url
 * 3. If cached, return it
 * 4. If not cached, fetch high-res image using Image Search API
 * 5. Insert image_url into Supabase for permanent caching
 * 6. Return the new image_url
 */

interface GetBoardRequest {
  boardName: string;
}

interface GetBoardResponse {
  success: boolean;
  imageUrl?: string;
  cached?: boolean;
  error?: string;
}

/**
 * Fetch high-resolution motherboard image using Serper API (Google Search)
 * Rotates between multiple API keys to avoid quota exhaustion
 */
async function fetchBoardImage(boardName: string): Promise<string> {
  // Read API keys from environment variables
  const API_KEYS = [
    process.env.GOOGLE_API_KEY_1,
    process.env.GOOGLE_API_KEY_2,
    process.env.GOOGLE_API_KEY_3,
    process.env.GOOGLE_API_KEY_4,
    process.env.GOOGLE_API_KEY_5,
    process.env.GOOGLE_API_KEY_6,
  ].filter(Boolean); // Remove undefined/null values

  if (API_KEYS.length === 0) {
    throw new Error('No Google API keys configured. Please add GOOGLE_API_KEY_1 through GOOGLE_API_KEY_6 to .env.local');
  }

  const query = `${boardName} motherboard PCB circuit board high resolution`;
  const url = `https://google.serper.dev/search?q=${encodeURIComponent(query)}&type=images&num=1`;

  // Try each API key until one works
  for (let i = 0; i < API_KEYS.length; i++) {
    const apiKey = API_KEYS[i];

    if (!apiKey) {
      continue; // Skip if key is undefined
    }

    try {
      const response = await fetch(url, {
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!data.images || data.images.length === 0) {
        continue; // Try next key
      }

      // Return the high-res image URL
      return data.images[0].link;
    } catch (error) {
      console.log(`API key ${i + 1} failed, trying next key...`);
      continue; // Try next key
    }
  }

  throw new Error('All API keys failed. Please upload a custom board image instead.');
}

export async function POST(req: NextRequest) {
  try {
    // Check Supabase configuration
    if (!isSupabaseConfigured) {
      return NextResponse.json<GetBoardResponse>(
        {
          success: false,
          error: 'Supabase database not configured. Please upload a custom board image instead.',
        },
        { status: 500 }
      );
    }

    // Parse request body
    const body: GetBoardRequest = await req.json();
    const { boardName } = body;

    if (!boardName || typeof boardName !== 'string' || boardName.trim() === '') {
      return NextResponse.json<GetBoardResponse>(
        {
          success: false,
          error: 'boardName is required and must be a non-empty string',
        },
        { status: 400 }
      );
    }

    // Step 1: Check if board image is already cached in Supabase
    const { data: cachedBoard, error: fetchError } = await supabaseAdmin
      .from('boards')
      .select('image_url')
      .eq('board_name', boardName)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = row not found, which is expected for new boards
      console.error('Error fetching cached board:', fetchError);
      return NextResponse.json<GetBoardResponse>(
        {
          success: false,
          error: 'Database error',
        },
        { status: 500 }
      );
    }

    // Step 2: If cached, return the image URL
    if (cachedBoard && cachedBoard.image_url) {
      return NextResponse.json<GetBoardResponse>({
        success: true,
        imageUrl: cachedBoard.image_url,
        cached: true,
      });
    }

    // Step 3: If not cached, fetch image using Image Search API
    console.log(`Fetching image for board: ${boardName}`);
    let imageUrl: string;
    try {
      imageUrl = await fetchBoardImage(boardName);
    } catch (error: any) {
      // If API fails, return error with suggestion to upload custom image
      return NextResponse.json<GetBoardResponse>(
        {
          success: false,
          error: 'Could not fetch image automatically. Please upload a custom board image instead.',
        },
        { status: 500 }
      );
    }

    // Step 4: Cache the image URL in Supabase (use upsert to handle duplicates)
    const { error: insertError } = await supabaseAdmin
      .from('boards')
      .upsert({
        board_name: boardName,
        image_url: imageUrl,
        search_query: `${boardName} motherboard PCB high resolution`,
      }, {
        onConflict: 'board_name',
        ignoreDuplicates: false,
      });

    if (insertError) {
      console.error('Error caching board image:', insertError);
      // Return the image anyway even if caching fails
      return NextResponse.json<GetBoardResponse>({
        success: true,
        imageUrl,
        cached: false,
      });
    }

    // Step 5: Return the new image URL
    return NextResponse.json<GetBoardResponse>({
      success: true,
      imageUrl,
      cached: false,
    });
  } catch (error: any) {
    console.error('Error in get-board API:', error);
    return NextResponse.json<GetBoardResponse>(
      {
        success: false,
        error: error.message || 'Failed to fetch board image',
      },
      { status: 500 }
    );
  }
}
