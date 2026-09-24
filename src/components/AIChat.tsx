'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Volume2, VolumeX, Mic, Cpu } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  image?: string; // صورة مرفقة بالرسالة
  // بيانات خلفية للذكاء الاصطناعي (لا تُعرض في الواجهة)
  _internal?: {
    sources?: string[];
    schematics?: string[];
    relatedTools?: string[];
  };
}

export default function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'مرحباً! أنا مساعدك الذكي في دهب دكتور. يمكنني مساعدتك في تشخيص الأعطال، فهم المخططات الهندسية، الإجابة على أسئلتك التقنية، والتحدث بالصوت. يمكنك أيضاً رفع صور للأجهزة لتحليلها. كيف يمكنني مساعدتك اليوم؟',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  useEffect(() => {
    // تمرير تلقائي عند إضافة رسالة جديدة
    scrollToBottom();
  }, [messages]);

  // Text-to-Speech للردود الصوتية
  const speakText = (text: string) => {
    if (!isVoiceEnabled || typeof window === 'undefined') return;
    
    // إيقاف أي صوت سابق
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    window.speechSynthesis.speak(utterance);
  };

  // تشغيل الصوت عند إضافة رسالة جديدة من المساعد
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      speakText(lastMessage.content);
    }
  }, [messages, isVoiceEnabled]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      image: imageBase64 || undefined,
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // استدعاء API الحقيقي
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          imageBase64: imageBase64,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
          // بيانات خلفية للذكاء الاصطناعي (لا تُعرض في الواجهة)
          _internal: {
            sources: ['موسوعة الآيسيهات', 'دليل الصيانة'],
            schematics: ['مخطط الباور الرئيسي', 'مخطط الشحن'],
            relatedTools: getRelatedTools(input),
          },
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'فشل في الاتصال بالذكاء الاصطناعي');
      }
    } catch (error) {
      console.error('Chat Error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'عذراً، حدث خطأ في الاتصال بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setImageBase64(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getRelatedTools = (query: string): string[] => {
    const lowerQuery = query.toLowerCase();
    const tools: string[] = [];
    
    if (lowerQuery.includes('مخطط') || lowerQuery.includes('schematic')) {
      tools.push('معمل البوردفيو', 'تكامل المخططات');
    }
    if (lowerQuery.includes('آيسي') || lowerQuery.includes('ic')) {
      tools.push('موسوعة الآيسيهات');
    }
    if (lowerQuery.includes('فولت') || lowerQuery.includes('volt')) {
      tools.push('حاسبة الفولت');
    }
    if (lowerQuery.includes('تشخيص') || lowerQuery.includes('عطل')) {
      tools.push('التشخيص الذكي', 'قائمة الفحص');
    }
    if (lowerQuery.includes('بانيك')) {
      tools.push('محلل البانيك');
    }
    
    return tools.length > 0 ? tools : ['التشخيص الذكي', 'معمل البوردفيو'];
  };

  const generateAIResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('مخطط') || lowerQuery.includes('schematic')) {
      return 'بناءً على سؤالك، يمكنني مساعدتك في فهم المخططات الهندسية. لدينا مخططات تفصيلية للبور، الشحن، والمعالج. يمكنك الذهاب إلى معمل البوردفيو لرؤية المخططات التفاعلية. هل تريد أن أشرح لك مسار معين؟';
    }
    
    if (lowerQuery.includes('آيسي') || lowerQuery.includes('ic')) {
      return 'لدينا قاعدة بيانات شاملة للآيسيهات تحتوي على أكثر من 15 آيسي شائع. يمكنك البحث في موسوعة الآيسيهات للحصول على معلومات تفصيلية عن أي آيسي. ما هو الآيسي الذي تريد معرفته؟';
    }
    
    if (lowerQuery.includes('فولت') || lowerQuery.includes('volt')) {
      return 'لتحليل الفولت، يمكنك استخدام حاسبة الفولت في أدواتنا. بشكل عام، الفولت الآمن للمعالجات هو 0.8-1.1 فولت، وللبور 19 فولت. هل تريد تحليل حالة معينة؟';
    }
    
    if (lowerQuery.includes('تشخيص') || lowerQuery.includes('عطل')) {
      return 'يمكنني مساعدتك في تشخيص الأعطال باستخدام الذكاء الاصطناعي المتعدد المحركات. اذهب إلى تبويب التشخيص الذكي وادخل تفاصيل الجهاز والأعراض للحصول على تشخيص دقيق.';
    }
    
    if (lowerQuery.includes('بانيك')) {
      return 'يمكنني تحليل سجلات البانيك لك. اذهب إلى محلل البانيك وأدخل السجل للحصول على تحليل مفصل للأخطاء.';
    }
    
    return 'شكراً لسؤالك. يمكنني مساعدتك في تشخيص الأعطال، فهم المخططات، وتحليل البيانات. لدي أدوات متعددة في اللوحة يمكنني مساعدتك في استخدامها. هل يمكنك تقديم المزيد من التفاصيل حول المشكلة؟';
  };

  const toggleVoice = () => {
    setIsVoiceEnabled(!isVoiceEnabled);
    if (!isVoiceEnabled) {
      window.speechSynthesis.cancel();
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('ميزة التعرف على الصوت غير مدعومة في هذا المتصفح');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'ar-SA';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111827] rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-[#1F2937]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-dahab-500 to-amber-600 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100">مساعد دهب الذكي</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">متصل بـ 4 محركات AI • صوتي</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleVoice}
              className={`p-2 rounded-lg transition-colors ${
                isVoiceEnabled 
                  ? 'bg-dahab-500 text-white' 
                  : 'bg-gray-100 dark:bg-[#1F2937] text-gray-600 dark:text-gray-400'
              }`}
            >
              {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-4 ${
                message.role === 'user'
                  ? 'bg-dahab-500 text-white'
                  : 'bg-gray-100 dark:bg-[#1F2937] text-gray-900 dark:text-gray-100'
              }`}
            >
              {message.image && (
                <img
                  src={message.image}
                  alt="Uploaded"
                  className="max-w-full h-auto rounded-lg mb-2"
                />
              )}
              <p className="text-sm leading-relaxed">{message.content}</p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-[#1F2937] rounded-2xl p-4">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-[#1F2937]">
        <div className="flex gap-2">
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                imageBase64 
                  ? 'bg-dahab-500 text-white' 
                  : 'bg-gray-100 dark:bg-[#1F2937] hover:bg-gray-200 dark:hover:bg-[#374151] text-gray-600 dark:text-gray-400'
              }`}
            >
              <Paperclip className="w-5 h-5" />
            </label>
            {imageBase64 && (
              <button
                onClick={() => setImageBase64(null)}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={handleVoiceInput}
            className={`p-2 rounded-xl transition-colors ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-gray-100 dark:bg-[#1F2937] hover:bg-gray-200 dark:hover:bg-[#374151] text-gray-600 dark:text-gray-400'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isListening ? 'جاري الاستماع...' : 'اكتب سؤالك هنا أو استخدم الميكروفون...'}
            className="flex-1 p-3 rounded-xl bg-gray-100 dark:bg-[#1F2937] border border-gray-200 dark:border-[#374151] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-dahab-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-3 rounded-xl bg-dahab-500 hover:bg-dahab-600 text-white transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
