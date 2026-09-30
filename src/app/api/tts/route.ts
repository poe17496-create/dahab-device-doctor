import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');
  
  if (!text) {
    return NextResponse.json({ error: 'Text parameter is required' }, { status: 400 });
  }

  try {
    // استخدام ResponsiveVoice من جانب الخادم لتجنب CORS
    const encodedText = encodeURIComponent(text);
    const ttsUrl = `https://responsivevoice.org/responsivevoice/getvoice.php?t=${encodedText}&tl=ar&sv=g1&vn=male`;
    
    const response = await fetch(ttsUrl);
    
    if (!response.ok) {
      throw new Error('TTS service failed');
    }

    const audioBuffer = await response.arrayBuffer();
    
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
  }
}
