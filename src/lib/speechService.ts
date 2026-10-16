/**
 * 🎙️ خدمة النطق الصوتي العربي الموحد (Unified Arabic TTS Service)
 * مصممة للعمل بكفاءة فائقة على كافة الأجهزة (موبايل، PWA مثبت، أندرويد كروم، آيفون سفاري، كمبيوتر)
 * 
 * المزايا:
 * 1. فك حظر السياسة الصوتية الصارمة للموبايل (Mobile Autoplay Unlock) لحظياً أثناء الضغط
 * 2. استخدام Web Audio API (AudioContext) للنطق الصافي بدون أي خطأ في فك التشفير
 * 3. دعم التراجع التلقائي لـ HTML5 Audio مع كائن Blob محلي
 * 4. دعم التراجع الأخير لـ SpeechSynthesis
 */

import { cleanAIResponseText } from './cleanResponse';

let activeAudio: HTMLAudioElement | null = null;
let currentBlobUrl: string | null = null;
let activeSourceNode: AudioBufferSourceNode | null = null;
let sharedAudioCtx: AudioContext | null = null;
let currentUtterance: any = null;

// عينة صوتية صامتة لفك حظر الموبايل (48-byte Silent WAV)
const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

/**
 * الحصول على AudioContext موحد مع استئنافه أثناء إيماءة المستخدم
 */
function getOrCreateAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioContextClass();
    }

    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }

    return sharedAudioCtx;
  } catch (e) {
    console.warn('[TTS] AudioContext initialization failed:', e);
    return null;
  }
}

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

  // تقليم النص لأول 350 حرف لتفادي طول الانتظار وضمان استجابة صوتية سريعة وموجزة
  if (cleaned.length > 350) {
    const periodIdx = cleaned.indexOf('.', 200);
    if (periodIdx !== -1 && periodIdx < 380) {
      cleaned = cleaned.slice(0, periodIdx + 1);
    } else {
      cleaned = cleaned.slice(0, 330) + '...';
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

  // 1. 🚀 فك حظر الصوت في الموبايل والـ PWA بشكل تزامني فوري داخل إيماءة اللمس الحالية
  const audioCtx = getOrCreateAudioContext();

  const primeAudio = new Audio(SILENT_WAV);
  activeAudio = primeAudio;
  primeAudio.play().catch(() => {}); // استهلاك إذن اللمس فورياً

  callbacks?.onStart?.();

  let isCancelled = false;

  const cleanup = () => {
    if (currentBlobUrl) {
      URL.revokeObjectURL(currentBlobUrl);
      currentBlobUrl = null;
    }
    if (activeSourceNode) {
      try { activeSourceNode.stop(); } catch {}
      activeSourceNode = null;
    }
    activeAudio = null;
  };

  // 2. جلب الملف الصوتي من السيرفر وتشغيله
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
        throw new Error(`TTS server status ${res?.status || 'network_error'}`);
      }

      const arrayBuffer = await res.arrayBuffer();
      if (isCancelled) return;

      // 3. المسار الأول المفضل للموبايل: التشغيل عبر Web Audio API (مستقل تماماً عن مشاكل كودك الـ Media Element)
      if (audioCtx && audioCtx.state !== 'closed') {
        try {
          if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
          }

          // فك تشفير الـ ArrayBuffer مباشرة في كارت الصوت
          const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
          if (isCancelled) return;

          const sourceNode = audioCtx.createBufferSource();
          sourceNode.buffer = decodedBuffer;
          sourceNode.connect(audioCtx.destination);
          activeSourceNode = sourceNode;

          sourceNode.onended = () => {
            cleanup();
            callbacks?.onEnd?.();
          };

          sourceNode.start(0);
          console.log('[TTS] Successfully playing via Web Audio API');
          return;
        } catch (webAudioErr) {
          console.warn('[TTS] Web Audio decode failed, falling back to Blob Audio Element:', webAudioErr);
        }
      }

      // 4. المسار الثاني: التشغيل عبر عنصر Audio مع Blob محلي
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }

      const blobUrl = URL.createObjectURL(blob);
      currentBlobUrl = blobUrl;

      primeAudio.src = blobUrl;
      primeAudio.onended = () => {
        cleanup();
        callbacks?.onEnd?.();
      };
      primeAudio.onerror = (e) => {
        console.warn('[TTS] Blob Audio error:', e);
        cleanup();
        fallbackToBrowserSpeech(text, callbacks);
      };

      await primeAudio.play();
      console.log('[TTS] Successfully playing via Blob Audio Element');
    } catch (err: any) {
      if (isCancelled) return;
      console.warn('[TTS] Network TTS failed, falling back to browser SpeechSynthesis:', err);
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
  if (activeSourceNode) {
    try {
      activeSourceNode.stop();
    } catch {}
    activeSourceNode = null;
  }

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
