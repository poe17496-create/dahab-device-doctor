'use client';

import React, { useState } from 'react';
import {
  Zap,
  Ruler,
  Activity,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Grid3x3,
  CircuitBoard,
  Target,
  Power,
  Signal,
  BookOpen,
  X,
} from 'lucide-react';
import { TestPoint } from '@/lib/types';

interface CircuitTrace {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  name: string;
  type: 'power' | 'signal' | 'ground' | 'data';
  width: number;
}

interface SchematicBoardProps {
  imageBase64?: string | null;
  testPoints?: TestPoint[];
  circuitTraces?: CircuitTrace[];
  isAnalysing?: boolean;
}

export default function SchematicBoard({
  imageBase64,
  testPoints = [],
  circuitTraces = [],
  isAnalysing = false,
}: SchematicBoardProps) {
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [showTraces, setShowTraces] = useState(true);
  const [showTestPoints, setShowTestPoints] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<TestPoint | null>(null);
  const [activeTool, setActiveTool] = useState<'select' | 'measure' | 'probe'>('select');

  // Pre-AI Knowledge: Common circuit patterns
  const commonCircuits = [
    {
      name: 'iPhone 11 - VCC_MAIN Circuit',
      description: 'Main power distribution for iPhone 11',
      components: ['C2015', 'C2016', 'C2017', 'U2000', 'Q2010'],
      testPoints: [
        { name: 'VCC_MAIN', expected: '4.2V', status: 'normal' },
        { name: 'PP_VCC_MAIN', expected: '4.2V', status: 'normal' },
        { name: 'PP_BATT_VCC', expected: '4.2V', status: 'normal' },
      ],
    },
    {
      name: 'Samsung S21 - Battery Circuit',
      description: 'Battery charging and power management',
      components: ['C1001', 'C1002', 'U1000', 'Q1000'],
      testPoints: [
        { name: 'VBAT', expected: '3.8V', status: 'normal' },
        { name: 'VCHG', expected: '5V', status: 'warning' },
        { name: 'PP_5V_USB', expected: '5V', status: 'normal' },
      ],
    },
    {
      name: 'MacBook Pro - 19V Rail',
      description: 'Main 19V power rail for MacBook Pro',
      components: ['C5001', 'C5002', 'U5000', 'Q5000'],
      testPoints: [
        { name: 'PP_19V', expected: '19V', status: 'normal' },
        { name: 'PP_5V_S5', expected: '5V', status: 'normal' },
        { name: 'PP_3V3_S5', expected: '3.3V', status: 'normal' },
      ],
    },
  ];

  const getPointIcon = (point: TestPoint) => {
    return <Target className="w-3 h-3" />;
  };

  const getPointColor = () => {
    return 'bg-dahab-500 border-dahab-400 shadow-dahab-500/50';
  };

  const getTraceColor = (type: CircuitTrace['type']) => {
    switch (type) {
      case 'power':
        return 'stroke-red-500';
      case 'signal':
        return 'stroke-blue-500';
      case 'ground':
        return 'stroke-black';
      case 'data':
        return 'stroke-green-500';
      default:
        return 'stroke-gray-500';
    }
  };

  return (
    <div className="w-full h-full bg-gray-900 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 p-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTool('select')}
            className={`p-2 rounded-lg transition ${
              activeTool === 'select'
                ? 'bg-dahab-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="Select Tool"
          >
            <Target className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('measure')}
            className={`p-2 rounded-lg transition ${
              activeTool === 'measure'
                ? 'bg-dahab-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="Measure Tool"
          >
            <Ruler className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('probe')}
            className={`p-2 rounded-lg transition ${
              activeTool === 'probe'
                ? 'bg-dahab-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="Probe Tool"
          >
            <Activity className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-600 mx-2" />
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-lg transition ${
              showGrid
                ? 'bg-dahab-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="Toggle Grid"
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowTraces(!showTraces)}
            className={`p-2 rounded-lg transition ${
              showTraces
                ? 'bg-dahab-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="Toggle Traces"
          >
            <CircuitBoard className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowTestPoints(!showTestPoints)}
            className={`p-2 rounded-lg transition ${
              showTestPoints
                ? 'bg-dahab-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="Toggle Test Points"
          >
            <Zap className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(Math.max(50, zoom - 10))}
            className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-300 font-mono w-12 text-center">{zoom}%</span>
          <button
            onClick={() => setZoom(Math.min(200, zoom + 10))}
            className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(100)}
            className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
            title="Reset Zoom"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="relative w-full h-[600px] overflow-auto">
        <div
          className="relative w-full h-full"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top left',
          }}
        >
          {/* Grid Background */}
          {showGrid && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px',
              }}
            />
          )}

          {/* Board Image */}
          {imageBase64 && (
            <img
              src={imageBase64}
              alt="Board Image"
              className="absolute inset-0 w-full h-full object-contain"
            />
          )}

          {/* Circuit Traces */}
          {showTraces && circuitTraces.map((trace) => (
            <svg
              key={trace.id}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 10 }}
            >
              <line
                x1={`${trace.from.x}%`}
                y1={`${trace.from.y}%`}
                x2={`${trace.to.x}%`}
                y2={`${trace.to.y}%`}
                className={getTraceColor(trace.type)}
                strokeWidth={trace.width}
                fill="none"
                opacity={0.6}
              />
            </svg>
          ))}

          {/* Test Points */}
          {showTestPoints && testPoints.map((point, idx) => (
            <div
              key={idx}
              className={`absolute w-6 h-6 rounded-full border-2 cursor-pointer flex items-center justify-center shadow-lg transition-all hover:scale-125 ${getPointColor()}`}
              style={{
                left: `${point.coordinates.x}%`,
                top: `${point.coordinates.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 20,
              }}
              onClick={() => setSelectedPoint(point)}
              title={point.name}
            >
              {getPointIcon(point)}
            </div>
          ))}

          {/* Analysis Overlay */}
          {isAnalysing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-gray-800 p-6 rounded-xl text-center">
                <div className="w-12 h-12 border-4 border-dahab-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white font-bold">جاري تحليل المخطط...</p>
                <p className="text-gray-400 text-sm mt-2">جاري مطابقة المكونات والمسارات</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pre-AI Knowledge Panel */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-dahab-500" />
            قاعدة المعرفة الهندسية
          </h3>
          <button className="text-dahab-500 text-sm hover:underline">عرض الكل</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {commonCircuits.map((circuit, idx) => (
            <div
              key={idx}
              className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <CircuitBoard className="w-4 h-4 text-dahab-500" />
                <span className="text-white font-bold text-sm">{circuit.name}</span>
              </div>
              <p className="text-gray-400 text-xs mb-2">{circuit.description}</p>
              <div className="flex flex-wrap gap-1">
                {circuit.components.slice(0, 3).map((comp) => (
                  <span
                    key={comp}
                    className="bg-dahab-500/20 text-dahab-400 px-2 py-0.5 rounded text-xs"
                  >
                    {comp}
                  </span>
                ))}
                {circuit.components.length > 3 && (
                  <span className="text-gray-500 text-xs">+{circuit.components.length - 3}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Point Panel */}
      {selectedPoint && (
        <div className="absolute bottom-4 right-4 bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-2xl w-80 z-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-bold flex items-center gap-2">
              {getPointIcon(selectedPoint)}
              {selectedPoint.name}
            </h4>
            <button
              onClick={() => setSelectedPoint(null)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">القيمة المتوقعة:</span>
              <span className="text-white text-sm font-mono">{selectedPoint.expectedValue}</span>
            </div>
            <div className="pt-2 border-t border-gray-700">
              <p className="text-gray-400 text-xs mb-1">تعليمات القياس:</p>
              <p className="text-white text-sm">{selectedPoint.instruction}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
