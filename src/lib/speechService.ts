/**
 * 🎙️ خدمة النطق الصوتي العربي الموحد (Unified Arabic TTS Service)
 * تعمل بكفاءة على كافة الأجهزة (موبايل، كمبيوتر، أندرويد، آيفون)
 * تعتمد أولاً على البث الصوتي النقي MP3 من /api/tts ثم التراجع لـ SpeechSynthesis
 */

import { cleanAIResponseText } from './cleanResponse';

let activeAudio: HTMLAudioElement | null = null;
let currentUtterance: any = null;

/**
 * تنظيف النص الموجه للنطق الصوتي من أي رموز هندسية أو علامات ماركداون
 */
function prepareTextForSpeech(text: string): string {
  let cleaned = cleanAIResponseText(text);

  // إزالة علامات الماركداون
  cleaned = cleaned.replace(/[*#_`~>\[\]\(\)]/g, ' ');
  // إزالة الروابط
  cleaned = cleaned.replace(/https?:\/\/\S+/g, '');
  // إزالة الإيموجي والرموز التعبيرية ومحددات الأشكال
  cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, ' ');
  cleaned = cleaned.replace(/[\uFE00-\uFE0F]/g, '');
  // إزالة المسافات الزائدة
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // تقليم النص لأول 400 حرف لتفادي طول الانتظار وضمان استجابة صوتية سريعة وموجزة
  if (cleaned.length > 400) {
    const periodIdx = cleaned.indexOf('.', 250);
    if (periodIdx !== -1 && periodIdx < 450) {
      cleaned = cleaned.slice(0, periodIdx + 1);
    } else {
      cleaned = cleaned.slice(0, 380) + '...';
    }
  }

  return cleaned;
}

/**
 * تشغيل النطق الصوتي العربي
 * @returns دالة لإيقاف الصوت فوراً
 */
export function playArabicSpeech(
  rawText: string,
  callbacks?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (errorMsg: string) => void;
  }
): () => void {
  // إيقاف أي صوت يعمل حالياً
  stopSpeech();

  const text = prepareTextForSpeech(rawText);
  if (!text) {
    callbacks?.onError?.('لا يوجد نص صالح للنطق');
    return () => {};
  }

  callbacks?.onStart?.();

  // 1. المحاولة الأولى: استخدام خادم الصوت السحابي /api/tts (صوت عربي طبيعي فائق الجودة MP3)
  try {
    const audioUrl = `/api/tts?text=${encodeURIComponent(text)}`;
    const audio = new Audio(audioUrl);
    activeAudio = audio;

    let hasFallenBack = false;
    const executeFallback = (reason?: any) => {
      if (hasFallenBack) return;
      hasFallenBack = true;
      activeAudio = null;
      console.warn('TTS playback issue, falling back to browser SpeechSynthesis:', reason);
      fallbackToBrowserSpeech(text, callbacks);
    };

    audio.onended = () => {
      activeAudio = null;
      callbacks?.onEnd?.();
    };

    audio.onerror = (e) => {
      executeFallback(e);
    };

    audio.play().catch((err) => {
      executeFallback(err);
    });

    return () => stopSpeech();
  } catch (e) {
    fallbackToBrowserSpeech(text, callbacks);
    return () => stopSpeech();
  }
}

/**
 * التراجع لمحرك المتصفح المحلي في حالة انقطاع الاتصال
 */
function fallbackToBrowserSpeech(
  text: string,
  callbacks?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (errorMsg: string) => void;
  }
) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    callbacks?.onError?.('المتصفح لا يدعم النطق الصوتي');
    callbacks?.onEnd?.();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    currentUtterance = utterance; // لمنع Garbage Collection في كروم

    utterance.lang = 'ar-SA';
    utterance.rate = 0.95;

    // محاولة اختيار صوت عربي مسجل إن وجد
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(
      (v) => v.lang.startsWith('ar') || v.name.toLowerCase().includes('arabic')
    );
    if (arabicVoice) {
      utterance.voice = arabicVoice;
    }

    utterance.onend = () => {
      currentUtterance = null;
      callbacks?.onEnd?.();
    };

    utterance.onerror = (e) => {
      currentUtterance = null;
      console.warn('Browser SpeechSynthesis error:', e);
      callbacks?.onError?.('تعذر تشغيل الصوت على هذا المتصفح');
      callbacks?.onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    callbacks?.onError?.('حدث خطأ أثناء تشغيل الصوت');
    callbacks?.onEnd?.();
  }
}

/**
 * إيقاف الصوت الحالي تماماً
 */
export function stopSpeech() {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {}
    activeAudio = null;
  }

  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
    currentUtterance = null;
  }
}
