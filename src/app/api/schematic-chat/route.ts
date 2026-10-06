import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

/**
 * API Endpoint: Schematic AI Chat
 * شات ذكاء اصطناعي متخصص في المخططات الهندسية
 * يسمح للفنيين بالسؤال عن نقاط محددة في المخطط والحصول على إجابات دقيقة
 */

interface SchematicChatRequest {
  schematicUrl: string;
  question: string;
  context?: {
    boardName?: string;
    deviceModel?: string;
    componentLocation?: { x: number; y: number };
    previousQuestions?: Array<{ question: string; answer: string }>;
  };
}

interface SchematicChatResponse {
  success: boolean;
  answer: string;
  highlightedComponents?: Array<{
    name: string;
    location: { x: number; y: number };
    description: string;
  }>;
  relatedNets?: Array<{
    name: string;
    description: string;
    voltage?: number;
  }>;
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: SchematicChatRequest = await req.json();
    const { schematicUrl, question, context } = body;

    if (!schematicUrl || !question) {
      return NextResponse.json(
        { success: false, error: 'Schematic URL and question are required' },
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
        const result = await chatWithGemini(schematicUrl, question, context, geminiKey);
        return NextResponse.json(result);
      } catch (error: any) {
        console.error('Gemini error:', error.message);
      }
    }

    // Try OpenRouter next
    if (openrouterKey) {
      try {
        const result = await chatWithOpenRouter(schematicUrl, question, context, openrouterKey);
        return NextResponse.json(result);
      } catch (error: any) {
        console.error('OpenRouter error:', error.message);
      }
    }

    // Try OpenAI as fallback
    if (openaiKey) {
      try {
        const result = await chatWithOpenAI(schematicUrl, question, context, openaiKey);
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
    console.error('Error in schematic-chat API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process schematic chat' },
      { status: 500 }
    );
  }
}

async function chatWithGemini(
  schematicUrl: string,
  question: string,
  context: any,
  apiKey: string
): Promise<SchematicChatResponse> {
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

  // Build context-aware prompt
  let contextPrompt = '';
  if (context?.boardName) {
    contextPrompt += `Board: ${context.boardName}\n`;
  }
  if (context?.deviceModel) {
    contextPrompt += `Device Model: ${context.deviceModel}\n`;
  }
  if (context?.componentLocation) {
    contextPrompt += `Point of Interest: X=${context.componentLocation.x}%, Y=${context.componentLocation.y}%\n`;
  }
  if (context?.previousQuestions && context.previousQuestions.length > 0) {
    contextPrompt += '\nPrevious conversation:\n';
    context.previousQuestions.forEach((q: any, i: number) => {
      contextPrompt += `Q${i + 1}: ${q.question}\nA${i + 1}: ${q.answer}\n`;
    });
  }

  const prompt = `You are an expert electronics repair technician and schematic analyst. Analyze this electronic schematic diagram and answer the technician's question accurately.

${contextPrompt}

Question: ${question}

Provide a detailed, accurate answer. Include:
1. Direct answer to the question
2. Any relevant component information (names, locations, functions)
3. Related nets or signal paths
4. Voltage levels if applicable
5. Troubleshooting tips if relevant

If the question asks about a specific location, describe what components are at that location.

IMPORTANT: Return ONLY valid JSON with this structure:
{
  "answer": "detailed answer in Arabic and English",
  "highlightedComponents": [
    {
      "name": "component name",
      "location": {"x": 50, "y": 50},
      "description": "component description"
    }
  ],
  "relatedNets": [
    {
      "name": "net name",
      "description": "net description",
      "voltage": 3.3
    }
  ]
}`;

  const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });
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
    answer: parsed.answer || content,
    highlightedComponents: parsed.highlightedComponents || [],
    relatedNets: parsed.relatedNets || [],
  };
}

async function chatWithOpenRouter(
  schematicUrl: string,
  question: string,
  context: any,
  apiKey: string
): Promise<SchematicChatResponse> {
  const client = new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://dahab-device-doctor.vercel.app',
      'X-Title': 'Dahab Device Doctor',
    },
  });

  let contextPrompt = '';
  if (context?.boardName) {
    contextPrompt += `Board: ${context.boardName}\n`;
  }
  if (context?.deviceModel) {
    contextPrompt += `Device Model: ${context.deviceModel}\n`;
  }

  const prompt = `You are an expert electronics repair technician and schematic analyst. Analyze this electronic schematic diagram and answer the technician's question accurately.

${contextPrompt}

Question: ${question}

Provide a detailed, accurate answer. Include component information, related nets, voltage levels, and troubleshooting tips.

IMPORTANT: Return ONLY valid JSON with this structure:
{
  "answer": "detailed answer in Arabic and English",
  "highlightedComponents": [
    {
      "name": "component name",
      "location": {"x": 50, "y": 50},
      "description": "component description"
    }
  ],
  "relatedNets": [
    {
      "name": "net name",
      "description": "net description",
      "voltage": 3.3
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
    max_tokens: 1500,
  });

  const content = response.choices[0].message.content;
  const parsed = parseAIResponse(content || '');

  return {
    success: true,
    answer: parsed.answer || content,
    highlightedComponents: parsed.highlightedComponents || [],
    relatedNets: parsed.relatedNets || [],
  };
}

async function chatWithOpenAI(
  schematicUrl: string,
  question: string,
  context: any,
  apiKey: string
): Promise<SchematicChatResponse> {
  const client = new OpenAI({ apiKey });

  let contextPrompt = '';
  if (context?.boardName) {
    contextPrompt += `Board: ${context.boardName}\n`;
  }
  if (context?.deviceModel) {
    contextPrompt += `Device Model: ${context.deviceModel}\n`;
  }

  const prompt = `You are an expert electronics repair technician and schematic analyst. Analyze this electronic schematic diagram and answer the technician's question accurately.

${contextPrompt}

Question: ${question}

Provide a detailed, accurate answer. Include component information, related nets, voltage levels, and troubleshooting tips.

IMPORTANT: Return ONLY valid JSON with this structure:
{
  "answer": "detailed answer in Arabic and English",
  "highlightedComponents": [
    {
      "name": "component name",
      "location": {"x": 50, "y": 50},
      "description": "component description"
    }
  ],
  "relatedNets": [
    {
      "name": "net name",
      "description": "net description",
      "voltage": 3.3
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
    max_tokens: 1500,
  });

  const content = response.choices[0].message.content;
  const parsed = parseAIResponse(content || '');

  return {
    success: true,
    answer: parsed.answer || content,
    highlightedComponents: parsed.highlightedComponents || [],
    relatedNets: parsed.relatedNets || [],
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
    return { answer: content, highlightedComponents: [], relatedNets: [] };
  }
}
