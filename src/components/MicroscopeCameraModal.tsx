'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  X,
  Crosshair,
  Grid,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Sun,
  Contrast,
  Sliders,
  Check,
  Minimize2,
  Maximize2,
  RefreshCw,
  Sparkles,
  Layers,
  PictureInPicture2,
  Eye,
  AlertCircle,
} from 'lucide-react';

interface MicroscopeCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageBase64: string) => void;
}

export default function MicroscopeCameraModal({
  isOpen,
  onClose,
  onCapture,
}: MicroscopeCameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // الكاميرات المتوفرة
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // إعدادات المعاينة المجهرية
  const [showCrosshair, setShowCrosshair] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(110);
  const [invertedColor, setInvertedColor] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [frozenImage, setFrozenImage] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [flashEffect, setFlashEffect] = useState(false);

  // البحث عن الكاميرات الموصولة بالكمبيوتر
  const loadDevices = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        setCameraError('المتصفح لا يدعم الوصول المباشر لكاميرات الـ USB أو الميكروسكوب.');
        return;
      }

      // طلب إذن الكاميرا أولاً لتظهر أسماء الأجهزة الحقيقية
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      tempStream.getTracks().forEach((track) => track.stop());

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter((d) => d.kind === 'videoinput');
      setDevices(videoInputs);

      if (videoInputs.length > 0 && !selectedDeviceId) {
        // تفضيل الكاميرات التي تحتوي على كلمة microscope أو usb أو external
        const microscope = videoInputs.find((d) =>
          d.label.toLowerCase().includes('microscope') ||
          d.label.toLowerCase().includes('hayear') ||
          d.label.toLowerCase().includes('andonstar') ||
          d.label.toLowerCase().includes('usb')
        );
        setSelectedDeviceId(microscope ? microscope.deviceId : videoInputs[0].deviceId);
      }
    } catch (err: any) {
      console.warn('Microscope device listing note:', err);
      setCameraError('يرجى السماح بصلاحية الكاميرا في المتصفح لربط الميكروسكوب.');
    }
  };

  // تشغيل الكاميرا عند فتح النافذة أو تبديل الجهاز
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    loadDevices();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !selectedDeviceId) return;

    startCamera(selectedDeviceId);

    return () => {
      stopCamera();
    };
  }, [selectedDeviceId, isOpen]);

  const startCamera = async (deviceId: string) => {
    stopCamera();
    setCameraError(null);
    setIsFrozen(false);
    setFrozenImage(null);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch((e) => console.log('Video play interrupted:', e));
      }
    } catch (err: any) {
      console.error('Error starting microscope stream:', err);
      setCameraError('تعذر فتح بث الميكروسكوب. تأكد من توصيل كابل USB وعدم استخدام برنامج آخر للكاميرا.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // تجميد الإطار (Freeze Frame)
  const toggleFreeze = () => {
    if (isFrozen) {
      setIsFrozen(false);
      setFrozenImage(null);
    } else {
      const captured = grabCurrentFrame();
      if (captured) {
        setFrozenImage(captured);
        setIsFrozen(true);
      }
    }
  };

  // استخراج الإطار الحالي بالمرشحات والتكبير
  const grabCurrentFrame = (): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    let width = video.videoWidth || 1280;
    let height = video.videoHeight || 720;
    const MAX_DIM = 1920;
    if (width > MAX_DIM || height > MAX_DIM) {
      if (width > height) {
        height = Math.round((height * MAX_DIM) / width);
        width = MAX_DIM;
      } else {
        width = Math.round((width * MAX_DIM) / height);
        height = MAX_DIM;
      }
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.save();

    // تطبيق الدوران
    ctx.translate(width / 2, height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(-width / 2, -height / 2);

    // تطبيق المرشحات
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)${invertedColor ? ' invert(100%)' : ''}`;

    ctx.drawImage(video, 0, 0, width, height);
    ctx.restore();

    return canvas.toDataURL('image/jpeg', 0.85);
  };

  // التقاط الصورة وتمريرها لمحرك الفحص الذكي
  const handleCaptureSnapshot = () => {
    const imageData = isFrozen && frozenImage ? frozenImage : grabCurrentFrame();
    if (!imageData) return;

    // وميض الشتر
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 250);

    // تمرير الصورة
    onCapture(imageData);
    onClose();
  };

  // تفعيل النافذة العائمة المنفصلة (Picture-in-Picture)
  const handleTogglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (e) {
      console.warn('PiP error:', e);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />

      {/* النافذة العائمة المصغرة عند الضغط على تصغير */}
      {isMinimized ? (
        <div className="fixed bottom-20 left-4 z-50 w-72 bg-gray-900 border-2 border-dahab-500 rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
          <div className="p-2.5 bg-gray-950 flex items-center justify-between text-xs text-white">
            <span className="font-bold flex items-center gap-1.5 text-dahab-400">
              <Camera className="w-3.5 h-3.5" /> ميكروسكوب مباشر
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(false)}
                className="p-1 hover:bg-gray-800 rounded-lg text-gray-300"
                title="تكبير"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onClose}
                className="p-1 hover:bg-rose-900/50 rounded-lg text-gray-300 hover:text-rose-400"
                title="إغلاق"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="relative aspect-video bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
              style={{
                transform: `rotate(${rotation}deg) scale(${zoomLevel})`,
                filter: `brightness(${brightness}%) contrast(${contrast}%)${invertedColor ? ' invert(100%)' : ''}`,
              }}
            />
          </div>
          <div className="p-2 bg-gray-950 flex items-center justify-between">
            <button
              onClick={handleCaptureSnapshot}
              className="w-full py-1.5 bg-gradient-to-r from-dahab-500 to-amber-600 hover:from-dahab-600 text-slate-950 font-black text-xs rounded-xl shadow flex items-center justify-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>التقاط للتشخيص</span>
            </button>
          </div>
        </div>
      ) : (
        /* النافذة الرئيسية الكاملة */
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn font-sans">
          <div className="bg-[#0f172a] border border-dahab-500/40 rounded-3xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden relative">
            
            {/* وميض الشتر عند الالتقاط */}
            {flashEffect && <div className="absolute inset-0 bg-white/70 z-50 pointer-events-none transition-opacity duration-200" />}

            {/* الهيدر العلوي */}
            <div className="px-4 py-3 bg-gray-950/80 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-dahab-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-md">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-gray-100 flex items-center gap-2">
                    <span>كاميرا الميكروسكوب الإلكتروني المباشرة</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> مباشر USB
                    </span>
                  </h3>
                </div>
              </div>

              {/* اختيار الكاميرا والأزرار العلوية */}
              <div className="flex items-center gap-2">
                {devices.length > 1 && (
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    className="bg-gray-800 border border-gray-700 text-gray-200 text-[11px] rounded-xl px-2.5 py-1.5 outline-none focus:border-dahab-500 max-w-[160px] sm:max-w-[220px] truncate"
                  >
                    {devices.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `كاميرا #${i + 1}`}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  onClick={handleTogglePiP}
                  className="p-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
                  title="نافذة عائمة خارجية (Picture-in-Picture)"
                >
                  <PictureInPicture2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
                  title="تصغير لنافذة عائمة جانبية"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl bg-gray-800 hover:bg-rose-900/60 text-gray-300 hover:text-rose-400 transition"
                  title="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* شاشة العرض المباشرة مع الشبكة والنيشان */}
            <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center min-h-[360px] max-h-[580px]">
              
              {/* خطأ الكاميرا إن وُجد */}
              {cameraError ? (
                <div className="p-6 text-center max-w-md space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-200">تعذر بدء بث الكاميرا</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">{cameraError}</p>
                  <button
                    onClick={() => startCamera(selectedDeviceId)}
                    className="px-4 py-2 rounded-xl bg-dahab-500 hover:bg-dahab-600 text-slate-950 text-xs font-black transition inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>إعادة المحاولة</span>
                  </button>
                </div>
              ) : isFrozen && frozenImage ? (
                /* عرض الكادر المجمد */
                <img
                  src={frozenImage}
                  alt="Frozen Microscope Frame"
                  className="w-full h-full object-contain select-none"
                />
              ) : (
                /* عنصر الفيديو المباشر */
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain select-none transition-transform duration-100"
                  style={{
                    transform: `rotate(${rotation}deg) scale(${zoomLevel})`,
                    filter: `brightness(${brightness}%) contrast(${contrast}%)${invertedColor ? ' invert(100%)' : ''}`,
                  }}
                />
              )}

              {/* 🎯 شبكة التقاطع والنيشان الليزري (Crosshair) */}
              {showCrosshair && !cameraError && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  {/* خط عمودي */}
                  <div className="absolute top-0 bottom-0 w-[1.5px] bg-amber-400/70 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                  {/* خط أفقي */}
                  <div className="absolute left-0 right-0 h-[1.5px] bg-amber-400/70 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                  {/* دائرة المركز المجهرية */}
                  <div className="w-14 h-14 rounded-full border border-amber-400/80 shadow-[0_0_10px_rgba(245,158,11,0.6)] flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
                  </div>
                </div>
              )}

              {/* 📏 شبكة الميكروميتر الهندسية (Measurement Grid) */}
              {showGrid && !cameraError && (
                <div
                  className="absolute inset-0 pointer-events-none opacity-25"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, rgba(59, 130, 246, 0.4) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(59, 130, 246, 0.4) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                  }}
                />
              )}

              {/* بادج تجميد الكادر */}
              {isFrozen && (
                <div className="absolute top-4 right-4 bg-sky-500/90 text-slate-950 text-xs font-black px-3 py-1 rounded-xl shadow-lg flex items-center gap-1.5 animate-pulse">
                  <Eye className="w-3.5 h-3.5" />
                  <span>كادر مجمد للمعاينة</span>
                </div>
              )}

              {/* بادج التكبير الحالي */}
              {zoomLevel > 1 && (
                <div className="absolute top-4 left-4 bg-black/70 border border-gray-700 text-dahab-400 text-[11px] font-black px-2.5 py-1 rounded-xl backdrop-blur-sm">
                  {zoomLevel.toFixed(1)}x Zoom
                </div>
              )}
            </div>

            {/* لوحة التحكم والتحسينات المجهرية */}
            <div className="p-3 sm:p-4 bg-gray-950 border-t border-gray-800 space-y-3">
              
              {/* شريط الأدوات السريعة */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                
                {/* مفاتيح التكبير والتوجيه */}
                <div className="flex items-center gap-1 bg-gray-900 p-1 rounded-2xl border border-gray-800">
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(1, +(z - 0.25).toFixed(2)))}
                    className="p-1.5 rounded-xl hover:bg-gray-800 text-gray-300 transition"
                    title="تصغير"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-bold text-dahab-400 px-2 min-w-[40px] text-center">
                    {zoomLevel.toFixed(1)}x
                  </span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(4, +(z + 0.25).toFixed(2)))}
                    className="p-1.5 rounded-xl hover:bg-gray-800 text-gray-300 transition"
                    title="تكبير رقمي"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  <div className="w-[1px] h-4 bg-gray-700 mx-1" />

                  <button
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="p-1.5 rounded-xl hover:bg-gray-800 text-gray-300 transition flex items-center gap-1 text-[11px]"
                    title="تدوير الكاميرا 90 درجة"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>{rotation}°</span>
                  </button>
                </div>

                {/* أدوات المعايرة (نيشان، شبكة، مرشحات) */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowCrosshair(!showCrosshair)}
                    className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 text-xs font-bold ${
                      showCrosshair
                        ? 'bg-amber-500/20 text-dahab-400 border-amber-500/50'
                        : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-gray-200'
                    }`}
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>النيشان</span>
                  </button>

                  <button
                    onClick={() => setShowGrid(!showGrid)}
                    className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 text-xs font-bold ${
                      showGrid
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                        : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-gray-200'
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>شبكة القياس</span>
                  </button>

                  <button
                    onClick={toggleFreeze}
                    className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 text-xs font-bold ${
                      isFrozen
                        ? 'bg-sky-500 text-slate-950 border-sky-400'
                        : 'bg-gray-900 text-gray-300 border-gray-800 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isFrozen ? 'استئناف البث' : 'تجميد الكادر'}</span>
                  </button>

                  <button
                    onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                    className={`p-1.5 rounded-xl border transition ${
                      showFiltersPanel
                        ? 'bg-dahab-500 text-slate-950 border-dahab-400'
                        : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-gray-200'
                    }`}
                    title="مرشحات الإضاءة والوضوح"
                  >
                    <Sliders className="w-4 h-4" />
                  </button>
                </div>

                {/* زر الالتقاط الرئيسي للتشخيص */}
                <button
                  onClick={handleCaptureSnapshot}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-dahab-500 to-amber-600 hover:from-dahab-600 hover:to-amber-700 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-lg active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>التقاط للتشخيص فوراً 📸</span>
                </button>
              </div>

              {/* لوحة سلايدرز الإضاءة والتباين للميكروسكوب */}
              {showFiltersPanel && (
                <div className="p-3 bg-gray-900/90 border border-gray-800 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fadeIn text-[11px]">
                  <div className="space-y-1">
                    <div className="flex justify-between text-gray-400">
                      <span className="flex items-center gap-1"><Sun className="w-3 h-3" /> السطوع:</span>
                      <span>{brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="180"
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-full accent-dahab-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-gray-400">
                      <span className="flex items-center gap-1"><Contrast className="w-3 h-3" /> التباين:</span>
                      <span>{contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      value={contrast}
                      onChange={(e) => setContrast(Number(e.target.value))}
                      className="w-full accent-dahab-500"
                    />
                  </div>

                  <div className="flex items-center justify-between sm:justify-center gap-2">
                    <button
                      onClick={() => setInvertedColor(!invertedColor)}
                      className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition ${
                        invertedColor
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500'
                          : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-gray-200'
                      }`}
                    >
                      عكس الألوان (Invert)
                    </button>
                    <button
                      onClick={() => {
                        setBrightness(100);
                        setContrast(110);
                        setZoomLevel(1);
                        setRotation(0);
                        setInvertedColor(false);
                      }}
                      className="text-[10px] text-gray-400 hover:text-dahab-400 transition"
                    >
                      إعادة ضبط
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}
    </>
  );
}
