'use client';

import React from 'react';
import { ReferenceSource } from '@/lib/types';
import { ExternalLink, BookOpen, Youtube, Cpu, MessageSquare, Wrench, Search } from 'lucide-react';

interface SourcesReferencesProps {
  sources: ReferenceSource[];
}

export default function SourcesReferences({ sources }: SourcesReferencesProps) {
  if (!sources || sources.length === 0) {
    const quickLinks = [
      { name: 'GSM-Forum', url: 'https://forum.gsmhosting.com/', icon: <MessageSquare className="w-5 h-5" />, desc: 'أكبر مجتمع عالمي لمهندسي الصيانة' },
      { name: 'iFixit', url: 'https://www.ifixit.com/', icon: <Wrench className="w-5 h-5" />, desc: 'دلائل الإصلاح وتفكيك الأجهزة' },
      { name: 'مجتمع الصيانة العربي', url: 'https://phonerepairing.net/', icon: <Search className="w-5 h-5" />, desc: 'شروحات ومقالات صيانة باللغة العربية' },
      { name: 'قناة REWA Technology', url: 'https://www.youtube.com/@RewaElectronics', icon: <Youtube className="w-5 h-5" />, desc: 'فيديوهات احترافية لصيانة المايكرو' },
      { name: 'ZXW Schematics Tools', url: 'https://zxwteam.cn/', icon: <Cpu className="w-5 h-5" />, desc: 'مخططات البوردة وتتبع المسارات' }
    ];

    return (
      <div className="py-8 flex flex-col items-center justify-center space-y-6 text-center bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 p-6 my-4">
        <div className="w-16 h-16 rounded-full bg-dahab-100 dark:bg-dahab-900/30 flex items-center justify-center mb-2">
          <BookOpen className="w-8 h-8 text-dahab-500" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
            المراجع والمصادر الهندسية
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
            ستظهر هنا المراجع والمخططات وتجارب الفنيين الموازية بعد إجراء التشخيص للجهاز. في غضون ذلك، يمكنك استكشاف هذه المصادر المفيدة:
          </p>
        </div>

        <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6 text-right" dir="rtl">
          {quickLinks.map((link, idx) => (
            <a
              key={idx}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-workshop-card hover:border-dahab-500/50 hover:shadow-md transition-all group"
            >
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:text-dahab-500 group-hover:bg-dahab-50 dark:group-hover:bg-dahab-500/20 transition-colors">
                {link.icon}
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-700 dark:text-gray-200 group-hover:text-dahab-600 dark:group-hover:text-dahab-400 flex items-center gap-1">
                  {link.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {link.desc}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-3">
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-dahab-500 dark:text-dahab-400" />
        <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">
          📌 مراجع ومخططات وتجارب فنيين موازية:
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3" dir="rtl">
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
              className="p-3.5 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-dahab-500/50 dark:hover:border-dahab-500/50 hover:bg-gray-50 dark:hover:bg-gray-900/80 transition bg-white dark:bg-workshop-card block space-y-1.5 shadow-sm group"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded ${
                    isYoutube
                      ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
                      : isSchematic
                      ? 'bg-dahab-100 text-dahab-700 dark:bg-dahab-500/20 dark:text-dahab-300'
                      : isForum
                      ? 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400'
                      : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
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

                <ExternalLink className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 group-hover:text-dahab-500 dark:group-hover:text-dahab-400 transition" />
              </div>

              <p className="font-bold text-xs text-gray-700 dark:text-gray-200 group-hover:text-dahab-600 dark:group-hover:text-dahab-300 transition line-clamp-1">
                {item.title}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                {item.snippet}
              </p>
            </a>
          );
        })}
      </div>
    </div>
  );
}
