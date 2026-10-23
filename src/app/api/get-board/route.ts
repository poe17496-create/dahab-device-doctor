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

// صور بوردات أصلية عالية الدقة مخصصة وموزعة هندسياً حسب الفئة الفعلية
const DEFAULT_BOARD_IMAGES = {
  macbook: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1600&q=80',
  laptop: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80',
  desktop: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=1600&q=80',
  mobile: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1600&q=80',
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
 * جلب صورة مخصصة عالية الدقة للبوردة
 */
async function fetchBoardImage(boardName: string, categoryOverride?: string): Promise<string> {
  const cat = detectCategory(boardName, categoryOverride);
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (accessKey) {
    try {
      const query =
        cat === 'laptop'
          ? `${boardName} laptop motherboard PCB computer circuits`
          : cat === 'desktop'
          ? `${boardName} PC motherboard computer hardware`
          : cat === 'macbook'
          ? `Apple MacBook logic board PCB internal`
          : `${boardName} smartphone motherboard logic board PCB`;

      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
      const response = await fetch(url, {
        headers: { Authorization: `Client-ID ${accessKey}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          return data.results[0].urls.regular || data.results[0].urls.full;
        }
      }
    } catch (e) {
      console.warn('Unsplash fetch failed, falling back to curated authentic image');
    }
  }

  // استخدام الصورة الأصلية عالية الدقة المخصصة لفئة الجهاز
  return DEFAULT_BOARD_IMAGES[cat];
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
    const imageUrl = await fetchBoardImage(cleanBoardName || detectedCat, category);

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
