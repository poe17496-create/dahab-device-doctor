import { NextRequest, NextResponse } from 'next/server';
import { ReferenceSource } from '@/lib/types';
import { rateLimitMiddleware } from '@/lib/rate-limit';
import { sanitizeString } from '@/lib/sanitize';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 40 requests per minute per IP
    const rateLimitResult = await rateLimitMiddleware(req, 40, 60 * 1000);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'تجاوزت الحد المسموح من الطلبات، يرجى الانتظار دقيقة.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '40',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const { keyword, specialty } = await req.json();
    const sanitizedKeyword = keyword ? sanitizeString(keyword, 200) : '';
    const kw = sanitizedKeyword.trim();
    const encodedKw = encodeURIComponent(kw || 'schematic');

    const isLaptop = specialty === 'laptop-motherboard' || kw.toLowerCase().includes('dell') || kw.toLowerCase().includes('hp') || kw.toLowerCase().includes('lenovo') || kw.toLowerCase().includes('macbook') || kw.toLowerCase().includes('asus');
    const isMobile = specialty === 'mobile-repair' || kw.toLowerCase().includes('iphone') || kw.toLowerCase().includes('samsung') || kw.toLowerCase().includes('xiaomi') || kw.toLowerCase().includes('huawei');
    const isTV = specialty === 'tv-power-boards';
    const isECU = specialty === 'automotive-ecu';

    // مراجع تفاعلية وديناميكية عالية الدقة مرتبطة بقنوات تليجرام وبنوك المخططات
    const results: ReferenceSource[] = [
      // 1. تليجرام - قنوات المخططات ودامبات البيوس
      {
        title: `📡 تليجرام: بحث مباشر عن مخططات ودامبات ${kw || 'البوردة'} في قناة (@laptop_schematics)`,
        source: 'قناة تليجرام للمخططات',
        link: `https://t.me/s/laptop_schematics?q=${encodedKw}`,
        snippet: 'بحث مباشر في أرشيف تليجرام الضخم لملفات BIOS BIN وبوردفيو ومخططات المازربورد مفتوحة المصدر.',
        type: 'custom',
      },
      {
        title: `💾 تليجرام: دامبات بيوس BIN مسحوبة ومختبرة بالمبرمجات (@bios_dump)`,
        source: 'قناة تليجرام لدامبات البيوس',
        link: `https://t.me/s/bios_dump?q=${encodedKw}`,
        snippet: 'ملفات بيوس BIN أصلية مسحوبة ومختبرة بأجهزة RT809H و CH341A مع تنظيف الـ ME Region مجاناً.',
        type: 'custom',
      },
      {
        title: `📱 تليجرام: مخططات وسيرفس مانوال الموبايل (@mobile_schematics_firmware)`,
        source: 'تليجرام سيرفس الموبايل',
        link: `https://t.me/s/mobile_schematics_firmware?q=${encodedKw}`,
        snippet: 'مكتبة مخططات تفصيلية لآيفون وسامسونج وشاومي مع مسارات الشحن والشبكة وقياسات الممانعة.',
        type: 'custom',
      },

      // 2. منتديات ومواقع الـ BIN المعتمدة
      {
        title: `🌐 منتدى Badcaps العالمي: مناقشات ودامبات بيوس ومخططات (${kw})`,
        source: 'مجتمع Badcaps.net',
        link: `https://www.google.com/search?q=site:badcaps.net+bios+bin+schematic+${encodedKw}`,
        snippet: 'أكبر مجتمع دولي مجاني لمهندسي صيانة المازربورد؛ حلول الشورت، تعديل البيوس وحذف باسووردات البيوس.',
        type: 'forum',
      },
      {
        title: `📑 موقع Vinafix المتخصص: ملفات Clear ME وبوردفيو (${kw})`,
        source: 'بنك Vinafix للمخططات',
        link: `https://vinafix.com/search/1/?q=${encodedKw}`,
        snippet: 'تحميل ملفات Boardview والمخططات الأصلية لجميع أجيال لابتوب ديل ولينوفو وإتش بي والماك بوك.',
        type: 'schematic',
      },
      {
        title: `⚡ موقع LabOneInside: تحميل مجاني لدامبات الـ BIOS BIN لـ (${kw})`,
        source: 'LabOneInside Clear ME',
        link: `https://www.laboneinside.com/?s=${encodedKw}`,
        snippet: 'ملفات بيوس جاهزة ومعدلة لتخطي مشكلات تأخر الإقلاع والـ 30 ثانية ريستارت بسبب تلف الـ ME Region.',
        type: 'schematic',
      },

      // 3. بنوك الداتاشيت والمخططات التفاعلية
      {
        title: `🔍 AllDataSheet: مواصفات الآيسيهات ومخطط الأرجل (Pinout Datasheet)`,
        source: 'بنك AllDataSheet العالمي',
        link: `https://www.alldatasheet.com/view.jsp?Searchword=${encodedKw}`,
        snippet: 'عرض الخصائص الكهربائية وجهود الدخل والخرج وقيم المقاومات المحيطة بآيسيهات الباور والشحن.',
        type: 'schematic',
      },
      {
        title: `🛠️ موسوعة Repair.wiki الهندسية لتوثيق أعطال (${kw})`,
        source: 'RepairWiki (Louis Rossmann)',
        link: `https://repair.wiki/w/${encodedKw}`,
        snippet: 'توثيق هندسي لأشهر أعطال الباور ومسارات PPBUS_G3H وحلول مشاكل الإقلاع الشائعة.',
        type: 'solution',
      },

      // 4. مجتمع GSM-Forum
      {
        title: `💬 مجتمع GSM-Forum العالمي: تجارب وحلول كبار الفنيين لـ (${kw})`,
        source: 'GSM-Hosting Forum',
        link: `https://www.google.com/search?q=site:forum.gsmhosting.com+${encodedKw}`,
        snippet: 'حلول أعطال الشحن الوهمي، أخطاء التفليش والبانيك، وحلول التعويض بأسلاك الجمپر للمسارات المقطوعة.',
        type: 'forum',
      },

      // 5. يوتيوب - فيديوهات الصيانة العملية وتتبع المسارات
      {
        title: `🎥 يوتيوب: فيديوهات عملية لتتبع وفحص عطل (${kw}) خطوة بخطوة`,
        source: 'فيديوهات صيانة يوتيوب',
        link: `https://www.youtube.com/results?search_query=repair+fix+schematics+${encodedKw}`,
        snippet: 'شروحات بالفيديو لعمليات الشبلنة والحقن الحراري بالرجينة واستبدال الآيسيهات التالفة.',
        type: 'video',
      },

      // 6. أدوات البوردفيو التفاعلية
      {
        title: `📐 منصة Borneo Schematics و Phoneboard التفاعلية لـ (${kw})`,
        source: 'مخططات وبوردفيو تفاعلي',
        link: `https://www.google.com/search?q=borneo+schematics+boardview+${encodedKw}`,
        snippet: 'تتبع خطوط التغذية وقياسات الممانعة بالدايود مود على نقاط الفحص (Test Points) ومكثفات البوردة.',
        type: 'schematic',
      },
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'فشل في جلب المراجع' }, { status: 500 });
  }
}
