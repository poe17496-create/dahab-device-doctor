'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Search,
  Layers,
  Sparkles,
  CircuitBoard,
  Cpu,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Download,
  Crosshair,
  Maximize2,
  RefreshCw,
  Eye,
  FileCode,
  Hash,
  Activity,
  Sliders,
  Check,
  ChevronDown,
} from 'lucide-react';
import {
  generateVectorBoard,
  getPopularBoardsList,
  findBoardInMatrix,
  VectorBoardModel,
  VectorComponent,
  VectorPin,
} from '@/lib/vectorBoardGenerator';

interface VectorBoardViewCADProps {
  boardName?: string;
  selectedNet?: string | null;
  onNetSelect?: (netName: string) => void;
  onComponentSelect?: (compName: string) => void;
  onBoardChange?: (newBoardName: string) => void;
}

export default function VectorBoardViewCAD({
  boardName,
  selectedNet: initialNet,
  onNetSelect,
  onComponentSelect,
  onBoardChange,
}: VectorBoardViewCADProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // حالة البورد والمشهد المتجه
  const [activeBoard, setActiveBoard] = useState<VectorBoardModel>(() =>
    generateVectorBoard(boardName || 'iPhone 13 Pro Max')
  );
  const [boardSide, setBoardSide] = useState<'TOP' | 'BOTTOM'>('TOP');
  const [selectedNet, setSelectedNet] = useState<string | null>(initialNet || 'PP_VDD_MAIN');
  const [hoveredPin, setHoveredPin] = useState<VectorPin | null>(null);
  const [hoveredComponent, setHoveredComponent] = useState<VectorComponent | null>(null);

  // حالات البحث
  const [netSearchQuery, setNetSearchQuery] = useState('');
  const [boardSearchInput, setBoardSearchInput] = useState('');
  const [showBoardDropdown, setShowBoardDropdown] = useState(false);

  // تحكم الكاميرا (Pan & Zoom)
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // مزامنة النموذج تلقائياً عند تغيير اسم البورد الممرر من شريط البحث الرئيسي
  useEffect(() => {
    if (boardName && boardName !== activeBoard.name && boardName !== activeBoard.boardCode) {
      const generated = generateVectorBoard(boardName);
      setActiveBoard(generated);
      // ضبط أول مسار رئيسي تلقائياً
      if (generated.powerRails && generated.powerRails.length > 0) {
        setSelectedNet(generated.powerRails[0].rail);
      }
    }
  }, [boardName]);

  // قائمة البوردات المتطابقة مع بحث المستخدم في الفيكتور
  const popularBoards = useMemo(() => getPopularBoardsList(), []);

  const searchedBoardSuggestions = useMemo(() => {
    if (!boardSearchInput.trim()) return popularBoards;
    const q = boardSearchInput.toLowerCase().trim();
    return popularBoards.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.boardCode.toLowerCase().includes(q) ||
        q.includes(b.boardCode.toLowerCase())
    );
  }, [boardSearchInput, popularBoards]);

  // اختيار بوردة وتطبيقها فوراً
  const handleSelectBoard = (targetNameOrCode: string) => {
    const newBoard = generateVectorBoard(targetNameOrCode);
    setActiveBoard(newBoard);
    setBoardSearchInput('');
    setShowBoardDropdown(false);
    if (newBoard.powerRails && newBoard.powerRails.length > 0) {
      setSelectedNet(newBoard.powerRails[0].rail);
    }
    if (onBoardChange) {
      onBoardChange(`${newBoard.brand} ${newBoard.model}`);
    }
  };

  // استخراج قائمة المسارات المتاحة
  const availableNets = useMemo(() => {
    const set = new Set<string>();
    activeBoard.components.forEach((c) => {
      c.pins.forEach((p) => {
        if (p.netName) set.add(p.netName);
      });
    });
    return Array.from(set).sort();
  }, [activeBoard]);

  // معلومات المسار النشط الحالي
  const activeRailInfo = useMemo(() => {
    if (!selectedNet) return null;
    return activeBoard.powerRails?.find(
      (r) => r.rail.toLowerCase() === selectedNet.toLowerCase()
    );
  }, [selectedNet, activeBoard]);

  /**
   * 📐 رسم مسار نحاسي هندسي متعامد بزوايا 45 درجة وVia Holes (Manhattan Orthogonal Routing)
   */
  const drawManhattanTrace = (
    ctx: CanvasRenderingContext2D,
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    isPower: boolean
  ) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    ctx.save();
    ctx.lineWidth = isPower ? 3.5 : 2.5;
    ctx.strokeStyle = isPower ? '#f59e0b' : '#38bdf8';
    ctx.shadowColor = isPower ? '#f59e0b' : '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);

    if (Math.abs(dx) > Math.abs(dy)) {
      const midX = p1.x + dx * 0.5;
      const cornerSize = Math.min(15, Math.abs(dx) * 0.25, Math.abs(dy) * 0.5);
      const signX = Math.sign(dx) || 1;
      const signY = Math.sign(dy) || 1;

      ctx.lineTo(midX - cornerSize * signX, p1.y);
      ctx.lineTo(midX + cornerSize * signX, p1.y + cornerSize * 2 * signY);
      ctx.lineTo(midX + cornerSize * signX, p2.y - cornerSize * signY);
      ctx.lineTo(p2.x, p2.y);
    } else {
      const midY = p1.y + dy * 0.5;
      const cornerSize = Math.min(15, Math.abs(dy) * 0.25, Math.abs(dx) * 0.5);
      const signX = Math.sign(dx) || 1;
      const signY = Math.sign(dy) || 1;

      ctx.lineTo(p1.x, midY - cornerSize * signY);
      ctx.lineTo(p1.x + cornerSize * 2 * signX, midY + cornerSize * signY);
      ctx.lineTo(p2.x - cornerSize * signX, midY + cornerSize * signY);
      ctx.lineTo(p2.x, p2.y);
    }

    ctx.stroke();
    ctx.shadowBlur = 0;

    // رسم Via Hole (دونات نحاسية مجوفة) عند نقطة التفرع
    const viaX = p1.x + dx * 0.5;
    const viaY = p1.y + dy * 0.5;
    ctx.fillStyle = isPower ? '#fbbf24' : '#7dd3fc';
    ctx.beginPath();
    ctx.arc(viaX, viaY, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0a0f1d';
    ctx.beginPath();
    ctx.arc(viaX, viaY, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  // رسم المشهد المتجه على Canvas 2D
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // خلفية معمل الصيانة المظلمة (Deep PCB CAD Background)
    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.save();
    ctx.translate(rect.width / 2 + panX, rect.height / 2 + panY);
    ctx.scale(scale, scale);
    ctx.translate(-activeBoard.width / 2, -activeBoard.height / 2);

    // 1. شبكة الميكروميتر الهندسية الدقيقة
    ctx.strokeStyle = '#111c30';
    ctx.lineWidth = 0.5;
    const gridSize = 40;
    for (let x = 0; x <= activeBoard.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, activeBoard.height);
      ctx.stroke();
    }
    for (let y = 0; y <= activeBoard.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(activeBoard.width, y);
      ctx.stroke();
    }

    // 2. مضلع البوردة الرئيسي (PCB Board Outline)
    ctx.fillStyle = '#0c1527';
    ctx.strokeStyle = activeBoard.deviceType === 'laptop' ? '#38bdf8' : '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = activeBoard.deviceType === 'laptop' ? '#0284c7' : '#d97706';
    ctx.shadowBlur = 14;

    ctx.beginPath();
    activeBoard.outline.forEach((pt, i) => {
      const px = boardSide === 'BOTTOM' ? activeBoard.width - pt.x : pt.x;
      if (i === 0) ctx.moveTo(px, pt.y);
      else ctx.lineTo(px, pt.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // علامة الوجه والموديل في زاوية البوردة
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(
      `${activeBoard.brand} ${activeBoard.model} [${activeBoard.boardCode}] • SIDE: ${boardSide}`,
      70,
      85
    );

    // 3. تصفية المكونات حسب الوجه الحالي (TOP أو BOTTOM)
    const visibleComponents = activeBoard.components.filter((c) => c.side === boardSide);

    // 4. رسم خطوط المسار المحدد (Traces) بتنسيق متعامد احترافي (Manhattan Routing)
    if (selectedNet) {
      const netPins: Array<{ x: number; y: number; isPower: boolean }> = [];
      visibleComponents.forEach((c) => {
        c.pins.forEach((p) => {
          if (p.netName.toLowerCase() === selectedNet.toLowerCase()) {
            const px = boardSide === 'BOTTOM' ? activeBoard.width - p.x : p.x;
            netPins.push({ x: px, y: p.y, isPower: !!p.isPower });
          }
        });
      });

      // رسم مسارات النحاس المتعامدة
      if (netPins.length > 1) {
        for (let i = 0; i < netPins.length - 1; i++) {
          drawManhattanTrace(ctx, netPins[i], netPins[i + 1], netPins[i].isPower || netPins[i + 1].isPower);
        }
      }
    }

    // 5. رسم المكونات والآيسيات (Components CAD Boxes)
    visibleComponents.forEach((comp) => {
      const cx = boardSide === 'BOTTOM' ? activeBoard.width - comp.x - comp.width : comp.x;
      const cy = comp.y;
      const isCompHovered = hoveredComponent?.name === comp.name;

      // هيكل الآيسي / المكون
      ctx.fillStyle = isCompHovered ? '#1e293b' : comp.type === 'TestPoint' ? '#78350f' : '#0f172a';
      ctx.strokeStyle = isCompHovered ? '#f59e0b' : comp.type === 'IC' ? '#64748b' : '#334155';
      ctx.lineWidth = comp.type === 'IC' ? 1.8 : 1.2;

      if (comp.type === 'TestPoint') {
        // رسم نقطة الفحص الذهبية
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(cx + comp.width / 2, cy + comp.height / 2, comp.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(cx, cy, comp.width, comp.height);
        ctx.strokeRect(cx, cy, comp.width, comp.height);

        // نقطة الدليل Pin 1 Dot للآيسيهات
        if (comp.type === 'IC') {
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(cx + 8, cy + 8, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // اسم المكون بالحرير السيلك سكرين (Silk Screen Label)
        ctx.fillStyle = isCompHovered ? '#fbbf24' : '#cbd5e1';
        ctx.font = 'bold 11px monospace';
        const label = comp.name.length > 22 ? comp.name.slice(0, 20) + '..' : comp.name;
        ctx.fillText(label, cx + 8, cy + comp.height / 2 + 4);
      }

      // 6. رسم الأرجل ونقاط التلامس (Copper Pins / Pads)
      comp.pins.forEach((pin) => {
        const px = boardSide === 'BOTTOM' ? activeBoard.width - pin.x : pin.x;
        const py = pin.y;
        const isNetActive = selectedNet && pin.netName.toLowerCase() === selectedNet.toLowerCase();
        const isPinHovered = hoveredPin?.id === pin.id;

        ctx.beginPath();
        ctx.arc(px, py, isNetActive ? 7.5 : 5, 0, Math.PI * 2);

        if (pin.isGround) {
          ctx.fillStyle = isNetActive ? '#ef4444' : '#475569'; // الأرضي
        } else if (isNetActive) {
          ctx.fillStyle = '#fbbf24'; // المسار المختار يتوهج بذهبي ساطع
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 14;
        } else if (pin.isPower) {
          ctx.fillStyle = '#38bdf8'; // خطوط التغذية الرئيسية زرقاء
        } else {
          ctx.fillStyle = '#e2e8f0'; // أرجل إشارة عادية
        }

        ctx.fill();
        ctx.shadowBlur = 0;

        // إطار الرجل
        ctx.strokeStyle = isPinHovered ? '#ffffff' : '#0f172a';
        ctx.lineWidth = isPinHovered ? 2.5 : 1;
        ctx.stroke();

        // رقم الرجل عند التكبير العالي
        if (scale > 1.3 && pin.pinNumber) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '8px monospace';
          ctx.fillText(String(pin.pinNumber), px - 4, py - 9);
        }
      });
    });

    ctx.restore();
  }, [activeBoard, boardSide, selectedNet, hoveredPin, hoveredComponent, scale, panX, panY]);

  // إعادة الرسم عند أي تغيير
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  useEffect(() => {
    const handleResize = () => renderCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderCanvas]);

  // تحريك وتكبير الكاميرا بالماوس
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setScale((prev) => Math.min(6, Math.max(0.4, prev * zoomFactor)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanX(e.clientX - dragStart.x);
      setPanY(e.clientY - dragStart.y);
      return;
    }

    // Hit Testing لاكتشاف الرجل أو المكون تحت الماوس
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const boardX = (mouseX - (rect.width / 2 + panX)) / scale + activeBoard.width / 2;
    const boardY = (mouseY - (rect.height / 2 + panY)) / scale + activeBoard.height / 2;

    const visibleComponents = activeBoard.components.filter((c) => c.side === boardSide);

    let foundPin: VectorPin | null = null;
    let foundComp: VectorComponent | null = null;

    for (const comp of visibleComponents) {
      const cx = boardSide === 'BOTTOM' ? activeBoard.width - comp.x - comp.width : comp.x;
      if (
        boardX >= cx &&
        boardX <= cx + comp.width &&
        boardY >= comp.y &&
        boardY <= comp.y + comp.height
      ) {
        foundComp = comp;
      }

      for (const pin of comp.pins) {
        const px = boardSide === 'BOTTOM' ? activeBoard.width - pin.x : pin.x;
        const dist = Math.hypot(boardX - px, boardY - pin.y);
        if (dist <= 12) {
          foundPin = pin;
          foundComp = comp;
          break;
        }
      }
      if (foundPin) break;
    }

    setHoveredPin(foundPin);
    setHoveredComponent(foundComp);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    if (hoveredPin) {
      setSelectedNet(hoveredPin.netName);
      if (onNetSelect) onNetSelect(hoveredPin.netName);
    } else if (hoveredComponent) {
      if (onComponentSelect) onComponentSelect(hoveredComponent.name);
    }
  };

  const toggleFlipSide = () => {
    setBoardSide((prev) => (prev === 'TOP' ? 'BOTTOM' : 'TOP'));
  };

  const resetView = () => {
    setScale(1);
    setPanX(0);
    setPanY(0);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#070b14] select-none overflow-hidden relative font-sans text-right" dir="rtl">
      
      {/* 🎛️ شريط التحكم العلوي لمحرك الفيكتور (CAD Control Bar) */}
      <div className="p-2.5 md:p-3 bg-gray-950/95 border-b border-gray-800 flex flex-wrap items-center justify-between gap-2.5 z-20 backdrop-blur-md">
        
        {/* اختيار موديل البوردة والوجه والبحث السريع */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-dahab-500 flex items-center justify-center text-slate-950 font-black shadow-md shrink-0">
            <CircuitBoard className="w-4 h-4" />
          </div>

          {/* محرك البحث عن البوردة في الفيكتور مع قائمة منسدلة */}
          <div className="relative">
            <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-700 rounded-xl px-2.5 py-1.5">
              <Search className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <input
                type="text"
                value={boardSearchInput}
                onChange={(e) => {
                  setBoardSearchInput(e.target.value);
                  setShowBoardDropdown(true);
                }}
                onFocus={() => setShowBoardDropdown(true)}
                placeholder="ابحث برقم البوردة أو الموديل..."
                className="bg-transparent border-none text-xs text-gray-100 placeholder-gray-500 outline-none w-36 sm:w-48 font-bold"
              />
              <button
                type="button"
                onClick={() => setShowBoardDropdown(!showBoardDropdown)}
                className="text-gray-400 hover:text-white"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* القائمة المنسدلة للبوردات المتاحة في مصفوفة الـ 863 */}
            {showBoardDropdown && (
              <div className="absolute top-full right-0 mt-1.5 w-72 max-h-72 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-y-auto p-1.5 z-50 space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold text-amber-400 border-b border-gray-800 flex items-center justify-between">
                  <span>اختر بوردة لعرضها فوراً في فيكتور CAD:</span>
                  <span className="text-gray-500 font-mono">863 بوردة</span>
                </div>
                {searchedBoardSuggestions.slice(0, 15).map((b) => (
                  <button
                    key={b.boardCode}
                    type="button"
                    onClick={() => handleSelectBoard(b.boardCode)}
                    className={`w-full text-right px-2.5 py-1.5 rounded-xl text-xs transition flex items-center justify-between gap-1.5 ${
                      activeBoard.boardCode === b.boardCode
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'text-gray-200 hover:bg-gray-800'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-bold truncate">{b.name}</div>
                      <div className={`text-[10px] font-mono ${activeBoard.boardCode === b.boardCode ? 'text-slate-900' : 'text-gray-400'}`}>
                        {b.boardCode}
                      </div>
                    </div>
                    <span className="text-[10px] shrink-0 opacity-80">
                      {b.category === 'mobile' ? '📱' : '💻'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* البوردة الحالية */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 text-xs font-bold text-gray-200">
            <span className="text-amber-500">البوردة:</span>
            <span className="font-mono text-white">{activeBoard.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-amber-400 font-mono">
              {activeBoard.boardCode}
            </span>
          </div>

          {/* زر قلب البوردة (Flip Side) */}
          <button
            onClick={toggleFlipSide}
            className={`px-3 py-1.5 rounded-xl border text-xs font-black transition flex items-center gap-1.5 shadow-sm active:scale-95 ${
              boardSide === 'TOP'
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-sky-500 text-slate-950 border-sky-400'
            }`}
            title="قلب البوردة بين الوجه العلوي والسفلي (Flip TOP / BOTTOM)"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>الوجه: {boardSide === 'TOP' ? 'العلوي (TOP) 🔼' : 'السفلي (BOTTOM) 🔽'}</span>
          </button>
        </div>

        {/* البحث السريع في المسارات وتكبير الشاشة */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={netSearchQuery}
              onChange={(e) => setNetSearchQuery(e.target.value)}
              placeholder="ابحث في المسارات (VDD_MAIN / 19V)..."
              className="pr-8 pl-3 py-1.5 bg-gray-900 border border-gray-700 rounded-xl text-xs text-gray-100 outline-none focus:border-dahab-500 w-44 sm:w-56 font-mono"
            />
          </div>

          {/* أدوات التكبير والرؤية */}
          <div className="flex items-center gap-1 bg-gray-900 p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => setScale((s) => Math.min(6, +(s + 0.25).toFixed(2)))}
              className="p-1.5 hover:bg-gray-800 text-gray-300 rounded-lg transition"
              title="تكبير"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono font-bold text-dahab-400 px-1 min-w-[36px] text-center">
              {scale.toFixed(1)}x
            </span>
            <button
              onClick={() => setScale((s) => Math.max(0.4, +(s - 0.25).toFixed(2)))}
              className="p-1.5 hover:bg-gray-800 text-gray-300 rounded-lg transition"
              title="تصغير"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={resetView}
              className="p-1.5 hover:bg-gray-800 text-gray-300 rounded-lg transition"
              title="إعادة ضبط العرض"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* 📐 مساحة الرسم الرئيسية المتجهة (The Interactive Vector Canvas) */}
      <div className="flex-1 relative overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleClick}
          className="w-full h-full block"
        />

        {/* ⚡ شريط معلومات المسار النشط الهندسي (Active Net HUD) */}
        {selectedNet && (
          <div className="absolute top-4 left-4 z-20 px-4 py-2.5 rounded-2xl bg-gray-950/90 border border-amber-500/50 backdrop-blur-md shadow-2xl flex items-center gap-3 animate-fadeIn">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black text-amber-400">{selectedNet}</span>
                {activeRailInfo?.voltage && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold font-mono">
                    {activeRailInfo.voltage}
                  </span>
                )}
              </div>
              {activeRailInfo?.diodeMode && (
                <div className="text-[10px] text-sky-300 font-mono mt-0.5">
                  ممانعة الدايود الطبيعية: <strong>{activeRailInfo.diodeMode}</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 💡 بطاقة الفحص الهندسي للرجل المشتبه بها (Pin Inspector Tooltip) */}
        {hoveredPin && (
          <div className="absolute bottom-4 left-4 z-30 p-3.5 bg-gray-950/95 border border-amber-500/50 rounded-2xl shadow-2xl backdrop-blur-md text-xs space-y-1.5 animate-fadeIn max-w-xs pointer-events-none">
            <div className="flex items-center justify-between border-b border-gray-800 pb-1">
              <span className="font-mono font-black text-amber-400">
                {hoveredComponent?.name} • Pin {hoveredPin.pinNumber}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-dahab-500/20 text-dahab-300 font-bold">
                {hoveredPin.isGround ? 'GND أرضي' : hoveredPin.isPower ? 'Power مسار طاقة' : 'Signal إشارة'}
              </span>
            </div>
            
            <div className="text-gray-200">
              <strong className="text-gray-400">اسم المسار (Net):</strong>{' '}
              <span className="font-mono text-dahab-400 font-bold">{hoveredPin.netName}</span>
            </div>

            {hoveredPin.diodeReading && (
              <div className="text-sky-300">
                <strong>الممانعة الطبيعية (Diode Mode):</strong>{' '}
                <span className="font-mono font-bold">{hoveredPin.diodeReading}</span>
              </div>
            )}

            {hoveredPin.voltage && (
              <div className="text-emerald-300">
                <strong>الجهد المتوقع (Voltage):</strong>{' '}
                <span className="font-mono font-bold">{hoveredPin.voltage}</span>
              </div>
            )}

            <div className="text-[10px] text-gray-500 pt-0.5">
              اضغط لتوهج المسار كاملاً عبر وجهي البوردة ⚡
            </div>
          </div>
        )}

        {/* قائمة المسارات الجانبية السريعة */}
        <div className="absolute top-4 right-4 z-20 max-h-80 w-56 bg-gray-950/90 border border-gray-800 rounded-2xl p-2.5 backdrop-blur-md overflow-hidden flex flex-col shadow-xl">
          <div className="text-[11px] font-black text-gray-300 pb-1.5 border-b border-gray-800 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> مسارات البوردة (Nets):
            </span>
            <span className="text-[9px] font-mono text-dahab-400">{availableNets.length}</span>
          </div>

          <div className="overflow-y-auto space-y-1 pt-1.5 flex-1 pr-1">
            {availableNets
              .filter((n) => !netSearchQuery || n.toLowerCase().includes(netSearchQuery.toLowerCase()))
              .map((net) => {
                const isActive = selectedNet && net.toLowerCase() === selectedNet.toLowerCase();
                return (
                  <button
                    key={net}
                    onClick={() => {
                      setSelectedNet(net);
                      if (onNetSelect) onNetSelect(net);
                    }}
                    className={`w-full text-right px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold transition flex items-center justify-between ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'text-gray-300 hover:bg-gray-850 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{net}</span>
                    {isActive && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                  </button>
                );
              })}
          </div>
        </div>

      </div>

      {/* شريط المعلومات السفلي */}
      <div className="px-4 py-2 bg-gray-950 border-t border-gray-800 text-[11px] text-gray-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span>المسار النشط: <strong className="text-dahab-400 font-mono">{selectedNet || 'لا يوجد'}</strong></span>
          <span className="hidden sm:inline opacity-40">•</span>
          <span className="hidden sm:inline">عجلة الماوس: تكبير/تصغير | سحب الماوس: تحريك البوردة</span>
        </div>
        <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Vector CAD Engine • 863 Boards Live</span>
        </div>
      </div>

    </div>
  );
}
