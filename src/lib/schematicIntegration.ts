import { DeviceSpecialty, PowerSupplyReadings, DiagnosticMetrics } from './types';
import icDatabase from '../data/ic_database.json';

/**
 * نظام تكامل المخططات الهندسية
 * يربط بين جميع المكونات والأدوات في المنظومة
 */

export interface SchematicNode {
  id: string;
  type: 'ic' | 'power' | 'signal' | 'connector' | 'sensor';
  name: string;
  partNumber?: string;
  description: string;
  testPoints: string[];
  relatedComponents: string[];
  commonFailures: string[];
}

export interface SchematicConnection {
  from: string;
  to: string;
  type: 'power' | 'signal' | 'data' | 'ground';
  voltage?: number;
  description: string;
}

export interface IntegratedDiagnosticContext {
  deviceModel: string;
  specialty: DeviceSpecialty;
  readings: PowerSupplyReadings;
  metrics: DiagnosticMetrics;
  relatedICs: typeof icDatabase;
  suggestedTestPoints: string[];
  powerRailAnalysis: PowerRailAnalysis[];
}

export interface PowerRailAnalysis {
  railName: string;
  expectedVoltage: number;
  measuredVoltage?: number;
  status: 'ok' | 'low' | 'high' | 'short' | 'missing';
  connectedComponents: string[];
  critical: boolean;
}

/**
 * تحليل مسارات الباور الرئيسية بناءً على نوع الجهاز
 */
export function analyzePowerRails(
  specialty: DeviceSpecialty,
  readings: PowerSupplyReadings
): PowerRailAnalysis[] {
  const rails: PowerRailAnalysis[] = [];

  switch (specialty) {
    case 'mobile-repair':
      rails.push(
        {
          railName: 'VBAT',
          expectedVoltage: 4.2,
          measuredVoltage: readings.voltageInput,
          status: readings.voltageInput && readings.voltageInput > 3.7 ? 'ok' : 'low',
          connectedComponents: ['PMIC', 'Charging IC', 'Power Button'],
          critical: true,
        },
        {
          railName: 'VDD_MAIN',
          expectedVoltage: 3.8,
          status: readings.shortDetected ? 'short' : 'ok',
          connectedComponents: ['CPU', 'GPU', 'PMIC'],
          critical: true,
        },
        {
          railName: 'VPH_PWR',
          expectedVoltage: 4.3,
          status: readings.shortDetected ? 'short' : 'ok',
          connectedComponents: ['PMIC', 'RF Transceiver'],
          critical: true,
        },
        {
          railName: 'PP1V8',
          expectedVoltage: 1.8,
          status: 'ok',
          connectedComponents: ['Memory', 'Sensors', 'Touch ID'],
          critical: false,
        }
      );
      break;

    case 'laptop-motherboard':
      rails.push(
        {
          railName: 'DC-IN',
          expectedVoltage: 19,
          measuredVoltage: readings.voltageInput,
          status: readings.voltageInput && readings.voltageInput > 18 ? 'ok' : 'low',
          connectedComponents: ['Charging IC', 'Power Controller'],
          critical: true,
        },
        {
          railName: 'VCORE',
          expectedVoltage: 1.1,
          status: readings.currentAfterPower === '0.00A' ? 'missing' : 'ok',
          connectedComponents: ['CPU', 'VRM Controller'],
          critical: true,
        },
        {
          railName: '3V3_S5',
          expectedVoltage: 3.3,
          status: 'ok',
          connectedComponents: ['EC', 'SMBus', 'RAM'],
          critical: true,
        },
        {
          railName: '5V_S5',
          expectedVoltage: 5,
          status: 'ok',
          connectedComponents: ['USB Controller', 'HDD Power'],
          critical: false,
        }
      );
      break;

    case 'tv-power-boards':
      rails.push(
        {
          railName: 'AC_INPUT',
          expectedVoltage: 220,
          status: 'ok',
          connectedComponents: ['Bridge Rectifier', 'PFC Circuit'],
          critical: true,
        },
        {
          railName: '12V_MAIN',
          expectedVoltage: 12,
          status: readings.shortDetected ? 'short' : 'ok',
          connectedComponents: ['LED Driver', 'Main Board'],
          critical: true,
        },
        {
          railName: '24V_PANEL',
          expectedVoltage: 24,
          status: readings.shortDetected ? 'short' : 'ok',
          connectedComponents: ['Panel Power', 'Backlight'],
          critical: true,
        }
      );
      break;

    default:
      rails.push(
        {
          railName: 'VCC',
          expectedVoltage: 5,
          status: 'ok',
          connectedComponents: ['MCU', 'Sensors'],
          critical: true,
        }
      );
  }

  return rails;
}

/**
 * اقتراح نقاط الفحص بناءً على التشخيص
 */
export function suggestTestPoints(
  metrics: DiagnosticMetrics,
  specialty: DeviceSpecialty
): string[] {
  const testPoints: string[] = [];

  if (metrics.classification === 'HARDWARE') {
    testPoints.push('فحص ممانعة خطوط الباور الرئيسية (Diode Mode)');
    testPoints.push('قياس فولتية زر الباور');
    testPoints.push('فحص ملفات BUCK/LDO حول PMIC');
    testPoints.push('تتبع السخونة بالرجينة أو الكاميرا الحرارية');
  }

  if (metrics.classification === 'SOFTWARE') {
    testPoints.push('فحص وضع DFU/Fastboot/Recovery');
    testPoints.push('اختبار الاتصال بالكمبيوتر');
    testPoints.push('فحص سجلات Panic/Kernel');
    testPoints.push('اختبار فلاشة رسمية');
  }

  if (metrics.classification === 'HYBRID') {
    testPoints.push('فحص خطوط I2C/SPI');
    testPoints.push('قياس ممانعة الذاكرة');
    testPoints.push('فحص كريستالة التوقيت');
    testPoints.push('اختبار استقرار الباور');
  }

  // إضافة نقاط فحص خاصة بالتخصص
  switch (specialty) {
    case 'mobile-repair':
      testPoints.push('فحص آيسي الشحن (Tristar/Tigris)');
      testPoints.push('قياس خطوط USB D+/D-');
      testPoints.push('فحص مقاومات Pull-up على I2C');
      break;
    case 'laptop-motherboard':
      testPoints.push('فحص EC (Embedded Controller)');
      testPoints.push('قياس فولتية VCORE');
      testPoints.push('فحص VRM Controller');
      break;
    case 'tv-power-boards':
      testPoints.push('فحص Bridge Rectifier');
      testPoints.push('قياس فولتية المكثفات الرئيسية');
      testPoints.push('فحص PFC Circuit');
      break;
  }

  return testPoints;
}

/**
 * البحث عن آيسيهات متعلقة بالعطل
 */
export function findRelatedICs(
  deviceModel: string,
  symptoms: string
): typeof icDatabase {
  const symptomsLower = symptoms.toLowerCase();
  const modelLower = deviceModel.toLowerCase();

  return icDatabase.filter((ic) => {
    const matchesSymptoms = ic.commonSymptoms.toLowerCase().includes(symptomsLower) ||
                           symptomsLower.includes(ic.commonSymptoms.toLowerCase().split(' ')[0]);
    const matchesModel = ic.deviceFamily.toLowerCase().includes(modelLower) ||
                        modelLower.includes(ic.deviceFamily.toLowerCase().split(' ')[0].toLowerCase());
    
    return matchesSymptoms || matchesModel;
  });
}

/**
 * إنشاء سياق تشخيص متكامل
 */
export function createIntegratedContext(params: {
  deviceModel: string;
  specialty: DeviceSpecialty;
  readings: PowerSupplyReadings;
  metrics: DiagnosticMetrics;
  symptoms: string;
}): IntegratedDiagnosticContext {
  const powerRails = analyzePowerRails(params.specialty, params.readings);
  const testPoints = suggestTestPoints(params.metrics, params.specialty);
  const relatedICs = findRelatedICs(params.deviceModel, params.symptoms);

  return {
    deviceModel: params.deviceModel,
    specialty: params.specialty,
    readings: params.readings,
    metrics: params.metrics,
    relatedICs,
    suggestedTestPoints: testPoints,
    powerRailAnalysis: powerRails,
  };
}

/**
 * توليد تقرير تكامل المخططات
 */
export function generateSchematicIntegrationReport(context: IntegratedDiagnosticContext): string {
  let report = '📋 تقرير تكامل المخططات والتحليل الهندسي\n\n';

  report += `🔧 **الجهاز:** ${context.deviceModel}\n`;
  report += `🎯 **التخصص:** ${context.specialty}\n`;
  report += `⚡ **التصنيف:** ${context.metrics.classification}\n\n`;

  report += '---\n\n';
  report += '### 📊 تحليل مسارات الباور\n\n';

  context.powerRailAnalysis.forEach((rail) => {
    const statusEmoji = {
      ok: '✅',
      low: '⚠️',
      high: '⚠️',
      short: '🔥',
      missing: '❌',
    }[rail.status];

    report += `${statusEmoji} **${rail.railName}** (${rail.expectedVoltage}V)\n`;
    report += `   - الحالة: ${rail.status}\n`;
    report += `   - المكونات المتصلة: ${rail.connectedComponents.join(', ')}\n`;
    report += `   - حرج: ${rail.critical ? 'نعم' : 'لا'}\n\n`;
  });

  report += '---\n\n';
  report += '### 🔍 نقاط الفحص المقترحة\n\n';

  context.suggestedTestPoints.forEach((point, index) => {
    report += `${index + 1}. ${point}\n`;
  });

  if (context.relatedICs.length > 0) {
    report += '\n---\n\n';
    report += '### 🧰 الآيسيهات المرتبطة بالعطل\n\n';

    context.relatedICs.forEach((ic) => {
      report += `**${ic.partNumber}** - ${ic.function}\n`;
      report += `- الفئة: ${ic.category}\n`;
      report += `- الأعراض الشائعة: ${ic.commonSymptoms}\n`;
      report += `- البدائل: ${ic.compatibles.join(', ')}\n`;
      report += `- قراءات الدايود: ${ic.diodeReadings}\n\n`;
    });
  }

  return report;
}
