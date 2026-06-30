'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { Upload, FileSpreadsheet, Loader2, ArrowLeft } from 'lucide-react';
import { useAppState } from '../context/AppContext';
import { Employee, MatrixRules } from '../../types';

export default function UploadPage() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Pull global context parameters and state setters
  const { matrixRules, prorateHires, setRoster } = useAppState();

  // Core functional mapping engine mimicking an API processing node pipeline
  const processRosterData = (rawRows: any[], currentRules: MatrixRules, prorateEnabled: boolean): Employee[] => {
    return rawRows.map((row) => {
      const currentSalary = parseFloat(row.currentSalary) || 0;
      const marketMidpoint = parseFloat(row.marketMidpoint) || 0;

      // Calculate individual compa-ratios
      const compaRatio = marketMidpoint > 0 ? currentSalary / marketMidpoint : 0;

      // Categorize salary position by corporate range quartiles
      let quartile: 1 | 2 | 3 | 4 = 2;
      if (compaRatio < 0.80) quartile = 1;
      else if (compaRatio >= 0.80 && compaRatio < 1.0) quartile = 2;
      else if (compaRatio >= 1.0 && compaRatio <= 1.20) quartile = 3;
      else quartile = 4;

      // Extract recommended guidelines using matrix mapping rules
      // Map the performance rating to the correct MatrixRules key
      const rating = row.performanceRating || 'Meets Expectations';
      let ratingKey: keyof MatrixRules;

      switch (rating) {
        case 'Needs Improvement':
          ratingKey = 'needsImprovement';
          break;
        case 'Meets Expectations':
        case 'Meets':
          ratingKey = 'meetsExpectations';
          break;
        case 'Exceeds Expectations':
        case 'Exceeds':
          ratingKey = 'exceedsExpectations';
          break;
        default:
          ratingKey = 'outstanding';
      }

      // Extract recommended guidelines using matrix mapping rules
      const ruleRow = currentRules[ratingKey] || [0.0, 0.0, 0.0];

      // Match the correct percentile array indexes: Index 0=Q1, 1=Q2/Q3, 2=Q4
      let matrixIndex = 1;
      if (quartile === 1) matrixIndex = 0;
      if (quartile === 4) matrixIndex = 2;

      const baseRecommendedPct = ruleRow[matrixIndex] || 0;

      // Evaluate calendar dates to determine new-hire proration status
      let isProrated = false;
      let finalRaisePct = baseRecommendedPct;

      if (prorateEnabled && row.hireDate) {
        const hireDate = new Date(row.hireDate);
        const cutoffDate = new Date('2025-07-01'); // Standard mid-cycle barrier rule
        if (hireDate > cutoffDate) {
          isProrated = true;
          finalRaisePct = baseRecommendedPct * 0.5; // Scale raise by 50%
        }
      }

      const calculatedRaiseDollars = currentSalary * (finalRaisePct / 100);

      return {
        employeeId: row.employeeId || 'UNKNOWN',
        fullName: row.fullName || 'Anonymous Employee',
        jobTitle: row.jobTitle || 'Unassigned Role',
        department: row.department || 'General Overhead',
        currentSalary,
        marketMidpoint,
        performanceRating: rating,
        hireDate: row.hireDate || '',
        compaRatio,
        quartile,
        recommendedRaisePct: finalRaisePct,
        calculatedRaiseDollars,
        newSalary: currentSalary + calculatedRaiseDollars,
        isProrated
      };
    });
  };

  const handleFileUpload = (file: File) => {
    setIsLoading(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          // 2. Process rows using rules directly out of AppContext state memory
          const processedData = processRosterData(results.data, matrixRules, prorateHires);

          // 3. Save directly into our global react state context tree branch
          setRoster(processedData);

          // Advance layout router branch forward to modeling matrix screen
          router.push('/dashboard');
        } catch (err) {
          setError('Data compilation anomaly: Ensure structural fields match required formats.');
          setIsLoading(false);
        }
      },
      error: () => {
        setError('File syntax error: Failed to parse targets inside chosen CSV spread format.');
        setIsLoading(false);
      }
    });
  };

  // Fetch interface linking your local client container to public/test_roster.csv
  const handleLoadSampleData = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents triggering the dropzone upload click event
    setIsLoading(true);
    setError(null);

    try {
      // Prepend your Next.js basePath explicitly for the static fetch asset
      const basePath = '/merit-matrix-app';
      const response = await fetch(`${basePath}/test_roster.csv`);
      if (!response.ok) {
        throw new Error(`Could not locate test_roster.csv asset (Status: ${response.status})`);
      }
      const blob = await response.blob();
      const mockFile = new File([blob], 'test_roster.csv', { type: 'text/csv' });
      handleFileUpload(mockFile);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred fetching fallback data.');
      setIsLoading(false);
    }
  };

  // Drag and drop standard browser handlers updated to HTMLLabelElement
  const onDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'text/csv') {
      handleFileUpload(file);
    } else {
      setError('Invalid file format. Please upload a structured .csv employee registry.');
    }
  }, []);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 font-sans">
      {/* NAVIGATION LINK ROW */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/')}
          className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Return to Strategy Setup
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Ingest Employee Roster</h1>
        <p className="text-gray-500 mt-2 text-sm">
          Phase 2: Upload your current organizational employee roster to evaluate organizational pay gaps and model financial outputs against targets.
        </p>
      </div>

      {/* ACCESSIBLE DRAG AND DROP ZONE */}
      <label
        htmlFor="fileInputElement"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onKeyDown={(e) => {
          if (isLoading) return;
          // Activate file browser natively on Enter or Space key press
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('fileInputElement')?.click();
          }
        }}
        className={`border-2 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center transition-all duration-200 focus-within:ring-4 focus-within:ring-blue-500/30 focus-within:border-blue-500 outline-none ${isDragging ? 'border-blue-500 bg-blue-50/60 ring-4 ring-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100/80'} ${isLoading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
        role="button"
        tabIndex={isLoading ? -1 : 0}
        aria-disabled={isLoading}
        aria-label="Upload corporate CSV roster by dragging and dropping here, or press enter to browse local storage networks"
      >
        {/* Screen Reader Announcements for Dynamic Drag States */}
        <span className="sr-only" aria-live="polite">
          {isDragging ? 'Ready to drop: corporate CSV roster detected.' : ''}
        </span>

        {/* Native Hidden File Input */}
        <input
          type="file"
          accept=".csv"
          onChange={onFileSelect}
          className="sr-only"
          id="fileInputElement"
          disabled={isLoading}
        />

        <div className="flex flex-col items-center text-center">
          {isLoading ? (
            <Loader2 className="h-14 w-14 text-blue-600 animate-spin mb-4" aria-hidden="true" />
          ) : (
            <Upload className={`h-14 w-14 mb-4 transition-transform ${isDragging ? 'text-blue-600 scale-110' : 'text-gray-400'}`} aria-hidden="true" />
          )}

          <div className="text-lg font-bold text-gray-800 mb-1">
            {isLoading ? 'Computing Compensation Parameters...' : 'Drop corporate CSV roster here'}
          </div>
          <p className="text-xs text-gray-400 max-w-xs">
            {isLoading ? 'Mapping range percentiles and proration thresholds.' : 'or click to browse local storage networks'}
          </p>
        </div>
      </label>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* SAMPLE FILE REFERENCE CARD WITH FETCH TRIGGER */}
      <div className="mt-8 border border-gray-200 bg-white rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-start justify-between gap-6 w-full overflow-hidden">

        {/* Left Section: Content wrapper with bounds restrictions */}
        <div className="flex flex-col sm:flex-row items-start gap-4 min-w-0 flex-1">
          <FileSpreadsheet className="h-6 w-6 text-blue-600 shrink-0 mt-0.5 hidden sm:block" />

          <div className="space-y-1 min-w-0 w-full flex-1">
            <div className="flex items-center gap-2 sm:block">
              <FileSpreadsheet className="h-5 w-5 text-blue-600 shrink-0 sm:hidden" />
              <h2 className="text-sm font-bold text-gray-900">Required Source Schema Architecture</h2>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              To ensure calculations succeed, confirm your file contains columns named exactly like this baseline sample:
            </p>

            {/* Code box setup to handle overflow neatly without breaking parent layout */}
            <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-2.5 font-mono text-[11px] text-gray-600 select-all block w-full overflow-x-auto whitespace-nowrap pb-3">
              employeeId,fullName,jobTitle,department,currentSalary,marketMidpoint,performanceRating,hireDate
            </div>
          </div>
        </div>

        {/* Right Section: Stacking action button */}
        <div className="shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t border-gray-100 sm:border-0">
          <button
            type="button"
            disabled={isLoading}
            onClick={handleLoadSampleData}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 shadow-sm text-xs font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition gap-2"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Try with Sample Data
          </button>
        </div>

      </div>

    </div>
  );
}
