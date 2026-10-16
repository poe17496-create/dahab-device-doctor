import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function splitIntoChunks(text: string, maxLength: number = 140): string[] {
  const chunks: string[] = [];
  const sentences = text.match(/[^.!?،\n]+[.!?،\n]*|.+/g) || [text];
  
  let currentChunk = '';
  for (const sentence of sentences) {
    if ((currentChunk + ' ' + sentence).trim().length <= maxLength) {
      currentChunk = (currentChunk + ' ' + sentence).trim();
    } else {
      if (currentChunk) chunks.push(currentChunk);
      if (sentence.length > maxLength) {
        const words = sentence.split(' ');
        let wordChunk = '';
        for (const w of words) {
          if ((wordChunk + ' ' + w).trim().length <= maxLength) {
            wordChunk = (wordChunk + ' ' + w).trim();
          } else {
            if (wordChunk) chunks.push(wordChunk);
            wordChunk = w;
          }
        }
        if (wordChunk) currentChunk = wordChunk;
        else currentChunk = '';
      } else {
        currentChunk = sentence.trim();
      }
    }
  }
  if (currentChunk) chunks.push(currentChunk);
  return chunks.slice(0, 5); // حد أقصى 5 مقاطع لمنع استنزاف الموارد
}

async function generateTTSAudio(text: string, rangeHeader: string | null): Promise<Response> {
  const chunks = splitIntoChunks(text.trim(), 140);
  const audioBuffers: Buffer[] = [];

  for (const chunk of chunks) {
    if (!chunk.trim()) continue;
    const encodedText = encodeURIComponent(chunk.trim());
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=ar&client=tw-ob`;
    
    const response = await fetch(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    
    if (response.ok) {
      const arrayBuf = await response.arrayBuffer();
      audioBuffers.push(Buffer.from(arrayBuf));
    } else {
      console.warn(`TTS chunk failed with status ${response.status}: "${chunk.slice(0, 30)}..."`);
    }
  }

  if (audioBuffers.length === 0) {
    throw new Error('All TTS chunks failed to generate audio');
  }

  const combinedBuffer = Buffer.concat(audioBuffers);
  const totalLength = combinedBuffer.byteLength;

  // 🍎 معالجة طلبات الـ Range المطلوبة بشكل صارم من متصفحات Safari و iOS و Firefox
  if (rangeHeader && rangeHeader.startsWith('bytes=')) {
    const rangeParts = rangeHeader.replace('bytes=', '').split('-');
    const start = parseInt(rangeParts[0], 10) || 0;
    let end = rangeParts[1] ? parseInt(rangeParts[1], 10) : totalLength - 1;
    if (end >= totalLength) end = totalLength - 1;
    if (start > end) {
      return new NextResponse(null, {
        status: 416,
        headers: { 'Content-Range': `bytes */${totalLength}` },
      });
    }

    const chunk = combinedBuffer.subarray(start, end + 1);

    return new NextResponse(chunk, {
      status: 206,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': chunk.byteLength.toString(),
        'Content-Range': `bytes ${start}-${end}/${totalLength}`,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  return new NextResponse(combinedBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': totalLength.toString(),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');
  
  if (!text || !text.trim()) {
    return NextResponse.json({ error: 'Text parameter is required' }, { status: 400 });
  }

  try {
    const rangeHeader = request.headers.get('range');
    return await generateTTSAudio(text, rangeHeader);
  } catch (error) {
    console.error('TTS generation error (GET):', error);
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const text = body.text;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Text parameter is required' }, { status: 400 });
    }

    const rangeHeader = request.headers.get('range');
    return await generateTTSAudio(text, rangeHeader);
  } catch (error) {
    console.error('TTS generation error (POST):', error);
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
  }
}
