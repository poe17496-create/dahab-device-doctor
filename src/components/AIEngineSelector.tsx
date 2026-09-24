'use client';

import React from 'react';
import { Cpu, Zap, Brain, Server } from 'lucide-react';
import { AIEngine, getAvailableEngines } from '@/lib/aiEngines';

interface AIEngineSelectorProps {
  selectedEngine: AIEngine;
  onEngineChange: (engine: AIEngine) => void;
}

const engineIcons: Record<AIEngine, React.ReactNode> = {
  openai: <Zap className="w-4 h-4" />,
  openrouter: <Brain className="w-4 h-4" />,
  gemini: <Cpu className="w-4 h-4" />,
  local: <Server className="w-4 h-4" />,
};

export default function AIEngineSelector({ selectedEngine, onEngineChange }: AIEngineSelectorProps) {
  const engines = getAvailableEngines();

  return (
    <div className="bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border rounded-2xl p-4 shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        <Cpu className="w-5 h-5 text-dahab-600 dark:text-dahab-400" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
          محرك الذكاء الاصطناعي
        </h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {engines.map((engine) => (
          <button
            key={engine.id}
            onClick={() => onEngineChange(engine.id)}
            disabled={!engine.enabled}
            className={`
              flex flex-col items-center gap-2 p-3 rounded-xl text-xs font-bold transition-all
              ${selectedEngine === engine.id
                ? 'bg-gradient-to-r from-dahab-500 to-amber-600 text-slate-950 shadow-lg shadow-dahab-500/20'
                : engine.enabled
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
              }
            `}
          >
            {engineIcons[engine.id]}
            <span className="text-center leading-tight">{engine.name}</span>
            {!engine.enabled && (
              <span className="text-[10px] text-gray-400">غير مفعل</span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-workshop-border">
        <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
          {engines.find(e => e.id === selectedEngine)?.model} • 
          {selectedEngine === 'local' ? ' يعمل بدون إنترنت' : ' يتطلب اتصال إنترنت'}
        </p>
      </div>
    </div>
  );
}
