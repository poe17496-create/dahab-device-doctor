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
  Share2,
  Award,
  User,
} from 'lucide-react';
import { CommonFault } from '@/lib/types';
import ShareRepairCaseModal from '@/components/ShareRepairCaseModal';

interface CommonFaultsLibraryProps {
  onApplyFault?: (fault: CommonFault) => void;
}

export default function CommonFaultsLibrary({ onApplyFault }: CommonFaultsLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [filteredFaults, setFilteredFaults] = useState<CommonFault[]>([]);
  const [communityCases, setCommunityCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'community'>('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.append('q', searchTerm);
        if (selectedBrand && selectedBrand !== 'all') params.append('brand', selectedBrand);

        const [faultsRes, casesRes] = await Promise.all([
          fetch(`/api/common-faults?${params.toString()}`).then((r) => r.json()).catch(() => ({ results: [] })),
          fetch('/api/case-studies?status=verified').then((r) => r.json()).catch(() => ({ caseStudies: [] })),
        ]);

        setFilteredFaults(faultsRes.results || []);
        setCommunityCases(casesRes.caseStudies || []);
      } catch (error) {
        console.error('Error fetching faults & case studies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchTerm, selectedBrand]);

  const handleApplyFault = (fault: CommonFault) => {
    if (onApplyFault) {
      onApplyFault(fault);
    }
  };

  const brands = ['all', 'Apple', 'Samsung', 'MacBook', 'Other'] as const;

  // دمج الحالات المجتمعية المعتمدة
  const displayCommunityCases = communityCases.filter((c) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (c.device_model && c.device_model.toLowerCase().includes(q)) ||
      (c.title && c.title.toLowerCase().includes(q)) ||
      (c.solution && c.solution.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-dahab-500" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            موسوعة الأعطال والتجارب التشاركية المعتمدة
          </h3>
          <span className="text-xs text-gray-400">
            ({filteredFaults.length + displayCommunityCases.length} عطل وتجربة)
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowShareModal(true)}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>💡 شارك تجربة إصلاحك مع المجتمع</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث عن موديل، كود آيسي، أو عطل شائـع..."
            className="w-full pr-10 pl-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500"
          />
        </div>
        <select
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500"
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
        {/* تجارب المجتمع المعتمدة أولاً */}
        {displayCommunityCases.map((cs) => (
          <div
            key={cs.id}
            className="bg-white dark:bg-gray-900 border-2 border-emerald-500/40 rounded-2xl p-4 space-y-3 hover:border-emerald-500 transition shadow-sm relative overflow-hidden"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-black text-sm text-gray-900 dark:text-gray-100">
                    {cs.device_model}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <Award className="w-3 h-3 text-emerald-500" />
                    <span>تجربة مجتمعية معتمدة</span>
                  </span>
                </div>
                <div className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                  {cs.title}
                </div>
              </div>
              <div className="text-left text-[10px] text-gray-400 flex items-center gap-1">
                <User className="w-3 h-3 text-emerald-500" />
                <span>المهندس: {cs.created_by || 'فني معتمد'}</span>
              </div>
            </div>

            {cs.symptoms && (
              <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                <strong>الأعراض:</strong> {cs.symptoms}
              </div>
            )}

            <div className="text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <strong className="text-emerald-700 dark:text-emerald-400">الحل والقطع المستبدلة:</strong>{' '}
              {cs.solution}
            </div>

            {cs.related_ics && cs.related_ics.length > 0 && (
              <div className="text-[11px] text-gray-500 flex items-center gap-1">
                <Target className="w-3 h-3 text-dahab-500" />
                <span>المكون المسبب: <strong>{cs.related_ics.join(', ')}</strong></span>
              </div>
            )}
          </div>
        ))}

        {/* الأعطال الشائعة القياسية */}
        {filteredFaults.map((fault) => (
          <div
            key={fault.id}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 space-y-3 hover:border-dahab-500/50 transition"
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
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5">
              <div className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-1">
                <Target className="w-3 h-3 text-dahab-500" />
                <span>القطعة المشتبه بها:</span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{fault.suspectedComponent}</div>
            </div>

            {/* Measurement Test */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-2.5">
              <div className="text-[11px] font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1 mb-1">
                <Zap className="w-3 h-3 text-blue-500" />
                <span>طريقة الفحص:</span>
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">{fault.measurementTest}</div>
            </div>

            {/* Action */}
            {onApplyFault && (
              <button
                onClick={() => handleApplyFault(fault)}
                className="w-full py-2 bg-gradient-to-r from-dahab-500 to-amber-600 hover:from-dahab-600 text-slate-950 rounded-xl text-xs font-black transition flex items-center justify-center gap-2"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>تطبيق هذا العطل على الفحص الحالي</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* نافذة مشاركة تجربة الإصلاح */}
      <ShareRepairCaseModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
}
