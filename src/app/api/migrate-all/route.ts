import { NextResponse } from 'next/server';
import { migrateAll } from '@/lib/migrateData';

export async function POST() {
  try {
    const results = await migrateAll();
    return NextResponse.json({
      message: 'Migration completed',
      results,
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: error.message || 'Migration failed' },
      { status: 500 }
    );
  }
}
