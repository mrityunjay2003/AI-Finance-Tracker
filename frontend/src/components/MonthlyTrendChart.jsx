import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function MonthlyTrendChart({ data }) {
  const chartData = Object.entries(data).map(([month, net]) => ({
    month,
    amount: net,
    fill: net >= 0 ? '#10b981' : '#ef4444' // green if net positive, red if net negative
  }));

  if (chartData.length === 0) return <div className="text-slate-500 text-center py-10">No monthly data</div>;

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
          <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} tickFormatter={(val) => `₹${val}`} />
          <Tooltip
            cursor={{ fill: '#334155', opacity: 0.4 }}
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
            formatter={(value) => [`₹${value.toFixed(2)}`, 'Net Change']}
          />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}