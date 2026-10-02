/**
 * Enhanced AI System for Reading Schematics and Expert Knowledge
 * This system makes AI smarter by:
 * 1. Reading and analyzing schematics
 * 2. Understanding expert patterns
 * 3. Performing deep analysis
 * 4. Providing accurate diagnostics
 * 5. Cross-referencing external datasheets and references
 */

import { supabaseAdmin } from '@/lib/supabase';
import { getEngineeringReferences, searchEngineeringReferences } from './expertSystemService';

interface SchematicAnalysis {
  components: string[];
  powerRails: string[];
  signalPaths: string[];
  shortCandidates: string[];
  recommendations: string[];
  componentDetails: ComponentDetail[];
}

interface ComponentDetail {
  name: string;
  type: string;
  datasheet?: string;
  manufacturer?: string;
  description?: string;
}

interface ExpertPattern {
  symptom: string;
  solution: string;
  category: string;
  confidence: number;
}

interface SchematicContext {
  deviceBrand: string;
  deviceModel: string;
  components: ComponentDetail[];
  powerRails: string[];
  signalPaths: string[];
  references: any[];
}

/**
 * Analyze schematic image/text and extract components
 */
export async function analyzeSchematic(schematicData: string): Promise<SchematicAnalysis> {
  // In real implementation, this would use AI vision to analyze images
  // For now, we'll use pattern matching from expert knowledge

  const analysis: SchematicAnalysis = {
    components: [],
    powerRails: [],
    signalPaths: [],
    shortCandidates: [],
    recommendations: [],
    componentDetails: []
  };

  // Extract IC references (e.g., PU301, BQ25601, PM8150)
  const icPattern = /[A-Z]{2,4}\d{3,4}/g;
  const components = schematicData.match(icPattern) || [];
  analysis.components = Array.from(new Set(components)); // Remove duplicates

  // Extract power rails (e.g., VDD_MAIN, VPH_PWR, PP3V3)
  const powerPattern = /(V[A-Z_]+|PP[A-Z0-9_]+)/g;
  const powerRails = schematicData.match(powerPattern) || [];
  analysis.powerRails = Array.from(new Set(powerRails));

  // Extract signal paths (e.g., USB_D+, USB_D-, CLK, DATA)
  const signalPattern = /(USB_[A-Z]+|CLK|DATA|MOSI|MISO|SCL|SDA)/g;
  const signalPaths = schematicData.match(signalPattern) || [];
  analysis.signalPaths = Array.from(new Set(signalPaths));

  // Identify potential short candidates based on power rails
  analysis.shortCandidates = analysis.powerRails.filter(rail =>
    rail.includes('MAIN') || rail.includes('CPU') || rail.includes('GPU')
  );

  // Generate recommendations
  if (analysis.shortCandidates.length > 0) {
    analysis.recommendations.push('فحص مسارات الطاقة الرئيسية (Main Power Rails) بالدايود مود');
    analysis.recommendations.push('حقن فولت تدريجي بدءاً من 1.0V');
    analysis.recommendations.push('رصد المكونات الحارة بوضع الحرارة');
  }

  return analysis;
}

/**
 * Get detailed component information from external references
 */
export async function getComponentDetails(componentName: string): Promise<ComponentDetail> {
  try {
    const references = await getEngineeringReferences(componentName);

    if (references.length > 0) {
      const ref = references[0];
      return {
        name: componentName,
        type: ref.category,
        datasheet: ref.url,
        manufacturer: ref.manufacturer,
        description: ref.title
      };
    }

    // Return basic info if no reference found
    return {
      name: componentName,
      type: 'unknown',
      description: 'No external reference available'
    };
  } catch (error) {
    console.error('Error getting component details:', error);
    return {
      name: componentName,
      type: 'unknown',
      description: 'Error fetching details'
    };
  }
}

/**
 * Build comprehensive schematic context with external references
 */
export async function buildSchematicContext(
  deviceBrand: string,
  deviceModel: string,
  schematicData: string
): Promise<SchematicContext> {
  const analysis = await analyzeSchematic(schematicData);

  // Get detailed information for each component
  const componentDetails: ComponentDetail[] = [];
  for (const component of analysis.components.slice(0, 10)) {
    const details = await getComponentDetails(component);
    componentDetails.push(details);
  }

  // Get related engineering references
  const references = await searchEngineeringReferences(
    undefined,
    analysis.components,
    deviceBrand
  );

  return {
    deviceBrand,
    deviceModel,
    components: componentDetails,
    powerRails: analysis.powerRails,
    signalPaths: analysis.signalPaths,
    references
  };
}

/**
 * Find matching expert patterns from database
 */
export async function findMatchingPatterns(
  symptoms: string[],
  deviceBrand: string,
  deviceModel: string
): Promise<ExpertPattern[]> {
  try {
    const { data: caseStudies } = await supabaseAdmin
      .from('case_studies')
      .select('*')
      .ilike('device_brand', `%${deviceBrand}%`)
      .ilike('device_model', `%${deviceModel}%`)
      .eq('status', 'verified')
      .order('success_rate', { ascending: false })
      .limit(20);
    
    // Match symptoms with patterns
    const matchingPatterns: ExpertPattern[] = [];
    
    for (const study of caseStudies || []) {
      const symptomMatch = symptoms.some(symptom =>
        study.symptoms.some((studySymptom: string) =>
          studySymptom.toLowerCase().includes(symptom.toLowerCase()) ||
          symptom.toLowerCase().includes(studySymptom.toLowerCase())
        )
      );
      
      if (symptomMatch) {
        matchingPatterns.push({
          symptom: study.fault_description,
          solution: study.solution,
          category: study.fault_category,
          confidence: study.success_rate
        });
      }
    }
    
    return matchingPatterns;
  } catch (error) {
    console.error('Error finding matching patterns:', error);
    return [];
  }
}

/**
 * Get component relationships for context
 */
export async function getComponentContext(component: string): Promise<any> {
  try {
    const { data } = await supabaseAdmin
      .from('component_relationships')
      .select('*')
      .or(`source_component.ilike.%${component}%,target_component.ilike.%${component}%`)
      .order('confidence_score', { ascending: false })
      .limit(10);
    
    return data || [];
  } catch (error) {
    console.error('Error getting component context:', error);
    return [];
  }
}

/**
 * Build enhanced AI prompt with schematic analysis and external references
 */
export async function buildEnhancedPrompt(
  deviceBrand: string,
  deviceModel: string,
  symptoms: string[],
  schematicData?: string,
  userQuery?: string
): Promise<string> {
  let prompt = `أنت مهندس إلكترونيات خبير متخصص في تحليل المخططات الهندسية وإصلاح الأجهزة.\n\n`;

  prompt += `=== معلومات الجهاز ===\n`;
  prompt += `الماركة: ${deviceBrand}\n`;
  prompt += `الموديل: ${deviceModel}\n`;
  prompt += `الأعراض: ${symptoms.join(', ')}\n`;
  prompt += `سؤال المستخدم: ${userQuery || 'التشخيص والحل'}\n\n`;

  // Analyze schematic if provided
  if (schematicData) {
    prompt += `=== تحليل المخطط الهندسي المتقدم ===\n`;
    const context = await buildSchematicContext(deviceBrand, deviceModel, schematicData);

    prompt += `المكونات المكتشفة (${context.components.length}):\n`;
    context.components.forEach((comp, index) => {
      prompt += `${index + 1}. ${comp.name} (${comp.type})\n`;
      if (comp.manufacturer) {
        prompt += `   - الشركة: ${comp.manufacturer}\n`;
      }
      if (comp.description) {
        prompt += `   - الوصف: ${comp.description}\n`;
      }
      if (comp.datasheet) {
        prompt += `   - Datasheet: ${comp.datasheet}\n`;
      }
    });

    prompt += `\nخطوط الطاقة (${context.powerRails.length}):\n`;
    context.powerRails.forEach(rail => {
      prompt += `- ${rail}\n`;
    });

    prompt += `\nمسارات الإشارة (${context.signalPaths.length}):\n`;
    context.signalPaths.forEach(signal => {
      prompt += `- ${signal}\n`;
    });

    // Add external references
    if (context.references.length > 0) {
      prompt += `\n=== المراجع الهندسية المرتبطة ===\n`;
      context.references.slice(0, 5).forEach((ref, index) => {
        prompt += `${index + 1}. ${ref.title}\n`;
        prompt += `   - النوع: ${ref.reference_type}\n`;
        prompt += `   - الشركة: ${ref.manufacturer}\n`;
        if (ref.part_number) {
          prompt += `   - رقم القطعة: ${ref.part_number}\n`;
        }
        prompt += `   - الموثوقية: ${ref.reliability_score}%\n`;
      });
    }

    // Get component relationships
    for (const component of context.components.slice(0, 5)) {
      const contextData = await getComponentContext(component.name);
      if (contextData.length > 0) {
        prompt += `\nعلاقات ${component.name}:\n`;
        contextData.forEach((rel: any) => {
          prompt += `- ${rel.source_component} ${rel.relationship_type} ${rel.target_component}\n`;
        });
      }
    }
    prompt += '\n';
  }

  // Fetch matching expert patterns
  prompt += `=== الخبرات المطابقة من قاعدة البيانات ===\n`;
  const patterns = await findMatchingPatterns(symptoms, deviceBrand, deviceModel);

  if (patterns.length > 0) {
    patterns.forEach((pattern, index) => {
      prompt += `\nالحالة ${index + 1} (موثوقية ${pattern.confidence}%):\n`;
      prompt += `العطل: ${pattern.symptom}\n`;
      prompt += `الحل: ${pattern.solution}\n`;
    });
  } else {
    prompt += `لا توجد حالات مطابقة تماماً، سأستخدم الخبرات العامة.\n`;
  }
  prompt += '\n';

  // Analysis instructions
  prompt += `=== تعليمات التحليل الذكي المتقدم ===\n`;
  prompt += `1. اقرأ المخطط الهندسي بدقة واستخرج المكونات والمسارات\n`;
  prompt += `2. استخدم المراجع الهندسية الخارجية (Datasheets) لفهم المكونات\n`;
  prompt += `3. حدد المكونات المرتبطة بالعطل بناءً على المخطط\n`;
  prompt += `4. تتبع مسارات الطاقة والإشارة من المصدر إلى الحمل\n`;
  prompt += `5. استخدم الخبرات المطابقة كمرجع رئيسي\n`;
  prompt += `6. حدد المكون المحتمل للتلف بدقة\n`;
  prompt += `7. اقترح خطوات الفحص بالترتيب مع قيم الفولت والممانعة\n`;
  prompt += `8. استخدم المراجع الهندسية الرسمية لدعم التشخيص\n`;
  prompt += `9. حدد المخاطر والتحذيرات بدقة\n`;
  prompt += `10. قدم حل عملي مفصل مع الاستناد للمخططات والمراجع\n\n`;

  prompt += `=== مستوى التحليل ===\n`;
  prompt += `- تحليل المخططات: قراءة المخططات الهندسية واستخراج المكونات\n`;
  prompt += `- تحليل المراجع: استخدام Datasheets والمراجع الرسمية من 200+ مصدر\n`;
  prompt += `- تحليل الخبرات: الاستفادة من حالات الصيانة الموثقة\n`;
  prompt += `- تحليل شامل: دمج كل المصادر للوصول للتشخيص الأدق\n\n`;

  prompt += `قم بتقديم تحليل شامل ومفصل باللغة العربية مع الاستناد للمخططات والمراجع الهندسية.`;

  return prompt;
}

/**
 * Deep diagnostic analysis with multiple data sources
 */
export async function performDeepAnalysis(
  deviceBrand: string,
  deviceModel: string,
  symptoms: string[],
  measurements?: Record<string, number>
): Promise<any> {
  const analysis = {
    deviceInfo: { brand: deviceBrand, model: deviceModel },
    symptoms,
    measurements,
    matchedPatterns: [] as any[],
    componentContext: [] as any[],
    references: [] as any[],
    diagnosis: '',
    confidence: 0,
    recommendedActions: [] as string[]
  };
  
  // Get matching patterns
  analysis.matchedPatterns = await findMatchingPatterns(symptoms, deviceBrand, deviceModel);
  
  // Get component context for common ICs
  const commonICs = ['BQ25601', 'PM8150', '1610A3'];
  for (const ic of commonICs) {
    const context = await getComponentContext(ic);
    if (context.length > 0) {
      analysis.componentContext.push({ component: ic, relationships: context });
    }
  }
  
  // Calculate confidence based on pattern matches
  if (analysis.matchedPatterns.length > 0) {
    const avgConfidence = analysis.matchedPatterns.reduce((sum, p) => sum + p.confidence, 0) / analysis.matchedPatterns.length;
    analysis.confidence = avgConfidence;
  }
  
  // Generate recommended actions
  if (analysis.matchedPatterns.length > 0) {
    analysis.matchedPatterns.forEach(pattern => {
      analysis.recommendedActions.push(pattern.solution.substring(0, 100));
    });
  }
  
  return analysis;
}
