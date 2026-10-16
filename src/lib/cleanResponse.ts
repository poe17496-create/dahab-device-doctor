/**
 * 🧹 وحدة تنظيف وتنسيق نصوص الذكاء الاصطناعي (AI Response & JSON Sanitizer)
 * تزيل كافة كتل الـ JSON غير المرغوبة، وسوم الميتريكس، وتحول النصوص لشكل احترافي نقي
 */

/**
 * تنظيف نصوص الذكاء الاصطناعي من أي كتل JSON أو وسوم ميتريكس سواء كانت مكتملة أو أثناء البث المباشر
 */
export function cleanAIResponseText(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // 1. إزالة كتل الميتريكس الهندسية المغلقة
  cleaned = cleaned.replace(/<<<DAHAB_DIAGNOSTIC_METRICS>>>[\s\S]*?<<<END_DAHAB_METRICS>>>/g, '');

  // 2. إزالة وسوم الميتريكس الجزئية غير المغلقة (تحدث أثناء التدفق الحي Streaming)
  cleaned = cleaned.replace(/<<<DAHAB_DIAGNOSTIC_METRICS>>>[\s\S]*$/g, '');
  cleaned = cleaned.replace(/<<<END_DAHAB_METRICS>>>/g, '');

  // 3. فحص إذا كان الرد كائناً بصيغة JSON بالكامل واستخراج الحقل النصي المفيد منه
  const trimmed = cleaned.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed.message === 'string') cleaned = parsed.message;
      else if (typeof parsed.response === 'string') cleaned = parsed.response;
      else if (typeof parsed.text === 'string') cleaned = parsed.text;
      else if (typeof parsed.diagnosticOutput === 'string') cleaned = parsed.diagnosticOutput;
      else if (typeof parsed.answer === 'string') cleaned = parsed.answer;
      else if (typeof parsed.description === 'string') cleaned = parsed.description;
      else if (parsed.classification && parsed.recommendedAction) {
        // إذا كان كائن ميتريكس بحت، تحويله لنص عربي مفهوم
        cleaned = `التصنيف: ${parsed.classification}\nالمكون المشتبه به: ${parsed.primarySuspectComponent || 'غير محدد'}\nالإجراء الموصى به: ${parsed.recommendedAction}`;
      }
    } catch {
      // ليس JSON صالحاً، استمر
    }
  }

  // 4. إزالة كتل كود JSON المباشرة إذا كانت تحتوي على ميتريكس برمجية
  cleaned = cleaned.replace(/```json\s*\{[\s\S]*?"classification"[\s\S]*?\}\s*```/gi, '');
  cleaned = cleaned.replace(/```\s*\{[\s\S]*?"classification"[\s\S]*?\}\s*```/gi, '');

  // 5. إزالة أي كتل JSON للميتريكس ظهرت بدون كود بلوك
  cleaned = cleaned.replace(/\{\s*"classification"[\s\S]*?"recommendedAction"[\s\S]*?\}/gi, '');

  // 6. تنظيف أي كود بلوك JSON خام متبقي لا يحتوي على نص عادي
  cleaned = cleaned.replace(/```json\s*\{[\s\S]*?\}\s*```/gi, (match) => {
    try {
      const jsonStr = match.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      if (parsed.message) return parsed.message;
      if (parsed.response) return parsed.response;
      if (parsed.text) return parsed.text;
      if (parsed.answer) return parsed.answer;
    } catch {}
    return match;
  });

  // 7. إزالة المسافات والأسطر الفارغة المتكررة
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
}

/**
 * تحويل نص التقرير من Markdown إلى HTML أنيق مخصص لمولد ملفات الـ PDF
 */
export function formatReportMarkdownToHtml(markdown: string): string {
  const text = cleanAIResponseText(markdown);
  if (!text) return '<p>لا يوجد محتوى للتقرير.</p>';

  const lines = text.split('\n');
  const htmlParts: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (!line) {
      if (inList) {
        htmlParts.push('</ul>');
        inList = false;
      }
      continue;
    }

    // عناوين رئيسية H3
    if (line.startsWith('### ')) {
      if (inList) {
        htmlParts.push('</ul>');
        inList = false;
      }
      const title = line.replace(/^###\s*/, '').trim();
      htmlParts.push(`<h4 style="margin: 14px 0 6px; color: #1e3a8a; font-size: 11.5px; font-weight: 800; border-bottom: 1px dashed #cbd5e1; padding-bottom: 3px;">${title}</h4>`);
      continue;
    }

    // عناوين فرعية H2 أو H1
    if (line.startsWith('## ') || line.startsWith('# ')) {
      if (inList) {
        htmlParts.push('</ul>');
        inList = false;
      }
      const title = line.replace(/^#+\s*/, '').trim();
      htmlParts.push(`<h3 style="margin: 16px 0 8px; color: #b45309; font-size: 12.5px; font-weight: 900; background: #fffbeb; padding: 4px 8px; border-radius: 6px; border-right: 3px solid #f59e0b;">${title}</h3>`);
      continue;
    }

    // عناصر القوائم (- أو * أو رقم.)
    const listMatch = line.match(/^[-*•]\s+(.*)$/) || line.match(/^(\d+[\.\)])\s+(.*)$/);
    if (listMatch) {
      if (!inList) {
        htmlParts.push('<ul style="margin: 4px 0 8px; padding-right: 18px; list-style-type: disc;">');
        inList = true;
      }
      let content = listMatch[listMatch.length - 1];
      // تنسيق الكلمات العريضة **...**
      content = content.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #0f172a;">$1</strong>');
      htmlParts.push(`<li style="margin-bottom: 4px; line-height: 1.5; color: #334155;">${content}</li>`);
      continue;
    }

    // إذا لم نعد في قائمة
    if (inList) {
      htmlParts.push('</ul>');
      inList = false;
    }

    // فقرة عادية
    let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #0f172a;">$1</strong>');
    // تلوين التحذيرات الهندسية
    if (formattedLine.includes('⚠️') || formattedLine.includes('تحذير')) {
      htmlParts.push(`<div style="margin: 6px 0; padding: 6px 10px; background: #fff7ed; border-right: 3px solid #ea580c; border-radius: 4px; font-size: 10px; color: #9a3412;">${formattedLine}</div>`);
    } else {
      htmlParts.push(`<p style="margin: 4px 0 6px; line-height: 1.6; color: #1e293b;">${formattedLine}</p>`);
    }
  }

  if (inList) {
    htmlParts.push('</ul>');
  }

  return htmlParts.join('\n');
}
