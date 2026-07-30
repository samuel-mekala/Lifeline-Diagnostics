import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  X,
  Send,
  Sparkles,
  CalendarPlus,
  LifeBuoy,
  PhoneCall,
  TestTube,
  Package as PackageIcon,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

const TEST_DATABASE = [
  { keywords: ['cbc', 'blood count', 'hemoglobin'], name: 'Complete Blood Picture (CBC)', price: '₹300 (Walk-In) / ₹450 (Home)', prep: 'No fasting required. Sample: EDTA Blood.' },
  { keywords: ['esr', 'erythrocyte'], name: 'Erythrocyte Sedimentation Rate (ESR)', price: '₹100 (Walk-In) / ₹150 (Home)', prep: 'No special preparation needed. Sample: Blood.' },
  { keywords: ['hba1c', 'sugar', 'diabetes', 'glycated'], name: 'Glycated Hemoglobin (HbA1c)', price: '₹500 (Walk-In) / ₹750 (Home)', prep: 'Random or fasting sample accepted. Sample: Blood.' },
  { keywords: ['calcium', 'serum calcium'], name: 'Serum Calcium Test', price: '₹500 (Walk-In) / ₹750 (Home)', prep: 'Overnight fasting recommended. Sample: Serum.' },
  { keywords: ['testosterone', 'hormone'], name: 'Total Testosterone Test', price: '₹1500 (Walk-In) / ₹2250 (Home)', prep: 'Morning sample preferred (07:00 AM – 10:00 AM). Sample: Serum.' },
  { keywords: ['b12', 'vitamin b12', 'cobalamin'], name: 'Vitamin B12 Assay', price: '₹900 (Walk-In) / ₹1350 (Home)', prep: '10-12 hours overnight fasting required. Sample: Serum.' },
  { keywords: ['vitamin d', 'd3', 'vitamin d3'], name: 'Vitamin D3 Total (25-OH)', price: '₹1000 (Walk-In) / ₹1500 (Home)', prep: 'No special fasting required. Sample: Serum.' },
  { keywords: ['iron', 'iron profile', 'ferritin'], name: 'Iron Profile (Fe, TIBC, % Sat)', price: '₹800 (Walk-In) / ₹1200 (Home)', prep: '12 hours fasting required. Sample: Serum.' },
  { keywords: ['kidney', 'kft', 'creatinine', 'urea'], name: 'Kidney Function Mini Profile (KFT)', price: '₹800 (Walk-In) / ₹1200 (Home)', prep: '8-10 hours fasting recommended. Sample: Serum.' },
  { keywords: ['lipid', 'cholesterol', 'triglycerides'], name: 'Lipid Profile Complete', price: '₹500 (Walk-In) / ₹750 (Home)', prep: '10-12 hours strict overnight fasting. Sample: Serum.' },
  { keywords: ['liver', 'lft', 'sgot', 'sgpt', 'bilirubin'], name: 'Liver Function Test (LFT)', price: '₹500 (Walk-In) / ₹750 (Home)', prep: 'Overnight 10-12 hours fasting required. Sample: Serum.' },
  { keywords: ['cue', 'urine', 'urine exam'], name: 'Complete Urine Examination (CUE)', price: '₹200 (Walk-In) / ₹300 (Home)', prep: 'First morning mid-stream urine sample. Sample: Urine.' },
  { keywords: ['thyroid', 'tsh', 't3', 't4'], name: 'Thyroid Profile I (T3, T4, TSH)', price: '₹500 (Walk-In) / ₹750 (Home)', prep: '8-10 hours fasting recommended. Sample: Serum.' },
  { keywords: ['fbs', 'fasting sugar'], name: 'Fasting Blood Sugar (FBS)', price: '₹50 (Walk-In) / ₹75 (Home)', prep: 'Strict 8-10 hours overnight fasting. Sample: Blood.' },
  { keywords: ['ppbs', 'post prandial'], name: 'Post Prandial Blood Sugar (PPBS)', price: '₹50 (Walk-In) / ₹75 (Home)', prep: 'Sample drawn exactly 2 hours after breakfast. Sample: Blood.' },
];

const NON_BOOKING_KEYWORDS = [
  'doctor', 'diagnosis', 'symptom', 'cure', 'medicine', 'prescription',
  'treatment', 'fever', 'pain', 'disease', 'illness', 'cancer', 'infection', 'treat'
];

export const AIChatbotModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      type: 'greeting',
      text: '👋 Hello! I am your LifeLong Diagnostic Booking Assistant. I specialize exclusively in helping you find diagnostic tests, check prices, and schedule Home Sample Pickup or Lab Visits.',
    },
  ]);
  const [input, setInput] = useState('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const lower = query.toLowerCase();
    const userMsg = { sender: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');

    // Check for non-booking query (medical advice, diagnosis, general symptoms)
    const isMedicalQuery = NON_BOOKING_KEYWORDS.some((kw) => lower.includes(kw));

    setTimeout(() => {
      if (isMedicalQuery) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            type: 'out_of_scope',
            text: 'I am your Test Booking Assistant and specialize in helping you find and schedule diagnostic lab tests. For medical diagnosis or clinical treatment, please consult a registered medical practitioner.',
            showActionButtons: true,
          },
        ]);
        return;
      }

      // Check matching test in catalog
      const matchedTest = TEST_DATABASE.find((t) =>
        t.keywords.some((kw) => lower.includes(kw))
      );

      if (matchedTest) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            type: 'test_info',
            text: `Here is the booking information for **${matchedTest.name}**:`,
            test: matchedTest,
            showBookButton: true,
          },
        ]);
        return;
      }

      // Check home collection inquiry
      if (lower.includes('home') || lower.includes('visit') || lower.includes('pickup') || lower.includes('how to book')) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            type: 'home_info',
            text: '🏠 **Home Sample Collection Process:**\n\n1. Select your tests or health package.\n2. Choose **Home Collection** at step 2.\n3. Pick an existing saved address or enter a new address.\n4. Select your preferred date & time slot.\n\nOur phlebotomist arrives with sterile vacutainer kits.',
            showBookButton: true,
          },
        ]);
        return;
      }

      // Check package inquiry
      if (lower.includes('package') || lower.includes('full body') || lower.includes('checkup') || lower.includes('ayush')) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            type: 'package_info',
            text: '📦 **Popular Health Checkup Packages:**\n\n• **Ayush-2 Full Body Checkup (10 Tests)** — ₹750\n• **Ayush-3 Master Health Checkup (13 Tests)** — ₹1,500\n• **Cardiac & Metabolic Care Package (6 Tests)** — ₹999',
            showBookButton: true,
          },
        ]);
        return;
      }

      // Default polite scope restriction
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          type: 'general_help',
          text: 'I can assist you with searching for diagnostic tests (e.g., CBC, HbA1c, Vitamin D3, Thyroid), checking prices, or booking a lab visit / home collection.',
          showActionButtons: true,
        },
      ]);
    }, 350);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-700/80 flex flex-col overflow-hidden h-[540px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-slate-900 p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
              <span>LifeLong Test Booking AI</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h3>
            <p className="text-[10px] text-blue-300 font-semibold">Strictly Diagnostic Test & Booking Assistance</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs bg-slate-950/70 custom-scrollbar">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[88%] p-3.5 rounded-2xl space-y-2.5 ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white font-medium rounded-br-none shadow-md'
                  : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-line leading-relaxed">{m.text}</p>

              {/* Test Info Box */}
              {m.test && (
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-700/80 space-y-1.5 text-[11px]">
                  <div className="font-bold text-blue-400">{m.test.name}</div>
                  <div className="text-emerald-400 font-extrabold">Price: {m.test.price}</div>
                  <div className="text-slate-400">{m.test.prep}</div>
                </div>
              )}

              {/* 1-Click Book Action Button */}
              {m.showBookButton && (
                <button
                  onClick={() => {
                    onClose();
                    navigate('/portal/appointments/book');
                  }}
                  className="w-full py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer mt-1"
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span>Book Appointment Now</span>
                </button>
              )}

              {/* Non-Booking / Out of Scope Action Buttons */}
              {m.showActionButtons && (
                <div className="pt-2 border-t border-slate-700/60 space-y-2">
                  <p className="text-[10px] text-slate-400 font-semibold">How would you like to connect with our care team?</p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        onClose();
                        navigate('/portal/support');
                      }}
                      className="py-1.5 px-2.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LifeBuoy className="w-3.5 h-3.5" />
                      <span>Raise Support Ticket</span>
                    </button>

                    <a
                      href="tel:+919876543210"
                      className="py-1.5 px-2.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors text-center text-decoration-none"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call Lab Reception</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Action Chips */}
      <div className="p-2.5 bg-slate-900 border-t border-slate-800 flex gap-1.5 overflow-x-auto text-[10px] custom-scrollbar">
        <button
          onClick={() => handleSend('What is the price of CBC test?')}
          className="bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold px-3 py-1 rounded-full whitespace-nowrap border border-slate-700 cursor-pointer"
        >
          CBC Test Price
        </button>
        <button
          onClick={() => handleSend('How do I book Home Collection?')}
          className="bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold px-3 py-1 rounded-full whitespace-nowrap border border-slate-700 cursor-pointer"
        >
          Home Collection
        </button>
        <button
          onClick={() => handleSend('HbA1c Diabetes Test')}
          className="bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold px-3 py-1 rounded-full whitespace-nowrap border border-slate-700 cursor-pointer"
        >
          HbA1c Test
        </button>
        <button
          onClick={() => handleSend('Ayush Full Body Checkup Package')}
          className="bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold px-3 py-1 rounded-full whitespace-nowrap border border-slate-700 cursor-pointer"
        >
          Health Packages
        </button>
      </div>

      {/* Input Box */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask AI about tests, prices, or booking..."
          className="flex-1 bg-slate-800 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={() => handleSend()}
          className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md cursor-pointer transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AIChatbotModal;
