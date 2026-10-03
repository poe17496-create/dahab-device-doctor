'use client';

import React, { useState, useEffect } from 'react';
import { ReferenceSource } from '@/lib/types';
import { ExternalLink, BookOpen, Youtube, Cpu, MessageSquare, Wrench, Search, Scale, Shield, Filter, Plus, X, Tag, Globe, FileText, Video } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface SourcesReferencesProps {
  sources: ReferenceSource[];
}

type ReferenceCategory = 'all' | 'schematics' | 'forums' | 'videos' | 'guides' | 'custom';

interface CustomReference {
  id: string;
  title: string;
  url: string;
  category: ReferenceCategory;
  description: string;
  date: string;
}

export default function SourcesReferences({ sources }: SourcesReferencesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ReferenceCategory>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [customReferences, setCustomReferences] = useState<CustomReference[]>([]);
  const [newReference, setNewReference] = useState({
    title: '',
    url: '',
    category: 'custom' as ReferenceCategory,
    description: '',
  });

  // تحميل المراجع المخصصة من Supabase
  useEffect(() => {
    const loadCustomReferences = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const token = session.access_token;
          const response = await fetch('/api/custom-references', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const { data } = await response.json();
            const customRefs = data.map((ref: any) => ({
              id: ref.id,
              title: ref.title,
              url: ref.url,
              category: ref.category,
              description: ref.description,
              date: new Date(ref.created_at).toLocaleDateString('ar-EG'),
            }));
            setCustomReferences(customRefs);
          }
        }
      } catch (error) {
        console.error('Error loading custom references:', error);
      }
    };

    loadCustomReferences();
  }, []);

  // إضافة مرجع مخصص
  const handleAddReference = async () => {
    if (!newReference.title || !newReference.url) {
      alert('يرجى إدخال العنوان والرابط');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('يجب تسجيل الدخول لإضافة مراجع');
        return;
      }

      const token = session.access_token;
      const response = await fetch('/api/custom-references', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newReference.title,
          url: newReference.url,
          category: newReference.category,
          description: newReference.description,
        }),
      });

      if (response.ok) {
        const { data } = await response.json();
        const reference: CustomReference = {
          id: data.id,
          title: data.title,
          url: data.url,
          category: data.category,
          description: data.description,
          date: new Date(data.created_at).toLocaleDateString('ar-EG'),
        };

        const updated = [reference, ...customReferences];
        setCustomReferences(updated);
        setNewReference({ title: '', url: '', category: 'custom', description: '' });
        setShowAddModal(false);
      } else {
        const error = await response.json();
        alert(error.error || 'فشل إضافة المرجع');
      }
    } catch (error) {
      console.error('Error adding reference:', error);
      alert('حدث خطأ أثناء إضافة المرجع');
    }
  };

  // حذف مرجع مخصص
  const handleDeleteCustomReference = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('يجب تسجيل الدخول لحذف المراجع');
        return;
      }

      const token = session.access_token;
      const response = await fetch(`/api/custom-references?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const updated = customReferences.filter((r) => r.id !== id);
        setCustomReferences(updated);
      } else {
        const error = await response.json();
        alert(error.error || 'فشل حذف المرجع');
      }
    } catch (error) {
      console.error('Error deleting reference:', error);
      alert('حدث خطأ أثناء حذف المرجع');
    }
  };

  // دمج المراجع الافتراضية مع المخصصة
  const allSources = React.useMemo(() => {
    const customAsSources: ReferenceSource[] = customReferences.map((r) => {
      let sourceType: 'مخططات وزدكس دبليو ZXW' | 'يوتيوب YouTube' | 'تليجرام Telegram' | 'منتديات GSM' | 'دليل صيانة دهب' | 'مخصص' = 'مخصص';
      let type: 'schematic' | 'video' | 'forum' | 'solution' | 'custom' = 'custom';

      if (r.category === 'schematics') {
        sourceType = 'مخططات وزدكس دبليو ZXW';
        type = 'schematic';
      } else if (r.category === 'videos') {
        sourceType = 'يوتيوب YouTube';
        type = 'video';
      } else if (r.category === 'forums') {
        sourceType = 'منتديات GSM';
        type = 'forum';
      } else if (r.category === 'guides') {
        sourceType = 'دليل صيانة دهب';
        type = 'solution';
      }

      return {
        source: sourceType,
        title: r.title,
        link: r.url,
        snippet: r.description,
        type,
      };
    });

    return [...(sources || []), ...customAsSources];
  }, [sources, customReferences]);

  // تصفية المراجع
  const filteredSources = React.useMemo(() => {
    let filtered = allSources;

    // البحث
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.title?.toLowerCase().includes(q) ||
          s.snippet?.toLowerCase().includes(q) ||
          s.source?.toLowerCase().includes(q)
      );
    }

    // الفئة
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((s) => {
        const isSchematic = s.source?.includes('مخططات') || s.source?.toLowerCase().includes('schematic') || s.type === 'schematic';
        const isForum = s.source?.includes('منتديات') || s.source?.toLowerCase().includes('forum') || s.type === 'forum';
        const isVideo = s.source?.includes('يوتيوب') || s.source?.toLowerCase().includes('youtube') || s.type === 'video';
        const isGuide = s.source?.includes('دليل') || s.source?.toLowerCase().includes('guide') || s.type === 'solution';
        const isCustom = s.source === 'مخصص' || s.type === 'custom';

        if (selectedCategory === 'schematics') return isSchematic;
        if (selectedCategory === 'forums') return isForum;
        if (selectedCategory === 'videos') return isVideo;
        if (selectedCategory === 'guides') return isGuide;
        if (selectedCategory === 'custom') return isCustom;
        return true;
      });
    }

    return filtered;
  }, [allSources, searchQuery, selectedCategory]);

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

        {/* وثائق المنظومة والشروط القانونية */}
        <div className="w-full max-w-3xl pt-6 mt-4 border-t border-gray-200 dark:border-gray-800 text-right space-y-3" dir="rtl">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-dahab-500" />
            <h4 className="font-bold text-xs text-gray-800 dark:text-gray-200">
              الوثائق الرسمية والشروط الهندسية للمنظومة:
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="/terms"
              target="_blank"
              rel="noreferrer"
              className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition flex items-center justify-between group shadow-sm"
            >
              <div>
                <span className="font-bold text-xs text-amber-700 dark:text-amber-400 block group-hover:underline">
                  📜 شروط الاستخدام وإخلاء المسؤولية
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                  قواعد حقن الفولت، التعليم الهندسي ومسؤولية الفحص
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-amber-500 shrink-0" />
            </a>

            <a
              href="/privacy"
              target="_blank"
              rel="noreferrer"
              className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition flex items-center justify-between group shadow-sm"
            >
              <div>
                <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400 block group-hover:underline">
                  🛡️ سياسة الخصوصية وسرية البيانات
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                  تشفير TLS وعدم مشاركة بيانات الأجهزة
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-emerald-500 shrink-0" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-dahab-500 dark:text-dahab-400" />
          <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">
            📌 مراجع ومخططات وتجارب فنيين موازية:
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-dahab-500/15 text-dahab-700 dark:text-dahab-300 font-bold border border-dahab-500/30">
            {allSources.length}
          </span>
        </div>
      </div>

      {/* شريط البحث والفلترة */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في المراجع والمصادر..."
              className="w-full pr-9 pl-4 py-2 bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border rounded-xl text-xs text-gray-800 dark:text-gray-200 outline-none focus:border-dahab-500"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-2 rounded-xl bg-dahab-500 hover:bg-dahab-600 text-slate-950 text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مرجع</span>
          </button>
        </div>

        {/* فلاتر الفئات */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              selectedCategory === 'all'
                ? 'bg-dahab-500 text-slate-950'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            الكل ({allSources.length})
          </button>
          <button
            onClick={() => setSelectedCategory('schematics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              selectedCategory === 'schematics'
                ? 'bg-dahab-500 text-slate-950'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            مخططات
          </button>
          <button
            onClick={() => setSelectedCategory('forums')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              selectedCategory === 'forums'
                ? 'bg-dahab-500 text-slate-950'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            منتديات
          </button>
          <button
            onClick={() => setSelectedCategory('videos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              selectedCategory === 'videos'
                ? 'bg-dahab-500 text-slate-950'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            فيديوهات
          </button>
          <button
            onClick={() => setSelectedCategory('custom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              selectedCategory === 'custom'
                ? 'bg-dahab-500 text-slate-950'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            مخصص ({customReferences.length})
          </button>
        </div>
      </div>

      {/* عرض المراجع */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3" dir="rtl">
        {filteredSources.map((item, index) => {
          const isYoutube = item.source.includes('يوتيوب') || item.type === 'video';
          const isSchematic = item.source.includes('مخططات') || item.type === 'schematic';
          const isForum = item.source.includes('منتديات') || item.type === 'forum';
          const isCustom = item.source === 'مخصص' || item.type === 'custom';

          return (
            <div
              key={index}
              className="relative p-3.5 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-dahab-500/50 dark:hover:border-dahab-500/50 hover:bg-gray-50 dark:hover:bg-gray-900/80 transition bg-white dark:bg-workshop-card block space-y-1.5 shadow-sm group"
            >
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="block space-y-1.5"
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
                        : isCustom
                        ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400'
                        : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                    }`}
                  >
                    {isYoutube ? (
                      <Youtube className="w-3 h-3" />
                    ) : isSchematic ? (
                      <Cpu className="w-3 h-3" />
                    ) : isCustom ? (
                      <Tag className="w-3 h-3" />
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

              {/* زر الحذف للمراجع المخصصة */}
              {isCustom && (
                <button
                  onClick={() => {
                    const customRef = customReferences.find(r => r.title === item.title);
                    if (customRef) handleDeleteCustomReference(customRef.id);
                  }}
                  className="absolute top-2 left-2 p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition opacity-0 group-hover:opacity-100"
                  title="حذف المرجع"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* وثائق المنظومة والشروط القانونية */}
      <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-800 text-right space-y-3" dir="rtl">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-dahab-500" />
          <h4 className="font-bold text-xs text-gray-800 dark:text-gray-200">
            الوثائق الرسمية والشروط الهندسية للمنظومة:
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="/terms"
            target="_blank"
            rel="noreferrer"
            className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition flex items-center justify-between group shadow-sm"
          >
            <div>
              <span className="font-bold text-xs text-amber-700 dark:text-amber-400 block group-hover:underline">
                📜 شروط الاستخدام وإخلاء المسؤولية
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                قواعد حقن الفولت، التعليم الهندسي ومسؤولية الفحص
              </span>
            </div>
            <ExternalLink className="w-4 h-4 text-amber-500 shrink-0" />
          </a>

          <a
            href="/privacy"
            target="_blank"
            rel="noreferrer"
            className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition flex items-center justify-between group shadow-sm"
          >
            <div>
              <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400 block group-hover:underline">
                🛡️ سياسة الخصوصية وسرية البيانات
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                تشفير TLS وعدم مشاركة بيانات الأجهزة
              </span>
            </div>
            <ExternalLink className="w-4 h-4 text-emerald-500 shrink-0" />
          </a>
        </div>
      </div>

      {/* Modal إضافة مرجع مخصص */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900 dark:text-gray-100">إضافة مرجع مخصص</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">العنوان *</label>
                <input
                  type="text"
                  value={newReference.title}
                  onChange={(e) => setNewReference({ ...newReference, title: e.target.value })}
                  placeholder="مثال: دليل صيانة iPhone 14"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">الرابط *</label>
                <input
                  type="url"
                  value={newReference.url}
                  onChange={(e) => setNewReference({ ...newReference, url: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">الوصف</label>
                <textarea
                  value={newReference.description}
                  onChange={(e) => setNewReference({ ...newReference, description: e.target.value })}
                  placeholder="وصف قصير للمرجع..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleAddReference}
                className="flex-1 px-4 py-2 rounded-xl bg-dahab-500 hover:bg-dahab-600 text-slate-950 text-xs font-black transition shadow-sm"
              >
                إضافة
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
