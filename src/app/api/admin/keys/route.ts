import { NextRequest, NextResponse } from 'next/server';
import {
  getStoredApiKeys,
  saveStoredApiKeys,
  testSingleApiKey,
  getAllActiveKeys,
} from '@/lib/apiKeysStorage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const keys = getStoredApiKeys();
    const active = getAllActiveKeys();

    return NextResponse.json({
      keys,
      counts: {
        geminiCount: active.geminiKeys.length,
        openrouterCount: active.openrouterKeys.length,
        openaiCount: active.openaiKeys.length,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'فشل في استرجاع المفاتيح' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // فحص اختبار مفتاح حي
    if (body.action === 'test') {
      const { provider, key } = body;
      if (!provider || !key) {
        return NextResponse.json({ error: 'المزود والمفتاح مطلوبان' }, { status: 400 });
      }
      const testResult = await testSingleApiKey(provider, key);
      return NextResponse.json({ result: testResult });
    }

    // حفظ المفاتيح
    const { geminiKeys, openrouterKeys, openaiKeys, groqKeys } = body;
    const saved = saveStoredApiKeys({
      geminiKeys,
      openrouterKeys,
      openaiKeys,
      groqKeys,
    });

    const active = getAllActiveKeys();

    return NextResponse.json({
      message: 'تم حفظ وتفعيل المفاتيح في منظومة دهب بنجاح',
      keys: saved,
      activeCounts: {
        gemini: active.geminiKeys.length,
        openrouter: active.openrouterKeys.length,
        openai: active.openaiKeys.length,
      },
    });
  } catch (err: any) {
    console.error('API Admin Keys Error:', err);
    return NextResponse.json({ error: err?.message || 'فشل في حفظ المفاتيح' }, { status: 500 });
  }
}
