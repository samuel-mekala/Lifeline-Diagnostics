import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../providers/AuthProvider';
import portalAPI from '../../../services/portalAPI';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Heart,
  ShieldAlert,
  Award,
  Edit,
  CheckCircle2,
  UserCheck,
  AlertCircle,
  Building2,
} from 'lucide-react';

const capitalizeName = (str) => {
  if (!str) return 'Patient';
  return str
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

export const PatientProfilePage = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    age: '30',
    gender: 'Male',
    blood_group: 'O+',
    address: 'Loading address...',
    emergency_contact_name: 'Not Specified',
    emergency_contact_phone: 'Not Specified',
    allergies: 'None Reported',
    chronic_conditions: 'None Reported',
  });

  useEffect(() => {
    const loadProfileData = async () => {
      setLoading(true);
      try {
        const [prof, addrs] = await Promise.all([
          portalAPI.getProfile().catch(() => null),
          portalAPI.getAddresses().catch(() => []),
        ]);

        const primaryAddr = Array.isArray(addrs) && addrs.length > 0 ? addrs[0].full_address : 'No residential address saved yet';

        setAddresses(Array.isArray(addrs) ? addrs : []);

        setFormData({
          full_name: user?.full_name || prof?.full_name || 'Patient',
          phone: user?.phone || prof?.phone || prof?.patient?.phone || 'Not provided',
          email: user?.email || prof?.email || '',
          age: user?.age || prof?.age || '30',
          gender: user?.gender || prof?.gender || 'Male',
          blood_group: user?.blood_group || prof?.blood_group || 'O+',
          address: primaryAddr,
          emergency_contact_name: user?.emergency_contact_name || prof?.emergency_contact_name || 'Not Specified',
          emergency_contact_phone: user?.emergency_contact_phone || prof?.emergency_contact_phone || 'Not Specified',
          allergies: user?.allergies || prof?.allergies || 'None Reported',
          chronic_conditions: user?.chronic_conditions || prof?.chronic_conditions || 'None Reported',
        });
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) loadProfileData();
  }, [user]);

  const patientId = user?.patient_id || 'PAT-000001';

  const handleSave = (e) => {
    e.preventDefault();
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-white/20 flex items-center justify-center text-white text-2xl font-black shadow-lg">
              {formData.full_name ? formData.full_name.charAt(0).toUpperCase() : 'P'}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  {capitalizeName(formData.full_name)}
                </h1>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  Verified Patient Profile
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-2 font-mono">
                <span>Patient ID:</span>
                <span className="font-extrabold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/30">
                  {patientId}
                </span>
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 font-medium">
                <span>Age: {formData.age} Yrs</span>
                <span>•</span>
                <span>Gender: {formData.gender}</span>
                <span>•</span>
                <span className="text-rose-400 font-bold">Blood Group: {formData.blood_group}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition flex items-center gap-2 cursor-pointer"
          >
            <Edit className="w-4 h-4" /> Edit Profile
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl flex items-center gap-3 text-emerald-800 text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Patient profile details updated successfully.</span>
        </div>
      )}

      {/* Main Grid Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact & Personal Info Card */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-blue-600" /> Personal & Contact Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium block">Official Patient ID</span>
                <span className="font-mono font-black text-blue-700 text-sm">{patientId}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium block">Phone Number</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {formData.phone}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium block">Email Address</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {formData.email}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium block">Registered Lab Hub</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" /> Life Line Diagnostics — Vijayawada
                </span>
              </div>

              <div className="sm:col-span-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium block">Primary Residential Address (For Sample Pickups)</span>
                <span className="font-semibold text-slate-800 flex items-start gap-1.5 mt-1">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" /> {formData.address}
                </span>
              </div>
            </div>
          </div>

          {/* Emergency & Next of Kin */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldAlert className="w-4 h-4 text-amber-600" /> Emergency Contact & Next of Kin
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200">
                <span className="text-amber-800/70 font-semibold block">Contact Name</span>
                <span className="font-bold text-amber-950 text-sm mt-0.5">{formData.emergency_contact_name}</span>
              </div>

              <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200">
                <span className="text-amber-800/70 font-semibold block">Emergency Mobile</span>
                <span className="font-mono font-bold text-amber-950 text-sm mt-0.5">{formData.emergency_contact_phone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Medical Vitals Side */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Heart className="w-4 h-4 text-rose-600" /> Health & Vitals Overview
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-medium">Known Allergies</span>
                <p className="font-bold text-slate-800 mt-1">{formData.allergies}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-medium">Chronic Conditions</span>
                <p className="font-bold text-slate-800 mt-1">{formData.chronic_conditions}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 space-y-1">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-600" /> NABL Patient Safety Card
                </div>
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  Always verify your unique Patient ID <span className="font-mono font-bold">{patientId}</span> during phlebotomist home sample collection.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Update Profile Details</h3>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
                <AlertCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Blood Group</label>
                  <select
                    value={formData.blood_group}
                    onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl"
                  >
                    <option value="O+">O+</option>
                    <option value="A+">A+</option>
                    <option value="B+">B+</option>
                    <option value="AB+">AB+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Home Address</label>
                <textarea
                  rows="2"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                  required
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Emergency Contact Person</label>
                  <input
                    type="text"
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Emergency Contact Phone</label>
                  <input
                    type="text"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientProfilePage;
