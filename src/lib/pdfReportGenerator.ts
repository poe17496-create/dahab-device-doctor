import { RepairSession } from './types';

/**
 * 📄 مولد تقارير وفواتير الفحص الهندسي الاحترافية (Print & Save as PDF)
 * يقوم بإنشاء وثيقة A4 رسمية بتنسيق ذهبي احترافي جاهزة للطباعة أو الحفظ كـ PDF
 * تتضمن اسم الورشة، بيانات الجهاز، قراءات الباور، تقرير الـ AI، التكلفة، وإخلاء المسؤولية
 */
export function generateProfessionalDiagnosticPDF(session: RepairSession, workshopName?: string, technicianName?: string) {
  if (typeof window === 'undefined') return;

  const wName = workshopName || 'منظومة ذهب دكتور الهندسية (Dahab Device Doctor)';
  const tName = technicianName || 'المهندس المشرف';
  const currentDate = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const assistantMsg = [...(session.messages || [])].reverse().find((m) => m.sender === 'assistant');
  const userMsg = session.messages?.find((m) => m.sender === 'user');

  const cleanAssistantText = (assistantMsg?.text || 'لا يوجد تقرير مفصل')
    .replace(/<<<DAHAB_DIAGNOSTIC_METRICS>>>[\s\S]*?<<<END_DAHAB_METRICS>>>/g, '')
    .replace(/[*#_`]/g, '')
    .trim();

  const printHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>تقرير فحص وتشخيص هندسي - ${session.deviceModel || session.title || 'جهاز'}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #111827;
      background: #fff;
      margin: 0;
      padding: 0;
      line-height: 1.5;
    }
    .header {
      border-bottom: 3px solid #d97706;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo-box {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-badge {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #000;
      font-weight: 900;
      font-size: 20px;
    }
    .title-box h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 900;
      color: #111827;
    }
    .title-box p {
      margin: 2px 0 0;
      font-size: 11px;
      color: #6b7280;
    }
    .report-meta {
      text-align: left;
      font-size: 10px;
      color: #4b5563;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 10px;
    }
    .badge-hw { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
    .badge-sw { background: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc; }
    
    .section-title {
      font-size: 13px;
      font-weight: 900;
      background: #f8fafc;
      border-right: 4px solid #f59e0b;
      padding: 5px 10px;
      margin: 14px 0 8px;
      border-radius: 4px;
      color: #1f2937;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-bottom: 10px;
    }
    th, td {
      border: 1px solid #e5e7eb;
      padding: 6px 8px;
      text-align: right;
    }
    th {
      background: #f3f4f6;
      font-weight: bold;
      color: #374151;
    }
    
    .diagnostic-text {
      background: #fcfcfc;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 10px;
      font-size: 11px;
      white-space: pre-wrap;
      line-height: 1.6;
      color: #1f2937;
    }

    .disclaimer-box {
      margin-top: 14px;
      padding: 8px 12px;
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-right: 3px solid #d97706;
      border-radius: 6px;
      font-size: 9.5px;
      color: #92400e;
      line-height: 1.4;
    }

    .signatures {
      margin-top: 24px;
      display: flex;
      justify-content: space-between;
      padding-top: 12px;
      border-top: 1px dashed #d1d5db;
    }
    .sig-block {
      text-align: center;
      width: 200px;
      font-size: 11px;
      color: #374151;
    }
    .sig-line {
      margin-top: 35px;
      border-bottom: 1px solid #9ca3af;
    }
  </style>
</head>
<body>

  <!-- الهيدر -->
  <div class="header">
    <div class="logo-box">
      <div class="logo-badge">⚡</div>
      <div class="title-box">
        <h1>${wName}</h1>
        <p>المنظومة الهندسية المعتمدة لفحص وتشخيص الإلكترونيات الدقيقة والمخططات</p>
      </div>
    </div>
    <div class="report-meta">
      <div><strong>رقم التقرير:</strong> #${session.id.slice(-8).toUpperCase()}</div>
      <div><strong>التاريخ:</strong> ${currentDate}</div>
      <div><strong>المهندس الفاحص:</strong> ${tName}</div>
    </div>
  </div>

  <!-- بيانات الجهاز والعميل -->
  <div class="section-title">📱 بيانات الجهاز والمواصفات الفنية</div>
  <table>
    <tr>
      <th style="width: 20%;">موديل الجهاز</th>
      <td style="width: 30%;"><strong>${session.deviceModel || 'غير محدد'}</strong></td>
      <th style="width: 20%;">فئة التخصص</th>
      <td style="width: 30%;">${session.deviceType || 'صيانة إلكترونيات'}</td>
    </tr>
    <tr>
      <th>رقم السيريال / IMEI</th>
      <td>${session.id.includes('ref_') ? 'DEMO-DEVICE-TEST' : 'مسجل بالورشة'}</td>
      <th>تصنيف العطل المبدئي</th>
      <td>
        <span class="badge ${session.metrics?.classification === 'HARDWARE' ? 'badge-hw' : 'badge-sw'}">
          ${session.metrics?.classification === 'HARDWARE' ? 'عطل عتادي (Hardware)' : 'عطل برمجي / هجين'}
        </span>
      </td>
    </tr>
  </table>

  <!-- قراءات الباور سبلاي والقياسات -->
  <div class="section-title">⚡ قراءات الباور سبلاي وممانعة الدخل</div>
  <table>
    <tr>
      <th>الفولت المدخل (Input V)</th>
      <td>${session.powerReadings?.voltageInput ? `${session.powerReadings.voltageInput}V` : 'طبيعي (بطارية)'}</td>
      <th>سحب الأمبير قبل التشغيل</th>
      <td>${session.powerReadings?.currentBeforePower ? `${session.powerReadings.currentBeforePower}A` : '0.000A (سليم)'}</td>
    </tr>
    <tr>
      <th>ملاحظات القصر (Short)</th>
      <td>${session.powerReadings?.shortDetected ? '⚠️ يوجد قصر صريح (Short to GND)' : 'لا يوجد قصر في مسار الدخل'}</td>
      <th>المكون المشتبه به الرئيسي</th>
      <td><strong>${session.metrics?.primarySuspectComponent || 'دوائر تنظيم الطاقة (Power Rails)'}</strong></td>
    </tr>
  </table>

  <!-- وصف العطل من العميل / الفني -->
  ${
    userMsg?.text
      ? `
  <div class="section-title">🔍 وصف المشكلة وسلوك الجهاز</div>
  <div style="font-size: 11px; padding: 6px 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 8px;">
    ${userMsg.text}
  </div>`
      : ''
  }

  <!-- تقرير التشخيص الهندسي وتوجيه المخطط -->
  <div class="section-title">🛠️ تقرير الفحص والتشخيص الهندسي للمخطط</div>
  <div class="diagnostic-text">${cleanAssistantText}</div>

  <!-- التكلفة والضمان -->
  <div class="section-title">💰 التكلفة المقدرة والضمان</div>
  <table>
    <tr>
      <th style="width: 25%;">التكلفة التقديرية للإصلاح</th>
      <td style="width: 25%;"><strong>يحدد حسب قطع الغيار</strong></td>
      <th style="width: 25%;">فترة الضمان على الإصلاح</th>
      <td style="width: 25%;">30 يوماً على المكونات المستبدلة</td>
    </tr>
  </table>

  <!-- إخلاء المسؤولية القانوني والهندسي -->
  <div class="disclaimer-box">
    <strong>⚠️ تنبيه هندسي وإخلاء مسؤولية:</strong>
    هذا التقرير صادر بناءً على فحص القياسات وتحليل المخططات الهندسية بالذكاء الاصطناعي. يُلزم الفني بإجراء فحص الممانعة بوضع الدايود على البوردة قبل البدء في حقن أي فولت أو استبدال الدوائر المتكاملة لتفادي تلف المعالج.
  </div>

  <!-- التوقيعات -->
  <div class="signatures">
    <div class="sig-block">
      <div>توقيع مهندس الصيانة</div>
      <div class="sig-line"></div>
    </div>
    <div class="sig-block">
      <div>توقيع واستلام العميل</div>
      <div class="sig-line"></div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>
`;

  // فتح نافذة طباعة نظيفة وتمرير المستند
  const printWindow = window.open('', '_blank', 'width=850,height=1000');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  }
}
