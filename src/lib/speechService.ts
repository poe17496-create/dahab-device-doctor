/**
 * 🎙️ خدمة النطق الصوتي العربي الموحد (Unified Arabic TTS Service)
 * مصممة للعمل بكفاءة فائقة على كافة الأجهزة (موبايل، PWA مثبت، أندرويد كروم، آيفون سفاري، كمبيوتر)
 * 
 * المزايا:
 * 1. استدعاء متزامن فوري لعنصر الصوت داخل إيماءة اللمس (User Gesture) لتخطي حظر الموبايل الصارم بنسبة 100%
 * 2. بث مباشر عالي النقاء من مسار /api/tts بدون تأخير تنزيل الملف كاملاً
 * 3. تراجع تلقائي لمحرك SpeechSynthesis المدمج في حال انقطاع الشبكة
 * 4. تنظيف كامل للنصوص من أي وسوم أو إيموجي قبل النطق
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

  // تقليم النص لأول 220 حرف لتفادي طول الرابط ولضمان استجابة صوتية فورية
  if (cleaned.length > 220) {
    const periodIdx = cleaned.indexOf('.', 140);
    if (periodIdx !== -1 && periodIdx < 230) {
      cleaned = cleaned.slice(0, periodIdx + 1);
    } else {
      cleaned = cleaned.slice(0, 200) + '...';
    }
  }

  return cleaned;
}

/**
 * تشغيل النطق الصوتي العربي
 * يتم استدعاؤه مباشرة داخل معالج حدث النقر/اللمس
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
  // 1. إيقاف أي صوت يعمل حالياً
  stopSpeech();

  const text = prepareTextForSpeech(rawText);
  if (!text) {
    callbacks?.onError?.('لا يوجد نص صالح للنطق');
    return () => {};
  }

  // 2. تجهيز رابط البث الصوتي
  const audioUrl = `/api/tts?text=${encodeURIComponent(text)}`;

  try {
    // 3. 🚀 إنشاء عنصر الصوت واستدعاء play() فورياً وبشكل متزامن داخل إيماءة المستخدم الحالية
    // هذا هو المعيار القياسي لمتصفحات الموبايل (iOS Safari و Android Chrome)
    const audio = new Audio();
    activeAudio = audio;
    audio.preload = 'auto';

    audio.onplay = () => {
      callbacks?.onStart?.();
    };

    audio.onended = () => {
      if (activeAudio === audio) {
        activeAudio = null;
      }
      callbacks?.onEnd?.();
    };

    audio.onerror = (e) => {
      console.warn('[TTS] Native Audio error, attempting browser speech synthesis fallback:', e);
      if (activeAudio === audio) {
        activeAudio = null;
      }
      fallbackToBrowserSpeech(text, callbacks);
    };

    // تعيين المصدر والبدء فورياً داخل الإيماءة
    audio.src = audioUrl;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('[TTS] audio.play() rejected:', err);
        if (activeAudio === audio) {
          activeAudio = null;
        }
        fallbackToBrowserSpeech(text, callbacks);
      });
    }
  } catch (err: any) {
    console.warn('[TTS] Exception in audio setup, falling back to speech synthesis:', err);
    fallbackToBrowserSpeech(text, callbacks);
  }

  return () => {
    stopSpeech();
  };
}

/**
 * التراجع لمحرك المتصفح المحلي في حالة تعذر تشغيل الصوت الشبكي
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
    callbacks?.onError?.('تأكد من تشغيل الصوت في جهازك');
    callbacks?.onEnd?.();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    currentUtterance = utterance;

    utterance.lang = 'ar-SA';
    utterance.rate = 1.0;

    // محاولة اختيار صوت عربي مسجل إن وجد
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(
      (v) => v.lang.startsWith('ar') || v.name.toLowerCase().includes('arabic')
    );
    if (arabicVoice) {
      utterance.voice = arabicVoice;
    }

    utterance.onstart = () => {
      callbacks?.onStart?.();
    };

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
 * إيقاف الصوت الحالي تماماً وتحرير الموارد
 */
export function stopSpeech() {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio.removeAttribute('src');
      activeAudio.load();
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
