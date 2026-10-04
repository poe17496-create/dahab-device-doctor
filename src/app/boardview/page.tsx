'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HardwareBoardViewer, NetTrace } from '@/components/HardwareBoardViewer';
import { useDiagnosticContext } from '@/contexts/DiagnosticContext';
import { Search, Upload, Sparkles, ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * Board View Page - معمل البوردفيو والمسارات
 *
 * Features:
 * - Search and auto-fetch board images via API
 * - Upload custom board images
 * - Interactive canvas with zoom/pan controls
 * - Collapsible side panel with net navigator
 * - AI context binding for Dahab FixAI
 * - Empty state with sample boards
 */

export default function BoardViewPage() {
  const router = useRouter();
  const { boardName, setBoardName, selectedNet, setSelectedNet } = useDiagnosticContext();

  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(true);
  const [netSearchQuery, setNetSearchQuery] = useState('');
  const [showAddNetModal, setShowAddNetModal] = useState(false);
  const [newNetName, setNewNetName] = useState('');
  const [newNetColor, setNewNetColor] = useState('#f59e0b');
  const [newNetDescription, setNewNetDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Example nets for demonstration - expanded with more realistic traces
  const [nets, setNets] = useState<Record<string, NetTrace>>({
    net_vdd_main: {
      id: 'net_vdd_main',
      name: 'PP_VDD_MAIN',
      color: '#f59e0b',
      points: [
        { x: '15%', y: '30%' },
        { x: '25%', y: '30%' },
        { x: '35%', y: '35%' },
        { x: '45%', y: '35%' },
        { x: '55%', y: '40%' },
        { x: '65%', y: '40%' },
        { x: '75%', y: '45%' },
      ],
      description: 'Main power rail (3.7V - 4.2V) - Primary power distribution',
    },
    net_cpu_vcore: {
      id: 'net_cpu_vcore',
      name: 'PP_CPU_VCORE',
      color: '#38bdf8',
      points: [
        { x: '35%', y: '20%' },
        { x: '45%', y: '20%' },
        { x: '50%', y: '25%' },
        { x: '55%', y: '25%' },
        { x: '60%', y: '30%' },
        { x: '65%', y: '30%' },
      ],
      description: 'CPU core voltage (0.85V) - Processor power supply',
    },
    net_gnd: {
      id: 'net_gnd',
      name: 'GND',
      color: '#64748b',
      points: [
        { x: '10%', y: '50%' },
        { x: '20%', y: '50%' },
        { x: '30%', y: '55%' },
        { x: '40%', y: '55%' },
        { x: '50%', y: '60%' },
        { x: '60%', y: '60%' },
        { x: '70%', y: '65%' },
        { x: '80%', y: '65%' },
      ],
      description: 'Ground plane - System ground reference',
    },
    net_vbus: {
      id: 'net_vbus',
      name: 'PP_VBUS_USB_C',
      color: '#10b981',
      points: [
        { x: '5%', y: '40%' },
        { x: '15%', y: '40%' },
        { x: '20%', y: '45%' },
        { x: '25%', y: '45%' },
      ],
      description: 'USB-C power input (5V - 20V PD)',
    },
    net_1v8_always: {
      id: 'net_1v8_always',
      name: 'PP1V8_ALWAYS',
      color: '#a855f7',
      points: [
        { x: '25%', y: '35%' },
        { x: '35%', y: '35%' },
        { x: '40%', y: '40%' },
        { x: '45%', y: '40%' },
      ],
      description: 'Always-on 1.8V rail - Boot and standby power',
    },
    net_3v3_sim: {
      id: 'net_3v3_sim',
      name: 'PP3V3_SIM',
      color: '#ef4444',
      points: [
        { x: '40%', y: '45%' },
        { x: '50%', y: '45%' },
        { x: '55%', y: '50%' },
        { x: '60%', y: '50%' },
      ],
      description: 'SIM card power rail (3.3V)',
    },
    net_wifi_batt: {
      id: 'net_wifi_batt',
      name: 'PP_WIFI_BATT',
      color: '#f97316',
      points: [
        { x: '70%', y: '25%' },
        { x: '75%', y: '25%' },
        { x: '80%', y: '30%' },
        { x: '85%', y: '30%' },
      ],
      description: 'WiFi module battery connection',
    },
    net_camera_vdd: {
      id: 'net_camera_vdd',
      name: 'PP_CAMERA_VDD',
      color: '#ec4899',
      points: [
        { x: '60%', y: '55%' },
        { x: '65%', y: '55%' },
        { x: '70%', y: '60%' },
        { x: '75%', y: '60%' },
      ],
      description: 'Camera module power supply',
    },
  });

  const handleSearch = async () => {
    if (!searchInput.trim()) return;
    
    setIsSearching(true);
    setBoardName(searchInput);
    setCustomImage(null);
    // Note: This will try to fetch from API, but will fail gracefully if Supabase is not configured
    setTimeout(() => setIsSearching(false), 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomImage(reader.result as string);
        setBoardName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNetSelect = (net: NetTrace) => {
    setSelectedNet(net.id);
  };

  const handleAskAI = () => {
    // Navigate to main page with context
    router.push('/');
  };

  const handleAddNet = () => {
    if (!newNetName.trim()) return;

    const newNet: NetTrace = {
      id: `net_${Date.now()}`,
      name: newNetName,
      color: newNetColor,
      points: [], // User can add points later by clicking on the board
      description: newNetDescription || undefined,
    };

    setNets(prev => ({ ...prev, [newNet.id]: newNet }));
    setNewNetName('');
    setNewNetDescription('');
    setShowAddNetModal(false);
  };

  const handleDeleteNet = (netId: string) => {
    setNets(prev => {
      const newNets = { ...prev };
      delete newNets[netId];
      return newNets;
    });
    if (selectedNet === netId) {
      setSelectedNet(null);
    }
  };

  const handleClearAllNets = () => {
    if (confirm('هل أنت متأكد من حذف جميع المسارات؟')) {
      setNets({});
      setSelectedNet(null);
    }
  };

  const filteredNets = Object.values(nets).filter(net =>
    net.name.toLowerCase().includes(netSearchQuery.toLowerCase()) ||
    net.description?.toLowerCase().includes(netSearchQuery.toLowerCase())
  );

  const sampleBoards = [
    'iPhone 14 Pro Max',
    'Samsung S23 Ultra',
    'MacBook Pro M2',
    'iPad Pro 12.9',
    'Asus ROG Laptop',
    'Dell XPS 15',
  ];

  return (
    <div className="w-full h-screen bg-gray-900 flex flex-col">
      {/* Header & Search Bar */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 z-30">
        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search board name (e.g., iPhone 15 Pro Max Logic Board)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Upload Button (Primary) */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            <span>Upload Board Image</span>
          </button>

          {/* Search Button (Secondary - requires Supabase) */}
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchInput.trim()}
            className="px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            title="Requires Supabase configuration"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Search (Needs DB)</span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />



          {/* AI Button */}
          <button
            onClick={handleAskAI}
            className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            <span>Ask AI About This Board</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Side Panel - Net Navigator */}
        <div
          className={`bg-gray-800 border-l border-gray-700 transition-all duration-300 ${
            sidePanelOpen ? 'w-80' : 'w-0'
          } overflow-hidden`}
        >
          <div className="p-4 h-full flex flex-col">
            {/* Panel Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Net Navigator</h2>
              <button
                onClick={() => setSidePanelOpen(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Net Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filter nets..."
                value={netSearchQuery}
                onChange={(e) => setNetSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {netSearchQuery && (
                <button
                  onClick={() => setNetSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setShowAddNetModal(true)}
                className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-xs font-medium"
              >
                + إضافة مسار
              </button>
              <button
                onClick={handleClearAllNets}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-medium"
                title="حذف جميع المسارات"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Net List */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredNets.map((net) => (
                <div
                  key={net.id}
                  className={`p-3 rounded-lg transition-all ${
                    selectedNet === net.id
                      ? 'bg-blue-600 border-2 border-blue-400'
                      : 'bg-gray-700 border-2 border-transparent hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <button
                      onClick={() => handleNetSelect(net)}
                      className="flex items-center gap-2 flex-1"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: net.color }}
                      />
                      <span className="font-medium text-white">{net.name}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteNet(net.id)}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      title="حذف المسار"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {net.description && (
                    <p className="text-sm text-gray-400">{net.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {net.points.length} نقطة
                  </p>
                </div>
              ))}
              {filteredNets.length === 0 && (
                <p className="text-gray-400 text-center py-4">لا توجد مسارات</p>
              )}
            </div>

            {/* Selected Net Info */}
            {selectedNet && nets[selectedNet] && (
              <div className="mt-4 p-3 bg-gray-700 rounded-lg border border-gray-600">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">
                    {nets[selectedNet].name}
                  </span>
                  <button
                    onClick={() => setSelectedNet(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-400">
                  {nets[selectedNet].description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 relative">
          {/* Toggle Side Panel Button */}
          {!sidePanelOpen && (
            <button
              onClick={() => setSidePanelOpen(true)}
              className="absolute top-4 right-4 z-20 p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Empty State */}
          {!boardName && !customImage && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center max-w-2xl px-8">
                <div className="text-6xl mb-6">🔬</div>
                <h1 className="text-3xl font-bold text-white mb-4">
                  معمل البوردفيو والمسارات
                </h1>
                <p className="text-gray-400 text-lg mb-4">
                  Upload a board image to view its schematic with interactive net traces
                </p>
                <p className="text-gray-500 text-sm mb-8">
                  يمكنك رفع صورة البورد المخصص من خلال زر "Upload Image" في الأعلى
                </p>
                
                <div className="space-y-4">
                  <p className="text-gray-300 font-medium">أو جرب البحث عن بورد (يتطلب إعداد Supabase):</p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {sampleBoards.map((board) => (
                      <button
                        key={board}
                        onClick={() => {
                          setSearchInput(board);
                          handleSearch();
                        }}
                        className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        {board}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hardware Board Viewer */}
          {(boardName || customImage) && (
            <HardwareBoardViewer
              boardName={boardName || 'Custom Board'}
              customImageUrl={customImage}
              nets={nets}
              onNetSelect={handleNetSelect}
              className="h-full"
            />
          )}

          {/* Add Net Modal */}
          {showAddNetModal && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">إضافة مسار جديد</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      اسم المسار
                    </label>
                    <input
                      type="text"
                      value={newNetName}
                      onChange={(e) => setNewNetName(e.target.value)}
                      placeholder="مثال: PP_VDD_MAIN"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      اللون
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={newNetColor}
                        onChange={(e) => setNewNetColor(e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={newNetColor}
                        onChange={(e) => setNewNetColor(e.target.value)}
                        className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      الوصف (اختياري)
                    </label>
                    <textarea
                      value={newNetDescription}
                      onChange={(e) => setNewNetDescription(e.target.value)}
                      placeholder="وصف المسار والوظيفة"
                      rows={3}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleAddNet}
                    disabled={!newNetName.trim()}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    إضافة
                  </button>
                  <button
                    onClick={() => setShowAddNetModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
