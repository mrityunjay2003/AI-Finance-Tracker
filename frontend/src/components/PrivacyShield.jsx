import { ShieldCheck } from 'lucide-react';

export default function PrivacyShield({ piiCount }) {
  if (piiCount === 0) return null;

  return (
    <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-500/20 rounded-lg">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-emerald-400 font-semibold text-sm">Zero-Trust Privacy Shield Active</h3>
          <p className="text-slate-300 text-xs mt-0.5">
            {piiCount} sensitive PII elements (emails, cards, phones) were redacted before AI processing.
          </p>
        </div>
      </div>
    </div>
  );
}