import { NextRequest, NextResponse } from 'next/server';
import { ReferenceSource } from '@/lib/types';
import { rateLimitMiddleware } from '@/lib/rate-limit';
import { sanitizeString } from '@/lib/sanitize';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 30 requests per minute per IP (higher limit for search)
    const rateLimitResult = await rateLimitMiddleware(req, 30, 60 * 1000);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'تجاوزت الحد المسموح من الطلبات، يرجى الانتظار دقيقة.' 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '30',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          }
        }
      );
    }

    const { keyword, specialty } = await req.json();
    
    // Sanitize keyword to prevent injection
    const sanitizedKeyword = keyword ? sanitizeString(keyword, 200) : '';
    const query = sanitizedKeyword.toLowerCase();

    // قاعدة بيانات مراجع ومصادر هندسية ذكية مع ربط قنوات تليجرام ومواقع الـ BIN والمخططات
    const mockReferences: ReferenceSource[] = [
      {
        title: `ملفات BIOS BIN و Clear ME ومخططات لـ (${keyword || 'المازربورد'}) - Badcaps & Vinafix`,
        source: 'مواقع BIN وبيوس',
        link: `https://www.google.com/search?q=site:badcaps.net+OR+site:vinafix.com+bios+bin+dump+schematic+${encodeURIComponent(keyword || '')}`,
        snippet: 'تحميل ملفات BIOS .BIN مسحوبة ومختبرة، ملفات Clear ME Region، ومخططات المازربورد واللابتوب بدقة.',
        type: 'schematic',
      },
      {
        title: `مكتبة تليجرام لمخططات ودامبات الـ BIN للابتوب والمازربورد (@laptop_schematics)`,
        source: 'تليجرام Telegram',
        link: `https://t.me/laptop_schematics`,
        snippet: 'قناة تليجرام متخصصة في توفير ملفات البيوس BIN والمخططات الهندسية والبوردفيو مجاناً لجميع أجيال الأجهزة.',
        type: 'custom',
      },
      {
        title: `مخططات البوردفيو والمسارات لـ (${keyword || 'الأجهزة الشائعة'}) - ZXW & Borneo`,
        source: 'مخططات وزدكس دبليو ZXW',
        link: `https://www.google.com/search?q=schematics+boardview+${encodeURIComponent(keyword || '')}`,
        snippet: 'تتبع خطوط التغذية الرئيسية VDD_MAIN و VPH_PWR و 19V DC-IN ونقاط التيست بوينت لمسارات الـ I2C والباور سيكونس.',
        type: 'schematic',
      },
      {
        title: `قناة تليجرام لدامبات البيوس المسحوبة والمختبرة (@bios_dump)`,
        source: 'تليجرام Telegram',
        link: `https://t.me/bios_dump`,
        snippet: 'أرشيف ملفات BIOS BIN dumps تم سحبها بأجهزة المبرمجة RT809H و CH341A مع شروحات دمج وتعديل البيوس.',
        type: 'custom',
      },
      {
        title: `فيديو تطبيقي لإصلاح وتتبع عطل (${keyword || 'الدائرة'}) على يوتيوب`,
        source: 'يوتيوب YouTube',
        link: `https://www.youtube.com/results?search_query=repair+fix+${encodeURIComponent(keyword || '')}`,
        snippet: 'شرح عملي للحقن الحراري واكتشاف المكثف المسبب للشورت أو خطوات شحن البيوس وتبديل الآيسيهات.',
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
        snippet: 'جدول قياس الممانعات المرجعية بالدايود مود وقيم المقاومات الفيوزية في دوائر الباور سبلاي واللابتوب.',
        type: 'solution',
      },
    ];

    return NextResponse.json({ results: mockReferences });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'فشل في جلب المراجع' }, { status: 500 });
  }
}
