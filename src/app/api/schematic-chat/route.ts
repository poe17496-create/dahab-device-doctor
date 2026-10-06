import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { isRateLimited } from '@/lib/rateLimit';
import { getGuestRemainingTrials } from '@/lib/guestUsage';

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
    isBoardImage?: boolean;
  };
  isGuest?: boolean;
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
    // Rate limiting check
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    if (isRateLimited(ip, 20, 60000)) {
      return NextResponse.json(
        { error: "تم تجاوز عدد الطلبات المسموح بها، يرجى الانتظار دقيقة." },
        { status: 429 }
      );
    }

    const body: SchematicChatRequest = await req.json();
    const { schematicUrl, question, context, isGuest } = body;

    // 🛡️ التحقق من حالة الزائر وعدد التجارب المتبقية
    if (isGuest === true) {
      const remaining = getGuestRemainingTrials();
      if (remaining <= 0) {
        return NextResponse.json(
          { success: false, error: '⚠️ انتهت تجاربك المجانية اليومية (5 من 5).\n\nللحصول على وصول غير محدود للتشخيص ومحاكي البورد فيو والمساعد، سجّل الدخول بحساب فني معتمد أو تواصل مع المطور م. إسلام دهب على واتساب: 01064147224' },
          { status: 403 }
        );
      }
    }

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

    // Log key availability
    console.log('Schematic chat keys:', {
      gemini: !!geminiKey,
      openrouter: !!openrouterKey,
      openai: !!openaiKey,
    });

    // If no keys available, return clear error
    if (!geminiKey && !openrouterKey && !openaiKey) {
      console.error('No AI keys available for schematic chat');
      return NextResponse.json(
        { 
          success: false, 
          error: 'خدمة الشات الذكي غير متاحة حالياً. يرجى الاتصال بالإدارة لتفعيل مفاتيح الذكاء الاصطناعي.' 
        },
        { status: 503 } // Service Unavailable
      );
    }

    // Try Gemini first
    if (geminiKey) {
      try {
        const result = await chatWithGemini(
          schematicUrl, 
          question, 
          context, 
          geminiKey
        );
        return NextResponse.json(result);
      } catch (error: any) {
        console.error('Gemini error:', error.message);
      }
    }

    // Try OpenRouter next
    if (openrouterKey) {
      try {
        const result = await chatWithOpenRouter(
          schematicUrl, 
          question, 
          context, 
          openrouterKey
        );
        return NextResponse.json(result);
      } catch (error: any) {
        console.error('OpenRouter error:', error.message);
      }
    }

    // Try OpenAI as fallback
    if (openaiKey) {
      try {
        const result = await chatWithOpenAI(
          schematicUrl, 
          question, 
          context, 
          openaiKey
        );
        return NextResponse.json(result);
      } catch (error: any) {
        console.error('OpenAI error:', error.message);
      }
    }

    return NextResponse.json(
      { success: false, error: 'فشلت جميع محركات الذكاء الاصطناعي. يرجى المحاولة مرة أخرى لاحقاً.' },
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

  const isBoardImage = context?.isBoardImage;
  const imageType = isBoardImage ? 'PCB board image' : 'electronic schematic diagram';
  const analystType = isBoardImage ? 'board analyst' : 'schematic analyst';

  const prompt = `You are an expert electronics repair technician and ${analystType}. Analyze this ${imageType} and answer the technician's question accurately.

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
  "answer": "detailed answer in Arabic only",
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
}

NOTE: Provide ALL answers in Arabic language only, not English.`;

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

  const isBoardImage = context?.isBoardImage;
  const imageType = isBoardImage ? 'PCB board image' : 'electronic schematic diagram';
  const analystType = isBoardImage ? 'board analyst' : 'schematic analyst';

  const prompt = `You are an expert electronics repair technician and ${analystType}. Analyze this ${imageType} and answer the technician's question accurately.

${contextPrompt}

Question: ${question}

Provide a detailed, accurate answer. Include component information, related nets, voltage levels, and troubleshooting tips.

IMPORTANT: Return ONLY valid JSON with this structure:
{
  "answer": "detailed answer in Arabic only",
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
}

NOTE: Provide ALL answers in Arabic language only, not English.`;

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

  const isBoardImage = context?.isBoardImage;
  const imageType = isBoardImage ? 'PCB board image' : 'electronic schematic diagram';
  const analystType = isBoardImage ? 'board analyst' : 'schematic analyst';

  const prompt = `You are an expert electronics repair technician and ${analystType}. Analyze this ${imageType} and answer the technician's question accurately.

${contextPrompt}

Question: ${question}

Provide a detailed, accurate answer. Include component information, related nets, voltage levels, and troubleshooting tips.

IMPORTANT: Return ONLY valid JSON with this structure:
{
  "answer": "detailed answer in Arabic only",
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
}

NOTE: Provide ALL answers in Arabic language only, not English.`;

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
