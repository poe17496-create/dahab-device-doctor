'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Search, ZoomIn, ZoomOut, Maximize2, RotateCcw, Layers, ToggleLeft, ToggleRight } from 'lucide-react';

// Dynamic import for entire Konva component to avoid SSR issues
const KonvaBoardview = dynamic(() => import('./KonvaBoardview'), { ssr: false });

// Types
export interface BoardPin {
  id: string;
  x: number;
  y: number;
  net: string;
  label?: string;
  type: 'via' | 'pad' | 'testpoint';
}

export interface BoardComponent {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'IC' | 'capacitor' | 'resistor' | 'connector' | 'other';
  pins: BoardPin[];
  rotation?: number;
}

export interface BoardData {
  id: string;
  title: string;
  deviceModel: string;
  width: number;
  height: number;
  components: BoardComponent[];
  nets: Record<string, string[]>; // net name -> list of pin IDs
}

interface InteractiveBoardviewProps {
  boardData?: BoardData;
  deviceModel?: string;
  onNetSelect?: (netName: string) => void;
  initialNetHighlight?: string | undefined;
  viewMode?: 'logical' | 'physical';
  onViewModeChange?: (mode: 'logical' | 'physical') => void;
}

// Mock data for testing
const mockBoardData: BoardData = {
  id: 'iphone_13_pro_mainboard',
  title: 'iPhone 13 Pro Mainboard',
  deviceModel: 'iPhone 13 Pro (A2639)',
  width: 3000,
  height: 1500,
  components: [
    {
      id: 'U1000',
      name: 'U1000',
      x: 500,
      y: 300,
      width: 200,
      height: 200,
      type: 'IC',
      rotation: 0,
      pins: [
        { id: 'U1000_A1', x: 510, y: 310, net: 'PP_VDD_MAIN', type: 'pad', label: 'A1' },
        { id: 'U1000_A2', x: 510, y: 330, net: 'PP_VDD_MAIN', type: 'pad', label: 'A2' },
        { id: 'U1000_B1', x: 530, y: 310, net: 'PP_VDD_CPU', type: 'pad', label: 'B1' },
        { id: 'U1000_B2', x: 530, y: 330, net: 'GND', type: 'pad', label: 'B2' },
        { id: 'U1000_C1', x: 550, y: 310, net: 'PP_VDD_GPU', type: 'pad', label: 'C1' },
        { id: 'U1000_C2', x: 550, y: 330, net: 'PP_1V8_SDRAM', type: 'pad', label: 'C2' },
      ],
    },
    {
      id: 'U2000',
      name: 'U2000',
      x: 800,
      y: 300,
      width: 150,
      height: 150,
      type: 'IC',
      rotation: 0,
      pins: [
        { id: 'U2000_1', x: 810, y: 310, net: 'PP_VDD_MAIN', type: 'pad', label: '1' },
        { id: 'U2000_2', x: 810, y: 330, net: 'PP_3V3_CAM', type: 'pad', label: '2' },
        { id: 'U2000_3', x: 830, y: 310, net: 'GND', type: 'pad', label: '3' },
      ],
    },
    {
      id: 'C1000',
      name: 'C1000',
      x: 400,
      y: 600,
      width: 40,
      height: 40,
      type: 'capacitor',
      pins: [
        { id: 'C1000_1', x: 410, y: 610, net: 'PP_VDD_MAIN', type: 'pad' },
        { id: 'C1000_2', x: 430, y: 610, net: 'GND', type: 'pad' },
      ],
    },
    {
      id: 'C1001',
      name: 'C1001',
      x: 450,
      y: 600,
      width: 40,
      height: 40,
      type: 'capacitor',
      pins: [
        { id: 'C1001_1', x: 460, y: 610, net: 'PP_VDD_CPU', type: 'pad' },
        { id: 'C1001_2', x: 480, y: 610, net: 'GND', type: 'pad' },
      ],
    },
    {
      id: 'J1',
      name: 'Battery Connector',
      x: 200,
      y: 700,
      width: 100,
      height: 80,
      type: 'connector',
      pins: [
        { id: 'J1_1', x: 210, y: 710, net: 'PP_BATT_VCC', type: 'pad', label: 'VBAT' },
        { id: 'J1_2', x: 230, y: 710, net: 'GND', type: 'pad', label: 'GND' },
        { id: 'J1_3', x: 250, y: 710, net: 'PP_BATT_TEMP', type: 'pad', label: 'TEMP' },
      ],
    },
  ],
  nets: {
    'PP_VDD_MAIN': ['U1000_A1', 'U1000_A2', 'U2000_1', 'C1000_1'],
    'PP_VDD_CPU': ['U1000_B1', 'C1001_1'],
    'PP_VDD_GPU': ['U1000_C1'],
    'PP_1V8_SDRAM': ['U1000_C2'],
    'PP_3V3_CAM': ['U2000_2'],
    'GND': ['U1000_B2', 'U2000_3', 'C1000_2', 'C1001_2', 'J1_2'],
    'PP_BATT_VCC': ['J1_1'],
    'PP_BATT_TEMP': ['J1_3'],
  },
};

// Fallback function to fetch board data from cloud
export async function fetchBoardviewData(modelName: string): Promise<BoardData | null> {
  try {
    // Try to fetch from local data first
    const localData = await fetch(`/api/boardviews?model=${encodeURIComponent(modelName)}`);
    if (localData.ok) {
      const data = await localData.json();
      if (data.boardData) return data.boardData;
    }

    // Fallback to cloud API
    const cloudResponse = await fetch(
      `https://api.dahab-boardview-library.com/v1/boards/${encodeURIComponent(modelName)}`
    );

    if (cloudResponse.ok) {
      const cloudData = await cloudResponse.json();
      return cloudData;
    }

    return null;
  } catch (error) {
    console.error('Error fetching boardview data:', error);
    return null;
  }
}

export default function InteractiveBoardview({
  boardData: propBoardData,
  deviceModel,
  onNetSelect,
  initialNetHighlight,
  viewMode = 'physical',
  onViewModeChange,
}: InteractiveBoardviewProps) {
  const [boardData, setBoardData] = useState<BoardData>(propBoardData || mockBoardData);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [highlightedNet, setHighlightedNet] = useState<string | undefined>(initialNetHighlight);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Load board data if deviceModel changes
  useEffect(() => {
    if (deviceModel && !propBoardData) {
      setLoading(true);
      fetchBoardviewData(deviceModel).then((data) => {
        if (data) {
          setBoardData(data);
        }
        setLoading(false);
      });
    }
  }, [deviceModel, propBoardData]);

  // Handle initial net highlight from props
  useEffect(() => {
    if (initialNetHighlight) {
      setHighlightedNet(initialNetHighlight);
    }
  }, [initialNetHighlight]);

  // Compute search suggestions
  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];

    const query = searchQuery.toLowerCase();
    const results: string[] = [];

    // Search components
    boardData?.components.forEach((comp) => {
      if (comp.name.toLowerCase().includes(query)) {
        results.push(comp.name);
      }
    });

    // Search nets
    Object.keys(boardData?.nets || {}).forEach((net) => {
      if (net.toLowerCase().includes(query)) {
        results.push(net);
      }
    });

    return Array.from(new Set(results)).slice(0, 10);
  }, [searchQuery, boardData]);

  useEffect(() => {
    setSearchSuggestions(suggestions);
    setShowSuggestions(suggestions.length > 0);
  }, [suggestions]);

  // Calculate component color based on highlight
  const getComponentColor = useCallback(
    (component: BoardComponent) => {
      if (!highlightedNet) return '#1e293b'; // Default dark slate

      const hasHighlightedPin = component.pins.some((pin) => pin.net === highlightedNet);
      return hasHighlightedPin ? '#ef4444' : 'rgba(30, 41, 59, 0.3)'; // Red if highlighted, dimmed otherwise
    },
    [highlightedNet]
  );

  // Calculate pin color
  const getPinColor = useCallback(
    (pin: BoardPin) => {
      if (!highlightedNet) return '#3b82f6'; // Default blue

      return pin.net === highlightedNet ? '#ef4444' : 'rgba(59, 130, 246, 0.3)'; // Red if highlighted, dimmed otherwise
    },
    [highlightedNet]
  );

  // Zoom handlers
  const handleWheel = useCallback(
    (e: any) => {
      e.evt.preventDefault();

      const scaleBy = 1.1;
      const oldScale = scale;
      const pointer = e.target.getPointerPosition();

      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - position.x) / oldScale,
        y: (pointer.y - position.y) / oldScale,
      };

      const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

      // Limit zoom
      const clampedScale = Math.max(0.1, Math.min(newScale, 5));

      const newPos = {
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      };

      setScale(clampedScale);
      setPosition(newPos);
    },
    [scale, position]
  );

  // Pan handlers
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback((e: any) => {
    setIsDragging(false);
    setPosition({
      x: e.target.x(),
      y: e.target.y(),
    });
  }, []);

  // Reset view
  const resetView = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setHighlightedNet(undefined);
  }, []);

  // Zoom in/out
  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev * 1.2, 5));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev / 1.2, 0.1));
  }, []);

  // Handle search selection
  const handleSearchSelect = useCallback(
    (selection: string) => {
      setSearchQuery(selection);
      setShowSuggestions(false);

      // Check if it's a net or component
      if (boardData?.nets[selection]) {
        setHighlightedNet(selection);
        onNetSelect?.(selection);
      } else {
        // It's a component - center on it
        const component = boardData?.components.find((c) => c.name === selection);
        if (component) {
          // Center the view on the component
          const containerWidth = containerRef.current?.clientWidth || 1000;
          const containerHeight = containerRef.current?.clientHeight || 800;

          setPosition({
            x: containerWidth / 2 - component.x * scale,
            y: containerHeight / 2 - component.y * scale,
          });
        }
      }
    },
    [boardData, scale, onNetSelect]
  );

  // Toggle view mode
  const toggleViewMode = useCallback(() => {
    const newMode = viewMode === 'logical' ? 'physical' : 'logical';
    onViewModeChange?.(newMode);
  }, [viewMode, onViewModeChange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>جاري تحميل مخطط البورد...</p>
        </div>
      </div>
    );
  }

  if (viewMode === 'logical') {
    return (
      <div className="h-full flex flex-col bg-slate-900 text-white">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-bold">Logical Block Diagram</h3>
          <button
            onClick={toggleViewMode}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            <ToggleRight className="w-4 h-4" />
            Switch to Physical Boardview
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-400">Logical Block Diagram View - Coming Soon</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-700 flex items-center gap-4 flex-wrap">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Layers className="w-5 h-5" />
          {boardData?.title || 'Boardview'}
        </h3>

        {/* View Mode Toggle */}
        <button
          onClick={toggleViewMode}
          className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
          title="Toggle View Mode"
        >
          <ToggleLeft className="w-4 h-4" />
          <span className="text-sm">Logical</span>
        </button>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search component or net (e.g., U1000, PP_VDD_MAIN)..."
              className="w-full pr-10 pl-4 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>

          {/* Autocomplete Dropdown */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
              {searchSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSearchSelect(suggestion)}
                  className="w-full text-left px-4 py-2 hover:bg-slate-700 transition text-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm font-mono w-16 text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={zoomIn}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setScale(1);
              setPosition({ x: 0, y: 0 });
            }}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
            title="Fit to Screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Highlight Info */}
        {highlightedNet && (
          <div className="flex items-center gap-2 px-3 py-1 bg-red-900/50 border border-red-500 rounded-lg">
            <span className="text-sm font-semibold text-red-300">Highlighted Net:</span>
            <span className="text-sm font-mono text-red-100">{highlightedNet}</span>
            <button
              onClick={() => setHighlightedNet(undefined)}
              className="ml-2 text-red-300 hover:text-red-100"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Canvas Container */}
      <div ref={containerRef} className="flex-1 overflow-hidden bg-slate-950 relative">
        <KonvaBoardview
          boardData={boardData!}
          scale={scale}
          position={position}
          highlightedNet={highlightedNet}
          onWheel={handleWheel}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          containerWidth={containerRef.current?.clientWidth || 1000}
          containerHeight={containerRef.current?.clientHeight || 800}
          getComponentColor={getComponentColor}
          getPinColor={getPinColor}
        />

        {/* Info Overlay */}
        <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-sm p-3 rounded-lg border border-slate-700 text-xs">
          <p className="text-slate-400">
            <strong className="text-white">Components:</strong> {boardData?.components.length || 0}
          </p>
          <p className="text-slate-400">
            <strong className="text-white">Nets:</strong> {Object.keys(boardData?.nets || {}).length}
          </p>
          <p className="text-slate-400 mt-2">
            <strong className="text-white">Controls:</strong> Scroll to zoom, Drag to pan
          </p>
        </div>
      </div>
    </div>
  );
}
