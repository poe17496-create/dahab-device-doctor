'use client';

import React from 'react';
import { Target, AlertTriangle, Crosshair, ZoomIn, Layers } from 'lucide-react';

interface TargetRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface VisualHighlightOverlayProps {
  imageBase64: string | null;
  targetRegion?: TargetRegion;
  highlightedComponent?: string | null;
  isAnalysing?: boolean;
}

export default function VisualHighlightOverlay({
  imageBase64,
  targetRegion,
  highlightedComponent,
  isAnalysing = false,
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
        className="w-full h-auto rounded-lg shadow-2xl"
      />

      {/* Enhanced Visual Highlight Overlay */}
      {targetRegion && (
        <>
          {/* Multi-layer glow effect */}
          <div
            className="absolute rounded-xl animate-pulse"
            style={{
              left: `${targetRegion.x}%`,
              top: `${targetRegion.y}%`,
              width: `${targetRegion.width}%`,
              height: `${targetRegion.height}%`,
              background: 'radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, transparent 70%)',
              boxShadow: '0 0 30px rgba(239, 68, 68, 0.5), 0 0 60px rgba(239, 68, 68, 0.3)',
            }}
          />

          {/* Primary highlight box */}
          <div
            className="absolute border-2 border-red-500 rounded-xl"
            style={{
              left: `${targetRegion.x}%`,
              top: `${targetRegion.y}%`,
              width: `${targetRegion.width}%`,
              height: `${targetRegion.height}%`,
              boxShadow: 'inset 0 0 20px rgba(239, 68, 68, 0.3), 0 0 40px rgba(239, 68, 68, 0.2)',
            }}
          />

          {/* Animated scan line */}
          <div
            className="absolute h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-scan"
            style={{
              left: `${targetRegion.x}%`,
              top: `${targetRegion.y + targetRegion.height / 2}%`,
              width: `${targetRegion.width}%`,
              animation: 'scan 2s linear infinite',
            }}
          />

          {/* Corner brackets with icons */}
          <div
            className="absolute -left-1 -top-1 w-6 h-6 border-l-4 border-t-4 border-dahab-500 bg-dahab-500/10 rounded-tl-lg"
            style={{
              left: `${targetRegion.x}%`,
              top: `${targetRegion.y}%`,
            }}
          >
            <Crosshair className="absolute -left-2 -top-2 w-3 h-3 text-dahab-500" />
          </div>
          <div
            className="absolute -right-1 -top-1 w-6 h-6 border-r-4 border-t-4 border-dahab-500 bg-dahab-500/10 rounded-tr-lg"
            style={{
              left: `calc(${targetRegion.x}% + ${targetRegion.width}% - 16px)`,
              top: `${targetRegion.y}%`,
            }}
          >
            <Crosshair className="absolute -right-2 -top-2 w-3 h-3 text-dahab-500" />
          </div>
          <div
            className="absolute -left-1 -bottom-1 w-6 h-6 border-l-4 border-b-4 border-dahab-500 bg-dahab-500/10 rounded-bl-lg"
            style={{
              left: `${targetRegion.x}%`,
              top: `calc(${targetRegion.y}% + ${targetRegion.height}% - 16px)`,
            }}
          >
            <Crosshair className="absolute -left-2 -bottom-2 w-3 h-3 text-dahab-500" />
          </div>
          <div
            className="absolute -right-1 -bottom-1 w-6 h-6 border-r-4 border-b-4 border-dahab-500 bg-dahab-500/10 rounded-br-lg"
            style={{
              left: `calc(${targetRegion.x}% + ${targetRegion.width}% - 16px)`,
              top: `calc(${targetRegion.y}% + ${targetRegion.height}% - 16px)`,
            }}
          >
            <Crosshair className="absolute -right-2 -bottom-2 w-3 h-3 text-dahab-500" />
          </div>

          {/* Enhanced Label Card */}
          <div
            className="absolute bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold z-20"
            style={{
              left: `${targetRegion.x}%`,
              top: `calc(${targetRegion.y}% - 50px)`,
              transform: 'translateX(-50%)',
            }}
          >
            <AlertTriangle className="w-4 h-4 animate-pulse" />
            <span>منطقة العطل المحتملة</span>
            <span className="text-[10px] opacity-90">⚠️</span>
          </div>

          {/* Dimension indicators */}
          <div
            className="absolute bg-black/70 text-white px-2 py-1 rounded text-[10px] font-mono"
            style={{
              left: `${targetRegion.x}%`,
              top: `calc(${targetRegion.y}% + ${targetRegion.height}% + 8px)`,
            }}
          >
            {targetRegion.width.toFixed(0)}% × {targetRegion.height.toFixed(0)}%
          </div>
        </>
      )}

      {/* Analysis state */}
      {!targetRegion && (isAnalysing || highlightedComponent) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl">
          <div className="bg-white dark:bg-gray-800 px-6 py-3 rounded-xl text-center shadow-2xl">
            {isAnalysing && (
              <div className="flex items-center gap-3 mb-2">
                <div className="w-6 h-6 border-4 border-dahab-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">جاري تحليل الصورة...</span>
              </div>
            )}
            {highlightedComponent && (
              <div className="flex items-center gap-2">
                <ZoomIn className="w-4 h-4 text-dahab-500 animate-pulse" />
                <span className="text-sm font-bold text-dahab-600 dark:text-dahab-400">
                  التركيز على: {highlightedComponent}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Component Highlight Indicator */}
      {highlightedComponent && !targetRegion && (
        <div className="absolute bottom-6 right-6 bg-gradient-to-r from-dahab-500 to-amber-600 text-white px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <Target className="w-4 h-4" />
          <span>التركيز على: {highlightedComponent}</span>
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-4 left-4 flex gap-2">
        <button className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition backdrop-blur-sm">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition backdrop-blur-sm">
          <Layers className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
