'use client';

import React from 'react';
import { FileText, Zap, Cpu, AlertTriangle } from 'lucide-react';
import {
  IntegratedDiagnosticContext,
  generateSchematicIntegrationReport,
} from '@/lib/schematicIntegration';

interface SchematicIntegrationReportProps {
  context: IntegratedDiagnosticContext;
}

export default function SchematicIntegrationReport({
  context,
}: SchematicIntegrationReportProps) {
  const report = generateSchematicIntegrationReport(context);

  return (
    <div className="bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border rounded-2xl p-5 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-dahab-600 dark:text-dahab-400" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
          تقرير تكامل المخططات والتحليل الهندسي
        </h3>
      </div>

      <div className="space-y-4">
        {/* تحليل مسارات الباور */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">
              تحليل مسارات الباور
            </h4>
          </div>

          <div className="space-y-2">
            {context.powerRailAnalysis.map((rail) => {
              const statusColors = {
                ok: 'text-green-600 dark:text-green-400',
                low: 'text-amber-600 dark:text-amber-400',
                high: 'text-amber-600 dark:text-amber-400',
                short: 'text-red-600 dark:text-red-400',
                missing: 'text-red-600 dark:text-red-400',
              };

              return (
                <div
                  key={rail.railName}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {rail.railName}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      ({rail.expectedVoltage}V)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={statusColors[rail.status]}>
                      {rail.status.toUpperCase()}
                    </span>
                    {rail.critical && (
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* نقاط الفحص المقترحة */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">
              نقاط الفحص المقترحة
            </h4>
          </div>

          <div className="space-y-1">
            {context.suggestedTestPoints.map((point, index) => (
              <div
                key={index}
                className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2"
              >
                <span className="font-bold text-dahab-600 dark:text-dahab-400">
                  {index + 1}.
                </span>
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* الآيسيهات المرتبطة */}
        {context.relatedICs.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">
                الآيسيهات المرتبطة بالعطل
              </h4>
            </div>

            <div className="space-y-3">
              {context.relatedICs.map((ic) => (
                <div
                  key={ic.partNumber}
                  className="text-xs border-l-2 border-dahab-500 pl-3"
                >
                  <div className="font-bold text-gray-900 dark:text-gray-100">
                    {ic.partNumber} - {ic.function}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 mt-1">
                    {ic.commonSymptoms}
                  </div>
                  <div className="text-gray-500 dark:text-gray-500 mt-1">
                    البدائل: {ic.compatibles.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
