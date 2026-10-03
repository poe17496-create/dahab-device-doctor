export type DeviceSpecialty =
  | 'mobile-repair'       // صيانة الموبايل (iOS & Android)
  | 'laptop-motherboard'  // لابتوب ومادربورد وماك بوك
  | 'tv-power-boards'     // شاشات وكروت باور وإنفرتر
  | 'automotive-ecu'      // كمبيوتر وإلكترونيات السيارات
  | 'general-electronics';// إلكترونيات عامة ودوائر تحكم

export type DiagnosisClassification = 'HARDWARE' | 'SOFTWARE' | 'HYBRID' | 'INDETERMINATE';

export interface PowerSupplyReadings {
  voltageInput?: number;         // الفولت المدخل (مثلاً 4.2V أو 19V أو 12V)
  currentBeforePower?: number;   // سحب الأمبير قبل الضغط على الباور (mA أو A)
  currentAfterPower?: string;    // سحب الأمبير بعد الباور (طبيعي، متذبذب، متوقف على 0.08A، شورت صريح)
  vphPwrVoltage?: number;        // فولت خط VPH_PWR / VDD_MAIN
  shortDetected?: boolean;       // هل يوجد شورت صريح؟
}

export interface DiodeModeReading {
  lineName: string;              // اسم المسار مثلاً (PP_VDD_MAIN أو VREG_S4)
  measuredValue: number;         // القيمة المقاسة بالفولت أو الممانعة (0.350V أو 450Ω)
  expectedValue?: string;        // القيمة المرجعية في المخطط
  isShort?: boolean;             // شورت للأرضي (قريب من 0.000)
  isOpen?: boolean;              // مسار مقطوع (OL)
}

export interface DiagnosticMetrics {
  classification: DiagnosisClassification; // هاردوير أم سوفتوير
  hardwareProbability: number;            // نسبة الهاردوير (0 - 100%)
  softwareProbability: number;            // نسبة السوفتوير (0 - 100%)
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  primarySuspectComponent?: string;       // المكون أو الآيسي أو المسار المشتبه به الرئيسي
  recommendedAction: string;              // التوصية الهندسية الفورية الأولى
  confidenceScore?: number;              // نسبة الثقة في التشخيص (0 - 100%)
  targetRegion?: {                        // إحداثيات المنطقة المشتبه بها على الصورة
    x: number;                            // الموضع الأفقي بالنسب المئوية (0-100)
    y: number;                            // الموضع العمودي بالنسب المئوية (0-100)
    width: number;                        // العرض بالنسب المئوية (0-100)
    height: number;                       // الارتفاع بالنسب المئوية (0-100)
  };
  testPoints?: TestPoint[];               // نقاط القياس التفاعلية
}

export interface TestPoint {
  name: string;                           // اسم نقطة القياس (مثلاً PP_VDD_MAIN)
  expectedValue: string;                  // القيمة المتوقعة (مثلاً 3.8V أو 0Ω)
  coordinates: {                          // إحداثيات النقطة على الصورة
    x: number;                            // الموضع الأفقي بالنسب المئوية (0-100)
    y: number;                            // الموضع العمودي بالنسب المئوية (0-100)
  };
  instruction: string;                     // خطوة الفحص المطلوبة
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  timestamp: string;
  text: string;
  imageBase64?: string;
  readings?: PowerSupplyReadings;
  metrics?: DiagnosticMetrics;
  testPoints?: { point: string; status: 'pending' | 'ok' | 'failed' }[];
}

export interface RepairSession {
  id: string;
  title: string;
  deviceType: DeviceSpecialty;
  deviceModel: string;
  clientName?: string;
  createdAt: string;
  updatedAt: string;
  status: 'open' | 'diagnosed' | 'in_progress' | 'repaired' | 'unfixable';
  powerReadings?: PowerSupplyReadings;
  metrics?: DiagnosticMetrics;
  messages: ChatMessage[];
  notes?: string;
}

export interface ReferenceSource {
  title: string;
  source: 'مخططات وزدكس دبليو ZXW' | 'يوتيوب YouTube' | 'تليجرام Telegram' | 'منتديات GSM' | 'دليل صيانة دهب' | 'مخصص';
  link: string;
  snippet: string;
  type: 'schematic' | 'video' | 'forum' | 'solution' | 'custom';
}

// Repair Status & Feedback Tracker Types
export type RepairStatus =
  | 'under_diagnosis'
  | 'awaiting_parts'
  | 'in_repair'
  | 'repaired_success'
  | 'unrepairable';

export interface RepairTicket {
  ticketId: string; // Format: DDD-XXXX
  deviceModel: string;
  deviceType: DeviceSpecialty;
  symptoms: string;
  aiDiagnosis: string;
  suspectedComponent?: string;
  status: RepairStatus;
  createdAt: string;
  updatedAt: string;
  actualReplacedComponent?: string;
  repairTimeMinutes?: number;
  repairNotes?: string;
  aiAccuracy?: 'accurate' | 'inaccurate' | 'partial';
}

export interface PostRepairFeedback {
  ticketId: string;
  actualReplacedComponent: string;
  repairTimeMinutes: number;
  repairNotes: string;
  aiAccuracy: 'accurate' | 'inaccurate' | 'partial';
}

// Common Faults Library Types
export interface CommonFault {
  id: string;
  model: string;
  brand: string; // Changed from union type to string for JSON compatibility
  faultName: string;
  symptoms: string[];
  suspectedComponent: string;
  measurementTest: string;
  fixSteps: string[];
  successRate: number; // 0-100
  isFactoryFault: boolean;
}
