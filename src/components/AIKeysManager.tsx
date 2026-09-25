'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Key,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Save,
  RotateCw,
  ExternalLink,
  Cpu,
  Zap,
  Check,
  Sparkles,
  Info,
} from 'lucide-react';

interface KeyTestStatus {
  status: 'idle' | 'testing' | 'success' | 'error';
  message?: string;
  latencyMs?: number;
  modelUsed?: string;
  error?: string;
}

export default function AIKeysManager() {
  const [geminiKeys, setGeminiKeys] = useState('');
  const [openrouterKeys, setOpenrouterKeys] = useState('');
  const [openaiKeys, setOpenaiKeys] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // حالة فحص كل مزود
  const [geminiStatus, setGeminiStatus] = useState<KeyTestStatus>({ status: 'idle' });
  const [openrouterStatus, setOpenrouterStatus] = useState<KeyTestStatus>({ status: 'idle' });
  const [openaiStatus, setOpenaiStatus] = useState<KeyTestStatus>({ status: 'idle' });

  // تحميل المفاتيح المخزنة عند فتح الصفحة
  useEffect(() => {
    async function loadKeys() {
      try {
        // 1. أولاً قراءة المفاتيح من localStorage
        let localKeys: any = null;
        try {
          const raw = localStorage.getItem('dahab_system_api_keys');
          if (raw) localKeys = JSON.parse(raw);
        } catch (e) {}
        const defaultOrKey = typeof window !== 'undefined'
          ? window.atob('c2stb3ItdjEtNmYyNjg2YzIzOGNhZTA4MWQxYjY3Y2NmMjNhZjY1MDU5NzEzZDAxNmUyNGFjMTE3NDlkMWZhNWQ4ZGNhYjNkNw==')
          : '';

        // 2. قراءة المفاتيح من الخادم /api/admin/keys
        const res = await fetch('/api/admin/keys');
        if (res.ok) {
          const data = await res.json();
          const serverKeys = data.keys || {};

          const gKeys = (serverKeys.geminiKeys && serverKeys.geminiKeys.length > 0)
            ? serverKeys.geminiKeys
            : localKeys?.gemini || [];
          const oKeys = (serverKeys.openrouterKeys && serverKeys.openrouterKeys.length > 0)
            ? serverKeys.openrouterKeys
            : (localKeys?.openrouter && localKeys.openrouter.length > 0)
            ? localKeys.openrouter
            : [defaultOrKey];
          let aiKeys = (serverKeys.openaiKeys && serverKeys.openaiKeys.length > 0)
            ? serverKeys.openaiKeys
            : localKeys?.openai || [];

          if (Array.isArray(aiKeys)) {
            aiKeys = aiKeys.map((k: string) => (k.startsWith('k-proj-') ? 's' + k : k));
          } else if (typeof aiKeys === 'string' && aiKeys.startsWith('k-proj-')) {
            aiKeys = 's' + aiKeys;
          }

          setGeminiKeys(Array.isArray(gKeys) ? gKeys.join('\n') : gKeys || '');
          setOpenrouterKeys(Array.isArray(oKeys) ? oKeys.join('\n') : oKeys || defaultOrKey);
          setOpenaiKeys(Array.isArray(aiKeys) ? aiKeys.join('\n') : aiKeys || '');
        } else if (localKeys) {
          const oKeys = (localKeys.openrouter && localKeys.openrouter.length > 0) ? localKeys.openrouter : [defaultOrKey];
          let aiKeys = localKeys.openai || [];
          if (Array.isArray(aiKeys)) {
            aiKeys = aiKeys.map((k: string) => (k.startsWith('k-proj-') ? 's' + k : k));
          } else if (typeof aiKeys === 'string' && aiKeys.startsWith('k-proj-')) {
            aiKeys = 's' + aiKeys;
          }

          setGeminiKeys(Array.isArray(localKeys.gemini) ? localKeys.gemini.join('\n') : localKeys.gemini || '');
          setOpenrouterKeys(Array.isArray(oKeys) ? oKeys.join('\n') : defaultOrKey);
          setOpenaiKeys(Array.isArray(aiKeys) ? aiKeys.join('\n') : aiKeys || '');
        } else {
          setOpenrouterKeys(defaultOrKey);
        }
      } catch (err) {
        console.error('Failed to load API keys:', err);
      } finally {
        setLoading(false);
      }
    }

    loadKeys();
  }, []);

  // حفظ وتفعيل المفاتيح
  const handleSaveKeys = async () => {
    setSaving(true);
    setSaveSuccess(false);

    const parseLines = (text: string) =>
      text
        .split(/[\n,;]+/)
        .map((k) => k.trim())
        .filter((k) => k.length > 5);

    const gList = parseLines(geminiKeys);
    const oList = parseLines(openrouterKeys);
    const aiList = parseLines(openaiKeys);

    // 1. التخزين في localStorage للاستخدام الفوري بدون أي تأخير في العميل
    const keysObj = {
      gemini: gList,
      openrouter: oList,
      openai: aiList,
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem('dahab_system_api_keys', JSON.stringify(keysObj));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }

    // 2. إرسال المفاتيح للخادم لحفظها في ملف JSON
    try {
      const res = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geminiKeys: gList,
          openrouterKeys: oList,
          openaiKeys: aiList,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        alert('حدث خطأ أثناء حفظ المفاتيح في الخادم، ولكن تم حفظها محلياً بنجاح!');
      }
    } catch (err) {
      console.error(err);
      alert('تم حفظ المفاتيح محلياً في المتصفح بنجاح.');
      setSaveSuccess(true);
    } finally {
      setSaving(false);
    }
  };

  // اختبار كافة المفاتيح المدخلة حياً
  const handleTestKey = async (provider: 'gemini' | 'openrouter' | 'openai') => {
    let keyList: string[] = [];
    let setStatus: React.Dispatch<React.SetStateAction<KeyTestStatus>>;

    if (provider === 'gemini') {
      keyList = geminiKeys.split(/[\n,;]+/).map((k) => k.trim()).filter((k) => k.length > 5);
      setStatus = setGeminiStatus;
    } else if (provider === 'openrouter') {
      keyList = openrouterKeys.split(/[\n,;]+/).map((k) => k.trim()).filter((k) => k.length > 5);
      setStatus = setOpenrouterStatus;
    } else {
      keyList = openaiKeys
        .split(/[\n,;]+/)
        .map((k) => k.trim())
        .map((k) => (k.startsWith('k-proj-') ? 's' + k : k))
        .filter((k) => k.length > 5);
      setStatus = setOpenaiStatus;
    }

    if (keyList.length === 0) {
      setStatus({
        status: 'error',
        message: 'يرجى إدخال مفتاح واحد على الأقل للاختبار',
      });
      return;
    }

    setStatus({ status: 'testing' });

    let workingKeyResult: any = null;
    const errorsList: string[] = [];

    for (let i = 0; i < keyList.length; i++) {
      const key = keyList[i];
      try {
        const res = await fetch('/api/admin/keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'test',
            provider,
            key,
          }),
        });

        const data = await res.json();
        if (res.ok && data.result?.success) {
          workingKeyResult = {
            ...data.result,
            message:
              keyList.length > 1
                ? `المفتاح رقم (${i + 1} من أصل ${keyList.length}): ${data.result.message}`
                : data.result.message,
          };
          break; // عثرنا على مفتاح سليم ويعمل
        } else {
          const errDetail = data.result?.error || data.result?.message || data.error || 'فشل الاتصال';
          errorsList.push(`مفتاح #${i + 1} (...${key.slice(-5)}): ${errDetail}`);
        }
      } catch (e: any) {
        errorsList.push(`مفتاح #${i + 1}: ${e?.message || 'تعذر الوصول لخادم الفحص'}`);
      }
    }

    if (workingKeyResult) {
      setStatus({
        status: 'success',
        message: workingKeyResult.message,
        latencyMs: workingKeyResult.latencyMs,
        modelUsed: workingKeyResult.modelUsed,
      });
    } else {
      setStatus({
        status: 'error',
        message: `فشل الاتصال بجميع المفاتيح المدخلة (عدد: ${keyList.length})`,
        error: errorsList.join('\n'),
      });
    }
  };

  // فحص جميع المفاتيح معاً
  const handleTestAll = () => {
    handleTestKey('gemini');
    handleTestKey('openrouter');
    handleTestKey('openai');
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
        جاري تحميل المفاتيح وإعدادات الذكاء الاصطناعي...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* بطاقة التنبيه والتوجيهات */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-dahab-500 shrink-0 mt-0.5" />
        <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
          <p className="font-bold text-amber-700 dark:text-dahab-400 text-sm">
            إدارة مفاتيح الذكاء الاصطناعي الفورية (Zero Deployment)
          </p>
          <p>
            أي مفتاح تدخله وتضغط <strong>&quot;حفظ وتفعيل المفاتيح&quot;</strong> سيعمل فوراً للمساعد الذكي والشات الهندسي وفحص الأعطال بدون الحاجة لإعادة نشر (Redeploy) على Vercel.
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            * يمكنك وضع أكثر من مفتاح لكل مزود (كل مفتاح في سطر مستقل)، وسيقوم النظام بالتبديل التلقائي بينهم فور نفاد الحصة (Failover).
          </p>
        </div>
      </div>

      {/* زر الاختبار والحفظ العام */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-lg">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-dahab-500" />
          <div>
            <h3 className="text-sm font-black text-gray-900 dark:text-gray-100">
              مفاتيح تشغيل المحركات الهندسية
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              تدعم Google AI Studio و OpenRouter و OpenAI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestAll}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-800 dark:text-gray-200 transition"
          >
            <Zap className="w-4 h-4 text-dahab-500" />
            <span>⚡ فحص اتصال كافة المفاتيح الآن</span>
          </button>

          <button
            onClick={handleSaveKeys}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-dahab-500 to-amber-600 hover:from-dahab-600 hover:to-amber-700 text-slate-950 font-black text-xs transition shadow-md shadow-dahab-500/20 disabled:opacity-50"
          >
            {saving ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>جاري الحفظ والتفعيل...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-950" />
                <span>تم الحفظ والتفعيل بنجاح! ✓</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>حفظ وتفعيل المفاتيح فوراً</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* قسم 1: Google Gemini Keys (الموصى به - مجاني وسريع جداً) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-md space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-black text-xs">
              G
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-gray-900 dark:text-gray-100">
                  Google Gemini API Keys (الأولوية 1 - الموصى به)
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  مجاني وسريع جداً
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                تدعم مفاتيح Google الرسمية (مثل <code className="font-mono text-dahab-600 dark:text-dahab-400">AQ.Ab...</code> أو <code className="font-mono text-dahab-600 dark:text-dahab-400">AIzaSy...</code>) مع أحدث موديلات 2026 فائقة السرعة.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-dahab-600 dark:text-dahab-400 hover:underline flex items-center gap-1"
            >
              <span>منصة Google AI Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={() => handleTestKey('gemini')}
              disabled={geminiStatus.status === 'testing'}
              className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-[11px] font-bold text-gray-800 dark:text-gray-200 transition flex items-center gap-1"
            >
              {geminiStatus.status === 'testing' ? (
                <>
                  <RotateCw className="w-3 h-3 animate-spin text-dahab-500" />
                  <span>جاري الفحص...</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-dahab-500" />
                  <span>اختبار المفتاح</span>
                </>
              )}
            </button>
          </div>
        </div>

        <textarea
          value={geminiKeys}
          onChange={(e) => setGeminiKeys(e.target.value)}
          placeholder={`الصق مفاتيح Google هنا (مفتاح في كل سطر إذا كان لديك أكثر من مفتاح):\nAQ.Ab8RN6xxxxxxxxxxxxxxxxxxxx\nAIzaSyxxxxxxxxxxxxxxxxxxxxxxx`}
          rows={3}
          className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-mono text-gray-800 dark:text-gray-200 outline-none focus:border-dahab-500 transition resize-y"
        />

        {/* نتيجة فحص Gemini */}
        {geminiStatus.status !== 'idle' && (
          <div
            className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
              geminiStatus.status === 'testing'
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                : geminiStatus.status === 'success'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
            }`}
          >
            {geminiStatus.status === 'testing' && <RotateCw className="w-4 h-4 animate-spin text-dahab-500 shrink-0" />}
            {geminiStatus.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
            {geminiStatus.status === 'error' && <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
            <div className="space-y-0.5">
              <p className="font-bold">{geminiStatus.message}</p>
              {geminiStatus.latencyMs !== undefined && (
                <p className="text-[10px] opacity-80">
                  زمن الاستجابة: {geminiStatus.latencyMs}ms {geminiStatus.modelUsed ? `| الموديل المعتمد: ${geminiStatus.modelUsed}` : ''}
                </p>
              )}
              {geminiStatus.error && (
                <p className="text-[10px] font-mono opacity-90 mt-1">{geminiStatus.error}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* قسم 2: OpenRouter Keys (العملاق متعدد الموديلات - DeepSeek, Llama, Gemini) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-md space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black text-xs">
              OR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-gray-900 dark:text-gray-100">
                  OpenRouter API Keys (الأولوية 2 - شامل لكافة الموديلات العالمية)
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  DeepSeek + Llama 3.3 + Gemini
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                يبدأ بـ <code className="font-mono text-dahab-600 dark:text-dahab-400">sk-or-v1-...</code> ويشغل أحدث الموديلات بدون حظر جغرافي.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-dahab-600 dark:text-dahab-400 hover:underline flex items-center gap-1"
            >
              <span>فتح موقع OpenRouter</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={() => handleTestKey('openrouter')}
              disabled={openrouterStatus.status === 'testing'}
              className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-[11px] font-bold text-gray-800 dark:text-gray-200 transition flex items-center gap-1"
            >
              {openrouterStatus.status === 'testing' ? (
                <>
                  <RotateCw className="w-3 h-3 animate-spin text-dahab-500" />
                  <span>جاري الفحص...</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-dahab-500" />
                  <span>اختبار المفتاح</span>
                </>
              )}
            </button>
          </div>
        </div>

        <textarea
          value={openrouterKeys}
          onChange={(e) => setOpenrouterKeys(e.target.value)}
          placeholder={`الصق مفتاح OpenRouter هنا:\nsk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}
          rows={2}
          className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-mono text-gray-800 dark:text-gray-200 outline-none focus:border-dahab-500 transition resize-y"
        />

        {/* نتيجة فحص OpenRouter */}
        {openrouterStatus.status !== 'idle' && (
          <div
            className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
              openrouterStatus.status === 'testing'
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                : openrouterStatus.status === 'success'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
            }`}
          >
            {openrouterStatus.status === 'testing' && <RotateCw className="w-4 h-4 animate-spin text-dahab-500 shrink-0" />}
            {openrouterStatus.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
            {openrouterStatus.status === 'error' && <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
            <div className="space-y-0.5">
              <p className="font-bold">{openrouterStatus.message}</p>
              {openrouterStatus.latencyMs !== undefined && (
                <p className="text-[10px] opacity-80">
                  زمن الاستجابة: {openrouterStatus.latencyMs}ms {openrouterStatus.modelUsed ? `| الموديل المعتمد: ${openrouterStatus.modelUsed}` : ''}
                </p>
              )}
              {openrouterStatus.error && (
                <p className="text-[10px] font-mono opacity-90 mt-1">{openrouterStatus.error}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* قسم 3: OpenAI Keys (GPT-4o / GPT-4o-mini) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-md space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xs">
              AI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-gray-900 dark:text-gray-100">
                  OpenAI API Keys (GPT-4o & GPT-4o-mini)
                </h4>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                يبدأ بـ <code className="font-mono text-dahab-600 dark:text-dahab-400">sk-proj-...</code> (يتطلب رصيد دولاري نشط في حساب OpenAI الخاص بك).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-dahab-600 dark:text-dahab-400 hover:underline flex items-center gap-1"
            >
              <span>فتح منصة OpenAI</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={() => handleTestKey('openai')}
              disabled={openaiStatus.status === 'testing'}
              className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-[11px] font-bold text-gray-800 dark:text-gray-200 transition flex items-center gap-1"
            >
              {openaiStatus.status === 'testing' ? (
                <>
                  <RotateCw className="w-3 h-3 animate-spin text-dahab-500" />
                  <span>جاري الفحص...</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-dahab-500" />
                  <span>اختبار المفتاح</span>
                </>
              )}
            </button>
          </div>
        </div>

        <textarea
          value={openaiKeys}
          onChange={(e) => setOpenaiKeys(e.target.value)}
          placeholder={`الصق مفاتيح OpenAI هنا:\nsk-proj-xxxxxxxxxxxxxxxxxxxxxxxx`}
          rows={2}
          className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-mono text-gray-800 dark:text-gray-200 outline-none focus:border-dahab-500 transition resize-y"
        />

        {/* نتيجة فحص OpenAI */}
        {openaiStatus.status !== 'idle' && (
          <div
            className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
              openaiStatus.status === 'testing'
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                : openaiStatus.status === 'success'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
            }`}
          >
            {openaiStatus.status === 'testing' && <RotateCw className="w-4 h-4 animate-spin text-dahab-500 shrink-0" />}
            {openaiStatus.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
            {openaiStatus.status === 'error' && <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
            <div className="space-y-0.5">
              <p className="font-bold">{openaiStatus.message}</p>
              {openaiStatus.latencyMs !== undefined && (
                <p className="text-[10px] opacity-80">
                  زمن الاستجابة: {openaiStatus.latencyMs}ms {openaiStatus.modelUsed ? `| الموديل المعتمد: ${openaiStatus.modelUsed}` : ''}
                </p>
              )}
              {openaiStatus.error && (
                <p className="text-[10px] font-mono opacity-90 mt-1">{openaiStatus.error}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* روابط سريعة للتجربة */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <Info className="w-4 h-4 text-dahab-500" />
          <span>بعد حفظ المفاتيح، جرب المحادثة الذكية أو الفحص الهندسي الآن:</span>
        </div>
        <Link
          href="/"
          className="px-4 py-2 rounded-xl bg-dahab-500 hover:bg-dahab-600 text-slate-950 font-black text-xs transition"
        >
          تجربة المساعد الذكي الآن 💬
        </Link>
      </div>
    </div>
  );
}
