'use client';

import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Send, X } from 'lucide-react';

interface FeedbackWidgetProps {
  sessionId: string;
  deviceModel: string;
  aiOutput: string;
  onFeedbackSubmit?: (feedback: FeedbackData) => void;
}

interface FeedbackData {
  sessionId: string;
  deviceModel: string;
  aiOutput: string;
  wasAccurate: boolean;
  correctedComponent?: string;
  timestamp: string;
}

export default function FeedbackWidget({
  sessionId,
  deviceModel,
  aiOutput,
  onFeedbackSubmit,
}: FeedbackWidgetProps) {
  const [feedbackGiven, setFeedbackGiven] = useState<boolean | null>(null);
  const [showCorrectionInput, setShowCorrectionInput] = useState(false);
  const [correctedComponent, setCorrectedComponent] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = (accurate: boolean) => {
    setFeedbackGiven(accurate);
    if (!accurate) {
      setShowCorrectionInput(true);
    } else {
      submitFeedback(accurate);
    }
  };

  const submitFeedback = async (accurate: boolean) => {
    const feedbackData: FeedbackData = {
      sessionId,
      deviceModel,
      aiOutput,
      wasAccurate: accurate,
      correctedComponent: !accurate ? correctedComponent : undefined,
      timestamp: new Date().toISOString(),
    };

    try {
      // إرسال البيانات إلى الـ API
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData),
      });

      setSubmitted(true);
      if (onFeedbackSubmit) onFeedbackSubmit(feedbackData);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const handleCorrectionSubmit = () => {
    if (correctedComponent.trim()) {
      submitFeedback(false);
    }
  };

  if (submitted) {
    return (
      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-center">
        <p className="text-xs font-bold text-green-700 dark:text-green-300">
          ✅ شكراً لمساعدتك في تحسين النظام!
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
      <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 text-center">
        هل كان التشخيص دقيقاً؟
      </p>

      {feedbackGiven === null ? (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => handleFeedback(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition font-bold text-sm"
          >
            <ThumbsUp className="w-4 h-4" />
            <span>نعم 👍</span>
          </button>
          <button
            onClick={() => handleFeedback(false)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition font-bold text-sm"
          >
            <ThumbsDown className="w-4 h-4" />
            <span>لا، القطعة التالفة كانت مختلفة 👎</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {feedbackGiven ? (
            <p className="text-xs text-center text-green-600 dark:text-green-400 font-bold">
              ✅ رائع! نقدر ملاحظاتك
            </p>
          ) : null}

          {showCorrectionInput && (
            <div className="space-y-2 animate-fadeIn">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                اكتب رمز القطعة أو المسار الصحيح (مثال: U2001 / C1502):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={correctedComponent}
                  onChange={(e) => setCorrectedComponent(e.target.value)}
                  placeholder="رمز القطعة الصحيح..."
                  className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500"
                />
                <button
                  onClick={handleCorrectionSubmit}
                  disabled={!correctedComponent.trim()}
                  className="flex items-center gap-1 px-3 py-2 bg-dahab-500 hover:bg-dahab-600 text-white rounded-lg transition font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-3 h-3" />
                  <span>إرسال</span>
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setFeedbackGiven(null);
              setShowCorrectionInput(false);
              setCorrectedComponent('');
            }}
            className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition mx-auto"
          >
            <X className="w-3 h-3" />
            <span>إعادة المحاولة</span>
          </button>
        </div>
      )}
    </div>
  );
}
