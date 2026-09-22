'use client';

import React from 'react';
import { ReferenceSource } from '@/lib/types';
import { ExternalLink, BookOpen, Youtube, Cpu, MessageSquare } from 'lucide-react';

interface SourcesReferencesProps {
  sources: ReferenceSource[];
}

export default function SourcesReferences({ sources }: SourcesReferencesProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="space-y-3 pt-3">
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-dahab-400" />
        <h3 className="font-bold text-sm text-gray-200">
          📌 مراجع ومخططات وتجارب فنيين موازية:
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sources.map((item, index) => {
          const isYoutube = item.source.includes('يوتيوب');
          const isSchematic = item.source.includes('مخططات');
          const isForum = item.source.includes('منتديات');

          return (
            <a
              key={index}
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="p-3.5 border border-gray-800 rounded-xl hover:border-dahab-500/50 hover:bg-gray-900/80 transition bg-workshop-card block space-y-1.5 shadow-sm group"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded ${
                    isYoutube
                      ? 'bg-rose-500/20 text-rose-400'
                      : isSchematic
                      ? 'bg-dahab-500/20 text-dahab-300'
                      : isForum
                      ? 'bg-sky-500/20 text-sky-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {isYoutube ? (
                    <Youtube className="w-3 h-3" />
                  ) : isSchematic ? (
                    <Cpu className="w-3 h-3" />
                  ) : (
                    <MessageSquare className="w-3 h-3" />
                  )}
                  {item.source}
                </span>

                <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-dahab-400 transition" />
              </div>

              <p className="font-bold text-xs text-gray-200 group-hover:text-dahab-300 transition line-clamp-1">
                {item.title}
              </p>
              <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                {item.snippet}
              </p>
            </a>
          );
        })}
      </div>
    </div>
  );
}
