import React from 'react';
import { Lightbulb } from 'lucide-react';

export default function InsightPanel({ insights }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-indigo-400" />
        AI Financial Insights
      </h3>
      <div className="space-y-3">
        {insights.map((insight, idx) => (
          <div 
            key={idx} 
            className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-300 text-sm leading-relaxed"
            style={{ animation: `fadeIn 0.5s ease-out ${idx * 0.1}s both` }}
          >
            {insight}
          </div>
        ))}
      </div>
    </div>
  );
}