import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import ddg from 'duckduckgo-images-api';

export const dynamic = 'force-dynamic';

/**
 * Auto-Fetch & Cache API for Board Images
 *
 * Flow:
 * 1. Receive boardName from request
 * 2. Query Supabase boards table for cached image_url
 * 3. If cached, return it
 * 4. If not cached, fetch high-res image using DuckDuckGo Image Search
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
 * Fetch high-resolution motherboard image using DuckDuckGo Image Search
 * No API key required - uses free web scraping
 */
async function fetchBoardImage(boardName: string): Promise<string> {
  const query = `${boardName} motherboard PCB high resolution`;

  try {
    const results = await ddg.image_search({
      query: query,
      iterations: 1,
      moderate: false,
    });

    if (!results || results.length === 0) {
      throw new Error('No images found');
    }

    // Filter for high-resolution images (prefer larger images)
    const highResImages = results
      .filter((img: any) => img.width && img.height && img.width >= 800 && img.height >= 600)
      .sort((a: any, b: any) => (b.width * b.height) - (a.width * a.height));

    // Return the best high-res image, or the first result if no high-res images
    const bestImage = highResImages.length > 0 ? highResImages[0] : results[0];
    return bestImage.image;
  } catch (error) {
    console.error('DuckDuckGo search error:', error);
    throw new Error('Failed to fetch image from DuckDuckGo');
  }
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
