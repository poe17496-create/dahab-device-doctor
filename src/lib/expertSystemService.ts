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
  // Fetch relevant data in parallel
  const [caseStudies, references] = await Promise.all([
    getRelevantCaseStudies(deviceBrand, deviceModel, symptoms),
    getEngineeringReferences('', deviceBrand)
  ]);

  let prompt = `أنت خبير هندسي متخصص في إصلاح الأجهزة الإلكترونية.\n\n`;
  prompt += `الجهاز: ${deviceBrand} ${deviceModel}\n`;
  prompt += `الأعراض: ${symptoms.join(', ')}\n`;
  prompt += `سؤال المستخدم: ${userQuery}\n\n`;

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

  // Add engineering references context
  if (references.length > 0) {
    prompt += `=== مراجع هندسية موثقة (Engineering References) ===\n`;
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

  prompt += `=== تعليمات ===\n`;
  prompt += `1. استخدم الحالات العملية والمراجع الهندسية أعلاه كمرجع رئيسي.\n`;
  prompt += `2. قدم تشخيصاً دقيقاً مع الاستناد إلى البيانات الموثقة.\n`;
  prompt += `3. اذكر الأيسيهات والمكونات المرتبطة بالعطل.\n`;
  prompt += `4. اشرح خطوات الإصلاح بشكل مفصل مع الترتيب الصحيح.\n`;
  prompt += `5. حدد مخاطر أو تحذيرات هامة يجب الانتباه لها.\n`;
  prompt += `6. إذا لم تكن متأكداً، قم بالإشارة إلى الحاجة للمزيد من المعلومات.\n`;
  prompt += `7. استخدم المراجع الهندسية لدعم إجاباتك.\n\n`;

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
