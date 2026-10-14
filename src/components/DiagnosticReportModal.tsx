'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  FileText,
  ShieldCheck,
  DollarSign,
  User,
  Phone,
  Store,
  Wrench,
  QrCode,
  Sparkles,
  Check,
} from 'lucide-react';
import {
  generateProfessionalDiagnosticPDF,
  DiagnosticReportOptions,
  DirectReportData,
} from '@/lib/pdfReportGenerator';
import { PowerSupplyReadings, DiagnosticMetrics, RepairSession } from '@/lib/types';

interface DiagnosticReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  directData?: {
    deviceModel: string;
    specialty?: string;
    readings?: PowerSupplyReadings;
    metrics?: DiagnosticMetrics;
    userPrompt?: string;
    diagnosticOutput: string;
  };
  session?: RepairSession;
}

const WARRANTY_OPTIONS = [
  '30 يوماً على المكونات المستبدلة',
  '14 يوماً (فترة تجربة)',
  'شهرين شامل قطع الغيار',
  '3 شهور ضمان معتمد',
  '6 شهور ضمان ذهبي',
  'بدون ضمان (بناءً على طلب العميل)',
];

export default function DiagnosticReportModal({
  isOpen,
  onClose,
  directData,
  session,
}: DiagnosticReportModalProps) {
  // بيانات الورشة (تُحفظ في التخزين المحلي)
  const [workshopName, setWorkshopName] = useState('');
  const [workshopPhone, setWorkshopPhone] = useState('');
  const [technicianName, setTechnicianName] = useState('');

  // بيانات العميل والتكلفة
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [repairCost, setRepairCost] = useState('350 ج.م');
  const [warrantyPeriod, setWarrantyPeriod] = useState(WARRANTY_OPTIONS[0]);
  const [notes, setNotes] = useState('');
  const [isSavedLocally, setIsSavedLocally] = useState(false);

  // استرجاع بيانات الورشة من localStorage عند فتح النافذة
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedWName = localStorage.getItem('dahab_workshop_name') || 'مركز دهب للإلكترونيات الدقيقة';
      const savedWPhone = localStorage.getItem('dahab_workshop_phone') || '01064147224';
      const savedTName = localStorage.getItem('dahab_technician_name') || 'م. إسلام دهب (كبير المهندسين)';

      setWorkshopName(savedWName);
      setWorkshopPhone(savedWPhone);
      setTechnicianName(savedTName);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // حفظ بيانات الورشة تلقائياً للاستخدام الدائم
  const handleSaveWorkshopDefaults = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dahab_workshop_name', workshopName);
      localStorage.setItem('dahab_workshop_phone', workshopPhone);
      localStorage.setItem('dahab_technician_name', technicianName);
      setIsSavedLocally(true);
      setTimeout(() => setIsSavedLocally(false), 2500);
    }
  };

  const handlePrint = () => {
    // حفظ التفضيلات أولاً
    handleSaveWorkshopDefaults();

    const reportOptions: DiagnosticReportOptions = {
      workshopName,
      workshopPhone,
      technicianName,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      repairCost: repairCost.trim() || undefined,
      warrantyPeriod,
      notes: notes.trim() || undefined,
    };

    if (session) {
      generateProfessionalDiagnosticPDF(session, reportOptions);
    } else if (directData) {
      const reportData: DirectReportData = {
        deviceModel: directData.deviceModel || 'جهاز إلكتروني',
        deviceType: directData.specialty,
        powerReadings: directData.readings,
        metrics: directData.metrics,
        userPrompt: directData.userPrompt,
        diagnosticOutput: directData.diagnosticOutput,
      };
      generateProfessionalDiagnosticPDF(reportData, reportOptions);
    }

    onClose();
  };

  const deviceModelTitle = session?.deviceModel || directData?.deviceModel || 'الجهاز الحالي';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-dahab-500/40 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-all text-right font-sans">
        
        {/* هيدر النافذة */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-dahab-500/5 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-dahab-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-sm sm:text-base text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                <span>تخصيص وطباعة تقرير الفحص المعتمد</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-dahab-500/20 text-dahab-700 dark:text-dahab-300 font-bold">A4 PDF + QR</span>
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                تقرير هندسي موجه للعميل يبرر تكلفة الصيانة ويوثق كفاءة الورشة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* جسم النافذة القابل للتمرير */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-gray-700 dark:text-gray-300">
          
          {/* بطاقة ملخص الجهاز المحدد */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-dahab-500" />
              <div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 block font-bold">الجهاز الخاضع للفحص:</span>
                <span className="text-xs font-black text-gray-900 dark:text-gray-100">{deviceModelTitle}</span>
              </div>
            </div>
            <div className="text-left flex items-center gap-1.5 text-[10px] text-dahab-700 dark:text-dahab-400 font-bold">
              <QrCode className="w-4 h-4" />
              <span>رمز QR توثيقي مدمج</span>
            </div>
          </div>

          {/* القسم الأول: بيانات مركز الصيانة */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-1.5">
              <h3 className="font-black text-xs text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-dahab-500" />
                <span>بيانات الورشة والمركز (تُحفظ تلقائياً لكل التقارير القادمة):</span>
              </h3>
              {isSavedLocally && (
                <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> تم حفظ بيانات الورشة
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  اسم مركز الصيانة / الورشة:
                </label>
                <div className="relative">
                  <Store className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    value={workshopName}
                    onChange={(e) => setWorkshopName(e.target.value)}
                    placeholder="مثال: مركز دهب للإلكترونيات"
                    className="w-full pr-9 pl-3 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  رقم هاتف الورشة / واتساب:
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    value={workshopPhone}
                    onChange={(e) => setWorkshopPhone(e.target.value)}
                    placeholder="مثال: 01064147224"
                    className="w-full pr-9 pl-3 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  اسم المهندس / الفني المشرف:
                </label>
                <div className="relative">
                  <Wrench className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    placeholder="مثال: م. إسلام دهب"
                    className="w-full pr-9 pl-3 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* القسم الثاني: بيانات العميل والتكلفة الخاصة بهذا الفحص */}
          <div className="space-y-3">
            <h3 className="font-black text-xs text-gray-900 dark:text-gray-100 flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-800 pb-1.5">
              <User className="w-3.5 h-3.5 text-dahab-500" />
              <span>بيانات العميل وفاتورة الإصلاح المقترحة:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  اسم العميل (اختياري):
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="مثال: أحمد عبد الله"
                    className="w-full pr-9 pl-3 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  رقم هاتف العميل (اختياري):
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="مثال: 01100000000"
                    className="w-full pr-9 pl-3 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  التكلفة التقديرية للإصلاح:
                </label>
                <div className="relative">
                  <DollarSign className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    value={repairCost}
                    onChange={(e) => setRepairCost(e.target.value)}
                    placeholder="مثال: 350 ج.م أو 50$"
                    className="w-full pr-9 pl-3 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500 font-bold text-amber-600 dark:text-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  مدة الضمان المعتمد:
                </label>
                <div className="relative">
                  <ShieldCheck className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-3" />
                  <select
                    value={warrantyPeriod}
                    onChange={(e) => setWarrantyPeriod(e.target.value)}
                    className="w-full pr-9 pl-3 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500"
                  >
                    {WARRANTY_OPTIONS.map((w, i) => (
                      <option key={i} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  ملاحظات أو شروط خاصة بالاستلام (اختياري):
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: البوردة تعرضت لسوائل مسبقة - يتم التسليم خلال 48 ساعة"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ذيل النافذة والأزرار */}
        <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleSaveWorkshopDefaults}
            type="button"
            className="text-[11px] text-gray-500 hover:text-dahab-600 dark:hover:text-dahab-400 font-bold transition flex items-center gap-1"
          >
            <span>💾 حفظ بيانات الورشة كافتراضية</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold transition"
            >
              إلغاء
            </button>
            <button
              onClick={handlePrint}
              type="button"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-dahab-500 to-amber-600 hover:from-dahab-600 hover:to-amber-700 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>معاينة وطباعة التقرير (A4 / PDF) 🖨️</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
