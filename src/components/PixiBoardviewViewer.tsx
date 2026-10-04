'use client';

import React, { useState, useCallback, useEffect } from 'react';
import PixiBoardview from './PixiBoardview';
import {
  ParsedBoardData,
  ParsedBoardPart,
  ParsedBoardPin,
} from '@/lib/boardviewParser';

interface PixiBoardviewViewerProps {
  width?: number;
  height?: number;
  initialBoardData?: ParsedBoardData | null;
  selectedNetId?: string;
  selectedSide?: 'TOP' | 'BOTTOM';
  onPartClick?: (part: ParsedBoardPart) => void;
  onPinClick?: (pin: ParsedBoardPin) => void;
}

export default function PixiBoardviewViewer({
  width = 1200,
  height = 800,
  initialBoardData = null,
  selectedNetId,
  selectedSide = 'TOP',
  onPartClick,
  onPinClick,
}: PixiBoardviewViewerProps) {
  const [boardData, setBoardData] = useState<ParsedBoardData | null>(initialBoardData);
  const [highlightedNetId, setHighlightedNetId] = useState<string | null>(selectedNetId || null);

  // Update board data when initialBoardData changes (use ID to detect actual board change)
  useEffect(() => {
    if (initialBoardData) {
      setBoardData(initialBoardData);
    }
  }, [initialBoardData?.id, initialBoardData]);

  // Update highlighted net when selectedNetId changes
  useEffect(() => {
    if (selectedNetId !== undefined) {
      setHighlightedNetId(selectedNetId || null);
    }
  }, [selectedNetId]);

  const handlePartClick = useCallback((part: ParsedBoardPart) => {
    onPartClick?.(part);
  }, [onPartClick]);

  const handlePinClick = useCallback((pin: ParsedBoardPin) => {
    onPinClick?.(pin);
  }, [onPinClick]);

  // محرك عرض WebGL فقط - بدون أي واجهة UI
  if (!boardData) {
    return null;
  }

  // محرك عرض WebGL فقط - بدون أي واجهة UI
  if (!boardData) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-400">
        <div className="text-center">
          <p className="text-lg mb-2">No board data loaded</p>
          <p className="text-sm">Select a board from the dropdown to view it</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-gray-900">
      <PixiBoardview
        boardData={boardData}
        highlightedNetId={highlightedNetId}
        selectedSide={selectedSide}
        onPartClick={handlePartClick}
        onPinClick={handlePinClick}
        width={width}
        height={height}
      />
    </div>
  );
}
