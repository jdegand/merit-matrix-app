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
      const rating = row.performanceRating || 'Meets Expectations';
      const ratingKey = rating === 'Needs Improvement' ? 'needsImprovement' :
        rating === 'Meets Expectations' || rating === 'Meets' ? 'meetsExpectations' :
          rating === 'Exceeds Expectations' || rating === 'Exceeds' ? 'exceedsExpectations' : 'outstanding';

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

  // Drag and drop standard browser handlers
  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
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
        <button onClick={() => router.push('/')} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Return to Strategy Setup
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Ingest Employee Roster</h1>
        <p className="text-gray-500 mt-2 text-sm">
          Phase 2: Upload your current organizational employee roster to evaluate organizational pay gaps and model financial outputs against targets.
        </p>
      </div>

      {/* DRAG AND DROP ZONE */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !isLoading && document.getElementById('fileInputElement')?.click()}
        className={`border-2 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center transition-all duration-200 ${isDragging ? 'border-blue-500 bg-blue-50/60 ring-4 ring-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100/80'
          } ${isLoading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
      >
        <input type="file" accept=".csv" onChange={onFileSelect} className="hidden" id="fileInputElement" disabled={isLoading} />

        <div className="flex flex-col items-center text-center">
          {isLoading ? (
            <Loader2 className="h-14 w-14 text-blue-600 animate-spin mb-4" />
          ) : (
            <Upload className={`h-14 w-14 mb-4 transition-transform ${isDragging ? 'text-blue-600 scale-110' : 'text-gray-400'}`} />
          )}

          <h3 className="text-lg font-bold text-gray-800 mb-1">
            {isLoading ? 'Computing Compensation Parameters...' : 'Drop corporate CSV roster here'}
          </h3>
          <p className="text-xs text-gray-400 max-w-xs">
            {isLoading ? 'Mapping range percentiles and proration thresholds.' : 'or click to browse local storage networks'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* SAMPLE FILE REFERENCE CARD */}
      <div className="mt-8 border border-gray-200 bg-white rounded-2xl p-4 sm:p-6 shadow-sm flex items-start gap-4 w-full">
        <FileSpreadsheet className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />

        {/* FIX: Added min-w-0 here to force the text wrapper to respect screen boundaries */}
        <div className="space-y-1 min-w-0 flex-1">
          <h4 className="text-sm font-bold text-gray-900">Required Source Schema Architecture</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            To ensure calculations succeed, confirm your file contains columns named exactly like this baseline sample:
          </p>

          {/* FIX: Added block and w-full alongside overflow-x-scroll */}
          <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-2.5 font-mono text-[11px] text-gray-600 select-all block w-full overflow-x-scroll whitespace-nowrap pb-3">
            employeeId,fullName,jobTitle,department,currentSalary,marketMidpoint,performanceRating,hireDate
          </div>
        </div>
      </div>

    </div>
  );
}
