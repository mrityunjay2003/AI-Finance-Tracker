import React from "react";
export default function AnomalyCard({ anomaly }) {
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-slate-200 font-medium">{anomaly.description}</p>
          <p className="text-slate-400 text-xs">{anomaly.date}</p>
        </div>
        <p className="text-amber-400 font-bold">
          ₹{Math.abs(anomaly.amount).toFixed(2)}
        </p>
      </div>
      <p className="text-amber-200/80 text-sm bg-amber-500/10 p-2 rounded inline-block mt-1">
        {anomaly.anomaly_reason}
      </p>
    </div>
  );
}