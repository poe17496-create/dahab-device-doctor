'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  AlertTriangle,
  Wrench,
  Target,
  Sparkles,
  Filter,
  X,
  Zap,
  CheckCircle,
} from 'lucide-react';
import { CommonFault } from '@/lib/types';
import commonFaultsData from '@/data/commonFaults.json';

interface CommonFaultsLibraryProps {
  onApplyFault?: (fault: CommonFault) => void;
}

export default function CommonFaultsLibrary({ onApplyFault }: CommonFaultsLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [filteredFaults, setFilteredFaults] = useState<CommonFault[]>(commonFaultsData);

  useEffect(() => {
    let filtered = commonFaultsData;

    // Filter by brand
    if (selectedBrand !== 'all') {
      filtered = filtered.filter((fault) => fault.brand === selectedBrand);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (fault) =>
          fault.model.toLowerCase().includes(term) ||
          fault.faultName.toLowerCase().includes(term) ||
          fault.symptoms.some((s) => s.toLowerCase().includes(term))
      );
    }

    setFilteredFaults(filtered);
  }, [searchTerm, selectedBrand]);

  const handleApplyFault = (fault: CommonFault) => {
    if (onApplyFault) {
      onApplyFault(fault);
    }
  };

  const brands = ['all', 'Apple', 'Samsung', 'MacBook', 'Other'] as const;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-dahab-500" />
          <span>مكتبة الأعطال الشائعة</span>
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {filteredFaults.length} عطل
        </span>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث عن موديل أو عطل..."
            className="w-full pr-10 pl-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500"
          />
        </div>
        <select
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500"
        >
          {brands.map((brand) => (
            <option key={brand} value={brand}>
              {brand === 'all' ? 'الكل' : brand}
            </option>
          ))}
        </select>
      </div>

      {/* Faults List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {filteredFaults.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Filter className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">لا توجد أعطال مطابقة للبحث</p>
          </div>
        ) : (
          filteredFaults.map((fault) => (
            <div
              key={fault.id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-3 hover:border-dahab-500/50 transition"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                      {fault.model}
                    </span>
                    {fault.isFactoryFault && (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold rounded-full border border-amber-500/30">
                        ⚠️ عطل مصنعي
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-dahab-600 dark:text-dahab-400 font-medium">
                    {fault.faultName}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    <span>{fault.successRate}%</span>
                  </div>
                </div>
              </div>

              {/* Symptoms */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  <span>الأعراض:</span>
                </div>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5 list-disc list-inside">
                  {fault.symptoms.map((symptom, idx) => (
                    <li key={idx}>{symptom}</li>
                  ))}
                </ul>
              </div>

              {/* Suspected Component */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                <div className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-1">
                  <Target className="w-3 h-3 text-dahab-500" />
                  <span>القطعة المشتبه بها:</span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{fault.suspectedComponent}</div>
              </div>

              {/* Measurement Test */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                <div className="text-[11px] font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1 mb-1">
                  <Zap className="w-3 h-3 text-blue-500" />
                  <span>طريقة الفحص:</span>
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">{fault.measurementTest}</div>
              </div>

              {/* Fix Steps Preview */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Wrench className="w-3 h-3 text-purple-500" />
                  <span>خطوات الإصلاح:</span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {fault.fixSteps.slice(0, 2).map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-dahab-500">{idx + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                  {fault.fixSteps.length > 2 && (
                    <div className="text-gray-400 italic">+ {fault.fixSteps.length - 2} خطوات أخرى</div>
                  )}
                </div>
              </div>

              {/* Apply Button */}
              <button
                onClick={() => handleApplyFault(fault)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-dahab-500 to-amber-600 hover:from-dahab-600 hover:to-amber-700 text-slate-950 px-4 py-2 rounded-lg font-bold text-xs transition shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                <span>تطبيقه على نموذج الفحص</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
