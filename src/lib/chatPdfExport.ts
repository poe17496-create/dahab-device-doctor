/**
 * 📄 تصدير سجل محادثة المساعد الذكي إلى تقرير PDF هندسي معتمد جاهز للطباعة والحفظ
 */

import { formatReportMarkdownToHtml } from './cleanResponse';

export interface ChatExportMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string | Date;
  image?: string;
}

export function exportChatAsPDF(
  messages: ChatExportMessage[],
  technicianInfo?: { name?: string; username?: string; workshopName?: string }
) {
  if (typeof window === 'undefined') return;

  const techName = technicianInfo?.name || 'مهندس فحص الدوائر الإلكترونية';
  const workshopName = technicianInfo?.workshopName || localStorage.getItem('dahab_workshop_name') || 'مركز دهب للهندسة وصيانة الإلكترونيات الدقيقة';
  const dateStr = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const sessionCode = `CHT-${Math.floor(100000 + Math.random() * 900000)}`;

  // تصفية الرسائل وتحويلها لعناصر HTML
  const chatItemsHtml = messages
    .filter((m) => m.content && m.content.trim().length > 0)
    .map((m, idx) => {
      const isUser = m.role === 'user';
      const time = new Date(m.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
      const roleLabel = isUser ? '👨‍🔧 استفسار المهندس / الفني' : '🤖 تحليل واستشارة مساعد دهب الهندسي';
      const bubbleClass = isUser ? 'bubble-user' : 'bubble-assistant';
      const formattedContent = isUser
        ? `<p style="margin: 0; white-space: pre-wrap; font-size: 11px;">${m.content}</p>`
        : formatReportMarkdownToHtml(m.content);

      const imageHtml = m.image
        ? `<div style="margin-top: 8px;"><img src="${m.image}" style="max-height: 160px; max-width: 100%; border-radius: 8px; border: 1px solid #cbd5e1;" alt="مرفق فحص" /></div>`
        : '';

      return `
        <div class="message-card ${bubbleClass}">
          <div class="msg-header">
            <span class="role-badge">${roleLabel}</span>
            <span class="msg-time">${time}</span>
          </div>
          <div class="msg-body">
            ${formattedContent}
            ${imageHtml}
          </div>
        </div>
      `;
    })
    .join('\n');

  const printHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تقرير استشارة ومحادثة هندسية - ${sessionCode}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm 15mm 15mm;
    }
    * { box-sizing: border-box; }
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
    }
    @media print {
      body { background: #fff; }
      .page-container {
        margin: 0;
        padding: 0;
        border: none;
        box-shadow: none;
        max-width: 100%;
      }
      .no-print { display: none !important; }
    }
    .action-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #0f172a;
      color: #fff;
      padding: 10px 18px;
      border-radius: 12px;
      margin-bottom: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .btn-print {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #000;
      border: none;
      padding: 8px 20px;
      font-size: 12.5px;
      font-weight: 900;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .btn-print:hover { opacity: 0.95; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #f59e0b;
      padding-bottom: 14px;
      margin-bottom: 16px;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      margin: 0 0 4px;
    }
    .brand-sub {
      font-size: 11px;
      color: #64748b;
      margin: 0;
    }
    .meta-box {
      text-align: left;
      font-size: 10.5px;
      color: #475569;
      line-height: 1.6;
    }
    .meta-box strong { color: #0f172a; }
    .chat-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
    }
    .message-card {
      border-radius: 12px;
      padding: 12px 16px;
      border: 1px solid #e2e8f0;
      page-break-inside: avoid;
    }
    .bubble-user {
      background: #f1f5f9;
      border-right: 4px solid #3b82f6;
    }
    .bubble-assistant {
      background: #ffffff;
      border-right: 4px solid #f59e0b;
      border-color: #fde68a;
    }
    .msg-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      padding-bottom: 4px;
      border-bottom: 1px solid rgba(0,0,0,0.06);
    }
    .role-badge {
      font-size: 11px;
      font-weight: 800;
      color: #1e293b;
    }
    .msg-time {
      font-size: 9.5px;
      color: #64748b;
    }
    .msg-body {
      font-size: 11px;
      line-height: 1.6;
      color: #1e293b;
    }
    .footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9.5px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width: 820px; margin: 15px auto 0;">
    <div class="action-bar">
      <div>
        <strong style="color: #f59e0b; font-size: 13px;">سجل المحادثة والاستشارة الهندسية جاهز للحفظ كـ PDF</strong>
        <span style="font-size: 11px; color: #9ca3af; margin-right: 8px;">(اختر Save as PDF من نافذة الطباعة)</span>
      </div>
      <button class="btn-print" onclick="window.print()">
        <span>🖨️ طباعة السجل / حفظ كـ PDF</span>
      </button>
    </div>
  </div>

  <div class="page-container">
    <div class="header">
      <div>
        <h1 class="brand-title">⚡ ${workshopName}</h1>
        <p class="brand-sub">سجل فحص واستشارة هندسية عبر مساعد دهب دكتور الذكي</p>
      </div>
      <div class="meta-box">
        <div><strong>رقم الجلسة:</strong> #${sessionCode}</div>
        <div><strong>تاريخ الاستشارة:</strong> ${dateStr}</div>
        <div><strong>المهندس:</strong> ${techName}</div>
      </div>
    </div>

    <div class="chat-container">
      ${chatItemsHtml}
    </div>

    <div class="footer">
      <div>صادر عن منظومة دهب دكتور (Dahab Device Doctor) - المنظومة الهندسية المعتمدة</div>
      <div>صفحة 1 من 1 • توثيق فني معتمد</div>
    </div>
  </div>

  <script>
    // فتح نافذة الطباعة تلقائياً بعد التحميل
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  }
}
