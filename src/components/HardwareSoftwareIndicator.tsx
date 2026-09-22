'use client';

import React from 'react';
import { DiagnosticMetrics } from '@/lib/types';
import { Cpu, Terminal, AlertTriangle, CheckCircle, Zap, ShieldAlert } from 'lucide-react';

interface HardwareSoftwareIndicatorProps {
  metrics?: DiagnosticMetrics;
}

export default function HardwareSoftwareIndicator({ metrics }: HardwareSoftwareIndicatorProps) {
  if (!metrics) return null;

  const isHardware = metrics.classification === 'HARDWARE';
  const isSoftware = metrics.classification === 'SOFTWARE';
  const isHybrid = metrics.classification === 'HYBRID';

  const hwPct = metrics.hardwareProbability ?? (isHardware ? 90 : isSoftware ? 10 : 50);
  const swPct = metrics.softwareProbability ?? (100 - hwPct);

  return (
    <div className="bg-gradient-to-br from-workshop-card to-gray-900 border-2 border-dahab-500/40 rounded-2xl p-5 shadow-2xl space-y-4">
      {/* الترويسة الرئيسية والبادج */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-workshop-border pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2.5 rounded-xl flex items-center justify-center ${
              isHardware
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : isSoftware
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}
          >
            {isHardware ? (
              <Cpu className="w-6 h-6" />
            ) : isSoftware ? (
              <Terminal className="w-6 h-6" />
            ) : (
              <Zap className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium">القرار التشخيصي النهائي للمنظومة:</div>
            <div className="text-lg font-black tracking-wide flex items-center gap-2">
              <span
                className={
                  isHardware
                    ? 'text-rose-400'
                    : isSoftware
                    ? 'text-sky-400'
                    : 'text-amber-400'
                }
              >
                {isHardware
                  ? '🛠️ عطل هاردوير قاطع (Hardware Component Failure)'
                  : isSoftware
                  ? '💾 عطل سوفتوير / فريموير (Software/Firmware Failure)'
                  : '⚡ عطل هجين مشترك (Hybrid HW/SW Fault)'}
              </span>
            </div>
          </div>
        </div>

        {/* مؤشر مستوى الخطورة */}
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1.5 ${
              metrics.urgencyLevel === 'CRITICAL'
                ? 'bg-red-950/60 text-red-400 border-red-500 animate-pulse'
                : metrics.urgencyLevel === 'HIGH'
                ? 'bg-amber-950/60 text-amber-400 border-amber-500'
                : 'bg-blue-950/60 text-blue-400 border-blue-500'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>حالة العطل: {metrics.urgencyLevel === 'CRITICAL' ? 'حرج جداً (شورت مباشر)' : 'يحتاج قياس وتتبع'}</span>
          </span>
        </div>
      </div>

      {/* شريط المقارنة والنسب المئوية (Hardware vs Software Gauge) */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs font-bold">
          <span className="flex items-center gap-1.5 text-rose-400">
            <Cpu className="w-4 h-4" /> نسبة الهاردوير: {hwPct}%
          </span>
          <span className="flex items-center gap-1.5 text-sky-400">
            نسبة السوفتوير: {swPct}% <Terminal className="w-4 h-4" />
          </span>
        </div>

        <div className="h-4 w-full bg-gray-950 rounded-full overflow-hidden flex p-0.5 border border-gray-800">
          <div
            style={{ width: `${hwPct}%` }}
            className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-r-full transition-all duration-700 relative group"
            title={`هاردوير: ${hwPct}%`}
          />
          <div
            style={{ width: `${swPct}%` }}
            className="h-full bg-gradient-to-r from-sky-400 to-sky-600 rounded-l-full transition-all duration-700 relative group"
            title={`سوفتوير: ${swPct}%`}
          />
        </div>
      </div>

      {/* تفاصيل المكون المشتبه به والتوصية الفورية */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {metrics.primarySuspectComponent && (
          <div className="bg-gray-950/80 border border-workshop-border rounded-xl p-3">
            <div className="text-[11px] text-gray-400 font-semibold mb-1 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-dahab-400" />
              <span>المكون أو المسار المشتبه به الرئيسي:</span>
            </div>
            <div className="text-sm font-bold text-gray-100">
              {metrics.primarySuspectComponent}
            </div>
          </div>
        )}

        {metrics.recommendedAction && (
          <div className="bg-gray-950/80 border border-workshop-border rounded-xl p-3">
            <div className="text-[11px] text-gray-400 font-semibold mb-1 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>التوصية الهندسية الأولى للفني:</span>
            </div>
            <div className="text-sm font-bold text-emerald-300">
              {metrics.recommendedAction}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
