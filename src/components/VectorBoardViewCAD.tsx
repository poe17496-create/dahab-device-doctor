'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
} from 'lucide-react';

export interface VectorPin {
  id: string;
  pinNumber: number | string;
  netName: string;
  x: number; // relative PCB coordinate (e.g. 0 to 1000)
  y: number;
  radius?: number;
  isGround?: boolean;
  isPower?: boolean;
  diodeReading?: string;
  voltage?: string;
}

export interface VectorComponent {
  name: string; // e.g. U1001, C2015, PU401
  type: 'IC' | 'Capacitor' | 'Resistor' | 'Inductor' | 'Connector' | 'Mosfet' | 'Diode';
  x: number;
  y: number;
  width: number;
  height: number;
  side: 'TOP' | 'BOTTOM';
  pins: VectorPin[];
  value?: string;
  description?: string;
}

export interface VectorBoardModel {
  name: string;
  boardCode: string;
  deviceType: 'mobile' | 'laptop' | 'desktop';
  width: number;
  height: number;
  outline: Array<{ x: number; y: number }>;
  components: VectorComponent[];
}

// =========================================================================
// نماذج بوردات فيكتور هندسية حقيقية متكاملة (موبايل ولابتوب) مدمجة مسبقاً
// =========================================================================
const BUILTIN_VECTOR_BOARDS: VectorBoardModel[] = [
  {
    name: 'iPhone 13 Pro Max (Logic Board)',
    boardCode: '820-02384',
    deviceType: 'mobile',
    width: 900,
    height: 700,
    outline: [
      { x: 50, y: 50 },
      { x: 850, y: 50 },
      { x: 850, y: 650 },
      { x: 50, y: 650 },
    ],
    components: [
      {
        name: 'U1000_CPU',
        type: 'IC',
        x: 350,
        y: 200,
        width: 180,
        height: 180,
        side: 'TOP',
        description: 'Apple A15 Bionic SoC Processor',
        pins: [
          { id: 'cpu_p1', pinNumber: 1, netName: 'PP_CPU_CORE', x: 370, y: 220, diodeReading: '0.025V', isPower: true },
          { id: 'cpu_p2', pinNumber: 2, netName: 'PP_CPU_CORE', x: 390, y: 220, diodeReading: '0.025V', isPower: true },
          { id: 'cpu_p3', pinNumber: 3, netName: 'GND', x: 410, y: 220, isGround: true },
          { id: 'cpu_p4', pinNumber: 4, netName: 'PP1V8_S2', x: 430, y: 220, diodeReading: '0.450V', isPower: true },
          { id: 'cpu_p5', pinNumber: 5, netName: 'PP_VDD_MAIN', x: 450, y: 220, diodeReading: '0.380V', isPower: true },
          { id: 'cpu_p6', pinNumber: 6, netName: 'SOC_RESET_L', x: 470, y: 220, diodeReading: '0.550V' },
          { id: 'cpu_p7', pinNumber: 7, netName: 'GND', x: 490, y: 220, isGround: true },
          // الصف الثاني
          { id: 'cpu_p8', pinNumber: 8, netName: 'PP_GPU_CORE', x: 370, y: 350, diodeReading: '0.035V', isPower: true },
          { id: 'cpu_p9', pinNumber: 9, netName: 'GND', x: 390, y: 350, isGround: true },
          { id: 'cpu_p10', pinNumber: 10, netName: 'PP1V2_LPDDR5', x: 410, y: 350, diodeReading: '0.310V', isPower: true },
          { id: 'cpu_p11', pinNumber: 11, netName: 'PP_VDD_MAIN', x: 430, y: 350, diodeReading: '0.380V', isPower: true },
        ],
      },
      {
        name: 'U1200_PMIC',
        type: 'IC',
        x: 120,
        y: 200,
        width: 140,
        height: 140,
        side: 'TOP',
        description: 'Main Power Management IC (PMIC)',
        pins: [
          { id: 'pmic_p1', pinNumber: 1, netName: 'PP_BATT_VCC', x: 140, y: 220, diodeReading: '0.480V', isPower: true, voltage: '3.8V-4.3V' },
          { id: 'pmic_p2', pinNumber: 2, netName: 'PP_VDD_MAIN', x: 160, y: 220, diodeReading: '0.380V', isPower: true, voltage: '3.8V-4.2V' },
          { id: 'pmic_p3', pinNumber: 3, netName: 'PP_VDD_BOOST', x: 180, y: 220, diodeReading: '0.420V', isPower: true, voltage: '4.0V' },
          { id: 'pmic_p4', pinNumber: 4, netName: 'GND', x: 200, y: 220, isGround: true },
          { id: 'pmic_p5', pinNumber: 5, netName: 'PP1V8_ALWAYS', x: 220, y: 220, diodeReading: '0.490V', isPower: true, voltage: '1.8V' },
          { id: 'pmic_p6', pinNumber: 6, netName: 'PP_CPU_CORE', x: 140, y: 310, diodeReading: '0.025V', isPower: true, voltage: '0.8V' },
          { id: 'pmic_p7', pinNumber: 7, netName: 'PP_GPU_CORE', x: 160, y: 310, diodeReading: '0.035V', isPower: true, voltage: '0.9V' },
          { id: 'pmic_p8', pinNumber: 8, netName: 'GND', x: 180, y: 310, isGround: true },
          { id: 'pmic_p9', pinNumber: 9, netName: 'PMIC_RESET_OUT', x: 200, y: 310, diodeReading: '0.620V', voltage: '1.8V' },
        ],
      },
      {
        name: 'U3300_CHARGER',
        type: 'IC',
        x: 620,
        y: 200,
        width: 120,
        height: 110,
        side: 'TOP',
        description: 'Hydra USB-PD Charging IC',
        pins: [
          { id: 'chg_p1', pinNumber: 1, netName: 'PP_VBUS_USB', x: 640, y: 220, diodeReading: '0.520V', isPower: true, voltage: '5V/9V' },
          { id: 'chg_p2', pinNumber: 2, netName: 'PP_VDD_MAIN', x: 660, y: 220, diodeReading: '0.380V', isPower: true, voltage: '3.8V' },
          { id: 'chg_p3', pinNumber: 3, netName: 'USB_DP', x: 680, y: 220, diodeReading: '0.680V' },
          { id: 'chg_p4', pinNumber: 4, netName: 'USB_DN', x: 700, y: 220, diodeReading: '0.680V' },
          { id: 'chg_p5', pinNumber: 5, netName: 'GND', x: 640, y: 290, isGround: true },
          { id: 'chg_p6', pinNumber: 6, netName: 'PP1V8_S2', x: 660, y: 290, diodeReading: '0.450V', isPower: true },
        ],
      },
      {
        name: 'C1501',
        type: 'Capacitor',
        x: 280,
        y: 220,
        width: 35,
        height: 20,
        side: 'TOP',
        value: '22uF 6.3V',
        description: 'VDD_MAIN Decoupling Filter',
        pins: [
          { id: 'c1501_1', pinNumber: 1, netName: 'PP_VDD_MAIN', x: 285, y: 230, diodeReading: '0.380V', isPower: true },
          { id: 'c1501_2', pinNumber: 2, netName: 'GND', x: 310, y: 230, isGround: true },
        ],
      },
      {
        name: 'C1502',
        type: 'Capacitor',
        x: 280,
        y: 260,
        width: 35,
        height: 20,
        side: 'TOP',
        value: '10uF 6.3V',
        description: 'VDD_MAIN Filter',
        pins: [
          { id: 'c1502_1', pinNumber: 1, netName: 'PP_VDD_MAIN', x: 285, y: 270, diodeReading: '0.380V', isPower: true },
          { id: 'c1502_2', pinNumber: 2, netName: 'GND', x: 310, y: 270, isGround: true },
        ],
      },
      {
        name: 'L1200_COIL',
        type: 'Inductor',
        x: 120,
        y: 370,
        width: 50,
        height: 40,
        side: 'TOP',
        value: '1.0uH 4A',
        description: 'Buck Converter Inductor for CPU',
        pins: [
          { id: 'l1200_1', pinNumber: 1, netName: 'PP_VDD_MAIN', x: 130, y: 390, isPower: true },
          { id: 'l1200_2', pinNumber: 2, netName: 'PP_CPU_CORE', x: 160, y: 390, isPower: true, diodeReading: '0.025V' },
        ],
      },
      // الوجه السفلي (BOTTOM SIDE)
      {
        name: 'U3000_NAND',
        type: 'IC',
        x: 350,
        y: 200,
        width: 170,
        height: 150,
        side: 'BOTTOM',
        description: 'NVMe Flash Storage Memory (NAND)',
        pins: [
          { id: 'nand_p1', pinNumber: 1, netName: 'PP_VDD_MAIN', x: 370, y: 220, isPower: true, diodeReading: '0.380V' },
          { id: 'nand_p2', pinNumber: 2, netName: 'PP1V8_ALWAYS', x: 390, y: 220, isPower: true, diodeReading: '0.490V' },
          { id: 'nand_p3', pinNumber: 3, netName: 'PP2V5_NAND', x: 410, y: 220, isPower: true, diodeReading: '0.410V' },
          { id: 'nand_p4', pinNumber: 4, netName: 'GND', x: 430, y: 220, isGround: true },
          { id: 'nand_p5', pinNumber: 5, netName: 'PCIE_NAND_TX', x: 450, y: 220, diodeReading: '0.330V' },
        ],
      },
      {
        name: 'U5000_WIFI',
        type: 'IC',
        x: 600,
        y: 400,
        width: 130,
        height: 130,
        side: 'BOTTOM',
        description: 'Wi-Fi 6 & Bluetooth Module (Broadcom)',
        pins: [
          { id: 'wifi_p1', pinNumber: 1, netName: 'PP_VDD_MAIN', x: 620, y: 420, isPower: true, diodeReading: '0.380V' },
          { id: 'wifi_p2', pinNumber: 2, netName: 'PP1V8_S2', x: 640, y: 420, isPower: true, diodeReading: '0.450V' },
          { id: 'wifi_p3', pinNumber: 3, netName: 'WLAN_PCIE_CLK', x: 660, y: 420, diodeReading: '0.360V' },
          { id: 'wifi_p4', pinNumber: 4, netName: 'GND', x: 680, y: 420, isGround: true },
        ],
      },
    ],
  },
  {
    name: 'Dell Inspiron 5521 (LA-9104P Motherboard)',
    boardCode: 'LA-9104P / QCL00',
    deviceType: 'laptop',
    width: 950,
    height: 750,
    outline: [
      { x: 40, y: 40 },
      { x: 910, y: 40 },
      { x: 910, y: 710 },
      { x: 40, y: 710 },
    ],
    components: [
      {
        name: 'PU401_3V5V',
        type: 'IC',
        x: 200,
        y: 180,
        width: 120,
        height: 120,
        side: 'TOP',
        description: 'TPS51125 Dual Step-Down Controller (3.3V / 5V Always)',
        pins: [
          { id: 'pu401_p16', pinNumber: 16, netName: '+19V_VIN', x: 220, y: 195, isPower: true, diodeReading: '0.450V', voltage: '19.5V' },
          { id: 'pu401_p8', pinNumber: 8, netName: '+3VALWP', x: 250, y: 195, isPower: true, diodeReading: '0.380V', voltage: '3.3V' },
          { id: 'pu401_p17', pinNumber: 17, netName: '+5VALWP', x: 280, y: 195, isPower: true, diodeReading: '0.410V', voltage: '5.0V' },
          { id: 'pu401_p1', pinNumber: 1, netName: 'ENTRIP1', x: 220, y: 285, diodeReading: '0.520V' },
          { id: 'pu401_p6', pinNumber: 6, netName: 'ENTRIP2', x: 250, y: 285, diodeReading: '0.520V' },
          { id: 'pu401_gnd', pinNumber: 25, netName: 'GND', x: 280, y: 285, isGround: true },
        ],
      },
      {
        name: 'PQ401_MOSFET',
        type: 'Mosfet',
        x: 100,
        y: 180,
        width: 60,
        height: 60,
        side: 'TOP',
        description: 'High-Side MOSFET for 19V Input Path',
        pins: [
          { id: 'pq401_s', pinNumber: '1-3', netName: '+19V_VIN', x: 110, y: 200, isPower: true, voltage: '19.5V' },
          { id: 'pq401_g', pinNumber: '4', netName: 'CHG_GATE', x: 130, y: 200, voltage: '24V' },
          { id: 'pq401_d', pinNumber: '5-8', netName: '+BATT_PWR', x: 150, y: 200, isPower: true },
        ],
      },
      {
        name: 'KB9012_EC_IO',
        type: 'IC',
        x: 500,
        y: 350,
        width: 160,
        height: 160,
        side: 'TOP',
        description: 'ENE KB9012QF Keyboard & Embedded Controller (EC/KBC)',
        pins: [
          { id: 'kbc_vcc', pinNumber: 9, netName: '+3VALWP', x: 520, y: 370, isPower: true, diodeReading: '0.380V', voltage: '3.3V' },
          { id: 'kbc_pwr_btn', pinNumber: 110, netName: 'ON/OFF_BTN#', x: 550, y: 370, diodeReading: '0.620V', voltage: '3.3V' },
          { id: 'kbc_gnd', pinNumber: 22, netName: 'GND', x: 580, y: 370, isGround: true },
          { id: 'kbc_rsmrst', pinNumber: 100, netName: 'EC_RSMRST#', x: 610, y: 370, diodeReading: '0.580V', voltage: '3.3V' },
          { id: 'kbc_lid', pinNumber: 115, netName: 'LID_SW#', x: 640, y: 370, diodeReading: '0.610V', voltage: '3.3V' },
        ],
      },
    ],
  },
];

interface VectorBoardViewCADProps {
  boardName?: string;
  selectedNet?: string | null;
  onNetSelect?: (netName: string) => void;
  onComponentSelect?: (compName: string) => void;
}

export default function VectorBoardViewCAD({
  boardName,
  selectedNet: initialNet,
  onNetSelect,
  onComponentSelect,
}: VectorBoardViewCADProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // حالة البورد والمشهد المتجه
  const [activeBoard, setActiveBoard] = useState<VectorBoardModel>(BUILTIN_VECTOR_BOARDS[0]);
  const [boardSide, setBoardSide] = useState<'TOP' | 'BOTTOM'>('TOP');
  const [selectedNet, setSelectedNet] = useState<string | null>(initialNet || 'PP_VDD_MAIN');
  const [hoveredPin, setHoveredPin] = useState<VectorPin | null>(null);
  const [hoveredComponent, setHoveredComponent] = useState<VectorComponent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // تحكم الكاميرا (Pan & Zoom)
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // مزامنة النموذج مع اسم البورد الممرر
  useEffect(() => {
    if (boardName) {
      const match = BUILTIN_VECTOR_BOARDS.find(
        (b) =>
          b.name.toLowerCase().includes(boardName.toLowerCase()) ||
          b.boardCode.toLowerCase().includes(boardName.toLowerCase())
      );
      if (match) setActiveBoard(match);
    }
  }, [boardName]);

  // استخراج قائمة المسارات المتاحة على الوجه الحالي
  const availableNets = React.useMemo(() => {
    const set = new Set<string>();
    activeBoard.components.forEach((c) => {
      c.pins.forEach((p) => {
        if (p.netName) set.add(p.netName);
      });
    });
    return Array.from(set).sort();
  }, [activeBoard]);

  // رسم المشهد المتجه على Canvas 2D
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ضبط مقاس الـ Canvas الحقيقي
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // خلفية معمل الصيانة المظلمة (Deep PCB CAD Background)
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.save();
    // تطبيق تحريك الكاميرا والتكبير
    ctx.translate(rect.width / 2 + panX, rect.height / 2 + panY);
    ctx.scale(scale, scale);
    ctx.translate(-activeBoard.width / 2, -activeBoard.height / 2);

    // 1. رسم شبكة الميكروميتر الهندسية الدقيقة
    ctx.strokeStyle = '#1e293b';
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

    // 2. رسم مضلع البوردة الرئيسي (PCB Board Outline)
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    activeBoard.outline.forEach((pt, i) => {
      // إذا كان الوجه سفلي، نعكس الإحداثي الأفقي (Mirror X for Bottom Side)
      const px = boardSide === 'BOTTOM' ? activeBoard.width - pt.x : pt.x;
      if (i === 0) ctx.moveTo(px, pt.y);
      else ctx.lineTo(px, pt.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0; // إزالة الضل

    // علامة الوجه الحالي في زاوية البوردة
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`SIDE: ${boardSide} • [${activeBoard.boardCode}]`, 60, 80);

    // 3. تصفية المكونات حسب الوجه الحالي (TOP أو BOTTOM)
    const visibleComponents = activeBoard.components.filter((c) => c.side === boardSide);

    // 4. رسم خطوط المسار المحدد (Traces) الواصلة بين الأرجل
    if (selectedNet) {
      const netPins: Array<{ x: number; y: number }> = [];
      visibleComponents.forEach((c) => {
        c.pins.forEach((p) => {
          if (p.netName.toLowerCase() === selectedNet.toLowerCase()) {
            const px = boardSide === 'BOTTOM' ? activeBoard.width - p.x : p.x;
            netPins.push({ x: px, y: p.y });
          }
        });
      });

      // رسم شعاع كهربائي متوهج بين نقاط المسار
      if (netPins.length > 1) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        for (let i = 0; i < netPins.length - 1; i++) {
          ctx.moveTo(netPins[i].x, netPins[i].y);
          ctx.lineTo(netPins[i + 1].x, netPins[i + 1].y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    // 5. رسم المكونات والآيسيات (Components CAD Boxes)
    visibleComponents.forEach((comp) => {
      const cx = boardSide === 'BOTTOM' ? activeBoard.width - comp.x - comp.width : comp.x;
      const cy = comp.y;
      const isCompHovered = hoveredComponent?.name === comp.name;

      // هيكل الآيسي
      ctx.fillStyle = isCompHovered ? '#1e293b' : '#111827';
      ctx.strokeStyle = isCompHovered ? '#f59e0b' : '#475569';
      ctx.lineWidth = 1.5;
      ctx.fillRect(cx, cy, comp.width, comp.height);
      ctx.strokeRect(cx, cy, comp.width, comp.height);

      // نقطة الدليل Pin 1 Dot
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(cx + 8, cy + 8, 3, 0, Math.PI * 2);
      ctx.fill();

      // اسم المكون بالحرير السيلك سكرين (Silk Screen Label)
      ctx.fillStyle = isCompHovered ? '#fbbf24' : '#94a3b8';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(comp.name, cx + 12, cy + comp.height / 2 + 4);

      // 6. رسم الأرجل ونقاط التلامس (Copper Pins / Pads)
      comp.pins.forEach((pin) => {
        const px = boardSide === 'BOTTOM' ? activeBoard.width - pin.x : pin.x;
        const py = pin.y;
        const isNetActive = selectedNet && pin.netName.toLowerCase() === selectedNet.toLowerCase();
        const isPinHovered = hoveredPin?.id === pin.id;

        ctx.beginPath();
        ctx.arc(px, py, isNetActive ? 7 : 5, 0, Math.PI * 2);

        if (pin.isGround) {
          ctx.fillStyle = isNetActive ? '#ef4444' : '#64748b'; // الأرضي
        } else if (isNetActive) {
          ctx.fillStyle = '#f59e0b'; // المسار المختار يتوهج بذهبي ساطع
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 12;
        } else if (pin.isPower) {
          ctx.fillStyle = '#38bdf8'; // خطوط التغذية الرئيسية زرقاء
        } else {
          ctx.fillStyle = '#e2e8f0'; // أرجل إشارة عادية
        }

        ctx.fill();
        ctx.shadowBlur = 0;

        // إطار الرجل
        ctx.strokeStyle = isPinHovered ? '#ffffff' : '#0f172a';
        ctx.lineWidth = isPinHovered ? 2 : 1;
        ctx.stroke();

        // رقم الرجل عند التكبير العالي
        if (scale > 1.4) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '8px monospace';
          ctx.fillText(String(pin.pinNumber), px - 3, py - 8);
        }
      });
    });

    ctx.restore();
  }, [activeBoard, boardSide, selectedNet, hoveredPin, hoveredComponent, scale, panX, panY]);

  // إعادة الرسم عند أي تغيير
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // مراقبة أبعاد الشاشة
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

    // اكتشاف الوقوف فوق الأرجل والمكونات (Hit Testing)
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // تحويل إحداثيات الشاشة إلى إحداثيات البوردة
    const boardX = (mouseX - (rect.width / 2 + panX)) / scale + activeBoard.width / 2;
    const boardY = (mouseY - (rect.height / 2 + panY)) / scale + activeBoard.height / 2;

    const visibleComponents = activeBoard.components.filter((c) => c.side === boardSide);

    // فحص الأرجل
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

  // اختيار المسار عند الضغط على الرجل
  const handleClick = () => {
    if (hoveredPin) {
      setSelectedNet(hoveredPin.netName);
      if (onNetSelect) onNetSelect(hoveredPin.netName);
    } else if (hoveredComponent) {
      if (onComponentSelect) onComponentSelect(hoveredComponent.name);
    }
  };

  // تدوير أو قلب البوردة
  const toggleFlipSide = () => {
    setBoardSide((prev) => (prev === 'TOP' ? 'BOTTOM' : 'TOP'));
  };

  const resetView = () => {
    setScale(1);
    setPanX(0);
    setPanY(0);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#070b14] select-none overflow-hidden relative font-sans text-right">
      
      {/* 🎛️ شريط التحكم العلوي لمحرك الفيكتور (CAD Control Bar) */}
      <div className="p-3 bg-gray-950/90 border-b border-gray-800 flex flex-wrap items-center justify-between gap-2.5 z-20 backdrop-blur-md">
        
        {/* اختيار موديل البوردة والوجه */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-dahab-500 flex items-center justify-center text-slate-950 font-black shadow-md">
            <CircuitBoard className="w-4 h-4" />
          </div>
          
          <select
            value={activeBoard.boardCode}
            onChange={(e) => {
              const b = BUILTIN_VECTOR_BOARDS.find((x) => x.boardCode === e.target.value);
              if (b) setActiveBoard(b);
            }}
            className="bg-gray-900 border border-gray-700 text-gray-100 text-xs rounded-xl px-3 py-1.5 outline-none focus:border-dahab-500 font-bold"
          >
            {BUILTIN_VECTOR_BOARDS.map((b) => (
              <option key={b.boardCode} value={b.boardCode}>
                {b.name} [{b.boardCode}]
              </option>
            ))}
          </select>

          {/* زر قلب البوردة (Flip Side) */}
          <button
            onClick={toggleFlipSide}
            className={`px-3 py-1.5 rounded-xl border text-xs font-black transition flex items-center gap-1.5 shadow-sm active:scale-95 ${
              boardSide === 'TOP'
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-sky-500 text-slate-950 border-sky-400'
            }`}
            title="قلب البوردة بين الوجه العلوي والسفلي (Spacebar / Flip)"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>وجه البوردة: {boardSide === 'TOP' ? 'العلوي (TOP) 🔼' : 'السفلي (BOTTOM) 🔽'}</span>
          </button>
        </div>

        {/* البحث السريع في المسارات */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في المسارات (VDD_MAIN / 19V)..."
              className="pr-8 pl-3 py-1.5 bg-gray-900 border border-gray-700 rounded-xl text-xs text-gray-100 outline-none focus:border-dahab-500 w-48 sm:w-56 font-mono"
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
        <div className="absolute top-4 right-4 z-20 max-h-72 w-52 bg-gray-950/90 border border-gray-800 rounded-2xl p-2.5 backdrop-blur-md overflow-hidden flex flex-col shadow-xl">
          <div className="text-[11px] font-black text-gray-300 pb-1.5 border-b border-gray-800 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> المسارات (Nets):
            </span>
            <span className="text-[9px] font-mono text-dahab-400">{availableNets.length}</span>
          </div>

          <div className="overflow-y-auto space-y-1 pt-1.5 flex-1 pr-1">
            {availableNets
              .filter((n) => !searchQuery || n.toLowerCase().includes(searchQuery.toLowerCase()))
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
          <span>Vector CAD Engine 60 FPS</span>
        </div>
      </div>

    </div>
  );
}
