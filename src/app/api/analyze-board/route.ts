import { NextRequest, NextResponse } from 'next/server';
import { getAllActiveKeys, getNextKeyWithRotation, recordKeyFailure, recordKeySuccess } from '@/lib/apiKeysStorage';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

    console.log('Board analysis request:', { imageUrl, boardName });

    // Get all active AI keys from the storage system
    const { openrouterKeys, geminiKeys, openaiKeys } = getAllActiveKeys();
    console.log('Available keys:', {
      openrouter: openrouterKeys.length,
      gemini: geminiKeys.length,
      openai: openaiKeys.length,
    });

    // Try Gemini first (direct API)
    if (geminiKeys.length > 0) {
      console.log('Gemini keys available:', geminiKeys.length);
      const key = getNextKeyWithRotation('gemini', geminiKeys);
      if (key) {
        console.log('Using Gemini key:', key.substring(0, 15) + '...');
        try {
          const genAI = new GoogleGenerativeAI(key);

          // Fetch image and convert to base64 (do this once for all models)
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
          const base64Image = Buffer.from(imageBuffer).toString('base64');
          console.log('Image converted to base64, size:', base64Image.length, 'bytes');

          // Check if image is too large (Gemini has limits)
          if (base64Image.length > 20 * 1024 * 1024) { // 20MB limit
            throw new Error('Image too large for processing (max 20MB)');
          }

          // Detect image type from URL or default to jpeg
          const imageType = imageUrl.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';

          const prompt = `Analyze this PCB board image and identify the key components. For each component you identify, provide:
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

Focus on identifying at least 5-10 major components visible in the image.`;

          // Try multiple models in order
          const models = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-1.5-flash'];
          let lastError = null;

          for (const modelName of models) {
            try {
              console.log('Trying model:', modelName);
              const model = genAI.getGenerativeModel({ model: modelName });

              const result = await model.generateContent([
                prompt,
                {
                  inlineData: {
                    mimeType: imageType,
                    data: base64Image,
                  },
                },
              ]);

              recordKeySuccess('gemini');
              const content = result.response.text();
              console.log('Gemini response received from', modelName, ', length:', content.length);

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
              lastError = error;
              console.error(`Model ${modelName} failed:`, error.message);
              continue; // Try next model
            }
          }

          // If all models failed
          recordKeyFailure('gemini', lastError?.message || 'All models failed', geminiKeys);
          console.error('All Gemini models failed');
        } catch (error: any) {
          recordKeyFailure('gemini', error.message, geminiKeys);
          console.error('Gemini API error:', error.message, error);
        }
      }
    }

    // Try OpenRouter next
    if (openrouterKeys.length > 0) {
      const key = getNextKeyWithRotation('openrouter', openrouterKeys);
      if (key) {
        try {
          console.log('Trying OpenRouter with key:', key.substring(0, 10) + '...');
          const client = new OpenAI({
            apiKey: key,
            baseURL: 'https://openrouter.ai/api/v1',
            defaultHeaders: {
              'HTTP-Referer': 'https://dahab-device-doctor.vercel.app',
              'X-Title': 'Dahab Device Doctor',
            },
          });

          const response = await client.chat.completions.create({
            model: 'google/gemini-flash-1.5-8b',
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
          console.log('OpenRouter response received');

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
          console.error('OpenRouter API error:', error.message, error);
        }
      }
    }

    // Fallback to OpenAI if available
    if (openaiKeys.length > 0) {
      const key = getNextKeyWithRotation('openai', openaiKeys);
      if (key) {
        try {
          console.log('Trying OpenAI with key:', key.substring(0, 10) + '...');
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
          console.log('OpenAI response received');

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
          console.error('OpenAI API error:', error.message, error);
        }
      }
    }

    // If all providers failed
    console.error('All AI providers failed');
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
