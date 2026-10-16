/**
 * 🎙️ خدمة النطق الصوتي العربي الموحد (Unified Arabic TTS Service)
 * تعمل بكفاءة على كافة الأجهزة (موبايل، آيفون، أندرويد، كمبيوتر)
 * تستخدم خادم الصوت السحابي /api/tts عبر Blob محلي لتجاوز قيود التشغيل في المتصفحات
 */

import { cleanAIResponseText } from './cleanResponse';

let activeAudio: HTMLAudioElement | null = null;
let currentBlobUrl: string | null = null;
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
  // إيقاف أي صوت يعمل حالياً وتنظيف الذاكرة
  stopSpeech();

  const text = prepareTextForSpeech(rawText);
  if (!text) {
    callbacks?.onError?.('لا يوجد نص صالح للنطق');
    return () => {};
  }

  callbacks?.onStart?.();

  // تجهيز عنصر الصوت مسبقاً داخل إيماءة الضغط المباشرة لفك حظر الصوت على الموبايل (iOS/Android)
  const audio = new Audio();
  activeAudio = audio;

  let isCancelled = false;

  const cleanup = () => {
    if (currentBlobUrl) {
      URL.revokeObjectURL(currentBlobUrl);
      currentBlobUrl = null;
    }
    activeAudio = null;
  };

  audio.onended = () => {
    cleanup();
    callbacks?.onEnd?.();
  };

  audio.onerror = (e) => {
    console.warn('Audio element error:', e);
    cleanup();
    fallbackToBrowserSpeech(text, callbacks);
  };

  // جلب الملف الصوتي عبر POST لتفادي قيود طول الرابط على الموبايل
  (async () => {
    try {
      let res: Response | null = null;

      try {
        res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
      } catch (postErr) {
        // في حال فشل POST نتراجع لـ GET
        res = await fetch(`/api/tts?text=${encodeURIComponent(text)}`);
      }

      if (isCancelled) return;

      if (!res || !res.ok) {
        throw new Error(`TTS server returned status ${res?.status || 'unknown'}`);
      }

      const blob = await res.blob();
      if (isCancelled) return;

      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }

      const blobUrl = URL.createObjectURL(blob);
      currentBlobUrl = blobUrl;

      audio.src = blobUrl;
      await audio.play();
    } catch (err: any) {
      if (isCancelled) return;
      console.warn('Network TTS failed, falling back to browser SpeechSynthesis:', err);
      cleanup();
      fallbackToBrowserSpeech(text, callbacks);
    }
  })();

  return () => {
    isCancelled = true;
    stopSpeech();
  };
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
    callbacks?.onError?.('تأكد من تشغيل خدمة الصوت وتوصيل السماعات');
    callbacks?.onEnd?.();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    currentUtterance = utterance;

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
      callbacks?.onError?.('تأكد من تفعيل كارت الصوت والسماعات في جهازك');
      callbacks?.onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    callbacks?.onError?.('تعذر إخراج الصوت - تأكد من السماعات');
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
      activeAudio.removeAttribute('src');
    } catch {}
    activeAudio = null;
  }

  if (currentBlobUrl) {
    try {
      URL.revokeObjectURL(currentBlobUrl);
    } catch {}
    currentBlobUrl = null;
  }

  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
    currentUtterance = null;
  }
}
