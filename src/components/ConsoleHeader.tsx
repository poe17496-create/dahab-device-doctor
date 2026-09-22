'use client';

import React from 'react';
import { Cpu, Wrench, FileJson, PlusCircle, Database, ShieldCheck } from 'lucide-react';

interface ConsoleHeaderProps {
  sessionId: string;
  onNewSession: () => void;
  onOpenICModal: () => void;
  onExportJson: () => void;
  sessionsCount: number;
}

export default function ConsoleHeader({
  sessionId,
  onNewSession,
  onOpenICModal,
  onExportJson,
  sessionsCount,
}: ConsoleHeaderProps) {
  return (
    <header className="border-b border-workshop-border bg-workshop-card/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3 rounded-2xl shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* الشعار والهوية */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-dahab-400 via-dahab-500 to-amber-700 flex items-center justify-center shadow-lg shadow-dahab-500/20 text-slate-950 font-black text-2xl border border-dahab-300">
            <Cpu className="w-7 h-7 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-dahab-400 to-amber-200 bg-clip-text text-transparent">
                Dahab Device Doctor 🛠️⚡
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-dahab-500/20 text-dahab-400 border border-dahab-500/30">
                FixAI v2.0
              </span>
            </div>
            <p className="text-xs text-gray-400">
              المنظومة الهندسية الأولى بالشرق الأوسط لتشخيص وفصل أعطال (الهاردوير والسوفتوير)
            </p>
          </div>
        </div>

        {/* أزرار الإجراءات السريعة */}
        <div className="flex items-center flex-wrap gap-2">
          {/* مؤشر حالة الذاكرة والاتصال */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>ذاكرة الـ JSON نشطة ({sessionsCount} جهاز)</span>
          </div>

          {/* زر بدائل الآيسيهات */}
          <button
            onClick={onOpenICModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 text-xs font-bold transition shadow-sm"
          >
            <Database className="w-4 h-4 text-dahab-400" />
            <span>بدائل الآيسيهات</span>
          </button>

          {/* زر تصدير ملف الـ JSON */}
          <button
            onClick={onExportJson}
            title="تصدير ملف الجلسة بصيغة JSON لكي لا ينسى الذكاء الاصطناعي أي تفصيلة"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 text-xs font-bold transition shadow-sm"
          >
            <FileJson className="w-4 h-4 text-sky-400" />
            <span>تحميل JSON</span>
          </button>

          {/* زر جلسة فحص جديدة */}
          <button
            onClick={onNewSession}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-dahab-500 to-amber-600 hover:from-dahab-600 hover:to-amber-700 text-slate-950 text-xs font-extrabold transition shadow-lg shadow-dahab-500/25"
          >
            <PlusCircle className="w-4 h-4" />
            <span>جهاز جديد</span>
          </button>
        </div>
      </div>
    </header>
  );
}
