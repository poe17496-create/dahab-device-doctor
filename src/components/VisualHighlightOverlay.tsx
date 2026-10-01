'use client';

import React from 'react';
import { Target, AlertTriangle } from 'lucide-react';

interface TargetRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface VisualHighlightOverlayProps {
  imageBase64: string | null;
  targetRegion?: TargetRegion;
}

export default function VisualHighlightOverlay({
  imageBase64,
  targetRegion,
}: VisualHighlightOverlayProps) {
  if (!imageBase64) {
    return (
      <div className="p-12 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-center">
        <Target className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          قم برفع صورة البوردة لتفعيل التظليل المرئي
        </p>
      </div>
    );
  }

  return (
    <div className="relative inline-block w-full">
      <img
        src={imageBase64}
        alt="Board Image"
        className="w-full h-auto rounded-lg shadow-lg"
      />

      {/* Visual Highlight Overlay */}
      {targetRegion && (
        <>
          {/* Pulsing Red Highlight Box */}
          <div
            className="absolute border-4 border-red-500 rounded-lg animate-pulse opacity-70 shadow-lg shadow-red-500/50"
            style={{
              left: `${targetRegion.x}%`,
              top: `${targetRegion.y}%`,
              width: `${targetRegion.width}%`,
              height: `${targetRegion.height}%`,
            }}
          />

          {/* Highlight Label Card */}
          <div
            className="absolute bg-red-500 text-white px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2 text-xs font-bold z-10"
            style={{
              left: `${targetRegion.x}%`,
              top: `calc(${targetRegion.y}% - 40px)`,
            }}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>المنطقة المشتبه بها</span>
          </div>

          {/* Corner Markers */}
          <div
            className="absolute w-4 h-4 border-l-4 border-t-4 border-red-500"
            style={{
              left: `${targetRegion.x}%`,
              top: `${targetRegion.y}%`,
            }}
          />
          <div
            className="absolute w-4 h-4 border-r-4 border-t-4 border-red-500"
            style={{
              left: `calc(${targetRegion.x}% + ${targetRegion.width}% - 16px)`,
              top: `${targetRegion.y}%`,
            }}
          />
          <div
            className="absolute w-4 h-4 border-l-4 border-b-4 border-red-500"
            style={{
              left: `${targetRegion.x}%`,
              top: `calc(${targetRegion.y}% + ${targetRegion.height}% - 16px)`,
            }}
          />
          <div
            className="absolute w-4 h-4 border-r-4 border-b-4 border-red-500"
            style={{
              left: `calc(${targetRegion.x}% + ${targetRegion.width}% - 16px)`,
              top: `calc(${targetRegion.y}% + ${targetRegion.height}% - 16px)`,
            }}
          />
        </>
      )}

      {!targetRegion && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
          <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg text-sm font-bold text-gray-800 dark:text-gray-200">
            📍 جاري تحليل الصورة...
          </div>
        </div>
      )}
    </div>
  );
}
