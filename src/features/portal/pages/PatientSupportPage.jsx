import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../providers/AuthProvider';
import { PortalDataStore } from '../services/portalData';
import {
  HelpCircle,
  PlusCircle,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  User,
  Shield,
  X,
  Search,
} from 'lucide-react';

export const PatientSupportPage = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Ticket Form State
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Home Collection');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');

  // Ticket Reply Text State
  const [replyText, setReplyText] = useState('');

  const refreshTickets = () => {
    const list = PortalDataStore.getTickets();
    setTickets(list);
    if (selectedTicket) {
      const updatedSel = list.find((t) => t.id === selectedTicket.id);
      if (updatedSel) setSelectedTicket(updatedSel);
    }
  };

  useEffect(() => {
    refreshTickets();
  }, []);

  const handleCreateTicket = (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    PortalDataStore.createTicket({
      subject,
      category,
      priority,
      description,
      patientUser: user,
    });

    setSubject('');
    setDescription('');
    setShowCreateModal(false);
    refreshTickets();
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    PortalDataStore.addTicketReply(selectedTicket.id, replyText, user);
    setReplyText('');
    refreshTickets();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Helpdesk & Support</h1>
          <p className="text-xs text-slate-500 mt-1">
            Have a question about your home collection, test report, or invoice? Raise a support ticket directly with our care desk.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Support Ticket</span>
        </button>
      </div>

      {/* Main Support Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left List of Tickets */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">
            My Support Tickets ({tickets.length})
          </p>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
            {tickets.map((t) => {
              const isSelected = selectedTicket?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold text-slate-500">{t.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      t.status === 'OPEN' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 truncate">{t.subject}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                    <span>{t.category}</span>
                    <span>{new Date(t.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}

            {tickets.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">No support tickets raised yet.</p>
            )}
          </div>
        </div>

        {/* Right Active Ticket Thread View */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between min-h-[500px]">
          {selectedTicket ? (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div>
                {/* Header Info */}
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-600 font-mono">{selectedTicket.id}</span>
                    <span className="text-xs font-bold text-slate-500">Category: {selectedTicket.category}</span>
                  </div>
                  <h2 className="text-base font-extrabold text-slate-900 mt-1">{selectedTicket.subject}</h2>
                </div>

                {/* Messages Feed */}
                <div className="space-y-4 my-6 max-h-[380px] overflow-y-auto custom-scrollbar pr-2">
                  {selectedTicket.messages.map((msg) => {
                    const isPatient = msg.sender === 'PATIENT';
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${isPatient ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isPatient && (
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                            <Shield className="w-4 h-4" />
                          </div>
                        )}
                        <div className={`max-w-md p-3.5 rounded-2xl text-xs space-y-1 ${
                          isPatient
                            ? 'bg-blue-600 text-white rounded-tr-none shadow-sm'
                            : 'bg-slate-100 text-slate-900 border border-slate-200 rounded-tl-none'
                        }`}>
                          <div className={`flex items-center justify-between text-[10px] gap-4 ${
                            isPatient ? 'text-blue-200' : 'text-slate-500'
                          }`}>
                            <span className="font-bold">{msg.sender_name}</span>
                            <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        </div>
                        {isPatient && (
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="pt-4 border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your message to support staff..."
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" /> Send Reply
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center my-auto text-center p-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">Select a support ticket to inspect conversation thread</p>
              <p className="text-xs text-slate-400 max-w-sm">
                Our customer care representatives respond within 30 minutes during laboratory operational hours.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal to Create Ticket */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Raise New Support Ticket</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Ticket Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Home collection timing query"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                  >
                    <option value="Home Collection">Home Collection</option>
                    <option value="Reports & Results">Reports & Results</option>
                    <option value="Invoices & Billing">Invoices & Billing</option>
                    <option value="General Query">General Query</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Description / Message Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows="4"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your request or issue in detail..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit Ticket</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientSupportPage;
