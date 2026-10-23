'use client';

import React from 'react';
import { Info } from 'lucide-react';

export type ComponentType =
  | 'ic'
  | 'capacitor'
  | 'resistor'
  | 'trace'
  | 'mosfet'
  | 'coil'
  | 'diode'
  | 'crystal';

interface ComponentBadgeProps {
  name: string;
  type: ComponentType;
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
        return 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700/70 hover:bg-purple-200 dark:hover:bg-purple-900/60';
      case 'capacitor':
        return 'bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-700/70 hover:bg-sky-200 dark:hover:bg-sky-900/60';
      case 'resistor':
        return 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/70 hover:bg-amber-200 dark:hover:bg-amber-900/60';
      case 'mosfet':
        return 'bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-700/70 hover:bg-teal-200 dark:hover:bg-teal-900/60';
      case 'coil':
        return 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700/70 hover:bg-indigo-200 dark:hover:bg-indigo-900/60';
      case 'diode':
        return 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700/70 hover:bg-rose-200 dark:hover:bg-rose-900/60';
      case 'crystal':
        return 'bg-pink-100 dark:bg-pink-900/40 text-pink-800 dark:text-pink-300 border-pink-300 dark:border-pink-700/70 hover:bg-pink-200 dark:hover:bg-pink-900/60';
      case 'trace':
        return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/70 hover:bg-emerald-200 dark:hover:bg-emerald-900/60';
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
      case 'mosfet':
        return '🔀';
      case 'coil':
        return '🌀';
      case 'diode':
        return '🔺';
      case 'crystal':
        return '⏱️';
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
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border cursor-pointer transition-all whitespace-nowrap select-none align-middle mx-0.5 shadow-sm ${
        isHighlighted
          ? 'ring-2 ring-dahab-500 scale-105'
          : 'hover:scale-105 active:scale-95'
      } ${getTypeColor()}`}
      title={`انقر لفحص مواصفات ${name} والرمز الهندسي وطريقة القياس بالدايود`}
    >
      <span className="shrink-0">{getTypeIcon()}</span>
      <span className="font-mono tracking-tight">{name}</span>
      {isHighlighted ? (
        <Info className="w-3 h-3 animate-pulse" />
      ) : (
        <span className="text-[10px] opacity-60">🔍</span>
      )}
    </span>
  );
}
