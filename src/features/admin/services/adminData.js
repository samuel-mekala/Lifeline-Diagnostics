// Central Administrative Data & Services Store for LIMS
// Manages Branch Operations, Staff Matrix, Inventory & Reagent Tracking, Financial Metrics, and System Security Audit Logs.

const ADMIN_KEYS = {
  BRANCHES: 'lifeline_admin_branches',
  STAFF: 'lifeline_admin_staff',
  INVENTORY: 'lifeline_admin_inventory',
  STOCK_LOGS: 'lifeline_admin_stock_logs',
  AUDIT_LOGS: 'lifeline_admin_audit_logs',
};

const DEFAULT_BRANCHES = [
  {
    id: 'BR-001',
    code: 'VJW-MAIN',
    name: 'Life Line Diagnostics - Vijayawada Main Branch',
    address: 'Puspha Hotel Rd, opp. to Assure hospital, New Giri Puram, Kasturibaipet, Vijayawada, Andhra Pradesh 520002.',
    phone: '+91 866 247 8900',
    email: 'vijayawada@lifelinediagnostics.com',
    operating_hours: '06:00 AM - 09:30 PM (Mon-Sun)',
    status: 'ACTIVE',
    daily_sample_capacity: 500,
    accreditation: 'NABL & ISO 9001:2015',
    assigned_staff_ids: ['STF-001', 'STF-002', 'STF-003', 'STF-004'],
    created_at: '2025-01-10T00:00:00Z',
  },
];

const DEFAULT_STAFF = [
  {
    id: 'STF-001',
    full_name: 'Dr. Sunita Rao',
    role: 'PATHOLOGIST',
    designation: 'Chief Pathologist & Lab Director',
    qualification: 'MD (Pathology), DNB',
    mobile: '+91 98490 11223',
    email: 'dr.sunita@lifelinediagnostics.com',
    assigned_branches: ['HYD-MAIN', 'HYD-BJRH'],
    status: 'ACTIVE',
  },
  {
    id: 'STF-002',
    full_name: 'Anil Kumar',
    role: 'LAB_TECHNICIAN',
    designation: 'Senior Biochemistry Technician',
    qualification: 'B.Sc MLT',
    mobile: '+91 98490 22334',
    email: 'anil.tech@lifelinediagnostics.com',
    assigned_branches: ['HYD-MAIN'],
    status: 'ACTIVE',
  },
  {
    id: 'STF-003',
    full_name: 'Priya Sharma',
    role: 'RECEPTIONIST',
    designation: 'Front Desk & Billing Executive',
    qualification: 'B.Com, Healthcare Admin',
    mobile: '+91 98490 33445',
    email: 'priya.desk@lifelinediagnostics.com',
    assigned_branches: ['HYD-MAIN', 'SEC-MAIN'],
    status: 'ACTIVE',
  },
  {
    id: 'STF-004',
    full_name: 'Suresh V.',
    role: 'PHLEBOTOMIST',
    designation: 'Lead Sample Collection Specialist',
    qualification: 'DMLT',
    mobile: '+91 98490 44556',
    email: 'suresh.phleb@lifelinediagnostics.com',
    assigned_branches: ['HYD-MAIN', 'HYD-GCHB'],
    status: 'ACTIVE',
  },
  {
    id: 'STF-005',
    full_name: 'K. Srinivas',
    role: 'RECEPTIONIST',
    designation: 'Billing & Patient Care Associate',
    qualification: 'B.A.',
    mobile: '+91 98490 55667',
    email: 'srinivas.k@lifelinediagnostics.com',
    assigned_branches: ['HYD-BJRH'],
    status: 'ACTIVE',
  },
  {
    id: 'STF-006',
    full_name: 'Mahesh Reddy',
    role: 'LAB_TECHNICIAN',
    designation: 'Haematology Lab Specialist',
    qualification: 'M.Sc MLT',
    mobile: '+91 98490 66778',
    email: 'mahesh.tech@lifelinediagnostics.com',
    assigned_branches: ['SEC-MAIN'],
    status: 'ACTIVE',
  },
];

const DEFAULT_INVENTORY = [
  {
    id: 'INV-1001',
    item_code: 'RGT-THY-01',
    name: 'Thyroid Chemiluminescence Reagent Kit (T3/T4/TSH)',
    category: 'REAGENT_KIT',
    branch_code: 'HYD-MAIN',
    branch_name: 'Main Branch - Hyderabad',
    current_quantity: 42,
    min_threshold: 50, // LOW STOCK TRIGGER!
    unit: 'Kits (100 tests/kit)',
    unit_price: 3200,
    supplier: 'Roche Diagnostics India',
    batch_number: 'RCH-2026-904',
    expiry_date: '2026-11-30',
    location_slot: 'Cold Storage Unit #2 (2-8°C)',
    status: 'LOW_STOCK',
  },
  {
    id: 'INV-1002',
    item_code: 'TUB-SST-02',
    name: 'SST Gold Top Gel Vacuum Blood Tubes (5ml)',
    category: 'COLLECTION_TUBES',
    branch_code: 'HYD-MAIN',
    branch_name: 'Main Branch - Hyderabad',
    current_quantity: 1250,
    min_threshold: 300,
    unit: 'Tubes',
    unit_price: 12,
    supplier: 'BD Vacutainer India',
    batch_number: 'BD-8849-22',
    expiry_date: '2027-05-15',
    location_slot: 'Main Phlebotomy Cabinet A3',
    status: 'OK',
  },
  {
    id: 'INV-1003',
    item_code: 'TUB-EDTA-03',
    name: 'EDTA Lavender Top Blood Tubes (3ml)',
    category: 'COLLECTION_TUBES',
    branch_code: 'HYD-MAIN',
    branch_name: 'Main Branch - Hyderabad',
    current_quantity: 85,
    min_threshold: 250, // LOW STOCK TRIGGER!
    unit: 'Tubes',
    unit_price: 10,
    supplier: 'BD Vacutainer India',
    batch_number: 'BD-7731-09',
    expiry_date: '2027-03-10',
    location_slot: 'Main Phlebotomy Cabinet A2',
    status: 'LOW_STOCK',
  },
  {
    id: 'INV-1004',
    item_code: 'RGT-HBA1C-04',
    name: 'HPLC Glycated Hemoglobin (HbA1c) Column Pack',
    category: 'REAGENT_KIT',
    branch_code: 'HYD-BJRH',
    branch_name: 'Banjara Hills Specialty Centre',
    current_quantity: 18,
    min_threshold: 20, // LOW STOCK TRIGGER!
    unit: 'Packs (50 tests/pack)',
    unit_price: 4500,
    supplier: 'Bio-Rad Laboratories',
    batch_number: 'BR-5510-99',
    expiry_date: '2026-09-15',
    location_slot: 'Analyzer Bay B Refrigerator',
    status: 'LOW_STOCK',
  },
  {
    id: 'INV-1005',
    item_code: 'RGT-LFT-05',
    name: 'Biochemistry Analyzer LFT Substrate Reagents',
    category: 'REAGENT_KIT',
    branch_code: 'HYD-MAIN',
    branch_name: 'Main Branch - Hyderabad',
    current_quantity: 120,
    min_threshold: 30,
    unit: 'Litres',
    unit_price: 1800,
    supplier: 'Mindray Medical',
    batch_number: 'MR-9011-88',
    expiry_date: '2026-12-20',
    location_slot: 'Reagent Bay #1',
    status: 'OK',
  },
  {
    id: 'INV-1006',
    item_code: 'SWB-STERILE-06',
    name: 'Sterile Viral Transport Swab Kits (VTM)',
    category: 'CONSUMABLES',
    branch_code: 'SEC-MAIN',
    branch_name: 'Secunderabad Diagnostic Hub',
    current_quantity: 8,
    min_threshold: 100, // CRITICAL LOW
    unit: 'Kits',
    unit_price: 45,
    supplier: 'HiMedia Laboratories',
    batch_number: 'HM-1102-33',
    expiry_date: '2026-08-10',
    location_slot: 'Secunderabad Store Room C',
    status: 'LOW_STOCK',
  },
];

const DEFAULT_STOCK_LOGS = [
  {
    id: 'LOG-5001',
    item_id: 'INV-1001',
    item_name: 'Thyroid Chemiluminescence Reagent Kit (T3/T4/TSH)',
    type: 'USAGE',
    quantity_changed: -10,
    resulting_quantity: 42,
    recorded_by: 'Anil Kumar (Lab Tech)',
    reason: 'Routine daily analyzer batch calibration and patient processing.',
    batch_number: 'RCH-2026-904',
    timestamp: '2026-07-29T08:30:00Z',
  },
  {
    id: 'LOG-5002',
    item_id: 'INV-1002',
    item_name: 'SST Gold Top Gel Vacuum Blood Tubes (5ml)',
    type: 'RECEIPT',
    quantity_changed: 500,
    resulting_quantity: 1250,
    recorded_by: 'Inventory Manager',
    reason: 'Monthly vendor bulk replenishment PO #90812.',
    batch_number: 'BD-8849-22',
    timestamp: '2026-07-28T11:00:00Z',
  },
  {
    id: 'LOG-5003',
    item_id: 'INV-1003',
    item_name: 'EDTA Lavender Top Blood Tubes (3ml)',
    type: 'WASTAGE',
    quantity_changed: -15,
    resulting_quantity: 85,
    recorded_by: 'Anil Kumar (Lab Tech)',
    reason: 'Expired batch tube vacuum degradation during QC test.',
    batch_number: 'BD-7731-09',
    timestamp: '2026-07-27T16:20:00Z',
  },
];

const DEFAULT_AUDIT_LOGS = [
  {
    id: 'AUD-8010',
    timestamp: '2026-07-29T09:40:12Z',
    user_id: 'USR-102',
    user_name: 'Dr. Sunita Rao',
    role: 'PATHOLOGIST',
    action: 'REPORT_APPROVAL',
    ip_address: '192.168.1.105',
    branch: 'HYD-MAIN',
    target_entity: 'Visit #VIS-905102',
    details: 'Approved & digitally signed Thyroid Profile report for patient Rahul Sharma (PAT-009842). Verified verification key tok_2026_8842.',
    severity: 'INFO',
  },
  {
    id: 'AUD-8009',
    timestamp: '2026-07-29T09:15:45Z',
    user_id: 'USR-104',
    user_name: 'Anil Kumar',
    role: 'LAB_TECHNICIAN',
    action: 'RESULT_ENTRY',
    ip_address: '192.168.1.112',
    branch: 'HYD-MAIN',
    target_entity: 'Visit #VIS-906203',
    details: 'Entered Biochemistry analyzer parameter values for Liver Function Test. System flagged Bilirubin & Transaminases as HIGH.',
    severity: 'INFO',
  },
  {
    id: 'AUD-8008',
    timestamp: '2026-07-29T08:50:20Z',
    user_id: 'USR-105',
    user_name: 'Priya Sharma',
    role: 'RECEPTIONIST',
    action: 'PATIENT_REGISTRATION',
    ip_address: '192.168.1.101',
    branch: 'HYD-MAIN',
    target_entity: 'Patient #PAT-009845',
    details: 'Registered walk-in patient Anita Desai. Billing total: ₹500 (CASH). Issued Invoice #INV-2026-904.',
    severity: 'INFO',
  },
  {
    id: 'AUD-8007',
    timestamp: '2026-07-29T08:15:10Z',
    user_id: 'USR-101',
    user_name: 'Admin System',
    role: 'ADMIN',
    action: 'INVENTORY_ALERT',
    ip_address: '10.0.0.1 (System)',
    branch: 'SEC-MAIN',
    target_entity: 'Item #SWB-STERILE-06',
    details: 'Automated low stock notification triggered for Viral Transport Swab Kits (8 units remaining, threshold is 100).',
    severity: 'WARNING',
  },
  {
    id: 'AUD-8006',
    timestamp: '2026-07-28T18:00:00Z',
    user_id: 'USR-102',
    user_name: 'Dr. Sunita Rao',
    role: 'PATHOLOGIST',
    action: 'REPORT_OVERRIDE',
    ip_address: '192.168.1.105',
    branch: 'HYD-BJRH',
    target_entity: 'Visit #VIS-903822',
    details: 'Overrode borderline CBC platelet count parameter with clinical note following repeat automated smear check.',
    severity: 'WARNING',
  },
  {
    id: 'AUD-8005',
    timestamp: '2026-07-28T14:30:00Z',
    user_id: 'USR-100',
    user_name: 'Chief Administrator',
    role: 'ADMIN',
    action: 'STAFF_REASSIGNMENT',
    ip_address: '192.168.1.10',
    branch: 'HYD-GCHB',
    target_entity: 'Staff #STF-005',
    details: 'Assigned K. Srinivas (Billing Associate) to Gachibowli Tech Park Collection Centre for peak morning shift support.',
    severity: 'INFO',
  },
];

const loadAdmin = (key, defaultData) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultData;
  } catch (e) {
    return defaultData;
  }
};

const saveAdmin = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed saving administrative data:', e);
  }
};

export const AdminDataStore = {
  // Branches
  getBranches: () => loadAdmin(ADMIN_KEYS.BRANCHES, DEFAULT_BRANCHES),
  saveBranches: (data) => saveAdmin(ADMIN_KEYS.BRANCHES, data),

  createOrUpdateBranch: (branchData, actorName = 'Admin') => {
    const branches = AdminDataStore.getBranches();
    let updatedBranch;

    if (branchData.id) {
      const idx = branches.findIndex((b) => b.id === branchData.id);
      if (idx !== -1) {
        branches[idx] = { ...branches[idx], ...branchData };
        updatedBranch = branches[idx];
      }
    } else {
      const newId = `BR-00${branches.length + 1}`;
      updatedBranch = {
        id: newId,
        code: branchData.code || `HYD-${branchData.name.slice(0, 4).toUpperCase()}`,
        name: branchData.name,
        address: branchData.address,
        phone: branchData.phone,
        email: branchData.email,
        operating_hours: branchData.operating_hours || '07:00 AM - 09:00 PM',
        status: branchData.status || 'ACTIVE',
        daily_sample_capacity: parseInt(branchData.daily_sample_capacity, 10) || 200,
        accreditation: branchData.accreditation || 'NABL Accredited',
        assigned_staff_ids: branchData.assigned_staff_ids || [],
        created_at: new Date().toISOString(),
      };
      branches.unshift(updatedBranch);
    }

    AdminDataStore.saveBranches(branches);

    AdminDataStore.logAudit(
      'ADMIN',
      actorName,
      'BRANCH_UPDATE',
      updatedBranch.code,
      `Created/Updated profile for branch "${updatedBranch.name}" (${updatedBranch.code}). Capacity: ${updatedBranch.daily_sample_capacity}/day.`
    );

    return updatedBranch;
  },

  // Staff Management
  getStaff: () => loadAdmin(ADMIN_KEYS.STAFF, DEFAULT_STAFF),
  saveStaff: (data) => saveAdmin(ADMIN_KEYS.STAFF, data),

  createEmployee: (employeeData, actorName = 'Admin') => {
    const staff = AdminDataStore.getStaff();
    const newEmployee = {
      id: `STF-00${staff.length + 1}`,
      full_name: employeeData.full_name,
      role: employeeData.role || 'RECEPTIONIST',
      designation: employeeData.designation || employeeData.role,
      qualification: employeeData.qualification || 'Relevant Degree',
      mobile: employeeData.mobile || '+91 98765 00000',
      email: employeeData.email,
      assigned_branches: employeeData.assigned_branches || ['HYD-MAIN'],
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    };

    staff.unshift(newEmployee);
    AdminDataStore.saveStaff(staff);

    AdminDataStore.logAudit(
      'ADMIN',
      actorName,
      'EMPLOYEE_CREATED',
      newEmployee.full_name,
      `Created new employee ${newEmployee.full_name} (${newEmployee.role}) with email ${newEmployee.email}.`
    );

    return newEmployee;
  },

  deleteEmployee: (staffId, actorName = 'Admin') => {
    const staff = AdminDataStore.getStaff();
    const target = staff.find((s) => s.id === staffId);
    if (!target) return false;

    const filtered = staff.filter((s) => s.id !== staffId);
    AdminDataStore.saveStaff(filtered);

    AdminDataStore.logAudit(
      'ADMIN',
      actorName,
      'EMPLOYEE_DELETED',
      target.full_name,
      `Permanently deleted employee account for ${target.full_name} (${target.role}).`
    );

    return true;
  },

  updateStaffAssignments: (staffId, assignedBranchCodes, actorName = 'Admin') => {
    const staff = AdminDataStore.getStaff();
    const idx = staff.findIndex((s) => s.id === staffId);
    if (idx !== -1) {
      staff[idx].assigned_branches = assignedBranchCodes;
      AdminDataStore.saveStaff(staff);

      AdminDataStore.logAudit(
        'ADMIN',
        actorName,
        'STAFF_MATRIX_UPDATE',
        staff[idx].full_name,
        `Reassigned staff member ${staff[idx].full_name} (${staff[idx].role}) to branches: ${assignedBranchCodes.join(', ')}.`
      );
    }
    return staff;
  },

  // Inventory
  getInventory: () => loadAdmin(ADMIN_KEYS.INVENTORY, DEFAULT_INVENTORY),
  saveInventory: (data) => saveAdmin(ADMIN_KEYS.INVENTORY, data),

  getStockLogs: () => loadAdmin(ADMIN_KEYS.STOCK_LOGS, DEFAULT_STOCK_LOGS),
  saveStockLogs: (data) => saveAdmin(ADMIN_KEYS.STOCK_LOGS, data),

  recordStockMovement: ({ itemId, logType, quantity, reason, batchNumber, actorName = 'Lab Technician' }) => {
    const inventory = AdminDataStore.getInventory();
    const logs = AdminDataStore.getStockLogs();

    const idx = inventory.findIndex((item) => item.id === itemId);
    if (idx === -1) return false;

    const item = inventory[idx];
    const qtyNum = parseInt(quantity, 10) || 0;
    
    let change = 0;
    if (logType === 'RECEIPT') change = Math.abs(qtyNum);
    else if (logType === 'USAGE' || logType === 'WASTAGE') change = -Math.abs(qtyNum);

    item.current_quantity = Math.max(0, item.current_quantity + change);
    if (batchNumber) item.batch_number = batchNumber;

    // Check status
    if (item.current_quantity <= item.min_threshold) {
      item.status = 'LOW_STOCK';
    } else {
      item.status = 'OK';
    }

    const newLog = {
      id: `LOG-${Date.now()}`,
      item_id: item.id,
      item_name: item.name,
      type: logType,
      quantity_changed: change,
      resulting_quantity: item.current_quantity,
      recorded_by: actorName,
      reason: reason || 'Routine inventory adjustment',
      batch_number: batchNumber || item.batch_number,
      timestamp: new Date().toISOString(),
    };

    logs.unshift(newLog);
    AdminDataStore.saveInventory(inventory);
    AdminDataStore.saveStockLogs(logs.slice(0, 100));

    AdminDataStore.logAudit(
      'INVENTORY',
      actorName,
      `STOCK_${logType}`,
      item.item_code,
      `Recorded ${logType} of ${Math.abs(change)} ${item.unit} for "${item.name}". New Stock: ${item.current_quantity}.`
    );

    return { item, log: newLog };
  },

  createInventoryItem: (itemData, actorName = 'Admin') => {
    const inventory = AdminDataStore.getInventory();
    const newItem = {
      id: `INV-${Date.now()}`,
      item_code: itemData.item_code || `ITEM-${Math.floor(1000 + Math.random() * 9000)}`,
      name: itemData.name,
      category: itemData.category || 'REAGENT_KIT',
      branch_code: itemData.branch_code || 'HYD-MAIN',
      branch_name: itemData.branch_name || 'Main Branch - Hyderabad',
      current_quantity: parseInt(itemData.current_quantity, 10) || 0,
      min_threshold: parseInt(itemData.min_threshold, 10) || 10,
      unit: itemData.unit || 'Units',
      unit_price: parseFloat(itemData.unit_price) || 0,
      supplier: itemData.supplier || 'Diagnostic Vendor',
      batch_number: itemData.batch_number || 'BATCH-2026',
      expiry_date: itemData.expiry_date || '2027-01-01',
      location_slot: itemData.location_slot || 'General Store',
      status: parseInt(itemData.current_quantity, 10) <= parseInt(itemData.min_threshold, 10) ? 'LOW_STOCK' : 'OK',
    };

    inventory.unshift(newItem);
    AdminDataStore.saveInventory(inventory);

    AdminDataStore.logAudit(
      'ADMIN',
      actorName,
      'INVENTORY_ITEM_CREATED',
      newItem.item_code,
      `Added new stock catalog item "${newItem.name}" (${newItem.item_code}) under ${newItem.branch_name}.`
    );

    return newItem;
  },

  // Audit Logs
  getAuditLogs: () => loadAdmin(ADMIN_KEYS.AUDIT_LOGS, DEFAULT_AUDIT_LOGS),
  saveAuditLogs: (data) => saveAdmin(ADMIN_KEYS.AUDIT_LOGS, data),

  logAudit: (role, userName, action, targetEntity, details, severity = 'INFO') => {
    const logs = AdminDataStore.getAuditLogs();
    const newLog = {
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      user_id: `USR-${Math.floor(100 + Math.random() * 900)}`,
      user_name: userName || 'System User',
      role: role || 'STAFF',
      action,
      ip_address: '192.168.1.100',
      branch: 'HYD-MAIN',
      target_entity: targetEntity || 'N/A',
      details,
      severity,
    };

    logs.unshift(newLog);
    AdminDataStore.saveAuditLogs(logs.slice(0, 100)); // Keep last 100
    return newLog;
  },

  // Helper for Financial Analytics metrics
  getFinancialSummary: (dateRangeFilter = 'THIS_MONTH') => {
    // Return aggregated financial data
    return {
      total_revenue: 142850,
      direct_revenue: 95400,
      referral_revenue: 47450,
      payment_method_breakdown: [
        { name: 'UPI / QR', value: 68500, percentage: 48, color: '#10B981' },
        { name: 'Credit / Debit Card', value: 42300, percentage: 30, color: '#2563EB' },
        { name: 'Cash', value: 24050, percentage: 17, color: '#F59E0B' },
        { name: 'Corporate Billing', value: 8000, percentage: 5, color: '#8B5CF6' },
      ],
      branch_yield: [
        { branch: 'Main Branch - Hyderabad', code: 'HYD-MAIN', revenue: 78500, visits: 82, avg_ticket: 957 },
        { branch: 'Banjara Hills Specialty', code: 'HYD-BJRH', revenue: 38200, visits: 38, avg_ticket: 1005 },
        { branch: 'Secunderabad Hub', code: 'SEC-MAIN', revenue: 18150, visits: 24, avg_ticket: 756 },
        { branch: 'Gachibowli Collection', code: 'HYD-GCHB', revenue: 8000, visits: 10, avg_ticket: 800 },
      ],
      top_popular_tests: [
        { test_name: 'Thyroid Profile I (T3, T4, TSH)', volume: 142, revenue: 71000, category: 'IMMUNOLOGY' },
        { test_name: 'Complete Blood Picture (CBC)', volume: 198, revenue: 59400, category: 'HAEMATOLOGY' },
        { test_name: 'Glycated Hemoglobin (HbA1c)', volume: 110, revenue: 49500, category: 'BIOCHEMISTRY' },
        { test_name: 'Liver Function Test (LFT)', volume: 85, revenue: 42500, category: 'BIOCHEMISTRY' },
        { test_name: 'Kidney Function Mini Profile', volume: 64, revenue: 38400, category: 'BIOCHEMISTRY' },
      ],
      daily_trend: [
        { date: 'Jul 23', direct: 11200, referral: 5400, total: 16600 },
        { date: 'Jul 24', direct: 12500, referral: 6800, total: 19300 },
        { date: 'Jul 25', direct: 14100, referral: 7200, total: 21300 },
        { date: 'Jul 26', direct: 10800, referral: 4900, total: 15700 },
        { date: 'Jul 27', direct: 15400, referral: 8100, total: 23500 },
        { date: 'Jul 28', direct: 16200, referral: 7500, total: 23700 },
        { date: 'Jul 29 (Today)', direct: 15200, referral: 7550, total: 22750 },
      ],
    };
  },
};

export default AdminDataStore;
