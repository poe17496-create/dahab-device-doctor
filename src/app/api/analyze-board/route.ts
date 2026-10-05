import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Polyfill for Buffer in Vercel/Edge environment
if (typeof Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

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
    x?: number;
    y?: number;
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

    // Get keys from environment variables directly (simpler for Vercel)
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    console.log('Available keys from env:', {
      gemini: !!geminiKey,
      openrouter: !!openrouterKey,
      openai: !!openaiKey,
    });

    // If no keys available, return error immediately
    if (!geminiKey && !openrouterKey && !openaiKey) {
      console.error('No AI keys available in environment variables');
      return NextResponse.json<AnalyzeBoardResponse>(
        {
          success: false,
          error: 'No AI provider keys configured. Please add GEMINI_API_KEY or OPENROUTER_API_KEY to environment variables.',
        },
        { status: 500 }
      );
    }

    // Try Gemini first (direct API)
    if (geminiKey) {
      console.log('Using Gemini key:', geminiKey.substring(0, 15) + '...');
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

        const prompt = `Analyze this PCB board image and identify the key components. For each component you identify, provide:
1. Component name (e.g., U1200, C1500, R1200)
2. Component type (IC, Capacitor, Resistor, Inductor, Connector, Diode, Transistor, Other)
3. Brief description of its function
4. Confidence level (0-1)
5. Approximate position on the board as percentage (x, y coordinates from top-left, 0-100%)

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
  "summary": "brief summary of the board"
}

Focus on identifying at least 5-10 major components visible in the image. Estimate their positions roughly on the board (0-100% from top-left). If you cannot identify components, return an empty components array but still provide a summary.`;

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
            continue; // Try next model
          }
        }

        // If all models failed
        console.error('All Gemini models failed:', lastError?.message);
      } catch (error: any) {
        console.error('Gemini API error:', error.message, error);
      }
    }

    // Try OpenRouter next
    if (openrouterKey) {
      console.log('Trying OpenRouter with key:', openrouterKey.substring(0, 10) + '...');
      try {
        const client = new OpenAI({
          apiKey: openrouterKey,
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
5. Approximate position on the board as percentage (x, y coordinates from top-left, 0-100%)

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
  "summary": "brief summary of the board"
}

Focus on identifying at least 5-10 major components visible in the image. Estimate their positions roughly on the board (0-100% from top-left). If you cannot identify components, return an empty components array but still provide a summary.`,
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
      console.log('Trying OpenAI with key:', openaiKey.substring(0, 10) + '...');
      try {
        const client = new OpenAI({ apiKey: openaiKey });

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
5. Approximate position on the board as percentage (x, y coordinates from top-left, 0-100%)

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
  "summary": "brief summary of the board"
}

Focus on identifying at least 5-10 major components visible in the image. Estimate their positions roughly on the board (0-100% from top-left). If you cannot identify components, return an empty components array but still provide a summary.`,
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

        const content = response.choices[0].message.content;
        console.log('OpenAI response received');
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
