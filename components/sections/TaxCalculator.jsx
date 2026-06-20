"use client";

import { useState, useMemo } from "react";

export default function TaxCalculator({ slabs }) {
  const availableYears = useMemo(() => {
    const years = [...new Set(slabs.map(s => s.tax_year))].sort((a, b) => b - a);
    return years.length > 0 ? years : ['2025'];
  }, [slabs]);

  const [year, setYear] = useState(availableYears[0] || "2025");
  const [monthlyIncome, setMonthlyIncome] = useState(100000);

  const annualIncome = monthlyIncome * 12;

  const activeSlabs = useMemo(() => {
    return slabs.filter(s => s.tax_year === year).sort((a, b) => a.salary_from - b.salary_from);
  }, [slabs, year]);

  const annualTax = useMemo(() => {
    let tax = 0;
    if (activeSlabs.length === 0) return 0;
    
    for (const slab of activeSlabs) {
      if (annualIncome > slab.salary_from) {
        const taxableAmountInSlab = Math.min(annualIncome, slab.salary_to) - slab.salary_from;
        tax += taxableAmountInSlab * (slab.tax_amount / 100);
      }
    }
    return tax;
  }, [annualIncome, activeSlabs]);

  const monthlyTax = annualTax / 12;

  return (
    <section id="tax-tool" className="py-24 bg-background-light overflow-hidden">
      <div className="mx-auto max-w-4xl w-[90%] md:w-[75%] text-center mb-16">
        <h2 className="text-section-heading font-heading font-bold text-text-primary tracking-tight mb-4">Income Tax Calculator Pakistan</h2>
        <p className="text-text-secondary text-body-custom max-w-lg mx-auto">Calculate your income tax in Pakistan with our easy-to-use calculator.</p>
      </div>

      <div className="mx-auto max-w-5xl w-[90%] md:w-[75%] bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-[2rem] p-6 md:p-12 anim-slide-up relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative z-10">
          
          <div className="lg:col-span-6 flex flex-col gap-6 md:gap-8">
            <div className="flex flex-col gap-2">
              <label className="font-bold text-card-heading text-text-primary">Tax Year</label>
              <select 
                className="w-full min-w-[200px] bg-white border border-gray-200 rounded-xl px-5 py-3.5 focus:outline-primary shadow-sm text-base appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_12px_center] bg-[length:20px] pr-10"
                value={year}
                onChange={e => setYear(e.target.value)}
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>
                    {y} - {Number(y) + 1}{y === availableYears[0] ? ' (Current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-end">
                <label className="font-bold text-card-heading text-text-primary">Monthly Income</label>
                <span className="text-xl md:text-2xl font-bold text-primary">Rs {monthlyIncome.toLocaleString()}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="2000000" 
                step="1000" 
                value={monthlyIncome} 
                onChange={e => setMonthlyIncome(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-secondary">Or type amount:</span>
                <input 
                  type="number" 
                  min="0"
                  value={monthlyIncome === 0 ? "" : monthlyIncome}
                  onChange={e => setMonthlyIncome(Number(e.target.value))}
                  className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-36 focus:outline-primary"
                  placeholder="Enter income"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col gap-4 justify-between">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-text-secondary text-sm font-medium mb-1">Monthly Salary</p>
              <p className="text-xl md:text-2xl font-bold text-text-primary">Rs {monthlyIncome.toLocaleString()}</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center">
              <p className="text-text-secondary text-sm font-medium mb-1">Annual Salary</p>
              <p className="text-xl md:text-2xl font-bold text-text-primary">Rs {annualIncome.toLocaleString()}</p>
            </div>

            <div className="bg-primary text-white rounded-2xl p-6 shadow-md flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/4"></div>
              <p className="text-white/80 text-sm font-medium mb-1 relative z-10">Monthly Tax</p>
              <p className="text-3xl md:text-4xl font-bold relative z-10">Rs {monthlyTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              <p className="text-white/80 text-xs mt-2 relative z-10">Annual Tax: Rs {annualTax.toLocaleString()}</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
