'use client';

import React, { useState } from 'react';
import { DeviceSpecialty, PowerSupplyReadings } from '@/lib/types';
import {
  Smartphone,
  Laptop,
  Zap,
  Car,
  Tv,
  Camera,
  X,
  Send,
  Gauge,
  Sliders,
  ChevronDown,
  ChevronUp,
  Mic,
  MicOff,
} from 'lucide-react';

interface DiagnosticFormProps {
  specialty: DeviceSpecialty;
  setSpecialty: (s: DeviceSpecialty) => void;
  deviceModel: string;
  setDeviceModel: (m: string) => void;
  prompt: string;
  setPrompt: (p: string) => void;
  imageBase64: string | null;
  setImageBase64: (img: string | null) => void;
  readings: PowerSupplyReadings;
  setReadings: React.Dispatch<React.SetStateAction<PowerSupplyReadings>>;
  loading: boolean;
  onDiagnose: () => void;
}

const SPECIALTY_OPTIONS: { id: DeviceSpecialty; label: string; icon: any; hint: string }[] = [
  {
    id: 'mobile-repair',
    label: '📱 صيانة الموبايل (iOS & Android)',
    icon: Smartphone,
    hint: 'آيفون، سامسونج، شاومي، هواوي - دوائر الشحن والباور والمودم',
  },
  {
    id: 'laptop-motherboard',
    label: '💻 لابتوب ومادربورد وماك بوك',
    icon: Laptop,
    hint: 'MacBook, Dell, HP, ThinkPad - دوائر 19V, 3.3V/5V, VCORE',
  },
  {
    id: 'tv-power-boards',
    label: '⚡ كروت باور وإنفرتر وشاشات',
    icon: Tv,
    hint: 'SMPS Power Supplies, Inverters, T-Con, LED Drivers',
  },
  {
    id: 'automotive-ecu',
    label: '🚗 كنترول وإلكترونيات السيارات',
    icon: Car,
    hint: 'ECU, BCM, Cluster, كروت حقن وبلوف ومتحكمات CAN-Bus',
  },
  {
    id: 'general-electronics',
    label: '🔌 إلكترونيات عامة ودوائر تحكم',
    icon: Zap,
    hint: 'أجهزة صناعية، ميكروكنترولر، كروت أجهزة منزلية ذكية',
  },
];

const QUICK_PROMPTS = [
  'شورت صريح مع سخونة وسحب أمبير عالي قبل الضغط على الباور',
  'سحب 0.08A والتوقف عند الضغط على الباور (Freezing Boot)',
  'ريستارت متكرر على اللوجو (Bootloop) مع سحب باور طبيعي',
  'شحن وهمي ونزول نسبة البطارية مع التعرف على الكمبيوتر',
  'فاصل إضاءة وبيانات مع وجود رنين واستجابة للمس',
];

export default function DiagnosticForm({
  specialty,
  setSpecialty,
  deviceModel,
  setDeviceModel,
  prompt,
  setPrompt,
  imageBase64,
  setImageBase64,
  readings,
  setReadings,
  loading,
  onDiagnose,
}: DiagnosticFormProps) {
  const [showAdvancedReadings, setShowAdvancedReadings] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // تفعيل المساعد الصوتي للورشة (Hands-Free Voice Assistant)
  const toggleVoiceRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('المتصفح الحالي لا يدعم التعرف الصوتي المباشر. يرجى استخدام متصفح Chrome أو Edge.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-EG';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const speechText = event.results[0][0].transcript;
        setPrompt(prompt ? `${prompt} ${speechText}` : speechText);
        setIsListening(false);
      };

      recognition.onerror = (err: any) => {
        console.error('Speech error:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 8 ميجابايت');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setImageBase64(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-workshop-card border border-workshop-border rounded-2xl p-5 shadow-xl space-y-5">
      {/* 1. اختيار التخصص الدقيق */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-dahab-400" />
          <span>حدد تخصص الدائرة الإلكترونية:</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {SPECIALTY_OPTIONS.map((item) => {
            const isSelected = specialty === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSpecialty(item.id)}
                className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-dahab-500/15 border-dahab-500 text-dahab-300 shadow-lg shadow-dahab-500/10'
                    : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:bg-gray-850 hover:text-gray-200'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-2">
                  <span className={isSelected ? 'text-dahab-400' : 'text-gray-500'}>
                    {item.label}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 mt-1 line-clamp-1">{item.hint}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. طراز الجهاز وحقل القياسات المتقدم */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <label className="text-xs font-bold text-gray-300 block mb-1.5">
            طراز الجهاز أو رقم البوردة (Model / Board ID):
          </label>
          <input
            type="text"
            value={deviceModel}
            onChange={(e) => setDeviceModel(e.target.value)}
            placeholder="مثلاً: iPhone 13 Pro Max (A2483) أو ThinkPad X1 Carbon NM-C921..."
            className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs text-gray-100 placeholder-gray-500 focus:border-dahab-500 focus:ring-1 focus:ring-dahab-500 outline-none"
          />
        </div>

        {/* زر إظهار لوحة أجهزة المعمل */}
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => setShowAdvancedReadings(!showAdvancedReadings)}
            className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
              showAdvancedReadings
                ? 'bg-amber-500/20 text-dahab-400 border-dahab-500/50'
                : 'bg-gray-900 text-gray-300 border-gray-800 hover:bg-gray-850'
            }`}
          >
            <Gauge className="w-4 h-4 text-dahab-400" />
            <span>قراءات الباور والملتيميتر</span>
            {showAdvancedReadings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* لوحة قراءات أجهزة المعمل (DC Power Supply & Diode Mode) */}
      {showAdvancedReadings && (
        <div className="p-4 bg-gray-950/90 border border-dahab-500/30 rounded-xl space-y-3 animate-fadeIn">
          <div className="text-xs font-bold text-dahab-400 flex items-center gap-1.5 border-b border-gray-800 pb-2">
            <Gauge className="w-4 h-4" />
            <span>تسجيل قراءات أدوات الفحص المخبرية (لزيادة دقة فرز الهاردوير والسوفتوير):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-gray-400 block mb-1">
                سحب الباور قبل التشغيل (أمبير):
              </label>
              <input
                type="number"
                step="0.01"
                value={readings.currentBeforePower ?? ''}
                onChange={(e) =>
                  setReadings((prev) => ({
                    ...prev,
                    currentBeforePower: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
                placeholder="مثلاً: 0.00A أو 0.45A"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-gray-100 outline-none focus:border-dahab-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-gray-400 block mb-1">
                سلوك السحب بعد زر الباور:
              </label>
              <input
                type="text"
                value={readings.currentAfterPower ?? ''}
                onChange={(e) =>
                  setReadings((prev) => ({ ...prev, currentAfterPower: e.target.value }))
                }
                placeholder="مثلاً: متوقف عند 0.08A / تذبذب ريستارت"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-gray-100 outline-none focus:border-dahab-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-gray-400 block mb-1">
                فولت التغذية المدخل (V):
              </label>
              <input
                type="number"
                step="0.1"
                value={readings.voltageInput ?? ''}
                onChange={(e) =>
                  setReadings((prev) => ({
                    ...prev,
                    voltageInput: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
                placeholder="مثلاً: 4.2V أو 19.5V"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-gray-100 outline-none focus:border-dahab-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="shortCheck"
              checked={readings.shortDetected || false}
              onChange={(e) =>
                setReadings((prev) => ({ ...prev, shortDetected: e.target.checked }))
              }
              className="w-4 h-4 rounded border-gray-700 text-dahab-500 focus:ring-dahab-500 bg-gray-900"
            />
            <label htmlFor="shortCheck" className="text-xs font-bold text-rose-400 cursor-pointer">
              ⚠️ تم رصد شورت مباشر للأرضي (Short to GND) على أحد المسارات الرئيسية
            </label>
          </div>
        </div>
      )}

      {/* 3. صندوق وصف العطل والبرومبت السريع */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold text-gray-300 flex items-center gap-2">
            <span>وصف العطل بالتفصيل أو قراءة الممانعات:</span>
            <button
              type="button"
              onClick={toggleVoiceRecognition}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                isListening
                  ? 'bg-red-500/20 text-red-400 border-red-500 animate-pulse'
                  : 'bg-dahab-500/15 text-dahab-300 border-dahab-500/30 hover:bg-dahab-500/25'
              }`}
              title="المساعد الصوتي للورشة: تحدث بصوتك دون لمس لوحة المفاتيح أثناء العمل"
            >
              {isListening ? (
                <>
                  <MicOff className="w-3.5 h-3.5 animate-bounce" />
                  <span>جاري الاستماع لصوتك... (تحدث الآن)</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-dahab-400" />
                  <span>🎙️ تحدث بصوتك (Hands-Free)</span>
                </>
              )}
            </button>
          </label>
          <span className="text-[10px] text-gray-500">
            (يمكنك كتابة اسم الآيسي، رمز الخط، أو التحدث بالصوت)
          </span>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="اكتب وصف العطل: مثلاً (آيفون 13 فاصل شحن، مع سحب 0.20A قبل الباور، وممانعة مسار VDD_MAIN صفرية... أو لابتوب ديل يضيء لمبة الباور لثانية وينطفئ...)"
          className="w-full p-3.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-100 placeholder-gray-600 focus:ring-2 focus:ring-dahab-500/50 focus:border-dahab-500 outline-none h-28 resize-none font-sans leading-relaxed"
        />

        {/* أزرار سريعة للأعطال الشائعة */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="text-[10px] text-gray-500 py-1">أعطال سريعة:</span>
          {QUICK_PROMPTS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPrompt(q)}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-dahab-300 transition"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* 4. رفع الصور وزر التشخيص الأساسي */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-workshop-border">
        {/* رفع صورة البوردة أو شاشة القياس */}
        <div className="flex items-center gap-3">
          <label className="cursor-pointer flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs font-semibold text-gray-300 hover:text-white transition">
            <Camera className="w-4 h-4 text-dahab-400" />
            <span>إرفاق صورة (البوردة / الملتيميتر / الباور)</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>

          {imageBase64 && (
            <div className="relative inline-block">
              <img
                src={imageBase64}
                alt="Preview"
                className="w-10 h-10 object-cover rounded-lg border border-dahab-500/50 shadow"
              />
              <button
                type="button"
                onClick={() => setImageBase64(null)}
                className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-0.5 shadow hover:bg-rose-700"
                title="إزالة الصورة"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* زر بدء الفحص الهندسي الكبير */}
        <button
          onClick={onDiagnose}
          disabled={loading || (!prompt.trim() && !imageBase64)}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-dahab-500 to-amber-600 hover:from-dahab-600 hover:to-amber-700 text-slate-950 px-8 py-3 rounded-xl font-black text-sm transition-all shadow-lg shadow-dahab-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>جاري الفرز والتشخيص الهندسي...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>تشغيل الفحص الهندسي الذكي 🚀</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
