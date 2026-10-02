'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DeviceSpecialty, PowerSupplyReadings, DiagnosticMetrics } from '@/lib/types';

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
