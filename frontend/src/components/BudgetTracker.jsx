import React,{ useState, useEffect } from 'react';
import { Settings, AlertTriangle, Loader2 } from 'lucide-react';
import { analyzeBudget } from '../api/client';

export default function BudgetTracker({ categoryTotals, sessionId }) {
  const [isEditing, setIsEditing] = useState(false);
  const [budgets, setBudgets] = useState({});
  const [budgetStatus, setBudgetStatus] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const categories = Object.keys(categoryTotals || {}).filter(c => categoryTotals[c] > 0);

  useEffect(() => {
    if (categories.length > 0 && !budgetStatus && !isEditing) {
      setIsEditing(true);
    }
  }, [categories, budgetStatus, isEditing]);

  const handleApply = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await analyzeBudget(sessionId, budgets);
      setBudgetStatus(res.budget_status);
      setWarnings(res.warnings);
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to analyze budgets.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBudgetChange = (cat, val) => {
    setBudgets(prev => ({ ...prev, [cat]: parseFloat(val) || 0 }));
  };

  return (
    <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl mt-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          Budget Goals
        </h3>
        {!isEditing && budgetStatus && (
          <button onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-indigo-400 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : isEditing ? (
        <div className="space-y-4">
          <p className="text-slate-400 text-sm mb-4">Set your monthly spending limits for active categories.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map(cat => (
              <div key={cat} className="flex flex-col">
                <label className="text-slate-300 text-sm mb-1">{cat}</label>
                <input
                  type="number"
                  placeholder="Set limit (₹)"
                  value={budgets[cat] || ''}
                  onChange={(e) => handleBudgetChange(cat, e.target.value)}
                  className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            ))}
          </div>
          {categories.length === 0 && (
            <p className="text-slate-500 text-sm py-4">No active expense categories found to budget.</p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            {budgetStatus && (
              <button 
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-slate-300 hover:text-white transition-colors text-sm"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleApply}
              disabled={Object.values(budgets).every(v => !v)}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Apply & Analyze
            </button>
          </div>
        </div>
      ) : budgetStatus ? (
        <div className="space-y-5">
          {Object.entries(budgetStatus).map(([cat, data]) => {
            const isDanger = data.status === 'danger';
            const isWarning = data.status === 'warning';
            const colorClass = isDanger ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500';
            const badgeClass = isDanger ? 'bg-red-500/20 text-red-400 border-red-500/30' : 
                               isWarning ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 
                               'bg-green-500/20 text-green-400 border-green-500/30';
            const label = isDanger ? 'OVER BUDGET' : isWarning ? 'NEAR LIMIT' : 'ON TRACK';

            return (
              <div key={cat} className="space-y-2">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-slate-200 font-medium block">{cat}</span>
                    <span className="text-slate-400 text-xs">₹{data.spent.toLocaleString()} / ₹{data.budget.toLocaleString()}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}>
                    {label}
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2">
                  <div 
                    className={`${colorClass} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(data.percent, 100)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}

          {warnings.length > 0 && (
            <div className="mt-6 space-y-2 pt-4 border-t border-slate-700">
              {warnings.map((w, i) => (
                <div key={i} className="flex gap-3 bg-slate-900/50 border border-amber-500/20 p-3 rounded-lg text-slate-300 text-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                  <p>{w}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 text-slate-500">
          Set budget goals to track your spending limits.
        </div>
      )}
    </div>
  );
}