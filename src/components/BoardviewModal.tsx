'use client';

import React, { useEffect, useState } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import PixiBoardview from './PixiBoardview';
import { ParsedBoardData } from '@/lib/boardviewParser';

interface BoardviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardData: ParsedBoardData | null;
  title: string;
}

export default function BoardviewModal({
  isOpen,
  onClose,
  boardData,
  title,
}: BoardviewModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div
        className={`relative bg-gray-900 rounded-2xl overflow-hidden shadow-2xl ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-[95vw] h-[90vh]'
        }`}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gray-800/90 backdrop-blur-md border-b border-gray-700 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <p className="text-sm text-gray-400">
              {boardData?.deviceModel || 'Unknown Model'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition"
              title={isFullscreen ? 'تصغير' : 'تكبير'}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Boardview Content */}
        <div className="w-full h-full pt-16">
          {boardData ? (
            <PixiBoardview
              boardData={boardData}
              width={isFullscreen ? window.innerWidth : window.innerWidth * 0.95}
              height={isFullscreen ? window.innerHeight : window.innerHeight * 0.9}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>No board data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
