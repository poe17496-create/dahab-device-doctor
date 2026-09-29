import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * 🎙️ محرك النطق الصوتي العربي المباشر لمنظومة دهب دكتور
 * يقوم بتوليد ملف صوتي MP3 طبيعي فائق الوضوح باللغة العربية
 * لحل مشكلة عدم توفر حزم أصوات عربية في نظام العميل أو متصفحات الموبايل
 */
export async function GET(req: NextRequest) {
  try {
    const text = req.nextUrl.searchParams.get('text') || '';
    if (!text) {
      return new NextResponse('Text is required', { status: 400 });
    }

    // تنظيف النص من علامات الماركداون والروابط والأكواد
    const cleanText = text
      .replace(/[*#_`~\[\]\(\)>]/g, ' ')
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/<<<[\s\S]*?>>>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 350); // أول 350 حرف لتوفير سرعة استجابة فورية بدون تأخير

    if (!cleanText) {
      return new NextResponse('Clean text is empty', { status: 400 });
    }

    // استدعاء خدمة النطق الصوتي العربي القياسي
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ar&client=tw-ob&q=${encodeURIComponent(
      cleanText
    )}`;

    const response = await fetch(ttsUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'audio/mpeg, audio/*',
      },
    });

    if (!response.ok) {
      return new NextResponse('Failed to fetch TTS audio stream', { status: 502 });
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (error: any) {
    console.error('TTS API Error:', error);
    return new NextResponse(error?.message || 'Internal TTS error', { status: 500 });
  }
}
