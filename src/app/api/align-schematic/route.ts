import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

/**
 * API Endpoint: AI Schematic Alignment
 * استخدام الذكاء الاصطناعي لمحاذاة المخطط مع البورد
 */

interface AlignSchematicRequest {
  boardImageUrl: string;
  schematicUrl: string;
}

interface AlignmentData {
  offsetX: number;
  offsetY: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  referencePoints?: Array<{
    board: { x: number; y: number };
    schematic: { x: number; y: number };
  }>;
}

export async function POST(req: NextRequest) {
  try {
    const body: AlignSchematicRequest = await req.json();
    const { boardImageUrl, schematicUrl } = body;

    if (!boardImageUrl || !schematicUrl) {
      return NextResponse.json(
        { success: false, error: 'Board image URL and schematic URL are required' },
        { status: 400 }
      );
    }

    // Get AI keys
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // Try Gemini first
    if (geminiKey) {
      try {
        const result = await alignWithGemini(boardImageUrl, schematicUrl, geminiKey);
        return NextResponse.json(result);
      } catch (error: any) {
        console.error('Gemini error:', error.message);
      }
    }

    // Try OpenRouter next
    if (openrouterKey) {
      try {
        const result = await alignWithOpenRouter(boardImageUrl, schematicUrl, openrouterKey);
        return NextResponse.json(result);
      } catch (error: any) {
        console.error('OpenRouter error:', error.message);
      }
    }

    // Try OpenAI as fallback
    if (openaiKey) {
      try {
        const result = await alignWithOpenAI(boardImageUrl, schematicUrl, openaiKey);
        return NextResponse.json(result);
      } catch (error: any) {
        console.error('OpenAI error:', error.message);
      }
    }

    return NextResponse.json(
      { success: false, error: 'No AI provider available' },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Error in align-schematic API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to align schematic' },
      { status: 500 }
    );
  }
}

async function alignWithGemini(
  boardImageUrl: string,
  schematicUrl: string,
  apiKey: string
) {
  const genAI = new GoogleGenerativeAI(apiKey);

  // Fetch both images
  const boardResponse = await fetch(boardImageUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });
  const boardBuffer = await boardResponse.arrayBuffer();
  const base64Board = Buffer.from(boardBuffer).toString('base64');

  const schematicResponse = await fetch(schematicUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });
  const schematicBuffer = await schematicResponse.arrayBuffer();
  const base64Schematic = Buffer.from(schematicBuffer).toString('base64');

  const prompt = `I have two images: a PCB board image and a schematic diagram. I need to align the schematic overlay on top of the board image.

Analyze both images and provide alignment parameters:
1. offsetX: Horizontal offset in percentage (-50 to 50)
2. offsetY: Vertical offset in percentage (-50 to 50)
3. scaleX: Horizontal scale factor (0.5 to 2.0)
4. scaleY: Vertical scale factor (0.5 to 2.0)
5. rotation: Rotation in degrees (-180 to 180)

Also identify 3-5 reference points that appear in both images:
- referencePoints: Array of matching points with coordinates in both images (percentage 0-100)

Return ONLY valid JSON with this structure:
{
  "alignmentData": {
    "offsetX": 0,
    "offsetY": 0,
    "scaleX": 1,
    "scaleY": 1,
    "rotation": 0,
    "referencePoints": [
      {
        "board": {"x": 50, "y": 50},
        "schematic": {"x": 50, "y": 50}
      }
    ]
  },
  "confidence": 0.9
}`;

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Board,
      },
    },
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Schematic,
      },
    },
  ]);

  const content = result.response.text();
  const parsed = parseAIResponse(content);

  return {
    success: true,
    alignmentData: parsed.alignmentData || { offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1, rotation: 0 },
    confidence: parsed.confidence || 0.5,
  };
}

async function alignWithOpenRouter(
  boardImageUrl: string,
  schematicUrl: string,
  apiKey: string
) {
  const client = new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://dahab-device-doctor.vercel.app',
      'X-Title': 'Dahab Device Doctor',
    },
  });

  const prompt = `I have two images: a PCB board image and a schematic diagram. I need to align the schematic overlay on top of the board image.

Analyze both images and provide alignment parameters:
1. offsetX: Horizontal offset in percentage (-50 to 50)
2. offsetY: Vertical offset in percentage (-50 to 50)
3. scaleX: Horizontal scale factor (0.5 to 2.0)
4. scaleY: Vertical scale factor (0.5 to 2.0)
5. rotation: Rotation in degrees (-180 to 180)

Also identify 3-5 reference points that appear in both images.

Return ONLY valid JSON with this structure:
{
  "alignmentData": {
    "offsetX": 0,
    "offsetY": 0,
    "scaleX": 1,
    "scaleY": 1,
    "rotation": 0,
    "referencePoints": [
      {
        "board": {"x": 50, "y": 50},
        "schematic": {"x": 50, "y": 50}
      }
    ]
  },
  "confidence": 0.9
}`;

  const response = await client.chat.completions.create({
    model: 'google/gemini-flash-1.5-8b',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: boardImageUrl } },
          { type: 'image_url', image_url: { url: schematicUrl } },
        ],
      },
    ],
    max_tokens: 1000,
  });

  const content = response.choices[0].message.content;
  const parsed = parseAIResponse(content || '');

  return {
    success: true,
    alignmentData: parsed.alignmentData || { offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1, rotation: 0 },
    confidence: parsed.confidence || 0.5,
  };
}

async function alignWithOpenAI(
  boardImageUrl: string,
  schematicUrl: string,
  apiKey: string
) {
  const client = new OpenAI({ apiKey });

  const prompt = `I have two images: a PCB board image and a schematic diagram. I need to align the schematic overlay on top of the board image.

Analyze both images and provide alignment parameters:
1. offsetX: Horizontal offset in percentage (-50 to 50)
2. offsetY: Vertical offset in percentage (-50 to 50)
3. scaleX: Horizontal scale factor (0.5 to 2.0)
4. scaleY: Vertical scale factor (0.5 to 2.0)
5. rotation: Rotation in degrees (-180 to 180)

Also identify 3-5 reference points that appear in both images.

Return ONLY valid JSON with this structure:
{
  "alignmentData": {
    "offsetX": 0,
    "offsetY": 0,
    "scaleX": 1,
    "scaleY": 1,
    "rotation": 0,
    "referencePoints": [
      {
        "board": {"x": 50, "y": 50},
        "schematic": {"x": 50, "y": 50}
      }
    ]
  },
  "confidence": 0.9
}`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: boardImageUrl } },
          { type: 'image_url', image_url: { url: schematicUrl } },
        ],
      },
    ],
    max_tokens: 1000,
  });

  const content = response.choices[0].message.content;
  const parsed = parseAIResponse(content || '');

  return {
    success: true,
    alignmentData: parsed.alignmentData || { offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1, rotation: 0 },
    confidence: parsed.confidence || 0.5,
  };
}

function parseAIResponse(content: string): any {
  try {
    return JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch {
        console.error('Failed to parse extracted JSON');
      }
    }
    return { alignmentData: { offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1, rotation: 0 }, confidence: 0.5 };
  }
}
