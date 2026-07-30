import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../providers/AuthProvider';
import portalAPI from '../../../services/portalAPI';
import InteractiveSearchBar from '../../../components/common/InteractiveSearchBar';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building2,
  CheckCircle2,
  FileText,
  PlusCircle,
  Stethoscope,
  Filter,
} from 'lucide-react';

const capitalizeName = (str) => {
  if (!str) return 'Patient';
  return str
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

export const PatientDirectoryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegModal, setShowRegModal] = useState(false);
  const [regSuccessMsg, setRegSuccessMsg] = useState('');

  // New Patient Form State
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    gender: 'M',
    age: '30',
    address: '',
    referring_doctor: '',
    entry_mode: 'WALK_IN', // WALK_IN | DOCTOR_REFERRAL
  });

  useEffect(() => {
    const loadPatients = async () => {
      setLoading(true);
      try {
        const list = await portalAPI.getStaffPatients().catch(() => []);
        setPatients(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Error loading patients:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPatients();
  }, []);

  const handleRegisterPatient = (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.phone) return;

    const nextSeq = (patients.length + 1).toString().padStart(6, '0');
    const newPat = {
      patient_id: `PAT-${nextSeq}`,
      full_name: formData.full_name,
      email: formData.email || `${formData.full_name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      phone: formData.phone,
      gender: formData.gender === 'M' ? 'Male' : 'Female',
      age: Number(formData.age) || 30,
      address: formData.address || 'Vijayawada Hub',
      entry_mode: formData.entry_mode,
      referring_doctor: formData.referring_doctor,
      registered_at: 'Just now',
    };

    setPatients([newPat, ...patients]);
    setRegSuccessMsg(`Patient ${newPat.full_name} (${newPat.patient_id}) registered successfully!`);
    setShowRegModal(false);
    setFormData({
      full_name: '',
      phone: '',
      email: '',
      gender: 'M',
      age: '30',
      address: '',
      referring_doctor: '',
      entry_mode: 'WALK_IN',
    });

    setTimeout(() => setRegSuccessMsg(''), 5000);
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.patient_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Reception Desk Module
            </span>
            <span className="text-xs text-slate-500 font-semibold">Life Line Diagnostics — Vijayawada Hub</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Patient Directory & Registration</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Register new walk-in patients, record doctor referrals, and manage verified patient records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-64">
            <InteractiveSearchBar
              placeholder="Search by name, PAT-000001, mobile..."
              value={searchQuery}
              onChange={setSearchQuery}
              resultCount={filteredPatients.length}
            />
          </div>

          <button
            onClick={() => setShowRegModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register New Patient</span>
          </button>
        </div>
      </div>

      {regSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl flex items-center gap-3 text-emerald-800 text-xs font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{regSuccessMsg}</span>
        </div>
      )}

      {/* Patient Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Registered Patients Directory ({filteredPatients.length})</span>
          </h3>
          <span className="text-xs text-slate-400">Standard 6-Digit ID Format (PAT-000001)</span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Patient ID</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Gender / Age</th>
                <th className="py-3 px-4">Registration Mode</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredPatients.map((p) => (
                <tr key={p.patient_id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{p.patient_id}</td>
                  <td className="py-3.5 px-4 font-extrabold text-slate-900">
                    {capitalizeName(p.full_name)}
                    {p.referring_doctor && (
                      <span className="block text-[10px] text-purple-600 font-semibold mt-0.5">
                        Ref: {p.referring_doctor}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                      <Phone className="w-3 h-3 text-slate-400" /> {p.phone}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <Mail className="w-3 h-3 text-slate-400" /> {p.email}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-semibold">
                    {p.gender} / {p.age} Yrs
                  </td>
                  <td className="py-3.5 px-4">
                    {p.entry_mode === 'ONLINE' && (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">
                        🌐 Online Self-Service
                      </span>
                    )}
                    {p.entry_mode === 'DOCTOR_REFERRAL' && (
                      <span className="px-2.5 py-1 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-full border border-purple-200">
                        🩺 Doctor Referral (2.0x)
                      </span>
                    )}
                    {p.entry_mode === 'WALK_IN' && (
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full border border-blue-200">
                        🏢 Direct Walk-In (1.0x)
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => navigate('/operations/visits', { state: { selectedPatient: p } })}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 ml-auto cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Create Lab Visit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Modal */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" /> Register Patient Profile
              </h3>
              <button onClick={() => setShowRegModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterPatient} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Patient Name *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 00000"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="patient@gmail.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Age (Years)</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Entry Mode</label>
                  <select
                    value={formData.entry_mode}
                    onChange={(e) => setFormData({ ...formData, entry_mode: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  >
                    <option value="WALK_IN">Walk-In (1.0x)</option>
                    <option value="DOCTOR_REFERRAL">Doctor Referral (2.0x)</option>
                  </select>
                </div>
              </div>

              {formData.entry_mode === 'DOCTOR_REFERRAL' && (
                <div>
                  <label className="block font-bold text-purple-700 mb-1 flex items-center gap-1">
                    <Stethoscope className="w-3.5 h-3.5" /> Referring Doctor Name *
                  </label>
                  <input
                    type="text"
                    value={formData.referring_doctor}
                    onChange={(e) => setFormData({ ...formData, referring_doctor: e.target.value })}
                    placeholder="Dr. K. Srinivas (MD, Gen Med)"
                    className="w-full p-2.5 bg-purple-50 border border-purple-200 rounded-xl focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Residential Address</label>
                <textarea
                  rows="2"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full street address in Vijayawada..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold shadow-md cursor-pointer"
                >
                  Register Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDirectoryPage;
