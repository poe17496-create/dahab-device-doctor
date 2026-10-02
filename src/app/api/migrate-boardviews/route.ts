import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import {
  buildIphone15ProMaxBoard,
  buildIphone14ProMaxBoard,
  buildIphone15ProBoard,
  buildIphone13ProBoard,
  buildIphone12ProBoard,
  buildIphone11ProMaxBoard,
  buildSamsungS24UltraBoard,
} from '@/lib/boardviewPresets';

export async function POST() {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const boardviews = [
    buildIphone15ProMaxBoard(),
    buildIphone14ProMaxBoard(),
    buildIphone15ProBoard(),
    buildIphone13ProBoard(),
    buildIphone12ProBoard(),
    buildIphone11ProMaxBoard(),
    // buildSamsungS24UltraBoard(), // Uncomment if needed
  ];

  const results = {
    total: boardviews.length,
    successful: 0,
    failed: 0,
    errors: [] as string[],
  };

  // Get admin user ID (default admin)
  const adminId = 'user_admin';

  for (const boardview of boardviews) {
    try {
      const { error } = await supabaseAdmin.from('boardviews').insert({
        id: boardview.id,
        user_id: adminId,
        device_name: boardview.title,
        model: boardview.deviceModel,
        brand: 'Apple',
        category: 'Smartphone',
        description: `مخطط دائرة كهربائية تفصيلي لـ ${boardview.deviceModel}`,
        specifications: {
          width: boardview.width,
          height: boardview.height,
          layersCount: boardview.layersCount,
          nets: boardview.nets,
          parts: boardview.parts,
          outlinePoints: boardview.outlinePoints,
        },
      });

      if (error) {
        results.failed++;
        results.errors.push(`${boardview.id}: ${error.message}`);
      } else {
        results.successful++;
      }
    } catch (err: any) {
      results.failed++;
      results.errors.push(`${boardview.id}: ${err.message}`);
    }
  }

  return NextResponse.json({
    message: 'Migration completed',
    results,
  });
}
