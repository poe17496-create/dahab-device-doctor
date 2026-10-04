'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Upload,
  Search,
  X,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Layers,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import PixiBoardview from './PixiBoardview';
import {
  parseBoardviewFile,
  ParsedBoardData,
  ParsedBoardPart,
  ParsedBoardPin,
  convertBoardDataToParsed,
} from '@/lib/boardviewParser';

interface PixiBoardviewViewerProps {
  width?: number;
  height?: number;
  initialBoardData?: ParsedBoardData | null;
}

export default function PixiBoardviewViewer({
  width = 1200,
  height = 800,
  initialBoardData = null,
}: PixiBoardviewViewerProps) {
  const [boardData, setBoardData] = useState<ParsedBoardData | null>(initialBoardData);
  const [highlightedNetId, setHighlightedNetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPart, setSelectedPart] = useState<ParsedBoardPart | null>(null);
  const [selectedPin, setSelectedPin] = useState<ParsedBoardPin | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Update board data when initialBoardData changes (use ID to detect actual board change)
  useEffect(() => {
    if (initialBoardData && initialBoardData.id !== boardData?.id) {
      setBoardData(initialBoardData);
      setSelectedPart(null);
      setSelectedPin(null);
      setHighlightedNetId(null);
      setSearchQuery('');
    }
  }, [initialBoardData?.id]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const parsedData = await parseBoardviewFile(file);
      setBoardData(parsedData);
      console.log('Board loaded successfully:', parsedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse board file';
      setError(errorMessage);
      console.error('Error parsing board file:', err);
    } finally {
      setIsLoading(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleSearch = useCallback(() => {
    if (!boardData || !searchQuery.trim()) {
      setHighlightedNetId(null);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    
    // Search for matching net
    const matchingNet = Object.values(boardData.nets).find(
      net => net.name.toLowerCase().includes(query) || net.id.toLowerCase().includes(query)
    );

    if (matchingNet) {
      setHighlightedNetId(matchingNet.id);
      console.log('Found net:', matchingNet.name);
    } else {
      // Search for matching part
      const matchingPart = boardData.parts.find(
        part => part.name.toLowerCase().includes(query) || part.id.toLowerCase().includes(query)
      );

      if (matchingPart) {
        setSelectedPart(matchingPart);
        setHighlightedNetId(null);
        console.log('Found part:', matchingPart.name);
      } else {
        setHighlightedNetId(null);
        setSelectedPart(null);
        console.log('No match found for:', query);
      }
    }
  }, [boardData, searchQuery]);

  const handlePartClick = useCallback((part: ParsedBoardPart) => {
    setSelectedPart(part);
    setSelectedPin(null);
  }, []);

  const handlePinClick = useCallback((pin: ParsedBoardPin) => {
    setSelectedPin(pin);
    if (boardData) {
      const net = boardData.nets[pin.netId];
      console.log('Pin clicked:', pin, 'Net:', net);
    }
  }, [boardData]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setHighlightedNetId(null);
    setSelectedPart(null);
    setSelectedPin(null);
  }, []);

  const handleResetView = useCallback(() => {
    setHighlightedNetId(null);
    setSelectedPart(null);
    setSelectedPin(null);
    setSearchQuery('');
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header / Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Layers className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-bold text-white">Boardview Viewer</h1>
            {boardData && (
              <span className="text-sm text-gray-400">
                - {boardData.title} ({boardData.deviceModel})
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>رفع ملف BRD / FZ</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".brd,.fz,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            {boardData && (
              <button
                onClick={handleResetView}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        {boardData && (
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search for nets (e.g., PP_VDD_MAIN) or components (e.g., U3100)..."
                className="w-full pl-10 pr-10 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Search
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-10">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-2" />
              <p className="text-white">Loading board data...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <div className="text-center max-w-md">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 text-lg mb-2">Error Loading File</p>
              <p className="text-gray-400 text-sm mb-4">{error}</p>
              <button
                onClick={() => setError(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {!boardData && !isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center max-w-lg">
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload className="w-12 h-12 text-gray-600" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Upload Boardview File</h2>
              <p className="text-gray-400 mb-6">
                Upload a .brd, .fz, or .json file to view the physical PCB layout with WebGL-accelerated rendering.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Select File
              </button>
              <p className="text-gray-500 text-sm mt-4">
                Supported formats: .brd (Binary), .fz (OpenBoardView), .json (PCB JSON)
              </p>
            </div>
          </div>
        )}

        {boardData && (
          <PixiBoardview
            boardData={boardData}
            highlightedNetId={highlightedNetId}
            onPartClick={handlePartClick}
            onPinClick={handlePinClick}
            width={width}
            height={height}
          />
        )}
      </div>

      {/* Selected Pin Info Panel */}
      {selectedPin && boardData && (
        <div className="absolute bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-sm border border-gray-700">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-lg">Pin Details</h3>
            <button
              onClick={() => setSelectedPin(null)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-sm space-y-1">
            <p><span className="text-gray-400">Pin:</span> {selectedPin.pinNumber}</p>
            <p><span className="text-gray-400">Part:</span> {selectedPin.partId}</p>
            <p><span className="text-gray-400">Net:</span> {boardData.nets[selectedPin.netId]?.name || selectedPin.netId}</p>
            <p><span className="text-gray-400">Voltage:</span> {boardData.nets[selectedPin.netId]?.voltage || 'N/A'}</p>
            <p><span className="text-gray-400">Diode Mode:</span> {boardData.nets[selectedPin.netId]?.diodeMode || 'N/A'}</p>
            {selectedPin.diodeValue && (
              <p><span className="text-gray-400">Measured:</span> {selectedPin.diodeValue}</p>
            )}
          </div>
        </div>
      )}

      {/* Stats Panel */}
      {boardData && (
        <div className="absolute top-4 left-4 bg-gray-800 text-white p-3 rounded-lg shadow-lg border border-gray-700">
          <div className="flex items-center space-x-2 text-sm">
            <Info className="w-4 h-4 text-blue-400" />
            <div className="space-y-1">
              <p><span className="text-gray-400">Parts:</span> {boardData.parts.length}</p>
              <p><span className="text-gray-400">Nets:</span> {Object.keys(boardData.nets).length}</p>
              <p><span className="text-gray-400">Total Pins:</span> {boardData.parts.reduce((sum, part) => sum + part.pins.length, 0)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
