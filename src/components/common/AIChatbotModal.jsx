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
  Mail,
  Building2,
  CheckCircle2,
} from 'lucide-react';

const TEST_DATABASE = [
  { keywords: ['cbc', 'blood count', 'hemoglobin'], name: 'Complete Blood Picture (CBC)', price: '₹300 (Walk-In) / ₹450 (Home)' },
  { keywords: ['esr', 'erythrocyte'], name: 'Erythrocyte Sedimentation Rate (ESR)', price: '₹100 (Walk-In) / ₹150 (Home)' },
  { keywords: ['hba1c', 'glycated', 'sugar average', 'diabetes'], name: 'Glycated Hemoglobin (HbA1c)', price: '₹500 (Walk-In) / ₹750 (Home)' },
  { keywords: ['calcium', 'serum calcium'], name: 'Serum Calcium Test', price: '₹500 (Walk-In) / ₹750 (Home)' },
  { keywords: ['testosterone', 'hormone'], name: 'Total Testosterone Test', price: '₹1500 (Walk-In) / ₹2250 (Home)' },
  { keywords: ['b12', 'vitamin b12', 'cobalamin'], name: 'Vitamin B12 Assay', price: '₹900 (Walk-In) / ₹1350 (Home)' },
  { keywords: ['vitamin d', 'd3', 'vitamin d3'], name: 'Vitamin D3 Total (25-OH)', price: '₹1000 (Walk-In) / ₹1500 (Home)' },
  { keywords: ['iron', 'iron profile', 'ferritin'], name: 'Iron Profile (Fe, TIBC, % Sat)', price: '₹800 (Walk-In) / ₹1200 (Home)' },
  { keywords: ['kidney', 'kft', 'creatinine', 'urea'], name: 'Kidney Function Mini Profile (KFT)', price: '₹800 (Walk-In) / ₹1200 (Home)' },
  { keywords: ['lipid', 'cholesterol', 'triglycerides'], name: 'Lipid Profile Complete', price: '₹500 (Walk-In) / ₹750 (Home)' },
  { keywords: ['liver', 'lft', 'sgot', 'sgpt', 'bilirubin'], name: 'Liver Function Test (LFT)', price: '₹500 (Walk-In) / ₹750 (Home)' },
  { keywords: ['cue', 'urine', 'urine exam'], name: 'Complete Urine Examination (CUE)', price: '₹200 (Walk-In) / ₹300 (Home)' },
  { keywords: ['thyroid', 'tsh', 't3', 't4'], name: 'Thyroid Profile I (T3, T4, TSH)', price: '₹500 (Walk-In) / ₹750 (Home)' },
  { keywords: ['fbs', 'fasting sugar', 'fasting blood sugar'], name: 'Fasting Blood Sugar (FBS)', price: '₹50 (Walk-In) / ₹75 (Home)' },
  { keywords: ['ppbs', 'post prandial', 'post prandial blood sugar'], name: 'Post Prandial Blood Sugar (PPBS)', price: '₹50 (Walk-In) / ₹75 (Home)' },
];

const PACKAGE_DATABASE = [
  { keywords: ['ayush 2', 'ayush-2', 'full body', 'ayush 2 full body'], name: 'Ayush-2 Full Body Checkup (10 Tests)', price: '₹750 (Walk-In) / ₹1125 (Home)' },
  { keywords: ['ayush 3', 'ayush-3', 'master health', 'ayush 3 master'], name: 'Ayush-3 Comprehensive Master Health (13 Tests)', price: '₹1500 (Walk-In) / ₹2250 (Home)' },
  { keywords: ['cardiac', 'cardiac package', 'metabolic'], name: 'Cardiac & Metabolic Care Package (6 Tests)', price: '₹999 (Walk-In) / ₹1499 (Home)' },
];

const BOOKING_KEYWORDS = [
  'book', 'appointment', 'schedule', 'home', 'visit', 'pickup', 'test', 'package', 'price',
  'cost', 'cbc', 'hba1c', 'thyroid', 'lipid', 'lft', 'kft', 'urine', 'blood', 'ayush',
  'checkup', 'fbs', 'ppbs', 'esr', 'vitamin', 'calcium', 'iron', 'testosterone', 'slot', 'date'
];

const TICKET_YES_KEYWORDS = [
  'yes', 'yeah', 'yep', 'ticket', 'support', 'raise', 'help', 'contact', 'sure', 'ok', 'okay'
];

export const AIChatbotModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      type: 'greeting',
      text: '👋 Hello! Welcome to LifeLong Diagnostics. I am your AI Booking Assistant.\n\nI can help you search lab tests, explore health packages, and book appointments for Home Collection or Lab Visits.',
    },
  ]);
  const [input, setInput] = useState('');
  const [waitingForTicketConfirmation, setWaitingForTicketConfirmation] = useState(false);

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

    setTimeout(() => {
      // 1. If previously asked about raising a support ticket and user says YES/TICKET
      if (waitingForTicketConfirmation && TICKET_YES_KEYWORDS.some((kw) => lower.includes(kw))) {
        setWaitingForTicketConfirmation(false);
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            type: 'raise_ticket_help',
            text: '🎫 **Support Ticket & Contact Assistance**\n\nYou can raise a support ticket directly on our Support Page, or contact our organization desk:\n\n📞 **Phone**: +91 98490 12345 / 1800-123-4567\n✉️ **Email**: support@lifelinediagnostics.com\n🏢 **Main Hub**: MG Road, Vijayawada, AP',
            showSupportTicketButton: true,
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
            text: `📦 **${matchedPkg.name}**\n\n**Price:** ${matchedPkg.price}\n\nI can help you book an appointment for this package right now!`,
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
            text: `🧪 **${matchedTest.name}**\n\n**Price:** ${matchedTest.price}\n\nI can assist you in booking an appointment for this test immediately!`,
            showBookButton: true,
          },
        ]);
        return;
      }

      // 4. Check appointment booking keywords
      const isBooking = BOOKING_KEYWORDS.some((kw) => lower.includes(kw));

      if (isBooking) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            type: 'booking_guidance',
            text: '📅 **Appointment Booking Assistance**\n\nI can help you book your diagnostic appointment in 3 easy steps:\n1. Choose your test or package.\n2. Select Home Collection or Lab Visit.\n3. Pick your preferred date & time slot.\n\nClick below to open the booking page!',
            showBookButton: true,
          },
        ]);
        return;
      }

      // 5. Strict Guardrail for Non-Booking Queries (e.g. "what is this", "who created you", general questions)
      setWaitingForTicketConfirmation(true);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          type: 'out_of_scope_guardrail',
          text: 'I am strictly specialized in helping you search tests and book diagnostic appointments. I am unable to assist with general questions outside appointment booking.\n\nWould you like me to help you raise a support ticket on our Support page, or contact our organization?',
          showSupportOptions: true,
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
              <span>LifeLong Booking AI</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h3>
            <p className="text-[10px] text-blue-300 font-semibold">Appointment & Test Booking Assistant</p>
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
                  className="w-full py-2.5 px-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span>📅 Book Appointment Now</span>
                </button>
              )}

              {/* Guardrail Support Options */}
              {m.showSupportOptions && (
                <div className="pt-2 border-t border-slate-700/60 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        onClose();
                        navigate('/portal/support');
                      }}
                      className="py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LifeBuoy className="w-3.5 h-3.5" />
                      <span>Yes, Raise Ticket</span>
                    </button>

                    <button
                      onClick={() => handleSend('Tell me organization contact details')}
                      className="py-2 px-3 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Contact Org</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Support Ticket Page Direct Button */}
              {m.showSupportTicketButton && (
                <div className="pt-2 border-t border-slate-700/60 space-y-2">
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/portal/support');
                    }}
                    className="w-full py-2.5 px-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <LifeBuoy className="w-4 h-4" />
                    <span>🎫 Go to Support Page to Raise Ticket</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Chips */}
      <div className="p-2.5 bg-slate-900 border-t border-slate-800 flex gap-1.5 overflow-x-auto text-[10px] custom-scrollbar">
        <button
          onClick={() => handleSend('I want to book an appointment')}
          className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-3 py-1.5 rounded-full whitespace-nowrap cursor-pointer shadow-sm"
        >
          📅 Book Appointment
        </button>
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
          onClick={() => handleSend('Home Sample Collection')}
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
          placeholder="Ask AI to help book lab tests & appointments..."
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
