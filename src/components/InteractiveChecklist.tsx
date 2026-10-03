'use client';

import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, ShieldCheck, HelpCircle, Plus, Trash2, Edit, RotateCcw, TrendingUp, AlertTriangle, X } from 'lucide-react';
import { useDiagnosticContext } from '@/contexts/DiagnosticContext';

interface ChecklistItem {
  id: string;
  label: string;
  standard: string;
  category: 'hardware' | 'software';
  checked: boolean;
  priority: 'high' | 'medium' | 'low';
}

const DEFAULT_ITEMS: ChecklistItem[] = [
  {
    id: '1',
    label: 'فحص ممانعة خط التغذية الرئيسي (VDD_MAIN / VPH_PWR)',
    standard: 'الممانعة السليمة بين 0.350V و 0.450V على وضع الدايود',
    category: 'hardware',
    checked: false,
    priority: 'high',
  },
  {
    id: '2',
    label: 'فحص استجابة وزر الباور وسقوط الجهد للصفر عند الضغط',
    standard: 'الجهد الطبيعي على الزر 1.8V أو 3.3V ويسقط إلى 0.0V',
    category: 'hardware',
    checked: false,
    priority: 'high',
  },
  {
    id: '3',
    label: 'فحص خطوط الخرج لآيسي الباور الثانوي (BUCK LDOs)',
    standard: 'عدم وجود شورت صريح، فولتات المعالج والرامات سليمة',
    category: 'hardware',
    checked: false,
    priority: 'high',
  },
  {
    id: '4',
    label: 'اختبار التعرف في وضع الطوارئ بالكمبيوتر (EDL / DFU / Fastboot)',
    standard: 'ظهور المنفذ في Device Manager دون اختفاء متكرر',
    category: 'software',
    checked: false,
    priority: 'medium',
  },
  {
    id: '5',
    label: 'فحص سلامة مقاومات رفع ناقل البيانات (I2C Pull-Up Resistors)',
    standard: 'قيمة المقاومة 2.2KΩ مع وجود جهد 1.8V على طرفيها',
    category: 'hardware',
    checked: false,
    priority: 'medium',
  },
  {
    id: '6',
    label: 'فحص جهد شحن البطارية (VBAT / BATT_SENSE)',
    standard: 'الجهد الطبيعي 3.7V - 4.2V مع عدم وجود تسريب',
    category: 'hardware',
    checked: false,
    priority: 'high',
  },
  {
    id: '7',
    label: 'فحص دائرة ساعة المعالج (RTC / Crystal)',
    standard: 'المذبذب يعطي 32.768KHz بدون توقف',
    category: 'hardware',
    checked: false,
    priority: 'medium',
  },
  {
    id: '8',
    label: 'فحص الاتصال بين المعالج والذاكرة (Memory Bus)',
    standard: 'عدم وجود قصر على خطوط العنوان والبيانات',
    category: 'hardware',
    checked: false,
    priority: 'high',
  },
  {
    id: '9',
    label: 'اختبار الشاشة وخطوط الإضاءة (Display / Backlight)',
    standard: 'ELVDD 4.6V و ELVSS -4.0V مع إشارة MIPI سليمة',
    category: 'hardware',
    checked: false,
    priority: 'medium',
  },
  {
    id: '10',
    label: 'فحص استجابة اللمس (Touch Screen IC)',
    standard: 'جهد التشغيل 1.8V - 3.3V مع إشارات I2C سليمة',
    category: 'hardware',
    checked: false,
    priority: 'low',
  },
  {
    id: '11',
    label: 'اختبار اتصال Wi-Fi و Bluetooth',
    standard: 'MAC Address ظاهر بدون جميع الأصفار',
    category: 'software',
    checked: false,
    priority: 'low',
  },
  {
    id: '12',
    label: 'فحص البطارية والصحة العامة (Battery Health)',
    standard: 'السعة أعلى من 80% مع عدم وجود انتفاخ',
    category: 'hardware',
    checked: false,
    priority: 'medium',
  },
];

export default function InteractiveChecklist() {
  const { setChecklistProgress } = useDiagnosticContext();
  const [items, setItems] = useState<ChecklistItem[]>(DEFAULT_ITEMS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [newItem, setNewItem] = useState({
    label: '',
    standard: '',
    category: 'hardware' as 'hardware' | 'software',
    priority: 'medium' as 'high' | 'medium' | 'low',
  });

  // تحميل العناصر المخصصة من localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dahab_custom_checklist');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setItems([...DEFAULT_ITEMS, ...parsed]);
          }
        }
      } catch {}
    }
  }, []);

  // حفظ العناصر المخصصة في localStorage
  const saveCustomItems = (customItems: ChecklistItem[]) => {
    try {
      localStorage.setItem('dahab_custom_checklist', JSON.stringify(customItems));
    } catch {}
  };

  const toggleCheck = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const completedCount = items.filter((i) => i.checked).length;
  const highPriorityCount = items.filter((i) => i.priority === 'high' && !i.checked).length;
  const progressPercentage = (completedCount / items.length) * 100;

  // تحديث الـ Context عند تغيير الحالة
  useEffect(() => {
    setChecklistProgress({
      total: items.length,
      completed: completedCount,
      items: items,
    });
  }, [items, completedCount, setChecklistProgress]);

  // إضافة عنصر جديد
  const handleAddItem = () => {
    if (!newItem.label || !newItem.standard) {
      alert('يرجى إدخال العنوان والمعيار');
      return;
    }

    const customItem: ChecklistItem = {
      id: `custom_${Date.now()}`,
      label: newItem.label,
      standard: newItem.standard,
      category: newItem.category,
      priority: newItem.priority,
      checked: false,
    };

    const customItems = items.filter((i) => i.id.startsWith('custom_'));
    const updatedCustomItems = [customItem, ...customItems];
    const updatedItems = [...DEFAULT_ITEMS, ...updatedCustomItems];

    setItems(updatedItems);
    saveCustomItems(updatedCustomItems);
    setNewItem({ label: '', standard: '', category: 'hardware', priority: 'medium' });
    setShowAddModal(false);
  };

  // حذف عنصر مخصص
  const handleDeleteItem = (id: string) => {
    if (!id.startsWith('custom_')) return; // لا يمكن حذف العناصر الافتراضية

    const updated = items.filter((i) => i.id !== id);
    const customItems = updated.filter((i) => i.id.startsWith('custom_'));
    setItems(updated);
    saveCustomItems(customItems);
  };

  // تعديل عنصر
  const handleEditItem = (item: ChecklistItem) => {
    setEditingItem(item);
    setNewItem({
      label: item.label,
      standard: item.standard,
      category: item.category,
      priority: item.priority,
    });
    setShowAddModal(true);
  };

  // حفظ التعديل
  const handleSaveEdit = () => {
    if (!editingItem || !newItem.label || !newItem.standard) {
      alert('يرجى إدخال العنوان والمعيار');
      return;
    }

    const updated = items.map((i) =>
      i.id === editingItem.id
        ? { ...i, label: newItem.label, standard: newItem.standard, category: newItem.category, priority: newItem.priority }
        : i
    );

    const customItems = updated.filter((i) => i.id.startsWith('custom_'));
    setItems(updated);
    saveCustomItems(customItems);
    setEditingItem(null);
    setNewItem({ label: '', standard: '', category: 'hardware', priority: 'medium' });
    setShowAddModal(false);
  };

  // إعادة تعيين القائمة
  const handleReset = () => {
    if (confirm('هل تريد إعادة تعيين جميع العناصر إلى حالة غير مكتملة؟')) {
      const resetItems = items.map((i) => ({ ...i, checked: false }));
      setItems(resetItems);
    }
  };

  return (
    <div className="bg-workshop-card border border-workshop-border rounded-2xl p-4 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-xs text-gray-200">
            قائمة نقاط الفحص والقياس الإلزامية (Engineering Checklist)
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {highPriorityCount > 0 && (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {highPriorityCount} عالية الأولوية
            </span>
          )}
          <span className="text-[11px] font-bold text-dahab-400 bg-dahab-500/10 px-2 py-0.5 rounded-full">
            مكتمل: {completedCount} من {items.length}
          </span>
        </div>
      </div>

      {/* شريط التقدم */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">نسبة الإنجاز</span>
          <span className="font-bold text-emerald-400">{progressPercentage.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-dahab-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* أزرار التحكم */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dahab-500/10 hover:bg-dahab-500/20 text-dahab-400 text-xs font-bold transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>إضافة نقطة فحص</span>
        </button>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs font-bold transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>إعادة تعيين</span>
        </button>
      </div>

      {/* قائمة العناصر */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleCheck(item.id)}
            className={`p-2.5 rounded-xl border flex items-start gap-3 cursor-pointer transition group ${
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
            <div className="flex-1 min-w-0">
              <div
                className={`text-xs font-bold flex items-center gap-2 ${
                  item.checked ? 'line-through text-gray-400' : 'text-gray-200'
                }`}
              >
                {item.label}
                {item.priority === 'high' && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold shrink-0">
                    عالية
                  </span>
                )}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                <span>المعيار: {item.standard}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                  item.category === 'hardware'
                    ? 'bg-rose-500/10 text-rose-400'
                    : 'bg-sky-500/10 text-sky-400'
                }`}
              >
                {item.category === 'hardware' ? 'هاردوير' : 'سوفتوير'}
              </span>
              {item.id.startsWith('custom_') && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditItem(item);
                    }}
                    className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition"
                    title="تعديل"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('هل تريد حذف هذه النقطة؟')) {
                        handleDeleteItem(item.id);
                      }
                    }}
                    className="p-1 rounded hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition"
                    title="حذف"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal إضافة/تعديل عنصر */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-workshop-card border border-workshop-border rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-200">
                {editingItem ? 'تعديل نقطة الفحص' : 'إضافة نقطة فحص جديدة'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingItem(null);
                  setNewItem({ label: '', standard: '', category: 'hardware', priority: 'medium' });
                }}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">العنوان *</label>
                <input
                  type="text"
                  value={newItem.label}
                  onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                  placeholder="مثال: فحص جهد الشحن"
                  className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-200 outline-none focus:border-dahab-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">المعيار *</label>
                <textarea
                  value={newItem.standard}
                  onChange={(e) => setNewItem({ ...newItem, standard: e.target.value })}
                  placeholder="المعيار المطلوب للفحص..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-200 outline-none focus:border-dahab-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">الفئة</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value as 'hardware' | 'software' })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-200 outline-none focus:border-dahab-500"
                  >
                    <option value="hardware">هاردوير</option>
                    <option value="software">سوفتوير</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">الأولوية</label>
                  <select
                    value={newItem.priority}
                    onChange={(e) => setNewItem({ ...newItem, priority: e.target.value as 'high' | 'medium' | 'low' })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-200 outline-none focus:border-dahab-500"
                  >
                    <option value="high">عالية</option>
                    <option value="medium">متوسطة</option>
                    <option value="low">منخفضة</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={editingItem ? handleSaveEdit : handleAddItem}
                className="flex-1 px-4 py-2 rounded-xl bg-dahab-500 hover:bg-dahab-600 text-slate-950 text-xs font-black transition shadow-sm"
              >
                {editingItem ? 'حفظ التعديل' : 'إضافة'}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingItem(null);
                  setNewItem({ label: '', standard: '', category: 'hardware', priority: 'medium' });
                }}
                className="flex-1 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
