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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');
  
  if (!text || !text.trim()) {
    return NextResponse.json({ error: 'Text parameter is required' }, { status: 400 });
  }

  try {
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

    return new NextResponse(combinedBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': combinedBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('TTS generation error:', error);
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
  }
}
