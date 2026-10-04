'use client';

import React, { useState } from 'react';
import InteractiveBoardviewSimulator from '@/components/InteractiveBoardviewSimulator';
import { Cpu, Smartphone, Monitor } from 'lucide-react';

export default function BoardviewDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-950 border-b border-slate-700 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Cpu className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Interactive Boardview Demo
              </h1>
              <p className="text-slate-400 text-sm">
                High-performance PCB visualization with WebGL (PixiJS) - Full board library
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden h-[calc(100vh-200px)]">
          <InteractiveBoardviewSimulator />
        </div>
      </div>

      {/* Features Info */}
      <div className="max-w-7xl mx-auto p-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-blue-400 mb-3">🎯 Smart Search</h3>
            <p className="text-slate-400 text-sm">
              Search for components (U1000) or nets (PP_VDD_MAIN) with real-time autocomplete suggestions.
            </p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-purple-400 mb-3">🔍 Net Highlighting</h3>
            <p className="text-slate-400 text-sm">
              Select a net to highlight all connected pins in red while dimming the rest of the board.
            </p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-green-400 mb-3">⚡ High Performance</h3>
            <p className="text-slate-400 text-sm">
              Powered by WebGL (PixiJS) for smooth rendering of thousands of components.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
