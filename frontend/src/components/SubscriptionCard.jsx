import React from 'react';
import { Repeat } from 'lucide-react';

export default function SubscriptionCard({ subscriptions }) {
  if (!subscriptions || subscriptions.length === 0) return null;

  const totalMonthly = subscriptions.reduce((acc, sub) => acc + sub.amount, 0);

  return (
    <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Repeat className="w-5 h-5 text-indigo-400" />
        Detected Subscriptions
      </h3>
      <div className="mb-4">
        <p className="text-sm text-slate-400">Estimated Monthly Run-Rate</p>
        <p className="text-2xl font-bold text-indigo-400">₹{totalMonthly.toFixed(2)}</p>
      </div>
      <div className="space-y-3">
        {subscriptions.map((sub, idx) => (
          <div key={idx} className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-700">
            <div>
              <p className="text-slate-200 font-medium text-sm">{sub.description}</p>
              <p className="text-xs text-slate-500">Last charged: {sub.last_charged}</p>
            </div>
            <p className="text-slate-300 font-medium">₹{sub.amount.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}