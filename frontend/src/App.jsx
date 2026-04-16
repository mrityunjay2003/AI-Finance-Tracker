import React, { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import ChatPanel from './components/ChatPanel';
import { uploadFile, analyzeSession } from './api/client';
import { Loader2, RefreshCw } from 'lucide-react';

export default function App() {
  // 1. Initialize state from sessionStorage to handle page refreshes
  const [stage, setStage] = useState(() => {
    return sessionStorage.getItem('finance_stage') || 'idle';
  });
  
  const [sessionId, setSessionId] = useState(() => {
    return sessionStorage.getItem('finance_sessionId') || null;
  });
  
  const [analysisResult, setAnalysisResult] = useState(() => {
    const saved = sessionStorage.getItem('finance_result');
    return saved ? JSON.parse(saved) : null;
  });

  // Feature D: State for Privacy Redaction Count
  const [piiCount, setPiiCount] = useState(() => {
    return parseInt(sessionStorage.getItem('finance_pii') || '0', 10);
  });
  
  const [error, setError] = useState(null);

  // 2. Persist all state changes to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('finance_stage', stage);
    if (sessionId) sessionStorage.setItem('finance_sessionId', sessionId);
    if (analysisResult) sessionStorage.setItem('finance_result', JSON.stringify(analysisResult));
    sessionStorage.setItem('finance_pii', piiCount.toString());
  }, [stage, sessionId, analysisResult, piiCount]);

  const handleUpload = async (file) => {
    try {
      setError(null);
      setStage('uploaded');

      // Step 1: Upload and Redact PII
      const uploadRes = await uploadFile(file);
      setSessionId(uploadRes.session_id);
      setPiiCount(uploadRes.pii_redacted_count); // Capture the redaction count from Feature D
      
      // Step 2: Run AI Categorization, Subscriptions, and RAG Indexing
      const analysisRes = await analyzeSession(uploadRes.session_id);
      setAnalysisResult(analysisRes);
      setStage('analyzed');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "An error occurred during analysis.");
      setStage('idle');
    }
  };

  const handleReset = () => {
    sessionStorage.clear();
    setStage('idle');
    setSessionId(null);
    setAnalysisResult(null);
    setPiiCount(0);
    setError(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <span className="text-indigo-500">AI</span> Finance Analyzer
          </h1>
          <p className="text-slate-400 mt-1">Intelligent insights for your spending habits</p>
        </div>
        
        {stage !== 'idle' && (
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Start Over
          </button>
        )}
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 underline text-sm">Dismiss</button>
        </div>
      )}

      {/* Stage: Idle - Initial Upload View */}
      {stage === 'idle' && <FileUpload onUpload={handleUpload} />}
      
      {/* Stage: Uploaded - Show AI processing state */}
      {stage === 'uploaded' && (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
          <h2 className="text-xl text-slate-300">Processing with Privacy Guard & AI...</h2>
          <p className="text-slate-500 text-center max-w-md">
            Scrubbing PII, identifying subscriptions, and building your semantic search index.
          </p>
        </div>
      )}

      {/* Stage: Analyzed - Final Dashboard View */}
      {stage === 'analyzed' && analysisResult && (
        <>
          <Dashboard 
            data={analysisResult} 
            piiCount={piiCount} 
          />
          <ChatPanel sessionId={sessionId} />
        </>
      )}
    </div>
  );
}