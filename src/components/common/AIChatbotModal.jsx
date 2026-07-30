import React, { useState } from 'react';
import { Bot, X, Send, Sparkles, HelpCircle, FileText, Info } from 'lucide-react';

const KNOWLEDGE_BASE = {
  cbc: 'Complete Blood Count (CBC) measures red blood cells, white blood cells, hemoglobin, and platelets. Preparation: No fasting required.',
  thyroid: 'Thyroid Profile (T3, T4, TSH) assesses thyroid gland performance. Preparation: 8-10 hours fasting recommended.',
  lft: 'Liver Function Test (LFT) evaluates bilirubin, SGOT, SGPT, and ALP enzymes. Preparation: Overnight 10-12 hours fasting required.',
  hba1c: 'HbA1c measures average blood sugar over the last 3 months. Preparation: No fasting required, can be taken anytime.',
  home: 'Home Collection is available Monday to Saturday 07:00 AM to 07:30 PM. Phlebotomists arrive with sterile vacutainer kits within 30 minutes.',
  report: 'Reports are verified and digitally signed by Consultant Pathologist Dr. Sunita Rao (MD, Path) and published within 4 hours.',
};

export const AIChatbotModal = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am LifeLong AI Assistant. I can help with test preparation, laboratory timings, booking assistance, and report explanations.',
    },
  ]);
  const [input, setInput] = useState('');

  if (!isOpen) return null;

  const handleSend = (textToSend) => {
    const query = (textToSend || input).trim().toLowerCase();
    if (!query) return;

    const userMsg = { sender: 'user', text: textToSend || input };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');

    // Generate intelligent AI response
    let reply = 'Thank you for your question. For medical diagnosis, please consult a physician. Regarding our lab services: ';
    if (query.includes('cbc') || query.includes('blood count')) {
      reply = KNOWLEDGE_BASE.cbc;
    } else if (query.includes('thyroid') || query.includes('tsh')) {
      reply = KNOWLEDGE_BASE.thyroid;
    } else if (query.includes('liver') || query.includes('lft')) {
      reply = KNOWLEDGE_BASE.lft;
    } else if (query.includes('sugar') || query.includes('hba1c') || query.includes('diabetes')) {
      reply = KNOWLEDGE_BASE.hba1c;
    } else if (query.includes('home') || query.includes('visit') || query.includes('sample')) {
      reply = KNOWLEDGE_BASE.home;
    } else if (query.includes('report') || query.includes('result')) {
      reply = KNOWLEDGE_BASE.report;
    } else {
      reply = 'LifeLong Diagnostics operates Monday to Saturday 06:00 AM to 09:30 PM. We offer 100+ NABL accredited pathology tests, instant home sample collection, and digitally signed PDF reports.';
    }

    setTimeout(() => {
      setMessages((prev) => [...prev, { sender: 'bot', text: reply }]);
    }, 400);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden h-[500px]">
      {/* Header */}
      <div className="bg-slate-800 p-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              LifeLong AI Assistant <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h3>
            <p className="text-[10px] text-slate-400">Lab Info, Prep & Report Guide</p>
          </div>
        </div>

        <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs bg-slate-950/60">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-2xl ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-bl-none'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Prompts */}
      <div className="p-2 bg-slate-900 border-t border-slate-800 flex gap-1.5 overflow-x-auto text-[10px]">
        <button
          onClick={() => handleSend('Fasting instructions for LFT?')}
          className="bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
        >
          LFT Fasting
        </button>
        <button
          onClick={() => handleSend('How does Home Collection work?')}
          className="bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
        >
          Home Collection
        </button>
        <button
          onClick={() => handleSend('Thyroid Test Preparation?')}
          className="bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
        >
          Thyroid Prep
        </button>
      </div>

      {/* Input */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask AI about tests, prep, or reports..."
          className="flex-1 bg-slate-800 text-white text-xs px-3.5 py-2 rounded-xl border border-slate-700 focus:outline-none"
        />
        <button
          onClick={() => handleSend()}
          className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AIChatbotModal;
