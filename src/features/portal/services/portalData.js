// Central Data & LocalStorage State Manager for Patient Portal
// Connects UI with simulated LIMS endpoints and persistent local storage

const STORAGE_KEYS = {
  APPOINTMENTS: 'lifeline_patient_appointments',
  INVOICES: 'lifeline_patient_invoices',
  REPORTS: 'lifeline_patient_reports',
  TICKETS: 'lifeline_patient_tickets',
};

// Master Test Catalog
export const CATALOG_TESTS = [
  { id: 'TES-001', name: 'Complete Blood Picture (CBC)', category: 'HEMATOLOGY', sample_type: 'BLOOD', price: 300, turnaround: 'Same Day (4 Hours)', preparation: 'No special fasting required' },
  { id: 'TES-002', name: 'Erythrocyte Sedimentation Rate (ESR)', category: 'HEMATOLOGY', sample_type: 'BLOOD', price: 100, turnaround: 'Same Day (2 Hours)', preparation: 'No special preparation' },
  { id: 'TES-003', name: 'Glycated Hemoglobin (HbA1c)', category: 'BIOCHEMISTRY', sample_type: 'BLOOD', price: 500, turnaround: 'Same Day (6 Hours)', preparation: 'Random or fasting sample' },
  { id: 'TES-004', name: 'Serum Calcium Test', category: 'BIOCHEMISTRY', sample_type: 'SERUM', price: 500, turnaround: '24 Hours', preparation: 'Overnight fasting recommended' },
  { id: 'TES-005', name: 'Total Testosterone Test (Serum Testosterone)', category: 'IMMUNOLOGY', sample_type: 'SERUM', price: 1500, turnaround: '24 Hours', preparation: 'Morning sample preferred (07:00 AM – 10:00 AM)' },
  { id: 'TES-006', name: 'Vitamin B12 Assay (Cobalamin / Vit B12)', category: 'BIOCHEMISTRY', sample_type: 'SERUM', price: 900, turnaround: '24 Hours', preparation: '10-12 hours overnight fasting' },
  { id: 'TES-007', name: 'Vitamin D3 Total (25-OH Hydroxy Vitamin D / Vit D3)', category: 'BIOCHEMISTRY', sample_type: 'SERUM', price: 1000, turnaround: '24 Hours', preparation: 'No special fasting required' },
  { id: 'TES-008', name: 'Iron Profile (Fe, TIBC, % Sat)', category: 'BIOCHEMISTRY', sample_type: 'SERUM', price: 800, turnaround: '24 Hours', preparation: '12 hours fasting required' },
  { id: 'TES-009', name: 'Kidney Function Mini Profile (KFT)', category: 'BIOCHEMISTRY', sample_type: 'SERUM', price: 800, turnaround: 'Same Day', preparation: '8-10 hours fasting' },
  { id: 'TES-010', name: 'Lipid Profile Complete', category: 'BIOCHEMISTRY', sample_type: 'SERUM', price: 500, turnaround: '12 Hours', preparation: '12 hours strict fasting' },
  { id: 'TES-011', name: 'Liver Function Test (LFT)', category: 'BIOCHEMISTRY', sample_type: 'SERUM', price: 500, turnaround: 'Same Day', preparation: 'Overnight fasting' },
  { id: 'TES-012', name: 'Complete Urine Examination (CUE)', category: 'PATHOLOGY', sample_type: 'URINE', price: 200, turnaround: 'Same Day', preparation: 'First morning mid-stream sample' },
  { id: 'TES-013', name: 'Thyroid Profile I (T3, T4, TSH)', category: 'IMMUNOLOGY', sample_type: 'SERUM', price: 500, turnaround: 'Same Day', preparation: 'Fasting preferred' },
  { id: 'TES-014', name: 'Fasting Blood Sugar (FBS)', category: 'BIOCHEMISTRY', sample_type: 'BLOOD', price: 50, turnaround: '2 Hours', preparation: '8-10 hours overnight fasting' },
  { id: 'TES-015', name: 'Post Prandial Blood Sugar (PPBS)', category: 'BIOCHEMISTRY', sample_type: 'BLOOD', price: 50, turnaround: '2 Hours', preparation: '2 hours after meal' },
];

// Master Health Packages
export const CATALOG_PACKAGES = [
  {
    id: 'PKG-000001',
    name: 'Ayush-2 Full Body Checkup',
    price: 750,
    original_price: 1800,
    discount_percentage: 58,
    included_test_count: 10,
    popular: true,
    description: 'Essential preventive health profile covering Blood, Sugar, Thyroid, Kidney, Liver & Urine screening.',
    test_ids: ['TES-001', 'TES-002', 'TES-003', 'TES-004', 'TES-008', 'TES-009', 'TES-010', 'TES-011', 'TES-012', 'TES-013'],
  },
  {
    id: 'PKG-000002',
    name: 'Ayush-3 Comprehensive Master Health',
    price: 1500,
    original_price: 3500,
    discount_percentage: 57,
    included_test_count: 13,
    popular: false,
    description: 'Advanced diagnostic screening adding Vitamins B12/D3 and Hormonal evaluation.',
    test_ids: ['TES-001', 'TES-002', 'TES-003', 'TES-004', 'TES-005', 'TES-006', 'TES-007', 'TES-008', 'TES-009', 'TES-010', 'TES-011', 'TES-012', 'TES-013'],
  },
  {
    id: 'PKG-000003',
    name: 'Cardiac & Metabolic Care Package',
    price: 999,
    original_price: 2200,
    discount_percentage: 55,
    included_test_count: 6,
    popular: false,
    description: 'Targeted assessment for heart health, cholesterol, lipid balances, and blood sugar control.',
    test_ids: ['TES-001', 'TES-003', 'TES-009', 'TES-010', 'TES-014', 'TES-015'],
  },
];

// Available Laboratory Branches (Single Headquarter Location)
export const BRANCHES = [
  {
    id: 'BR-01',
    name: 'Life Line Diagnostics - Vijayawada Main Branch',
    code: 'VJW-MAIN',
    address: 'Puspha Hotel Rd, opp. to Assure hospital, New Giri Puram, Kasturibaipet, Vijayawada, Andhra Pradesh 520002.',
    phone: '+91 866 247 8900',
    operating_hours: 'Mon-Sat: 06:00 AM - 09:30 PM (Sun: 07:00 AM - 02:00 PM)',
    accreditation: 'NABL Accredited & ISO 9001:2015 Certified',
  },
];

// // Default Initial Seed Data (Explicitly tagged for demo account patient@gmail.com)
const DEFAULT_APPOINTMENTS = [
  {
    id: 'APT-904101',
    appointment_number: 'APT-2026-0941',
    visit_id: 'VIS-904101',
    patient_name: 'Rahul Sharma',
    patient_id: 'PAT-009842',
    patient_email: 'patient@gmail.com',
    collection_type: 'HOME_COLLECTION',
    scheduled_date: '2026-07-30',
    scheduled_time: '08:30 AM',
    branch_name: 'Main Branch - Hyderabad (Central Hub)',
    status: 'ACCEPTED',
    payment_status: 'PAID',
    payment_preference: 'PAY_NOW',
    total_amount: 750,
    items_summary: 'Ayush-2 Full Body Checkup (1 Package)',
    address: 'Flat 402, Greenfield Heights, Road No 12, Banjara Hills, Hyderabad',
    assigned_technician: 'Anil Kumar (Sample Collector)',
    created_at: '2026-07-28T10:30:00Z',
  },
  {
    id: 'APT-903822',
    appointment_number: 'APT-2026-0812',
    visit_id: 'VIS-903822',
    patient_name: 'Rahul Sharma',
    patient_id: 'PAT-009842',
    patient_email: 'patient@gmail.com',
    collection_type: 'LAB_VISIT',
    scheduled_date: '2026-07-25',
    scheduled_time: '09:00 AM',
    branch_name: 'Banjara Hills Specialty Centre',
    status: 'COMPLETED',
    payment_status: 'PAID',
    payment_preference: 'PAY_NOW',
    total_amount: 300,
    items_summary: 'Complete Blood Picture (CBC)',
    address: 'Walk-in at Banjara Hills Branch',
    assigned_technician: 'Lab Desk Staff',
    created_at: '2026-07-24T14:15:00Z',
  },
];

const DEFAULT_INVOICES = [
  {
    id: 'INV-2026-0041',
    invoice_number: 'INV-2026-0041',
    visit_id: 'VIS-904101',
    patient_name: 'Rahul Sharma',
    patient_id: 'PAT-009842',
    patient_email: 'patient@gmail.com',
    status: 'PAID',
    payment_preference: 'PAY_NOW',
    subtotal: 750,
    discount: 0,
    total_amount: 750,
    amount_paid: 750,
    balance_due: 0,
    created_at: '2026-07-28T10:30:00Z',
    items: [
      { item_name: 'Ayush-2 Full Body Checkup', item_type: 'PACKAGE', quantity: 1, unit_price: 750, line_total: 750 },
    ],
    payments: [
      { payment_id: 'PAY-88392', amount: 750, method: 'UPI', status: 'SUCCESS', transaction_ref: 'UPI/6209418290/SUCCESS', paid_at: '2026-07-28T10:32:00Z' },
    ],
  },
  {
    id: 'INV-2026-0012',
    invoice_number: 'INV-2026-0012',
    visit_id: 'VIS-903822',
    patient_name: 'Rahul Sharma',
    patient_id: 'PAT-009842',
    patient_email: 'patient@gmail.com',
    status: 'PAID',
    payment_preference: 'PAY_NOW',
    subtotal: 300,
    discount: 0,
    total_amount: 300,
    amount_paid: 300,
    balance_due: 0,
    created_at: '2026-07-24T14:15:00Z',
    items: [
      { item_name: 'Complete Blood Picture (CBC)', item_type: 'TEST', quantity: 1, unit_price: 300, line_total: 300 },
    ],
    payments: [
      { payment_id: 'PAY-77102', amount: 300, method: 'CARD', status: 'SUCCESS', transaction_ref: 'CARD/9041/AUTH_882', paid_at: '2026-07-24T14:16:00Z' },
    ],
  },
  {
    id: 'INV-2026-0089',
    invoice_number: 'INV-2026-0089',
    visit_id: 'VIS-905102',
    patient_name: 'Rahul Sharma',
    patient_id: 'PAT-009842',
    patient_email: 'patient@gmail.com',
    status: 'UNPAID',
    payment_preference: 'PAY_LATER',
    subtotal: 500,
    discount: 0,
    total_amount: 500,
    amount_paid: 0,
    balance_due: 500,
    created_at: '2026-07-29T08:00:00Z',
    items: [
      { item_name: 'Thyroid Profile I (T3, T4, TSH)', item_type: 'TEST', quantity: 1, unit_price: 500, line_total: 500 },
    ],
    payments: [],
  },
];

const DEFAULT_REPORTS = [
  {
    id: 'REP-2026-0812',
    report_number: 'REP-2026-0812',
    visit_id: 'VIS-903822',
    invoice_id: 'INV-2026-0012',
    patient_email: 'patient@gmail.com',
    patient_id: 'PAT-009842',
    title: 'Complete Blood Picture (CBC)',
    status: 'GENERATED',
    payment_status: 'PAID', // Unlocked because invoice is paid!
    generated_at: '2026-07-25T16:00:00Z',
    pathologist_name: 'Dr. Mallika Boyapati (MD, Path)',
    verification_token: 'ver_tok_903822_cbc',
    parameters: [
      { name: 'Hemoglobin (Hb)', result: '14.5', unit: 'g/dL', reference_range: '13.5 - 17.5', flag: 'NORMAL' },
      { name: 'Total Leukocyte Count (WBC)', result: '7,800', unit: '/µL', reference_range: '4,000 - 11,000', flag: 'NORMAL' },
      { name: 'Platelet Count', result: '2.5', unit: 'lakhs/µL', reference_range: '1.5 - 4.5', flag: 'NORMAL' },
      { name: 'RBC Count', result: '4.8', unit: 'million/µL', reference_range: '4.5 - 5.9', flag: 'NORMAL' },
      { name: 'Packed Cell Volume (PCV)', result: '43.2', unit: '%', reference_range: '41.0 - 53.0', flag: 'NORMAL' },
    ],
  },
  {
    id: 'REP-2026-0902',
    report_number: 'REP-2026-0902',
    visit_id: 'VIS-905102',
    invoice_id: 'INV-2026-0089',
    patient_email: 'patient@gmail.com',
    patient_id: 'PAT-009842',
    title: 'Thyroid Profile I (T3, T4, TSH)',
    status: 'GENERATED',
    payment_status: 'UNPAID', // LOCKED! Release blocked until invoice paid
    generated_at: '2026-07-29T09:00:00Z',
    pathologist_name: 'Dr. Mallika Boyapati (MD, Path)',
    verification_token: 'ver_tok_905102_tsh',
    parameters: [
      { name: 'Total Triiodothyronine (T3)', result: '115.0', unit: 'ng/dL', reference_range: '80.0 - 200.0', flag: 'NORMAL' },
      { name: 'Total Thyroxine (T4)', result: '8.2', unit: 'µg/dL', reference_range: '5.0 - 12.0', flag: 'NORMAL' },
      { name: 'Thyroid Stimulating Hormone (TSH)', result: '2.45', unit: 'µIU/mL', reference_range: '0.40 - 4.00', flag: 'NORMAL' },
    ],
  },
];

const DEFAULT_TICKETS = [];


// Helper functions for LocalStorage management
const loadStore = (key, defaultData) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultData;
    let parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const sanitized = parsed.filter(
        (item) => item.appointment_number !== 'APT-2026-6566' && item.id !== 'APT-2026-6566' && item.visit_id !== 'VIS-2026-6566'
      );
      if (sanitized.length !== parsed.length) {
        localStorage.setItem(key, JSON.stringify(sanitized));
        return sanitized;
      }
    }
    return parsed;
  } catch (e) {
    return defaultData;
  }
};

const saveStore = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
};

export const PortalDataStore = {
  getAppointments: (currentUser) => {
    const list = loadStore(STORAGE_KEYS.APPOINTMENTS, DEFAULT_APPOINTMENTS);
    if (!currentUser) return [];
    const email = currentUser.email?.toLowerCase();
    if (!email) return [];
    return list.filter((a) => {
      if (a.patient_email?.toLowerCase() === email || a.email?.toLowerCase() === email) return true;
      if (email === 'patient@gmail.com' && (!a.patient_email || a.patient_email === 'patient@gmail.com')) return true;
      return false;
    });
  },
  saveAppointments: (data) => saveStore(STORAGE_KEYS.APPOINTMENTS, data),

  getInvoices: (currentUser) => {
    const list = loadStore(STORAGE_KEYS.INVOICES, DEFAULT_INVOICES);
    if (!currentUser) return [];
    const email = currentUser.email?.toLowerCase();
    if (!email) return [];
    return list.filter((i) => {
      if (i.patient_email?.toLowerCase() === email || i.email?.toLowerCase() === email) return true;
      if (email === 'patient@gmail.com' && (!i.patient_email || i.patient_email === 'patient@gmail.com')) return true;
      return false;
    });
  },
  saveInvoices: (data) => saveStore(STORAGE_KEYS.INVOICES, data),

  getReports: (currentUser) => {
    const list = loadStore(STORAGE_KEYS.REPORTS, DEFAULT_REPORTS);
    if (!currentUser) return [];
    const email = currentUser.email?.toLowerCase();
    if (!email) return [];
    return list.filter((r) => {
      if (r.patient_email?.toLowerCase() === email || r.email?.toLowerCase() === email) return true;
      if (email === 'patient@gmail.com' && (!r.patient_email || r.patient_email === 'patient@gmail.com')) return true;
      return false;
    });
  },
  saveReports: (data) => saveStore(STORAGE_KEYS.REPORTS, data),

  getTickets: () => {
    const list = loadStore(STORAGE_KEYS.TICKETS, DEFAULT_TICKETS);
    return list.filter((t) => t.id !== 'TCK-1092');
  },

  saveTickets: (data) => saveStore(STORAGE_KEYS.TICKETS, data),

  // Method to create a complete new booking with linked invoice & appointment and sync to Operations Workstations
  createBooking: ({ collectionType, selectedTests, selectedPackages, branch, date, time, address, paymentPreference, patientUser }) => {
    const appointments = loadStore(STORAGE_KEYS.APPOINTMENTS, DEFAULT_APPOINTMENTS);
    const invoices = loadStore(STORAGE_KEYS.INVOICES, DEFAULT_INVOICES);

    const timestamp = Date.now();
    const visitId = `VIS-${Math.floor(100000 + Math.random() * 900000)}`;
    const aptNumber = `APT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const invNumber = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const pId = patientUser?.patient_id || `PAT-${Math.floor(100000 + Math.random() * 900000)}`;
    const pEmail = patientUser?.email || 'patient@gmail.com';
    const pName = patientUser?.full_name || 'Patient';

    // Calculate Items & Total
    let items = [];
    let subtotal = 0;

    selectedTests.forEach((t) => {
      items.push({ item_name: t.name, item_type: 'TEST', quantity: 1, unit_price: t.price, line_total: t.price });
      subtotal += t.price;
    });

    selectedPackages.forEach((p) => {
      items.push({ item_name: p.name, item_type: 'PACKAGE', quantity: 1, unit_price: p.price, line_total: p.price });
      subtotal += p.price;
    });

    const isPaidNow = paymentPreference === 'PAY_NOW';

    // 1. Create Appointment Object for Patient
    const newApt = {
      id: `APT-${timestamp}`,
      appointment_number: aptNumber,
      visit_id: visitId,
      patient_id: pId,
      patient_name: pName,
      patient_email: pEmail,
      collection_type: collectionType,
      scheduled_date: date,
      scheduled_time: time,
      branch_name: branch?.name || 'Main Branch - Hyderabad (Central Hub)',
      status: 'BOOKED',
      payment_status: isPaidNow ? 'PAID' : 'UNPAID',
      payment_preference: paymentPreference,
      total_amount: subtotal,
      items_summary: items.map((i) => i.item_name).join(', '),
      address: collectionType === 'HOME_COLLECTION' ? address : `Walk-in at ${branch?.name}`,
      assigned_technician: collectionType === 'HOME_COLLECTION' ? 'To be assigned' : 'Lab Desk Staff',
      created_at: new Date().toISOString(),
    };

    // 2. Create Invoice Object for Patient
    const newInv = {
      id: invNumber,
      invoice_number: invNumber,
      visit_id: visitId,
      patient_name: pName,
      patient_id: pId,
      patient_email: pEmail,
      status: isPaidNow ? 'PAID' : 'UNPAID',
      payment_preference: paymentPreference,
      subtotal,
      discount: 0,
      total_amount: subtotal,
      amount_paid: isPaidNow ? subtotal : 0,
      balance_due: isPaidNow ? 0 : subtotal,
      created_at: new Date().toISOString(),
      items,
      payments: isPaidNow
        ? [
            {
              payment_id: `PAY-${Math.floor(10000 + Math.random() * 90000)}`,
              amount: subtotal,
              method: 'UPI',
              status: 'SUCCESS',
              transaction_ref: `UPI/${Math.floor(1000000000 + Math.random() * 9000000000)}/SUCCESS`,
              paid_at: new Date().toISOString(),
            },
          ]
        : [],
    };

    appointments.unshift(newApt);
    invoices.unshift(newInv);

    PortalDataStore.saveAppointments(appointments);
    PortalDataStore.saveInvoices(invoices);

    // 3. Sync to Operations Workstation Data Store (Reception Desk & Tech Workstation)
    try {
      const opsPatientsRaw = localStorage.getItem('lifeline_ops_patients');
      const opsPatients = opsPatientsRaw ? JSON.parse(opsPatientsRaw) : [];

      const opsVisitsRaw = localStorage.getItem('lifeline_ops_visits');
      const opsVisits = opsVisitsRaw ? JSON.parse(opsVisitsRaw) : [];

      const existingOpPatient = opsPatients.find((p) => p.email?.toLowerCase() === pEmail.toLowerCase());
      if (!existingOpPatient) {
        opsPatients.unshift({
          id: pId,
          patient_id: pId,
          full_name: pName,
          age: 30,
          gender: 'Male',
          mobile: patientUser?.phone || '+91 98765 43210',
          email: pEmail,
          address: address || 'Hyderabad',
          referring_doctor: 'Self Walk-In',
          emergency_contact: patientUser?.phone || '+91 98765 43210',
          registered_at: new Date().toISOString(),
          visit_count: 1,
        });
        localStorage.setItem('lifeline_ops_patients', JSON.stringify(opsPatients));
      }

      opsVisits.unshift({
        id: visitId,
        visit_id: visitId,
        patient_name: pName,
        patient_id: pId,
        patient_email: pEmail,
        patient_mobile: patientUser?.phone || '+91 98765 43210',
        branch_name: branch?.name || 'Main Branch - Hyderabad (Central Hub)',
        branch_code: 'MAIN',
        visit_type: collectionType,
        scheduled_at: `${date} ${time}`,
        status: collectionType === 'HOME_COLLECTION' ? 'SCHEDULED' : 'BOOKED',
        payment_status: isPaidNow ? 'PAID' : 'UNPAID',
        payment_preference: paymentPreference,
        total_amount: subtotal,
        amount_paid: isPaidNow ? subtotal : 0,
        balance_due: isPaidNow ? 0 : subtotal,
        tests_summary: items.map((i) => i.item_name).join(', '),
        token_number: `TOK-${Math.floor(100 + Math.random() * 900)}`,
        created_at: new Date().toISOString(),
        items,
      });
      localStorage.setItem('lifeline_ops_visits', JSON.stringify(opsVisits));
    } catch (err) {
      console.warn('Operations sync warning:', err);
    }

    return { appointment: newApt, invoice: newInv };
  },

  // Pay an invoice and unlock any associated reports
  payInvoice: (invoiceNumber, paymentMethod = 'UPI') => {
    const invoices = PortalDataStore.getInvoices();
    const appointments = PortalDataStore.getAppointments();
    const reports = PortalDataStore.getReports();

    const invIndex = invoices.findIndex((i) => i.invoice_number === invoiceNumber || i.id === invoiceNumber);
    if (invIndex === -1) return false;

    const inv = invoices[invIndex];
    const paidAmount = inv.balance_due;

    inv.status = 'PAID';
    inv.amount_paid = inv.total_amount;
    inv.balance_due = 0;
    inv.payments.push({
      payment_id: `PAY-${Math.floor(10000 + Math.random() * 90000)}`,
      amount: paidAmount,
      method: paymentMethod,
      status: 'SUCCESS',
      transaction_ref: `${paymentMethod}/${Math.floor(1000000000 + Math.random() * 9000000000)}/SUCCESS`,
      paid_at: new Date().toISOString(),
    });

    // Also update linked appointment payment status
    const aptIndex = appointments.findIndex((a) => a.visit_id === inv.visit_id);
    if (aptIndex !== -1) {
      appointments[aptIndex].payment_status = 'PAID';
    }

    // Unblock linked reports!
    reports.forEach((r) => {
      if (r.invoice_id === inv.invoice_number || r.visit_id === inv.visit_id) {
        r.payment_status = 'PAID';
      }
    });

    PortalDataStore.saveInvoices(invoices);
    PortalDataStore.saveAppointments(appointments);
    PortalDataStore.saveReports(reports);

    return inv;
  },

  // Create a support ticket
  createTicket: ({ subject, category, priority, description, patientUser }) => {
    const tickets = PortalDataStore.getTickets();
    const newTicket = {
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      subject,
      category,
      priority,
      status: 'OPEN',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'PATIENT',
          sender_name: patientUser?.full_name || 'Rahul Sharma',
          text: description,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    tickets.unshift(newTicket);
    PortalDataStore.saveTickets(tickets);
    return newTicket;
  },

  // Add a reply message to a support ticket
  addTicketReply: (ticketId, replyText, patientUser) => {
    const tickets = PortalDataStore.getTickets();
    const tIndex = tickets.findIndex((t) => t.id === ticketId);
    if (tIndex === -1) return null;

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'PATIENT',
      sender_name: patientUser?.full_name || 'Rahul Sharma',
      text: replyText,
      timestamp: new Date().toISOString(),
    };

    tickets[tIndex].messages.push(newMsg);
    tickets[tIndex].updated_at = new Date().toISOString();

    PortalDataStore.saveTickets(tickets);
    return tickets[tIndex];
  },
};

export default PortalDataStore;
