import { NextRequest, NextResponse } from 'next/server';
import { ReferenceSource } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { keyword, specialty } = await req.json();
    const query = (keyword || '').toLowerCase();

    // قاعدة بيانات مراجع ومصادر هندسية ذكية
    const mockReferences: ReferenceSource[] = [
      {
        title: `مخططات البوردفيو والمسارات لـ (${keyword || 'الأجهزة الشائعة'}) - ZXW & Borneo`,
        source: 'مخططات وزدكس دبليو ZXW',
        link: `https://www.google.com/search?q=schematics+boardview+${encodeURIComponent(keyword || '')}`,
        snippet: 'تتبع خطوط التغذية الرئيسية VDD_MAIN و VPH_PWR ونقاط التيست بوينت لمسارات الـ I2C والباور سيكونس.',
        type: 'schematic',
      },
      {
        title: `فيديو تطبيقي لإصلاح وتتبع عطل (${keyword || 'الدائرة'}) على يوتيوب`,
        source: 'يوتيوب YouTube',
        link: `https://www.youtube.com/results?search_query=repair+fix+${encodeURIComponent(keyword || '')}`,
        snippet: 'شرح عملي للحقن الحراري واكتشاف المكثف المسبب للشورت أو خطوات التفليش وفتح البوت لودر.',
        type: 'video',
      },
      {
        title: `حلول كبار الفنيين في مجتمع GSM-Forum و XDA لـ (${keyword || 'العطل المعني'})`,
        source: 'منتديات GSM',
        link: `https://www.google.com/search?q=site:forum.gsmhosting.com+${encodeURIComponent(keyword || '')}`,
        snippet: 'مناقشات تفصيلية حول أخطاء ريستارت الـ Kernel Panic، وحلول الشحن الوهمي وتبديل الآيسيهات المتوافقة.',
        type: 'forum',
      },
      {
        title: `دليل دهب الهندسي لصيانة كروت الباور والدوائر الإلكترونية`,
        source: 'دليل صيانة دهب',
        link: `#`,
        snippet: 'جدول قياس الممانعات المرجعية بالدايود مود وقيم المقاومات الفيوزية في دوائر الباور سبلاي.',
        type: 'solution',
      },
    ];

    return NextResponse.json({ results: mockReferences });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'فشل في جلب المراجع' }, { status: 500 });
  }
}
