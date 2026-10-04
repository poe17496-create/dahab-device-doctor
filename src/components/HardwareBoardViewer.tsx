'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Search, ZoomIn, ZoomOut, RotateCw, Download, X, Loader2 } from 'lucide-react';

/**
 * Hardware Board Viewer - Image Overlay System
 *
 * Features:
 * - Auto-fetches and caches board images via API
 * - Smooth zooming and panning with react-zoom-pan-pinch
 * - Percentage-based SVG overlay for nets/traces
 * - Net search functionality
 * - No PixiJS or Konva dependencies
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
}

export interface BoardViewerProps {
  boardName: string;
  customImageUrl?: string | null;
  nets?: Record<string, NetTrace>;
  onNetSelect?: (net: NetTrace) => void;
  className?: string;
}

// ==========================================
// Main Component
// ==========================================

export function HardwareBoardViewer({
  boardName,
  customImageUrl = null,
  nets = {},
  onNetSelect,
  className = '',
}: BoardViewerProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeNet, setActiveNet] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NetTrace[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

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
    if (onNetSelect) {
      onNetSelect(net);
    }
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
  // Render
  // ==========================================

  return (
    <div className={`relative w-full h-full bg-gray-900 ${className}`}>
      {/* Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search nets (e.g., PP_VDD_MAIN)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 bg-green-600 border border-green-700 rounded-lg text-white hover:bg-green-700 transition-colors text-sm font-medium"
          title="Upload custom image"
        >
          Upload Image
        </button>

        <button
          onClick={handleRefresh}
          className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors"
          title="Refresh image"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <button
          onClick={handleDownload}
          className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors"
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
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-medium">Upload Custom Board Image</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-gray-300 text-sm mb-2">
                Image URL
              </label>
              <input
                type="text"
                value={uploadUrl}
                onChange={(e) => setUploadUrl(e.target.value)}
                placeholder="https://example.com/board-image.jpg"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-gray-400 text-xs mt-2">
                Enter a direct URL to a high-resolution board image
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleUploadCustomImage}
                disabled={uploading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
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
                  className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors"
                  title="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => zoomOut()}
                  className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors"
                  title="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => resetTransform()}
                  className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors"
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
                <div className="relative w-full h-full">
                  {/* Board Image */}
                  <img
                    src={imageUrl}
                    alt={`${boardName} board`}
                    className="w-full h-full object-contain"
                    draggable={false}
                  />

                  {/* SVG Overlay with Percentage Coordinates */}
                  <svg
                    ref={svgRef}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ mixBlendMode: 'multiply' }}
                  >
                    {Object.values(nets).map((net) => (
                      <g key={net.id}>
                        {/* Net Trace Lines */}
                        {net.points.length > 1 && (
                          <polyline
                            points={net.points
                              .map((p) => `${p.x} ${p.y}`)
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
                        {net.points.map((point, idx) => (
                          <circle
                            key={`${net.id}-point-${idx}`}
                            cx={point.x}
                            cy={point.y}
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
                        ))}
                      </g>
                    ))}
                  </svg>
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      )}

      {/* Active Net Info Panel */}
      {activeNet && nets[activeNet] && (
        <div className="absolute bottom-4 left-4 z-20 bg-gray-800 border border-gray-700 rounded-lg p-4 max-w-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: nets[activeNet].color }}
              />
              <span className="text-white font-medium">
                {nets[activeNet].name}
              </span>
            </div>
            <button
              onClick={() => setActiveNet(null)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {nets[activeNet].description && (
            <p className="text-gray-400 text-sm">
              {nets[activeNet].description}
            </p>
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
