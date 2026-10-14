'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Wrench,
  CheckCircle2,
  Smartphone,
  Laptop,
  Cpu,
  AlertTriangle,
  Sparkles,
  Send,
  User,
  Layers,
} from 'lucide-react';

interface ShareRepairCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDeviceModel?: string;
  initialSymptoms?: string;
  initialDiagnosis?: string;
}

export default function ShareRepairCaseModal({
  isOpen,
  onClose,
  initialDeviceModel = '',
  initialSymptoms = '',
  initialDiagnosis = '',
}: ShareRepairCaseModalProps) {
  const [technicianName, setTechnicianName] = useState('');
  const [deviceBrand, setDeviceBrand] = useState('Apple');
  const [deviceModel, setDeviceModel] = useState(initialDeviceModel);
  const [deviceCategory, setDeviceCategory] = useState<'mobile' | 'laptop' | 'desktop'>('mobile');
  const [title, setTitle] = useState('');
  const [symptoms, setSymptoms] = useState(initialSymptoms);
  const [solution, setSolution] = useState(initialDiagnosis);
  const [suspectedComponent, setSuspectedComponent] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState('متوسط');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUserStr = localStorage.getItem('dahab_current_user');
      if (savedUserStr) {
        try {
          const u = JSON.parse(savedUserStr);
          if (u.name) setTechnicianName(u.name);
        } catch (e) {}
      }
      if (!technicianName) {
        const savedTech = localStorage.getItem('dahab_technician_name') || '';
        if (savedTech) setTechnicianName(savedTech);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialDeviceModel) setDeviceModel(initialDeviceModel);
    if (initialSymptoms) setSymptoms(initialSymptoms);
    if (initialDiagnosis) setSolution(initialDiagnosis);
  }, [initialDeviceModel, initialSymptoms, initialDiagnosis]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim() || !deviceModel.trim() || !solution.trim()) {
      setErrorMsg('يرجى كتابة عنوان العطل، موديل الجهاز، وطريقة الحل المتبعة.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/case-studies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          deviceBrand,
          deviceModel: deviceModel.trim(),
          deviceCategory,
          faultCategory: 'Power & Circuit Repair',
          symptoms: symptoms.trim() || title.trim(),
          diagnosis: 'فحص ممانعات وخطوط الباور بالدايود مود',
          solution: solution.trim(),
          relatedIcs: suspectedComponent.trim() ? [suspectedComponent.trim()] : [],
          difficultyLevel,
          technicianName: technicianName.trim() || 'مهندس بالمنظومة',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل في حفظ التجربة');
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء الإرسال. حاول مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn font-sans text-right">
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-dahab-500/40 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-all">
        
        {/* هيدر النافذة */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-dahab-500/5 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-dahab-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-md">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-sm sm:text-base text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                <span>مشاركة تجربة إصلاح ناجحة مع مجتمع الصيانة</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                  Community Verified
                </span>
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                تجاربك العملية تخدم آلاف الفنيين وتُعتمد رسمياً في موسوعة الأعطال
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

        {/* جسم الفورم */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-gray-700 dark:text-gray-300">
          
          {success ? (
            <div className="p-8 text-center space-y-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-emerald-700 dark:text-emerald-300">
                تسلم إيدك يا هندسة! تم استلام تجربتك بنجاح 👏
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                تم رفع التجربة لقاعدة البيانات، وسيتم مراجعتها واعتمادها من المشرف العام وإضافتها لموسوعة الأعطال التشاركية باسمك.
              </p>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* بيانات الفني والجهاز */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                    اسمك أو اسم ورشة الصيانة:
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-3" />
                    <input
                      type="text"
                      value={technicianName}
                      onChange={(e) => setTechnicianName(e.target.value)}
                      placeholder="مثال: م. أحمد عبد الفتاح"
                      className="w-full pr-9 pl-3 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                    فئة الجهاز:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'mobile' as const, label: '📱 هاتف' },
                      { id: 'laptop' as const, label: '💻 لابتوب' },
                      { id: 'desktop' as const, label: '🖥️ كارت/بوردة' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setDeviceCategory(cat.id)}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition border ${
                          deviceCategory === cat.id
                            ? 'bg-dahab-500 text-slate-950 border-dahab-600 shadow-sm'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                    الشركة المصنعة (الماركة):
                  </label>
                  <select
                    value={deviceBrand}
                    onChange={(e) => setDeviceBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500"
                  >
                    <option value="Apple">Apple</option>
                    <option value="Samsung">Samsung</option>
                    <option value="Xiaomi">Xiaomi / Redmi</option>
                    <option value="Huawei">Huawei / Honor</option>
                    <option value="Oppo">Oppo / Realme</option>
                    <option value="Dell">Dell</option>
                    <option value="HP">HP</option>
                    <option value="Lenovo">Lenovo</option>
                    <option value="ASUS">ASUS</option>
                    <option value="Acer">Acer</option>
                    <option value="Other">ماركة أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                    موديل الجهاز بالتحديد:
                  </label>
                  <input
                    type="text"
                    value={deviceModel}
                    onChange={(e) => setDeviceModel(e.target.value)}
                    placeholder="مثال: iPhone 13 Pro Max أو Dell Inspiron 5521"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500 font-bold"
                    required
                  />
                </div>
              </div>

              {/* عنوان العطل ومظهره */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  عنوان العطل المختصر:
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: قاطع باور مع سحب 0.35A فوري وسخونة بآيسي الشحن"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500 font-bold text-amber-600 dark:text-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  أعراض وسلوك الجهاز بالتفصيل (سحب الباور، الممانعات، المؤشرات):
                </label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="مثلاً: عند ربط الجهاز بالباور يسحب تيار 0.25A دون الضغط على مفتاح التشغيل مع هبوط ممانعة خط VDD_MAIN إلى 0.040V..."
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500 resize-none"
                />
              </div>

              {/* الحل والقطع المستبدلة */}
              <div>
                <label className="block text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>طريقة الحل الناجحة والقطع التي قمت بتغييرها (الحل الهندسي):</span>
                </label>
                <textarea
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  placeholder="مثلاً: قمت برفع آيسي الشحن BQ25601 وعاد سحب التيار لطبيعته، تم استبداله من بوردة تشليح وعادت دورة الشحن للعمل بنجاح."
                  rows={3}
                  className="w-full px-3 py-2 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500 resize-none font-sans"
                  required
                />
              </div>

              {/* المكون ومستوى الصعوبة */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                    كود الآيسي / المكون المسبب (اختياري):
                  </label>
                  <input
                    type="text"
                    value={suspectedComponent}
                    onChange={(e) => setSuspectedComponent(e.target.value)}
                    placeholder="مثال: U2 / BQ25601 / C3201"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                    درجة صعوبة الإصلاح:
                  </label>
                  <select
                    value={difficultyLevel}
                    onChange={(e) => setDifficultyLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500"
                  >
                    <option value="سهل">سهل (استبدال مباشر)</option>
                    <option value="متوسط">متوسط (تتبع مسارات ولحام دقيق)</option>
                    <option value="متقدم">متقدم (شبلنة وتغيير BGA)</option>
                    <option value="خبير">خبير (سواب معالج وذاكرة CPU/NAND Swap)</option>
                  </select>
                </div>
              </div>

              {/* أزرار الإجراء */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold transition hover:bg-gray-300 dark:hover:bg-gray-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-dahab-500 to-amber-600 hover:from-dahab-600 hover:to-amber-700 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-md active:scale-95 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>جاري الرفع...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>إرسال التجربة للاعتماد والنشر 🚀</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

        </form>

      </div>
    </div>
  );
}
