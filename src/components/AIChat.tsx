'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, BookOpen, Cpu, FileText } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: string[];
  schematics?: string[];
}

export default function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'مرحباً! أنا مساعدك الذكي في دهب دكتور. يمكنني مساعدتك في تشخيص الأعطال، فهم المخططات الهندسية، والإجابة على أسئلتك التقنية. كيف يمكنني مساعدتك اليوم؟',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const generateAIResponse = (query: string): string => {
    // محاكاة استجابة ذكية بناءً على السؤال
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('مخطط') || lowerQuery.includes('schematic')) {
      return 'بناءً على سؤالك، يمكنني مساعدتك في فهم المخططات الهندسية. لدينا مخططات تفصيلية للبور، الشحن، والمعالج. هل تريد أن أشرح لك مسار معين؟';
    }
    
    if (lowerQuery.includes('آيسي') || lowerQuery.includes('ic')) {
      return 'لدينا قاعدة بيانات شاملة للآيسيهات. يمكنني مساعدتك في تحديد الآيسي، فهم وظيفته، وتشخيص الأعطال المحتملة. ما هو الآيسي الذي تريد معرفته؟';
    }
    
    if (lowerQuery.includes('فولت') || lowerQuery.includes('volt')) {
      return 'لتحليل الفولت، يمكنك استخدام حاسبة الفولت في أدواتنا. بشكل عام، الفولت الآمن للمعالجات هو 0.8-1.1 فولت، وللبور 19 فولت. هل تريد تحليل حالة معينة؟';
    }
    
    return 'شكراً لسؤالك. يمكنني مساعدتك في تشخيص الأعطال، فهم المخططات، وتحليل البيانات. هل يمكنك تقديم المزيد من التفاصيل حول المشكلة؟';
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
              <p className="text-xs text-gray-500 dark:text-gray-400">متصل بـ 4 محركات AI</p>
            </div>
          </div>
          <div className="flex gap-2">
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
              className={`max-w-[80%] rounded-2xl p-4 ${
                message.role === 'user'
                  ? 'bg-dahab-500 text-white'
                  : 'bg-gray-100 dark:bg-[#1F2937] text-gray-900 dark:text-gray-100'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              
              {/* Sources and Schematics */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-[#374151]">
                  <p className="text-xs font-medium mb-1">المصادر:</p>
                  <div className="flex flex-wrap gap-1">
                    {message.sources.map((source, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 rounded-full bg-white/20 dark:bg-black/20"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {message.schematics && message.schematics.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-[#374151]">
                  <p className="text-xs font-medium mb-1">المخططات المرتبطة:</p>
                  <div className="flex flex-wrap gap-1">
                    {message.schematics.map((schematic, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 rounded-full bg-white/20 dark:bg-black/20"
                      >
                        {schematic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs mt-2 opacity-70">
                {message.timestamp.toLocaleTimeString('ar-SA')}
              </p>
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
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="اكتب سؤالك هنا..."
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
