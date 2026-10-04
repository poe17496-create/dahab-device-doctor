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
  onPartClick?: (part: ParsedBoardPart) => void;
  onPinClick?: (pin: ParsedBoardPin) => void;
}

export default function PixiBoardviewViewer({
  width = 1200,
  height = 800,
  initialBoardData = null,
  selectedNetId,
  onPartClick,
  onPinClick,
}: PixiBoardviewViewerProps) {
  const [boardData, setBoardData] = useState<ParsedBoardData | null>(initialBoardData);
  const [highlightedNetId, setHighlightedNetId] = useState<string | null>(selectedNetId || null);

  // Update board data when initialBoardData changes (use ID to detect actual board change)
  useEffect(() => {
    if (initialBoardData && initialBoardData.id !== boardData?.id) {
      setBoardData(initialBoardData);
      setHighlightedNetId(selectedNetId || null);
    }
  }, [initialBoardData?.id, selectedNetId]);

  // Update highlighted net when selectedNetId changes
  useEffect(() => {
    setHighlightedNetId(selectedNetId || null);
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

  return (
    <div className="w-full h-full relative overflow-hidden">
      <PixiBoardview
        boardData={boardData}
        highlightedNetId={highlightedNetId}
        onPartClick={handlePartClick}
        onPinClick={handlePinClick}
        width={width}
        height={height}
      />
    </div>
  );
}
