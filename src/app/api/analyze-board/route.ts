import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { isRateLimited } from '@/lib/rateLimit';

// Polyfill for Buffer in Vercel/Edge environment
if (typeof Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

/**
 * AI Board Analysis API
 *
 * Uses OpenRouter or other AI providers with vision capabilities to analyze board images
 * Can optionally use schematic diagrams to improve accuracy
 */

function generateAnalysisPrompt(schematicUrl?: string): string {
  if (schematicUrl) {
    return `Analyze this PCB board image AND the accompanying schematic diagram. Use the schematic to improve accuracy in identifying components and traces.

For each component you identify, provide:
1. Component name (e.g., U1200, C1500, R1200)
2. Component type (IC, Capacitor, Resistor, Inductor, Connector, Diode, Transistor, Other)
3. Brief description of its function
4. Confidence level (0-1)
5. Approximate position on the board as percentage (x, y coordinates from top-left, 0-100%)

Use the schematic to:
- Cross-reference component names and locations
- Identify power rails and signal paths more accurately
- Pinpoint potential faults based on schematic analysis

Additionally, identify any suspicious components or areas that might be faulty (e.g., burnt capacitors, damaged traces, corroded areas). For each suspicious area, provide:
|- ID (number starting from 1)
|- Position (x, y as percentage 0-100)
|- Label (e.g., VCC_MAIN, U1200)
|- Note (e.g., "مكثس محتمل", "تلف واضح")
|- Severity (low, medium, high)

IMPORTANT: Return ONLY valid JSON. Do not include any other text before or after the JSON.
Use this exact structure:
{
  "components": [
    {
      "name": "component name",
      "type": "component type",
      "description": "description",
      "confidence": 0.9,
      "x": 50,
      "y": 50
    }
  ],
  "suspiciousMarkers": [
    {
      "id": 1,
      "x": 35,
      "y": 40,
      "label": "VCC_MAIN",
      "note": "مكثس محتمل",
      "severity": "medium"
    }
  ],
  "detectedNets": [
    {
      "name": "PP_VDD_MAIN",
      "type": "power",
      "points": [{"x": 10, "y": 20}, {"x": 30, "y": 25}],
      "confidence": 0.8
    }
  ],
  "suggestedSolutions": [
    {
      "issue": "Burnt capacitor",
      "solution": "Replace capacitor C1500 with 10µF 6.3V",
      "priority": "high"
    }
  ],
  "summary": "brief summary of the board with schematic analysis"
}

Focus on identifying at least 5-10 major components visible in the image. Use the schematic to improve accuracy. Estimate their positions roughly on the board (0-100% from top-left). If you cannot identify components, return an empty components array but still provide a summary. Only include suspiciousMarkers if you see actual issues. Try to detect at least 2-3 major power/ground traces if visible.`;
  }

  return `Analyze this PCB board image and identify the key components and any suspicious areas. For each component you identify, provide:
1. Component name (e.g., U1200, C1500, R1200)
2. Component type (IC, Capacitor, Resistor, Inductor, Connector, Diode, Transistor, Other)
3. Brief description of its function
4. Confidence level (0-1)
5. Approximate position on the board as percentage (x, y coordinates from top-left, 0-100%)

Additionally, identify any suspicious components or areas that might be faulty (e.g., burnt capacitors, damaged traces, corroded areas). For each suspicious area, provide:
|- ID (number starting from 1)
|- Position (x, y as percentage 0-100)
|- Label (e.g., VCC_MAIN, U1200)
|- Note (e.g., "مكثس محتمل", "تلف واضح")
|- Severity (low, medium, high)

IMPORTANT: Return ONLY valid JSON. Do not include any other text before or after the JSON.
Use this exact structure:
{
  "components": [
    {
      "name": "component name",
      "type": "component type",
      "description": "description",
      "confidence": 0.9,
      "x": 50,
      "y": 50
    }
  ],
  "suspiciousMarkers": [
    {
      "id": 1,
      "x": 35,
      "y": 40,
      "label": "VCC_MAIN",
      "note": "مكثس محتمل",
      "severity": "medium"
    }
  ],
  "detectedNets": [
    {
      "name": "PP_VDD_MAIN",
      "type": "power",
      "points": [{"x": 10, "y": 20}, {"x": 30, "y": 25}],
      "confidence": 0.8
    }
  ],
  "suggestedSolutions": [
    {
      "issue": "Burnt capacitor",
      "solution": "Replace capacitor C1500 with 10µF 6.3V",
      "priority": "high"
    }
  ],
  "summary": "brief summary of the board"
}

Focus on identifying at least 5-10 major components visible in the image. Estimate their positions roughly on the board (0-100% from top-left). If you cannot identify components, return an empty components array but still provide a summary. Only include suspiciousMarkers if you see actual issues. Try to detect at least 2-3 major power/ground traces if visible.`;
}

interface AnalyzeBoardRequest {
  imageUrl: string;
  boardName?: string;
  schematicUrl?: string;
}

interface AnalyzeBoardResponse {
  success: boolean;
  components?: Array<{
    name: string;
    type: string;
    description: string;
    confidence: number;
    x?: number;
    y?: number;
  }>;
  suspiciousMarkers?: Array<{
    id: number;
    x: number;
    y: number;
    label: string;
    note: string;
    severity?: 'low' | 'medium' | 'high';
  }>;
  detectedNets?: Array<{
    name: string;
    type: string;
    points: Array<{ x: number; y: number }>;
    confidence: number;
  }>;
  suggestedSolutions?: Array<{
    issue: string;
    solution: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  summary?: string;
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting check
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    if (isRateLimited(ip, 15, 60000)) {
      return NextResponse.json(
        { error: "تم تجاوز عدد الطلبات المسموح بها، يرجى الانتظار دقيقة." },
        { status: 429 }
      );
    }

    const body: AnalyzeBoardRequest = await req.json();
    const { imageUrl, boardName, schematicUrl } = body;

    if (!imageUrl) {
      return NextResponse.json<AnalyzeBoardResponse>(
        {
          success: false,
          error: 'Image URL is required',
        },
        { status: 400 }
      );
    }

    console.log('Board analysis request:', { imageUrl, boardName, schematicUrl });

    // Get keys from environment variables directly (simpler for Vercel)
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // Log availability without exposing actual keys
    console.log('Available keys from env:', {
      gemini: !!geminiKey,
      openrouter: !!openrouterKey,
      openai: !!openaiKey,
    });

    // If no keys available, return clear error message
    if (!geminiKey && !openrouterKey && !openaiKey) {
      console.error('No AI keys available in environment variables');
      return NextResponse.json<AnalyzeBoardResponse>(
        {
          success: false,
          error: 'خدمة تحليل البورد غير متاحة حالياً. يرجى الاتصال بالإدارة لتفعيل مفاتيح الذكاء الاصطناعي.',
        },
        { status: 503 } // Service Unavailable instead of 500
      );
    }

    // Try Gemini first (direct API)
    if (geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);

        // Fetch image and convert to base64
        console.log('Fetching image from URL:', imageUrl);
        const imageResponse = await fetch(imageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
        }
        const imageBuffer = await imageResponse.arrayBuffer();

        // Convert to base64 safely
        let base64Image: string;
        try {
          base64Image = Buffer.from(imageBuffer).toString('base64');
        } catch (bufferError) {
          console.error('Buffer conversion error:', bufferError);
          throw new Error('Failed to convert image to base64');
        }
        console.log('Image converted to base64, size:', base64Image.length, 'bytes');

        // Check if image is too large (Gemini has limits)
        if (base64Image.length > 20 * 1024 * 1024) { // 20MB limit
          throw new Error('Image too large for processing (max 20MB)');
        }

        // Detect image type from URL or default to jpeg
        const imageType = imageUrl.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';

        const prompt = generateAnalysisPrompt(schematicUrl);

        // Try multiple models in order (updated to working models)
        const models = ['gemini-3.5-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-pro'];
        let lastError = null;

        for (const modelName of models) {
          try {
            console.log('Trying model:', modelName);
            const model = genAI.getGenerativeModel({ model: modelName });

            // Prepare content parts
            const contentParts: any[] = [prompt, {
              inlineData: {
                mimeType: imageType,
                data: base64Image,
              },
            }];

            // Add schematic if available
            if (schematicUrl) {
              const schematicResponse = await fetch(schematicUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
              });
              if (schematicResponse.ok) {
                const schematicBuffer = await schematicResponse.arrayBuffer();
                const base64Schematic = Buffer.from(schematicBuffer).toString('base64');
                const schematicType = schematicUrl.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
                contentParts.push({
                  inlineData: {
                    mimeType: schematicType,
                    data: base64Schematic,
                  },
                });
              }
            }

            const result = await model.generateContent(contentParts);

            const content = result.response.text();
            console.log('Gemini response received from', modelName, ', length:', content.length);
            console.log('Response preview:', content.substring(0, 200));

            // Try to extract JSON from the response
            let parsed = null;
            try {
              parsed = JSON.parse(content || '{}');
            } catch (parseError) {
              // Try to extract JSON from markdown code blocks
              const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                try {
                  parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
                } catch (e) {
                  console.error('Failed to parse extracted JSON:', e);
                }
              }
            }

            if (parsed && parsed.components && parsed.components.length > 0) {
              return NextResponse.json<AnalyzeBoardResponse>({
                success: true,
                components: parsed.components,
                suspiciousMarkers: parsed.suspiciousMarkers || [],
                summary: parsed.summary || '',
              });
            }

            // If no valid components found, return raw text as summary
            return NextResponse.json<AnalyzeBoardResponse>({
              success: true,
              components: [],
              summary: content || 'AI could not identify components in this image.',
            });
          } catch (error: any) {
            lastError = error;
            console.error(`Model ${modelName} failed:`, error.message);
            console.error('Full error:', error);
            continue; // Try next model
          }
        }

        // If all models failed
        console.error('=== ALL GEMINI MODELS FAILED ===');
        console.error('Last error:', lastError?.message);
        console.error('Last error details:', lastError);
      } catch (error: any) {
        console.error('=== GEMINI API ERROR ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Full error:', error);
      }
    }

    // Try OpenRouter next
    if (openrouterKey) {
      try {
        const client = new OpenAI({
          apiKey: openrouterKey,
          baseURL: 'https://openrouter.ai/api/v1',
          defaultHeaders: {
            'HTTP-Referer': 'https://dahab-device-doctor.vercel.app',
            'X-Title': 'Dahab Device Doctor',
          },
        });

        const prompt = generateAnalysisPrompt(schematicUrl);

        const messageContent: any[] = [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageUrl } },
        ];

        // Add schematic if available
        if (schematicUrl) {
          messageContent.push({ type: 'image_url', image_url: { url: schematicUrl } });
        }

        const response = await client.chat.completions.create({
          model: 'google/gemini-flash-1.5',
          messages: [
            {
              role: 'user',
              content: messageContent,
            },
          ],
          max_tokens: 1000,
        });

        const content = response.choices[0].message.content;
        console.log('OpenRouter response received');
        console.log('Response preview:', content?.substring(0, 200));

        // Try to extract JSON from the response
        let parsed = null;
        try {
          parsed = JSON.parse(content || '{}');
        } catch (parseError) {
          // Try to extract JSON from markdown code blocks
          const jsonMatch = content?.match(/```json\s*([\s\S]*?)\s*```/) || content?.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            } catch (e) {
              console.error('Failed to parse extracted JSON:', e);
            }
          }
        }

        if (parsed && parsed.components && parsed.components.length > 0) {
          return NextResponse.json<AnalyzeBoardResponse>({
            success: true,
            components: parsed.components,
            suspiciousMarkers: parsed.suspiciousMarkers || [],
            summary: parsed.summary || '',
          });
        }

        // If no valid components found, return raw text as summary
        return NextResponse.json<AnalyzeBoardResponse>({
          success: true,
          components: [],
          summary: content || 'AI could not identify components in this image.',
        });
      } catch (error: any) {
        console.error('OpenRouter API error:', error.message, error);
      }
    }

    // Fallback to OpenAI if available
    if (openaiKey) {
      try {
        const client = new OpenAI({ apiKey: openaiKey });

        const prompt = generateAnalysisPrompt(schematicUrl);

        const messageContent: any[] = [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageUrl } },
        ];

        // Add schematic if available
        if (schematicUrl) {
          messageContent.push({ type: 'image_url', image_url: { url: schematicUrl } });
        }

        const response = await client.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: messageContent,
            },
          ],
          max_tokens: 1000,
        });

        const responseContent = response.choices[0].message.content;
        console.log('OpenAI response received');
        console.log('Response preview:', responseContent?.substring(0, 200));

        // Try to extract JSON from the response
        let parsed = null;
        try {
          parsed = JSON.parse(responseContent || '{}');
        } catch (parseError) {
          // Try to extract JSON from markdown code blocks
          const jsonMatch = responseContent?.match(/```json\s*([\s\S]*?)\s*```/) || responseContent?.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            } catch (e) {
              console.error('Failed to parse extracted JSON:', e);
            }
          }
        }

        if (parsed && parsed.components && parsed.components.length > 0) {
          return NextResponse.json<AnalyzeBoardResponse>({
            success: true,
            components: parsed.components,
            suspiciousMarkers: parsed.suspiciousMarkers || [],
            summary: parsed.summary || '',
          });
        }

        // If no valid components found, return raw text as summary
        return NextResponse.json<AnalyzeBoardResponse>({
          success: true,
          components: [],
          summary: responseContent || 'AI could not identify components in this image.',
        });
      } catch (error: any) {
        console.error('OpenAI API error:', error.message, error);
      }
    }

    // If all providers failed
    console.error('All AI providers failed');
    return NextResponse.json<AnalyzeBoardResponse>(
      {
        success: false,
        error: 'All AI providers failed. Please check API keys and try again.',
      },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Error in analyze-board API:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json<AnalyzeBoardResponse>(
      {
        success: false,
        error: error.message || 'Failed to analyze board image',
      },
      { status: 500 }
    );
  }
}
