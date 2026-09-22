"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

export default function SalaryTaxCalculatorClient({ slabs = [] }) {
  // Available tax years sorted descending
  const availableYears = useMemo(() => {
    const years = [...new Set(slabs.map(s => String(s.tax_year)))].sort((a, b) => Number(b) - Number(a));
    return years.length > 0 ? years : ["2026", "2025", "2024", "2023", "2022"];
  }, [slabs]);

  const [selectedYear, setSelectedYear] = useState(availableYears[0] || "2026");
  const [calculationMode, setCalculationMode] = useState("monthly"); // 'monthly' | 'annual'
  const [salaryInput, setSalaryInput] = useState(150000);

  // Derive monthly and annual gross
  const monthlySalary = calculationMode === "monthly" ? salaryInput : Math.round(salaryInput / 12);
  const annualSalary = calculationMode === "annual" ? salaryInput : salaryInput * 12;

  // Active slabs for the selected year
  const activeSlabs = useMemo(() => {
    return slabs
      .filter(s => String(s.tax_year) === selectedYear)
      .sort((a, b) => Number(a.salary_from) - Number(b.salary_from));
  }, [slabs, selectedYear]);

  // Tax calculation per slab breakdown
  const { annualTax, slabBreakdown, marginalRate } = useMemo(() => {
    if (!activeSlabs || activeSlabs.length === 0) {
      return { annualTax: 0, slabBreakdown: [], marginalRate: 0 };
    }

    let totalTax = 0;
    let highestRate = 0;

    const breakdown = activeSlabs.map((slab) => {
      const from = Number(slab.salary_from);
      const to = Number(slab.salary_to);
      const rate = Number(slab.tax_amount);

      let taxableInSlab = 0;
      let taxInSlab = 0;
      let isApplicable = false;
      let isCurrentTier = false;

      if (annualSalary > from) {
        isApplicable = true;
        taxableInSlab = Math.max(0, Math.min(annualSalary, to) - from);
        taxInSlab = (taxableInSlab * rate) / 100;
        totalTax += taxInSlab;
        if (rate > 0) highestRate = rate;
      }

      if (annualSalary >= from && (annualSalary <= to || to >= 99999999)) {
        isCurrentTier = true;
      }

      return {
        id: slab.id,
        from,
        to,
        rate,
        taxableInSlab,
        taxInSlab,
        isApplicable,
        isCurrentTier,
      };
    });

    return {
      annualTax: Math.round(totalTax),
      slabBreakdown: breakdown,
      marginalRate: highestRate,
    };
  }, [annualSalary, activeSlabs]);

  const monthlyTax = Math.round(annualTax / 12);
  const monthlyTakeHome = Math.max(0, monthlySalary - monthlyTax);
  const annualTakeHome = Math.max(0, annualSalary - annualTax);
  const effectiveRate = annualSalary > 0 ? ((annualTax / annualSalary) * 100).toFixed(2) : "0.00";

  // Quick preset salary amounts in PKR (monthly)
  const presets = [
    { label: "50K", value: 50000 },
    { label: "100K", value: 100000 },
    { label: "150K", value: 150000 },
    { label: "250K", value: 250000 },
    { label: "500K", value: 500000 },
    { label: "1M", value: 1000000 },
  ];

  const handlePreset = (val) => {
    if (calculationMode === "annual") {
      setSalaryInput(val * 12);
    } else {
      setSalaryInput(val);
    }
  };

  const handleReset = () => {
    setSalaryInput(100000);
    setCalculationMode("monthly");
  };

  const formatPKR = (num) => {
    if (isNaN(num) || num === null || num === undefined) return "0";
    return Number(num).toLocaleString("en-PK");
  };

  return (
    <div className="w-full space-y-12">
      {/* Top Controls Card */}
      <div className="bg-white rounded-3xl p-6 md:p-10 border border-gray-200/80 shadow-xl shadow-primary/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-gray-100">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Calculate Your Tax</h2>
            <p className="text-gray-500 text-sm mt-1">Select tax year, input your salary, and view instant FBR tax calculations.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Year Selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="tax-year-select" className="text-xs font-bold uppercase tracking-wider text-gray-500">Tax Year:</label>
              <select
                id="tax-year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-900 font-bold rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none cursor-pointer"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    Tax Year {yr} {yr === availableYears[0] ? "(Latest)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="text-xs text-gray-500 hover:text-red-600 font-medium px-3 py-2 rounded-lg border border-gray-200 hover:border-red-200 transition-colors flex items-center gap-1 cursor-pointer"
              title="Reset values"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset
            </button>
          </div>
        </div>

        {/* Input Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
          <div className="lg:col-span-7 space-y-6">
            {/* Mode Switcher */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-700">Calculation Frequency</span>
              <div className="inline-flex p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    if (calculationMode === "annual") {
                      setSalaryInput(Math.round(salaryInput / 12));
                      setCalculationMode("monthly");
                    }
                  }}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    calculationMode === "monthly"
                      ? "bg-white text-primary shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Monthly Salary
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (calculationMode === "monthly") {
                      setSalaryInput(salaryInput * 12);
                      setCalculationMode("annual");
                    }
                  }}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    calculationMode === "annual"
                      ? "bg-white text-primary shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Annual Salary
                </button>
              </div>
            </div>

            {/* Income Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="salary-number-input" className="text-sm font-bold text-gray-800">
                  {calculationMode === "monthly" ? "Gross Monthly Salary" : "Gross Annual Salary"} (PKR)
                </label>
                <span className="text-2xl font-black text-primary">
                  Rs. {formatPKR(salaryInput)}
                </span>
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                  PKR
                </span>
                <input
                  id="salary-number-input"
                  type="number"
                  min="0"
                  max="100000000"
                  step="1000"
                  value={salaryInput === 0 ? "" : salaryInput}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSalaryInput(isNaN(val) || val < 0 ? 0 : val);
                  }}
                  placeholder="Enter gross salary amount"
                  className="w-full bg-gray-50 border border-gray-200 focus:border-primary focus:bg-white rounded-2xl pl-16 pr-4 py-4 text-lg font-bold text-gray-900 outline-none transition-all"
                />
              </div>

              {/* Range Slider */}
              <div className="mt-4">
                <input
                  type="range"
                  min="0"
                  max={calculationMode === "monthly" ? 2000000 : 24000000}
                  step={calculationMode === "monthly" ? 5000 : 60000}
                  value={Math.min(salaryInput, calculationMode === "monthly" ? 2000000 : 24000000)}
                  onChange={(e) => setSalaryInput(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                  <span>Rs. 0</span>
                  <span>{calculationMode === "monthly" ? "Rs. 1,000,000" : "Rs. 12,000,000"}</span>
                  <span>{calculationMode === "monthly" ? "Rs. 2,000,000+" : "Rs. 24,000,000+"}</span>
                </div>
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                Quick Presets (Monthly):
              </span>
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => {
                  const targetVal = calculationMode === "annual" ? p.value * 12 : p.value;
                  const isSelected = salaryInput === targetVal;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handlePreset(p.value)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary text-white shadow-md shadow-primary/20 scale-105"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Highlight Box: Tax & Take-Home Pay */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            <div className="bg-gradient-to-br from-primary via-primary/95 to-primary-dark text-white rounded-3xl p-6 md:p-8 shadow-xl shadow-primary/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
              
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between border-b border-white/15 pb-4">
                  <span className="text-xs uppercase tracking-wider text-white/80 font-bold">Tax Summary</span>
                  <span className="bg-white/20 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    Tax Year {selectedYear}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-white/80 font-medium block mb-1">Monthly Tax Deduction</span>
                  <div className="text-3xl md:text-4xl font-black tracking-tight">
                    Rs. {formatPKR(monthlyTax)}
                  </div>
                  <span className="text-xs text-white/70 mt-1 block">
                    Annual Tax: <strong className="text-white">Rs. {formatPKR(annualTax)}</strong>
                  </span>
                </div>

                <div className="pt-4 border-t border-white/15">
                  <span className="text-xs text-white/80 font-medium block mb-1">Monthly Net Take-Home</span>
                  <div className="text-2xl md:text-3xl font-extrabold text-emerald-300">
                    Rs. {formatPKR(monthlyTakeHome)}
                  </div>
                  <span className="text-xs text-white/70 mt-1 block">
                    Annual Net: <strong className="text-white">Rs. {formatPKR(annualTakeHome)}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/15">
                  <div className="bg-white/10 rounded-xl p-3">
                    <span className="text-[11px] text-white/70 block">Effective Rate</span>
                    <span className="text-lg font-bold">{effectiveRate}%</span>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <span className="text-[11px] text-white/70 block">Marginal Rate</span>
                    <span className="text-lg font-bold">{marginalRate}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Note */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-2.5">
              <svg className="w-5 h-5 text-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                Under Section 149 of Income Tax Ordinance 2001, your employer is required to deduct salary withholding tax monthly based on your projected annual income.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <span className="text-xs text-gray-500 font-bold block mb-1 uppercase tracking-wider">Gross Annual Salary</span>
          <span className="text-lg md:text-xl font-bold text-gray-900">Rs. {formatPKR(annualSalary)}</span>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <span className="text-xs text-gray-500 font-bold block mb-1 uppercase tracking-wider">Annual Tax Payable</span>
          <span className="text-lg md:text-xl font-bold text-red-600">Rs. {formatPKR(annualTax)}</span>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <span className="text-xs text-gray-500 font-bold block mb-1 uppercase tracking-wider">Annual Take-Home</span>
          <span className="text-lg md:text-xl font-bold text-emerald-600">Rs. {formatPKR(annualTakeHome)}</span>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <span className="text-xs text-gray-500 font-bold block mb-1 uppercase tracking-wider">Effective Tax Rate</span>
          <span className="text-lg md:text-xl font-bold text-primary">{effectiveRate}%</span>
        </div>
      </div>

      {/* Detailed FBR Tax Slab Breakdown Table */}
      <div className="bg-white rounded-3xl p-6 md:p-10 border border-gray-200/80 shadow-xl shadow-primary/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900">
              FBR Salary Tax Slabs Breakdown ({selectedYear})
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              Detailed step-by-step progressive tax calculation under Pakistan FBR income tax slabs.
            </p>
          </div>
          <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full self-start md:self-auto">
            Progressive Taxation Model
          </span>
        </div>

        {slabBreakdown.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-bold">Bracket #</th>
                  <th className="py-3.5 px-4 font-bold">Annual Salary Range (PKR)</th>
                  <th className="py-3.5 px-4 font-bold">Tax Rate</th>
                  <th className="py-3.5 px-4 font-bold">Taxable in Bracket</th>
                  <th className="py-3.5 px-4 font-bold text-right">Tax in Bracket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {slabBreakdown.map((s, idx) => {
                  const isCurrent = s.isCurrentTier;
                  const hasTax = s.taxInSlab > 0;
                  return (
                    <tr
                      key={s.id || idx}
                      className={`transition-colors ${
                        isCurrent
                          ? "bg-primary/5 font-semibold text-primary"
                          : s.isApplicable
                          ? "bg-gray-50/60 text-gray-800"
                          : "text-gray-400"
                      }`}
                    >
                      <td className="py-4 px-4">
                        <span className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                              isCurrent
                                ? "bg-primary text-white"
                                : s.isApplicable
                                ? "bg-gray-200 text-gray-700"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            {idx + 1}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold uppercase bg-primary text-white px-2 py-0.5 rounded-full">
                              Your Tier
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        Rs. {formatPKR(s.from)} — {s.to >= 99999999 ? "Above" : `Rs. ${formatPKR(s.to)}`}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                            s.rate === 0
                              ? "bg-emerald-100 text-emerald-800"
                              : isCurrent
                              ? "bg-primary text-white"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {s.rate}%
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {s.taxableInSlab > 0 ? `Rs. ${formatPKR(s.taxableInSlab)}` : "—"}
                      </td>
                      <td className="py-4 px-4 text-right font-bold">
                        {hasTax ? (
                          <span className="text-red-600">Rs. {formatPKR(s.taxInSlab)}</span>
                        ) : s.rate === 0 ? (
                          <span className="text-emerald-600">Exempt (0%)</span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 font-bold text-gray-900 bg-gray-50/80">
                  <td colSpan={3} className="py-4 px-4 text-base">
                    Total Annual Tax Payable
                  </td>
                  <td className="py-4 px-4 text-gray-600">
                    Gross: Rs. {formatPKR(annualSalary)}
                  </td>
                  <td className="py-4 px-4 text-right text-base text-red-600">
                    Rs. {formatPKR(annualTax)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400">
            No tax slabs found for the selected tax year.
          </div>
        )}
      </div>

      {/* Call to Action Banner */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-3xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-primary/15">
        <div className="max-w-xl space-y-2 text-center md:text-left">
          <h3 className="text-2xl md:text-3xl font-bold">Need Help Filing Your Income Tax Return?</h3>
          <p className="text-white/80 text-sm md:text-base leading-relaxed">
            Avoid penalties, become an Active Taxpayer (ATL), and enjoy 50% reduced withholding tax rates on banking, property, and vehicle transactions.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            href="/login?redirect=/portal"
            className="bg-white text-primary hover:bg-gray-50 font-bold px-8 py-3.5 rounded-2xl text-center shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer text-sm"
          >
            File With DIGITAX Now
          </Link>
          <Link
            href="/services"
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-6 py-3.5 rounded-2xl text-center transition-all cursor-pointer text-sm"
          >
            View Tax Services
          </Link>
        </div>
      </div>
    </div>
  );
}
