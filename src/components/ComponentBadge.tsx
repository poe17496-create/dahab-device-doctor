'use client';

import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';

interface ComponentBadgeProps {
  name: string;
  type: 'ic' | 'capacitor' | 'resistor' | 'trace';
  onClick?: () => void;
  onHover?: () => void;
  onLeave?: () => void;
  isHighlighted?: boolean;
}

export default function ComponentBadge({
  name,
  type,
  onClick,
  onHover,
  onLeave,
  isHighlighted = false,
}: ComponentBadgeProps) {
  const getTypeColor = () => {
    switch (type) {
      case 'ic':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700';
      case 'capacitor':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700';
      case 'resistor':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700';
      case 'trace':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'ic':
        return '🔲';
      case 'capacitor':
        return '⚡';
      case 'resistor':
        return '📏';
      case 'trace':
        return '🔗';
      default:
        return '📍';
    }
  };

  return (
    <span
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border cursor-pointer transition-all ${
        isHighlighted
          ? 'ring-2 ring-dahab-500 scale-105'
          : 'hover:scale-105'
      } ${getTypeColor()}`}
      title={`انقر لإضاءة ${name} على الصورة`}
    >
      <span>{getTypeIcon()}</span>
      <span>{name}</span>
      {isHighlighted && <Info className="w-3 h-3 animate-pulse" />}
    </span>
  );
}
