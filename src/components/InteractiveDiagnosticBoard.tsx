'use client';

import React, { useState } from 'react';
import { Target, Zap, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface TestPoint {
  name: string;
  expectedValue: string;
  coordinates: { x: number; y: number };
  instruction: string;
  status?: 'safe' | 'short' | 'open' | 'unknown';
}

interface InteractiveDiagnosticBoardProps {
  testPoints?: TestPoint[];
  imageBase64?: string | null;
}

export default function InteractiveDiagnosticBoard({
  testPoints = [],
  imageBase64,
}: InteractiveDiagnosticBoardProps) {
  const [hoveredPoint, setHoveredPoint] = useState<TestPoint | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<TestPoint | null>(null);

  if (!imageBase64 && testPoints.length === 0) {
    return (
      <div className="p-12 bg-gray-900 border border-gray-700 rounded-xl text-center">
        <Target className="w-16 h-16 mx-auto text-gray-600 mb-4" />
        <p className="text-sm text-gray-400">
          قم برفع صورة البوردة وطلب التشخيص لتفعيل لوحة القياس التفاعلية
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Schematic Blueprint Canvas */}
      <div className="relative bg-gray-900 border-2 border-gray-700 rounded-xl overflow-hidden">
        {/* Grid Background */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, #4a5568 1px, transparent 1px),
              linear-gradient(to bottom, #4a5568 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />

        {/* Board Image or Placeholder */}
        {imageBase64 ? (
          <img
            src={imageBase64}
            alt="Board Schematic"
            className="w-full h-auto opacity-90"
          />
        ) : (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <Zap className="w-12 h-12 mx-auto text-dahab-500 mb-2" />
              <p className="text-sm text-gray-400">المخطط الهندسي</p>
            </div>
          </div>
        )}

        {/* Interactive Glowing Pins */}
        {testPoints.map((point, idx) => (
          <div
            key={idx}
            className="absolute cursor-pointer group"
            style={{
              left: `${point.coordinates.x}%`,
              top: `${point.coordinates.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            onMouseEnter={() => setHoveredPoint(point)}
            onMouseLeave={() => setHoveredPoint(null)}
            onClick={() => setSelectedPoint(point)}
          >
            {/* Glowing Pin */}
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                selectedPoint === point
                  ? 'bg-dahab-500 border-dahab-300 shadow-lg shadow-dahab-500/50 scale-125'
                  : 'bg-gray-800 border-dahab-500 group-hover:bg-dahab-500 group-hover:scale-110'
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full ${
                  selectedPoint === point
                    ? 'bg-white animate-pulse'
                    : 'bg-dahab-500 group-hover:bg-white'
                }`}
              />
            </div>

            {/* Pin Label */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded border border-gray-600 whitespace-nowrap">
              {point.name}
            </div>

            {/* Hover Tooltip */}
            {hoveredPoint === point && (
              <div className="absolute -right-32 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-xl w-48 z-20">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-dahab-500" />
                  <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                    {point.name}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Info className="w-3 h-3" />
                    <span>القيمة المتوقعة: {point.expectedValue}</span>
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {point.instruction}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Selected Point Details Panel */}
      {selectedPoint && (
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 animate-fadeIn">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-dahab-500" />
              <h3 className="font-bold text-gray-900 dark:text-gray-100">
                نقطة القياس: {selectedPoint.name}
              </h3>
            </div>
            <button
              onClick={() => setSelectedPoint(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">القيمة المتوقعة</div>
              <div className="text-sm font-bold text-dahab-600 dark:text-dahab-400">
                {selectedPoint.expectedValue}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">الحالة</div>
              <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <span>اختبار مطلوب</span>
              </div>
            </div>
          </div>

          <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                <span className="font-bold block mb-1">خطوة الفحص:</span>
                {selectedPoint.instruction}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-dahab-500" />
          <span>نقطة قياس نشطة</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gray-800 border-2 border-dahab-500" />
          <span>نقطة قياس غير نشطة</span>
        </div>
      </div>
    </div>
  );
}
