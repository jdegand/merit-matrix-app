export interface MatrixRules {
  needsImprovement: number[];   // Index 0 = Q1, Index 1 = Q2/Q3, Index 2 = Q4
  meetsExpectations: number[];
  exceedsExpectations: number[];
  outstanding: number[];
}
export interface Employee {
  employeeId: string;
  fullName: string;
  jobTitle: string;
  department: string;
  currentSalary: number;
  marketMidpoint: number;
  performanceRating: 'Needs Improvement' | 'Meets' | 'Exceeds' | 'Outstanding';
  hireDate: string;
  
  // Calculated Fields added via processing
  compaRatio: number;
  quartile: 1 | 2 | 3 | 4;
  recommendedRaisePct: number;
  calculatedRaiseDollars: number;
  newSalary: number;
  isProrated: boolean;
  manualOverrideRaisePct?: number; // Tracks step 4 variance overrides
}
export interface CycleMetrics {
  totalCurrentPayroll: number;
  allowedBudgetPool: number;
  projectedSpend: number;
  variance: number;
}
