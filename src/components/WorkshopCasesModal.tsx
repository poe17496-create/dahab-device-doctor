'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Wrench,
  Smartphone,
  Laptop,
  Flame,
  Zap,
  Activity,
  Layers,
  Sparkles,
  Loader2,
  Check,
} from 'lucide-react';
import { WorkshopCase } from '@/lib/workshopCases';

interface WorkshopCasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultModel?: string;
  defaultCategory?: 'mobile' | 'laptop' | 'desktop';
}

export default function WorkshopCasesModal({
  isOpen,
  onClose,
  defaultModel = '',
  defaultCategory = 'mobile',
}: WorkshopCasesModalProps) {
  const [cases, setCases] = useState<WorkshopCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(defaultModel);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'mobile' | 'laptop'>('all');
  const [votingId, setVotingId] = useState<string | null>(null);

  // حالة إضافة سجل جديد
  const [showAddForm, setShowAddForm] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [newModel, setNewModel] = useState(defaultModel);
  const [newBoardCode, setNewBoardCode] = useState('');
  const [newCategory, setNewCategory] = useState<'mobile' | 'laptop'>('mobile');
  const [newSymptom, setNewSymptom] = useState('');
  const [newBootCurrent, setNewBootCurrent] = useState('');
  const [newDiodeReading, setNewDiodeReading] = useState('');
  const [newRootCause, setNewRootCause] = useState('');
  const [newSolution, setNewSolution] = useState('');
  const [technicianName, setTechnicianName] = useState('م. إسلام دهب');

  // جلب السجلات من الـ API
  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/workshop-cases');
      const data = await res.json();
      if (data.success && data.cases) {
        setCases(data.cases);
      }
    } catch (err) {
      console.error('Failed to fetch workshop cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCases();
      if (defaultModel) setSearch(defaultModel);
    }
  }, [isOpen, defaultModel]);

  // التصويت على نجاح أو فشل الحالة
  const handleVote = async (caseId: string, isSuccess: boolean) => {
    setVotingId(caseId);
    try {
      const res = await fetch('/api/workshop-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'vote', caseId, isSuccess }),
      });
      const data = await res.json();
      if (data.success && data.case) {
        setCases((prev) => prev.map((c) => (c.id === caseId ? data.case : c)));
      }
    } catch (err) {
      console.error('Failed to vote on case:', err);
    } finally {
      setVotingId(null);
    }
  };

  // حفظ حالة جديدة
  const handleSaveNewCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModel.trim() || !newSymptom.trim() || !newSolution.trim()) return;

    setAddLoading(true);
    try {
      const payload = {
        action: 'add',
        model: newModel,
        boardCode: newBoardCode,
        category: newCategory,
        symptom: newSymptom,
        measurements: {
          bootCurrentmA: newBootCurrent || undefined,
          diodeReadings: newDiodeReading ? [{ rail: 'فحص ممانعة', value: newDiodeReading }] : undefined,
        },
        rootCause: newRootCause || 'عطل عتادي دقيق',
        solution: newSolution,
        technicianName: technicianName || 'فني بالورشة',
      };

      const res = await fetch('/api/workshop-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.case) {
        setCases((prev) => [data.case, ...prev]);
        setShowAddForm(false);
        // Reset form
        setNewSymptom('');
        setNewBootCurrent('');
        setNewDiodeReading('');
        setNewRootCause('');
        setNewSolution('');
      }
    } catch (err) {
      console.error('Failed to add case:', err);
    } finally {
      setAddLoading(false);
    }
  };

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        c.model.toLowerCase().includes(q) ||
        (c.boardCode && c.boardCode.toLowerCase().includes(q)) ||
        c.symptom.toLowerCase().includes(q) ||
        c.rootCause.toLowerCase().includes(q) ||
        c.solution.toLowerCase().includes(q)
      );
    });
  }, [cases, search, categoryFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-amber-500/40 shadow-2xl overflow-hidden text-right">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/15 via-amber-500/5 to-transparent">
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950">
                  سجل الورشة المؤكد 100% 🏆
                </span>
                <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                  سجل حالات الصيانة المؤكدة (تعلّم بوزن النجاح)
                </h2>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                قاعدة بيانات الحالات التي تم فحصها وإصلاحها عملياً بالورشة؛ الحلول المؤكدة تتصدر التشخيص تلقائياً
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-xl shrink-0">
              🛠️
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-gray-200 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                categoryFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              الكل ({cases.length})
            </button>
            <button
              onClick={() => setCategoryFilter('mobile')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                categoryFilter === 'mobile'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              موبايل
            </button>
            <button
              onClick={() => setCategoryFilter('laptop')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                categoryFilter === 'laptop'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              لابتوب & ماك
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالموديل، العطل، أو الحل الناجح..."
                className="w-full pr-9 pl-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل حالة نجاح</span>
            </button>
          </div>
        </div>

        {/* Add New Case Form Dropdown */}
        {showAddForm && (
          <form
            onSubmit={handleSaveNewCase}
            className="p-4 border-b border-emerald-500/30 bg-emerald-500/5 space-y-3 animate-fadeIn"
          >
            <div className="flex items-center justify-between text-xs font-black text-emerald-600 dark:text-emerald-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                توثيق عطل تم حله بنجاح في الورشة لترقية الذكاء الاصطناعي
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                إلغاء
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">الموديل *</label>
                <input
                  type="text"
                  required
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  placeholder="مثال: iPhone 13 Pro Max أو Dell 5400"
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">كود البوردة (اختياري)</label>
                <input
                  type="text"
                  value={newBoardCode}
                  onChange={(e) => setNewBoardCode(e.target.value)}
                  placeholder="مثال: 820-02384 أو LA-G891P"
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">الفئة</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="mobile">موبايل (Mobile)</option>
                  <option value="laptop">لابتوب & ماك بوك (Laptop)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">العَرَض والشكوى *</label>
                <input
                  type="text"
                  required
                  value={newSymptom}
                  onChange={(e) => setNewSymptom(e.target.value)}
                  placeholder="مثال: شاشة بيضاء كاملة بعد السقوط، أو فاصل باور مع شورت صريح"
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">السبب الجذري المؤكد *</label>
                <input
                  type="text"
                  required
                  value={newRootCause}
                  onChange={(e) => setNewRootCause(e.target.value)}
                  placeholder="مثال: تلف مكثف C3302 على PP_VDD_MAIN أو احتراق موسفيت PQ301"
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">خطوات الحل المنفذة بالتفصيل *</label>
              <textarea
                required
                rows={2}
                value={newSolution}
                onChange={(e) => setNewSolution(e.target.value)}
                placeholder="اكتب بالتفصيل: كيف فحصت، أين حقنت، وما القطعة البديلة التي ركبتها..."
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-gray-400">
                تسجيل باسم: <strong className="text-emerald-500">{technicianName}</strong>
              </span>

              <button
                type="submit"
                disabled={addLoading}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition disabled:opacity-50"
              >
                {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>اعتماد وحفظ بالسجل</span>
              </button>
            </div>
          </form>
        )}

        {/* Cases List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
              <p className="text-xs text-gray-400">جاري تحميل سجلات الورشة المؤكدة...</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <div className="text-3xl">🔍</div>
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">لا توجد حالات مسجلة تطابق البحث</p>
              <p className="text-xs text-gray-400">كن أول من يوثق حالة إصلاح لهذا الموديل بالنقر على زر تسجيل حالة نجاح أعلاه!</p>
            </div>
          ) : (
            filteredCases.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-800 hover:border-amber-500/40 transition-all space-y-3 shadow-sm"
              >
                {/* Case Header */}
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{c.category === 'mobile' ? '📱' : '💻'}</span>
                      <h3 className="font-black text-sm text-gray-900 dark:text-white">
                        {c.model}
                      </h3>
                      {c.boardCode && (
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-mono text-[10px] font-bold">
                          {c.boardCode}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black flex items-center gap-1">
                        <Check className="w-3 h-3" /> تم الإصلاح بنجاح
                      </span>
                    </div>

                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1">
                      ⚠️ العَرَض: {c.symptom}
                    </p>
                  </div>

                  {/* Reinforcement Weight Badge & Voting */}
                  <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-900/80 p-1.5 rounded-xl border border-gray-200 dark:border-slate-700 shrink-0">
                    <span className="px-2 py-1 rounded-lg bg-amber-500/15 text-amber-500 font-mono font-black text-xs">
                      أولوية النجاح: {c.weight}
                    </span>

                    <button
                      onClick={() => handleVote(c.id, true)}
                      disabled={votingId === c.id}
                      className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/15 transition flex items-center gap-1 text-[11px] font-bold"
                      title="نجح معي هذا الحل أيضاً (+1 وزن)"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{c.successVotes}</span>
                    </button>

                    <button
                      onClick={() => handleVote(c.id, false)}
                      disabled={votingId === c.id}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/15 transition flex items-center gap-1 text-[11px] font-bold"
                      title="لم يحل المشكلة (-1 وزن)"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>{c.failureVotes}</span>
                    </button>
                  </div>
                </div>

                {/* Measurements & Root Cause */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-0.5">
                      🔬 السبب الجذري المثبت:
                    </span>
                    <p className="text-gray-900 dark:text-gray-200 font-semibold">{c.rootCause}</p>
                  </div>

                  {c.measurements?.bootCurrentmA && (
                    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800">
                      <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-0.5">
                        ⚡ قياسات الباور سبلاي / الحراري:
                      </span>
                      <p className="text-gray-900 dark:text-gray-200 font-mono text-[11px]">
                        {c.measurements.bootCurrentmA}
                        {c.measurements.hotspot && ` • ${c.measurements.hotspot}`}
                      </p>
                    </div>
                  )}
                </div>

                {/* Fix Procedure */}
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1">
                  <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    خطوات الحل المنفذة بالورشة (Fix Procedure):
                  </span>
                  <p className="text-gray-900 dark:text-gray-100 leading-relaxed font-medium">
                    {c.solution}
                  </p>
                </div>

                {/* Footer Metadata */}
                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-gray-100 dark:border-slate-800/80">
                  <span>موثق بواسطة: <strong className="text-gray-700 dark:text-gray-300">{c.technicianName || 'مهندس بالورشة'}</strong></span>
                  <span>{new Date(c.createdAt).toLocaleDateString('ar-EG')}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-between">
          <span>🧠 خوارزمية التعلم: الحل الحاصل على أصوات نجاح أكثر يتصدر مقدمة التشخيصات آلياً لجميع المستخدمين.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200 font-bold transition text-xs"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
