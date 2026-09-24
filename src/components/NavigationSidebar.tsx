'use client';

import React from 'react';
import { 
  Stethoscope, 
  AlertOctagon, 
  Flame, 
  Cpu, 
  BookOpen, 
  CheckSquare, 
  FileText, 
  Zap,
  X,
  BarChart3,
  MessageCircle,
} from 'lucide-react';
import type { MasterTab } from '@/app/page';

interface NavigationSidebarProps {
  activeTab: MasterTab;
  onTabChange: (tab: MasterTab) => void;
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { id: 'diagnosis' as MasterTab, label: 'التشخيص الذكي', icon: Stethoscope, color: 'from-dahab-500 to-amber-600' },
  { id: 'panic-log' as MasterTab, label: 'محلل البانيك', icon: AlertOctagon, color: 'from-purple-600 to-indigo-600' },
  { id: 'safe-injection' as MasterTab, label: 'حاسبة الفولت', icon: Flame, color: 'from-amber-600 to-rose-600' },
  { id: 'boardview' as MasterTab, label: 'معمل البوردفيو', icon: Cpu, color: 'from-emerald-600 to-teal-600' },
  { id: 'ic-encyclopedia' as MasterTab, label: 'موسوعة الآيسيهات', icon: BookOpen, color: 'from-sky-600 to-blue-600' },
  { id: 'checklist' as MasterTab, label: 'قائمة الفحص', icon: CheckSquare, color: 'from-indigo-600 to-violet-600' },
  { id: 'references' as MasterTab, label: 'المراجع', icon: FileText, color: 'from-rose-600 to-pink-600' },
  { id: 'integration' as MasterTab, label: 'تكامل المخططات', icon: Zap, color: 'from-teal-600 to-cyan-600' },
];

const adminItems = [
  { id: 'dashboard' as string, label: 'لوحة التحكم', icon: BarChart3, href: '/admin/dashboard' },
  { id: 'support' as string, label: 'الدعم الفني', icon: MessageCircle, href: '/support' },
];

export default function NavigationSidebar({ activeTab, onTabChange, isOpen, onClose }: NavigationSidebarProps) {
  return (
    <>
      {/* Sidebar Overlay for mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full w-72 bg-white dark:bg-[#111827] border-l border-gray-200 dark:border-[#1F2937] shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } lg:translate-x-0 lg:static lg:shadow-none lg:border-r lg:border-l-0`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 dark:border-[#1F2937] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-dahab-500 to-amber-600 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900 dark:text-gray-100">دهب دكتور</span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1F2937]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1F2937] hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Admin Section Divider */}
            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-[#1F2937]">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 px-4">أدوات إدارية</p>
            </div>

            {adminItems.map((item) => {
              const Icon = item.icon;
              
              return (
                <a
                  key={item.id}
                  href={item.href}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1F2937] hover:text-gray-900 dark:hover:text-white transition-all"
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-[#1F2937]">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              <p>© 2026 دهب دكتور</p>
              <p className="mt-1">الأول في الشرق الأوسط 🏆</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
