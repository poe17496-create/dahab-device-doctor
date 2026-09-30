'use client';

import React, { useState, useEffect } from 'react';
import { Mic, Volume2, Check, X, AlertCircle } from 'lucide-react';

export default function TestAudioPage() {
  const [speechStatus, setSpeechStatus] = useState<'unknown' | 'supported' | 'not-supported'>('unknown');
  const [micStatus, setMicStatus] = useState<'unknown' | 'supported' | 'not-supported' | 'permission-denied'>('unknown');
  const [voices, setVoices] = useState<any[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [micTestResult, setMicTestResult] = useState<string | null>(null);

  useEffect(() => {
    // فحص دعم SpeechSynthesis
    if (typeof window !== 'undefined') {
      const hasSpeech = 'speechSynthesis' in window;
      setSpeechStatus(hasSpeech ? 'supported' : 'not-supported');

      if (hasSpeech) {
        const loadVoices = () => {
          try {
            const v = window.speechSynthesis.getVoices();
            setVoices(v);
          } catch (e) {
            console.error('Error loading voices:', e);
          }
        };
        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = loadVoices;
        }
      }

      // فحص دعم getUserMedia
      const hasMic = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
      setMicStatus(hasMic ? 'supported' : 'not-supported');
    }
  }, []);

  const testSpeech = () => {
    if (!('speechSynthesis' in window)) {
      setTestResult('❌ SpeechSynthesis غير مدعوم');
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance('هذا اختبار للنطق الصوتي');
      utterance.lang = 'ar-SA';
      utterance.rate = 1.0;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setTestResult('✅ جاري النطق...');
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setTestResult('✅ تم النطق بنجاح!');
      };

      utterance.onerror = (e) => {
        setIsSpeaking(false);
        setTestResult(`❌ فشل النطق: ${e.error}`);
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      setTestResult(`❌ خطأ: ${String(e)}`);
    }
  };

  const testMic = async () => {
    if (!('mediaDevices' in navigator) || !('getUserMedia' in navigator.mediaDevices)) {
      setMicTestResult('❌ getUserMedia غير مدعوم');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicTestResult('✅ المايك يعمل! (تم الحصول على الصوت)');
      stream.getTracks().forEach(track => track.stop());
    } catch (e: any) {
      const errName = e?.name || '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setMicTestResult('❌ تم رفض إذن المايك');
        setMicStatus('permission-denied');
      } else if (errName === 'NotFoundError') {
        setMicTestResult('❌ لم يتم العثور على مايك');
      } else {
        setMicTestResult(`❌ خطأ: ${errName} - ${e?.message || ''}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          اختبار الصوت والمايك
        </h1>

        {/* Speech Synthesis Test */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <Volume2 className="w-6 h-6 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              اختبار النطق الصوتي (SpeechSynthesis)
            </h2>
          </div>

          <div className="flex items-center gap-2 mb-4">
            {speechStatus === 'supported' ? (
              <Check className="w-5 h-5 text-green-500" />
            ) : (
              <X className="w-5 h-5 text-red-500" />
            )}
            <span className="text-sm text-gray-600 dark:text-gray-400">
              الحالة: {speechStatus === 'supported' ? 'مدعوم' : 'غير مدعوم'}
            </span>
          </div>

          {speechStatus === 'supported' && (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                عدد الأصوات المتاحة: {voices.length}
              </div>
              {voices.length > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-500 max-h-32 overflow-y-auto">
                  <strong>الأصوات العربية:</strong>
                  <ul className="mt-1 space-y-1">
                    {voices.filter(v => v.lang.toLowerCase().startsWith('ar')).map((v, i) => (
                      <li key={i} className="truncate">
                        {v.name} ({v.lang})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                onClick={testSpeech}
                disabled={isSpeaking}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 transition"
              >
                {isSpeaking ? 'جاري النطق...' : 'اختبار النطق'}
              </button>
              {testResult && (
                <div className={`p-3 rounded-lg text-sm ${
                  testResult.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {testResult}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Microphone Test */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <Mic className="w-6 h-6 text-green-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              اختبار المايكروفون (getUserMedia)
            </h2>
          </div>

          <div className="flex items-center gap-2 mb-4">
            {micStatus === 'supported' ? (
              <Check className="w-5 h-5 text-green-500" />
            ) : micStatus === 'permission-denied' ? (
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            ) : (
              <X className="w-5 h-5 text-red-500" />
            )}
            <span className="text-sm text-gray-600 dark:text-gray-400">
              الحالة: {
                micStatus === 'supported' ? 'مدعوم' :
                micStatus === 'permission-denied' ? 'الإذن مرفوض' :
                'غير مدعوم'
              }
            </span>
          </div>

          {micStatus === 'supported' && (
            <div className="space-y-3">
              <button
                onClick={testMic}
                disabled={isListening}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 transition"
              >
                {isListening ? 'جاري الاختبار...' : 'اختبار المايك'}
              </button>
              {micTestResult && (
                <div className={`p-3 rounded-lg text-sm ${
                  micTestResult.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {micTestResult}
                </div>
              )}
            </div>
          )}

          {micStatus === 'permission-denied' && (
            <div className="p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
              <strong>كيفية السماح بالمايك:</strong>
              <ol className="mt-2 list-decimal list-inside space-y-1">
                <li>اضغط على أيقونة القفل 🔒 بجانب الرابط</li>
                <li>غيّر الميكروفون إلى "سماح"</li>
                <li>أعد تحميل الصفحة</li>
              </ol>
            </div>
          )}
        </div>

        {/* Browser Info */}
        <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            معلومات المتصفح
          </h3>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <div>User Agent: {navigator.userAgent}</div>
            <div>Platform: {navigator.platform}</div>
            <div>Language: {navigator.language}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
