'use client';

import React, { createContext, useContext, useState } from 'react';
import { Employee, MatrixRules } from '../../types';

interface AppState {
  matrixRules: MatrixRules;
  setMatrixRules: React.Dispatch<React.SetStateAction<MatrixRules>>;
  globalBudgetPct: number;
  setGlobalBudgetPct: React.Dispatch<React.SetStateAction<number>>;
  prorateHires: boolean;
  setProrateHires: React.Dispatch<React.SetStateAction<boolean>>;
  roster: Employee[];
  setRoster: React.Dispatch<React.SetStateAction<Employee[]>>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [globalBudgetPct, setGlobalBudgetPct] = useState<number>(3.5);
  const [prorateHires, setProrateHires] = useState<boolean>(true);
  const [roster, setRoster] = useState<Employee[]>([]);
  const [matrixRules, setMatrixRules] = useState<MatrixRules>({
    outstanding: [8.0, 6.0, 4.0],
    exceedsExpectations: [6.0, 4.5, 3.0],
    meetsExpectations: [4.0, 3.0, 1.5],
    needsImprovement: [0.0, 0.0, 0.0]
  });

  return (
    <AppContext.Provider value={{
      matrixRules, setMatrixRules,
      globalBudgetPct, setGlobalBudgetPct,
      prorateHires, setProrateHires,
      roster, setRoster
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppState must be used inside an AppProvider');
  return context;
}
