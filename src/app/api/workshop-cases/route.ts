import { NextRequest, NextResponse } from 'next/server';
import {
  loadWorkshopCases,
  addWorkshopCase,
  voteWorkshopCase,
  searchWorkshopCases,
} from '@/lib/workshopCases';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') as any;
    const model = searchParams.get('model') || undefined;

    if (query || model) {
      const results = searchWorkshopCases(query, category, model);
      return NextResponse.json({ success: true, cases: results });
    }

    const allCases = loadWorkshopCases();
    const filtered = category
      ? allCases.filter((c) => c.category === category)
      : allCases;

    return NextResponse.json({ success: true, cases: filtered });
  } catch (error: any) {
    console.error('API /api/workshop-cases GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load cases' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'vote') {
      const { caseId, isSuccess } = body;
      if (!caseId) {
        return NextResponse.json({ success: false, error: 'Missing caseId' }, { status: 400 });
      }
      const updated = voteWorkshopCase(caseId, !!isSuccess);
      if (!updated) {
        return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, case: updated });
    }

    if (action === 'add' || !action) {
      const { model, boardCode, category, symptom, measurements, rootCause, solution, technicianName } = body;
      if (!model || !symptom || !solution) {
        return NextResponse.json({ success: false, error: 'Missing required fields (model, symptom, solution)' }, { status: 400 });
      }

      const newCase = addWorkshopCase({
        model,
        boardCode,
        category: category || 'mobile',
        symptom,
        measurements,
        rootCause: rootCause || 'عطل عتادي دقيق',
        solution,
        technicianName,
      });

      return NextResponse.json({ success: true, case: newCase });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('API /api/workshop-cases POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process case' }, { status: 500 });
  }
}
