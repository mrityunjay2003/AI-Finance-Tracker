import React, { useState, useMemo } from 'react';
import { Search, Tag, X, Download, Check } from 'lucide-react';

export default function TransactionTable({ transactions, categoryTotals, insights }) {
  const [tags, setTags] = useState({});
  const [filterTag, setFilterTag] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRowId, setEditingRowId] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [showAll, setShowAll] = useState(false);

  const PRESET_TAGS = ["Business", "Reimbursable", "Tax Deductible", "Personal", "Subscription"];
  const uniqueTags = useMemo(() => Array.from(new Set(Object.values(tags))), [tags]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = filterTag ? tags[t.id] === filterTag : true;
      return matchesSearch && matchesTag;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, searchQuery, filterTag, tags]);

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
      const module = await import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      const jsPDF = module.jsPDF || window.jspdf.jsPDF;
      await import('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js');

      const doc = new jsPDF();
      let yPos = 20;

      // 1. Header
      doc.setFontSize(20);
      doc.text("Personal Finance Report", 14, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, yPos);
      yPos += 6;
      doc.setDrawColor(200);
      doc.line(14, yPos, 196, yPos);
      yPos += 12;

      // 2. Summary Stats
      const totalIncome = transactions.filter(t => t.amount > 0 && t.category === 'Income').reduce((s, t) => s + t.amount, 0);
      const totalSpent = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
      const netSavings = totalIncome - totalSpent;

      doc.setTextColor(0);
      doc.setFontSize(12);
      doc.text(`Total Income: Rs. ${totalIncome.toFixed(2)}`, 14, yPos);
      doc.text(`Total Expenses: Rs. ${totalSpent.toFixed(2)}`, 80, yPos);
      doc.text(`Net Savings: Rs. ${netSavings.toFixed(2)}`, 145, yPos);
      yPos += 15;

      // 3. Category Breakdown
      const catRows = Object.entries(categoryTotals)
        .filter(([_, val]) => val > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, val]) => [cat, `Rs. ${val.toFixed(2)}`, `${((val / totalSpent) * 100).toFixed(1)}%`]);

      doc.autoTable({
        startY: yPos,
        head: [['Category', 'Amount Spent', '% of Total']],
        body: catRows,
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] }
      });
      yPos = doc.lastAutoTable.finalY + 15;

      // 4. AI Insights
      if (insights && insights.length > 0) {
        doc.setFontSize(14);
        doc.text("AI Insights", 14, yPos);
        yPos += 8;
        doc.setFontSize(10);
        insights.forEach(insight => {
          const lines = doc.splitTextToSize(`• ${insight}`, 180);
          doc.text(lines, 14, yPos);
          yPos += (lines.length * 5) + 2;
        });
        yPos += 10;
      }

      // 5. Tagged Transactions
      if (uniqueTags.length > 0) {
        doc.setFontSize(14);
        doc.text("Tagged Transactions", 14, yPos);
        yPos += 8;

        uniqueTags.forEach(tag => {
          const taggedTx = transactions.filter(t => tags[t.id] === tag);
          if (taggedTx.length === 0) return;
          
          doc.setFontSize(11);
          doc.setTextColor(99, 102, 241);
          doc.text(`Tag: ${tag}`, 14, yPos);
          yPos += 4;
          
          doc.autoTable({
            startY: yPos,
            head: [['Date', 'Description', 'Category', 'Amount']],
            body: taggedTx.map(t => [t.date, t.description, t.category, `Rs. ${t.amount.toFixed(2)}`]),
            theme: 'grid',
            headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42] }
          });
          yPos = doc.lastAutoTable.finalY + 10;
        });
      }

      // 6. Full Transaction List
      doc.addPage();
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("All Transactions", 14, 20);
      
      doc.autoTable({
        startY: 28,
        head: [['Date', 'Description', 'Category', 'Amount', 'Tag']],
        body: transactions.map(t => [
          t.date, 
          t.description, 
          t.category, 
          `Rs. ${t.amount.toFixed(2)}`, 
          tags[t.id] || ''
        ]),
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] }
      });

      doc.save(`finance-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      alert("Failed to load PDF export engine. Check network connection.");
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl mt-6 overflow-hidden">
      <div className="p-6 border-b border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          Transactions
        </h3>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 w-full md:w-48"
            />
          </div>
          
          <select 
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Tags</option>
            {uniqueTags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <button 
            onClick={exportPDF}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors ml-auto md:ml-0"
          >
            <Download className="w-4 h-4" /> Export PDF Report
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
                <td className="px-6 py-4 whitespace-nowrap">{t.date}</td>
                <td className="px-6 py-4 truncate max-w-xs" title={t.description}>{t.description}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="bg-slate-700 px-2 py-1 rounded text-xs">{t.category}</span>
                </td>
                <td className={`px-6 py-4 font-medium whitespace-nowrap ${t.amount < 0 ? 'text-red-400' : 'text-green-400'}`}>
                  ₹{Math.abs(t.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                </td>
                <td className="px-6 py-4">
                  {tags[t.id] ? (
                    <span className="inline-flex items-center gap-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded-full text-xs">
                      {tags[t.id]}
                      <button onClick={() => handleRemoveTag(t.id)} className="hover:text-indigo-100 ml-1">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ) : editingRowId === t.id ? (
                    <div className="flex flex-col gap-2 relative z-10">
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          autoFocus
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddTag(t.id, tagInput);
                            if (e.key === 'Escape') setEditingRowId(null);
                          }}
                          className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-xs w-28 focus:outline-none focus:border-indigo-500"
                          placeholder="Type tag..."
                        />
                        <button onClick={() => handleAddTag(t.id, tagInput)} className="text-green-400 hover:text-green-300">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingRowId(null)} className="text-slate-400 hover:text-slate-300">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-600 rounded shadow-xl p-2 flex flex-wrap gap-1 w-48 z-20">
                        {PRESET_TAGS.map(preset => (
                          <button
                            key={preset}
                            onClick={() => handleAddTag(t.id, preset)}
                            className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-0.5 rounded text-[10px] transition-colors"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { setEditingRowId(t.id); setTagInput(''); }}
                      className="flex items-center gap-1 text-slate-500 hover:text-indigo-400 transition-colors text-xs"
                    >
                      <Tag className="w-3 h-3" /> + Tag
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {displayedTransactions.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                  No transactions found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {!showAll && filteredTransactions.length > 50 && (
        <div className="p-4 border-t border-slate-700 text-center">
          <button 
            onClick={() => setShowAll(true)}
            className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
          >
            Show all {filteredTransactions.length} transactions
          </button>
        </div>
      )}
    </div>
  );
}