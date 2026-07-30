import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../providers/AuthProvider';
import AdminDataStore from '../services/adminData';
import InteractiveSearchBar from '../../../components/common/InteractiveSearchBar';
import {
  Building2,
  Plus,
  MapPin,
  Phone,
  Clock,
  Users,
  ShieldCheck,
  Edit2,
  CheckCircle2,
  X,
  Search,
  Activity,
  UserCheck,
  Building,
  Award,
  Trash2,
  UserPlus,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export default function BranchManagementPage() {
  const { user } = useAuth();
  const isAdminOrOwner = user?.role === 'ADMIN' || user?.role === 'OWNER';

  const [branches, setBranches] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showEditBranchModal, setShowEditBranchModal] = useState(null);
  const [showStaffMatrixModal, setShowStaffMatrixModal] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [deleteEmployeeConfirm, setDeleteEmployeeConfirm] = useState(null);

  // New Employee Form
  const [employeeForm, setEmployeeForm] = useState({
    full_name: '',
    email: '',
    role: 'RECEPTIONIST',
    designation: '',
    qualification: '',
    mobile: '',
    assigned_branches: ['VJW-MAIN'],
  });

  // Form State for Branch Edit/Create
  const [branchForm, setBranchForm] = useState({
    id: '',
    code: '',
    name: '',
    address: '',
    phone: '',
    email: '',
    operating_hours: '06:00 AM - 10:00 PM (Mon-Sun)',
    daily_sample_capacity: 300,
    accreditation: 'NABL Accredited',
    status: 'ACTIVE',
  });

  const refreshData = () => {
    setBranches(AdminDataStore.getBranches());
    setStaffList(AdminDataStore.getStaff());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const filteredBranches = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenCreateBranchModal = () => {
    setBranchForm({
      id: '',
      code: '',
      name: '',
      address: '',
      phone: '',
      email: '',
      operating_hours: '06:00 AM - 10:00 PM (Mon-Sun)',
      daily_sample_capacity: 300,
      accreditation: 'NABL Accredited',
      status: 'ACTIVE',
    });
    setShowEditBranchModal({});
  };

  const handleOpenEditBranchModal = (branch) => {
    setBranchForm({ ...branch });
    setShowEditBranchModal(branch);
  };

  const handleSaveBranch = (e) => {
    e.preventDefault();
    if (!branchForm.name || !branchForm.address || !branchForm.phone) {
      alert('Please fill in required fields (Name, Address, Phone).');
      return;
    }

    AdminDataStore.createOrUpdateBranch(branchForm, 'Chief Administrator');
    refreshData();
    setShowEditBranchModal(null);
  };

  // Toggle staff branch mapping in Matrix
  const handleToggleStaffBranch = (staffId, branchCode) => {
    const member = staffList.find((s) => s.id === staffId);
    if (!member) return;

    let updatedBranches = [...(member.assigned_branches || [])];
    if (updatedBranches.includes(branchCode)) {
      updatedBranches = updatedBranches.filter((c) => c !== branchCode);
    } else {
      updatedBranches.push(branchCode);
    }

    AdminDataStore.updateStaffAssignments(staffId, updatedBranches, 'Chief Administrator');
    refreshData();
  };

  // Create Employee handler (Admin / Owner Only)
  const handleCreateEmployee = (e) => {
    e.preventDefault();
    if (!isAdminOrOwner) {
      alert('Access Denied: Only Owner or Admin can create employees.');
      return;
    }
    if (!employeeForm.full_name || !employeeForm.email) {
      alert('Employee Name and Email are required!');
      return;
    }

    AdminDataStore.createEmployee(employeeForm, user?.full_name || 'Admin');
    refreshData();
    setShowAddEmployeeModal(false);
    setEmployeeForm({
      full_name: '',
      email: '',
      role: 'RECEPTIONIST',
      designation: '',
      qualification: '',
      mobile: '',
      assigned_branches: ['HYD-MAIN'],
    });
  };

  // Delete Employee handler (Admin / Owner Only)
  const handleDeleteEmployee = (staffId) => {
    if (!isAdminOrOwner) {
      alert('Access Denied: Only Owner or Admin can delete employees.');
      return;
    }

    AdminDataStore.deleteEmployee(staffId, user?.full_name || 'Admin');
    refreshData();
    setDeleteEmployeeConfirm(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> BRANCH OPERATIONS & NETWORK
            </span>
            <span className="text-xs text-slate-400">Total Network Hubs: {branches.length}</span>
            {isAdminOrOwner ? (
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded">
                ADMIN ACCESS
              </span>
            ) : (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <Lock className="w-3 h-3" /> READ ONLY STAFF MGMT
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold mt-2">Laboratory Branch Management & Staff Matrix</h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure diagnostic collection hubs, set daily capacity thresholds, assign medical staff, and manage employee accounts.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {isAdminOrOwner && (
            <button
              onClick={() => setShowAddEmployeeModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Create Employee
            </button>
          )}

          <button
            onClick={() => setShowStaffMatrixModal(true)}
            className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition flex items-center gap-2"
          >
            <Users className="w-4 h-4 text-emerald-400" /> Staff Roster ({staffList.length})
          </button>

          <button
            onClick={handleOpenCreateBranchModal}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add New Branch
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <InteractiveSearchBar
            placeholder="Search branch name, code, or address..."
            value={searchQuery}
            onChange={setSearchQuery}
            suggestions={[
              'Vijayawada Main Hub',
              'VJW-MAIN',
              'Hyderabad Central',
              'Kasturibaipet',
            ]}
            resultCount={filteredBranches.length}
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 shrink-0">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>{branches.filter((b) => b.status === 'ACTIVE').length} Active Hubs</span>
        </div>
      </div>

      {/* Branch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredBranches.map((branch) => {
          // Find staff assigned to this branch
          const assignedStaff = staffList.filter((s) => s.assigned_branches?.includes(branch.code));

          return (
            <div
              key={branch.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded border border-blue-200">
                        {branch.code}
                      </span>
                      <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded uppercase">
                        {branch.status}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mt-2">{branch.name}</h2>
                  </div>

                  <button
                    onClick={() => handleOpenEditBranchModal(branch)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                    title="Edit Branch Profile"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{branch.address}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{branch.phone}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{branch.operating_hours}</span>
                    </div>
                  </div>
                </div>

                {/* Capacity & Accreditation Badge */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Daily Sample Capacity</div>
                    <div className="font-extrabold text-slate-900 flex items-center gap-1 mt-0.5">
                      <Activity className="w-3.5 h-3.5 text-blue-600" />
                      {branch.daily_sample_capacity} samples/day
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Accreditation</div>
                    <div className="font-bold text-slate-800 flex items-center gap-1 mt-0.5 truncate">
                      <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">{branch.accreditation}</span>
                    </div>
                  </div>
                </div>

                {/* Staff Allocation Avatars */}
                <div className="pt-2">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Assigned Medical Team ({assignedStaff.length})</span>
                    <button
                      onClick={() => setShowStaffMatrixModal(true)}
                      className="text-blue-600 hover:underline font-bold"
                    >
                      Manage Matrix
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {assignedStaff.map((s) => (
                      <span
                        key={s.id}
                        className="bg-slate-100 text-slate-800 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3 h-3 text-emerald-600" />
                        <span>{s.full_name}</span>
                        <span className="text-[9px] text-slate-400">({s.role.slice(0, 4)})</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: CREATE / EDIT BRANCH PROFILE */}
      {showEditBranchModal !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                {branchForm.id ? 'Edit Branch Profile' : 'Register New Diagnostic Hub'}
              </h3>
              <button onClick={() => setShowEditBranchModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBranch} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Branch Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gachibowli Collection Hub"
                    value={branchForm.name}
                    onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 mt-1"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Branch Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HYD-GCHB"
                    value={branchForm.code}
                    onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 mt-1 font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Full Address *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Street address, landmark, city, pin code..."
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 mt-1"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Phone Contact *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 40 6789 XXXX"
                    value={branchForm.phone}
                    onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 mt-1"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Official Email</label>
                  <input
                    type="email"
                    placeholder="hub@lifelinediagnostics.com"
                    value={branchForm.email}
                    onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Operating Hours</label>
                  <input
                    type="text"
                    placeholder="06:00 AM - 10:00 PM"
                    value={branchForm.operating_hours}
                    onChange={(e) => setBranchForm({ ...branchForm, operating_hours: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 mt-1"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Daily Sample Capacity</label>
                  <input
                    type="number"
                    value={branchForm.daily_sample_capacity}
                    onChange={(e) => setBranchForm({ ...branchForm, daily_sample_capacity: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Accreditation Tag</label>
                  <input
                    type="text"
                    value={branchForm.accreditation}
                    onChange={(e) => setBranchForm({ ...branchForm, accreditation: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 mt-1"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Branch Status</label>
                  <select
                    value={branchForm.status}
                    onChange={(e) => setBranchForm({ ...branchForm, status: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 mt-1 font-bold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditBranchModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md"
                >
                  Save Branch Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: STAFF ASSIGNMENT MATRIX MODAL */}
      {showStaffMatrixModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  Staff Assignment Matrix Across Branches
                </h3>
                <p className="text-xs text-slate-500">
                  Toggle checkboxes to map doctors, lab technicians, and reception staff to branch hubs.
                </p>
              </div>

              <button onClick={() => setShowStaffMatrixModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white font-bold uppercase">
                  <tr>
                    <th className="p-3">Staff Name & Designation</th>
                    <th className="p-3">Role & Email</th>
                    {branches.map((b) => (
                      <th key={b.code} className="p-3 text-center">
                        <div className="font-bold">{b.code}</div>
                        <div className="text-[9px] text-slate-400 font-normal truncate max-w-[100px]">{b.name}</div>
                      </th>
                    ))}
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {staffList.map((staff) => (
                    <tr key={staff.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{staff.full_name}</div>
                        <div className="text-[10px] text-slate-500">{staff.designation}</div>
                      </td>
                      <td className="p-3">
                        <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2 py-0.5 rounded border border-blue-200 block w-fit mb-0.5">
                          {staff.role}
                        </span>
                        <div className="text-[10px] text-slate-400">{staff.email}</div>
                      </td>
                      {branches.map((b) => {
                        const isAssigned = staff.assigned_branches?.includes(b.code);

                        return (
                          <td key={b.code} className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isAssigned}
                              onChange={() => handleToggleStaffBranch(staff.id, b.code)}
                              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                        );
                      })}
                      <td className="p-3 text-right">
                        {isAdminOrOwner ? (
                          <button
                            onClick={() => setDeleteEmployeeConfirm(staff)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                            title="Delete Employee Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Admin Only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2">
              {isAdminOrOwner ? (
                <button
                  onClick={() => setShowAddEmployeeModal(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Add New Employee
                </button>
              ) : (
                <div className="text-xs text-slate-500 italic">Only Admin/Owner can create or delete employees.</div>
              )}

              <button
                onClick={() => setShowStaffMatrixModal(false)}
                className="px-5 py-2.5 bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-md"
              >
                Close Matrix
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE NEW EMPLOYEE (ADMIN / OWNER EXCLUSIVE) */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                Create New LIMS Employee Account
              </h3>
              <button onClick={() => setShowAddEmployeeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Khanna"
                  value={employeeForm.full_name}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, full_name: e.target.value })}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Email Address (Login ID) *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rajesh@lifeline.com"
                    value={employeeForm.email}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Role / Position *</label>
                  <select
                    value={employeeForm.role}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none font-bold"
                  >
                    <option value="RECEPTIONIST">RECEPTIONIST</option>
                    <option value="LAB_TECHNICIAN">LAB TECHNICIAN</option>
                    <option value="PATHOLOGIST">PATHOLOGIST</option>
                    <option value="BRANCH_MANAGER">BRANCH MANAGER</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Hematologist"
                    value={employeeForm.designation}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, designation: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={employeeForm.mobile}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, mobile: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddEmployeeModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: DELETE EMPLOYEE CONFIRMATION */}
      {deleteEmployeeConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-base">Delete Employee Account?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete <strong>{deleteEmployeeConfirm.full_name}</strong> ({deleteEmployeeConfirm.role})? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteEmployeeConfirm(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteEmployee(deleteEmployeeConfirm.id)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md"
              >
                Delete Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
