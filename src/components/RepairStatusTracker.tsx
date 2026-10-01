'use client';

import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Clock,
  Package,
  Wrench,
  CheckCircle,
  XCircle,
  Save,
  ChevronRight,
} from 'lucide-react';
import { RepairStatus, RepairTicket, PostRepairFeedback } from '@/lib/types';

interface RepairStatusTrackerProps {
  ticketId: string;
  deviceModel: string;
  deviceType: string;
  symptoms: string;
  aiDiagnosis: string;
  suspectedComponent?: string;
  onStatusUpdate?: (ticket: RepairTicket) => void;
}

const STATUS_STEPS: {
  value: RepairStatus;
  label: string;
  icon: any;
  color: string;
}[] = [
  {
    value: 'under_diagnosis',
    label: 'قيد التشخيص',
    icon: ClipboardCheck,
    color: 'bg-blue-500',
  },
  {
    value: 'awaiting_parts',
    label: 'جاري جلب القطع',
    icon: Package,
    color: 'bg-amber-500',
  },
  {
    value: 'in_repair',
    label: 'قيد الإصلاح',
    icon: Wrench,
    color: 'bg-purple-500',
  },
  {
    value: 'repaired_success',
    label: 'تم الإصلاح بنجاح',
    icon: CheckCircle,
    color: 'bg-emerald-500',
  },
  {
    value: 'unrepairable',
    label: 'تعذر إصلاحه',
    icon: XCircle,
    color: 'bg-rose-500',
  },
];

export default function RepairStatusTracker({
  ticketId,
  deviceModel,
  deviceType,
  symptoms,
  aiDiagnosis,
  suspectedComponent,
  onStatusUpdate,
}: RepairStatusTrackerProps) {
  const [currentStatus, setCurrentStatus] = useState<RepairStatus>('under_diagnosis');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedback, setFeedback] = useState<PostRepairFeedback>({
    ticketId,
    actualReplacedComponent: '',
    repairTimeMinutes: 0,
    repairNotes: '',
    aiAccuracy: 'accurate',
  });

  // حفظ التذكرة في LocalStorage
  useEffect(() => {
    const saveTicket = () => {
      const ticket: RepairTicket = {
        ticketId,
        deviceModel,
        deviceType: deviceType as any,
        symptoms,
        aiDiagnosis,
        suspectedComponent,
        status: currentStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        actualReplacedComponent: feedback.actualReplacedComponent,
        repairTimeMinutes: feedback.repairTimeMinutes,
        repairNotes: feedback.repairNotes,
        aiAccuracy: feedback.aiAccuracy,
      };

      // حفظ في LocalStorage
      const savedTickets = JSON.parse(localStorage.getItem('dahab_repair_tickets') || '[]');
      const updatedTickets = savedTickets.filter((t: RepairTicket) => t.ticketId !== ticketId);
      updatedTickets.unshift(ticket);
      localStorage.setItem('dahab_repair_tickets', JSON.stringify(updatedTickets.slice(0, 10)));

      if (onStatusUpdate) onStatusUpdate(ticket);
    };

    saveTicket();
  }, [currentStatus, feedback]);

  const handleStatusChange = (newStatus: RepairStatus) => {
    setCurrentStatus(newStatus);

    // إظهار نموذج التغذية الراجعة عند الحالات النهائية
    if (newStatus === 'repaired_success' || newStatus === 'unrepairable') {
      setShowFeedbackForm(true);
    }
  };

  const handleFeedbackSubmit = async () => {
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'repair_outcome',
          ...feedback,
        }),
      });

      setShowFeedbackForm(false);
      alert('✅ تم حفظ التغذية الراجعة بنجاح!');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('❌ حدث خطأ أثناء حفظ التغذية الراجعة');
    }
  };

  const getStatusIndex = (status: RepairStatus) => {
    return STATUS_STEPS.findIndex((step) => step.value === status);
  };

  const currentStatusIndex = getStatusIndex(currentStatus);

  return (
    <div className="space-y-4">
      {/* Ticket Header */}
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-dahab-500" />
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">رقم التذكرة</div>
              <div className="font-bold text-dahab-600 dark:text-dahab-400">{ticketId}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400">الموديل</div>
            <div className="font-bold text-gray-900 dark:text-gray-100">{deviceModel}</div>
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-dahab-500" />
          <span>تتبع حالة الإصلاح</span>
        </h3>

        <div className="space-y-3">
          {STATUS_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = step.value === currentStatus;
            const isCompleted = idx < currentStatusIndex;
            const isPending = idx > currentStatusIndex;

            return (
              <button
                key={step.value}
                onClick={() => handleStatusChange(step.value)}
                disabled={isPending}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-dahab-500/20 border-2 border-dahab-500'
                    : isCompleted
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isActive ? step.color : isCompleted ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 text-right">
                  <div
                    className={`font-bold text-sm ${
                      isActive
                        ? 'text-dahab-700 dark:text-dahab-300'
                        : isCompleted
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {step.label}
                  </div>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-dahab-500 animate-pulse" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Post-Repair Feedback Form */}
      {showFeedbackForm && (
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 animate-fadeIn">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Save className="w-4 h-4 text-dahab-500" />
            <span>نتيجة الإصلاح النهائية</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                القطعة التي تم تغييرها فعلياً:
              </label>
              <input
                type="text"
                value={feedback.actualReplacedComponent}
                onChange={(e) => setFeedback({ ...feedback, actualReplacedComponent: e.target.value })}
                placeholder="مثال: PMIC U1001"
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                الوقت المستغرق للإصلاح (دقائق):
              </label>
              <input
                type="number"
                value={feedback.repairTimeMinutes}
                onChange={(e) => setFeedback({ ...feedback, repairTimeMinutes: parseInt(e.target.value) || 0 })}
                placeholder="مثال: 45"
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                دقة التشخيص بالذكاء الاصطناعي:
              </label>
              <select
                value={feedback.aiAccuracy}
                onChange={(e) => setFeedback({ ...feedback, aiAccuracy: e.target.value as any })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500"
              >
                <option value="accurate">دقيق تماماً ✅</option>
                <option value="partial">دقيق جزئياً ⚠️</option>
                <option value="inaccurate">غير دقيق ❌</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                ملاحظات الإصلاح:
              </label>
              <textarea
                value={feedback.repairNotes}
                onChange={(e) => setFeedback({ ...feedback, repairNotes: e.target.value })}
                placeholder="اكتب أي ملاحظات إضافية عن الإصلاح..."
                rows={3}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500 resize-none"
              />
            </div>

            <button
              onClick={handleFeedbackSubmit}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-dahab-500 to-amber-600 hover:from-dahab-600 hover:to-amber-700 text-slate-950 px-4 py-2 rounded-lg font-bold text-sm transition shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>حفظ النتيجة</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
