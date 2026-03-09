import React from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, AlertTriangle, IndianRupee } from 'lucide-react';
import CategoryChart from './CategoryChart';
import MonthlyTrendChart from './MonthlyTrendChart';
import InsightPanel from './InsightPanel';
import AnomalyCard from './AnomalyCard';

export default function Dashboard({ data }) {
  const totalIncome = data.transactions
    .filter(t => t.amount > 0 && t.category === 'Income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalSpent = data.transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const netSavings = totalIncome - totalSpent;

  const StatCard = ({ title, amount, icon: Icon, colorClass }) => (
    <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl flex items-center justify-between">
      <div>
        <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
        <p className={`text-2xl font-bold ${colorClass}`}>
          ₹{Math.abs(amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
        </p>
      </div>
      <div className={`p-3 rounded-lg bg-slate-900 ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-24">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Income" amount={totalIncome} icon={ArrowUpRight} colorClass="text-emerald-400" />
        <StatCard title="Total Spent" amount={totalSpent} icon={ArrowDownRight} colorClass="text-rose-400" />
        <StatCard title="Net Savings" amount={netSavings} icon={IndianRupee} colorClass={netSavings >= 0 ? "text-indigo-400" : "text-amber-400"} />
        <StatCard title="Anomalies Found" amount={data.anomalies.length} icon={AlertTriangle} colorClass="text-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Monthly Trends</h3>
            <MonthlyTrendChart data={data.monthly_totals} />
          </div>
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Spending by Category</h3>
            <CategoryChart data={data.category_totals} />
          </div>
        </div>

        {/* Insights & Anomalies */}
        <div className="space-y-6">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
            <InsightPanel insights={data.insights} />
          </div>
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Detected Anomalies
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {data.anomalies.length > 0 ? (
                data.anomalies.map(anomaly => (
                  <AnomalyCard key={anomaly.id} anomaly={anomaly} />
                ))
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg text-emerald-400 text-center">
                  No anomalies detected. Great job!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}