'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, BookOpen, Cpu, FileText, Volume2, VolumeX, Mic } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: string[];
  schematics?: string[];
  relatedTools?: string[];
}

export default function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'مرحباً! أنا مساعدك الذكي في دهب دكتور. يمكنني مساعدتك في تشخيص الأعطال، فهم المخططات الهندسية، الإجابة على أسئلتك التقنية، والتحدث بالصوت. كيف يمكنني مساعدتك اليوم؟',
      timestamp: new Date(),
      relatedTools: ['التشخيص الذكي', 'معمل البوردفيو', 'موسوعة الآيسيهات'],
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  // إزالة التمرير التلقائي - المستخدم يرى الرسائل يدوياً

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
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setIsLoading(true);

    // محاكاة استجابة AI (في الواقع ستتصل بـ API)
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateAIResponse(input),
        timestamp: new Date(),
        sources: ['موسوعة الآيسيهات', 'دليل الصيانة'],
        schematics: ['مخطط الباور الرئيسي', 'مخطط الشحن'],
        relatedTools: getRelatedTools(input),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
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
            <button className="p-2 rounded-lg bg-gray-100 dark:bg-[#1F2937] hover:bg-gray-200 dark:hover:bg-[#374151] transition-colors">
              <BookOpen className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button className="p-2 rounded-lg bg-gray-100 dark:bg-[#1F2937] hover:bg-gray-200 dark:hover:bg-[#374151] transition-colors">
              <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
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
              <p className="text-sm leading-relaxed">{message.content}</p>
              
              {/* Related Tools */}
              {message.relatedTools && message.relatedTools.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#374151]">
                  <p className="text-xs font-medium mb-2 flex items-center gap-1">
                    <Cpu className="w-3 h-3" />
                    الأدوات المرتبطة:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {message.relatedTools.map((tool, index) => (
                      <span
                        key={index}
                        className="text-xs px-3 py-1.5 rounded-full bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-black/30 cursor-pointer transition-colors text-center"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Sources */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#374151]">
                  <p className="text-xs font-medium mb-2 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    المصادر:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {message.sources.map((source, index) => (
                      <span
                        key={index}
                        className="text-xs px-3 py-1.5 rounded-full bg-white/20 dark:bg-black/20 text-center"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Schematics */}
              {message.schematics && message.schematics.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#374151]">
                  <p className="text-xs font-medium mb-2 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    المخططات المرتبطة:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {message.schematics.map((schematic, index) => (
                      <span
                        key={index}
                        className="text-xs px-3 py-1.5 rounded-full bg-white/20 dark:bg-black/20 text-center"
                      >
                        {schematic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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
          <button className="p-2 rounded-xl bg-gray-100 dark:bg-[#1F2937] hover:bg-gray-200 dark:hover:bg-[#374151] transition-colors">
            <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
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
