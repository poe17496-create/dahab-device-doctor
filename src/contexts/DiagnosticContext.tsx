'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { DeviceSpecialty, PowerSupplyReadings, DiagnosticMetrics } from '@/lib/types';

interface DailyStats {
  date: string;
  diagnosisCount: number;
  totalMinutes: number;
}

interface DiagnosticContextType {
  deviceModel: string;
  setDeviceModel: (model: string) => void;
  specialty: DeviceSpecialty;
  setSpecialty: (specialty: DeviceSpecialty) => void;
  readings: PowerSupplyReadings;
  setReadings: (readings: PowerSupplyReadings) => void;
  metrics: DiagnosticMetrics | undefined;
  setMetrics: (metrics: DiagnosticMetrics | undefined) => void;
  boardData: any;
  setBoardData: (data: any) => void;
  calculatorContext: {
    selectedRail: string;
    recommendedVoltage: number;
    maxSafeVoltage: number;
    maxSafeCurrent: number;
  } | null;
  setCalculatorContext: (context: any) => void;
  checklistProgress: {
    total: number;
    completed: number;
    items: any[];
  };
  setChecklistProgress: (progress: any) => void;
  // Productivity tracking
  recordDiagnosis: (minutesSpent: number) => void;
  getProductivityStats: () => DailyStats[];
}

const DiagnosticContext = createContext<DiagnosticContextType | undefined>(undefined);

export function DiagnosticProvider({ children }: { children: ReactNode }) {
  const [deviceModel, setDeviceModel] = useState('');
  const [specialty, setSpecialty] = useState<DeviceSpecialty>('mobile-repair');
  const [readings, setReadings] = useState<PowerSupplyReadings>({});
  const [metrics, setMetrics] = useState<DiagnosticMetrics | undefined>(undefined);
  const [boardData, setBoardData] = useState<any>(null);
  const [calculatorContext, setCalculatorContext] = useState<any>(null);
  const [checklistProgress, setChecklistProgress] = useState({
    total: 0,
    completed: 0,
    items: [],
  });

  // Record a diagnosis completion
  const recordDiagnosis = (minutesSpent: number) => {
    if (typeof window === 'undefined') return;

    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem('dahab_productivity_stats');
    let stats: DailyStats[] = saved ? JSON.parse(saved) : [];

    // Find or create today's entry
    const todayIndex = stats.findIndex(s => s.date === today);
    if (todayIndex >= 0) {
      stats[todayIndex].diagnosisCount += 1;
      stats[todayIndex].totalMinutes += minutesSpent;
    } else {
      stats.push({
        date: today,
        diagnosisCount: 1,
        totalMinutes: minutesSpent,
      });
    }

    // Keep only last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    stats = stats.filter(s => new Date(s.date) >= thirtyDaysAgo);

    localStorage.setItem('dahab_productivity_stats', JSON.stringify(stats));
  };

  // Get all productivity stats
  const getProductivityStats = (): DailyStats[] => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('dahab_productivity_stats');
    return saved ? JSON.parse(saved) : [];
  };

  return (
    <DiagnosticContext.Provider
      value={{
        deviceModel,
        setDeviceModel,
        specialty,
        setSpecialty,
        readings,
        setReadings,
        metrics,
        setMetrics,
        boardData,
        setBoardData,
        calculatorContext,
        setCalculatorContext,
        checklistProgress,
        setChecklistProgress,
        recordDiagnosis,
        getProductivityStats,
      }}
    >
      {children}
    </DiagnosticContext.Provider>
  );
}

export function useDiagnosticContext() {
  const context = useContext(DiagnosticContext);
  if (context === undefined) {
    throw new Error('useDiagnosticContext must be used within a DiagnosticProvider');
  }
  return context;
}
