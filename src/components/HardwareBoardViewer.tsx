'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Search, ZoomIn, ZoomOut, RotateCw, Download, X, Loader2, Plus, Minus, MapPin, CircuitBoard, Cpu, Zap, Dot, Upload, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';

/**
 * Hardware Board Viewer - Professional Image Overlay System
 *
 * Features:
 * - Drag & Drop with client-side compression
 * - Auto-fetches and caches board images via API
 * - Smooth zooming and panning with react-zoom-pan-pinch
 * - Percentage-based SVG overlay for nets/traces
 * - Component marking system (ICs, capacitors, resistors)
 * - AI-powered suspicious component highlighting
 * - Interactive trace highlighting
 * - Professional UI design (RTL for Arabic)
 */

// ==========================================
// Type Definitions
// ==========================================

export interface NetTrace {
  id: string;
  name: string;
  color: string;
  points: Array<{ x: string; y: string }>; // Percentage coordinates (e.g., "25%", "40%")
  description?: string;
  components?: Component[]; // Connected components
}

export interface Component {
  id: string;
  name: string;
  type: 'IC' | 'Capacitor' | 'Resistor' | 'Inductor' | 'Connector' | 'Diode' | 'Transistor' | 'Other';
  x: string; // Percentage
  y: string; // Percentage
  description?: string;
  connectedNets?: string[]; // Net IDs this component connects to
}

export interface SuspiciousMarker {
  id: number;
  x: string; // Percentage (e.g., "35%")
  y: string; // Percentage (e.g., "40%")
  label: string; // e.g., "VCC_MAIN"
  note: string; // e.g., "مكثف محتمل"
  severity?: 'low' | 'medium' | 'high';
}

export interface BoardViewerProps {
  boardName: string;
  customImageUrl?: string | null;
  nets?: Record<string, NetTrace>;
  components?: Record<string, Component>;
  suspiciousMarkers?: SuspiciousMarker[]; // AI analysis results
  onNetSelect?: (net: NetTrace) => void;
  onComponentSelect?: (component: Component) => void;
  onAddNetPoint?: (netId: string, x: string, y: string) => void;
  onImageUpload?: (compressedImage: string, originalFile: File) => void;
  onAnalyzeBoard?: () => void;
  editingNetId?: string | null;
  className?: string;
}

// ==========================================
// Main Component
// ==========================================

export function HardwareBoardViewer({
  boardName,
  customImageUrl = null,
  nets = {},
  components = {},
  suspiciousMarkers = [],
  onNetSelect,
  onComponentSelect,
  onAddNetPoint,
  onImageUpload,
  onAnalyzeBoard,
  editingNetId = null,
  className = '',
}: BoardViewerProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeNet, setActiveNet] = useState<string | null>(null);
  const [activeComponent, setActiveComponent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NetTrace[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showComponentPanel, setShowComponentPanel] = useState(false);
  const [componentSearchQuery, setComponentSearchQuery] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // New state for drag & drop and image analysis
  const [isDragging, setIsDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [resolutionWarning, setResolutionWarning] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [compressedImage, setCompressedImage] = useState<string | null>(null);

  // Fetch board image on mount (or use custom image)
  useEffect(() => {
    if (customImageUrl) {
      setImageUrl(customImageUrl);
      setLoading(false);
      setError(null);
    } else {
      fetchBoardImage();
    }
  }, [boardName, customImageUrl]);

  // Search nets when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = Object.values(nets).filter((net) =>
        net.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, nets]);

  const fetchBoardImage = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/get-board', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ boardName }),
      });

      const data = await response.json();

      if (!data.success) {
        // If API fails, show friendly error and suggest uploading custom image
        throw new Error(data.error || 'Failed to fetch board image. Please upload a custom image.');
      }

      setImageUrl(data.imageUrl);
    } catch (err: any) {
      console.error('Error fetching board image:', err);
      setError(err.message || 'Failed to load board image. Please upload a custom image using the button above.');
    } finally {
      setLoading(false);
    }
  };

  const handleNetClick = (net: NetTrace) => {
    setActiveNet(net.id);
    setActiveComponent(null); // Clear component selection when net is selected
    if (onNetSelect) {
      onNetSelect(net);
    }
  };

  const handleComponentClick = (component: Component) => {
    setActiveComponent(component.id);
    setActiveNet(null); // Clear net selection when component is selected
    if (onComponentSelect) {
      onComponentSelect(component);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only handle click if we're editing a net
    if (!editingNetId || !onAddNetPoint) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Clamp values to ensure they stay within 0-100%
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    onAddNetPoint(editingNetId, `${clampedX.toFixed(2)}%`, `${clampedY.toFixed(2)}%`);
  };

  const handleSearchResultClick = (net: NetTrace) => {
    setActiveNet(net.id);
    setSearchQuery('');
    if (onNetSelect) {
      onNetSelect(net);
    }
  };

  const handleDownload = () => {
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `${boardName.replace(/\s+/g, '_')}_board.jpg`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleRefresh = () => {
    fetchBoardImage();
  };

  // Component type helpers
  const getComponentIcon = (type: Component['type']) => {
    switch (type) {
      case 'IC': return <Cpu className="w-4 h-4" />;
      case 'Capacitor': return <Zap className="w-4 h-4" />;
      case 'Resistor': return <MapPin className="w-4 h-4" />;
      case 'Inductor': return <CircuitBoard className="w-4 h-4" />;
      default: return <Dot className="w-4 h-4" />;
    }
  };

  const getComponentColor = (type: Component['type']) => {
    switch (type) {
      case 'IC': return '#3b82f6'; // Blue
      case 'Capacitor': return '#10b981'; // Green
      case 'Resistor': return '#f59e0b'; // Orange
      case 'Inductor': return '#8b5cf6'; // Purple
      case 'Connector': return '#ef4444'; // Red
      case 'Diode': return '#ec4899'; // Pink
      case 'Transistor': return '#06b6d4'; // Cyan
      default: return '#64748b'; // Gray
    }
  };

  const filteredComponents = Object.values(components).filter(comp =>
    comp.name.toLowerCase().includes(componentSearchQuery.toLowerCase()) ||
    comp.description?.toLowerCase().includes(componentSearchQuery.toLowerCase())
  );

  const handleUploadCustomImage = async () => {
    if (!uploadUrl.trim()) {
      alert('Please enter a valid image URL');
      return;
    }

    try {
      setUploading(true);
      const response = await fetch('/api/upload-board-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          boardName,
          imageUrl: uploadUrl,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setImageUrl(uploadUrl);
        setShowUploadModal(false);
        setUploadUrl('');
        setError(null);
      } else {
        alert('Failed to upload image: ' + data.error);
      }
    } catch (err: any) {
      alert('Failed to upload image: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // ==========================================
  // Image Compression & Resolution Check
  // ==========================================

  const checkImageResolution = (width: number, height: number): string | null => {
    const MIN_WIDTH = 1280;
    const MIN_HEIGHT = 720;

    if (width < MIN_WIDTH || height < MIN_HEIGHT) {
      return 'دقة الصورة منخفضة، قد تكون التفاصيل غير واضحة عند التكبير';
    }
    return null;
  };

  const compressImage = useCallback(async (file: File): Promise<{ compressed: string; dimensions: { width: number; height: number } }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Calculate dimensions (max 2048px)
          const MAX_SIZE = 2048;
          let width = img.width;
          let height = img.height;

          if (width > MAX_SIZE || height > MAX_SIZE) {
            if (width > height) {
              height = (height * MAX_SIZE) / width;
              width = MAX_SIZE;
            } else {
              width = (width * MAX_SIZE) / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress (85% quality)
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

          resolve({
            compressed: compressedDataUrl,
            dimensions: { width: Math.round(width), height: Math.round(height) },
          });
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }, []);

  const handleFileSelect = async (file: File) => {
    if (!file.type.match(/image\/(jpeg|png|webp)/)) {
      alert('يرجى رفع صورة بصيغة JPG, PNG, أو WEBP فقط');
      return;
    }

    try {
      setUploading(true);
      const { compressed, dimensions } = await compressImage(file);

      // Check resolution
      const warning = checkImageResolution(dimensions.width, dimensions.height);
      setResolutionWarning(warning);
      setImageDimensions(dimensions);

      // Set preview and compressed image
      setPreviewImage(compressed);
      setCompressedImage(compressed);
      setOriginalFile(file);
    } catch (err: any) {
      alert('فشل معالجة الصورة: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      await handleFileSelect(file);
    }
  };

  const handleStartAnalysis = () => {
    if (compressedImage && originalFile) {
      // Use compressed image
      setImageUrl(compressedImage);
      setPreviewImage(null);
      setResolutionWarning(null);

      // Call parent callback if provided
      if (onImageUpload) {
        onImageUpload(compressedImage, originalFile);
      }

      // Trigger AI analysis if provided
      if (onAnalyzeBoard) {
        onAnalyzeBoard();
      }
    }
  };

  const handleCancelPreview = () => {
    setPreviewImage(null);
    setCompressedImage(null);
    setResolutionWarning(null);
    setImageDimensions(null);
    setOriginalFile(null);
  };

  // ==========================================
  // Render
  // ==========================================

  return (
    <div className={`relative w-full h-full bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 ${className}`} dir="rtl">
      {/* Top Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex gap-2" dir="ltr">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search nets (e.g., PP_VDD_MAIN)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowComponentPanel(!showComponentPanel)}
          className={`px-4 py-2.5 border rounded-lg text-white transition-all text-sm font-medium shadow-lg ${
            showComponentPanel
              ? 'bg-blue-600 border-blue-500'
              : 'bg-gray-800/90 backdrop-blur-sm border-gray-700 hover:bg-gray-700'
          }`}
          title="Toggle Component Panel"
        >
          <CircuitBoard className="w-4 h-4 inline mr-1" />
          Components
        </button>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2.5 bg-emerald-600/90 backdrop-blur-sm border border-emerald-500 rounded-lg text-white hover:bg-emerald-700 transition-colors text-sm font-medium shadow-lg"
          title="Upload custom image"
        >
          Upload Image
        </button>

        <button
          onClick={handleRefresh}
          className="p-2.5 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors shadow-lg"
          title="Refresh image"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <button
          onClick={handleDownload}
          className="p-2.5 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors shadow-lg"
          title="Download image"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* Search Results Dropdown */}
      {searchResults.length > 0 && (
        <div className="absolute top-16 left-4 right-4 z-20 max-w-md bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {searchResults.map((net) => (
            <button
              key={net.id}
              onClick={() => handleSearchResultClick(net)}
              className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: net.color }}
                />
                <span className="font-medium">{net.name}</span>
              </div>
              {net.description && (
                <p className="text-sm text-gray-400 mt-1">{net.description}</p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-2xl w-full mx-4 shadow-2xl" dir="rtl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">رفع صورة البورد</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drag & Drop Zone */}
            {!previewImage ? (
              <div
                ref={dropZoneRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-600 bg-gray-700/30 hover:border-gray-500 hover:bg-gray-700/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
                <div className="text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-white text-lg font-medium mb-2">
                    ارفع صورة واضحة للبورد من أعلى
                  </p>
                  <p className="text-gray-400 text-sm mb-4">
                    (يفضل بدون وميض)
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all font-medium"
                  >
                    اختر صورة
                  </button>
                  <p className="text-gray-500 text-xs mt-4">
                    الصيغ المدعومة: JPG, PNG, WEBP
                  </p>
                </div>
              </div>
            ) : (
              /* Preview Mode */
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden bg-gray-900">
                  <img
                    src={previewImage}
                    alt="معاينة الصورة"
                    className="w-full h-64 object-contain"
                  />
                  {resolutionWarning && (
                    <div className="absolute top-2 right-2 bg-yellow-500/90 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      {resolutionWarning}
                    </div>
                  )}
                  {imageDimensions && !resolutionWarning && (
                    <div className="absolute top-2 right-2 bg-green-500/90 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      {imageDimensions.width} × {imageDimensions.height}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleStartAnalysis}
                    disabled={uploading}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        جاري المعالجة...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        تشغيل الفحص والتحليل
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancelPreview}
                    className="px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            {/* URL Upload (Fallback) */}
            {!previewImage && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <label className="block text-gray-300 text-sm mb-2">
                  أو أدخل رابط الصورة مباشرة
                </label>
                <input
                  type="text"
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  placeholder="https://example.com/board-image.jpg"
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleUploadCustomImage}
                  disabled={uploading}
                  className="w-full mt-3 px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {uploading ? 'جاري الرفع...' : 'رفع من الرابط'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Component Panel Sidebar */}
      {showComponentPanel && (
        <div className="absolute top-20 right-4 z-20 w-80 bg-gray-800/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl max-h-[calc(100vh-6rem)] overflow-hidden">
          <div className="p-4 border-b border-gray-700/50 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <CircuitBoard className="w-4 h-4 text-blue-400" />
                Components
              </h3>
              <button
                onClick={() => setShowComponentPanel(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search components..."
                value={componentSearchQuery}
                onChange={(e) => setComponentSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700/50 backdrop-blur-sm border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
              />
              {componentSearchQuery && (
                <button
                  onClick={() => setComponentSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          <div className="p-4 overflow-y-auto max-h-[calc(100vh-10rem)] space-y-2">
            {filteredComponents.length === 0 ? (
              <p className="text-gray-400 text-center py-4 text-sm">No components found</p>
            ) : (
              filteredComponents.map((comp) => (
                <div
                  key={comp.id}
                  onClick={() => handleComponentClick(comp)}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    activeComponent === comp.id
                      ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 border-2 border-blue-500 shadow-lg shadow-blue-500/20'
                      : 'bg-gray-700/50 border-2 border-transparent hover:bg-gray-700/70 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="p-1.5 rounded-lg"
                      style={{ backgroundColor: getComponentColor(comp.type) + '20' }}
                    >
                      <div style={{ color: getComponentColor(comp.type) }}>
                        {getComponentIcon(comp.type)}
                      </div>
                    </div>
                    <span className="font-medium text-white text-sm">{comp.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="px-2 py-0.5 rounded-full bg-gray-600/50 border border-gray-500">{comp.type}</span>
                    {comp.connectedNets && comp.connectedNets.length > 0 && (
                      <span className="text-blue-400">{comp.connectedNets.length} nets</span>
                    )}
                  </div>
                  {comp.description && (
                    <p className="text-xs text-gray-400 mt-1">{comp.description}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-white text-lg">Loading board image...</p>
            <p className="text-gray-400 text-sm mt-2">
              {boardName}
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="text-center max-w-md px-4">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-white text-lg mb-2">Failed to load board image</p>
            <p className="text-gray-400 text-sm mb-4">{error}</p>
            <p className="text-gray-500 text-xs mb-4">
              Tip: Upload a custom board image using the "Upload Image" button above
            </p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Main Viewer */}
      {!loading && !error && imageUrl && (
        <TransformWrapper
          initialScale={1}
          minScale={0.1}
          maxScale={10}
          wheel={{ step: 0.1 }}
          doubleClick={{ step: 0.5 }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              {/* Zoom Controls */}
              <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
                <button
                  onClick={() => zoomIn()}
                  className="p-2.5 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors shadow-lg"
                  title="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => zoomOut()}
                  className="p-2.5 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors shadow-lg"
                  title="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => resetTransform()}
                  className="p-2.5 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors shadow-lg"
                  title="Reset view"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>

              {/* Image and SVG Overlay */}
              <TransformComponent
                wrapperStyle={{
                  width: '100%',
                  height: '100%',
                }}
                contentStyle={{
                  width: '100%',
                  height: '100%',
                }}
              >
                <div
                  className="relative w-full h-full flex items-center justify-center"
                  onClick={handleImageClick}
                  style={{ cursor: editingNetId ? 'crosshair' : 'default' }}
                >
                  {/* Board Image Container */}
                  <div className="relative inline-block max-w-full max-h-full">
                    <img
                      ref={imageRef}
                      src={imageUrl}
                      alt={`${boardName} board`}
                      className="max-w-full max-h-full object-contain"
                      draggable={false}
                    />

                    {/* SVG Overlay with Percentage Coordinates */}
                    <svg
                      ref={svgRef}
                      className="absolute top-0 left-0 w-full h-full pointer-events-none"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      style={{ mixBlendMode: 'multiply' }}
                    >
                    {/* AI Suspicious Markers */}
                    {suspiciousMarkers.map((marker) => {
                      // Handle both string (e.g., "35%") and number (e.g., 35) values
                      const xVal = typeof marker.x === 'string' ? parseFloat(marker.x.replace('%', '')) : marker.x;
                      const yVal = typeof marker.y === 'string' ? parseFloat(marker.y.replace('%', '')) : marker.y;
                      const severityColor = marker.severity === 'high' ? '#ef4444' : marker.severity === 'medium' ? '#f97316' : '#eab308';

                      return (
                        <g key={marker.id}>
                          {/* Bounding Box */}
                          <rect
                            x={xVal - 1.5}
                            y={yVal - 1.5}
                            width="3"
                            height="3"
                            fill="none"
                            stroke={severityColor}
                            strokeWidth="0.5"
                            strokeDasharray="0.5 0.5"
                            className="animate-pulse"
                            style={{
                              filter: `drop-shadow(0 0 4px ${severityColor})`,
                            }}
                          />

                          {/* Glowing Marker Badge */}
                          <circle
                            cx={xVal}
                            cy={yVal}
                            r="1.2"
                            fill={severityColor}
                            className="animate-pulse"
                            style={{
                              filter: `drop-shadow(0 0 6px ${severityColor})`,
                            }}
                          />

                          {/* Number Badge */}
                          <circle
                            cx={xVal + 1.5}
                            cy={yVal - 1.5}
                            r="0.8"
                            fill={severityColor}
                            stroke="white"
                            strokeWidth="0.2"
                            style={{
                              filter: `drop-shadow(0 0 4px ${severityColor})`,
                            }}
                          />
                          <text
                            x={xVal + 1.5}
                            y={yVal - 1.5}
                            dy="0.3"
                            fill="white"
                            fontSize="0.7"
                            fontWeight="bold"
                            textAnchor="middle"
                            className="pointer-events-none"
                          >
                            {marker.id}
                          </text>

                          {/* Tooltip/Label */}
                          <g>
                            <rect
                              x={xVal + 2}
                              y={yVal - 2.5}
                              width="8"
                              height="3"
                              fill="rgba(0, 0, 0, 0.8)"
                              rx="0.3"
                              stroke={severityColor}
                              strokeWidth="0.2"
                            />
                            <text
                              x={xVal + 2.5}
                              y={yVal - 1.8}
                              fill={severityColor}
                              fontSize="0.6"
                              fontWeight="bold"
                              className="pointer-events-none"
                            >
                              {marker.label}
                            </text>
                            <text
                              x={xVal + 2.5}
                              y={yVal - 0.8}
                              fill="white"
                              fontSize="0.5"
                              className="pointer-events-none"
                            >
                              {marker.note}
                            </text>
                          </g>
                        </g>
                      );
                    })}

                    {/* Component Markers */}
                    {Object.values(components).map((comp) => {
                      // Handle both string (e.g., "35%") and number (e.g., 35) values
                      const xVal = typeof comp.x === 'string' ? parseFloat(comp.x.replace('%', '')) : comp.x;
                      const yVal = typeof comp.y === 'string' ? parseFloat(comp.y.replace('%', '')) : comp.y;
                      return (
                        <g key={comp.id}>
                          {/* Component Box */}
                          <rect
                            x={xVal}
                            y={yVal}
                            width="3"
                            height="3"
                            fill={getComponentColor(comp.type)}
                            fillOpacity={activeComponent === comp.id ? '0.8' : '0.4'}
                            stroke={getComponentColor(comp.type)}
                            strokeWidth={activeComponent === comp.id ? '2' : '1'}
                            className={`transition-all duration-300 cursor-pointer ${
                              activeComponent === comp.id ? 'opacity-100' : 'opacity-70'
                            }`}
                            style={{ pointerEvents: 'auto' }}
                            onClick={() => handleComponentClick(comp)}
                          />
                          {/* Component Label */}
                          <text
                            x={xVal}
                            y={yVal}
                            dy="-0.5"
                            fill="white"
                            fontSize="0.7"
                            className={`pointer-events-none ${
                              activeComponent === comp.id ? 'font-bold' : ''
                            }`}
                          >
                            {comp.name}
                          </text>
                        </g>
                      );
                    })}

                    {/* Net Traces */}
                    {Object.values(nets).map((net) => (
                      <g key={net.id}>
                        {/* Net Trace Lines */}
                        {net.points.length > 1 && (
                          <polyline
                            points={net.points
                              .map((p) => {
                                // Handle both string (e.g., "35%") and number (e.g., 35) values
                                const xVal = typeof p.x === 'string' ? parseFloat(p.x.replace('%', '')) : p.x;
                                const yVal = typeof p.y === 'string' ? parseFloat(p.y.replace('%', '')) : p.y;
                                return `${xVal} ${yVal}`;
                              })
                              .join(' ')}
                            fill="none"
                            stroke={net.color}
                            strokeWidth={activeNet === net.id ? '3' : '2'}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`transition-all duration-300 ${
                              activeNet === net.id
                                ? 'opacity-100 drop-shadow-lg'
                                : 'opacity-60'
                            }`}
                            style={{
                              filter: activeNet === net.id
                                ? 'drop-shadow(0 0 8px ' + net.color + ')'
                                : 'none',
                            }}
                          />
                        )}

                        {/* Net Points (for single-point nets or endpoints) */}
                        {net.points.map((point, idx) => {
                          // Handle both string (e.g., "35%") and number (e.g., 35) values
                          const xVal = typeof point.x === 'string' ? parseFloat(point.x.replace('%', '')) : point.x;
                          const yVal = typeof point.y === 'string' ? parseFloat(point.y.replace('%', '')) : point.y;
                          return (
                            <circle
                              key={`${net.id}-point-${idx}`}
                              cx={xVal}
                              cy={yVal}
                              r={activeNet === net.id ? '6' : '4'}
                              fill={net.color}
                              className={`transition-all duration-300 cursor-pointer ${
                                activeNet === net.id
                                  ? 'opacity-100'
                                  : 'opacity-60'
                              }`}
                              style={{ pointerEvents: 'auto' }}
                              onClick={() => handleNetClick(net)}
                            />
                          );
                        })}
                      </g>
                    ))}
                  </svg>
                  </div>
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      )}

      {/* Active Net Info Panel */}
      {activeNet && nets[activeNet] && (
        <div className="absolute bottom-4 left-4 z-20 bg-gray-800/95 backdrop-blur-sm border border-gray-700 rounded-xl p-4 max-w-sm shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: nets[activeNet].color }}
              />
              <span className="text-white font-semibold">
                {nets[activeNet].name}
              </span>
            </div>
            <button
              onClick={() => setActiveNet(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {nets[activeNet].description && (
            <p className="text-gray-400 text-sm mb-2">
              {nets[activeNet].description}
            </p>
          )}
          {nets[activeNet].components && nets[activeNet].components.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-xs text-gray-500 mb-2">Connected Components:</p>
              <div className="flex flex-wrap gap-1">
                {nets[activeNet].components.map((comp) => (
                  <span
                    key={comp.id}
                    className="px-2 py-1 bg-gray-700 rounded text-xs text-white"
                  >
                    {comp.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Component Info Panel */}
      {activeComponent && components[activeComponent] && (
        <div className="absolute bottom-4 left-4 z-20 bg-gray-800/95 backdrop-blur-sm border border-gray-700 rounded-xl p-4 max-w-sm shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="p-1.5 rounded-md"
                style={{ backgroundColor: getComponentColor(components[activeComponent].type) + '20' }}
              >
                <div style={{ color: getComponentColor(components[activeComponent].type) }}>
                  {getComponentIcon(components[activeComponent].type)}
                </div>
              </div>
              <div>
                <span className="text-white font-semibold block">
                  {components[activeComponent].name}
                </span>
                <span className="text-xs text-gray-400">{components[activeComponent].type}</span>
              </div>
            </div>
            <button
              onClick={() => setActiveComponent(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {components[activeComponent].description && (
            <p className="text-gray-400 text-sm mb-2">
              {components[activeComponent].description}
            </p>
          )}
          {components[activeComponent].connectedNets && components[activeComponent].connectedNets.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-xs text-gray-500 mb-2">Connected Nets:</p>
              <div className="flex flex-wrap gap-1">
                {components[activeComponent].connectedNets.map((netId) => {
                  const net = nets[netId];
                  return net ? (
                    <span
                      key={netId}
                      className="px-2 py-1 rounded text-xs text-white"
                      style={{ backgroundColor: net.color + '40', border: `1px solid ${net.color}` }}
                    >
                      {net.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// Example Usage
// ==========================================

/*
import { HardwareBoardViewer } from '@/components/HardwareBoardViewer';

const exampleNets = {
  net_vdd_main: {
    id: 'net_vdd_main',
    name: 'PP_VDD_MAIN',
    color: '#f59e0b',
    points: [
      { x: '25%', y: '40%' },
      { x: '35%', y: '40%' },
      { x: '45%', y: '45%' },
      { x: '55%', y: '45%' },
    ],
    description: 'Main power rail (3.7V - 4.2V)',
  },
  net_gnd: {
    id: 'net_gnd',
    name: 'GND',
    color: '#64748b',
    points: [
      { x: '20%', y: '60%' },
      { x: '30%', y: '60%' },
      { x: '40%', y: '65%' },
    ],
    description: 'Ground plane',
  },
};

function MyPage() {
  return (
    <div className="w-full h-screen">
      <HardwareBoardViewer
        boardName="iPhone 15 Pro Max Logic Board"
        nets={exampleNets}
        onNetSelect={(net) => console.log('Selected net:', net)}
      />
    </div>
  );
}
*/
