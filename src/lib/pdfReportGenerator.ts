import { RepairSession } from './types';

export interface DiagnosticReportOptions {
  workshopName?: string;
  workshopPhone?: string;
  technicianName?: string;
  customerName?: string;
  customerPhone?: string;
  repairCost?: string;
  warrantyPeriod?: string;
  notes?: string;
  qrPayload?: string;
}

export interface DirectReportData {
  id?: string;
  deviceModel: string;
  deviceType?: string;
  powerReadings?: {
    voltageInput?: number;
    currentBeforePower?: number;
    currentAfterPower?: number;
    shortDetected?: boolean;
    suspectedLine?: string;
    thermalHotspot?: boolean;
  };
  metrics?: {
    classification?: string;
    hardwareProbability?: number;
    softwareProbability?: number;
    urgencyLevel?: string;
    primarySuspectComponent?: string;
    recommendedAction?: string;
  };
  userPrompt?: string;
  diagnosticOutput: string;
}

/**
 * 📄 مولد تقارير وفواتير الفحص الهندسي الاحترافية (Print & Save as PDF + QR Code)
 * يقوم بإنشاء وثيقة A4 رسمية بتنسيق ذهبي احترافي جاهزة للطباعة أو الحفظ كـ PDF
 * تتضمن اسم الورشة، هاتف التواصل، بيانات العميل، قراءات الباور سبلاي، تقرير الذكاء الاصطناعي، التكلفة، والضمان
 */
export function generateProfessionalDiagnosticPDF(
  input: RepairSession | DirectReportData,
  options?: DiagnosticReportOptions | string,
  legacyTechnicianName?: string
) {
  if (typeof window === 'undefined') return;

  // دعم الاستدعاء القديم (workshopName: string, technicianName: string)
  let opts: DiagnosticReportOptions = {};
  if (typeof options === 'string') {
    opts = {
      workshopName: options,
      technicianName: legacyTechnicianName,
    };
  } else if (options) {
    opts = options;
  }

  // قراءة البيانات الافتراضية من التخزين المحلي إن لم تكن ممررة
  const savedWorkshopName = typeof window !== 'undefined' ? localStorage.getItem('dahab_workshop_name') || '' : '';
  const savedWorkshopPhone = typeof window !== 'undefined' ? localStorage.getItem('dahab_workshop_phone') || '' : '';
  const savedTechName = typeof window !== 'undefined' ? localStorage.getItem('dahab_technician_name') || '' : '';

  const wName = opts.workshopName || savedWorkshopName || 'مركز دهب للهندسة والإلكترونيات الدقيقة';
  const wPhone = opts.workshopPhone || savedWorkshopPhone || '01064147224';
  const tName = opts.technicianName || savedTechName || 'م. إسلام دهب (كبير المهندسين)';
  const custName = opts.customerName || 'عميل الورشة الكريم';
  const custPhone = opts.customerPhone || 'مسجل بنظام المركز';
  const cost = opts.repairCost || 'يحدد لاحقاً عند الاعتماد';
  const warranty = opts.warrantyPeriod || '30 يوماً على القطع المستبدلة';
  const extraNotes = opts.notes || '';

  // استخراج البيانات بحسب نوع المدخلات
  const isDirect = 'diagnosticOutput' in input;
  const reportId = (input.id || `DHD-${Math.floor(100000 + Math.random() * 900000)}`).replace('ref_', '').slice(-8).toUpperCase();
  const deviceModel = input.deviceModel || (isDirect ? '' : (input as RepairSession).title) || 'جهاز إلكتروني غير محدد';
  const deviceType = input.deviceType || 'إلكترونيات دقيقة / ميكرو إلكترونيكس';
  const powerReadings = input.powerReadings;
  const metrics = input.metrics;

  let rawAssistantText = '';
  let userQueryText = '';

  if (isDirect) {
    const direct = input as DirectReportData;
    rawAssistantText = direct.diagnosticOutput || '';
    userQueryText = direct.userPrompt || '';
  } else {
    const session = input as RepairSession;
    const assistantMsg = [...(session.messages || [])].reverse().find((m) => m.sender === 'assistant');
    const userMsg = session.messages?.find((m) => m.sender === 'user');
    rawAssistantText = assistantMsg?.text || '';
    userQueryText = userMsg?.text || '';
  }

  const cleanAssistantText = (rawAssistantText || 'لا يوجد تقرير فحص تفصيلي متاح.')
    .replace(/<<<DAHAB_DIAGNOSTIC_METRICS>>>[\s\S]*?<<<END_DAHAB_METRICS>>>/g, '')
    .replace(/[*#_`]/g, '')
    .trim();

  const currentDate = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // بيانات الباركود للتحقق
  const qrData = opts.qrPayload || `https://dahabsoftware.site/verify?rep=${reportId}&dev=${encodeURIComponent(deviceModel)}&tech=${encodeURIComponent(tName)}`;
  const qrCodeImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=115x115&margin=2&format=svg&data=${encodeURIComponent(qrData)}`;

  const printHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تقرير فحص وتشخيص هندسي معتمد - ${deviceModel} (#${reportId})</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      margin: 0;
      padding: 0;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page-container {
      max-width: 820px;
      margin: 15px auto;
      background: #ffffff;
      padding: 24px 28px;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
      position: relative;
    }
    @media print {
      body {
        background: #fff;
      }
      .page-container {
        margin: 0;
        padding: 0;
        border: none;
        box-shadow: none;
        max-width: 100%;
      }
      .no-print {
        display: none !important;
      }
    }
    
    /* شريط الإجراءات العلوي للمعاينة */
    .action-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #111827;
      color: #fff;
      padding: 10px 18px;
      border-radius: 12px;
      margin-bottom: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .btn-print {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #0f172a;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .btn-print:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
    }

    /* رأس الوثيقة الرسمي */
    .header {
      border-bottom: 2.5px solid #d97706;
      padding-bottom: 14px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-badge {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #f59e0b, #b45309);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 900;
      font-size: 24px;
      box-shadow: 0 4px 10px rgba(217, 119, 6, 0.3);
    }
    .brand-text h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.2px;
    }
    .brand-text p {
      margin: 2px 0 0;
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
    }
    .brand-contact {
      margin-top: 3px;
      font-size: 10px;
      color: #d97706;
      font-weight: 700;
    }
    .qr-and-meta {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .qr-card {
      text-align: center;
      background: #f8fafc;
      padding: 4px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
    }
    .qr-card img {
      width: 72px;
      height: 72px;
      display: block;
      border-radius: 6px;
    }
    .qr-card span {
      display: block;
      font-size: 8px;
      font-weight: 800;
      color: #64748b;
      margin-top: 2px;
    }
    .meta-box {
      text-align: left;
      font-size: 10.5px;
      color: #475569;
      line-height: 1.6;
    }
    .meta-box strong {
      color: #0f172a;
    }

    /* العناوين الداخلية */
    .section-title {
      font-size: 12px;
      font-weight: 900;
      background: #f8fafc;
      border-right: 4px solid #f59e0b;
      padding: 5px 10px;
      margin: 12px 0 6px;
      border-radius: 4px;
      color: #1e293b;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    /* الجداول */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-bottom: 8px;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 6px 9px;
      text-align: right;
    }
    th {
      background: #f1f5f9;
      font-weight: 700;
      color: #334155;
    }
    td {
      color: #0f172a;
    }

    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 6px;
      font-weight: 800;
      font-size: 10px;
    }
    .badge-hw { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
    .badge-sw { background: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc; }
    .badge-urgent { background: #ffedd5; color: #c2410c; border: 1px solid #fdba74; }
    
    /* نصوص التقرير */
    .diagnostic-text {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-right: 3px solid #3b82f6;
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 10.5px;
      white-space: pre-wrap;
      line-height: 1.65;
      color: #1e293b;
      margin-bottom: 8px;
    }

    /* الصندوق المالي والضمان */
    .financial-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 8px;
    }
    .fin-card {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-radius: 8px;
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .fin-card.warranty {
      background: #f0fdf4;
      border-color: #dcfce7;
    }
    .fin-label {
      font-size: 10.5px;
      color: #78350f;
      font-weight: 700;
    }
    .fin-card.warranty .fin-label {
      color: #166534;
    }
    .fin-val {
      font-size: 12.5px;
      font-weight: 900;
      color: #b45309;
    }
    .fin-card.warranty .fin-val {
      color: #15803d;
    }

    /* إخلاء المسؤولية */
    .disclaimer-box {
      margin-top: 10px;
      padding: 7px 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-right: 3px solid #d97706;
      border-radius: 6px;
      font-size: 9px;
      color: #64748b;
      line-height: 1.45;
    }

    /* التوقيعات */
    .signatures {
      margin-top: 18px;
      display: flex;
      justify-content: space-between;
      padding-top: 10px;
      border-top: 1px dashed #cbd5e1;
    }
    .sig-block {
      text-align: center;
      width: 190px;
      font-size: 10.5px;
      color: #334155;
      font-weight: 700;
    }
    .sig-line {
      margin-top: 30px;
      border-bottom: 1px solid #94a3b8;
    }
    .watermark {
      text-align: center;
      font-size: 8.5px;
      color: #94a3b8;
      margin-top: 12px;
      letter-spacing: 0.3px;
    }
  </style>
</head>
<body>

  <!-- شريط أدوات المعاينة (يختفي عند الطباعة) -->
  <div class="no-print" style="max-width: 820px; margin: 15px auto 0;">
    <div class="action-bar">
      <div>
        <strong style="color: #f59e0b; font-size: 13px;">وثيقة فحص هندسي رسمية جاهزة للطباعة</strong>
        <span style="font-size: 11px; color: #9ca3af; margin-right: 8px;">(اختر Save as PDF لحفظ ملف إلكتروني)</span>
      </div>
      <button class="btn-print" onclick="window.print()">
        <span>🖨️ طباعة التقرير / حفظ PDF</span>
      </button>
    </div>
  </div>

  <div class="page-container">
    <!-- الهيدر الرسمي -->
    <div class="header">
      <div class="brand-group">
        <div class="brand-badge">⚡</div>
        <div class="brand-text">
          <h1>${wName}</h1>
          <p>المنظومة الهندسية لفحص وتشخيص الدوائر والمخططات بالذكاء الاصطناعي</p>
          <div class="brand-contact">📞 هاتف التواصل / الدعم: ${wPhone}</div>
        </div>
      </div>
      <div class="qr-and-meta">
        <div class="meta-box">
          <div><strong>رقم الوثيقة:</strong> #${reportId}</div>
          <div><strong>تاريخ الفحص:</strong> ${currentDate}</div>
          <div><strong>المهندس الفاحص:</strong> ${tName}</div>
        </div>
        <div class="qr-card">
          <img src="${qrCodeImgSrc}" alt="QR Verification" />
          <span>مسح للتحقق ⚡</span>
        </div>
      </div>
    </div>

    <!-- بيانات العميل والجهاز -->
    <div class="section-title">
      <span>📱 بيانات الجهاز والمواصفات الفنية</span>
      <span style="font-size: 9.5px; color: #64748b; font-weight: normal;">قسم الصيانة الدقيقة</span>
    </div>
    <table>
      <tr>
        <th style="width: 18%;">موديل الجهاز</th>
        <td style="width: 32%;"><strong>${deviceModel}</strong></td>
        <th style="width: 18%;">فئة التخصص</th>
        <td style="width: 32%;">${deviceType}</td>
      </tr>
      <tr>
        <th>اسم العميل</th>
        <td><strong>${custName}</strong></td>
        <th>هاتف العميل</th>
        <td>${custPhone}</td>
      </tr>
      <tr>
        <th>تصنيف العطل</th>
        <td>
          <span class="badge ${metrics?.classification === 'HARDWARE' ? 'badge-hw' : 'badge-sw'}">
            ${metrics?.classification === 'HARDWARE' ? 'عطل عتادي (Hardware)' : 'عطل برمجي / مختلط'}
          </span>
        </td>
        <th>درجة الخطورة</th>
        <td>
          <span class="badge badge-urgent">
            ${metrics?.urgencyLevel === 'CRITICAL' ? 'حرجة جداً' : metrics?.urgencyLevel === 'HIGH' ? 'مرتفعة' : 'متوسطة'}
          </span>
        </td>
      </tr>
    </table>

    <!-- قراءات الباور سبلاي والقياسات -->
    <div class="section-title">
      <span>⚡ قراءات الباور سبلاي وممانعة الدخل</span>
      <span style="font-size: 9.5px; color: #64748b; font-weight: normal;">Power Supply Diagnostics</span>
    </div>
    <table>
      <tr>
        <th style="width: 25%;">الفولت المدخل (Input V)</th>
        <td style="width: 25%;">${powerReadings?.voltageInput ? `${powerReadings.voltageInput}V` : 'طبيعي / بطارية'}</td>
        <th style="width: 25%;">سحب الأمبير قبل التشغيل</th>
        <td style="width: 25%;"><strong>${powerReadings?.currentBeforePower !== undefined ? `${powerReadings.currentBeforePower}A` : '0.000A (سليم)'}</strong></td>
      </tr>
      <tr>
        <th>سحب الأمبير بعد التشغيل</th>
        <td>${powerReadings?.currentAfterPower !== undefined ? `${powerReadings.currentAfterPower}A` : 'طبيعي / متذبذب'}</td>
        <th>حالة القصر الصريح (Short)</th>
        <td>${powerReadings?.shortDetected ? '⚠️ يوجد شورت صريح في الدائرة' : 'لا يوجد قصر في مسار الدخل الرئيسي'}</td>
      </tr>
      <tr>
        <th>المسار المشتبه به</th>
        <td>${powerReadings?.suspectedLine || 'مسارات التغذية الرئيسية (VCC_MAIN / BATT+)'}</td>
        <th>المكون المشتبه به الأول</th>
        <td><strong>${metrics?.primarySuspectComponent || 'دوائر تنظيم الطاقة (Power PMIC)'}</strong></td>
      </tr>
    </table>

    <!-- شكوى الفني / العميل -->
    ${
      userQueryText
        ? `
    <div class="section-title">
      <span>🔍 وصف الأعراض وشكوى العميل</span>
    </div>
    <div style="font-size: 10.5px; padding: 6px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 8px; color: #334155;">
      ${userQueryText}
    </div>`
        : ''
    }

    <!-- تقرير الفحص والتشخيص الهندسي -->
    <div class="section-title">
      <span>🛠️ تقرير الفحص الهندسي وتوجيه المخطط</span>
      <span style="font-size: 9.5px; color: #64748b; font-weight: normal;">AI Engineering Analysis</span>
    </div>
    <div class="diagnostic-text">${cleanAssistantText}</div>

    <!-- التكلفة المالية والضمان المعتمد -->
    <div class="section-title">
      <span>💰 التكلفة المقدرة والضمان الهندسي</span>
    </div>
    <div class="financial-grid">
      <div class="fin-card">
        <span class="fin-label">التكلفة الإجمالية للإصلاح:</span>
        <span class="fin-val">${cost}</span>
      </div>
      <div class="fin-card warranty">
        <span class="fin-label">فترة الضمان الممنوحة:</span>
        <span class="fin-val">${warranty}</span>
      </div>
    </div>

    ${
      extraNotes
        ? `
    <div style="font-size: 10px; padding: 6px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 6px;">
      <strong>ملاحظات الورشة:</strong> ${extraNotes}
    </div>`
        : ''
    }

    <!-- إخلاء المسؤولية والتنبيهات -->
    <div class="disclaimer-box">
      <strong>⚠️ تنبيه فني وقانوني:</strong>
      هذا التقرير صادر بناءً على فحص القياسات وتحليل المخططات الهندسية بدقة. يُلزم الفني بإجراء فحص الممانعة بوضع الدايود على البوردة قبل البدء في حقن أي فولت أو استبدال الدوائر المتكاملة لتفادي تلف المعالج. يسري الضمان فقط على الأعطال المحددة بالقطع المستبدلة.
    </div>

    <!-- التوقيعات الرسمية -->
    <div class="signatures">
      <div class="sig-block">
        <div>مهندس الفحص المشرف</div>
        <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">${tName}</div>
        <div class="sig-line"></div>
      </div>
      <div class="sig-block">
        <div>ختم ورشة / مركز الصيانة</div>
        <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">${wName}</div>
        <div class="sig-line"></div>
      </div>
      <div class="sig-block">
        <div>توقيع واستلام العميل</div>
        <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">${custName}</div>
        <div class="sig-line"></div>
      </div>
    </div>

    <div class="watermark">
      تم استخراج وتوثيق هذا التقرير عبر منظومة دكتور الأجهزة • Dahab Device Doctor AI • www.dahabsoftware.site
    </div>
  </div>

  <script>
    // تشغيل نافذة الطباعة تلقائياً عند فتح النافذة
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
`;

  const printWindow = window.open('', '_blank', 'width=900,height=1000');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  }
}
