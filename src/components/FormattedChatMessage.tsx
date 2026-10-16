'use client';

import React from 'react';
import { cleanAIResponseText } from '@/lib/cleanResponse';

interface FormattedChatMessageProps {
  content: string;
  isAssistant?: boolean;
}

/**
 * 💬 مكون عرض رسائل الشات بتنسيق ماركداون وهندسي راقٍ
 * ينظف تلقائياً أي كتل JSON أو وسوم ميتريكس ويعرض المحادثة بألوان وعناوين وأزرار أنيقة
 */
export default function FormattedChatMessage({ content, isAssistant = true }: FormattedChatMessageProps) {
  const cleaned = cleanAIResponseText(content);
  if (!cleaned) return null;

  // للمستخدم العادي، اعرض النص مع الحفاظ على الأسطر
  if (!isAssistant) {
    return (
      <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-sans text-white">
        {cleaned}
      </p>
    );
  }

  // للمساعد الذكي، نقسم النص لفقرات ونعالج العناوين والقوائم
  const lines = cleaned.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: { items: string[]; isOrdered: boolean } | null = null;

  const flushList = () => {
    if (currentList) {
      elements.push(
        <ul
          key={`list-${elements.length}`}
          className="my-2 space-y-1.5 pr-4 list-none text-xs md:text-sm text-gray-800 dark:text-gray-200"
        >
          {currentList.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 leading-relaxed">
              <span className="shrink-0 text-amber-500 font-bold text-xs mt-0.5">
                {currentList?.isOrdered ? `${idx + 1}.` : '•'}
              </span>
              <span className="flex-1">{formatInlineText(item)}</span>
            </li>
          ))}
        </ul>
      );
      currentList = null;
    }
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      return;
    }

    // عناوين رئيسية H3 مثل: ### 1. التشريح الأولي
    if (line.startsWith('### ')) {
      flushList();
      const title = line.replace(/^###\s*/, '');
      elements.push(
        <div
          key={`h3-${idx}`}
          className="mt-3.5 mb-1.5 pb-1 border-b border-amber-500/20 text-xs md:text-sm font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5"
        >
          <span>{formatInlineText(title)}</span>
        </div>
      );
      return;
    }

    // عناوين فرعية H2 أو H1
    if (line.startsWith('## ') || line.startsWith('# ')) {
      flushList();
      const title = line.replace(/^#+\s*/, '');
      elements.push(
        <div
          key={`h2-${idx}`}
          className="mt-4 mb-2 p-1.5 px-3 rounded-lg bg-amber-500/10 border-r-4 border-amber-500 text-xs md:text-sm font-bold text-gray-900 dark:text-white"
        >
          <span>{formatInlineText(title)}</span>
        </div>
      );
      return;
    }

    // عناصر القوائم (النقطية أو المرقمة)
    const listMatch = line.match(/^[-*•]\s+(.*)$/) || line.match(/^(\d+[\.\)])\s+(.*)$/);
    if (listMatch) {
      const isOrdered = /^\d+[\.\)]/.test(line);
      const text = listMatch[listMatch.length - 1];

      if (!currentList || currentList.isOrdered !== isOrdered) {
        flushList();
        currentList = { items: [text], isOrdered };
      } else {
        currentList.items.push(text);
      }
      return;
    }

    flushList();

    // صناديق التنبيه والتحذير
    if (line.includes('⚠️') || line.startsWith('تحذير:') || line.startsWith('تنبيه:')) {
      elements.push(
        <div
          key={`warn-${idx}`}
          className="my-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-xs leading-relaxed flex items-start gap-2"
        >
          <span className="shrink-0 text-sm">⚠️</span>
          <div className="flex-1">{formatInlineText(line.replace(/^[⚠️\s]+/, ''))}</div>
        </div>
      );
      return;
    }

    // فقرة نصية عادية
    elements.push(
      <p key={`p-${idx}`} className="text-xs md:text-sm leading-relaxed my-1.5 text-gray-800 dark:text-gray-200">
        {formatInlineText(line)}
      </p>
    );
  });

  flushList();

  return <div className="space-y-1 font-sans">{elements}</div>;
}

/**
 * معالجة النصوص الداخلية للكلمات العريضة (Bold) والمكونات الإلكترونية
 */
function formatInlineText(text: string): React.ReactNode {
  // تجزئة النص حسب الكلمات العريضة **نص**
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={i} className="font-bold text-gray-950 dark:text-white">
          {boldText}
        </strong>
      );
    }

    // تلوين خفيف للأكواد والمصطلحات الإنجليزية مثل VDD_MAIN, PU301, 19V, 0.350V
    const subParts = part.split(/(\b[A-Z0-9_+]{3,}\b|\b\d+(?:\.\d+)?(?:V|A|mA|Ω|kΩ|uF|nF|pF)\b)/g);
    if (subParts.length > 1) {
      return subParts.map((sub, j) => {
        if (
          /^[A-Z0-9_+]{3,}$/.test(sub) ||
          /^\d+(?:\.\d+)?(?:V|A|mA|Ω|kΩ|uF|nF|pF)$/.test(sub)
        ) {
          return (
            <span
              key={`${i}-${j}`}
              className="inline-block px-1 py-0.2 mx-0.5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-mono text-[11px] text-dahab-600 dark:text-amber-400 font-semibold"
            >
              {sub}
            </span>
          );
        }
        return sub;
      });
    }

    return part;
  });
}
