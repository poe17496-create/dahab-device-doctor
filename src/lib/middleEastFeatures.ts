/**
 * ميزات متخصصة للسوق الشرق الأوسط
 * دعم اللغة العربية، المصطلحات المحلية، والمميزات الخاصة بالمنطقة
 */

export interface LocalizedTerm {
  english: string;
  arabic: string;
  localVariations: string[];
  category: 'hardware' | 'software' | 'tool' | 'symptom';
}

export interface RegionalPricing {
  currency: string;
  symbol: string;
  region: string;
  commonICPrices: Record<string, number>;
}

/**
 * قاموس المصطلحات العربية المحلية
 */
export const ARABIC_TECH_TERMS: LocalizedTerm[] = [
  // Hardware Terms
  { english: 'Short Circuit', arabic: 'شورت', localVariations: ['قصر', 'ماس'], category: 'hardware' },
  { english: 'Diode Mode', arabic: 'وضع الدايود', localVariations: ['قياس الدايود'], category: 'tool' },
  { english: 'Power Supply', arabic: 'باور سبلاي', localVariations: ['مصدر التيار'], category: 'tool' },
  { english: 'Multimeter', arabic: 'ملتيميتر', localVariations: ['أفوميتر'], category: 'tool' },
  { english: 'Soldering', arabic: 'لحام', localVariations: ['سولديرنج'], category: 'hardware' },
  { english: 'Desoldering', arabic: 'فك لحام', localVariations: ['ديسولديرنج'], category: 'hardware' },
  { english: 'Reballing', arabic: 'ريبولينج', localVariations: ['إعادة كرات'], category: 'hardware' },
  { english: 'IC', arabic: 'آيسي', localVariations: ['شيب'], category: 'hardware' },
  { english: 'Capacitor', arabic: 'مكثف', localVariations: ['كاباسيتور'], category: 'hardware' },
  { english: 'Resistor', arabic: 'مقاومة', localVariations: ['ريزيستور'], category: 'hardware' },
  { english: 'Coil', arabic: 'ملف', localVariations: ['بك'], category: 'hardware' },
  { english: 'Transistor', arabic: 'ترانزستور', localVariations: [], category: 'hardware' },
  { english: 'Boardview', arabic: 'بوردفيو', localVariations: ['مخطط البوردة'], category: 'hardware' },
  { english: 'Schematic', arabic: 'مخطط', localVariations: ['سكيماتك'], category: 'hardware' },
  
  // Software Terms
  { english: 'Flash', arabic: 'فلاش', localVariations: ['تفليش'], category: 'software' },
  { english: 'Firmware', arabic: 'فيرموير', localVariations: [], category: 'software' },
  { english: 'Bootloop', arabic: 'لوجو', localVariations: ['ريستارت'], category: 'symptom' },
  { english: 'DFU Mode', arabic: 'وضع DFU', localVariations: [], category: 'software' },
  { english: 'Recovery Mode', arabic: 'وضع الريكفري', localVariations: [], category: 'software' },
  { english: 'Fastboot', arabic: 'فاست بوت', localVariations: [], category: 'software' },
  { english: 'IMEI', arabic: 'آيمي', localVariations: [], category: 'software' },
  { english: 'Baseband', arabic: 'بيسباند', localVariations: [], category: 'hardware' },
  
  // Symptoms
  { english: 'Dead', arabic: 'موت', localVariations: ['لا يعمل'], category: 'symptom' },
  { english: 'No Power', arabic: 'فاصل باور', localVariations: ['لا يشتغل'], category: 'symptom' },
  { english: 'Overheating', arabic: 'سخونة', localVariations: ['حار'], category: 'symptom' },
  { english: 'Water Damage', arabic: 'تلف مياه', localVariations: ['غرق'], category: 'symptom' },
  { english: 'Ghost Touch', arabic: 'لمس وهمي', localVariations: [], category: 'symptom' },
  { english: 'No Service', arabic: 'لا يوجد شبكة', localVariations: ['لا شبكة'], category: 'symptom' },
  { english: 'Fake Charging', arabic: 'شحن وهمي', localVariations: [], category: 'symptom' },
];

/**
 * أسعار القطع الشائعة في الشرق الأوسط
 */
export const REGIONAL_PRICING: RegionalPricing = {
  currency: 'SAR',
  symbol: 'ر.س',
  region: 'السعودية والشرق الأوسط',
  commonICPrices: {
    'Tristar IC': 45,
    'Tigris IC': 55,
    'PMIC iPhone': 80,
    'Audio IC': 35,
    'Baseband CPU': 120,
    'PMIC Android': 60,
    'Charging IC': 40,
    'Power Controller': 70,
    'USB-C Controller': 50,
    'Touch ID IC': 90,
    'Display IC': 150,
    'NAND Flash': 100,
  },
};

/**
 * تحويل النص العربي المحلي إلى الإنجليزية التقنية
 */
export function translateLocalToTechnical(text: string): string {
  let translated = text;
  
  ARABIC_TECH_TERMS.forEach((term) => {
    term.localVariations.forEach((variation) => {
      const regex = new RegExp(variation, 'gi');
      translated = translated.replace(regex, term.english);
    });
  });

  return translated;
}

/**
 * تحسين النص العربي للذكاء الاصطناعي
 */
export function enhanceArabicPrompt(prompt: string): string {
  let enhanced = prompt;
  
  // إضافة المصطلحات الإنجليزية المقابلة
  ARABIC_TECH_TERMS.forEach((term) => {
    if (enhanced.includes(term.arabic) || term.localVariations.some(v => enhanced.includes(v))) {
      enhanced = enhanced.replace(new RegExp(term.arabic, 'gi'), `${term.arabic} (${term.english})`);
    }
  });

  return enhanced;
}

/**
 * الحصول على سعر تقديري للقطعة
 */
export function getEstimatedPrice(componentName: string): number | null {
  const normalized = componentName.toLowerCase();
  
  for (const [component, price] of Object.entries(REGIONAL_PRICING.commonICPrices)) {
    if (normalized.includes(component.toLowerCase())) {
      return price;
    }
  }
  
  return null;
}

/**
 * توليد تقرير باللغة العربية مع المصطلحات التقنية
 */
export function generateArabicTechnicalReport(
  diagnosis: string,
  metrics: any
): string {
  let report = diagnosis;
  
  // إضافة قسم الأسعار التقديرية
  const priceSection = '\n\n---\n\n### 💰 تقدير تكلفة القطع (الشرق الأوسط)\n\n';
  let priceAdded = false;
  
  ARABIC_TECH_TERMS.forEach((term) => {
    if (report.includes(term.arabic) || report.includes(term.english)) {
      const price = getEstimatedPrice(term.english);
      if (price) {
        priceAdded = true;
      }
    }
  });
  
  if (priceAdded) {
    report += priceSection;
    report += 'ملاحظة: الأسعار تقديرية وقد تختلف حسب الدولة والمورد.\n';
  }
  
  return report;
}

/**
 * قائمة الموردين المعتمدين في الشرق الأوسط
 */
export const TRUSTED_SUPPLIERS = [
  { name: 'ZXW Dongle', region: 'الصين - شحن عالمي', website: 'zxwtools.com' },
  { name: 'Wu Xin', region: 'الصين - شحن عالمي', website: 'wxin.cn' },
  { name: 'MobileTech', region: 'دبي، الإمارات', website: 'mobiletech.ae' },
  { name: 'GSM Egypt', region: 'القاهرة، مصر', website: 'gsmegypt.com' },
  { name: 'Saudiphone', region: 'الرياض، السعودية', website: 'saudiphone.com' },
  { name: 'Jordan Fix', region: 'عمان، الأردن', website: 'jordanfix.com' },
];

/**
 * الحصول على قائمة الموردين حسب المنطقة
 */
export function getSuppliersByRegion(region: string): typeof TRUSTED_SUPPLIERS {
  return TRUSTED_SUPPLIERS.filter((supplier) =>
    supplier.region.includes(region) || supplier.region === 'الصين - شحن عالمي'
  );
}

/**
 * تحويل العملات الشائعة في الشرق الأوسط
 */
export function convertCurrency(
  amount: number,
  from: string,
  to: string
): number {
  // أسعار تقريبية (يجب تحديثها من API حقيقي)
  const rates: Record<string, number> = {
    SAR: 1,
    AED: 0.98,
    EGP: 12.5,
    JOD: 0.19,
    KWD: 0.08,
    QAR: 0.97,
    USD: 0.27,
  };

  const fromRate = rates[from] || 1;
  const toRate = rates[to] || 1;
  
  return (amount / fromRate) * toRate;
}
