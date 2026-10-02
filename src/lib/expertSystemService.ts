import { supabaseAdmin } from './supabase';

interface CaseStudy {
  id: string;
  title: string;
  device_brand: string;
  device_model: string;
  fault_category: string;
  fault_description: string;
  symptoms: string[];
  diagnosis: string;
  solution: string;
  difficulty_level: string;
  related_ics: string[];
}

interface EngineeringReference {
  id: string;
  title: string;
  reference_type: string;
  manufacturer: string;
  part_number: string;
  category: string;
  url: string;
  reliability_score: number;
}

interface ComponentRelationship {
  source_component: string;
  target_component: string;
  relationship_type: string;
  relationship_description: string;
  confidence_score: number;
}

/**
 * Fetch relevant case studies based on device and symptoms
 */
export async function getRelevantCaseStudies(
  deviceBrand: string,
  deviceModel: string,
  symptoms: string[]
): Promise<CaseStudy[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('case_studies')
      .select('*')
      .eq('status', 'verified')
      .or(`device_brand.ilike.%${deviceBrand}%,device_model.ilike.%${deviceModel}%`)
      .order('success_rate', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching case studies:', error);
      return [];
    }

    // Filter by symptom similarity
    const filtered = data.filter((cs: CaseStudy) => {
      const symptomMatch = symptoms.some(symptom =>
        cs.symptoms.some(csSymptom =>
          csSymptom.toLowerCase().includes(symptom.toLowerCase()) ||
          symptom.toLowerCase().includes(csSymptom.toLowerCase())
        )
      );
      return symptomMatch;
    });

    return filtered;
  } catch (error) {
    console.error('Error in getRelevantCaseStudies:', error);
    return [];
  }
}

/**
 * Fetch engineering references for a component
 */
export async function getEngineeringReferences(
  partNumber: string,
  manufacturer?: string
): Promise<EngineeringReference[]> {
  try {
    let query = supabaseAdmin
      .from('engineering_references')
      .select('*')
      .order('reliability_score', { ascending: false })
      .limit(5);

    if (partNumber) {
      query = query.ilike('part_number', `%${partNumber}%`);
    }
    if (manufacturer) {
      query = query.ilike('manufacturer', `%${manufacturer}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching engineering references:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getEngineeringReferences:', error);
    return [];
  }
}

/**
 * Search engineering references by category and tags
 */
export async function searchEngineeringReferences(
  category?: string,
  tags?: string[],
  deviceBrand?: string
): Promise<EngineeringReference[]> {
  try {
    let query = supabaseAdmin
      .from('engineering_references')
      .select('*')
      .order('reliability_score', { ascending: false })
      .limit(15);

    if (category) {
      query = query.ilike('category', `%${category}%`);
    }

    if (deviceBrand) {
      query = query.ilike('manufacturer', `%${deviceBrand}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error searching engineering references:', error);
      return [];
    }

    // Filter by tags if provided
    let filtered = data || [];
    if (tags && tags.length > 0) {
      filtered = filtered.filter((ref: any) => {
        const refTags = ref.tags || [];
        return tags.some(tag =>
          refTags.some((rt: string) => rt.toLowerCase().includes(tag.toLowerCase()))
        );
      });
    }

    return filtered;
  } catch (error) {
    console.error('Error in searchEngineeringReferences:', error);
    return [];
  }
}

/**
 * Extract component names from text using patterns
 */
export function extractComponentsFromText(text: string): string[] {
  const patterns = [
    /[A-Z]{2,4}\d{3,4}/g, // IC references: PU301, BQ25601
    /[A-Z]{1,2}\d{3,4}[A-Z]?/g, // Component codes: R123, C456
    /V[A-Z_]+/g, // Power rails: VDD_MAIN, VPH_PWR
    /PP[A-Z0-9_]+/g, // Power paths: PP3V3, PP5V
  ];

  const components = new Set<string>();

  patterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    matches.forEach(match => components.add(match));
  });

  return Array.from(components);
}

/**
 * Get schematic references for a device
 */
export async function getSchematicReferences(
  deviceBrand: string,
  deviceModel: string
): Promise<EngineeringReference[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('engineering_references')
      .select('*')
      .eq('reference_type', 'technical_manual')
      .ilike('manufacturer', `%${deviceBrand}%`)
      .ilike('title', `%${deviceModel}%`)
      .order('reliability_score', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching schematic references:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getSchematicReferences:', error);
    return [];
  }
}

/**
 * Fetch component relationships for context
 */
export async function getComponentRelationships(
  component: string,
  deviceBrand?: string,
  deviceModel?: string
): Promise<ComponentRelationship[]> {
  try {
    let query = supabaseAdmin
      .from('component_relationships')
      .select('*')
      .order('confidence_score', { ascending: false })
      .limit(20);

    query = query.or(`source_component.ilike.%${component}%,target_component.ilike.%${component}%`);

    if (deviceBrand) {
      query = query.ilike('device_brand', `%${deviceBrand}%`);
    }
    if (deviceModel) {
      query = query.ilike('device_model', `%${deviceModel}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching component relationships:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getComponentRelationships:', error);
    return [];
  }
}

/**
 * Build enhanced AI prompt with expert system data
 */
export async function buildExpertSystemPrompt(
  deviceBrand: string,
  deviceModel: string,
  symptoms: string[],
  userQuery: string
): Promise<string> {
  // Extract components from user query
  const extractedComponents = extractComponentsFromText(userQuery);

  // Fetch relevant data in parallel
  const [caseStudies, references, schematicRefs, componentRefs] = await Promise.all([
    getRelevantCaseStudies(deviceBrand, deviceModel, symptoms),
    searchEngineeringReferences(undefined, extractedComponents, deviceBrand),
    getSchematicReferences(deviceBrand, deviceModel),
    // Get references for extracted components
    ...extractedComponents.slice(0, 3).map(comp => getEngineeringReferences(comp))
  ]);

  // Flatten component references
  const allComponentRefs = componentRefs.flat();

  let prompt = `أنت خبير هندسي متخصص في إصلاح الأجهزة الإلكترونية.\n\n`;
  prompt += `الجهاز: ${deviceBrand} ${deviceModel}\n`;
  prompt += `الأعراض: ${symptoms.join(', ')}\n`;
  prompt += `سؤال المستخدم: ${userQuery}\n`;
  if (extractedComponents.length > 0) {
    prompt += `المكونات المكتشفة: ${extractedComponents.join(', ')}\n`;
  }
  prompt += `\n`;

  // Add schematic references context
  if (schematicRefs.length > 0) {
    prompt += `=== مخططات هندسية موثقة (Schematics) ===\n`;
    schematicRefs.forEach((ref, index) => {
      prompt += `\nالمخطط ${index + 1}: ${ref.title}\n`;
      prompt += `- النوع: ${ref.reference_type}\n`;
      prompt += `- الشركة المصنعة: ${ref.manufacturer}\n`;
      if (ref.url) {
        prompt += `- الرابط: ${ref.url}\n`;
      }
      prompt += `- درجة الموثوقية: ${ref.reliability_score}%\n`;
    });
    prompt += `\n`;
  }

  // Add case studies context
  if (caseStudies.length > 0) {
    prompt += `=== حالات عملية مشابهة (Case Studies) ===\n`;
    caseStudies.forEach((cs, index) => {
      prompt += `\nالحالة ${index + 1}: ${cs.title}\n`;
      prompt += `- العطل: ${cs.fault_description}\n`;
      prompt += `- التشخيص: ${cs.diagnosis}\n`;
      prompt += `- الحل: ${cs.solution}\n`;
      prompt += `- الصعوبة: ${cs.difficulty_level}\n`;
      if (cs.related_ics && cs.related_ics.length > 0) {
        prompt += `- الأيسيهات المرتبطة: ${cs.related_ics.join(', ')}\n`;
      }
    });
    prompt += `\n`;
  }

  // Add component-specific engineering references
  if (allComponentRefs.length > 0) {
    prompt += `=== مراجع هندسية للمكونات المكتشفة (Component Datasheets) ===\n`;
    allComponentRefs.forEach((ref, index) => {
      prompt += `\nالمرجع ${index + 1}: ${ref.title}\n`;
      prompt += `- النوع: ${ref.reference_type}\n`;
      prompt += `- الشركة المصنعة: ${ref.manufacturer}\n`;
      if (ref.part_number) {
        prompt += `- رقم القطعة: ${ref.part_number}\n`;
      }
      if (ref.url) {
        prompt += `- الرابط: ${ref.url}\n`;
      }
      prompt += `- درجة الموثوقية: ${ref.reliability_score}%\n`;
    });
    prompt += `\n`;
  }

  // Add general engineering references
  if (references.length > 0) {
    prompt += `=== مراجع هندسية عامة (General Engineering References) ===\n`;
    references.forEach((ref, index) => {
      prompt += `\nالمرجع ${index + 1}: ${ref.title}\n`;
      prompt += `- النوع: ${ref.reference_type}\n`;
      prompt += `- الشركة المصنعة: ${ref.manufacturer}\n`;
      if (ref.part_number) {
        prompt += `- رقم القطعة: ${ref.part_number}\n`;
      }
      if (ref.url) {
        prompt += `- الرابط: ${ref.url}\n`;
      }
      prompt += `- درجة الموثوقية: ${ref.reliability_score}%\n`;
    });
    prompt += `\n`;
  }

  prompt += `=== تعليمات التحليل الذكي ===\n`;
  prompt += `1. استخدم المخططات الهندسية والمراجع الرسمية كمرجع أساسي.\n`;
  prompt += `2. استفد من الحالات العملية المشابهة لفهم الأعطال الشائعة.\n`;
  prompt += `3. اقرأ المخططات الهندسية بعناية وتتبع مسارات الطاقة والإشارة.\n`;
  prompt += `4. قدم تشخيصاً دقيقاً مع الاستناد إلى البيانات الموثقة.\n`;
  prompt += `5. اذكر الأيسيهات والمكونات المرتبطة بالعطل.\n`;
  prompt += `6. اشرح خطوات الإصلاح بشكل مفصل مع الترتيب الصحيح.\n`;
  prompt += `7. حدد مخاطر أو تحذيرات هامة يجب الانتباه لها.\n`;
  prompt += `8. استخدم المراجع الهندسية لدعم إجاباتك.\n`;
  prompt += `9. إذا كان هناك مخطط هندسي، اقرأه واستخرج المكونات والمسارات.\n`;
  prompt += `10. قم بتحليل عميق يربط بين المخططات والخبرات والمراجع.\n\n`;

  prompt += `=== مستوى التحليل ===\n`;
  prompt += `- تحليل المخططات: قراءة المخططات الهندسية وتحديد المكونات\n`;
  prompt += `- تحليل المراجع: استخدام Datasheets والمراجع الرسمية\n`;
  prompt += `- تحليل الخبرات: الاستفادة من حالات الصيانة الموثقة\n`;
  prompt += `- تحليل شامل: دمج كل المصادر للوصول للتشخيص الأدق\n\n`;

  prompt += `الرجاء تقديم إجابة مفصلة ومهنية باللغة العربية.`;

  return prompt;
}

/**
 * Search knowledge graph for related entities
 */
export async function searchKnowledgeGraph(
  searchTerm: string,
  nodeType?: string
): Promise<any[]> {
  try {
    let query = supabaseAdmin
      .from('knowledge_graph')
      .select('*')
      .ilike('node_label', `%${searchTerm}%`)
      .limit(10);

    if (nodeType) {
      query = query.eq('node_type', nodeType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error searching knowledge graph:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchKnowledgeGraph:', error);
    return [];
  }
}

/**
 * Get diagnostic rules for a device
 */
export async function getDiagnosticRules(
  deviceBrand: string,
  deviceModel?: string,
  faultCategory?: string
): Promise<any[]> {
  try {
    let query = supabaseAdmin
      .from('diagnostic_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(20);

    query = query.ilike('device_brand', `%${deviceBrand}%`);

    if (deviceModel) {
      query = query.ilike('device_model', `%${deviceModel}%`);
    }
    if (faultCategory) {
      query = query.ilike('fault_category', `%${faultCategory}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching diagnostic rules:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getDiagnosticRules:', error);
    return [];
  }
}
