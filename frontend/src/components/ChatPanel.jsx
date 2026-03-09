import React,{ useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, ChevronDown, ChevronUp } from 'lucide-react';
import { streamChat } from '../api/client';

export default function ChatPanel({ sessionId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I have analyzed your financial data. Ask me anything about your spending habits, trends, or anomalies.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestedQs = [
    "Where did I spend the most?",
    "How can I reduce my expenses?",
    "What are my biggest anomalies?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    let assistantResponse = '';
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      await streamChat(sessionId, newMessages, (chunk) => {
        assistantResponse += chunk;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1].content = assistantResponse;
          return updated;
        });
      });
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error answering that." }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-indigo-500 hover:bg-indigo-600 text-white p-4 rounded-full shadow-lg shadow-indigo-500/20 transition-transform hover:scale-105"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden h-[500px] max-h-[80vh]">
      {/* Header */}
      <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">
        <div className="flex items-center gap-2 text-white font-medium">
          <MessageSquare className="w-5 h-5 text-indigo-400" />
          Finance AI Assistant
        </div>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
              m.role === 'user' ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-700 text-slate-400 p-3 rounded-2xl rounded-bl-none flex gap-1 items-center h-10">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length === 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {suggestedQs.map((q, idx) => (
            <button 
              key={idx} 
              onClick={() => handleSend(q)}
              className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-full transition-colors border border-slate-600"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-slate-900 border-t border-slate-700">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
          className="flex items-center gap-2"
        >
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your finances..." 
            className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-full px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isTyping}
            className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-700 text-white p-2 rounded-full transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}