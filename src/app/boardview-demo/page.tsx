'use client';

import React, { useState } from 'react';
import InteractiveBoardview, { BoardData, fetchBoardviewData } from '@/components/InteractiveBoardview';
import { Cpu, Smartphone, Monitor } from 'lucide-react';

export default function BoardviewDemoPage() {
  const [selectedDevice, setSelectedDevice] = useState<string>('iphone_13_pro');
  const [boardData, setBoardData] = useState<BoardData | undefined>();
  const [highlightedNet, setHighlightedNet] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'logical' | 'physical'>('physical');

  const devices = [
    { id: 'iphone_13_pro', name: 'iPhone 13 Pro', icon: Smartphone },
    { id: 'samsung_s23', name: 'Samsung Galaxy S23', icon: Smartphone },
    { id: 'macbook_pro', name: 'MacBook Pro 2021', icon: Monitor },
  ];

  const handleDeviceChange = async (deviceId: string) => {
    setSelectedDevice(deviceId);
    setHighlightedNet(undefined);

    // Fetch board data from API
    const data = await fetchBoardviewData(deviceId);
    setBoardData(data || undefined);
  };

  const handleNetSelect = (netName: string) => {
    setHighlightedNet(netName);
  };

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
                High-performance PCB visualization with react-konva
              </p>
            </div>
          </div>

          {/* Device Selector */}
          <div className="flex gap-4 flex-wrap">
            {devices.map((device) => {
              const Icon = device.icon;
              return (
                <button
                  key={device.id}
                  onClick={() => handleDeviceChange(device.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                    selectedDevice === device.id
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                      : 'bg-slate-800 border-slate-700 hover:border-slate-600 text-slate-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-semibold">{device.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden h-[calc(100vh-250px)]">
          <InteractiveBoardview
            boardData={boardData}
            deviceModel={selectedDevice}
            onNetSelect={handleNetSelect}
            initialNetHighlight={highlightedNet}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
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
              Powered by react-konva HTML5 Canvas for smooth rendering of thousands of components.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
