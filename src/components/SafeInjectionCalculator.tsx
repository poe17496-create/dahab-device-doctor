'use client';

import React, { useState, useEffect } from 'react';
import { Zap, AlertTriangle, ShieldCheck, Flame, Info, CheckCircle2, Plus, Trash2, Edit, X, Settings, Save, History } from 'lucide-react';
import { useDiagnosticContext } from '@/contexts/DiagnosticContext';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface RailInfo {
  id: string;
  name: string;
  nominalVoltage: number;
  maxSafeVoltage: number;
  recommendedVoltage: number;
  maxSafeCurrent: number;
  dangerZone: number;
  firstSuspects: string;
  notes: string;
  isCustom?: boolean;
}

const DEFAULT_RAILS: RailInfo[] = [
  {
    id: 'rail_1',
    name: 'PP_VDD_MAIN / VPH_PWR / VBUS',
    nominalVoltage: 3.8,
    maxSafeVoltage: 3.8,
    recommendedVoltage: 1.8,
    maxSafeCurrent: 3.0,
    dangerZone: 4.5,
    firstSuspects: 'مكثفات خط التغذية التوازي (Ceramic Caps)، آيسي الشحن، ومكبرات الصوت (Audio Amp)',
    notes: 'ابدأ بالحقن التدريجي عند 1.2V ثم 1.8V مع مراقبة انصهار الرجينة أو الكاميرا الحرارية.',
  },
  {
    id: 'rail_2',
    name: 'PP_CPU_CORE / VCORE (فولت المعالج)',
    nominalVoltage: 0.9,
    maxSafeVoltage: 0.95,
    recommendedVoltage: 0.65,
    maxSafeCurrent: 1.5,
    dangerZone: 1.1,
    firstSuspects: 'مكثفات تصفية المعالج، موسفيتات درايفر البك (DrMOS / Buck Driver)، المعالج نفسه',
    notes: '⚠️ خط أحمر! لا ترفع الفولت أبداً فوق 0.8V. أي فولتية تتجاوز 1.0V تحرق طبقات المعالج فوراً!',
  },
  {
    id: 'rail_3',
    name: 'PP_GPU / GFX (معالج الرسوميات)',
    nominalVoltage: 0.85,
    maxSafeVoltage: 0.9,
    recommendedVoltage: 0.6,
    maxSafeCurrent: 1.5,
    dangerZone: 1.05,
    firstSuspects: 'مكثفات تصفية الرسوميات، وحدات الفازات (Phase Controllers)',
    notes: 'الممانعة على هذا المسار منخفضة جداً بطبيعتها (0.010V - 0.050V) ولا تعني شورت بالضرورة.',
  },
  {
    id: 'rail_4',
    name: 'PP1V8_ALWAYS / VREG_L6_1P8 (فولت 1.8V)',
    nominalVoltage: 1.8,
    maxSafeVoltage: 1.8,
    recommendedVoltage: 1.2,
    maxSafeCurrent: 2.0,
    dangerZone: 2.2,
    firstSuspects: 'آيسي الذاكرة NAND/UFS، آيسي الباور الرئيسي PMIC، مقاومات رفع ناقل I2C',
    notes: 'مسار حيوي جداً يغذي الذواكر ودوائر التوقيت. لا تحقن أكثر من 1.5V.',
  },
  {
    id: 'rail_5',
    name: 'PP_DRAM / VDD_RAM (LPDDR4 / LPDDR5)',
    nominalVoltage: 1.1,
    maxSafeVoltage: 1.15,
    recommendedVoltage: 0.8,
    maxSafeCurrent: 1.5,
    dangerZone: 1.3,
    firstSuspects: 'مكثفات تصفية الرامات، آيسي إدارة رامات المعالج',
    notes: 'الرامات شديدة الحساسية للحرارة والفولت الزائد.',
  },
  {
    id: 'rail_6',
    name: '19V DC-IN (لابتوب وماك بوك)',
    nominalVoltage: 19.5,
    maxSafeVoltage: 19.0,
    recommendedVoltage: 8.0,
    maxSafeCurrent: 2.5,
    dangerZone: 21.0,
    firstSuspects: 'موسفيتات الدخل الأولى (First & Second Input MOSFETs)، ومكثفات السيراميك الكبيرة',
    notes: 'ابدأ بحقن 5V ثم ارفعها إلى 8V ثم 12V تدريجياً لمشاهدة المكون الذي يسخن أولاً دون تفجيره.',
  },
  {
    id: 'rail_7',
    name: '12V / 24V (كروت باور وإنفرتر وشاشات)',
    nominalVoltage: 12.0,
    maxSafeVoltage: 12.0,
    recommendedVoltage: 6.0,
    maxSafeCurrent: 3.0,
    dangerZone: 14.0,
    firstSuspects: 'مكثفات التنعيم، دايودات شوتكي، وترانزستورات الموسفيت للتقطيع (SMPS Switching)',
    notes: 'تأكد من تفريغ المكثف الكبير (400V) بمقاومة تفريغ قبل الفحص لتفادي الصعق!',
  },
];

export default function SafeInjectionCalculator() {
  const { setCalculatorContext } = useDiagnosticContext();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [rails, setRails] = useState<RailInfo[]>(DEFAULT_RAILS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRail, setEditingRail] = useState<RailInfo | null>(null);
  const [newRail, setNewRail] = useState({
    name: '',
    nominalVoltage: 0,
    maxSafeVoltage: 0,
    recommendedVoltage: 0,
    maxSafeCurrent: 0,
    dangerZone: 0,
    firstSuspects: '',
    notes: '',
  });

  const rail = rails[selectedIdx];

  // تحميل المسارات المخصصة من Supabase
  useEffect(() => {
    const loadCustomRails = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const token = session.access_token;
          const response = await fetch('/api/custom-rails', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const { data } = await response.json();
            const customRails = data.map((rail: any) => ({
              id: rail.id,
              name: rail.name,
              nominalVoltage: rail.nominal_voltage,
              maxSafeVoltage: rail.max_safe_voltage,
              recommendedVoltage: rail.recommended_voltage,
              maxSafeCurrent: rail.max_safe_current,
              dangerZone: rail.danger_zone,
              firstSuspects: rail.first_suspects,
              notes: rail.notes,
              isCustom: true,
            }));
            setRails([...DEFAULT_RAILS, ...customRails]);
          }
        }
      } catch (error) {
        console.error('Error loading custom rails:', error);
      }
    };

    loadCustomRails();
  }, []);

  // تحديث الـ Context عند تغيير المسار المختار
  useEffect(() => {
    setCalculatorContext({
      selectedRail: rail.name,
      recommendedVoltage: rail.recommendedVoltage,
      maxSafeVoltage: rail.maxSafeVoltage,
      maxSafeCurrent: rail.maxSafeCurrent,
    });
  }, [selectedIdx, rail, setCalculatorContext]);

  // إضافة مسار مخصص
  const handleAddRail = async () => {
    if (!newRail.name || newRail.nominalVoltage === 0) {
      alert('يرجى إدخال اسم المسار والجهد النموذجي');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('يجب تسجيل الدخول لإضافة مسارات مخصصة');
        return;
      }

      const token = session.access_token;
      const response = await fetch('/api/custom-rails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newRail.name,
          nominalVoltage: newRail.nominalVoltage,
          maxSafeVoltage: newRail.maxSafeVoltage || newRail.nominalVoltage * 1.1,
          recommendedVoltage: newRail.recommendedVoltage || newRail.nominalVoltage * 0.5,
          maxSafeCurrent: newRail.maxSafeCurrent || 2.0,
          dangerZone: newRail.dangerZone || newRail.nominalVoltage * 1.2,
          firstSuspects: newRail.firstSuspects,
          notes: newRail.notes,
        }),
      });

      if (response.ok) {
        const { data } = await response.json();
        const customRail: RailInfo = {
          id: data.id,
          name: data.name,
          nominalVoltage: data.nominal_voltage,
          maxSafeVoltage: data.max_safe_voltage,
          recommendedVoltage: data.recommended_voltage,
          maxSafeCurrent: data.max_safe_current,
          dangerZone: data.danger_zone,
          firstSuspects: data.first_suspects,
          notes: data.notes,
          isCustom: true,
        };

        const customRails = rails.filter((r) => r.isCustom);
        const updatedCustomRails = [customRail, ...customRails];
        const updatedRails = [...DEFAULT_RAILS, ...updatedCustomRails];

        setRails(updatedRails);
        setNewRail({
          name: '',
          nominalVoltage: 0,
          maxSafeVoltage: 0,
          recommendedVoltage: 0,
          maxSafeCurrent: 0,
          dangerZone: 0,
          firstSuspects: '',
          notes: '',
        });
        setShowAddModal(false);
      } else {
        const error = await response.json();
        alert(error.error || 'فشل إضافة المسار');
      }
    } catch (error) {
      console.error('Error adding rail:', error);
      alert('حدث خطأ أثناء إضافة المسار');
    }
  };

  // حذف مسار مخصص
  const handleDeleteRail = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('يجب تسجيل الدخول لحذف المسارات');
        return;
      }

      const token = session.access_token;
      const response = await fetch(`/api/custom-rails?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const updated = rails.filter((r) => r.id !== id);
        setRails(updated);
        if (selectedIdx >= updated.length) setSelectedIdx(0);
      } else {
        const error = await response.json();
        alert(error.error || 'فشل حذف المسار');
      }
    } catch (error) {
      console.error('Error deleting rail:', error);
      alert('حدث خطأ أثناء حذف المسار');
    }
  };

  // تعديل مسار
  const handleEditRail = (rail: RailInfo) => {
    setEditingRail(rail);
    setNewRail({
      name: rail.name,
      nominalVoltage: rail.nominalVoltage,
      maxSafeVoltage: rail.maxSafeVoltage,
      recommendedVoltage: rail.recommendedVoltage,
      maxSafeCurrent: rail.maxSafeCurrent,
      dangerZone: rail.dangerZone,
      firstSuspects: rail.firstSuspects,
      notes: rail.notes,
    });
    setShowAddModal(true);
  };

  // حفظ التعديل
  const handleSaveEdit = async () => {
    if (!editingRail || !newRail.name || newRail.nominalVoltage === 0) {
      alert('يرجى إدخال اسم المسار والجهد النموذجي');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('يجب تسجيل الدخول لتعديل المسارات');
        return;
      }

      const token = session.access_token;
      const response = await fetch('/api/custom-rails', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingRail.id,
          name: newRail.name,
          nominalVoltage: newRail.nominalVoltage,
          maxSafeVoltage: newRail.maxSafeVoltage,
          recommendedVoltage: newRail.recommendedVoltage,
          maxSafeCurrent: newRail.maxSafeCurrent,
          dangerZone: newRail.dangerZone,
          firstSuspects: newRail.firstSuspects,
          notes: newRail.notes,
        }),
      });

      if (response.ok) {
        const { data } = await response.json();
        const updated = rails.map((r) =>
          r.id === editingRail.id
            ? {
                ...r,
                name: data.name,
                nominalVoltage: data.nominal_voltage,
                maxSafeVoltage: data.max_safe_voltage,
                recommendedVoltage: data.recommended_voltage,
                maxSafeCurrent: data.max_safe_current,
                dangerZone: data.danger_zone,
                firstSuspects: data.first_suspects,
                notes: data.notes,
              }
            : r
        );

        setRails(updated);
        setEditingRail(null);
        setNewRail({
          name: '',
          nominalVoltage: 0,
          maxSafeVoltage: 0,
          recommendedVoltage: 0,
          maxSafeCurrent: 0,
          dangerZone: 0,
          firstSuspects: '',
          notes: '',
        });
        setShowAddModal(false);
      } else {
        const error = await response.json();
        alert(error.error || 'فشل حفظ التعديل');
      }
    } catch (error) {
      console.error('Error saving edit:', error);
      alert('حدث خطأ أثناء حفظ التعديل');
    }
  };

  return (
    <div className="bg-workshop-card border border-workshop-border rounded-2xl p-5 shadow-2xl space-y-5 animate-fadeIn">
      {/* هيدر الحاسبة */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-workshop-border pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-dahab-400 border border-dahab-500/30 flex items-center justify-center">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-black text-gray-100 flex items-center gap-2">
              <span>حاسبة حقن الفولت والحرارة الآمنة (Safe Voltage Injection Calculator)</span>
              <span className="text-[10px] bg-dahab-500/20 text-dahab-400 px-2 py-0.5 rounded-full font-bold border border-dahab-500/30">
                حماية المعالجات من الاحتراق
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              اختر المسار المراد كشف الشورت عليه لتعطيك المنظومة فوراً حدود الفولت والأمبير الآمنة لتبخير الرجينة والكاميرا الحرارية
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dahab-500/10 hover:bg-dahab-500/20 text-dahab-400 text-xs font-bold transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>إضافة مسار مخصص</span>
        </button>
      </div>

      {/* اختيار المسار */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-300">اختر المسار الكهربائي المشتبه به:</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          {rails.map((r, idx) => {
            const isSelected = selectedIdx === idx;
            const isCustom = r.isCustom;
            return (
              <div
                key={r.id}
                className={`relative p-2.5 rounded-xl border text-right transition flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-dahab-500/20 border-dahab-500 text-dahab-300 shadow-md'
                    : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-850 hover:text-gray-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedIdx(idx)}
                  className="flex-1 text-right"
                >
                  <span className="font-mono text-xs font-bold line-clamp-1 block">{r.name}</span>
                  <span className="text-[10px] text-gray-500 mt-1 block">الجهد النموذجي: {r.nominalVoltage}V</span>
                </button>

                {isCustom && (
                  <div className="absolute top-1 left-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditRail(r);
                      }}
                      className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition"
                      title="تعديل"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('هل تريد حذف هذا المسار؟')) {
                          handleDeleteRail(r.id);
                        }
                      }}
                      className="p-1 rounded hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition"
                      title="حذف"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* بطاقة القيم الهندسية للحقن */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
        {/* الفولت المقترح للبدء */}
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-1">
          <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>فولت الحقن الآمن الأولي:</span>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-300">
            {rail.recommendedVoltage}V
          </div>
          <div className="text-[10px] text-gray-400">ابدأ بهذا الجهد دائماً دون زيادة</div>
        </div>

        {/* أقصى فولت مسموح */}
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-1">
          <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>أقصى فولت مسموح:</span>
          </div>
          <div className="text-2xl font-black font-mono text-amber-300">
            {rail.maxSafeVoltage}V
          </div>
          <div className="text-[10px] text-gray-400">لا تتجاوز هذا الرقم نهائياً</div>
        </div>

        {/* حد الأمبير على الباور سبلاي */}
        <div className="p-4 rounded-xl bg-sky-950/30 border border-sky-500/40 space-y-1">
          <div className="text-[11px] font-bold text-sky-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            <span>أقصى تيار (Current Limit):</span>
          </div>
          <div className="text-2xl font-black font-mono text-sky-300">
            {rail.maxSafeCurrent}A
          </div>
          <div className="text-[10px] text-gray-400">حد ضبط الباور سبلاي</div>
        </div>

        {/* منطقة الخطر */}
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 space-y-1">
          <div className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>منطقة احتراق المكونات:</span>
          </div>
          <div className="text-2xl font-black font-mono text-rose-400">
            &gt; {rail.dangerZone}V
          </div>
          <div className="text-[10px] text-rose-300">تدمير مباشر للمعالج والرقاقات</div>
        </div>
      </div>

      {/* تفاصيل المكونات المتوقعة وتعليمات المعمل */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        <div className="p-3.5 bg-gray-950 border border-gray-800 rounded-xl space-y-1.5">
          <div className="text-xs font-bold text-dahab-400 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5" />
            <span>المكونات الأكثر احتمالية للانصهار أولاً تحت الرجينة أو الكاميرا:</span>
          </div>
          <p className="text-xs text-gray-200 leading-relaxed font-semibold">
            {rail.firstSuspects}
          </p>
        </div>

        <div className="p-3.5 bg-gray-950 border border-gray-800 rounded-xl space-y-1.5">
          <div className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            <span>توجيهات معمل الصيانة:</span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            {rail.notes}
          </p>
        </div>
      </div>

      {/* Modal إضافة/تعديل مسار مخصص */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-workshop-card border border-workshop-border rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-200">
                {editingRail ? 'تعديل المسار' : 'إضافة مسار مخصص'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingRail(null);
                  setNewRail({
                    name: '',
                    nominalVoltage: 0,
                    maxSafeVoltage: 0,
                    recommendedVoltage: 0,
                    maxSafeCurrent: 0,
                    dangerZone: 0,
                    firstSuspects: '',
                    notes: '',
                  });
                }}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">اسم المسار *</label>
                <input
                  type="text"
                  value={newRail.name}
                  onChange={(e) => setNewRail({ ...newRail, name: e.target.value })}
                  placeholder="مثال: PP_5V_USB"
                  className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-200 outline-none focus:border-dahab-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">الجهد النموذجي (V) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newRail.nominalVoltage}
                    onChange={(e) => setNewRail({ ...newRail, nominalVoltage: parseFloat(e.target.value) || 0 })}
                    placeholder="3.8"
                    className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-200 outline-none focus:border-dahab-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">أقصى فولت مسموح (V)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newRail.maxSafeVoltage}
                    onChange={(e) => setNewRail({ ...newRail, maxSafeVoltage: parseFloat(e.target.value) || 0 })}
                    placeholder="3.8"
                    className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-200 outline-none focus:border-dahab-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">فولت الحقن المقترح (V)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newRail.recommendedVoltage}
                    onChange={(e) => setNewRail({ ...newRail, recommendedVoltage: parseFloat(e.target.value) || 0 })}
                    placeholder="1.8"
                    className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-200 outline-none focus:border-dahab-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">أقصى تيار (A)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newRail.maxSafeCurrent}
                    onChange={(e) => setNewRail({ ...newRail, maxSafeCurrent: parseFloat(e.target.value) || 0 })}
                    placeholder="3.0"
                    className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-200 outline-none focus:border-dahab-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">منطقة الخطر (V)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newRail.dangerZone}
                    onChange={(e) => setNewRail({ ...newRail, dangerZone: parseFloat(e.target.value) || 0 })}
                    placeholder="4.5"
                    className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-200 outline-none focus:border-dahab-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">المكونات المتوقعة للانصهار</label>
                <textarea
                  value={newRail.firstSuspects}
                  onChange={(e) => setNewRail({ ...newRail, firstSuspects: e.target.value })}
                  placeholder="المكونات التي تسخن أولاً..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-200 outline-none focus:border-dahab-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">ملاحظات وتوجيهات</label>
                <textarea
                  value={newRail.notes}
                  onChange={(e) => setNewRail({ ...newRail, notes: e.target.value })}
                  placeholder="تعليمات إضافية..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-200 outline-none focus:border-dahab-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={editingRail ? handleSaveEdit : handleAddRail}
                className="flex-1 px-4 py-2 rounded-xl bg-dahab-500 hover:bg-dahab-600 text-slate-950 text-xs font-black transition shadow-sm"
              >
                {editingRail ? 'حفظ التعديل' : 'إضافة'}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingRail(null);
                  setNewRail({
                    name: '',
                    nominalVoltage: 0,
                    maxSafeVoltage: 0,
                    recommendedVoltage: 0,
                    maxSafeCurrent: 0,
                    dangerZone: 0,
                    firstSuspects: '',
                    notes: '',
                  });
                }}
                className="flex-1 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold transition"
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
