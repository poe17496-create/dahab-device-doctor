import { NextRequest, NextResponse } from 'next/server';
import { BoardData } from '@/components/InteractiveBoardview';

export const dynamic = 'force-dynamic';

// Mock database of boardview data
const mockBoardDatabase: Record<string, BoardData> = {
  'iphone_13_pro': {
    id: 'iphone_13_pro_mainboard',
    title: 'iPhone 13 Pro Mainboard',
    deviceModel: 'iPhone 13 Pro (A2639)',
    width: 3000,
    height: 1500,
    components: [
      {
        id: 'U1000',
        name: 'U1000',
        x: 500,
        y: 300,
        width: 200,
        height: 200,
        type: 'IC',
        rotation: 0,
        pins: [
          { id: 'U1000_A1', x: 510, y: 310, net: 'PP_VDD_MAIN', type: 'pad', label: 'A1' },
          { id: 'U1000_A2', x: 510, y: 330, net: 'PP_VDD_MAIN', type: 'pad', label: 'A2' },
          { id: 'U1000_B1', x: 530, y: 310, net: 'PP_VDD_CPU', type: 'pad', label: 'B1' },
          { id: 'U1000_B2', x: 530, y: 330, net: 'GND', type: 'pad', label: 'B2' },
          { id: 'U1000_C1', x: 550, y: 310, net: 'PP_VDD_GPU', type: 'pad', label: 'C1' },
          { id: 'U1000_C2', x: 550, y: 330, net: 'PP_1V8_SDRAM', type: 'pad', label: 'C2' },
        ],
      },
      {
        id: 'U2000',
        name: 'U2000',
        x: 800,
        y: 300,
        width: 150,
        height: 150,
        type: 'IC',
        rotation: 0,
        pins: [
          { id: 'U2000_1', x: 810, y: 310, net: 'PP_VDD_MAIN', type: 'pad', label: '1' },
          { id: 'U2000_2', x: 810, y: 330, net: 'PP_3V3_CAM', type: 'pad', label: '2' },
          { id: 'U2000_3', x: 830, y: 310, net: 'GND', type: 'pad', label: '3' },
        ],
      },
      {
        id: 'C1000',
        name: 'C1000',
        x: 400,
        y: 600,
        width: 40,
        height: 40,
        type: 'capacitor',
        pins: [
          { id: 'C1000_1', x: 410, y: 610, net: 'PP_VDD_MAIN', type: 'pad' },
          { id: 'C1000_2', x: 430, y: 610, net: 'GND', type: 'pad' },
        ],
      },
      {
        id: 'C1001',
        name: 'C1001',
        x: 450,
        y: 600,
        width: 40,
        height: 40,
        type: 'capacitor',
        pins: [
          { id: 'C1001_1', x: 460, y: 610, net: 'PP_VDD_CPU', type: 'pad' },
          { id: 'C1001_2', x: 480, y: 610, net: 'GND', type: 'pad' },
        ],
      },
      {
        id: 'J1',
        name: 'Battery Connector',
        x: 200,
        y: 700,
        width: 100,
        height: 80,
        type: 'connector',
        pins: [
          { id: 'J1_1', x: 210, y: 710, net: 'PP_BATT_VCC', type: 'pad', label: 'VBAT' },
          { id: 'J1_2', x: 230, y: 710, net: 'GND', type: 'pad', label: 'GND' },
          { id: 'J1_3', x: 250, y: 710, net: 'PP_BATT_TEMP', type: 'pad', label: 'TEMP' },
        ],
      },
    ],
    nets: {
      'PP_VDD_MAIN': ['U1000_A1', 'U1000_A2', 'U2000_1', 'C1000_1'],
      'PP_VDD_CPU': ['U1000_B1', 'C1001_1'],
      'PP_VDD_GPU': ['U1000_C1'],
      'PP_1V8_SDRAM': ['U1000_C2'],
      'PP_3V3_CAM': ['U2000_2'],
      'GND': ['U1000_B2', 'U2000_3', 'C1000_2', 'C1001_2', 'J1_2'],
      'PP_BATT_VCC': ['J1_1'],
      'PP_BATT_TEMP': ['J1_3'],
    },
  },
  'samsung_s23': {
    id: 'samsung_s23_mainboard',
    title: 'Samsung Galaxy S23 Mainboard',
    deviceModel: 'Samsung Galaxy S23 (SM-S911B)',
    width: 3200,
    height: 1600,
    components: [
      {
        id: 'U500',
        name: 'U500',
        x: 600,
        y: 400,
        width: 250,
        height: 250,
        type: 'IC',
        rotation: 0,
        pins: [
          { id: 'U500_A1', x: 610, y: 410, net: 'VDD_MSM', type: 'pad', label: 'A1' },
          { id: 'U500_A2', x: 610, y: 430, net: 'VDD_MSM', type: 'pad', label: 'A2' },
          { id: 'U500_B1', x: 630, y: 410, net: 'VDD_CPU', type: 'pad', label: 'B1' },
          { id: 'U500_B2', x: 630, y: 430, net: 'GND', type: 'pad', label: 'B2' },
        ],
      },
      {
        id: 'C501',
        name: 'C501',
        x: 500,
        y: 700,
        width: 35,
        height: 35,
        type: 'capacitor',
        pins: [
          { id: 'C501_1', x: 510, y: 710, net: 'VDD_MSM', type: 'pad' },
          { id: 'C501_2', x: 530, y: 710, net: 'GND', type: 'pad' },
        ],
      },
    ],
    nets: {
      'VDD_MSM': ['U500_A1', 'U500_A2', 'C501_1'],
      'VDD_CPU': ['U500_B1'],
      'GND': ['U500_B2', 'C501_2'],
    },
  },
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const model = searchParams.get('model');

    if (!model) {
      return NextResponse.json(
        { error: 'Model parameter is required' },
        { status: 400 }
      );
    }

    // Normalize model name
    const normalizedModel = model.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    // Search in mock database
    const boardData = Object.values(mockBoardDatabase).find(
      (board) => board.deviceModel.toLowerCase().replace(/[^a-z0-9_]/g, '_') === normalizedModel ||
                 board.id.toLowerCase().replace(/[^a-z0-9_]/g, '_') === normalizedModel
    );

    if (boardData) {
      return NextResponse.json({ boardData });
    }

    // Try to fetch from cloud API (simulated)
    try {
      const cloudResponse = await fetch(
        `https://api.dahab-boardview-library.com/v1/boards/${encodeURIComponent(model)}`,
        {
          signal: AbortSignal.timeout(5000), // 5 second timeout
        }
      );

      if (cloudResponse.ok) {
        const cloudData = await cloudResponse.json();
        return NextResponse.json({ boardData: cloudData });
      }
    } catch (cloudError) {
      console.warn('Cloud fetch failed:', cloudError);
    }

    return NextResponse.json(
      { error: 'Boardview data not found for this model' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error fetching boardview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
