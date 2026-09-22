'use client';

import React, { useState } from 'react';
import { CheckSquare, Square, ShieldCheck, HelpCircle } from 'lucide-react';

interface ChecklistItem {
  id: string;
  label: string;
  standard: string;
  category: 'hardware' | 'software';
  checked: boolean;
}

const DEFAULT_ITEMS: ChecklistItem[] = [
  {
    id: '1',
    label: 'فحص ممانعة خط التغذية الرئيسي (VDD_MAIN / VPH_PWR)',
    standard: 'الممانعة السليمة بين 0.350V و 0.450V على وضع الدايود',
    category: 'hardware',
    checked: false,
  },
  {
    id: '2',
    label: 'فحص استجابة وزر الباور وسقوط الجهد للصفر عند الضغط',
    standard: 'الجهد الطبيعي على الزر 1.8V أو 3.3V ويسقط إلى 0.0V',
    category: 'hardware',
    checked: false,
  },
  {
    id: '3',
    label: 'فحص خطوط الخرج لآيسي الباور الثانوي (BUCK LDOs)',
    standard: 'عدم وجود شورت صريح، فولتات المعالج والرامات سليمة',
    category: 'hardware',
    checked: false,
  },
  {
    id: '4',
    label: 'اختبار التعرف في وضع الطوارئ بالكمبيوتر (EDL / DFU / Fastboot)',
    standard: 'ظهور المنفذ في Device Manager دون اختفاء متكرر',
    category: 'software',
    checked: false,
  },
  {
    id: '5',
    label: 'فحص سلامة مقاومات رفع ناقل البيانات (I2C Pull-Up Resistors)',
    standard: 'قيمة المقاومة 2.2KΩ مع وجود جهد 1.8V على طرفيها',
    category: 'hardware',
    checked: false,
  },
];

export default function InteractiveChecklist() {
  const [items, setItems] = useState<ChecklistItem[]>(DEFAULT_ITEMS);

  const toggleCheck = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const completedCount = items.filter((i) => i.checked).length;

  return (
    <div className="bg-workshop-card border border-workshop-border rounded-2xl p-4 shadow-xl space-y-3">
      <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-xs text-gray-200">
            قائمة نقاط الفحص والقياس الإلزامية (Engineering Checklist)
          </h3>
        </div>
        <span className="text-[11px] font-bold text-dahab-400 bg-dahab-500/10 px-2 py-0.5 rounded-full">
          مكتمل: {completedCount} من {items.length}
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleCheck(item.id)}
            className={`p-2.5 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
              item.checked
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                : 'bg-gray-900/60 border-gray-800/90 text-gray-300 hover:bg-gray-850'
            }`}
          >
            <button type="button" className="mt-0.5 text-dahab-400">
              {item.checked ? (
                <CheckSquare className="w-4 h-4 text-emerald-400" />
              ) : (
                <Square className="w-4 h-4 text-gray-500" />
              )}
            </button>
            <div className="flex-1">
              <div
                className={`text-xs font-bold ${
                  item.checked ? 'line-through text-gray-400' : 'text-gray-200'
                }`}
              >
                {item.label}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                <span>المعيار: {item.standard}</span>
              </div>
            </div>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                item.category === 'hardware'
                  ? 'bg-rose-500/10 text-rose-400'
                  : 'bg-sky-500/10 text-sky-400'
              }`}
            >
              {item.category === 'hardware' ? 'هاردوير' : 'سوفتوير'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
