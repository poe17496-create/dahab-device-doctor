'use client';

import React from 'react';
import { Lock, X, MessageCircle, LogIn } from 'lucide-react';

interface GuestLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export default function GuestLockModal({ isOpen, onClose, onLogin }: GuestLockModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white dark:bg-[#111827] rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full p-6 space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Lock className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-black text-gray-900 dark:text-white">
            هذه الميزة متاحة للفنيين المعتمدين فقط 🔒
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            أنت تستخدم وضع الزائر. سجّل الدخول بحساب فني للوصول لكل أدوات منظومة دهب دكتور.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onLogin}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-dahab-500 via-amber-500 to-amber-600 hover:from-dahab-600 hover:to-amber-700 text-slate-950 font-black text-sm transition shadow-lg shadow-dahab-500/25 flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>تسجيل دخول فني</span>
          </button>

          <a
            href="https://wa.me/201064147224"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold text-sm transition flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>طلب حساب عبر واتساب</span>
          </a>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-sm transition"
          >
            رجوع
          </button>
        </div>
      </div>
    </div>
  );
}
