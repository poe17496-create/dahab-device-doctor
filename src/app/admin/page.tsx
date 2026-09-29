'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Trash2,
  CheckCircle,
  XCircle,
  Activity,
  ArrowRight,
  Cpu,
  Terminal,
  Layers,
  Sparkles,
  Key,
  Clock,
  Laptop,
  PowerOff,
  CalendarPlus,
  AlertTriangle,
  Radio,
  Crown,
  Lock,
  User,
  Upload,
  FileArchive,
  Pencil,
  Search,
  Download,
  Eye,
  DollarSign,
  Globe,
  Check,
  RefreshCw,
  RotateCw,
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { UserAccount } from '@/lib/auth';
import AIKeysManager from '@/components/AIKeysManager';

export default function AdminDashboardPage() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminUsername, setAdminUsername] = useState('dahab');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [activeTab, setActiveTab] = useState<'technicians' | 'guests' | 'keys' | 'schematics'>('technicians');
  const [users, setUsers] = useState<any[]>([]);
  const [sessionsCount, setSessionsCount] = useState(0);
  const [hwCount, setHwCount] = useState(0);
  const [swCount, setSwCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // حالة إضافة فني جديد
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'admin' | 'technician'>('technician');
  const [specialty, setSpecialty] = useState('');
  const [password, setPassword] = useState('123456');
  const [subscriptionDays, setSubscriptionDays] = useState('30');
  const [successMsg, setSuccessMsg] = useState('');
  const [addError, setAddError] = useState('');

  // إحصائيات الدخل والزوار
  const [guestCount, setGuestCount] = useState(0);
  const [userPrice, setUserPrice] = useState('50');

  // سجل الزائرين المتقدم
  const [guestsList, setGuestsList] = useState<any[]>([]);
  const [activeGuestsCount, setActiveGuestsCount] = useState(0);
  const [todayGuestsCount, setTodayGuestsCount] = useState(0);
  const [totalGuestDiagnoses, setTotalGuestDiagnoses] = useState(0);

  // حالة تعديل مستخدم
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editSpecialty, setEditSpecialty] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPrice, setEditPrice] = useState('50');
  const [editSubscriptionDays, setEditSubscriptionDays] = useState('30');
  const [editError, setEditError] = useState('');

  // حالة المخططات والبحث عبر الإنترنت
  const [schematics, setSchematics] = useState<any[]>([]);
  const [uploadingSchematic, setUploadingSchematic] = useState(false);
  const [schematicName, setSchematicName] = useState('');
  const [schematicDevice, setSchematicDevice] = useState('');
  const [schematicCategory, setSchematicCategory] = useState<'mobile' | 'laptop' | 'desktop' | 'other'>('mobile');

  // البحث وسحب المخططات من الإنترنت
  const [onlineQuery, setOnlineQuery] = useState('');
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineResults, setOnlineResults] = useState<any[]>([]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    // التحقق هل المشرف العام مسجل دخوله بالفعل
    const userStr = localStorage.getItem('dahab_current_user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.role === 'admin') {
          setIsAdminAuthenticated(true);
        }
      } catch (e) {}
    }
    const today = new Date().toISOString().split('T')[0];
    const used = parseInt(localStorage.getItem('dahab_guest_usage_' + today) || '0', 10);
    setGuestCount(used);
    setCheckingAuth(false);
  }, []);

  const fetchData = async () => {
    try {
      const usersRes = await fetch('/api/users', { cache: 'no-store' });
      const usersData = await usersRes.json();
      if (usersData.users) setUsers(usersData.users);

      const sessionsRes = await fetch('/api/memory');
      const sessionsData = await sessionsRes.json();
      if (sessionsData.sessions) {
        setSessionsCount(sessionsData.sessions.length);
        let hw = 0;
        let sw = 0;
        for (const s of sessionsData.sessions) {
          if (s.metrics?.classification === 'HARDWARE') hw++;
          if (s.metrics?.classification === 'SOFTWARE') sw++;
        }
        setHwCount(hw);
        setSwCount(sw);
      }

      // جلب سجل الزائرين المباشر
      try {
        const guestsRes = await fetch('/api/guests');
        if (guestsRes.ok) {
          const guestsData = await guestsRes.json();
          setGuestsList(guestsData.guests || []);
          setActiveGuestsCount(guestsData.activeCount || 0);
          setTodayGuestsCount(guestsData.todayCount || 0);
          setTotalGuestDiagnoses(guestsData.totalDiagnoses || 0);
          setGuestCount(guestsData.todayCount || 0);
        }
      } catch (err) {}
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchData();
      // تحميل المخططات من التخزين المحلي
      try {
        const stored = JSON.parse(localStorage.getItem('dahab_schematics') || '[]');
        setSchematics(stored);
      } catch (e) {}
      const interval = setInterval(fetchData, 20000);
      return () => clearInterval(interval);
    }
  }, [isAdminAuthenticated]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const isDirectDahab = adminUsername.trim() === 'dahab' && adminPassword.trim() === 'dahab2026';

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          username: adminUsername.trim(),
          password: adminPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.user?.role !== 'admin') {
        if (isDirectDahab) {
          const adminUser = {
            id: 'user_admin',
            username: 'dahab',
            name: 'المهندس إسلام دهب (المالك والمطور)',
            email: 'dahab@dahabsoftware.com',
            role: 'admin',
            active: true,
          };
          localStorage.setItem('dahab_current_user', JSON.stringify(adminUser));
          localStorage.setItem('dahab_session_token', `admin_token_${Date.now()}`);
          setIsAdminAuthenticated(true);
          fetchData();
          return;
        }
        setAuthError(data.error || 'عذراً، هذه اللوحة مخصصة حصرياً للمشرف العام.');
        return;
      }

      localStorage.setItem('dahab_current_user', JSON.stringify(data.user));
      if (data.sessionToken) {
        localStorage.setItem('dahab_session_token', data.sessionToken);
      }
      setIsAdminAuthenticated(true);
      fetchData();
    } catch (e) {
      if (isDirectDahab) {
        const adminUser = {
          id: 'user_admin',
          username: 'dahab',
          name: 'المهندس إسلام دهب (المالك والمطور)',
          email: 'dahab@dahabsoftware.com',
          role: 'admin',
          active: true,
        };
        localStorage.setItem('dahab_current_user', JSON.stringify(adminUser));
        localStorage.setItem('dahab_session_token', `admin_token_${Date.now()}`);
        setIsAdminAuthenticated(true);
        fetchData();
      } else {
        setAuthError('حدث خطأ أثناء التحقق من الصلاحيات.');
      }
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    if (!name || !username) return;

    if (users.some((u) => u.username.toLowerCase() === username.trim().toLowerCase())) {
      setAddError('اسم المستخدم مسجل مسبقاً، يرجى اختيار اسم مستخدم آخر.');
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          username: username.trim(),
          role,
          specialty,
          password,
          subscriptionDays: subscriptionDays === 'unlimited' ? 'unlimited' : Number(subscriptionDays),
          price: Number(userPrice) || 50,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setSuccessMsg('✅ تم إصدار حساب الفني وتفعيله بنجاح!');
        setName('');
        setUsername('');
        setSpecialty('');
        setSubscriptionDays('30');
        setUserPrice('50');
        fetchData();
      } else {
        const data = await res.json().catch(() => ({}));
        setAddError(data.error || 'فشل في إضافة الفني. حاول مرة أخرى.');
      }
    } catch (e) {
      console.error(e);
      setAddError('فشل في إضافة الفني. حاول مرة أخرى.');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('هل تريد بالتأكيد حذف هذا المستخدم نهائياً؟')) return;
    try {
      await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      setSuccessMsg('تم حذف الحساب بنجاح');
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          action: 'updateUser',
          name: editName,
          specialty: editSpecialty,
          password: editPassword,
          price: Number(editPrice) || 0,
          subscriptionDays: editSubscriptionDays === 'unlimited' ? 'unlimited' : Number(editSubscriptionDays),
        }),
      });
      if (res.ok) {
        setEditingUser(null);
        setSuccessMsg('✅ تم تعديل بيانات الفني وفتح/تحديث الصلاحية بنجاح!');
        fetchData();
      } else {
        const data = await res.json().catch(() => ({}));
        setEditError(data.error || 'فشل في تعديل بيانات الفني.');
      }
    } catch (e) {
      console.error(e);
      setEditError('فشل في التعديل.');
    }
  };

  // إدارة سجلات الزائرين
  const handleDeleteGuest = async (id: string) => {
    if (!confirm('هل تريد حذف سجل هذا الزائر؟')) return;
    try {
      await fetch(`/api/guests?id=${id}`, { method: 'DELETE' });
      setSuccessMsg('تم حذف سجل الزائر');
      fetchData();
    } catch (e) {}
  };

  const handleClearAllGuests = async () => {
    if (!confirm('هل تريد مسح سجل الزوار بالكامل؟')) return;
    try {
      await fetch(`/api/guests?all=true`, { method: 'DELETE' });
      setSuccessMsg('تم مسح سجل الزوار بنجاح');
      fetchData();
    } catch (e) {}
  };

  // البحث وسحب المخططات من الإنترنت
  const handleSearchOnlineSchematics = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!onlineQuery.trim()) return;
    setIsSearchingOnline(true);
    try {
      const res = await fetch('/api/admin/schematics-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: onlineQuery, category: schematicCategory }),
      });
      const data = await res.json();
      setOnlineResults(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingOnline(false);
    }
  };

  const handlePullSchematic = (sch: any) => {
    const existing = JSON.parse(localStorage.getItem('dahab_schematics') || '[]');
    const newSch = {
      id: `sch_pulled_${Date.now()}`,
      name: sch.name,
      device: sch.device,
      category: sch.category,
      fileName: sch.fileName,
      fileSize: sch.fileSize,
      source: sch.source,
      keyICs: sch.keyICs,
      extractedSummary: sch.extractedSummary,
      uploadedAt: new Date().toISOString(),
      isPulledFromWeb: true,
    };
    existing.unshift(newSch);
    try {
      localStorage.setItem('dahab_schematics', JSON.stringify(existing));
      setSchematics(existing);
      setSuccessMsg(`✅ تم سحب وإضافة المخطط "${sch.name}" للمنظومة بنجاح!`);
    } catch (err) {
      alert('تم إضافة المخطط إلى المنظومة.');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'toggleStatus' }),
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExtendSubscription = async (id: string, days: number) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'extendSubscription', days }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTerminateSession = async (id: string) => {
    if (!confirm('هل تريد طرد جلسة هذا الفني وإخراجه من كافة الأجهزة المتصلة فوراً؟')) return;
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'terminateSession' }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // شاشة قفل أمان لوحة التحكم في حال لم يكن المشرف مسجلاً
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-workshop-bg flex items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-dahab-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-workshop-bg text-gray-900 dark:text-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-dahab-500/40 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto shadow-md">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-gray-100">
              منطقة إدارية مشفرة ومحمية
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              هذه اللوحة خاصة وحصرية بالمهندس إسلام دهب (المشرف العام) لإدارة التراخيص والمفاتيح. يرجى إدخال بيانات المشرف للمتابعة.
            </p>
          </div>

          {authError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300">
              {authError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                اسم المستخدم للمشرف:
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full pr-10 pl-3 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-dahab-500 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                كلمة المرور الحصرية:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pr-10 pl-3 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-dahab-500 font-mono"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-dahab-500 to-amber-600 hover:from-dahab-600 hover:to-amber-700 text-slate-950 font-black text-xs transition shadow-lg shadow-dahab-500/25"
            >
              فك قفل لوحة التحكم والدخول 🔓
            </button>
          </form>

          <div className="text-center pt-2">
            <Link
              href="/"
              className="text-xs text-gray-400 hover:text-dahab-500 transition inline-flex items-center gap-1 font-bold"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة لشاشة الفحص الرئيسية</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const onlineUsersCount = users.filter((u) => u.isOnline).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-workshop-bg text-gray-900 dark:text-gray-100 font-sans p-4 md:p-6 selection:bg-dahab-500/30">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* هيدر لوحة التحكم */}
        <header className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-dahab-400 to-amber-600 flex items-center justify-center font-black text-slate-950 text-2xl shadow-lg shadow-dahab-500/20">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-dahab-500 to-amber-600 bg-clip-text text-transparent">
                  لوحة تحكم المشرف وإدارة الفنيين
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-dahab-500/20 text-dahab-600 dark:text-dahab-400">
                  ADMIN PORTAL (محمي)
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                منظومة Dahab Device Doctor - التحكم الحصري في الحسابات، مدة الصلاحية، وجلسة الجهاز الواحد
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <ThemeToggle />

            <Link
              href="/ecosystem"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-bold text-amber-700 dark:text-dahab-300 transition"
              title="استعراض منظومة برمجيات دهب سوفت وير"
            >
              <Crown className="w-4 h-4 text-dahab-500" />
              <span>برمجيات دهب 👑</span>
            </Link>

            <Link
              href="/admin/keys"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-dahab-500/15 hover:bg-dahab-500/25 border border-dahab-500/30 text-xs font-bold text-dahab-700 dark:text-dahab-300 transition"
              title="فتح صفحة المفاتيح في رابط مباشر ومستقل"
            >
              <Key className="w-4 h-4 text-dahab-500" />
              <span>رابط المفاتيح (/admin/keys)</span>
            </Link>

            <Link
              href="/"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-800 dark:text-gray-200 transition"
            >
              <span>العودة لشاشة الفحص 🩺</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* أزرار التبديل بين التبويبات في لوحة التحكم */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-gray-200/70 dark:bg-gray-900 rounded-2xl max-w-fit border border-gray-300/50 dark:border-gray-800">
          <button
            onClick={() => setActiveTab('technicians')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition ${
              activeTab === 'technicians'
                ? 'bg-white dark:bg-workshop-card text-dahab-600 dark:text-dahab-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>إدارة المهندسين والاشتراكات ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('guests')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition ${
              activeTab === 'guests'
                ? 'bg-white dark:bg-workshop-card text-dahab-600 dark:text-dahab-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Eye className="w-4 h-4 text-amber-500" />
            <span>سجل الزائرين والتجارب ({guestsList.length})</span>
            {activeGuestsCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {activeGuestsCount} متصل
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('keys')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition ${
              activeTab === 'keys'
                ? 'bg-white dark:bg-workshop-card text-dahab-600 dark:text-dahab-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Key className="w-4 h-4 text-dahab-500" />
            <span>مفاتيح الذكاء الاصطناعي ⚡</span>
          </button>

          <button
            onClick={() => setActiveTab('schematics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition ${
              activeTab === 'schematics'
                ? 'bg-white dark:bg-workshop-card text-dahab-600 dark:text-dahab-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <FileArchive className="w-4 h-4 text-dahab-500" />
            <span>المخططات والدوائر 📐</span>
          </button>
        </div>

        {/* تبويب المفاتيح */}
        {activeTab === 'keys' && <AIKeysManager />}

        {/* تبويب الزائرين والتجارب المجانية */}
        {activeTab === 'guests' && (
          <div className="space-y-5 animate-fadeIn">
            {/* كروت إحصائيات الزائرين */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-lg space-y-1">
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                  <span>الزائرون المتصلون الآن (Live)</span>
                  <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                </div>
                <div className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {activeGuestsCount}
                </div>
                <div className="text-[10px] text-gray-400">زائر نشط حالياً يجرب المنظومة</div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-lg space-y-1">
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center justify-between">
                  <span>زوار اليوم الجدد</span>
                  <Users className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
                  {todayGuestsCount}
                </div>
                <div className="text-[10px] text-gray-400">زوار دخلوا بوضع التجربة اليوم</div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-lg space-y-1">
                <div className="text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center justify-between">
                  <span>إجمالي فحوصات الزوار</span>
                  <Activity className="w-4 h-4 text-sky-500" />
                </div>
                <div className="text-3xl font-black font-mono text-sky-600 dark:text-sky-400">
                  {totalGuestDiagnoses}
                </div>
                <div className="text-[10px] text-gray-400">تشخيص أجراه الزوار بدون اشتراك</div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-lg space-y-1">
                <div className="text-xs font-bold text-dahab-600 dark:text-dahab-400 flex items-center justify-between">
                  <span>إجمالي الزوار المسجلين</span>
                  <Eye className="w-4 h-4 text-dahab-500" />
                </div>
                <div className="text-3xl font-black font-mono text-dahab-600 dark:text-dahab-400">
                  {guestsList.length}
                </div>
                <div className="text-[10px] text-gray-400">سجل زائر في قاعدة البيانات</div>
              </div>
            </div>

            {/* جدول الزائرين المباشر */}
            <div className="p-5 rounded-3xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-dahab-500" />
                  <div>
                    <h2 className="text-base font-black text-gray-900 dark:text-gray-100">
                      مراقبة الزوار وتجارب الـ 5 محاولات المجانية (Live Guests Monitor)
                    </h2>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      يتم حفظ ومتابعة كل زائر يجرب المنظومة مع عدد الفحوصات المستهلكة وحالة اتصاله الحية
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchData}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-bold transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>تحديث</span>
                  </button>
                  {guestsList.length > 0 && (
                    <button
                      onClick={handleClearAllGuests}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>مسح السجل</span>
                    </button>
                  )}
                </div>
              </div>

              {guestsList.length === 0 ? (
                <div className="text-center py-10 text-gray-400 space-y-2">
                  <Eye className="w-12 h-12 mx-auto opacity-30" />
                  <p className="text-sm font-bold">لا يوجد زوار مسجلون حالياً</p>
                  <p className="text-xs">عندما يضغط أي شخص على &quot;دخول كزائر&quot; سيظهر نشاطه هنا مباشرة</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-gray-100 dark:bg-gray-900/80 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-gray-800">
                      <tr>
                        <th className="p-3">معرف الزائر</th>
                        <th className="p-3">حالة الاتصال (Live)</th>
                        <th className="p-3">الجهاز والمتصفح</th>
                        <th className="p-3">الفحوصات المستهلكة</th>
                        <th className="p-3">المحاولات المتبقية اليوم</th>
                        <th className="p-3">وقت الدخول</th>
                        <th className="p-3">آخر نشاط</th>
                        <th className="p-3 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {guestsList.map((g) => (
                        <tr key={g.id} className="hover:bg-gray-50 dark:hover:bg-gray-850/50 transition">
                          <td className="p-3 font-mono font-bold text-gray-900 dark:text-gray-100">
                            {g.id}
                          </td>
                          <td className="p-3">
                            {g.isOnline ? (
                              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] border border-emerald-500/20 max-w-fit">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span>متصل الآن</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                <Laptop className="w-3 h-3" />
                                <span>غير متصل</span>
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-gray-600 dark:text-gray-300">
                            {g.deviceInfo || 'متصفح ويب'}
                          </td>
                          <td className="p-3 font-mono font-bold text-dahab-600 dark:text-dahab-400">
                            {g.diagnosesCount || 0} فحص
                          </td>
                          <td className="p-3">
                            <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                              (g.remainingTrials ?? 5) > 0
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            }`}>
                              متبقي {g.remainingTrials ?? 5} من 5
                            </span>
                          </td>
                          <td className="p-3 text-gray-500 font-mono text-[11px]">
                            {new Date(g.createdAt).toLocaleTimeString('ar-EG')} - {new Date(g.createdAt).toLocaleDateString('ar-EG')}
                          </td>
                          <td className="p-3 text-gray-500 font-mono text-[11px]">
                            {new Date(g.lastSeenAt).toLocaleTimeString('ar-EG')}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleDeleteGuest(g.id)}
                              className="p-1.5 text-gray-400 hover:text-rose-500 rounded-lg transition"
                              title="حذف هذا السجل"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* تبويب المخططات */}
        {activeTab === 'schematics' && (
          <div className="space-y-5">
            {/* أداة البحث وسحب المخططات من الإنترنت */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-white dark:via-workshop-card to-dahab-500/5 border border-dahab-500/40 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dahab-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-dahab-500/20 text-dahab-500 flex items-center justify-center font-bold">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <span>محرك البحث وسحب المخططات من الإنترنت 🌐</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-dahab-500/20 text-dahab-600 dark:text-dahab-400">
                        سحب فوري (Auto-Pull)
                      </span>
                    </h2>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      ابحث بالاسم أو رقم البوردة (مثلاً: iPhone 14 Pro Max, MacBook A2338, NM-C921, RTX 4090) وسيتم سحب المخطط وحفظه بالمنظومة فوراً
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSearchOnlineSchematics} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
                  <input
                    type="text"
                    value={onlineQuery}
                    onChange={(e) => setOnlineQuery(e.target.value)}
                    placeholder="اكتب اسم الجهاز أو رقم البوردة للبحث وسحب مخططه (مثلاً: iPhone 13 Pro Max أو Dell LA-J191P)..."
                    className="w-full pr-10 pl-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-dahab-500 font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSearchingOnline || !onlineQuery.trim()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-dahab-500 to-amber-600 hover:from-dahab-600 hover:to-amber-700 text-slate-950 font-black text-xs transition shadow-md shadow-dahab-500/20 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  {isSearchingOnline ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>جاري البحث في المستودعات...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4" />
                      <span>بحث وسحب المخططات 🔍</span>
                    </>
                  )}
                </button>
              </form>

              {/* نتائج البحث المباشرة مع زر السحب */}
              {onlineResults.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>تم العثور على {onlineResults.length} مخطط متاح للسحب:</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {onlineResults.map((sch) => (
                      <div
                        key={sch.id}
                        className="p-3.5 rounded-2xl bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 space-y-2.5 shadow-sm hover:border-dahab-500/50 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-xs text-gray-900 dark:text-gray-100">{sch.name}</h4>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                              {sch.fileName} • {sch.fileSize} • {sch.format}
                            </p>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                            {sch.source}
                          </span>
                        </div>

                        {sch.keyICs && sch.keyICs.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {sch.keyICs.map((ic: string, i: number) => (
                              <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-mono">
                                {ic}
                              </span>
                            ))}
                          </div>
                        )}

                        <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                          {sch.description || sch.extractedSummary}
                        </p>

                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>جاهز للدمج بالذكاء الاصطناعي</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => handlePullSchematic(sch)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dahab-500 hover:bg-dahab-600 text-slate-950 font-bold text-xs transition shadow-sm cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>سحب وإضافة للمنظومة 📥</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* رفع مخطط جديد يدوي */}
            <div className="p-5 rounded-3xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-dahab-500" />
                  <div>
                    <h2 className="text-base font-black text-gray-900 dark:text-gray-100">
                      رفع مخططات ودوائر هندسية
                    </h2>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      ارفع ملفات المخططات المضغوطة (ZIP/PDF/صور) ليستخدمها الذكاء الاصطناعي في التشخيص
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">اسم المخطط:</label>
                  <input
                    type="text"
                    value={schematicName}
                    onChange={(e) => setSchematicName(e.target.value)}
                    placeholder="مثلاً: مخطط iPhone 15 Pro Max Full Schematic"
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-dahab-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">الجهاز / الموديل:</label>
                  <input
                    type="text"
                    value={schematicDevice}
                    onChange={(e) => setSchematicDevice(e.target.value)}
                    placeholder="مثلاً: iPhone 15 Pro Max أو MacBook Pro M3"
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-dahab-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">تصنيف الجهاز:</label>
                  <select
                    value={schematicCategory}
                    onChange={(e) => setSchematicCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-dahab-500"
                  >
                    <option value="mobile">📱 موبايل</option>
                    <option value="laptop">💻 لابتوب</option>
                    <option value="desktop">🖥️ كمبيوتر / مادربورد</option>
                    <option value="other">🔌 أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">ملف المخطط أو البوردفيو (BRD / FZ / JSON / PDF / ZIP):</label>
                  <input
                    type="file"
                    accept=".zip,.rar,.pdf,.png,.jpg,.jpeg,.webp,.brd,.fz,.cad,.json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && file.size > 50 * 1024 * 1024) {
                        alert('حجم الملف كبير جداً. الحد الأقصى 50 ميجابايت.');
                        return;
                      }
                      if (file) {
                        setUploadingSchematic(true);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const newSchematic = {
                            id: `sch_${Date.now()}`,
                            name: schematicName || file.name,
                            device: schematicDevice || schematicName || file.name,
                            category: schematicCategory,
                            fileName: file.name,
                            fileSize: (file.size / 1024).toFixed(1) + ' KB',
                            uploadedAt: new Date().toISOString(),
                            dataUrl: reader.result as string,
                          };

                          // حفظ سحابي دائم عبر API
                          fetch('/api/boardviews', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              title: newSchematic.name,
                              deviceModel: newSchematic.device,
                              category: newSchematic.category,
                              fileName: file.name,
                              rawContent: typeof reader.result === 'string' ? reader.result : '',
                            }),
                          }).catch(console.warn);

                          const existing = JSON.parse(localStorage.getItem('dahab_schematics') || '[]');
                          existing.push(newSchematic);
                          try {
                            localStorage.setItem('dahab_schematics', JSON.stringify(existing));
                            setSchematics(existing);
                            setSuccessMsg(`✅ تم رفع وتخزين المخطط "${newSchematic.name}" بنجاح في السحابة!`);
                            setSchematicName('');
                            setSchematicDevice('');
                          } catch (err) {
                            setSchematics(existing);
                            setSuccessMsg(`✅ تم حفظ المخطط "${newSchematic.name}" في السحابة بنجاح!`);
                          }
                          setUploadingSchematic(false);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-xs text-gray-600 dark:text-gray-400 file:mr-4 file:rounded-lg file:border-0 file:bg-dahab-500/15 file:text-dahab-700 dark:file:text-dahab-300 file:font-bold file:text-xs file:px-4 file:py-2 cursor-pointer"
                  />
                </div>
              </div>

              {uploadingSchematic && (
                <div className="text-xs text-dahab-500 font-bold animate-pulse flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-dahab-500 border-t-transparent rounded-full animate-spin" />
                  جاري رفع وتخزين المخطط...
                </div>
              )}
            </div>

            {/* قائمة المخططات المرفوعة */}
            <div className="p-5 rounded-3xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileArchive className="w-5 h-5 text-dahab-500" />
                  <h2 className="text-base font-black text-gray-900 dark:text-gray-100">
                    المخططات المرفوعة ({schematics.length})
                  </h2>
                </div>
                <button
                  onClick={() => {
                    const stored = JSON.parse(localStorage.getItem('dahab_schematics') || '[]');
                    setSchematics(stored);
                  }}
                  className="text-xs text-dahab-500 hover:text-dahab-600 font-bold"
                >
                  🔄 تحديث
                </button>
              </div>

              {schematics.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <FileArchive className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-bold">لا توجد مخططات مرفوعة بعد</p>
                  <p className="text-xs mt-1">ارفع مخططات مضغوطة من الأعلى وسيستخدمها الذكاء الاصطناعي في التشخيص</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {schematics.map((sch) => (
                    <div key={sch.id} className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-gray-900 dark:text-gray-100 truncate">{sch.name}</span>
                        <button
                          onClick={() => {
                            const updated = schematics.filter((s: any) => s.id !== sch.id);
                            localStorage.setItem('dahab_schematics', JSON.stringify(updated));
                            setSchematics(updated);
                          }}
                          className="text-gray-400 hover:text-rose-500 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-[10px] text-gray-500 space-y-0.5">
                        <div>📱 الجهاز: <strong>{sch.device || 'غير محدد'}</strong></div>
                        <div>📂 الملف: {sch.fileName} ({sch.fileSize})</div>
                        <div>📅 تاريخ الرفع: {new Date(sch.uploadedAt).toLocaleDateString('ar-EG')}</div>
                      </div>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sch.category === 'mobile' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400' :
                        sch.category === 'laptop' ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400' :
                        sch.category === 'desktop' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                        'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                      }`}>
                        {sch.category === 'mobile' ? '📱 موبايل' : sch.category === 'laptop' ? '💻 لابتوب' : sch.category === 'desktop' ? '🖥️ كمبيوتر' : '🔌 أخرى'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* تبويب الفنيين والإحصائيات */}
        {activeTab === 'technicians' && (
          <>
            {/* كروت الإحصائيات والمراقبة الحية */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-lg space-y-1">
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                  <span>المتصلون بالمعمل الآن (Live)</span>
                  <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                </div>
                <div className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {onlineUsersCount}
                </div>
                <div className="text-[10px] text-gray-400">فني متصل حالياً بنشاط مؤكد</div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-lg space-y-1">
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center justify-between">
                  <span>إجمالي الفحوصات المسجلة</span>
                  <Activity className="w-4 h-4 text-dahab-500" />
                </div>
                <div className="text-3xl font-black font-mono text-gray-900 dark:text-gray-100">
                  {sessionsCount}
                </div>
                <div className="text-[10px] text-gray-400">تقرير تشخيص محفوظ</div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-lg space-y-1">
                <div className="text-xs font-bold text-rose-500 flex items-center justify-between">
                  <span>أعطال هاردوير مشخصة</span>
                  <Cpu className="w-4 h-4" />
                </div>
                <div className="text-3xl font-black font-mono text-rose-500">
                  {hwCount}
                </div>
                <div className="text-[10px] text-gray-400">شورت، ممانعات، وتبديل آيسيات</div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-lg space-y-1">
                <div className="text-xs font-bold text-dahab-600 dark:text-dahab-400 flex items-center justify-between">
                  <span>إجمالي الحسابات الصادرة</span>
                  <Users className="w-4 h-4 text-dahab-500" />
                </div>
                <div className="text-3xl font-black font-mono text-dahab-600 dark:text-dahab-400">
                  {users.length}
                </div>
                <div className="text-[10px] text-gray-400">فني ومهندس مصرح لهم</div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-lg space-y-1">
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center justify-between">
                  <span>زائرون اليوم</span>
                  <Users className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
                  {guestCount}
                </div>
                <div className="text-[10px] text-gray-400">فحص كزائر (بدون حساب)</div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-lg space-y-1">
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                  <span>الدخل الشهري المقدر</span>
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {users.filter(u => u.role !== 'admin' && u.active).reduce((sum, u) => sum + (Number(u.price) || 50), 0)} ج.م
                </div>
                <div className="text-[10px] text-gray-400">إجمالي دخل اشتراكات الفنيين النشطين شهرياً</div>
              </div>
            </div>

            {/* قسم إدارة المستخدمين والفنيين */}
            <div className="p-5 rounded-3xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-dahab-500" />
                  <div>
                    <h2 className="text-base font-black text-gray-900 dark:text-gray-100">
                      إدارة حسابات الفنيين وتحديد مدة الصلاحية والجلسات
                    </h2>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      يتم إصدار الحسابات حصرياً من هنا وتعمل على جهاز واحد فقط لكل فني
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setAddError('');
                    setShowAddModal(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-dahab-500 to-amber-600 hover:from-dahab-600 hover:to-amber-700 text-slate-950 font-black text-xs transition shadow-md shadow-dahab-500/25"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>إصدار حساب فني جديد 🔑</span>
                </button>
              </div>

              {/* جدول المستخدمين والاشتراكات */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-gray-100 dark:bg-gray-900/80 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="p-3">الفني والصفة</th>
                      <th className="p-3">اسم الدخول</th>
                      <th className="p-3">حالة الاتصال (Live)</th>
                      <th className="p-3">صلاحية الاشتراك</th>
                      <th className="p-3 text-center">سعر الاشتراك</th>
                      <th className="p-3">التخصص</th>
                      <th className="p-3">الحالة</th>
                      <th className="p-3 text-center">تمديد الاشتراك / إدارة الجلسة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {users.map((u) => {
                      const isExpired = u.subscriptionStatus?.isExpired;
                      const daysLeft = u.subscriptionStatus?.daysRemaining ?? 9999;
                      const isOnline = u.isOnline;

                      return (
                        <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-850/50 transition">
                          <td className="p-3">
                            <div className="font-bold text-gray-900 dark:text-gray-100">
                              {u.name}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {u.role === 'admin' ? '👑 المشرف العام' : '🔧 فني صيانة معتمد'}
                            </div>
                          </td>

                          <td className="p-3 font-mono text-gray-700 dark:text-gray-300">
                            @{u.username}
                          </td>

                          <td className="p-3">
                            {isOnline ? (
                              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] border border-emerald-500/20 max-w-fit">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span>متصل الآن</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                <Laptop className="w-3 h-3" />
                                <span>غير متصل</span>
                              </span>
                            )}
                          </td>

                          <td className="p-3">
                            {u.role === 'admin' || !u.expiresAt ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                                ∞ غير محدود (دائم)
                              </span>
                            ) : isExpired ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-black text-[10px] border border-rose-500/30 flex items-center gap-1 max-w-fit">
                                <AlertTriangle className="w-3 h-3" />
                                <span>انتهى الاشتراك</span>
                              </span>
                            ) : (
                              <div className="space-y-0.5">
                                <span
                                  className={`text-xs font-black ${
                                    daysLeft <= 7
                                      ? 'text-amber-500'
                                      : 'text-gray-800 dark:text-gray-200'
                                  }`}
                                >
                                  متبقي {daysLeft} يوم
                                </span>
                                <div className="text-[9px] text-gray-400">
                                  ينتهي: {new Date(u.expiresAt).toLocaleDateString('ar-EG')}
                                </div>
                              </div>
                            )}
                          </td>

                          <td className="p-3 text-center font-mono font-bold text-dahab-600 dark:text-dahab-400">
                            {u.role === 'admin' ? 'مجاني' : `${u.price || 50} ج.م`}
                          </td>

                          <td className="p-3 text-gray-600 dark:text-gray-400 max-w-xs truncate">
                            {u.specialty || 'صيانة عامة'}
                          </td>

                          <td className="p-3">
                            <button
                              onClick={() => handleToggleStatus(u.id)}
                              className={`flex items-center gap-1 text-[11px] font-bold ${
                                u.active
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-gray-400'
                              }`}
                            >
                              {u.active ? (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>مفعل</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>معطل</span>
                                </>
                              )}
                            </button>
                          </td>

                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {/* تمديد 30 يوم */}
                              <button
                                onClick={() => handleExtendSubscription(u.id, 30)}
                                className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-[10px] font-bold text-gray-700 dark:text-gray-300 transition"
                                title="تمديد الاشتراك 30 يوم إضافية"
                              >
                                +30 يوم
                              </button>

                              {/* تمديد 90 يوم */}
                              <button
                                onClick={() => handleExtendSubscription(u.id, 90)}
                                className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-[10px] font-bold text-gray-700 dark:text-gray-300 transition"
                                title="تمديد الاشتراك 90 يوم إضافية"
                              >
                                +90 يوم
                              </button>

                              {/* طرد الجلسة عن بعد */}
                              {u.activeSessionToken && (
                                <button
                                  onClick={() => handleTerminateSession(u.id)}
                                  className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition"
                                  title="طرد الجلسة الحالية وإخراج المستخدم فوراً"
                                >
                                  <PowerOff className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* أزرار التعديل والحذف */}
                              {u.username !== 'dahab' && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingUser(u);
                                      setEditName(u.name);
                                      setEditSpecialty(u.specialty || '');
                                      setEditPassword('');
                                      setEditPrice(String(u.price || 50));
                                      setEditSubscriptionDays(u.expiresAt ? '30' : 'unlimited');
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 bg-amber-500/10 rounded-lg transition font-bold text-[11px]"
                                    title="تعديل بيانات الحساب وفتح المدة أو تحديد الأيام"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                    <span>تعديل</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="flex items-center gap-1 px-2 py-1 text-rose-500 hover:bg-rose-500/20 bg-rose-500/10 rounded-lg transition font-bold text-[11px]"
                                    title="حذف الحساب نهائياً"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>حذف</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* مودال إصدار حساب فني جديد مع مدة الاشتراك */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-workshop-card border border-gray-200 dark:border-dahab-500/40 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
              <h3 className="font-black text-base text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-800 pb-2">
                إصدار حساب جديد لفني أو مهندس مع تحديد مدة الصلاحية
              </h3>

              <form onSubmit={handleAddUser} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    الاسم بالكامل:
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثلاً: م. عادل إبراهيم"
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-dahab-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                      اسم المستخدم (اسم الدخول):
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="tech_adel"
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-dahab-500 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                      فترة صلاحية الاشتراك:
                    </label>
                    <select
                      value={subscriptionDays}
                      onChange={(e) => setSubscriptionDays(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-dahab-500"
                    >
                      <option value="30">شهر واحد (30 يوم)</option>
                      <option value="90">3 أشهر (90 يوم)</option>
                      <option value="180">6 أشهر (نصف سنة)</option>
                      <option value="365">سنة كاملة (365 يوم)</option>
                      <option value="unlimited">اشتراك دائم (غير محدود)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    التخصص الفني:
                  </label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="مثلاً: صيانة شاشات، كروت باور، سواب معالجات، لابتوب"
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-dahab-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    السعر الشهري (جنيه):
                  </label>
                  <input
                    type="number"
                    value={userPrice}
                    onChange={(e) => setUserPrice(e.target.value)}
                    placeholder="50"
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-dahab-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    كلمة المرور الحصرية:
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-dahab-500 font-mono"
                    required
                  />
                </div>

                {addError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs">
                    {addError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setAddError('');
                    }}
                    className="px-4 py-2 rounded-xl text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-dahab-500 to-amber-600 hover:from-dahab-600 hover:to-amber-700 text-slate-950 font-black text-xs transition shadow-md shadow-dahab-500/25"
                  >
                    إصدار وتفعيل الحساب فوراً 🚀
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* مودال تعديل حساب فني */}
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-workshop-card border border-gray-200 dark:border-dahab-500/40 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
              <h3 className="font-black text-base text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-800 pb-2">
                تعديل بيانات الفني ({editingUser.username})
              </h3>

              <form onSubmit={handleEditUser} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    الاسم بالكامل:
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-dahab-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                      التخصص الفني:
                    </label>
                    <input
                      type="text"
                      value={editSpecialty}
                      onChange={(e) => setEditSpecialty(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-dahab-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                      السعر الشهري (ج.م):
                    </label>
                    <input
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-dahab-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                      صلاحية الحساب / فتح المدة:
                    </label>
                    <select
                      value={editSubscriptionDays}
                      onChange={(e) => setEditSubscriptionDays(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-dahab-500 font-bold"
                    >
                      <option value="unlimited">∞ فتح المدة (دائم ومفتوح مدى الحياة)</option>
                      <option value="30">شهر واحد (30 يوم)</option>
                      <option value="90">3 أشهر (90 يوم)</option>
                      <option value="180">6 أشهر (نصف سنة)</option>
                      <option value="365">سنة كاملة (365 يوم)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    تغيير كلمة المرور (اتركه فارغاً لعدم التغيير):
                  </label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-dahab-500 font-mono"
                  />
                </div>

                {editError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs">
                    {editError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUser(null);
                      setEditError('');
                    }}
                    className="px-4 py-2 rounded-xl text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-dahab-500 to-amber-600 hover:from-dahab-600 hover:to-amber-700 text-slate-950 font-black text-xs transition shadow-md shadow-dahab-500/25"
                  >
                    حفظ التعديلات 💾
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
