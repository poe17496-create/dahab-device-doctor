import { NextRequest, NextResponse } from 'next/server';

/**
 * AI Board Analysis API
 *
 * Uses OpenAI Vision API to analyze board images and identify components
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

    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) {
      return NextResponse.json<AnalyzeBoardResponse>(
        {
          success: false,
          error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.',
        },
        { status: 500 }
      );
    }

    // Use OpenAI Vision API to analyze the board image
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
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
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return NextResponse.json<AnalyzeBoardResponse>(
        {
          success: false,
          error: 'Failed to analyze image with AI',
        },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse the AI response
    try {
      const parsed = JSON.parse(content);
      return NextResponse.json<AnalyzeBoardResponse>({
        success: true,
        components: parsed.components || [],
        summary: parsed.summary || '',
      });
    } catch (parseError) {
      // If AI didn't return valid JSON, return the raw text
      return NextResponse.json<AnalyzeBoardResponse>({
        success: true,
        components: [],
        summary: content,
      });
    }
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
