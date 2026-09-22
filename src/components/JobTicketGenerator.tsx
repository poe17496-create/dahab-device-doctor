'use client';

import React, { useState } from 'react';
import { Printer, FileText, CheckCircle2, Shield, QrCode, Wrench, Sparkles } from 'lucide-react';
import { DiagnosticMetrics } from '@/lib/types';

interface JobTicketProps {
  deviceModel: string;
  metrics?: DiagnosticMetrics;
  rawDiagnosis: string;
}

export default function JobTicketGenerator({
  deviceModel,
  metrics,
  rawDiagnosis,
}: JobTicketProps) {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [warrantyDays, setWarrantyDays] = useState('30');
  const [workshopName, setWorkshopName] = useState('مركز دهب لصيانة الإلكترونيات المتطورة');
  const [ticketId] = useState(() => `DHB-${Math.floor(100000 + Math.random() * 900000)}`);

  const handlePrintTicket = () => {
    window.print();
  };

  return (
    <div className="bg-workshop-card border border-workshop-border rounded-2xl p-5 shadow-2xl space-y-5 animate-fadeIn">
      {/* هيدر تذكرة الصيانة */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-workshop-border pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-black text-gray-100 flex items-center gap-2">
              <span>كارت استلام الجهاز وفاتورة ضمان الصيانة (Workshop Job Ticket)</span>
              <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-bold border border-sky-500/30">
                جاهز للطباعة
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              توليد إيصال استلام رسمي للعميل معتمد بتقرير فحص Dahab FixAI وشروط الضمان
            </p>
          </div>
        </div>

        <button
          onClick={handlePrintTicket}
          className="flex items-center gap-2 bg-gradient-to-r from-dahab-500 to-amber-600 hover:from-dahab-600 hover:to-amber-700 text-slate-950 px-5 py-2 rounded-xl text-xs font-black transition shadow-lg shadow-dahab-500/20 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة الكارت للعميل 🖨️</span>
        </button>
      </div>

      {/* حقول بيانات العميل والجهاز */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <div>
          <label className="text-[11px] font-bold text-gray-400 block mb-1">اسم العميل:</label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="مثلاً: محمد أحمد"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-gray-100 outline-none focus:border-dahab-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-gray-400 block mb-1">رقم الهاتف:</label>
          <input
            type="text"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            placeholder="010xxxxxxxx أو 05xxxxxxxx"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-gray-100 outline-none focus:border-dahab-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-gray-400 block mb-1">السيريال / IMEI:</label>
          <input
            type="text"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            placeholder="35489xxxxxxxxxx"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-gray-100 outline-none focus:border-dahab-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-gray-400 block mb-1">التكلفة المتوقعة (ج.م / ر.س):</label>
          <input
            type="text"
            value={estimatedCost}
            onChange={(e) => setEstimatedCost(e.target.value)}
            placeholder="مثلاً: 450"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-gray-100 outline-none focus:border-dahab-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-gray-400 block mb-1">مدة الضمان (أيام):</label>
          <input
            type="number"
            value={warrantyDays}
            onChange={(e) => setWarrantyDays(e.target.value)}
            placeholder="30"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-gray-100 outline-none focus:border-dahab-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-gray-400 block mb-1">اسم المركز / الورشة:</label>
          <input
            type="text"
            value={workshopName}
            onChange={(e) => setWorkshopName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-gray-100 outline-none focus:border-dahab-500"
          />
        </div>
      </div>

      {/* معاينة الكارت المطبوع (Print Preview Card) */}
      <div className="p-6 bg-white text-slate-900 rounded-2xl shadow-xl border border-gray-300 space-y-4 max-w-2xl mx-auto print:max-w-full print:m-0 print:border-none print:shadow-none">
        {/* هيدر الكارت المطبوع */}
        <div className="flex items-center justify-between border-b-2 border-amber-500 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center font-black text-xl">
              D
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">{workshopName}</h3>
              <p className="text-[11px] text-gray-600">
                منظومة الفحص الهندسي المعتمدة: Dahab FixAI 🛠️⚡
              </p>
            </div>
          </div>

          <div className="text-left">
            <span className="font-mono font-black text-sm text-amber-600 block">
              رقم الإيصال: {ticketId}
            </span>
            <span className="text-[10px] text-gray-500">
              التاريخ: {new Date().toLocaleDateString('ar-EG')}
            </span>
          </div>
        </div>

        {/* بيانات الجهاز والعميل في جدول */}
        <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-xl border border-gray-200">
          <div>
            <span className="text-gray-500 block text-[10px]">العميل:</span>
            <span className="font-bold text-slate-900">{clientName || 'عميل نقدي'}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px]">الهاتف:</span>
            <span className="font-mono font-bold text-slate-900">{clientPhone || '---'}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px]">الجهاز والطراز:</span>
            <span className="font-bold text-amber-700">{deviceModel || 'جهاز صيانة إلكترونيات'}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px]">السيريال / IMEI:</span>
            <span className="font-mono text-slate-900">{serialNumber || '---'}</span>
          </div>
        </div>

        {/* ملخص التشخيص المعتمد */}
        <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs space-y-1">
          <div className="font-bold text-amber-900 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            <span>التشخيص الفني الأولي لمنظومة دهب:</span>
          </div>
          <p className="text-slate-800 text-[11px]">
            {metrics
              ? `تصنيف العطل: ${metrics.classification === 'HARDWARE' ? 'هاردوير (قطع غيار ومسارات)' : 'سوفتوير ونظام تشغيل'} - المكون المشتبه به: ${metrics.primarySuspectComponent || 'دائرة التغذية'}`
              : 'تم الفحص المبدئي للأجهزة ومسارات التغذية والباور سيكونس.'}
          </p>
        </div>

        {/* التكلفة والضمان */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-200 text-xs">
          <div>
            <span className="text-gray-500 block text-[10px]">التكلفة المتفق عليها:</span>
            <span className="text-base font-black text-slate-900 font-mono">
              {estimatedCost ? `${estimatedCost} ج.م / ر.س` : 'تحدد بعد استكمال الفحص'}
            </span>
          </div>

          <div className="text-left">
            <span className="text-gray-500 block text-[10px]">فترة الضمان على العطل:</span>
            <span className="font-bold text-emerald-700">{warrantyDays} يوماً ضد عيوب الصيانة</span>
          </div>
        </div>

        {/* شروط المركز والباركود */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[9px] text-gray-500">
          <p className="max-w-[75%] leading-tight">
            * المركز غير مسؤول عن الأجهزة المتروكة لأكثر من 60 يوماً بعد إبلاغ العميل. الضمان يسري على العطل الذي تم إصلاحه فقط.
          </p>
          <div className="flex items-center gap-1 font-mono text-[10px] text-gray-400">
            <QrCode className="w-5 h-5 text-gray-700" />
            <span>VERIFIED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
