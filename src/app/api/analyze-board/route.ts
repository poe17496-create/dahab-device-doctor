import { NextRequest, NextResponse } from 'next/server';
import { getAllActiveKeys, getNextKeyWithRotation, recordKeyFailure, recordKeySuccess } from '@/lib/apiKeysStorage';
import OpenAI from 'openai';

/**
 * AI Board Analysis API
 *
 * Uses OpenRouter or other AI providers with vision capabilities to analyze board images
 */

interface AnalyzeBoardRequest {
  imageUrl: string;
  boardName?: string;
}

interface AnalyzeBoardResponse {
  success: boolean;
  components?: Array<{
    name: string;
    type: string;
    description: string;
    confidence: number;
  }>;
  summary?: string;
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeBoardRequest = await req.json();
    const { imageUrl, boardName } = body;

    if (!imageUrl) {
      return NextResponse.json<AnalyzeBoardResponse>(
        {
          success: false,
          error: 'Image URL is required',
        },
        { status: 400 }
      );
    }

    // Get all active AI keys from the storage system
    const { openrouterKeys, geminiKeys, openaiKeys } = getAllActiveKeys();

    // Try OpenRouter first (has vision models)
    if (openrouterKeys.length > 0) {
      const key = getNextKeyWithRotation('openrouter', openrouterKeys);
      if (key) {
        try {
          const client = new OpenAI({
            apiKey: key,
            baseURL: 'https://openrouter.ai/api/v1',
            defaultHeaders: {
              'HTTP-Referer': 'https://dahab-device-doctor.vercel.app',
              'X-Title': 'Dahab Device Doctor',
            },
          });

          const response = await client.chat.completions.create({
            model: 'google/gemini-2.0-flash-001',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `Analyze this PCB board image and identify the key components. For each component you identify, provide:
1. Component name (e.g., U1200, C1500, R1200)
2. Component type (IC, Capacitor, Resistor, Inductor, Connector, Diode, Transistor, Other)
3. Brief description of its function
4. Confidence level (0-1)

Return the response in JSON format with this structure:
{
  "components": [
    {
      "name": "component name",
      "type": "component type",
      "description": "description",
      "confidence": 0.9
    }
  ],
  "summary": "brief summary of the board"
}

Focus on identifying at least 5-10 major components visible in the image.`,
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: imageUrl,
                    },
                  },
                ],
              },
            ],
            max_tokens: 1000,
          });

          recordKeySuccess('openrouter');
          const content = response.choices[0].message.content;

          try {
            const parsed = JSON.parse(content || '{}');
            return NextResponse.json<AnalyzeBoardResponse>({
              success: true,
              components: parsed.components || [],
              summary: parsed.summary || '',
            });
          } catch (parseError) {
            return NextResponse.json<AnalyzeBoardResponse>({
              success: true,
              components: [],
              summary: content || '',
            });
          }
        } catch (error: any) {
          recordKeyFailure('openrouter', error.message, openrouterKeys);
          console.error('OpenRouter API error:', error.message);
        }
      }
    }

    // Fallback to OpenAI if available
    if (openaiKeys.length > 0) {
      const key = getNextKeyWithRotation('openai', openaiKeys);
      if (key) {
        try {
          const client = new OpenAI({ apiKey: key });

          const response = await client.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `Analyze this PCB board image and identify the key components. For each component you identify, provide:
1. Component name (e.g., U1200, C1500, R1200)
2. Component type (IC, Capacitor, Resistor, Inductor, Connector, Diode, Transistor, Other)
3. Brief description of its function
4. Confidence level (0-1)

Return the response in JSON format with this structure:
{
  "components": [
    {
      "name": "component name",
      "type": "component type",
      "description": "description",
      "confidence": 0.9
    }
  ],
  "summary": "brief summary of the board"
}

Focus on identifying at least 5-10 major components visible in the image.`,
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: imageUrl,
                    },
                  },
                ],
              },
            ],
            max_tokens: 1000,
          });

          recordKeySuccess('openai');
          const content = response.choices[0].message.content;

          try {
            const parsed = JSON.parse(content || '{}');
            return NextResponse.json<AnalyzeBoardResponse>({
              success: true,
              components: parsed.components || [],
              summary: parsed.summary || '',
            });
          } catch (parseError) {
            return NextResponse.json<AnalyzeBoardResponse>({
              success: true,
              components: [],
              summary: content || '',
            });
          }
        } catch (error: any) {
          recordKeyFailure('openai', error.message, openaiKeys);
          console.error('OpenAI API error:', error.message);
        }
      }
    }

    // If all providers failed
    return NextResponse.json<AnalyzeBoardResponse>(
      {
        success: false,
        error: 'No AI provider available. Please add API keys via the admin panel.',
      },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Error in analyze-board API:', error);
    return NextResponse.json<AnalyzeBoardResponse>(
      {
        success: false,
        error: error.message || 'Failed to analyze board image',
      },
      { status: 500 }
    );
  }
}
