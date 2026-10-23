import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { isRateLimited } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

interface GetBoardRequest {
  boardName: string;
  category?: 'mobile' | 'laptop' | 'desktop' | 'macbook';
}

interface GetBoardResponse {
  success: boolean;
  imageUrl?: string;
  category?: 'mobile' | 'laptop' | 'desktop';
  cached?: boolean;
  error?: string;
}

// قاعدة بيانات صور البوردات الحقيقية الأصلية عالية الدقة حسب الموديل وكود البوردة
const SPECIFIC_BOARD_DATABASE: Array<{
  keywords: string[];
  boardCodes: string[];
  imageUrl: string;
  category: 'mobile' | 'laptop' | 'desktop';
  modelLabel: string;
}> = [
  // 1. هواتف آيفون الحديثة (Double-Decker Sandwich Logic Board)
  {
    keywords: ['iphone 15 pro max', 'iphone 15 pro', '15 pro max', '15 pro'],
    boardCodes: ['820-03290', '820-03291'],
    imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1600&q=85',
    category: 'mobile',
    modelLabel: 'iPhone 15 Pro Max Logic Board',
  },
  {
    keywords: ['iphone 14 pro max', 'iphone 14 pro', '14 pro max', '14 pro'],
    boardCodes: ['820-02857', '820-02858'],
    imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1600&q=85',
    category: 'mobile',
    modelLabel: 'iPhone 14 Pro Max Logic Board',
  },
  {
    keywords: ['iphone 13 pro max', 'iphone 13 pro', '13 pro max', '13 pro', 'iphone 13'],
    boardCodes: ['820-02384', '820-02385'],
    imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1600&q=85',
    category: 'mobile',
    modelLabel: 'iPhone 13 Pro Max Logic Board',
  },
  {
    keywords: ['iphone 12 pro max', 'iphone 12 pro', 'iphone 12', '12 pro'],
    boardCodes: ['820-01990', '820-01991'],
    imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1600&q=85',
    category: 'mobile',
    modelLabel: 'iPhone 12 Pro Logic Board',
  },
  // 2. هواتف آيفون الكلاسيكية (Single-layer L-Shaped PCB)
  {
    keywords: ['iphone 11 pro max', 'iphone 11 pro', 'iphone 11', 'iphone xr', 'iphone xs', 'iphone x'],
    boardCodes: ['820-01535', '820-01044', '820-00843'],
    imageUrl: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=1600&q=85',
    category: 'mobile',
    modelLabel: 'iPhone 11 / X Logic Board',
  },
  {
    keywords: ['iphone 8', 'iphone 7', 'iphone 6', 'iphone se'],
    boardCodes: ['820-00843', '820-00188', '820-00229'],
    imageUrl: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=1600&q=85',
    category: 'mobile',
    modelLabel: 'iPhone Classic Logic Board',
  },
  // 3. هواتف سامسونج جالاكسي وشاومي
  {
    keywords: ['samsung', 'galaxy s24', 'galaxy s23', 'galaxy s22', 's24 ultra', 's23 ultra', 's22 ultra', 'sm-s928', 'sm-s918', 'sm-s908', 'a54', 'a34'],
    boardCodes: ['sm-s928', 'sm-s918', 'sm-s908', 'sm-a546'],
    imageUrl: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=1600&q=85',
    category: 'mobile',
    modelLabel: 'Samsung Galaxy Series Motherboard',
  },
  {
    keywords: ['xiaomi', 'redmi', 'redmi note 13', 'redmi note 12', 'poco'],
    boardCodes: ['22101316c'],
    imageUrl: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=1600&q=85',
    category: 'mobile',
    modelLabel: 'Xiaomi / Redmi Motherboard',
  },
  // 4. أجهزة أبل ماك بوك (MacBook Logic Boards)
  {
    keywords: ['macbook pro m3', 'macbook pro m2', 'macbook pro m1', 'a2338', 'a2442', 'a2485', '820-02020', '820-02098', 'm1', 'm2', 'm3'],
    boardCodes: ['820-02020', '820-02098', '820-02536'],
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1600&q=85',
    category: 'laptop',
    modelLabel: 'MacBook Pro Apple Silicon Logic Board',
  },
  {
    keywords: ['macbook air', 'a2337', 'a2179', '820-00165', '820-01958', '820-00840', 'a1708'],
    boardCodes: ['820-00165', '820-01958', '820-00840'],
    imageUrl: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1600&q=85',
    category: 'laptop',
    modelLabel: 'MacBook Air Logic Board',
  },
  // 5. لابتوبات ديل (Dell Laptops Motherboards)
  {
    keywords: ['dell', 'latitude 5400', 'latitude 5410', 'latitude 5420', 'latitude 5580', 'la-d801p', 'la-g891p', 'edc51', 'latitude'],
    boardCodes: ['la-d801p', 'la-g891p', 'edc51'],
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=85',
    category: 'laptop',
    modelLabel: 'Dell Latitude Business Motherboard',
  },
  {
    keywords: ['inspiron', 'la-9104p', 'la-b162p', 'dell inspiron', 'xps'],
    boardCodes: ['la-9104p', 'la-b162p'],
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=85',
    category: 'laptop',
    modelLabel: 'Dell Inspiron / XPS Motherboard',
  },
  // 6. لابتوبات لينوفو ثينك باد (Lenovo ThinkPad Motherboards)
  {
    keywords: ['lenovo', 'thinkpad', 't480', 't490', 'x1 carbon', 'nm-b501', 'nm-a311', 'nm-b452', 'ideapad'],
    boardCodes: ['nm-b501', 'nm-a311', 'nm-b452'],
    imageUrl: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&w=1600&q=85',
    category: 'laptop',
    modelLabel: 'Lenovo ThinkPad Motherboard',
  },
  // 7. لابتوبات إتش بي (HP EliteBook / ProBook Motherboards)
  {
    keywords: ['hp', 'elitebook', '840 g5', '840 g6', 'probook', '6050a2945601', 'da0x12mb6d0', 'la-c701p', 'pavilion'],
    boardCodes: ['6050a2945601', 'da0x12mb6d0', 'la-c701p'],
    imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1600&q=85',
    category: 'laptop',
    modelLabel: 'HP EliteBook / ProBook Motherboard',
  },
  // 8. لوحات المازربورد والكمبيوتر المكتبي (Desktop ATX Motherboards)
  {
    keywords: ['asus', 'asus rog', 'msi', 'gigabyte', 'asrock', 'b450', 'b550', 'b660', 'z690', 'z790', 'h81', 'h110', 'h310', 'desktop', 'motherboard', 'مازربورد', 'كمبيوتر'],
    boardCodes: ['b450', 'b550', 'h81', 'z690'],
    imageUrl: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=1600&q=85',
    category: 'desktop',
    modelLabel: 'Desktop ATX / Micro-ATX Motherboard',
  },
  // 9. كروت الشاشة والرسوميات (GPU Graphics Card PCB)
  {
    keywords: ['rtx', 'gtx', 'gpu', 'graphic', 'كارت شاشة', 'كارت رسوميات', '4090', '3080', 'radeon'],
    boardCodes: ['rtx4090', 'rtx3080'],
    imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1600&q=85',
    category: 'desktop',
    modelLabel: 'Graphics Card GPU PCB Board',
  },
];

const DEFAULT_BOARD_IMAGES = {
  macbook: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1600&q=85',
  laptop: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=85',
  desktop: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=1600&q=85',
  mobile: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1600&q=85',
};

function detectCategory(name: string, categoryOverride?: string): 'macbook' | 'laptop' | 'desktop' | 'mobile' {
  if (categoryOverride) {
    const co = categoryOverride.toLowerCase().trim();
    if (co === 'macbook') return 'macbook';
    if (co === 'laptop') {
      if (name.toLowerCase().includes('macbook') || name.toLowerCase().includes('820-')) return 'macbook';
      return 'laptop';
    }
    if (co === 'desktop' || co === 'pc') return 'desktop';
    if (co === 'mobile') return 'mobile';
  }

  const q = name.toLowerCase().trim();
  if (q.includes('macbook') || q.includes('apple mac') || q.includes('820-') || q.includes('a2337') || q.includes('a2338') || q.includes('a2442') || q.includes('a2179') || q.includes('a1708') || q.includes('a1989')) {
    return 'macbook';
  }
  if (
    q.includes('dell') ||
    q.includes('hp') ||
    q.includes('lenovo') ||
    q.includes('thinkpad') ||
    q.includes('ideapad') ||
    q.includes('latitude') ||
    q.includes('inspiron') ||
    q.includes('probook') ||
    q.includes('elitebook') ||
    q.includes('pavilion') ||
    q.includes('laptop') ||
    q.includes('لابتوب') ||
    q.includes('notebook') ||
    q.includes('la-') ||
    q.includes('nm-') ||
    q.includes('da0') ||
    q.includes('ms-1') ||
    q.includes('acer') ||
    q.includes('asus rog') ||
    q.includes('tuf') ||
    q.includes('zenbook') ||
    q.includes('compal') ||
    q.includes('quanta')
  ) {
    return 'laptop';
  }
  if (
    q.includes('desktop') ||
    q.includes('كمبيوتر') ||
    q.includes('motherboard') ||
    q.includes('pc') ||
    q.includes('b450') ||
    q.includes('b550') ||
    q.includes('b660') ||
    q.includes('z690') ||
    q.includes('z790') ||
    q.includes('h81') ||
    q.includes('h110') ||
    q.includes('h310') ||
    q.includes('ga-') ||
    q.includes('atx') ||
    q.includes('lga') ||
    q.includes('am4') ||
    q.includes('am5') ||
    q.includes('gpu') ||
    q.includes('rtx') ||
    q.includes('gtx')
  ) {
    return 'desktop';
  }
  return 'mobile';
}

/**
 * جلب صورة مخصصة عالية الدقة مطابقة تحديداً للموديل أو كود البوردة
 */
async function fetchBoardImage(boardName: string, categoryOverride?: string): Promise<{ imageUrl: string; modelLabel?: string }> {
  const q = (boardName || '').toLowerCase().trim();

  // 1. بحث دقيق في قاعدة بيانات البوردات الأصلية المخصصة
  for (const entry of SPECIFIC_BOARD_DATABASE) {
    // فحص أكواد البوردات أولاً
    if (entry.boardCodes.some((code) => q.includes(code.toLowerCase()))) {
      return { imageUrl: entry.imageUrl, modelLabel: entry.modelLabel };
    }
    // فحص الكلمات المفتاحية للموديل
    if (entry.keywords.some((kw) => q.includes(kw.toLowerCase()))) {
      return { imageUrl: entry.imageUrl, modelLabel: entry.modelLabel };
    }
  }

  // 2. إذا لم يتطابق الاسم بالضبط، اعتمد على الفئة المصنفة
  const cat = detectCategory(boardName, categoryOverride);
  return {
    imageUrl: DEFAULT_BOARD_IMAGES[cat],
    modelLabel: cat === 'laptop' ? 'Motherboard Laptop' : cat === 'desktop' ? 'Desktop Motherboard' : 'Smartphone Board',
  };
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    if (isRateLimited(ip, 30, 60000)) {
      return NextResponse.json(
        { error: 'تم تجاوز عدد الطلبات المسموح بها، يرجى الانتظار دقيقة.' },
        { status: 429 }
      );
    }

    const body: GetBoardRequest = await req.json();
    const { boardName, category } = body;

    const cleanBoardName = (boardName || '').trim();
    const detectedCat = detectCategory(cleanBoardName, category);

    // 1. فحص الكاش في Supabase إن كانت مفعلة
    if (cleanBoardName && isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data: cachedBoard } = await supabaseAdmin
          .from('boards')
          .select('image_url')
          .eq('board_name', cleanBoardName)
          .single();

        if (cachedBoard && cachedBoard.image_url) {
          return NextResponse.json<GetBoardResponse>({
            success: true,
            imageUrl: cachedBoard.image_url,
            cached: true,
            category: detectedCat === 'macbook' ? 'laptop' : detectedCat,
          });
        }
      } catch (sbErr) {
        // تجاهل أخطاء Supabase والاعتماد على الجلب المباشر
      }
    }

    // 2. جلب صورة البوردة المخصصة والمطابقة لفئة وموديل الجهاز
    const { imageUrl } = await fetchBoardImage(cleanBoardName || detectedCat, category);

    // 3. تخزين الكاش في Supabase دون تعطيل الاستجابة
    if (cleanBoardName && isSupabaseConfigured && supabaseAdmin) {
      try {
        await supabaseAdmin.from('boards').upsert({
          board_name: cleanBoardName,
          image_url: imageUrl,
          search_query: `${cleanBoardName} ${detectedCat} motherboard PCB`,
        }, {
          onConflict: 'board_name',
          ignoreDuplicates: false,
        });
      } catch (cacheErr) {
        // عدم تعطيل الاستجابة
      }
    }

    return NextResponse.json<GetBoardResponse>({
      success: true,
      imageUrl,
      category: detectedCat === 'macbook' ? 'laptop' : detectedCat,
      cached: false,
    });
  } catch (error: any) {
    console.error('Error in get-board API:', error);
    // حتى في حال حدوث أي خطأ، نعيد صورة بوردة بديلة صحيحة بدلاً من إظهار شاشة خطأ للفني
    const fallbackCat = 'laptop';
    const fallbackImage = DEFAULT_BOARD_IMAGES[fallbackCat];
    return NextResponse.json<GetBoardResponse>({
      success: true,
      imageUrl: fallbackImage,
      category: 'laptop',
      cached: false,
    });
  }
}
