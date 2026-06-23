'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Sliders, Percent, ArrowRight, ShieldCheck, DollarSign } from 'lucide-react';
import { useAppState } from './context/AppContext';
import { MatrixRules } from '../types';

export default function PlanningPage() {
  const router = useRouter();

  // 1. Pull global state setters and keys directly from AppContext
  const {
    globalBudgetPct,
    setGlobalBudgetPct,
    prorateHires,
    setProrateHires,
    matrixRules,
    setMatrixRules
  } = useAppState();

  // 2. Input state modifier function linked to AppContext
  const handleMatrixChange = (rating: keyof MatrixRules, index: number, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setMatrixRules((prev) => {
      const updatedRow = [...prev[rating]];
      updatedRow[index] = numValue;
      return { ...prev, [rating]: updatedRow };
    });
  };

  // 3. Action submission pipeline advancing to Step 2 Ingestion
  const handleLockStrategy = (e: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    e.preventDefault();
    router.push('/upload');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans">
      {/* HEADER SECTION */}
      <header className="border-b border-gray-200 pb-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
            <Sliders className="h-8 w-8 text-blue-600" />
            Merit Cycle Strategy Configuration
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Phase 1: Define global budgeting guidelines and modeling rules prior to employee roster ingestion.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium self-start md:self-auto">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          Pre-Cycle Design Active
        </div>
      </header>

      <form onSubmit={handleLockStrategy} className="space-y-8">
        {/* BUDGET MATRIX CAP FIELD */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
              <Percent className="h-4 w-4 text-gray-500" />
              Global Merit Budget Pool Target
            </label>
            <p className="text-xs text-gray-400 mb-4">
              Defines the maximum funding allocation pool as a percentage of overall base payroll.
            </p>
            <div className="relative max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="number" min="0" max="20" step="0.1"
                value={globalBudgetPct}
                onChange={(e) => setGlobalBudgetPct(parseFloat(e.target.value) || 0)}
                className="block w-full pl-9 pr-12 py-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 font-medium"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-sm font-semibold text-gray-500">% pool</span>
              </div>
            </div>
          </div>

          {/* DYNAMIC TENURE SLIDER TOGGLE */}
          <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-gray-200 pt-6 md:pt-0 md:pl-8">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-semibold text-gray-900 block">Tenure Proration Strategy</label>
                <span className="text-xs text-gray-400 block max-w-sm">
                  Automatically scales recommended increases by 50% for dynamic mid-year new hires.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setProrateHires(!prorateHires)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  prorateHires ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${prorateHires ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </section>

        {/* INTERACTIVE MERIT MATRIX TABLE */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">Merit Increase Matrix Guidelines</h2>
            <p className="text-xs text-gray-400 mt-1">
              Cross-reference framework strategy. Employees positioned low in their range (Quartile 1) should receive higher base target raises than employees already highly penetrated (Quartile 4).
            </p>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs uppercase bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                <tr>
                  <th scope="col" className="px-6 py-4 w-1/4">Performance Rating</th>
                  <th scope="col" className="px-6 py-4 text-center bg-blue-50/40 text-blue-900">Quartile 1 (CR &lt; 0.80)</th>
                  <th scope="col" className="px-6 py-4 text-center bg-blue-50/70 text-blue-900">Quartiles 2 & 3 (0.80 - 1.20)</th>
                  <th scope="col" className="px-6 py-4 text-center bg-blue-50/40 text-blue-900">Quartile 4 (CR &gt; 1.20)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-medium">
                {/* OUTSTANDING ROW */}
                <tr className="bg-white">
                  <td className="px-6 py-4 font-bold text-gray-900">Outstanding</td>
                  {[0, 1, 2].map((idx) => (
                    <td key={`out-${idx}`} className="px-6 py-3 text-center">
                      <input
                        type="number" step="0.1" min="0" max="25"
                        value={matrixRules.outstanding[idx]}
                        onChange={(e) => handleMatrixChange('outstanding', idx, e.target.value)}
                        className="w-16 bg-gray-50 text-center border border-gray-300 rounded p-1 font-semibold text-gray-800"
                      /> %
                    </td>
                  ))}
                </tr>
                {/* EXCEEDS EXPECTATIONS ROW */}
                <tr className="bg-white">
                  <td className="px-6 py-4 font-bold text-gray-900">Exceeds Expectations</td>
                  {[0, 1, 2].map((idx) => (
                    <td key={`exc-${idx}`} className="px-6 py-3 text-center">
                      <input
                        type="number" step="0.1" min="0" max="25"
                        value={matrixRules.exceedsExpectations[idx]}
                        onChange={(e) => handleMatrixChange('exceedsExpectations', idx, e.target.value)}
                        className="w-16 bg-gray-50 text-center border border-gray-300 rounded p-1 font-semibold text-gray-800"
                      /> %
                    </td>
                  ))}
                </tr>
                {/* MEETS EXPECTATIONS ROW */}
                <tr className="bg-white">
                  <td className="px-6 py-4 font-bold text-gray-900">Meets Expectations</td>
                  {[0, 1, 2].map((idx) => (
                    <td key={`met-${idx}`} className="px-6 py-3 text-center">
                      <input
                        type="number" step="0.1" min="0" max="25"
                        value={matrixRules.meetsExpectations[idx]}
                        onChange={(e) => handleMatrixChange('meetsExpectations', idx, e.target.value)}
                        className="w-16 bg-gray-50 text-center border border-gray-300 rounded p-1 font-semibold text-gray-800"
                      /> %
                    </td>
                  ))}
                </tr>
                {/* NEEDS IMPROVEMENT ROW (DISABLED) */}
                <tr className="bg-white opacity-60">
                  <td className="px-6 py-4 font-bold text-gray-400">Needs Improvement</td>
                  {[0, 1, 2].map((idx) => (
                    <td key={`nee-${idx}`} className="px-6 py-3 text-center">
                      <input
                        type="number" value={0} disabled
                        className="w-16 bg-gray-200 text-center border border-gray-300 rounded p-1 text-gray-400"
                      /> %
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* SUBMIT BUTTON */}
        <div className="flex justify-end pt-4">
          <button type="submit" className="inline-flex items-center justify-center px-6 py-3 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm group">
            Lock Parameters & Continue
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </form>
    </div>
  );
}
