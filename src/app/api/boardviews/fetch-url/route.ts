import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'الرابط مطلوب' }, { status: 400 });
    }

    // التحقق من صحة الرابط
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'رابط URL غير صالح' }, { status: 400 });
    }

    // تحميل الملف من URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Dahab-Device-Doctor/1.0',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `فشل تحميل الملف: ${response.status} ${response.statusText}` },
        { status: 400 }
      );
    }

    const content = await response.text();
    const fileName = url.split('/').pop() || 'downloaded_board';

    // تحليل المحتوى بناءً على الامتداد
    let boardData: any = null;

    if (fileName.endsWith('.json')) {
      try {
        boardData = JSON.parse(content);
      } catch {
        return NextResponse.json({ error: 'ملف JSON غير صالح' }, { status: 400 });
      }
    } else {
      // معالجة ملفات نصية أخرى (.brd, .bvr, .cad)
      const lines = content.split('\n');
      const parts: any[] = [];
      const nets: Record<string, any> = {
        net_gnd: {
          id: 'net_gnd',
          name: 'GND',
          voltage: '0V',
          diodeMode: '0.000V',
          color: '#64748b',
          description: 'أرضي عام',
          isGround: true,
        },
        net_vdd_main: {
          id: 'net_vdd_main',
          name: 'VDD_MAIN',
          voltage: '3.8V',
          diodeMode: '0.395V',
          color: '#f59e0b',
          description: 'تغذية رئيسية',
          isPower: true,
        },
      };

      let xOffset = 30;
      let yOffset = 40;

      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const tokens = trimmed.split(/\s+/);

        if (tokens[0].toUpperCase() === 'PART' || tokens[0].toUpperCase() === 'COMP') {
          const partName = tokens[1] || `U_${idx}`;
          parts.push({
            id: partName,
            name: partName,
            packageType: 'BGA',
            side: 'TOP',
            x: xOffset,
            y: yOffset,
            width: 16,
            height: 16,
            rotation: 0,
            role: `مكون من ${fileName}`,
            commonFault: 'غير محدد',
            pins: [],
          });
          xOffset += 24;
          if (xOffset > 180) {
            xOffset = 30;
            yOffset += 24;
          }
        }
      });

      boardData = {
        id: `url_board_${Date.now()}`,
        title: `ملف من URL: ${fileName}`,
        deviceModel: fileName.replace(/\.[^/.]+$/, ''),
        width: 220,
        height: 200,
        layersCount: 6,
        nets,
        parts,
      };
    }

    return NextResponse.json({ boardData });
  } catch (error: any) {
    console.error('URL upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'فشل في معالجة رفع الملف من URL' },
      { status: 500 }
    );
  }
}
