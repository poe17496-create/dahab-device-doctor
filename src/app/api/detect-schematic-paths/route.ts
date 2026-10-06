import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

/**
 * API Endpoint: AI Path Detection from Schematics
 * استخدام الذكاء الاصطناعي للكشف عن المسارات من المخططات الهندسية
 */

interface DetectSchematicPathsRequest {
  schematicUrl: string;
  boardImageUrl?: string;
  netName?: string;
}

interface DetectedPath {
  netName: string;
  points: Array<{ x: number; y: number }>;
  confidence: number;
  description?: string;
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
    const body: DetectSchematicPathsRequest = await req.json();
    const { schematicUrl, boardImageUrl, netName } = body;

    if (!schematicUrl) {
      return NextResponse.json(
        { success: false, error: 'Schematic URL is required' },
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
        const result = await detectWithGemini(schematicUrl, geminiKey, boardImageUrl, netName);
        return NextResponse.json(result);
      } catch (error: any) {
        console.error('Gemini error:', error.message);
      }
    }

    // Try OpenRouter next
    if (openrouterKey) {
      try {
        const result = await detectWithOpenRouter(schematicUrl, openrouterKey, boardImageUrl, netName);
        return NextResponse.json(result);
      } catch (error: any) {
        console.error('OpenRouter error:', error.message);
      }
    }

    // Try OpenAI as fallback
    if (openaiKey) {
      try {
        const result = await detectWithOpenAI(schematicUrl, openaiKey, boardImageUrl, netName);
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
    console.error('Error in detect-schematic-paths API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to detect schematic paths' },
      { status: 500 }
    );
  }
}

async function detectWithGemini(
  schematicUrl: string,
  apiKey: string,
  boardImageUrl?: string,
  netName?: string
) {
  const genAI = new GoogleGenerativeAI(apiKey);

  // Fetch schematic image
  const schematicResponse = await fetch(schematicUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });
  if (!schematicResponse.ok) {
    throw new Error(`Failed to fetch schematic: ${schematicResponse.status}`);
  }
  const schematicBuffer = await schematicResponse.arrayBuffer();
  const base64Schematic = Buffer.from(schematicBuffer).toString('base64');

  const prompt = netName
    ? `Analyze this electronic schematic diagram and trace the path for the net "${netName}". Provide:
1. The net name
2. A list of points (x, y coordinates as percentages 0-100) that trace the path
3. Confidence level (0-1)
4. Brief description of the path

Return ONLY valid JSON with this structure:
{
  "detectedPaths": [
    {
      "netName": "net name",
      "points": [{"x": 10, "y": 20}, {"x": 30, "y": 25}],
      "confidence": 0.9,
      "description": "description"
    }
  ]
}`
    : `Analyze this electronic schematic diagram and identify all major power and signal paths. For each path, provide:
1. Net name (e.g., VCC_MAIN, GND, DATA_BUS)
2. A list of points (x, y coordinates as percentages 0-100) that trace the path
3. Confidence level (0-1)
4. Brief description

Focus on identifying at least 5-10 major paths. Return ONLY valid JSON with this structure:
{
  "detectedPaths": [
    {
      "netName": "net name",
      "points": [{"x": 10, "y": 20}, {"x": 30, "y": 25}],
      "confidence": 0.9,
      "description": "description"
    }
  ]
}`;

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent([
    prompt,
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
    detectedPaths: parsed.detectedPaths || [],
  };
}

async function detectWithOpenRouter(
  schematicUrl: string,
  apiKey: string,
  boardImageUrl?: string,
  netName?: string
) {
  const client = new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://dahab-device-doctor.vercel.app',
      'X-Title': 'Dahab Device Doctor',
    },
  });

  const prompt = netName
    ? `Analyze this electronic schematic diagram and trace the path for the net "${netName}". Provide:
1. The net name
2. A list of points (x, y coordinates as percentages 0-100) that trace the path
3. Confidence level (0-1)
4. Brief description of the path

Return ONLY valid JSON with this structure:
{
  "detectedPaths": [
    {
      "netName": "net name",
      "points": [{"x": 10, "y": 20}, {"x": 30, "y": 25}],
      "confidence": 0.9,
      "description": "description"
    }
  ]
}`
    : `Analyze this electronic schematic diagram and identify all major power and signal paths. For each path, provide:
1. Net name (e.g., VCC_MAIN, GND, DATA_BUS)
2. A list of points (x, y coordinates as percentages 0-100) that trace the path
3. Confidence level (0-1)
4. Brief description

Focus on identifying at least 5-10 major paths. Return ONLY valid JSON with this structure:
{
  "detectedPaths": [
    {
      "netName": "net name",
      "points": [{"x": 10, "y": 20}, {"x": 30, "y": 25}],
      "confidence": 0.9,
      "description": "description"
    }
  ]
}`;

  const response = await client.chat.completions.create({
    model: 'google/gemini-flash-1.5-8b',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
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
    detectedPaths: parsed.detectedPaths || [],
  };
}

async function detectWithOpenAI(
  schematicUrl: string,
  apiKey: string,
  boardImageUrl?: string,
  netName?: string
) {
  const client = new OpenAI({ apiKey });

  const prompt = netName
    ? `Analyze this electronic schematic diagram and trace the path for the net "${netName}". Provide:
1. The net name
2. A list of points (x, y coordinates as percentages 0-100) that trace the path
3. Confidence level (0-1)
4. Brief description of the path

Return ONLY valid JSON with this structure:
{
  "detectedPaths": [
    {
      "netName": "net name",
      "points": [{"x": 10, "y": 20}, {"x": 30, "y": 25}],
      "confidence": 0.9,
      "description": "description"
    }
  ]
}`
    : `Analyze this electronic schematic diagram and identify all major power and signal paths. For each path, provide:
1. Net name (e.g., VCC_MAIN, GND, DATA_BUS)
2. A list of points (x, y coordinates as percentages 0-100) that trace the path
3. Confidence level (0-1)
4. Brief description

Focus on identifying at least 5-10 major paths. Return ONLY valid JSON with this structure:
{
  "detectedPaths": [
    {
      "netName": "net name",
      "points": [{"x": 10, "y": 20}, {"x": 30, "y": 25}],
      "confidence": 0.9,
      "description": "description"
    }
  ]
}`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
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
    detectedPaths: parsed.detectedPaths || [],
  };
}

function parseAIResponse(content: string): { detectedPaths?: DetectedPath[] } {
  try {
    // Try direct JSON parse
    return JSON.parse(content);
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch {
        console.error('Failed to parse extracted JSON');
      }
    }
    return { detectedPaths: [] };
  }
}
