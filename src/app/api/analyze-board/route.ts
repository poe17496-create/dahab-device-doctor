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

/**
 * ترجمة وضمان ظهور ملخص البورد باللغة العربية الهندسية الفصيحة
 */
function translateSummaryToArabic(summaryText: string): string {
  if (!summaryText) return '';
  let text = summaryText.trim();

  // إذا كان النص يحتوي بالفعل على لغة عربية كافية، نعيده مباشرة
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  if (arabicChars > 25) {
    return text;
  }

  // استبدال وترجمة الجمل الإنجليزية الشائعة التي تعيدها نماذج الذكاء الاصطناعي
  const replacements: [RegExp, string][] = [
    [/The PCB shows signs of localized burning and thermal stress around a top mounting hole\/pad\.?/gi, 'تُظهر لوحة الدوائر المطبوعة (PCB) علامات تفحم واحتراق موضعي وإجهاد حراري حول ثقب / باد التثبيت العلوي.'],
    [/Several ICs, passives, and inductors are visible across the blue solder mask board\.?/gi, 'تظهر العديد من الدوائر المتكاملة (ICs) والمكونات غير النشطة (المكثفات والمقاومات) وملفات الطاقة موزعة عبر طبقة السولدر ماسك الزرقاء للبوردة.'],
    [/The PCB shows signs of localized burning and thermal stress/gi, 'تُظهر لوحة الدوائر (PCB) علامات تفحم موضعي وإجهاد حراري'],
    [/The PCB shows signs of/gi, 'تُظهر لوحة الدوائر (PCB) علامات'],
    [/localized burning and thermal stress/gi, 'تفحم واحتراق موضعي وإجهاد حراري'],
    [/Several ICs, passives, and inductors are visible/gi, 'تظهر عدة دوائر متكاملة (ICs) ومكثفات وملفات طاقة'],
    [/across the blue solder mask board/gi, 'على سطح لوحة الدوائر المطبوعة الزرقاء'],
    [/thermal stress/gi, 'إجهاد حراري وسخونة زائدة'],
    [/burnt capacitor/gi, 'مكثف متفحم تالف'],
    [/corroded areas/gi, 'مناطق أكسدة وتآكل'],
    [/damaged traces/gi, 'مسارات تالفة أو مقطوعة'],
    [/short circuit/gi, 'قصر صريح (شورت)'],
    [/power rail/gi, 'خط تغذية'],
    [/AI could not identify components in this image\.?/gi, 'لم يتمكن الذكاء الاصطناعي من تحديد مكونات واضحة، يرجى رفع صورة أعلى دقة للبوردة أو التركيز على موضع العطل.'],
    [/No significant damage visible/gi, 'لا توجد أضرار ظاهرية واضحة بالعين المجردة على سطح اللوحة.'],
  ];

  for (const [pattern, rep] of replacements) {
    text = text.replace(pattern, rep);
  }

  // إذا بقي النص بالإنجليزية بالكامل دون ترجمة، نضيف له مقدمة توضيحية بالعربية
  if (!/[\u0600-\u06FF]/.test(text) && text.length > 10) {
    return `تحليل البورد الهندسي: ${text}`;
  }

  return text;
}

function generateAnalysisPrompt(schematicUrl?: string): string {
  return `أنت كبير مهندسي فحص الدوائر الإلكترونية والمازربورد في منظومة "دهب دكتور".
قم بفحص صورة لوحة الدوائر المطبوعة المرفقة (PCB) بدقة بالغة.

### المطلوب استخراجه هندسياً باللغة العربية:
1. **التعرف على كود وطراز البوردة من السلك سكرين (Silk Screen OCR):**
   - ابحث في الكتابات المطبوعة على البوردة عن رقم الموديل (مثل Compal LA-XXXXP, Quanta DA0XXXX, Lenovo NM-XXXX, Apple MacBook 820-XXXX, Asus, Dell, HP...).
   - صنف نوع البوردة (لابتوب laptop / كمبيوتر مكتبي desktop / هاتف mobile / كارت شاشة gpu / باور tv).

2. **فحص المكونات والأماكن المشبوهة:**
   - حدد المكونات الرئيسية (دوائر متكاملة ICs، مكثفات Capacitors، ملفات Inductors، موسفيتات MOSFETs، موصلات Connectors).
   - ابحث عن أي آثار تفحم أو احتراق موضعي أو شورت أو رطوبة وأكسدة (Burn marks, Overheating, Corrosion).

3. **قواعد اللغة الإلزامية الصارمة:**
   - **يجب أن يكون ملخص الفحص (summary) باللغة العربية الفصحى الهندسية الواضحة والاحترافية 100%.**
   - **يجب أن يكون وصف المكونات (description) ووظيفتها باللغة العربية.**
   - **يجب أن تكون ملاحظات الأماكن المشبوهة (note) باللغة العربية (مثال: "علامات احتراق وتفحم موضعي", "مكثف شورت محتمل").**
   - **يجب أن تكون الحلول المقترحة (suggestedSolutions) باللغة العربية (المشكلة issue والحل solution).**
   - احتفظ برموز المكونات (مثل PU301, C1500, U1200) والمسارات (19V, +3VALW, VDD_MAIN) بلغتها الإنجليزية التقنية.

${schematicUrl ? 'استعن أيضاً برسم المخطط الهندسي المرفق لمطابقة المكونات ومسارات الطاقة والجهود المتوقعة.' : ''}

IMPORTANT: Return ONLY valid JSON. Do not include any markdown backticks or explanation.
Use this exact JSON structure:
{
  "detectedBoardCode": "كود البوردة المكتوب على السلك سكرين إن وجد مثل LA-D751P أو 820-00165",
  "detectedBoardType": "laptop" | "mobile" | "desktop" | "tv" | "other",
  "summary": "ملخص الفحص البصري والهندسي الشامل لحالة البوردة وملاحظات الفحص باللغة العربية الفصحى",
  "components": [
    {
      "name": "PU301 أو U1200",
      "type": "IC / Capacitor / Resistor / Inductor / MOSFET / Connector",
      "description": "وصف المركب ووظيفته باللغة العربية",
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
      "label": "PU301 أو C101",
      "note": "ملاحظة العطل بالعربية (مثل: آثار احتراق وتفحم موضعي)",
      "severity": "high" | "medium" | "low"
    }
  ],
  "suggestedSolutions": [
    {
      "issue": "وصف العطل أو التلف باللغة العربية",
      "solution": "خطوة الإصلاح والفحص المقترحة باللغة العربية",
      "priority": "high" | "medium" | "low"
    }
  ]
}`;
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
    x: number | string;
    y: number | string;
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
  detectedBoardCode?: string;
  detectedBoardType?: string;
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

            if (parsed && (parsed.components || parsed.summary)) {
              return NextResponse.json<AnalyzeBoardResponse>({
                success: true,
                components: parsed.components || [],
                suspiciousMarkers: parsed.suspiciousMarkers || [],
                suggestedSolutions: parsed.suggestedSolutions || [],
                detectedBoardCode: parsed.detectedBoardCode || '',
                detectedBoardType: parsed.detectedBoardType || '',
                summary: translateSummaryToArabic(parsed.summary || ''),
              });
            }

            // If no valid components found, return translated text as summary
            return NextResponse.json<AnalyzeBoardResponse>({
              success: true,
              components: [],
              summary: translateSummaryToArabic(content || 'لم يتمكن الذكاء الاصطناعي من تحديد مكونات واضحة في الصورة.'),
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

        if (parsed && (parsed.components || parsed.summary)) {
          return NextResponse.json<AnalyzeBoardResponse>({
            success: true,
            components: parsed.components || [],
            suspiciousMarkers: parsed.suspiciousMarkers || [],
            suggestedSolutions: parsed.suggestedSolutions || [],
            detectedBoardCode: parsed.detectedBoardCode || '',
            detectedBoardType: parsed.detectedBoardType || '',
            summary: translateSummaryToArabic(parsed.summary || ''),
          });
        }

        // If no valid components found, return translated text as summary
        return NextResponse.json<AnalyzeBoardResponse>({
          success: true,
          components: [],
          summary: translateSummaryToArabic(content || 'لم يتمكن الذكاء الاصطناعي من تحديد مكونات واضحة في الصورة.'),
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

        if (parsed && (parsed.components || parsed.summary)) {
          return NextResponse.json<AnalyzeBoardResponse>({
            success: true,
            components: parsed.components || [],
            suspiciousMarkers: parsed.suspiciousMarkers || [],
            suggestedSolutions: parsed.suggestedSolutions || [],
            detectedBoardCode: parsed.detectedBoardCode || '',
            detectedBoardType: parsed.detectedBoardType || '',
            summary: translateSummaryToArabic(parsed.summary || ''),
          });
        }

        // If no valid components found, return translated text as summary
        return NextResponse.json<AnalyzeBoardResponse>({
          success: true,
          components: [],
          summary: translateSummaryToArabic(responseContent || 'لم يتمكن الذكاء الاصطناعي من تحديد مكونات واضحة في الصورة.'),
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
