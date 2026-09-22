'use client';

import React, { useState } from 'react';
import { RepairSession } from '@/lib/types';
import {
  History,
  FileJson,
  Trash2,
  Download,
  Plus,
  Cpu,
  Terminal,
  Search,
  ChevronLeft,
  X,
} from 'lucide-react';

interface ChatHistorySidebarProps {
  sessions: RepairSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatHistorySidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  isOpen,
  onClose,
}: ChatHistorySidebarProps) {
  const [searchFilter, setSearchFilter] = useState('');

  const filteredSessions = sessions.filter((s) => {
    const q = searchFilter.toLowerCase();
    return (
      s.deviceModel.toLowerCase().includes(q) ||
      s.title.toLowerCase().includes(q) ||
      (s.clientName && s.clientName.toLowerCase().includes(q))
    );
  });

  const downloadSessionJson = (session: RepairSession, e: React.MouseEvent) => {
    e.stopPropagation();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(session, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `dahab_repair_${session.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <>
      {/* خلفية معتمة للهواتف */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 right-0 bottom-0 w-80 max-w-[90vw] bg-workshop-card border-l border-workshop-border z-50 transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* هيدر الشريط الجانبي */}
        <div className="p-4 border-b border-workshop-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-dahab-400" />
            <h2 className="font-bold text-sm text-gray-200">ذاكرة الأجهزة (JSON)</h2>
            <span className="text-[10px] bg-dahab-500/20 text-dahab-400 px-2 py-0.5 rounded-full font-bold">
              {sessions.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onNewSession}
              className="p-1.5 rounded-lg bg-dahab-500/10 hover:bg-dahab-500/20 text-dahab-400 text-xs transition"
              title="فحص جهاز جديد"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white lg:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* البحث في السجلات */}
        <div className="p-3 border-b border-gray-800">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute right-3 top-3" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="ابحث برقم البوردة أو الطراز..."
              className="w-full pr-8 pl-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-dahab-500"
            />
          </div>
        </div>

        {/* قائمة الجلسات السابقة */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredSessions.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-500 space-y-2">
              <FileJson className="w-8 h-8 mx-auto text-gray-600 opacity-60" />
              <p>لا توجد جلسات سابقة مسجلة في ملفات الـ JSON حتى الآن.</p>
              <p className="text-[10px] text-gray-600">
                كل جهاز تفحصه سيتم حفظ كامل بياناته ومحادثاته تلقائياً هنا.
              </p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isHw = session.metrics?.classification === 'HARDWARE';
              const isSw = session.metrics?.classification === 'SOFTWARE';

              return (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`p-3 rounded-xl border text-right cursor-pointer transition relative group ${
                    isActive
                      ? 'bg-dahab-500/15 border-dahab-500 text-white shadow-md'
                      : 'bg-gray-900/60 border-gray-800/80 text-gray-300 hover:bg-gray-850 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="font-bold text-xs line-clamp-1">
                      {session.deviceModel || session.title}
                    </span>

                    {/* بادج الهاردوير / السوفتوير */}
                    {session.metrics && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                          isHw
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : isSw
                            ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {isHw ? 'هاردوير' : isSw ? 'سوفتوير' : 'مشترك'}
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-gray-400 line-clamp-1 mb-2">
                    {session.messages?.[0]?.text || 'جلسة فحص'}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-800/60">
                    <span>{new Date(session.updatedAt).toLocaleDateString('ar-EG')}</span>

                    {/* إجراءات سريعة للجلسة */}
                    <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100">
                      <button
                        onClick={(e) => downloadSessionJson(session, e)}
                        className="p-1 hover:text-sky-400 transition"
                        title="تحميل ملف الـ JSON لهذا الجهاز"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('هل تريد بالتأكيد حذف ملف JSON الخاص بهذا الجهاز؟')) {
                            onDeleteSession(session.id);
                          }
                        }}
                        className="p-1 hover:text-rose-400 transition"
                        title="حذف من الذاكرة"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* فوتر الشريط الجانبي */}
        <div className="p-3 border-t border-workshop-border bg-gray-950/80 text-[11px] text-gray-400 flex items-center justify-between">
          <span>ملفات الذاكرة: data/sessions/</span>
          <FileJson className="w-3.5 h-3.5 text-dahab-400" />
        </div>
      </aside>
    </>
  );
}
