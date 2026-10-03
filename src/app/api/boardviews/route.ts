import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { getAllBoardviews } from '@/lib/dataServices';
import { BoardData } from '@/components/InteractiveBoardviewSimulator';

export const dynamic = 'force-dynamic';

// 1. GET: جلب جميع البوردات من Supabase أو local fallback
export async function GET() {
  try {
    const boards = await getAllBoardviews();

    return NextResponse.json({ boards, total: boards.length, source: 'supabase-or-fallback' });
  } catch (err: any) {
    return NextResponse.json({ error: 'فشل في جلب البوردات', details: err?.message }, { status: 500 });
  }
}

// 2. POST: رفع وحفظ بوردفيو جديدة في Supabase
export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const body = await req.json();
    const { title, deviceModel, category, boardData, rawContent, fileName } = body;

    if (!title && !deviceModel) {
      return NextResponse.json({ error: 'اسم البوردة أو الموديل مطلوب' }, { status: 400 });
    }

    let finalBoardData: BoardData;

    if (boardData && boardData.parts && boardData.nets) {
      finalBoardData = {
        ...boardData,
        id: boardData.id || `custom_board_${Date.now()}`,
        title: title || boardData.title || deviceModel,
        deviceModel: deviceModel || boardData.deviceModel || title,
      };
    } else if (rawContent) {
      // تفكيك وتحليل ملف BRD أو FZ أو JSON
      try {
        const parsed = JSON.parse(rawContent);
        if (parsed.parts && parsed.nets) {
          finalBoardData = {
            ...parsed,
            id: parsed.id || `custom_board_${Date.now()}`,
            title: title || parsed.title || deviceModel,
            deviceModel: deviceModel || parsed.deviceModel || title,
          };
        } else {
          throw new Error('Not board json');
        }
      } catch (e) {
        // قراءة BRD / FZ نصي
        const lines: string[] = rawContent.split('\n');
        const customParts: any[] = [];
        const customNets: Record<string, any> = {
          net_gnd: { id: 'net_gnd', name: 'GND (أرضي)', voltage: '0.00V', diodeMode: '0.000V', color: '#64748b', isGround: true, description: 'أرضي الشاسيه' },
          net_main: { id: 'net_main', name: 'MAIN_POWER', voltage: '3.8V - 19V', diodeMode: '0.420V', color: '#f59e0b', isPower: true, description: 'خط التغذية الرئيسي' },
        };

        let currentPart: any = null;
        let xOffset = 30;
        let yOffset = 40;

        lines.forEach((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return;
          const tokens = trimmed.split(/\s+/);
          const cmd = tokens[0].toUpperCase();

          if (cmd === 'PART' || cmd === 'COMP' || cmd === 'PACKAGE') {
            const partName = tokens[1] || `U_${idx}`;
            currentPart = {
              id: partName,
              name: partName,
              packageType: 'BGA',
              side: 'TOP',
              x: xOffset,
              y: yOffset,
              width: 16,
              height: 16,
              rotation: 0,
              role: `مكون تم استيراده من ${fileName || 'الملف'}`,
              commonFault: 'غير محدد في الملف',
              pins: [],
            };
            customParts.push(currentPart);
            xOffset += 24;
            if (xOffset > 180) {
              xOffset = 30;
              yOffset += 24;
            }
          } else if ((cmd === 'PIN' || cmd === 'PAD') && currentPart) {
            const pinNum = tokens[1] || `${currentPart.pins.length + 1}`;
            currentPart.pins.push({
              id: `${currentPart.id}_${pinNum}`,
              partId: currentPart.id,
              pinNumber: pinNum,
              netId: idx % 2 === 0 ? 'net_main' : 'net_gnd',
              x: (currentPart.pins.length % 4 - 1.5) * 2,
              y: (Math.floor(currentPart.pins.length / 4) - 1.5) * 2,
              radius: 0.7,
              diodeValue: '0.420V',
            });
          }
        });

        finalBoardData = {
          id: `custom_board_${Date.now()}`,
          title: title || fileName || deviceModel,
          deviceModel: deviceModel || title || 'جهاز مخصص',
          width: 220,
          height: 200,
          layersCount: 6,
          nets: customNets,
          parts: customParts.length > 0 ? customParts : [
            {
              id: 'U100_MAIN',
              name: 'Main Controller (U100)',
              packageType: 'BGA',
              side: 'TOP',
              x: 100,
              y: 90,
              width: 26,
              height: 26,
              rotation: 0,
              role: 'المتحكم الرئيسي للبوردة المستوردة',
              commonFault: 'عطل تشغيل عام',
              pins: [
                { id: 'p1', partId: 'U100_MAIN', pinNumber: '1', netId: 'net_main', x: -5, y: -5, radius: 0.9, diodeValue: '0.420V', isPin1: true },
                { id: 'p2', partId: 'U100_MAIN', pinNumber: '2', netId: 'net_gnd', x: 5, y: 5, radius: 0.9, diodeValue: '0.000V' },
              ],
            },
          ],
        };
      }
    } else {
      return NextResponse.json({ error: 'محتوى البوردة غير متوفر' }, { status: 400 });
    }

    // الحفظ في Supabase أو محلياً
    if (isSupabaseConfigured && supabaseAdmin) {
      const { error } = await supabaseAdmin.from('boardviews').insert([
        {
          id: finalBoardData.id,
          user_id: null, // يمكن إضافة user_id لاحقاً
          device_name: finalBoardData.title,
          model: finalBoardData.deviceModel,
          brand: category || 'custom',
          category: category || 'mobile',
          description: finalBoardData.title,
          specifications: finalBoardData,
        },
      ]);

      if (error) {
        console.error('Error saving boardview to Supabase:', error);
        // Cannot use localStorage in server-side API route
        return NextResponse.json({
          success: false,
          message: 'فشل في حفظ البوردة في Supabase',
          board: finalBoardData,
          savedLocally: false,
          error: error.message,
        }, { status: 500 });
      }
    } else {
      // Supabase not configured - cannot save to localStorage in server-side route
      return NextResponse.json({
        success: false,
        message: 'Supabase غير مُهيأ - لا يمكن حفظ البوردة بدون تكوين قاعدة البيانات',
        board: finalBoardData,
        savedLocally: false,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'تم حفظ البوردة بنجاح في Supabase! ✓',
      board: finalBoardData,
    });
  } catch (err: any) {
    console.error('Boardview Save Error:', err);
    return NextResponse.json({ error: 'فشل في حفظ البوردفيو', details: err?.message }, { status: 500 });
  }
}

// 3. DELETE: حذف بوردفيو من Supabase
export async function DELETE(req: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'معرف البوردة مطلوب' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('boardviews').delete().eq('id', id);

    if (error) {
      console.error('Error deleting boardview:', error);
      return NextResponse.json({ error: 'فشل في حذف البوردة' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'تم حذف البوردة بنجاح' });
  } catch (err: any) {
    return NextResponse.json({ error: 'فشل في حذف البوردة' }, { status: 500 });
  }
}
