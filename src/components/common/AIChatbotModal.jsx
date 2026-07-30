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
  { keywords: ['cbc', 'blood count', 'hemoglobin'], name: 'Complete Blood Picture (CBC)', price: '₹300 (Walk-In) / ₹450 (Home) / ₹600 (Doc Ref)', prep: 'No fasting required. Specimen: EDTA Blood.' },
  { keywords: ['esr', 'erythrocyte'], name: 'Erythrocyte Sedimentation Rate (ESR)', price: '₹100 (Walk-In) / ₹150 (Home) / ₹200 (Doc Ref)', prep: 'No special preparation needed. Specimen: Blood.' },
  { keywords: ['hba1c', 'glycated', 'sugar average'], name: 'Glycated Hemoglobin (HbA1c)', price: '₹500 (Walk-In) / ₹750 (Home) / ₹1000 (Doc Ref)', prep: 'Random or fasting sample accepted. Specimen: Blood.' },
  { keywords: ['calcium', 'serum calcium'], name: 'Serum Calcium Test', price: '₹500 (Walk-In) / ₹750 (Home) / ₹1000 (Doc Ref)', prep: 'Overnight fasting recommended. Specimen: Serum.' },
  { keywords: ['testosterone', 'hormone'], name: 'Total Testosterone Test', price: '₹1500 (Walk-In) / ₹2250 (Home) / ₹3000 (Doc Ref)', prep: 'Morning sample preferred (07:00 AM – 10:00 AM). Specimen: Serum.' },
  { keywords: ['b12', 'vitamin b12', 'cobalamin'], name: 'Vitamin B12 Assay', price: '₹900 (Walk-In) / ₹1350 (Home) / ₹1800 (Doc Ref)', prep: '10-12 hours overnight fasting required. Specimen: Serum.' },
  { keywords: ['vitamin d', 'd3', 'vitamin d3'], name: 'Vitamin D3 Total (25-OH)', price: '₹1000 (Walk-In) / ₹1500 (Home) / ₹2000 (Doc Ref)', prep: 'No special fasting required. Specimen: Serum.' },
  { keywords: ['iron', 'iron profile', 'ferritin'], name: 'Iron Profile (Fe, TIBC, % Sat)', price: '₹800 (Walk-In) / ₹1200 (Home) / ₹1600 (Doc Ref)', prep: '12 hours fasting required. Specimen: Serum.' },
  { keywords: ['kidney', 'kft', 'creatinine', 'urea'], name: 'Kidney Function Mini Profile (KFT)', price: '₹800 (Walk-In) / ₹1200 (Home) / ₹1600 (Doc Ref)', prep: '8-10 hours fasting recommended. Specimen: Serum.' },
  { keywords: ['lipid', 'cholesterol', 'triglycerides'], name: 'Lipid Profile Complete', price: '₹500 (Walk-In) / ₹750 (Home) / ₹1000 (Doc Ref)', prep: '10-12 hours strict overnight fasting. Specimen: Serum.' },
  { keywords: ['liver', 'lft', 'sgot', 'sgpt', 'bilirubin'], name: 'Liver Function Test (LFT)', price: '₹500 (Walk-In) / ₹750 (Home) / ₹1000 (Doc Ref)', prep: 'Overnight 10-12 hours fasting required. Specimen: Serum.' },
  { keywords: ['cue', 'urine', 'urine exam'], name: 'Complete Urine Examination (CUE)', price: '₹200 (Walk-In) / ₹300 (Home) / ₹400 (Doc Ref)', prep: 'First morning mid-stream urine sample. Specimen: Urine.' },
  { keywords: ['thyroid', 'tsh', 't3', 't4'], name: 'Thyroid Profile I (T3, T4, TSH)', price: '₹500 (Walk-In) / ₹750 (Home) / ₹1000 (Doc Ref)', prep: '8-10 hours fasting recommended. Specimen: Serum.' },
  { keywords: ['fbs', 'fasting sugar', 'fasting blood sugar'], name: 'Fasting Blood Sugar (FBS)', price: '₹50 (Walk-In) / ₹75 (Home) / ₹100 (Doc Ref)', prep: 'Strict 8-10 hours overnight fasting. Specimen: Blood.' },
  { keywords: ['ppbs', 'post prandial', 'post prandial blood sugar'], name: 'Post Prandial Blood Sugar (PPBS)', price: '₹50 (Walk-In) / ₹75 (Home) / ₹100 (Doc Ref)', prep: 'Sample drawn exactly 2 hours after breakfast. Specimen: Blood.' },
];

const PACKAGE_DATABASE = [
  { keywords: ['ayush 2', 'ayush-2', 'full body', 'ayush 2 full body'], name: 'Ayush-2 Full Body Checkup (10 Tests)', price: '₹750 (Walk-In) / ₹1125 (Home)', tests: ['CBC', 'FBS', 'Lipid Profile', 'KFT Mini', 'LFT', 'Serum Calcium', 'CUE', 'ESR'] },
  { keywords: ['ayush 3', 'ayush-3', 'master health', 'ayush 3 master'], name: 'Ayush-3 Comprehensive Master Health (13 Tests)', price: '₹1500 (Walk-In) / ₹2250 (Home)', tests: ['CBC', 'HbA1c', 'Thyroid Profile I', 'Vitamin D3', 'Vitamin B12', 'Lipid Complete', 'KFT', 'LFT', 'Iron Profile'] },
  { keywords: ['cardiac', 'cardiac package', 'metabolic'], name: 'Cardiac & Metabolic Care Package (6 Tests)', price: '₹999 (Walk-In) / ₹1499 (Home)', tests: ['Lipid Profile Complete', 'HbA1c', 'FBS', 'PPBS', 'Serum Calcium', 'KFT'] },
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
      text: '👋 Hello! Welcome to LifeLong Diagnostics. I am your AI Booking Assistant. I can help you search all 15 lab tests, explore 3 preventive health packages, and schedule Home Collection or Lab Visits.',
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

    // 1. Check for non-booking query (medical advice, diagnosis, treatment)
    const isMedicalQuery = NON_BOOKING_KEYWORDS.some((kw) => lower.includes(kw));

    setTimeout(() => {
      if (isMedicalQuery) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            type: 'out_of_scope',
            text: 'I am your Test Booking Assistant and specialize in helping you find and schedule diagnostic lab tests and health checkup packages. For medical diagnosis or clinical treatment, please consult a registered medical practitioner.',
            showActionButtons: true,
          },
        ]);
        return;
      }

      // 2. Check matching package in database
      const matchedPkg = PACKAGE_DATABASE.find((p) =>
        p.keywords.some((kw) => lower.includes(kw))
      );

      if (matchedPkg) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            type: 'pkg_info',
            text: `📦 **${matchedPkg.name}**\n\n**Price:** ${matchedPkg.price}\n\n**Includes:** ${matchedPkg.tests.join(', ')}`,
            showBookButton: true,
          },
        ]);
        return;
      }

      // 3. Check matching test in database
      const matchedTest = TEST_DATABASE.find((t) =>
        t.keywords.some((kw) => lower.includes(kw))
      );

      if (matchedTest) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            type: 'test_info',
            text: `🧪 **${matchedTest.name}**\n\n**Price Catalogs:** ${matchedTest.price}\n\n**Preparation:** ${matchedTest.prep}`,
            test: matchedTest,
            showBookButton: true,
          },
        ]);
        return;
      }

      // 4. Check home collection inquiry
      if (lower.includes('home') || lower.includes('visit') || lower.includes('pickup') || lower.includes('how to book')) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            type: 'home_info',
            text: '🏠 **Home Sample Collection Process:**\n\n1. Select your test or package.\n2. Choose **Home Collection** at step 2.\n3. Select your saved address or add a new address.\n4. Pick your date & time slot.\n\nOur phlebotomist arrives with sterile vacutainer kits.',
            showBookButton: true,
          },
        ]);
        return;
      }

      // 5. Check general health packages request
      if (lower.includes('package') || lower.includes('full body') || lower.includes('checkup') || lower.includes('health package')) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            type: 'all_packages',
            text: '📦 **All 3 Preventive Health Checkup Packages:**\n\n1. **Ayush-2 Full Body Checkup (10 Tests)** — ₹750\n2. **Ayush-3 Master Health Checkup (13 Tests)** — ₹1,500\n3. **Cardiac & Metabolic Care Package (6 Tests)** — ₹999',
            showBookButton: true,
          },
        ]);
        return;
      }

      // Default response
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          type: 'general_help',
          text: 'I can assist you with searching for diagnostic tests (CBC, HbA1c, Thyroid, Vit D3/B12, KFT, LFT, Lipid, Testosterone), health packages (Ayush-2, Ayush-3, Cardiac), or scheduling Home Collection.',
          showActionButtons: true,
        },
      ]);
    }, 300);
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
              <span>LifeLong Test & Package AI</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h3>
            <p className="text-[10px] text-blue-300 font-semibold">15 Tests • 3 Health Packages • Instant Booking</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
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
                  <span>Book Test / Package Now</span>
                </button>
              )}

              {/* Non-Booking / Out of Scope Action Buttons */}
              {m.showActionButtons && (
                <div className="pt-2 border-t border-slate-700/60 space-y-2">
                  <p className="text-[10px] text-slate-400 font-semibold">How would you like to connect with our care desk?</p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        onClose();
                        navigate('/portal/support');
                      }}
                      className="py-1.5 px-2.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LifeBuoy className="w-3.5 h-3.5" />
                      <span>Raise Ticket</span>
                    </button>

                    <a
                      href="tel:+919876543210"
                      className="py-1.5 px-2.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors text-center text-decoration-none"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call Lab</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Clean Quick Action Chips */}
      <div className="p-2.5 bg-slate-900 border-t border-slate-800 flex gap-1.5 overflow-x-auto text-[10px] custom-scrollbar">
        <button
          onClick={() => handleSend('Ayush-2 Full Body Checkup Package')}
          className="bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold px-3 py-1.5 rounded-full whitespace-nowrap border border-slate-700 cursor-pointer"
        >
          Ayush-2 Package
        </button>
        <button
          onClick={() => handleSend('CBC Test Price')}
          className="bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold px-3 py-1.5 rounded-full whitespace-nowrap border border-slate-700 cursor-pointer"
        >
          CBC Test
        </button>
        <button
          onClick={() => handleSend('HbA1c Diabetes Test')}
          className="bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold px-3 py-1.5 rounded-full whitespace-nowrap border border-slate-700 cursor-pointer"
        >
          HbA1c Test
        </button>
        <button
          onClick={() => handleSend('Vitamin D3 and B12 Tests')}
          className="bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold px-3 py-1.5 rounded-full whitespace-nowrap border border-slate-700 cursor-pointer"
        >
          Vit D3 & B12
        </button>
        <button
          onClick={() => handleSend('How do I book Home Collection?')}
          className="bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold px-3 py-1.5 rounded-full whitespace-nowrap border border-slate-700 cursor-pointer"
        >
          Home Pickup
        </button>
      </div>

      {/* Input Box */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask AI about 15 tests, 3 packages, or booking..."
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
