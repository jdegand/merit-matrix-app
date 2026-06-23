'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { ArrowLeft, Download, AlertTriangle, CheckCircle, HelpCircle, TrendingUp } from 'lucide-react';
import { useAppState } from '../context/AppContext';

// Initialize ChartJS modules for React integration
ChartJS.register(ArcElement, Tooltip, Legend);

export default function DashboardPage() {
    const router = useRouter();

    // Connect directly to the global Context memory pipeline
    const { roster, setRoster, globalBudgetPct } = useAppState();

    // Inline handler tracking manual percentage adjustments from managers
    const handleOverrideChange = (employeeId: string, value: string) => {
        const numValue = value === '' ? undefined : parseFloat(value);
        setRoster((prev) =>
            prev.map((emp) =>
                emp.employeeId === employeeId
                    ? { ...emp, manualOverrideRaisePct: numValue }
                    : emp
            )
        );
    };
    // Compute global compensation aggregates over the roster array
    const metrics = useMemo(() => {
        if (roster.length === 0) return { totalBase: 0, cap: 0, spend: 0, variance: 0 };

        const totalBase = roster.reduce((sum, emp) => sum + emp.currentSalary, 0);
        const cap = totalBase * (globalBudgetPct / 100);

        // Evaluate if record uses default matrix parameters or a manual human override
        const spend = roster.reduce((sum, emp) => {
            const activeRate = emp.manualOverrideRaisePct !== undefined
                ? emp.manualOverrideRaisePct
                : emp.recommendedRaisePct;
            return sum + (emp.currentSalary * (activeRate / 100));
        }, 0);

        return {
            totalBase,
            cap,
            spend,
            variance: cap - spend
        };
    }, [roster, globalBudgetPct]);

    // Map calculated fields directly onto ChartJS configurations
    const chartData = {
        labels: ['Allocated Funds', 'Remaining Balance'],
        datasets: [
            {
                data: [metrics.spend, Math.max(0, metrics.variance)],
                backgroundColor: [metrics.variance >= 0 ? '#10b981' : '#ef4444', '#f3f4f6'],
                hoverBackgroundColor: [metrics.variance >= 0 ? '#059669' : '#dc2626', '#e5e7eb'],
                borderWidth: 1,
            },
        ],
    };

    // Convert updated data rows into a physical downloadable text spreadsheet 
    const handleExportCSV = () => {
        if (roster.length === 0) return;

        const headers = ["Employee ID,Name,Job Title,Department,Prior Salary,Active Increase %,Raise Amount,New Salary"];
        const rows = roster.map(e => {
            const finalPct = e.manualOverrideRaisePct !== undefined ? e.manualOverrideRaisePct : e.recommendedRaisePct;
            const raiseCash = e.currentSalary * (finalPct / 100);
            return `${e.employeeId},${e.fullName},${e.jobTitle},${e.department},${e.currentSalary},${finalPct}%,${raiseCash.toFixed(2)},${(e.currentSalary + raiseCash).toFixed(2)}`;
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `merit_cycle_export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    return (
        <div className="max-w-7xl mx-auto px-4 py-8 font-sans">

            {/* ACTIONS NAVIGATION BANNER */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <button
                        onClick={() => router.push('/upload')}
                        className="inline-flex items-center text-xs font-bold text-gray-500 uppercase tracking-wider hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Return to Upload
                    </button>
                    <h2 className="text-2xl font-black text-gray-900 mt-2">Merit Allocation Matrix Modeling</h2>
                </div>

                <button
                    onClick={handleExportCSV}
                    disabled={roster.length === 0 || metrics.variance < 0}
                    className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 disabled:bg-gray-300 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-sm transition-all"
                    title={metrics.variance < 0 ? "Action Blocked: Resolve budget deficit prior to final system export" : "Export finalized ledger"}
                >
                    <Download className="mr-2 h-4 w-4" /> Export Cycle Results
                </button>
            </div>
            {metrics.variance < 0 && (
                <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-xl text-red-900 text-xs font-bold flex items-center gap-2 animate-pulse">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                    System Block: Export disabled until proposed spend allocations align with the board target cap.
                </div>
            )}

            {roster.length === 0 ? (
                /* EMPTY STATE RENDER FALLBACK */
                <div className="bg-white border rounded-2xl p-12 text-center max-w-xl mx-auto shadow-sm">
                    <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-base font-bold text-gray-900">No Organizational Roster Loaded</h3>
                    <p className="text-xs text-gray-500 mt-1 mb-6">You must populate employee roster items through the file entry workspace first.</p>
                    <button onClick={() => router.push('/upload')} className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold text-sm rounded-lg hover:bg-gray-200">Go to Upload</button>
                </div>
            ) : (
                /* DASHBOARD RENDERING STRUCTURE GRID */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                    {/* COLUMN 1 SUMMARY STATISTICS PANELS */}
                    <div className="space-y-6">
                        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
                            <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest block">Allowed Merit Target Pool</span>
                            <div className="text-3xl font-black text-gray-900 mt-1">${metrics.cap.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                            <div className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded mt-2">
                                <TrendingUp className="h-3 w-3" /> Baseline Cap: {globalBudgetPct}%
                            </div>
                        </div>

                        <div className={`border p-6 rounded-2xl shadow-sm transition-colors duration-200 ${metrics.variance >= 0 ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'}`}>
                            <div className="flex items-center gap-2">
                                {metrics.variance >= 0 ? <CheckCircle className="text-emerald-600 h-5 w-5 shrink-0" /> : <AlertTriangle className="text-rose-600 h-5 w-5 shrink-0" />}
                                <span className={`text-[11px] font-extrabold uppercase tracking-widest ${metrics.variance >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>Remaining Pool Budget</span>
                            </div>
                            <div className={`text-3xl font-black mt-1 ${metrics.variance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                ${metrics.variance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
                            <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">Funding Distribution Analysis</h4>
                            <div className="h-56 relative flex justify-center items-center">
                                <Pie data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
                            </div>
                        </div>
                    </div>

                    {/* COLUMN 2 ACTIVE ROSTER DATA LAYOUT GRID */}
                    <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden w-full">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="font-bold text-gray-900 text-sm">Modeling Roster Ledger</h3>
                        </div>

                        <div className="w-full">
                            {/* DESKTOP VIEW COMPONENT STRUCTURE: Invisible on mobile screen viewports */}
                            <table className="hidden md:table w-full text-sm text-left text-gray-500">
                                <thead className="text-xs bg-gray-50 text-gray-700 font-bold border-b border-gray-200 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Employee Details</th>
                                        <th className="px-6 py-4">Salary</th>
                                        <th className="px-6 py-4">Market Position</th>
                                        <th className="px-6 py-4">Guideline Increase</th>
                                        <th className="px-6 py-4 w-32 text-center">Override %</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 font-medium text-gray-900">
                                    {roster.map((emp) => {
                                        const hasOverride = emp.manualOverrideRaisePct !== undefined;
                                        const ratioPct = emp.compaRatio * 100;
                                        const baselineViolation = ratioPct < 80 || ratioPct > 120;
                                        const activePct = (hasOverride ? emp.manualOverrideRaisePct : emp.recommendedRaisePct) ?? 0;
                                        const projectedSalary = emp.currentSalary * (1 + (activePct / 100));
                                        const projectedRatioPct = (projectedSalary / emp.marketMidpoint) * 100;
                                        const inputViolation = projectedRatioPct < 80 || projectedRatioPct > 120;

                                        return (
                                            <tr key={emp.employeeId} className="hover:bg-gray-50/80 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900">{emp.fullName}</div>
                                                    <div className="text-[11px] text-gray-400 font-normal mt-0.5">{emp.jobTitle} • {emp.performanceRating}</div>
                                                </td>
                                                <td className="px-6 py-4 font-mono">${emp.currentSalary.toLocaleString()}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`text-[11px] px-2 py-0.5 rounded font-bold font-mono border shadow-sm ${ratioPct > 120 ? 'bg-rose-100 border-rose-200 text-rose-800' : ratioPct < 80 ? 'bg-amber-100 border-amber-200 text-amber-800' : 'bg-blue-50 border-blue-100 text-blue-700'
                                                            }`}>
                                                            {ratioPct.toFixed(0)}% (Q{emp.quartile})
                                                        </span>
                                                        {baselineViolation && (
                                                            <span title={ratioPct > 120 ? "Market Anomaly: Exceeds 120% Limit" : "Market Anomaly: Below 80% Limit"} className="flex items-center justify-center h-4 w-4 rounded-full bg-red-600 text-white text-[10px] font-black animate-pulse">!</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-emerald-700 font-extrabold">
                                                    {emp.recommendedRaisePct}%
                                                    {emp.isProrated && <span className="text-[10px] text-amber-600 bg-amber-50 font-bold px-1.5 py-0.5 rounded ml-1.5">Prorated</span>}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <input
                                                        type="number" step="0.1" min="0" max="30" placeholder={`${emp.recommendedRaisePct}`}
                                                        value={hasOverride ? emp.manualOverrideRaisePct : ''}
                                                        onChange={(e) => handleOverrideChange(emp.employeeId, e.target.value)}
                                                        className={`w-16 border text-center rounded p-1 text-xs font-bold focus:outline-none transition-all ${inputViolation ? 'border-red-600 text-red-700 bg-red-50 ring-2 ring-red-100' : hasOverride ? 'border-orange-400 text-orange-700 bg-orange-50/30' : 'border-gray-300 text-gray-800'
                                                            }`}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* MOBILE LIST CARD COMPONENT VIEW MODULE: Automatically replaces spreadsheet layout on narrow viewports */}
                            <div className="block md:hidden divide-y divide-gray-200">
                                {roster.map((emp) => {
                                    const hasOverride = emp.manualOverrideRaisePct !== undefined;
                                    const ratioPct = emp.compaRatio * 100;
                                    const baselineViolation = ratioPct < 80 || ratioPct > 120;
                                    const activePct = (hasOverride ? emp.manualOverrideRaisePct : emp.recommendedRaisePct) ?? 0;
                                    const projectedSalary = emp.currentSalary * (1 + (activePct / 100));
                                    const projectedRatioPct = (projectedSalary / emp.marketMidpoint) * 100;
                                    const inputViolation = projectedRatioPct < 80 || projectedRatioPct > 120;

                                    return (
                                        <div key={`mob-${emp.employeeId}`} className="p-4 space-y-3 bg-white">
                                            {/* ROW HEADER: Employee Basic Info */}
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-extrabold text-gray-900 text-base">{emp.fullName}</h4>
                                                    <p className="text-xs text-gray-400 font-medium">{emp.jobTitle} • {emp.performanceRating}</p>
                                                </div>
                                                <span className={`text-[11px] px-2 py-0.5 rounded font-bold font-mono border ${ratioPct > 120 ? 'bg-rose-100 border-rose-200 text-rose-800' : ratioPct < 80 ? 'bg-amber-100 border-amber-200 text-amber-800' : 'bg-blue-50 border-blue-100 text-blue-700'
                                                    }`}>
                                                    {ratioPct.toFixed(0)}% CR (Q{emp.quartile})
                                                </span>
                                            </div>

                                            {/* METRICS METADATA: Compensation Parameters Key Fields */}
                                            <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-gray-100 py-2.5 font-medium text-gray-500">
                                                <div>Current Base: <span className="font-mono text-gray-900 font-bold">${emp.currentSalary.toLocaleString()}</span></div>
                                                <div>Guideline Raise: <span className="text-emerald-700 font-extrabold">{emp.recommendedRaisePct}%</span></div>
                                            </div>

                                            {/* INTERACTIVE CONTROLS CONTAINER */}
                                            <div className="flex justify-between items-center pt-1">
                                                <div className="flex items-center gap-1.5">
                                                    {emp.isProrated && <span className="text-[10px] text-amber-700 bg-amber-50 font-bold px-2 py-0.5 rounded-md border border-amber-200">Tenure Prorated</span>}
                                                    {baselineViolation && <span className="text-[10px] text-red-700 bg-red-50 font-bold px-2 py-0.5 rounded-md border border-red-200 animate-pulse">Range Anomaly</span>}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Override:</label>
                                                    <input
                                                        type="number" step="0.1" min="0" max="30" placeholder={`${emp.recommendedRaisePct}`}
                                                        value={hasOverride ? emp.manualOverrideRaisePct : ''}
                                                        onChange={(e) => handleOverrideChange(emp.employeeId, e.target.value)}
                                                        className={`w-16 border text-center rounded-lg p-1.5 text-xs font-bold focus:outline-none transition-all ${inputViolation ? 'border-red-600 text-red-700 bg-red-50 ring-2 ring-red-100' : hasOverride ? 'border-orange-400 text-orange-700 bg-orange-50/30' : 'border-gray-300 text-gray-800'
                                                            }`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>


                </div>
            )}
        </div>
    );
}
