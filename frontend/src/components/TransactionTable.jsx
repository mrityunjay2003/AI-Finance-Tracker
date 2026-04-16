import React, { useState, useMemo, useEffect } from 'react';
import { Search, Tag, X, Download, Check, Loader2 } from 'lucide-react';
import { semanticSearch } from '../api/client';

export default function TransactionTable({ transactions, categoryTotals, insights, sessionId }) {
  const [tags, setTags] = useState({});
  const [filterTag, setFilterTag] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [semanticResults, setSemanticResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [editingRowId, setEditingRowId] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [showAll, setShowAll] = useState(false);

  const PRESET_TAGS = ["Business", "Reimbursable", "Tax Deductible", "Personal", "Subscription"];
  const uniqueTags = useMemo(() => Array.from(new Set(Object.values(tags))), [tags]);

  // Feature A: RAG Semantic Search Debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 2) {
        setIsSearching(true);
        try {
          const results = await semanticSearch(sessionId, searchQuery);
          setSemanticResults(results);
        } catch (e) {
          console.error("Semantic search failed:", e);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSemanticResults(null);
      }
    }, 400); // 400ms debounce to save API costs

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, sessionId]);

  const filteredTransactions = useMemo(() => {
    // Use semantic results from RAG if available, otherwise use original list
    const sourceData = semanticResults || transactions;

    return sourceData.filter(t => {
      // If we have semantic results, the AI already handled the text matching
      const matchesSearch = semanticResults ? true : t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = filterTag ? tags[t.id] === filterTag : true;
      return matchesSearch && matchesTag;
    }).sort((a, b) => {
      // If semantic search is active, keep the AI's relevance ranking
      if (semanticResults) return 0;
      return new Date(b.date) - new Date(a.date);
    });
  }, [transactions, searchQuery, filterTag, tags, semanticResults]);

  const displayedTransactions = showAll ? filteredTransactions : filteredTransactions.slice(0, 50);

  const handleAddTag = (id, tagValue) => {
    if (!tagValue.trim()) return;
    setTags(prev => ({ ...prev, [id]: tagValue.trim() }));
    setEditingRowId(null);
    setTagInput('');
  };

  const handleRemoveTag = (id) => {
    setTags(prev => {
      const newTags = { ...prev };
      delete newTags[id];
      return newTags;
    });
  };

  const exportPDF = async () => {
    try {
      const jspdfModule = await import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      const jsPDF = jspdfModule.jsPDF || window.jspdf.jsPDF;
      await import('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js');

      const h2cModule = await import('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
      const html2canvas = h2cModule.default || window.html2canvas;

      if (!html2canvas) throw new Error("html2canvas library not found");

      const doc = new jsPDF();
      let yPos = 20;

      doc.setFontSize(22);
      doc.text("AI Financial Analysis Report", 14, yPos);
      yPos += 15;

      const chartElement = document.getElementById('category-pie-chart');

      if (chartElement) {
        const canvas = await html2canvas(chartElement, {
          backgroundColor: '#1e293b',
          scale: 2,
          useCORS: true,
          logging: false
        });
        const chartImg = canvas.toDataURL('image/png');

        doc.setFontSize(14);
        doc.text("Spending Visual Breakdown", 14, yPos);
        yPos += 5;

        doc.addImage(chartImg, 'PNG', 14, yPos, 80, 60);

        const catRows = Object.entries(categoryTotals)
          .filter(([_, val]) => val > 0)
          .sort((a, b) => b[1] - a[1])
          .map(([cat, val]) => [cat, `Rs. ${val.toLocaleString()}`]);

        doc.autoTable({
          startY: yPos,
          margin: { left: 100 },
          tableWidth: 90,
          head: [['Category', 'Amount']],
          body: catRows,
          theme: 'striped',
          headStyles: { fillColor: [99, 102, 241] },
          styles: { fontSize: 8 }
        });

        yPos = Math.max(yPos + 65, doc.lastAutoTable.finalY + 15);
      }

      doc.setFontSize(14);
      doc.text("AI Financial Insights", 14, yPos);
      yPos += 8;
      doc.setFontSize(10);

      insights.forEach(insight => {
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        const lines = doc.splitTextToSize(`• ${insight}`, 175);
        doc.text(lines, 14, yPos);
        yPos += (lines.length * 5) + 2;
      });

      doc.addPage();
      doc.setFontSize(14);
      doc.text("Full Transaction History", 14, 20);
      doc.autoTable({
        startY: 28,
        head: [['Date', 'Description', 'Category', 'Amount']],
        body: transactions.map(t => [t.date, t.description, t.category, `Rs. ${t.amount.toFixed(2)}`]),
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] }
      });

      doc.save(`Finance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error(err);
      alert("PDF Generation Error: " + err.message);
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl mt-6 overflow-hidden">
      <div className="p-6 border-b border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Transactions</h3>
          {semanticResults && (
            <p className="text-[10px] text-indigo-400 uppercase tracking-wider font-bold mt-1">
              Semantic Search Active
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search context..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 w-full md:w-48"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" />
              </div>
            )}
          </div>

          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Tags</option>
            {uniqueTags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <button onClick={exportPDF} className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium">Description</th>
              <th className="px-6 py-3 font-medium">Category</th>
              <th className="px-6 py-3 font-medium">Amount</th>
              <th className="px-6 py-3 font-medium w-48">Tag</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {displayedTransactions.map((t) => (
              <tr key={t.id} className="hover:bg-slate-750/50 transition-colors">
                <td className="px-6 py-4">{t.date}</td>
                <td className="px-6 py-4 truncate max-w-xs">{t.description}</td>
                <td className="px-6 py-4">
                  <span className="bg-slate-700 px-2 py-1 rounded text-xs">{t.category}</span>
                </td>
                <td className={`px-6 py-4 font-medium ${t.amount < 0 ? 'text-red-400' : 'text-green-400'}`}>
                  ₹{Math.abs(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4">
                  {tags[t.id] ? (
                    <span className="inline-flex items-center gap-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded-full text-xs">
                      {tags[t.id]}
                      <button onClick={() => handleRemoveTag(t.id)}><X className="w-3 h-3" /></button>
                    </span>
                  ) : editingRowId === t.id ? (
                    <input
                      type="text" autoFocus value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onBlur={() => handleAddTag(t.id, tagInput)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag(t.id, tagInput)}
                      className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-xs w-28"
                    />
                  ) : (
                    <button onClick={() => setEditingRowId(t.id)} className="text-slate-500 hover:text-indigo-400 text-xs flex items-center gap-1">
                      <Tag className="w-3 h-3" /> + Tag
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!showAll && filteredTransactions.length > 50 && (
        <div className="p-4 border-t border-slate-700 text-center">
          <button onClick={() => setShowAll(true)} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
            Show all {filteredTransactions.length} transactions
          </button>
        </div>
      )}
    </div>
  );
}