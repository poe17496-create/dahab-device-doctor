import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface UploadBoardImageRequest {
  boardName: string;
  imageUrl: string;
}

interface UploadBoardImageResponse {
  success: boolean;
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Check Supabase configuration
    if (!isSupabaseConfigured) {
      return NextResponse.json<UploadBoardImageResponse>(
        {
          success: false,
          error: 'Supabase database not configured',
        },
        { status: 500 }
      );
    }

    // Parse request body
    const body: UploadBoardImageRequest = await req.json();
    const { boardName, imageUrl } = body;

    if (!boardName || typeof boardName !== 'string' || boardName.trim() === '') {
      return NextResponse.json<UploadBoardImageResponse>(
        {
          success: false,
          error: 'boardName is required and must be a non-empty string',
        },
        { status: 400 }
      );
    }

    if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
      return NextResponse.json<UploadBoardImageResponse>(
        {
          success: false,
          error: 'imageUrl is required and must be a non-empty string',
        },
        { status: 400 }
      );
    }

    // Cache the image URL in Supabase (use upsert to handle duplicates)
    const { error: insertError } = await supabaseAdmin
      .from('boards')
      .upsert({
        board_name: boardName,
        image_url: imageUrl,
        search_query: 'custom uploaded image',
      }, {
        onConflict: 'board_name',
        ignoreDuplicates: false,
      });

    if (insertError) {
      console.error('Error caching board image:', insertError);
      return NextResponse.json<UploadBoardImageResponse>(
        {
          success: false,
          error: 'Failed to save image to database',
        },
        { status: 500 }
      );
    }

    return NextResponse.json<UploadBoardImageResponse>({
      success: true,
    });
  } catch (error: any) {
    console.error('Error in upload-board-image API:', error);
    return NextResponse.json<UploadBoardImageResponse>(
      {
        success: false,
        error: error.message || 'Failed to upload board image',
      },
      { status: 500 }
    );
  }
}
