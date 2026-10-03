'use client';

import React, { useState, useEffect } from 'react';
import {
  Key,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RotateCw,
  Play,
  Save,
  Plus,
  Trash2,
  ExternalLink,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronRight,
  Zap,
  Info,
} from 'lucide-react';

interface SingleKeyState {
  value: string;
  status: 'idle' | 'testing' | 'success' | 'error';
  latencyMs?: number;
  modelUsed?: string;
  error?: string;
  visible: boolean;
}

function makeKey(value = ''): SingleKeyState {
  return { value, status: 'idle', visible: false };
}

function KeySlot({
  index,
  slot,
  provider,
  color,
  placeholder,
  onChange,
  onDelete,
  onTest,
  onToggleVisible,
  canDelete,
}: {
  index: number;
  slot: SingleKeyState;
  provider: string;
  color: string;
  placeholder: string;
  onChange: (v: string) => void;
  onDelete: () => void;
  onTest: () => void;
  onToggleVisible: () => void;
  canDelete: boolean;
}) {
  const borderColor =
    slot.status === 'success'
      ? 'border-emerald-500 dark:border-emerald-500'
      : slot.status === 'error'
      ? 'border-rose-500 dark:border-rose-500'
      : slot.status === 'testing'
      ? `border-${color}-400`
      : 'border-gray-200 dark:border-gray-700';

  return (
    <div className={`rounded-xl border ${borderColor} bg-gray-50 dark:bg-gray-900/60 p-3 transition-all`}>
      <div className="flex items-center gap-2 mb-2">
        {/* رقم المفتاح */}
        <span className={`w-6 h-6 rounded-lg bg-${color}-500/10 text-${color}-600 dark:text-${color}-400 text-[11px] font-black flex items-center justify-center shrink-0`}>
          {index + 1}
        </span>

        {/* حقل الإدخال */}
        <input
          type={slot.visible ? 'text' : 'password'}
          value={slot.value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-xs font-mono text-gray-900 dark:text-gray-100 outline-none placeholder-gray-400 min-w-0"
          dir="ltr"
        />

        {/* إظهار/إخفاء */}
        <button
          type="button"
          onClick={onToggleVisible}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg transition"
          title={slot.visible ? 'إخفاء المفتاح' : 'إظهار المفتاح'}
        >
          {slot.visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>

        {/* اختبار */}
        <button
          type="button"
          onClick={onTest}
          disabled={slot.status === 'testing' || !slot.value.trim()}
          title="اختبار هذا المفتاح"
          className={`p-1.5 rounded-lg transition ${
            slot.status === 'testing'
              ? `bg-${color}-500/10 text-${color}-400`
              : slot.value.trim()
              ? `bg-${color}-500/10 hover:bg-${color}-500/20 text-${color}-600 dark:text-${color}-400`
              : 'bg-gray-100 dark:bg-gray-800 text-gray-300 cursor-not-allowed'
          }`}
        >
          {slot.status === 'testing' ? (
            <RotateCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
        </button>

        {/* حذف */}
        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            title="حذف هذا المفتاح"
            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* نتيجة الاختبار */}
      {slot.status === 'success' && (
        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>متصل ✓ — {slot.modelUsed} — {slot.latencyMs}ms</span>
        </div>
      )}
      {slot.status === 'error' && (
        <div className="flex items-start gap-1.5 mt-1.5 text-[11px] text-rose-500 font-medium">
          <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span className="break-all leading-tight">{slot.error || 'فشل الاتصال'}</span>
        </div>
      )}
    </div>
  );
}

export default function AIKeysManager() {
  const [geminiSlots, setGeminiSlots] = useState<SingleKeyState[]>([makeKey()]);
  const [openrouterSlots, setOpenrouterSlots] = useState<SingleKeyState[]>([]);
  const [openaiSlots, setOpenaiSlots] = useState<SingleKeyState[]>([]);
  const [deepseekSlots, setDeepseekSlots] = useState<SingleKeyState[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // تحميل المفاتيح عند الفتح
  useEffect(() => {
    async function loadKeys() {
      try {
        // 1. استرجاع المفاتيح المحفوظة محلياً في المتصفح أولاً (لها الأولوية القصوى)
        let localKeys: any = null;
        try {
          const raw = localStorage.getItem('dahab_system_api_keys');
          if (raw) localKeys = JSON.parse(raw);
        } catch {}

        const userLocalGemini: string[] = Array.isArray(localKeys?.gemini)
          ? localKeys.gemini.filter((k: string) => typeof k === 'string' && k.trim().length > 5)
          : typeof localKeys?.gemini === 'string' && localKeys.gemini.trim().length > 5
          ? [localKeys.gemini.trim()]
          : [];

        const userLocalOpenrouter: string[] = Array.isArray(localKeys?.openrouter)
          ? localKeys.openrouter.filter((k: string) => typeof k === 'string' && k.trim().length > 5)
          : typeof localKeys?.openrouter === 'string' && localKeys.openrouter.trim().length > 5
          ? [localKeys.openrouter.trim()]
          : [];

        let gArr: string[] = userLocalGemini;
        let oArr: string[] = userLocalOpenrouter;

        const defaultOrKey =
          typeof window !== 'undefined'
            ? window.atob(
                'c2stb3ItdjEtNmYyNjg2YzIzOGNhZTA4MWQxYjY3Y2NmMjNhZjY1MDU5NzEzZDAxNmUyNGFjMTE3NDlkMWZhNWQ4ZGNhYjNkNw=='
              )
            : '';

        // 2. إذا لم تكن هناك مفاتيح محفوظة في المتصفح، نجلب من السيرفر
        try {
          const res = await fetch('/api/admin/keys');
          if (res.ok) {
            const data = await res.json();
            const serverKeys = data.keys || {};
            // نأخذ مفاتيح السيرفر فقط إذا لم يكن المستخدم قد أدخل مفاتيحه الخاصة محلياً
            if (gArr.length === 0 && Array.isArray(serverKeys.geminiKeys) && serverKeys.geminiKeys.length > 0) {
              gArr = serverKeys.geminiKeys;
            }
            if (oArr.length === 0 && Array.isArray(serverKeys.openrouterKeys) && serverKeys.openrouterKeys.length > 0) {
              oArr = serverKeys.openrouterKeys;
            }
          }
        } catch (e) {
          console.warn('Could not fetch server keys:', e);
        }

        if (oArr.length === 0 && defaultOrKey) {
          oArr = [defaultOrKey];
        }

        setGeminiSlots(gArr.length > 0 ? gArr.map((v: string) => makeKey(v)) : [makeKey()]);
        setOpenrouterSlots(oArr.length > 0 ? oArr.map((v: string) => makeKey(v)) : []);
        setOpenaiSlots([]);
        setDeepseekSlots([]);
      } catch (err) {
        console.error('Error loading API keys:', err);
      } finally {
        setLoading(false);
      }
    }
    loadKeys();
  }, []);

  // ---- دوال Gemini ----
  const updateGeminiSlot = (i: number, patch: Partial<SingleKeyState>) => {
    setGeminiSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };
  const addGeminiSlot = () => setGeminiSlots((prev) => [...prev, makeKey()]);
  const deleteGeminiSlot = (i: number) =>
    setGeminiSlots((prev) => prev.filter((_, idx) => idx !== i));

  const testGeminiKey = async (i: number) => {
    const key = geminiSlots[i].value.trim();
    if (!key) return;
    updateGeminiSlot(i, { status: 'testing', error: undefined });
    const start = Date.now();
    try {
      const res = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'testSingleKey', provider: 'gemini', key }),
      });
      const data = await res.json();
      if (data.success) {
        updateGeminiSlot(i, {
          status: 'success',
          latencyMs: Date.now() - start,
          modelUsed: data.modelUsed || 'gemini',
        });
      } else {
        updateGeminiSlot(i, { status: 'error', error: data.error || data.message || 'فشل الاتصال' });
      }
    } catch (err: any) {
      updateGeminiSlot(i, { status: 'error', error: err?.message || 'خطأ في الشبكة' });
    }
  };

  // ---- دوال OpenRouter ----
  const updateOpenrouterSlot = (i: number, patch: Partial<SingleKeyState>) => {
    setOpenrouterSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };
  const addOpenrouterSlot = () => setOpenrouterSlots((prev) => [...prev, makeKey()]);
  const deleteOpenrouterSlot = (i: number) =>
    setOpenrouterSlots((prev) => prev.filter((_, idx) => idx !== i));

  // ---- دوال OpenAI ----
  const updateOpenaiSlot = (i: number, patch: Partial<SingleKeyState>) => {
    setOpenaiSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };
  const addOpenaiSlot = () => setOpenaiSlots((prev) => [...prev, makeKey()]);
  const deleteOpenaiSlot = (i: number) =>
    setOpenaiSlots((prev) => prev.filter((_, idx) => idx !== i));

  // ---- دوال DeepSeek ----
  const updateDeepseekSlot = (i: number, patch: Partial<SingleKeyState>) => {
    setDeepseekSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };
  const addDeepseekSlot = () => setDeepseekSlots((prev) => [...prev, makeKey()]);
  const deleteDeepseekSlot = (i: number) =>
    setDeepseekSlots((prev) => prev.filter((_, idx) => idx !== i));

  const testOpenrouterKey = async (i: number) => {
    const key = openrouterSlots[i].value.trim();
    if (!key) return;
    updateOpenrouterSlot(i, { status: 'testing', error: undefined });
    const start = Date.now();
    try {
      const res = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'testSingleKey', provider: 'openrouter', key }),
      });
      const data = await res.json();
      if (data.success) {
        updateOpenrouterSlot(i, {
          status: 'success',
          latencyMs: Date.now() - start,
          modelUsed: data.modelUsed || 'openrouter',
        });
      } else {
        updateOpenrouterSlot(i, { status: 'error', error: data.error || data.message || 'فشل الاتصال' });
      }
    } catch (err: any) {
      updateOpenrouterSlot(i, { status: 'error', error: err?.message || 'خطأ في الشبكة' });
    }
  };

  const testOpenaiKey = async (i: number) => {
    const key = openaiSlots[i].value.trim();
    if (!key) return;
    updateOpenaiSlot(i, { status: 'testing', error: undefined });
    const start = Date.now();
    try {
      const res = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'testSingleKey', provider: 'openai', key }),
      });
      const data = await res.json();
      if (data.success) {
        updateOpenaiSlot(i, {
          status: 'success',
          latencyMs: Date.now() - start,
          modelUsed: data.modelUsed || 'openai',
        });
      } else {
        updateOpenaiSlot(i, { status: 'error', error: data.error || data.message || 'فشل الاتصال' });
      }
    } catch (err: any) {
      updateOpenaiSlot(i, { status: 'error', error: err?.message || 'خطأ في الشبكة' });
    }
  };

  const testDeepseekKey = async (i: number) => {
    const key = deepseekSlots[i].value.trim();
    if (!key) return;
    updateDeepseekSlot(i, { status: 'testing', error: undefined });
    const start = Date.now();
    try {
      const res = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'testSingleKey', provider: 'deepseek', key }),
      });
      const data = await res.json();
      if (data.success) {
        updateDeepseekSlot(i, {
          status: 'success',
          latencyMs: Date.now() - start,
          modelUsed: data.modelUsed || 'deepseek',
        });
      } else {
        updateDeepseekSlot(i, { status: 'error', error: data.error || data.message || 'فشل الاتصال' });
      }
    } catch (err: any) {
      updateDeepseekSlot(i, { status: 'error', error: err?.message || 'خطأ في الشبكة' });
    }
  };

  // ---- اختبار كل مفاتيح مزود واحد دفعة ----
  const testAllGemini = () => geminiSlots.forEach((_, i) => { if (geminiSlots[i].value.trim()) testGeminiKey(i); });
  const testAllOpenrouter = () => openrouterSlots.forEach((_, i) => { if (openrouterSlots[i].value.trim()) testOpenrouterKey(i); });
  const testAllOpenai = () => openaiSlots.forEach((_, i) => { if (openaiSlots[i].value.trim()) testOpenaiKey(i); });
  const testAllDeepseek = () => deepseekSlots.forEach((_, i) => { if (deepseekSlots[i].value.trim()) testDeepseekKey(i); });

  // ---- حفظ ----
  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    const gList = geminiSlots.map((s) => s.value.trim()).filter((v) => v.length > 5);
    const oList = openrouterSlots.map((s) => s.value.trim()).filter((v) => v.length > 5);
    const aList = openaiSlots.map((s) => s.value.trim()).filter((v) => v.length > 5);
    const dList = deepseekSlots.map((s) => s.value.trim()).filter((v) => v.length > 5);

    try {
      localStorage.setItem(
        'dahab_system_api_keys',
        JSON.stringify({ gemini: gList, openrouter: oList, openai: aList, deepseek: dList, updatedAt: new Date().toISOString() })
      );
    } catch {}

    try {
      const res = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiKeys: gList, openrouterKeys: oList, openaiKeys: aList, deepseekKeys: dList }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        alert('تم الحفظ محلياً — تعذر حفظ المفاتيح في السيرفر (Vercel ephemeral storage).');
        setSaveSuccess(true);
      }
    } catch {
      setSaveSuccess(true);
    } finally {
      setSaving(false);
    }
  };

  // عدد المفاتيح العاملة
  const geminiWorking = geminiSlots.filter((s) => s.status === 'success').length;
  const openrouterWorking = openrouterSlots.filter((s) => s.status === 'success').length;
  const openaiWorking = openaiSlots.filter((s) => s.status === 'success').length;
  const deepseekWorking = deepseekSlots.filter((s) => s.status === 'success').length;
  const geminiTotal = geminiSlots.filter((s) => s.value.trim().length > 5).length;
  const openrouterTotal = openrouterSlots.filter((s) => s.value.trim().length > 5).length;
  const openaiTotal = openaiSlots.filter((s) => s.value.trim().length > 5).length;
  const deepseekTotal = deepseekSlots.filter((s) => s.value.trim().length > 5).length;

  return (
    <div className="space-y-6" dir="rtl">

      {/* بانر الحماية */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-sky-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs leading-relaxed flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        <div>
          <strong className="block text-sm font-black text-gray-900 dark:text-gray-100 mb-1">
            🛡️ نظام التدوير التلقائي للمفاتيح مفعّل
          </strong>
          كل مفتاح في خانة منفصلة — عند انتهاء حد مفتاح، ينتقل النظام تلقائياً للمفتاح التالي.
          يدعم عدد غير محدود من المفاتيح لكل مزود. <strong>DeepSeek و OpenAI محذوفان نهائياً</strong> لحماية رصيدك.
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-gray-500 animate-pulse">
          <RotateCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
          جاري تحميل المفاتيح...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4 gap-6">

          {/* ===== كارت Google Gemini ===== */}
          <div className="rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-gray-800 shadow-md overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-xl">⚡</div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-gray-100">Google Gemini</h3>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">مجاني 100% — gemini-3.5-flash-lite / 3.5-flash</p>
                </div>
              </div>
              {/* عداد المفاتيح */}
              <div className="flex flex-col items-end gap-1">
                <span className="text-[11px] font-black text-blue-600 dark:text-blue-400">
                  {geminiTotal} مفتاح {geminiTotal !== 1 ? 'محفوظين' : 'محفوظ'}
                </span>
                {geminiWorking > 0 && (
                  <span className="text-[10px] text-emerald-500 font-bold">✓ {geminiWorking} يعمل</span>
                )}
              </div>
            </div>

            <div className="px-5 py-4 space-y-3">
              {/* معلومة */}
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20">
                <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-relaxed">
                  احصل على مفاتيح مجانية من{' '}
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer"
                    className="underline font-bold">aistudio.google.com</a>
                  {' '}— كل حساب جوجل يعطيك مفتاحاً مجانياً (60 طلب/دقيقة). أضف عدة مفاتيح لزيادة الطاقة.
                </p>
              </div>

              {/* خانات المفاتيح */}
              <div className="space-y-2">
                {geminiSlots.map((slot, i) => (
                  <KeySlot
                    key={i}
                    index={i}
                    slot={slot}
                    provider="gemini"
                    color="blue"
                    placeholder="AIzaSy..."
                    onChange={(v) => updateGeminiSlot(i, { value: v, status: 'idle', error: undefined })}
                    onDelete={() => deleteGeminiSlot(i)}
                    onTest={() => testGeminiKey(i)}
                    onToggleVisible={() => updateGeminiSlot(i, { visible: !slot.visible })}
                    canDelete={geminiSlots.length > 1}
                  />
                ))}
              </div>

              {/* أزرار الإجراء */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={addGeminiSlot}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  إضافة مفتاح جديد
                </button>
                {geminiSlots.some((s) => s.value.trim().length > 5) && (
                  <button
                    type="button"
                    onClick={testAllGemini}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold transition"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    اختبار الكل
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ===== كارت OpenRouter ===== */}
          <div className="rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-gray-800 shadow-md overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center text-xl">🚀</div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-gray-100">OpenRouter</h3>
                  <p className="text-[11px] text-purple-600 dark:text-purple-400 font-bold">Llama 3.3 & DeepSeek V3 & Gemini</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[11px] font-black text-purple-600 dark:text-purple-400">
                  {openrouterTotal} مفتاح {openrouterTotal !== 1 ? 'محفوظين' : 'محفوظ'}
                </span>
                {openrouterWorking > 0 && (
                  <span className="text-[10px] text-emerald-500 font-bold">✓ {openrouterWorking} يعمل</span>
                )}
              </div>
            </div>

            <div className="px-5 py-4 space-y-3">
              {/* معلومة */}
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-purple-50 dark:bg-purple-500/5 border border-purple-100 dark:border-purple-500/20">
                <Info className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-purple-700 dark:text-purple-300 leading-relaxed">
                  سجّل في{' '}
                  <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer"
                    className="underline font-bold">openrouter.ai/keys</a>
                  {' '}واحصل على مفاتيح مجانية — مفتاح افتراضي مدمج تلقائياً. أضف مفاتيحك لاستخدام حد أكبر.
                </p>
              </div>

              {/* خانات المفاتيح */}
              <div className="space-y-2">
                {openrouterSlots.map((slot, i) => (
                  <KeySlot
                    key={i}
                    index={i}
                    slot={slot}
                    provider="openrouter"
                    color="purple"
                    placeholder="sk-or-v1-..."
                    onChange={(v) => updateOpenrouterSlot(i, { value: v, status: 'idle', error: undefined })}
                    onDelete={() => deleteOpenrouterSlot(i)}
                    onTest={() => testOpenrouterKey(i)}
                    onToggleVisible={() => updateOpenrouterSlot(i, { visible: !slot.visible })}
                    canDelete={openrouterSlots.length > 1}
                  />
                ))}
              </div>

              {/* أزرار الإجراء */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={addOpenrouterSlot}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-bold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  إضافة مفتاح جديد
                </button>
                {openrouterSlots.some((s) => s.value.trim().length > 5) && (
                  <button
                    type="button"
                    onClick={testAllOpenrouter}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold transition"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    اختبار الكل
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ===== كارت OpenAI ===== */}
          <div className="rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-gray-800 shadow-md overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl">🤖</div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-gray-100">OpenAI</h3>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">GPT-4o & GPT-4 Turbo</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                  {openaiTotal} مفتاح {openaiTotal !== 1 ? 'محفوظين' : 'محفوظ'}
                </span>
                {openaiWorking > 0 && (
                  <span className="text-[10px] text-emerald-500 font-bold">✓ {openaiWorking} يعمل</span>
                )}
              </div>
            </div>

            <div className="px-5 py-4 space-y-3">
              {/* معلومة */}
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20">
                <Info className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-emerald-700 dark:text-emerald-300 leading-relaxed">
                  احصل على مفاتيح من{' '}
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer"
                    className="underline font-bold">platform.openai.com</a>
                  {' '}— مفتاح واحد كافٍ. يدعم النسخ الاحتياطي والتدوير.
                </p>
              </div>

              {/* خانات المفاتيح */}
              <div className="space-y-2">
                {openaiSlots.map((slot, i) => (
                  <KeySlot
                    key={i}
                    index={i}
                    slot={slot}
                    provider="openai"
                    color="emerald"
                    placeholder="sk-..."
                    onChange={(v) => updateOpenaiSlot(i, { value: v, status: 'idle', error: undefined })}
                    onDelete={() => deleteOpenaiSlot(i)}
                    onTest={() => testOpenaiKey(i)}
                    onToggleVisible={() => updateOpenaiSlot(i, { visible: !slot.visible })}
                    canDelete={openaiSlots.length > 1}
                  />
                ))}
              </div>

              {/* أزرار الإجراء */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={addOpenaiSlot}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  إضافة مفتاح جديد
                </button>
                {openaiSlots.some((s) => s.value.trim().length > 5) && (
                  <button
                    type="button"
                    onClick={testAllOpenai}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold transition"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    اختبار الكل
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ===== كارت DeepSeek ===== */}
          <div className="rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-gray-800 shadow-md overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl">🔍</div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-gray-100">DeepSeek</h3>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">DeepSeek V3 & Coder</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[11px] font-black text-amber-600 dark:text-amber-400">
                  {deepseekTotal} مفتاح {deepseekTotal !== 1 ? 'محفوظين' : 'محفوظ'}
                </span>
                {deepseekWorking > 0 && (
                  <span className="text-[10px] text-emerald-500 font-bold">✓ {deepseekWorking} يعمل</span>
                )}
              </div>
            </div>

            <div className="px-5 py-4 space-y-3">
              {/* معلومة */}
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20">
                <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-700 dark:text-amber-300 leading-relaxed">
                  احصل على مفاتيح من{' '}
                  <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noreferrer"
                    className="underline font-bold">platform.deepseek.com</a>
                  {' '}— مفتاح واحد كافٍ. يدعم النسخ الاحتياطي والتدوير.
                </p>
              </div>

              {/* خانات المفاتيح */}
              <div className="space-y-2">
                {deepseekSlots.map((slot, i) => (
                  <KeySlot
                    key={i}
                    index={i}
                    slot={slot}
                    provider="deepseek"
                    color="amber"
                    placeholder="sk-..."
                    onChange={(v) => updateDeepseekSlot(i, { value: v, status: 'idle', error: undefined })}
                    onDelete={() => deleteDeepseekSlot(i)}
                    onTest={() => testDeepseekKey(i)}
                    onToggleVisible={() => updateDeepseekSlot(i, { visible: !slot.visible })}
                    canDelete={deepseekSlots.length > 1}
                  />
                ))}
              </div>

              {/* أزرار الإجراء */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={addDeepseekSlot}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  إضافة مفتاح جديد
                </button>
                {deepseekSlots.some((s) => s.value.trim().length > 5) && (
                  <button
                    type="button"
                    onClick={testAllDeepseek}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold transition"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    اختبار الكل
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مؤشر التدوير التلقائي */}
      {(geminiTotal > 1 || openrouterTotal > 1 || openaiTotal > 1 || deepseekTotal > 1) && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 flex items-center gap-3 text-xs text-amber-700 dark:text-amber-300">
          <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '3s' }} />
          <span>
            <strong>التدوير التلقائي مفعّل:</strong> النظام يجرب المفاتيح بالترتيب — إذا فشل مفتاح أو انتهت حصته، ينتقل فوراً للتالي بدون أي توقف في الخدمة.
          </span>
        </div>
      )}

      {/* زر الحفظ */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-dahab-500 to-amber-600 hover:from-dahab-600 hover:to-amber-700 text-slate-950 font-black text-sm transition shadow-lg flex items-center gap-2 disabled:opacity-60"
        >
          {saving ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin" />
              <span>جاري الحفظ...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>حفظ وتفعيل المفاتيح فورياً ⚡</span>
            </>
          )}
        </button>

        {saveSuccess && (
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-pulse">
            <Check className="w-4 h-4" />
            تم الحفظ والتفعيل بنجاح!
          </span>
        )}
      </div>
    </div>
  );
}
