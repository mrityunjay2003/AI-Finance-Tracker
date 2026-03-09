import React,{ useState, useRef } from 'react';
import { UploadCloud, FileText, Database } from 'lucide-react';

const SAMPLE_CSV = `Date,Description,Amount
2023-10-01,Netflix,-15.99
2023-10-02,Whole Foods,-120.50
2023-10-03,Uber,-24.00
2023-10-05,TechCorp Salary,4500.00
2023-10-10,Amazon,-89.99
2023-10-15,Electric Bill,-145.20
2023-10-20,Whole Foods,-130.00
2023-10-25,Uber,-26.50
2023-10-26,Apple Store,-1299.00
2023-10-26,Apple Store,-1299.00
2023-11-01,Netflix,-15.99
2023-11-05,TechCorp Salary,4500.00
2023-11-12,Gym Membership,-50.00
2023-11-18,Starbucks,-6.50
2023-11-22,Flight to NYC,-450.00`;

export default function FileUpload({ onUpload }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const sampleFile = new File([blob], "sample_statement.csv", { type: "text/csv" });
    onUpload(sampleFile);
  };

  return (
    <div className="max-w-2xl mx-auto mt-12">
      <div 
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors
          ${dragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-800'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          ref={inputRef} type="file" className="hidden" accept=".csv" onChange={handleChange}
        />
        
        {file ? (
          <div className="flex flex-col items-center gap-4">
            <FileText className="w-16 h-16 text-indigo-400" />
            <p className="text-lg font-medium text-slate-200">{file.name}</p>
            <button 
              onClick={() => onUpload(file)}
              className="mt-4 px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
            >
              Analyze Statement
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <UploadCloud className="w-16 h-16 text-slate-400" />
            <p className="text-lg text-slate-300">Drag & drop your bank statement CSV</p>
            <p className="text-sm text-slate-500">or</p>
            <button 
              onClick={() => inputRef.current.click()}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Browse Files
            </button>
          </div>
        )}
      </div>

      {!file && (
        <div className="mt-8 text-center">
          <p className="text-slate-500 mb-4">Don't have a CSV handy?</p>
          <button 
            onClick={handleSample}
            className="flex items-center gap-2 mx-auto px-4 py-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
          >
            <Database className="w-4 h-4" /> Use Sample Data
          </button>
        </div>
      )}
    </div>
  );
}