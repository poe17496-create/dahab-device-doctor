'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, X, Smartphone, Laptop, Monitor, HardDrive } from 'lucide-react';
import { BoardData } from './InteractiveBoardviewSimulator';

interface BoardviewSelectorProps {
  onSelectBoard: (board: BoardData) => void;
  currentBoard?: BoardData;
}

type Category = 'all' | 'mobile' | 'laptop' | 'desktop' | 'other';

export default function BoardviewSelector({ onSelectBoard, currentBoard }: BoardviewSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [boards, setBoards] = useState<BoardData[]>([]);
  const [loading, setLoading] = useState(true);

  // Debounce search query for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 150); // 150ms delay for instant feel but better performance
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // جلب البوردات
  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/boardviews');
      if (res.ok) {
        const data = await res.json();
        if (data.boards && Array.isArray(data.boards)) {
          setBoards(data.boards);
        }
      }
    } catch (e) {
      console.warn('Could not fetch boards:', e);
    } finally {
      setLoading(false);
    }
  };

  // تصفية البوردات
  const filteredBoards = boards.filter((board) => {
    const matchesSearch = board.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                        board.deviceModel.toLowerCase().includes(debouncedSearch.toLowerCase());

    const modelLower = board.deviceModel.toLowerCase();
    const titleLower = board.title.toLowerCase();

    let matchesCategory = selectedCategory === 'all';

    if (!matchesCategory) {
      switch (selectedCategory) {
        case 'mobile':
          // موبايل: iPhone, Samsung, Xiaomi, Huawei, Pixel, Oppo, Realme
          matchesCategory =
            modelLower.includes('iphone') ||
            modelLower.includes('samsung') ||
            modelLower.includes('galaxy') ||
            modelLower.includes('xiaomi') ||
            modelLower.includes('redmi') ||
            modelLower.includes('huawei') ||
            modelLower.includes('pixel') ||
            modelLower.includes('oppo') ||
            modelLower.includes('realme') ||
            titleLower.includes('iphone') ||
            titleLower.includes('samsung');
          break;
        case 'laptop':
          // لابتوب: MacBook, Dell, HP, Lenovo, ThinkPad, ASUS, Acer, MSI
          matchesCategory =
            modelLower.includes('macbook') ||
            modelLower.includes('dell') ||
            modelLower.includes('hp') ||
            modelLower.includes('lenovo') ||
            modelLower.includes('thinkpad') ||
            modelLower.includes('asus') ||
            modelLower.includes('acer') ||
            modelLower.includes('msi') ||
            modelLower.includes('surface') ||
            titleLower.includes('macbook') ||
            titleLower.includes('laptop');
          break;
        case 'desktop':
          // ديسكتوب: PC, Desktop, iMac, Motherboard, GPU
          matchesCategory =
            modelLower.includes('imac') ||
            modelLower.includes('desktop') ||
            modelLower.includes('pc') ||
            modelLower.includes('motherboard') ||
            modelLower.includes('gpu') ||
            modelLower.includes('rtx') ||
            modelLower.includes('geforce') ||
            titleLower.includes('desktop') ||
            titleLower.includes('imac');
          break;
      }
    }

    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all' as Category, label: 'الكل', icon: HardDrive },
    { id: 'mobile' as Category, label: 'موبايل', icon: Smartphone },
    { id: 'laptop' as Category, label: 'لابتوب', icon: Laptop },
    { id: 'desktop' as Category, label: 'ديسكتوب', icon: Monitor },
  ];

  return (
    <div className="relative">
      {/* زر اختيار البورد */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-workshop-card border border-gray-200 dark:border-gray-700 rounded-xl hover:border-dahab-500 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-dahab-500/10 text-dahab-600 dark:text-dahab-400 flex items-center justify-center">
            <HardDrive className="w-5 h-5" />
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
              {currentBoard?.title || currentBoard?.deviceModel || 'اختر البورد'}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              {currentBoard?.deviceModel || 'اختر البورد للبدء'}
            </p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* القائمة المنسدلة */}
      {isOpen && (
        <>
          {/* خلفية */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* القائمة */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-workshop-card border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 max-h-96 overflow-hidden">
            {/* البحث */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ابحث عن البورد..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-dahab-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* التصنيفات */}
            <div className="flex gap-2 p-3 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                    selectedCategory === cat.id
                      ? 'bg-dahab-500 text-slate-950'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <cat.icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              ))}
            </div>

            {/* القائمة */}
            <div className="overflow-y-auto max-h-64 p-2">
              {loading ? (
                <div className="text-center py-8 text-xs text-gray-500">
                  جاري التحميل...
                </div>
              ) : filteredBoards.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-500">
                  لا توجد بوردات
                </div>
              ) : (
                filteredBoards.map((board) => (
                  <button
                    key={board.id}
                    onClick={() => {
                      onSelectBoard(board);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-right transition ${
                      currentBoard?.id === board.id
                        ? 'bg-dahab-500/10 border border-dahab-500'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-900'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs">
                      {board.deviceModel.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                        {board.title}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                        {board.deviceModel}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
