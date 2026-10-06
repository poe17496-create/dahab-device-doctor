'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, X, Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  highlightedComponents?: Array<{
    name: string;
    location: { x: number; y: number };
    description: string;
  }>;
  relatedNets?: Array<{
    name: string;
    description: string;
    voltage?: number;
  }>;
}

interface SchematicChatProps {
  schematicUrl: string | null;
  boardImageUrl?: string | null;
  boardName?: string;
  deviceModel?: string;
  onComponentHighlight?: (components: Array<{ name: string; location: { x: number; y: number } }>) => void;
  onNetHighlight?: (nets: Array<{ name: string }>) => void;
  className?: string;
  currentUser?: { isGuest?: boolean } | null;
}

export function SchematicChat({
  schematicUrl,
  boardImageUrl,
  boardName,
  deviceModel,
  onComponentHighlight,
  onNetHighlight,
  className = '',
  currentUser,
}: SchematicChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Use schematicUrl if available, otherwise use boardImageUrl
    const imageUrl = schematicUrl || boardImageUrl;

    if (!imageUrl) {
      setError('⚠️ No image loaded. Please load a board image or schematic first.');
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/schematic-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schematicUrl: imageUrl,
          question: input,
          context: {
            boardName,
            deviceModel,
            isBoardImage: !schematicUrl, // Flag to indicate this is a board image
            previousQuestions: messages.map((m) => ({
              question: m.role === 'user' ? m.content : '',
              answer: m.role === 'assistant' ? m.content : '',
            })),
          },
          isGuest: currentUser?.isGuest === true,
        }),
      });

      // التعامل مع حالة 429 (تجاوز الحد المسموح للزائر)
      if (response.status === 429) {
        const data = await response.json();
        setError(data.error || '⚠️ لقد استنفدت محاولاتك المجانية اليومية (5/5). يرجى تسجيل الدخول للحصول على وصول كامل.');
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.answer,
          timestamp: new Date(),
          highlightedComponents: data.highlightedComponents,
          relatedNets: data.relatedNets,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Trigger highlights if available
        if (data.highlightedComponents && onComponentHighlight) {
          onComponentHighlight(data.highlightedComponents);
        }
        if (data.relatedNets && onNetHighlight) {
          onNetHighlight(data.relatedNets);
        }
      } else {
        setError(data.error || 'Failed to get response');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 md:p-4 rounded-full shadow-2xl hover:from-purple-700 hover:to-pink-700 transition-all ${className}`}
        title="Chat with Schematic AI"
      >
        <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-16 md:bottom-6 right-2 md:right-6 z-50 w-[calc(100vw-16px)] md:w-96 h-[calc(100dvh-64px)] md:h-[500px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col border border-gray-300 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-white" />
          <div>
            <h3 className="text-white font-semibold">Schematic AI Chat</h3>
            <p className="text-white/70 text-xs">Ask about the schematic</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white/70 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Ask me anything about the schematic</p>
            <p className="text-xs mt-2">Example: "What is at position X=50, Y=30?"</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-3 ${
                message.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>

              {/* Highlighted Components */}
              {message.highlightedComponents && message.highlightedComponents.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                  <p className="text-xs font-semibold mb-1">Highlighted Components:</p>
                  {message.highlightedComponents.map((comp, idx) => (
                    <div key={idx} className="text-xs bg-gray-200 dark:bg-gray-700/50 rounded p-1 mt-1">
                      <span className="font-medium">{comp.name}</span>
                      <span className="text-gray-600 dark:text-gray-400 ml-2">({comp.location.x}%, {comp.location.y}%)</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Related Nets */}
              {message.relatedNets && message.relatedNets.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                  <p className="text-xs font-semibold mb-1">Related Nets:</p>
                  {message.relatedNets.map((net, idx) => (
                    <div key={idx} className="text-xs bg-gray-200 dark:bg-gray-700/50 rounded p-1 mt-1">
                      <span className="font-medium">{net.name}</span>
                      {net.voltage && <span className="text-gray-600 dark:text-gray-400 ml-2">{net.voltage}V</span>}
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs opacity-50 mt-2">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Analyzing schematic...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-start">
            <div className="bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 rounded-2xl p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-700 dark:text-red-200">{error}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-300 dark:border-gray-700">
        {!schematicUrl && !boardImageUrl && (
          <div className="bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700 rounded-lg p-2 mb-2">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">⚠️ No image loaded. Please load a board image or schematic first.</p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">💡 Tip: Search for a board or upload an image to enable chat</p>
          </div>
        )}
        {!schematicUrl && boardImageUrl && (
          <div className="bg-blue-100 dark:bg-blue-900/50 border border-blue-300 dark:border-blue-700 rounded-lg p-2 mb-2">
            <p className="text-xs text-blue-800 dark:text-blue-200">ℹ️ Using board image for analysis (no schematic loaded)</p>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={schematicUrl ? "Ask about the schematic..." : "Ask about the board..."}
            disabled={(!schematicUrl && !boardImageUrl) || loading}
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || (!schematicUrl && !boardImageUrl) || loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
