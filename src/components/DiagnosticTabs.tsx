'use client';

import React, { useState } from 'react';
import { MessageSquare, LayoutGrid, Image } from 'lucide-react';

interface DiagnosticTabsProps {
  activeTab: 'report' | 'visual';
  onTabChange: (tab: 'report' | 'visual') => void;
  reportContent: React.ReactNode;
  visualContent: React.ReactNode;
}

export default function DiagnosticTabs({
  activeTab,
  onTabChange,
  reportContent,
  visualContent,
}: DiagnosticTabsProps) {
  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-2 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
        <button
          onClick={() => onTabChange('report')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${
            activeTab === 'report'
              ? 'bg-white dark:bg-gray-800 text-dahab-600 dark:text-dahab-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>الشات والتقرير التشخيصي</span>
        </button>
        <button
          onClick={() => onTabChange('visual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${
            activeTab === 'visual'
              ? 'bg-white dark:bg-gray-800 text-dahab-600 dark:text-dahab-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>لوحة التشخيص المرئية</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="animate-fadeIn">
        {activeTab === 'report' ? reportContent : visualContent}
      </div>
    </div>
  );
}
