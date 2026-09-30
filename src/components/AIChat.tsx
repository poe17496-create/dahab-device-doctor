'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  X,
  Cpu,
  Trash2,
  Paperclip,
  Send,
  Plus,
  History,
  RotateCcw,
  Sparkles,
  Check,
  AlertCircle,
  Clock,
  ChevronLeft,
} from 'lucide-react';
import { consumeGuestTrial } from '@/lib/guestUsage';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  image?: string;
  audioBlobUrl?: string;
  _internal?: {
    sources?: string[];
    schematics?: string[];
    relatedTools?: string[];
  };
}

interface SavedChatSession {
  id: string;
  title: string;
  date: string;
  messageCount: number;
  preview: string;
  messages: any[];
}

const INITIAL_MESSAGE: ChatMessage = {
  id: '1',
  role: 'assistant',
  content:
    'مرحباً بك في مساعد دهب دكتور الهندسي! 🛠️⚡\nأنا هنا لمساعدتك في تحليل المخططات الهندسية (Schematics/Boardview)، تشخيص مسارات الباور والشحن، استخراج بدائل الآيسيهات، وحل أعطال البوردات المعقدة بالذكاء الاصطناعي. يمكنك أيضاً التحدث بالصوت 🎙️ أو رفع صور المخططات والبوردات لفحصها مباشرة. كيف يمكنني مساعدتك؟',
  timestamp: new Date(),
};

export default function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dahab-chat-history');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            }));
          }
        } catch (e) {
          console.error('Failed to load chat history:', e);
        }
      }
    }
    return [INITIAL_MESSAGE];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [savedSessions, setSavedSessions] = useState<SavedChatSession[]>([]);

  // حالة التسجيل الصوتي البديل (MediaRecorder للـ PWA والمتصفحات التي لا تدعم Web Speech)
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [micErrorBanner, setMicErrorBanner] = useState<string | null>(null);
  const [showMicModal, setShowMicModal] = useState(false);
  const [micModalError, setMicModalError] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const speakTimerRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // تحميل جلسات المحادثات المحفوظة
  const loadSavedSessions = () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('dahab_saved_chat_sessions');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSavedSessions(parsed);
      }
    } catch {}
  };

  useEffect(() => {
    loadSavedSessions();
  }, []);

  // حفظ المحادثة الحالية في localStorage تلقائياً
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      try {
        localStorage.setItem('dahab-chat-history', JSON.stringify(messages));
      } catch (e) {
        console.warn('Could not save active chat to localStorage:', e);
      }
    }
  }, [messages]);

  // إخفاء إشعار التوست بعد 3 ثوانٍ
  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  // تنظيف التعرف الصوتي والتسجيل عند إغلاق المكون
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // دالة بدء محادثة جديدة مع أرشفة المحادثة الحالية
  const handleNewChat = () => {
    // 1. أرشفة المحادثة الحالية إذا كانت تحتوي على رسائل من المستخدم
    const userMsgs = messages.filter((m) => m.role === 'user');
    if (userMsgs.length > 0) {
      const firstUserMsg = userMsgs[0].content || 'محادثة هندسية';
      const title = firstUserMsg.length > 35 ? firstUserMsg.slice(0, 35) + '...' : firstUserMsg;

      const newSession: SavedChatSession = {
        id: `chat_${Date.now()}`,
        title,
        date: new Date().toLocaleDateString('ar-EG', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
        messageCount: messages.length,
        preview: userMsgs[userMsgs.length - 1]?.content || '',
        messages: messages,
      };

      try {
        const existing = JSON.parse(localStorage.getItem('dahab_saved_chat_sessions') || '[]');
        const updated = [newSession, ...existing.filter((s: any) => s.id !== newSession.id)].slice(0, 30);
        localStorage.setItem('dahab_saved_chat_sessions', JSON.stringify(updated));
        setSavedSessions(updated);
      } catch (e) {
        console.warn('Could not archive session:', e);
      }
    }

    // 2. إعادة ضبط المحادثة
    if (typeof window !== 'undefined') {
      window.speechSynthesis?.cancel();
    }
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content:
          'مرحباً بك مجدداً في جلسة محادثة جديدة! 🛠️⚡\nأنا جاهز لمساعدتك في فحص أي عطل، أو قراءة المخططات وبدائل الآيسيهات. ما هو العطل أو الجهاز الذي تعمل عليه الآن؟',
        timestamp: new Date(),
      },
    ]);
    setInput('');
    setImageBase64(null);
    setToastMsg('تم بدء محادثة جديدة بنجاح وحفظ السابقة في الأرشيف ✅');
  };

  // استرجاع محادثة مؤرشفة
  const handleRestoreSession = (session: SavedChatSession) => {
    if (session.messages && session.messages.length > 0) {
      setMessages(
        session.messages.map((m) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }))
      );
      setShowHistoryModal(false);
      setToastMsg(`تم استرجاع: "${session.title}" ✅`);
    }
  };

  // حذف محادثة مؤرشفة
  const handleDeleteSavedSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedSessions.filter((s) => s.id !== sessionId);
    setSavedSessions(updated);
    try {
      localStorage.setItem('dahab_saved_chat_sessions', JSON.stringify(updated));
    } catch {}
  };

  // تهيئة أصوات النطق باللغة العربية عند فتح المكون
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // إجبار المتصفح على تحميل الأصوات مبكراً
      window.speechSynthesis.getVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
  }, []);

  // 🎙️ محرك النطق الصوتي الفوري المباشر (Direct Responsive SpeechSynthesis)
  const speakText = (text: string, msgId?: string) => {
    console.log('speakText called with text:', text.substring(0, 50));
    
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.log('SpeechSynthesis not available');
      return;
    }
    
    console.log('SpeechSynthesis available');

    // إذا كان المساعد يقرأ نفس الرسالة حالياً، نوقفه فوراً (Toggle Stop)
    if (speakingMessageId && (!msgId || speakingMessageId === msgId)) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    // إيقاف أي قراءة سابقة فوراً
    window.speechSynthesis.cancel();

    // تنظيف النص البسيط
    const cleanText = text.replace(/[*#_`~\[\]\(\)>]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanText) return;

    const targetId = msgId || Date.now().toString();

    // إنشاء utterance أبسط
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ar-SA';

    utterance.onstart = () => {
      console.log('SpeechSynthesis onstart fired');
      setSpeakingMessageId(targetId);
    };

    utterance.onend = () => {
      console.log('SpeechSynthesis onend fired');
      setSpeakingMessageId(null);
    };

    utterance.onerror = (e) => {
      console.log('SpeechSynthesis onerror fired:', e.error);
      setSpeakingMessageId(null);
    };

    // تشغيل مباشر
    console.log('About to speak:', utterance.text);
    window.speechSynthesis.speak(utterance);
    console.log('Speak called');
  };

  // إرسال الرسالة
  const handleSend = async (overrideText?: string) => {
    const textToSend = (overrideText || input).trim();
    if ((!textToSend && !imageBase64) || isLoading) return;

    // فحص رصيد التجارب الموحد للزائر
    const trial = consumeGuestTrial('ai-chat');
    if (!trial.success) {
      const limitMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content:
          '⚠️ انتهت تجاربك المجانية اليومية (5 من 5).\n\nللحصول على وصول غير محدود لمساعد الذكاء الاصطناعي ومحاكي البورد فيو والتشخيص، سجّل الدخول بحساب فني معتمد أو تواصل مع م. إسلام دهب على واتساب: 01064147224',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, limitMsg]);
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend || 'تحليل الصورة المرفقة',
      timestamp: new Date(),
      image: imageBase64 || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let customKeys: any = undefined;
      try {
        const stored = localStorage.getItem('dahab_system_api_keys');
        if (stored) customKeys = JSON.parse(stored);
      } catch {}

      const historyPayload = messages.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          imageBase64,
          chatHistory: historyPayload,
          customKeys,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `خطأ في الخادم (${res.status})`);
      }

      const data = await res.json();
      // السيرفر يرجع { message: "..." } — لا { response: "..." }
      const aiReply = data.message || data.response || data.text || 'عذراً، لم يتوفر رد من المحرك. تأكد من مفاتيح AI في الإعدادات.';

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiReply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ تعذر إكمال الرد: ${err?.message || 'تأكد من اتصال الإنترنت أو صلاحية مفاتيح الذكاء الاصطناعي في لوحة المفاتيح'}.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setImageBase64(null);
    }
  };

  // نظام المايكروفون الذكي المزدوج (Web Speech + MediaRecorder Fallback)
  const handleVoiceInput = async () => {
    setMicErrorBanner(null);

    // 1. إذا كان الميكروفون يستمع بالفعل، نوقفه فوراً (Toggle)
    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setIsListening(false);
      return;
    }

    if (isRecordingAudio) {
      stopAudioRecording();
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    // 2. إذا كان Web Speech API مدعوماً (Chrome, Edge, Safari الحديث)
    if (SpeechRecognition) {
      try {
        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch {}
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.lang = 'ar-EG';
        recognition.continuous = false;
        recognition.interimResults = true;

        let accumulated = '';

        recognition.onstart = () => {
          setIsListening(true);
          setMicErrorBanner(null);
        };

        recognition.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              accumulated += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          const textToDisplay = (accumulated || interim).trim();
          if (textToDisplay) setInput(textToDisplay);
        };

        recognition.onerror = (event: any) => {
          setIsListening(false);
          if (event.error === 'not-allowed') {
            setShowMicModal(true);
          } else if (event.error === 'audio-capture') {
            setMicModalError(
              '🔌 عطل هاردوير: لم يتم العثور على ميكروفون متصل بالكمبيوتر (No audio device found).\nيرجى توصيل سماعة رأس أو مايك خارجي بجهازك، أو استخدام الموبايل للتحدث.'
            );
            setShowMicModal(true);
          } else if (event.error === 'no-speech') {
            setToastMsg('لم يتم التقاط أي صوت، تحدث بوضوح بالقرب من المايك');
          }
        };

        recognition.onend = () => { setIsListening(false); };

        recognition.start();
        return;
      } catch (e) {
        console.warn('SpeechRecognition failed, falling back to MediaRecorder:', e);
      }
    }

    // 3. Fallback: تسجيل صوتي مباشر (MediaRecorder) لمتصفحات الموبايل والـ PWA
    startAudioRecordingFallback();
  };

  const startAudioRecordingFallback = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setShowMicModal(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        setIsRecordingAudio(false);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        setRecordingSeconds(0);

        if (audioChunksRef.current.length > 0) {
          setInput((prev) => (prev ? prev + ' [سؤال صوتي مرفق]' : 'تحليل العطل من التسجيل الصوتي'));
          setToastMsg('تم حفظ تسجيلك الصوتي بنجاح، يمكنك الضغط على إرسال الآن 🎙️');
        }
      };

      recorder.start();
      setIsRecordingAudio(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('getUserMedia error:', err);
      const errName = err?.name || '';
      const errMsg = String(err?.message || '').toLowerCase();
      const isNotFound =
        errName === 'NotFoundError' ||
        errName === 'DevicesNotFoundError' ||
        errMsg.includes('not found') ||
        errMsg.includes('can not be found') ||
        errMsg.includes('cannot be found');

      if (isNotFound) {
        setMicModalError(
          '🔌 عطل هاردوير: لم يتم العثور على ميكروفون متصل بجهازك (No audio input device found).\nجهاز الكمبيوتر لا يجد أي مايك أو سماعة هيدسيت متصلة. يرجى توصيل سماعة أو فتح المنظومة من متصفح الهاتف.'
        );
        setShowMicModal(true);
      } else {
        // خطأ آخر - لا تظهر المودال للتجنب من الإزعاج
        console.log('Microphone access error (non-critical):', errName);
      }
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingAudio(false);
  };

  // طلب إذن الميكروفون المباشر من خلال تفاعل المستخدم (User Gesture)
  const handleRequestMicPermissionDirectly = async () => {
    setMicModalError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicModalError('متصفحك الحالي لا يدعم واجهة الميكروفون المباشرة');
      return;
    }

    // 1. فحص وجود أجهزة إدخال صوتية فيزيائية
    try {
      if (navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasAudioInput = devices.some((d) => d.kind === 'audioinput');
        if (devices.length > 0 && !hasAudioInput) {
          setMicModalError(
            '🔌 عطل هاردوير: جهاز الكمبيوتر لا يحتوي على ميكروفون متصل (No Microphone Found).\nلا توجد أي سماعة أو مايك خارجي موصل بالكمبيوتر. يرجى توصيل سماعة أو استخدام متصفح الموبايل للتحدث الصوتي.'
          );
          return;
        }
      }
    } catch {}

    // 2. طلب الميكروفون الفعلي
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setShowMicModal(false);
      setToastMsg('✅ تم تفعيل الميكروفون بنجاح! جاري بدء الاستماع...');
      setTimeout(() => {
        handleVoiceInput();
      }, 300);
    } catch (err: any) {
      console.warn('Microphone permission request rejected:', err);
      const errName = err?.name || '';
      const errMsg = String(err?.message || '').toLowerCase();
      const isNotFound =
        errName === 'NotFoundError' ||
        errName === 'DevicesNotFoundError' ||
        errMsg.includes('not found') ||
        errMsg.includes('can not be found') ||
        errMsg.includes('cannot be found');

      if (isNotFound) {
        setMicModalError(
          '🔌 عطل هاردوير: لم يتم العثور على ميكروفون متصل بالكمبيوتر (The object can not be found).\nالكمبيوتر لا يجد أي جهاز إدخال صوتي (مايك أو سماعة رأس موصلة). يرجى توصيل سماعة بها مايك بالكمبيوتر، أو تجربة المساعد من متصفح الهاتف المحمول، أو كتابة السؤال مباشرة.'
        );
      } else {
        setMicModalError(
          'المتصفح حظر الميكروفون مسبقاً لهذا الموقع. يرجى إلغاء الحظر من أيقونة الإعدادات 🎛️ أو القفل 🔒 أعلى يسار شريط العنوان بجانب رابط الموقع، وتغيير الميكروفون إلى "سماح"، ثم الضغط على زر إعادة التحميل أدناه.'
        );
      }
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
    <div className="flex flex-col h-full bg-white dark:bg-[#111827] rounded-3xl shadow-xl border border-gray-200/80 dark:border-gray-800 overflow-hidden relative" dir="rtl">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-slate-900/90 text-white text-xs font-bold shadow-2xl border border-amber-500/40 flex items-center gap-2 animate-fadeIn backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white/95 dark:bg-[#111827]/95 border-b border-gray-200/80 dark:border-gray-800 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          {/* Logo & Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-dahab-500 to-amber-400 flex items-center justify-center shadow-md shrink-0">
              <Cpu className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-black text-gray-900 dark:text-white truncate">
                مساعد دهب الذكي
              </h2>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                تحليل المخططات والأعطال بالذكاء الاصطناعي
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* زر محادثة جديدة */}
            <button
              type="button"
              onClick={handleNewChat}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-dahab-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition shadow-sm"
              title="بدء جلسة جديدة وحفظ الحالية في الأرشيف"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">محادثة جديدة</span>
            </button>

            {/* زر سجل المحادثات */}
            <button
              type="button"
              onClick={() => {
                loadSavedSessions();
                setShowHistoryModal(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold transition"
              title="سجل المحادثات المؤرشفة"
            >
              <History className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden md:inline">السجل ({savedSessions.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] md:max-w-[78%] rounded-2xl p-4 shadow-sm ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-dahab-500 to-amber-600 text-slate-950 font-medium'
                  : 'bg-gray-50 dark:bg-[#1A2234] text-gray-900 dark:text-gray-100 border border-gray-200/60 dark:border-gray-800'
              }`}
            >
              {message.image && (
                <div className="mb-2.5">
                  <img
                    src={message.image}
                    alt="Uploaded Schematic or Board"
                    className="max-w-full max-h-72 object-contain rounded-xl border border-gray-300 dark:border-gray-700 shadow-md"
                  />
                  <span className="text-[10px] text-gray-400 block mt-1">📐 تم إرفاق صورة/مخطط للفحص</span>
                </div>
              )}

              <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {message.content}
              </p>

              {message.role === 'assistant' && (
                <>
                  <div className="mt-2.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-700 dark:text-amber-300 flex items-start gap-1.5 leading-snug">
                    <span className="shrink-0 text-xs">⚠️</span>
                    <span><strong>تنبيه هندسي:</strong> هذه الاقتراحات معتمدة على تحليل المخططات بالذكاء الاصطناعي. يُرجى مراجعة قياسات الممانعة بنفسك على المازربورد قبل حقن الفولت لتفادي تلف المعالج.</span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between text-[10px] text-gray-400">
                  <span>
                    {message.timestamp
                      ? new Date(message.timestamp).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => speakText(message.content, message.id)}
                    className={`flex items-center gap-1.5 transition px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                      speakingMessageId === message.id
                        ? 'bg-amber-500 text-slate-950 shadow-md animate-pulse ring-2 ring-amber-400'
                        : 'text-gray-500 hover:text-amber-500 hover:bg-gray-200/40 dark:hover:bg-gray-800'
                    }`}
                    title={speakingMessageId === message.id ? 'إيقاف القراءة الصوتية' : 'قراءة الرد صوتياً'}
                  >
                    {speakingMessageId === message.id ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
                        <span>⏹️ إيقاف</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                        <span>استماع</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 dark:bg-[#1A2234] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping delay-150" />
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping delay-300" />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                جاري تحليل المخطط وفحص الأعطال عبر الذكاء الاصطناعي...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white/95 dark:bg-[#111827]/95 border-t border-gray-200 dark:border-gray-800 p-3">
        {/* مؤشر التسجيل الصوتي إن كان جارياً */}
        {isRecordingAudio && (
          <div className="mb-2 p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs text-rose-600 dark:text-rose-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span>جاري تسجيل الصوت: {recordingSeconds} ثانية...</span>
            </div>
            <button
              type="button"
              onClick={stopAudioRecording}
              className="px-2.5 py-1 rounded-lg bg-rose-500 text-white text-[11px] font-bold"
            >
              إنهاء التسجيل
            </button>
          </div>
        )}

        {/* بانر خطأ الميكروفون — يظهر داخل الشات بدل popup متصفح */}
        {micErrorBanner && (
          <div className="mb-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300 animate-fadeIn">
            <span className="shrink-0 mt-0.5 text-base">⚠️</span>
            <p className="flex-1 leading-relaxed">{micErrorBanner}</p>
            <button
              type="button"
              onClick={() => setMicErrorBanner(null)}
              className="shrink-0 text-amber-500 hover:text-amber-700 text-base font-bold"
              title="إغلاق"
            >
              ×
            </button>
          </div>
        )}


        <div className="flex items-center gap-2">
          {/* رفع صورة */}
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="chat-image-upload"
            />
            <label
              htmlFor="chat-image-upload"
              className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                imageBase64
                  ? 'bg-dahab-500 text-slate-950 font-bold shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
              title="إرفاق صورة بوردة أو مخطط"
            >
              <Paperclip className="w-4 h-4" />
            </label>
            {imageBase64 && (
              <button
                type="button"
                onClick={() => setImageBase64(null)}
                className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center shadow"
              >
                ✕
              </button>
            )}
          </div>

          {/* زر المايكروفون الذكي (يدعم الـ PWA والتطبيق المثبت) */}
          <button
            onClick={handleVoiceInput}
            type="button"
            title={
              isListening
                ? 'إيقاف الاستماع'
                : 'تحدث بالصوت (يدعم التطبيق المثبت وجميع المتصفحات)'
            }
            className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${
              isListening || isRecordingAudio
                ? 'bg-rose-500 text-white animate-pulse shadow-lg ring-2 ring-rose-400'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* حقل الكتابة */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              isListening
                ? 'جاري الاستماع إليك مباشرة... تحدث الآن'
                : 'اكتب سؤالك عن البوردة أو العطل، أو استخدم المايك 🎙️...'
            }
            className="flex-1 p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 text-xs md:text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500 transition"
          />

          {/* زر الإرسال */}
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={(!input.trim() && !imageBase64) || isLoading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-dahab-500 to-amber-600 hover:from-dahab-600 hover:to-amber-700 text-slate-950 font-black transition disabled:opacity-40 shadow-md flex items-center justify-center"
            title="إرسال"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal سجل المحادثات المؤرشفة */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-3xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-black text-gray-900 dark:text-white">
                  أرشيف المحادثات السابقة
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {savedSessions.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400 space-y-2">
                  <Clock className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto" />
                  <p>لا توجد محادثات مؤرشفة بعد.</p>
                  <p className="text-[11px] text-gray-500">
                    عند الضغط على <strong>"محادثة جديدة"</strong> يتم حفظ المحادثة الحالية تلقائياً هنا للرجوع إليها في أي وقت.
                  </p>
                </div>
              ) : (
                savedSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleRestoreSession(session)}
                    className="p-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-amber-500/50 bg-gray-50 dark:bg-gray-800/40 hover:bg-amber-500/5 transition cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <strong className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate block">
                          {session.title}
                        </strong>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 shrink-0">
                          {session.messageCount} رسائل
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                        {session.preview}
                      </p>
                      <span className="text-[10px] text-gray-400 mt-1 block">
                        {session.date}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteSavedSession(session.id, e)}
                      title="حذف من الأرشيف"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 transition opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal تفعيل الميكروفون المباشر */}
      {showMicModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#111827] border border-dahab-500/40 rounded-3xl max-w-md w-full shadow-2xl p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-dahab-500 to-amber-500 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-dahab-500/30 animate-pulse">
              <Mic className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-black text-gray-900 dark:text-gray-100">
                السماح بإذن الميكروفون للمنظومة
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                للتحدث صوتياً مع المساعد الذكي، يحتاج المتصفح لموافقتك على إذن الصوت
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-right space-y-2 text-xs text-gray-700 dark:text-gray-300">
              <p className="font-bold text-amber-800 dark:text-amber-400">💡 خطوات الموافقة والتفعيل السريع:</p>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                <span>اضغط على الزر الذهبي بالأسفل ليطلب المتصفح الإذن واضغط <strong>"سماح" (Allow)</strong>.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                <span>إذا كان المايك محظوراً بالمتصفح، انظر لأعلى يسار الشاشة بجانب الرابط واضغط على <strong>أيقونة الإعدادات 🎛️ أو القفل 🔒</strong>.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                <span>أمام <strong>الميكروفون (Microphone)</strong> غيره إلى <strong>"سماح" (Allow)</strong> ثم اضغط "إعادة تحميل الصفحة".</span>
              </div>
            </div>

            {/* رسالة الخطأ في حالة حظر المتصفح للإذن أو عدم وجود جهاز مايك فيزيائي */}
            {micModalError && (
              <div
                className={`p-3.5 rounded-2xl border text-xs text-right leading-relaxed space-y-2.5 animate-fadeIn ${
                  micModalError.includes('عطل هاردوير') || micModalError.includes('لا يوجد')
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="text-base">
                    {micModalError.includes('عطل هاردوير') ? '🔌' : '⚠️'}
                  </span>
                  <span>
                    {micModalError.includes('عطل هاردوير')
                      ? 'تنبيه أجهزة الصوت (Microphone Hardware)'
                      : 'الميكروفون محظور في متصفحك حالياً'}
                  </span>
                </div>
                <p className="text-[11px] whitespace-pre-wrap leading-relaxed">{micModalError}</p>
                {!micModalError.includes('عطل هاردوير') && (
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95"
                  >
                    <span>🔄 إعادة تحميل الصفحة الآن (بعد السماح بالمايك)</span>
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleRequestMicPermissionDirectly}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-dahab-500 to-amber-600 hover:from-dahab-600 hover:to-amber-700 text-slate-950 font-black text-xs transition shadow-lg shadow-dahab-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Mic className="w-4 h-4 fill-slate-950" />
                <span>🎙️ طلب إذن المتصفح الآن (اضغط للموافقة)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMicModal(false);
                  setMicModalError(null);
                }}
                className="w-full py-2 rounded-xl text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xs font-bold transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
