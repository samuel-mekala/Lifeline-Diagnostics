// Central Operations & Workflow Data Store for LIMS
// Fresh Clean State for Live Testing (Walk-In Registrations, Lab Visits, Home Collections, Sample Barcodes, Result Entry, Pathologist Approvals)

const OPERATIONAL_KEYS = {
  PATIENTS: 'lifeline_ops_patients',
  VISITS: 'lifeline_ops_visits',
  SAMPLES: 'lifeline_ops_samples',
  RESULTS: 'lifeline_ops_results',
  ACTIVITY_LOGS: 'lifeline_ops_activity_logs',
  NOTIFICATIONS: 'lifeline_ops_notifications',
  INVENTORY: 'lifeline_ops_inventory',
};

const DEFAULT_INVENTORY = [
  { id: 'INV-101', name: 'EDTA Blood Tube (Purple)', category: 'TUBES', stock: 500, min_level: 50, unit: 'Tubes' },
  { id: 'INV-102', name: 'SST Gel Tube (Yellow)', category: 'TUBES', stock: 500, min_level: 50, unit: 'Tubes' },
  { id: 'INV-103', name: 'Sodium Fluoride Tube (Gray)', category: 'TUBES', stock: 300, min_level: 40, unit: 'Tubes' },
  { id: 'INV-104', name: 'Sterile Urine Container', category: 'CONTAINERS', stock: 300, min_level: 30, unit: 'Containers' },
  { id: 'INV-105', name: 'Sterile Vacutainer Needles 21G', category: 'NEEDLES', stock: 1000, min_level: 100, unit: 'Pieces' },
  { id: 'INV-106', name: 'Nitrile Exam Gloves (Pairs)', category: 'PPE', stock: 2000, min_level: 200, unit: 'Pairs' },
  { id: 'INV-107', name: 'Alcohol Swabs & Cotton Rolls', category: 'CONSUMABLES', stock: 1000, min_level: 150, unit: 'Packs' },
  { id: 'INV-108', name: 'Thyroid T3/T4/TSH Reagent Kit', category: 'REAGENTS', stock: 50, min_level: 10, unit: 'Kits' },
  { id: 'INV-109', name: 'LFT Enzymatic Reagent Set', category: 'REAGENTS', stock: 50, min_level: 10, unit: 'Kits' },
  { id: 'INV-110', name: 'HbA1c Assay Cartridges', category: 'REAGENTS', stock: 50, min_level: 15, unit: 'Cartridges' },
];

const DEFAULT_PATIENTS = [];
const DEFAULT_VISITS = [];
const DEFAULT_SAMPLES = [];
const DEFAULT_RESULTS = {};
const DEFAULT_ACTIVITY_LOGS = [];

const loadOps = (key, defaultData) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultData;
  } catch (e) {
    return defaultData;
  }
};

const saveOps = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed saving operational state:', e);
  }
};

export const OperationsDataStore = {
  getPatients: () => {
    const raw = loadOps(OPERATIONAL_KEYS.PATIENTS, DEFAULT_PATIENTS);
    const seen = new Set();
    const unique = [];
    for (const p of raw) {
      const key = (p.email || p.mobile || p.id).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(p);
      }
    }
    return unique;
  },
  savePatients: (data) => saveOps(OPERATIONAL_KEYS.PATIENTS, data),

  getVisits: () => loadOps(OPERATIONAL_KEYS.VISITS, DEFAULT_VISITS),
  saveVisits: (data) => saveOps(OPERATIONAL_KEYS.VISITS, data),

  getSamples: () => loadOps(OPERATIONAL_KEYS.SAMPLES, DEFAULT_SAMPLES),
  saveSamples: (data) => saveOps(OPERATIONAL_KEYS.SAMPLES, data),

  getResults: () => loadOps(OPERATIONAL_KEYS.RESULTS, DEFAULT_RESULTS),
  saveResults: (data) => saveOps(OPERATIONAL_KEYS.RESULTS, data),

  getInventory: () => loadOps(OPERATIONAL_KEYS.INVENTORY, DEFAULT_INVENTORY),
  saveInventory: (data) => saveOps(OPERATIONAL_KEYS.INVENTORY, data),

  getActivityLogs: () => loadOps(OPERATIONAL_KEYS.ACTIVITY_LOGS, DEFAULT_ACTIVITY_LOGS),
  saveActivityLogs: (data) => saveOps(OPERATIONAL_KEYS.ACTIVITY_LOGS, data),

  clearAllData: () => {
    Object.values(OPERATIONAL_KEYS).forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem('lifeline_access_token');
    localStorage.removeItem('lifeline_refresh_token');
    localStorage.removeItem('lifeline_user_profile');
    localStorage.removeItem('lifeline_registered_users_list');
    localStorage.removeItem('lifeline_admin_staff');
  },

  // Deduct Inventory Consumables
  deductInventoryOnSampleCollection: () => {
    const inv = OperationsDataStore.getInventory();
    inv.forEach((item) => {
      if (item.category === 'TUBES' || item.category === 'NEEDLES' || item.category === 'PPE' || item.category === 'CONSUMABLES') {
        item.stock = Math.max(0, item.stock - 1);
      }
    });
    OperationsDataStore.saveInventory(inv);
  },

  deductInventoryOnTesting: () => {
    const inv = OperationsDataStore.getInventory();
    inv.forEach((item) => {
      if (item.category === 'REAGENTS') {
        item.stock = Math.max(0, item.stock - 1);
      }
    });
    OperationsDataStore.saveInventory(inv);
  },

  logActivity: (role, actorName, branch, action, details) => {
    const logs = OperationsDataStore.getActivityLogs();
    const newLog = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      role,
      actorName,
      branch,
      action,
      details,
    };
    logs.unshift(newLog);
    OperationsDataStore.saveActivityLogs(logs);
  },

  acceptVisitAndGenerateBarcode: (visitId, techName) => {
    const visits = OperationsDataStore.getVisits();
    const visitIdx = visits.findIndex((v) => v.id === visitId);

    if (visitIdx !== -1) {
      visits[visitIdx].status = 'VISITED';
      visits[visitIdx].technician = techName;
      OperationsDataStore.saveVisits(visits);

      const samples = OperationsDataStore.getSamples();
      const barcodeId = `LLD-B-${Math.floor(100000 + Math.random() * 900000)}`;

      const newSample = {
        id: `SMP-${Date.now()}`,
        barcode_id: barcodeId,
        visit_id: visitId,
        patient_name: visits[visitIdx].patient_name,
        patient_id: visits[visitIdx].patient_id,
        test_names: visits[visitIdx].tests_summary,
        sample_type: 'Blood Vacutainer',
        collected_at: new Date().toISOString(),
        status: 'COLLECTED',
        location: 'Sample Transport Box',
        technician: techName,
      };

      samples.unshift(newSample);
      OperationsDataStore.saveSamples(samples);
      OperationsDataStore.deductInventoryOnSampleCollection();
    }
  },

  collectSample: (barcodeId, tubeColor, containerCount, notes, techName) => {
    const samples = OperationsDataStore.getSamples();
    const idx = samples.findIndex((s) => s.barcode_id === barcodeId);
    if (idx !== -1) {
      samples[idx].status = 'COLLECTED';
      samples[idx].tube_color = tubeColor;
      samples[idx].collected_by = techName;
      OperationsDataStore.saveSamples(samples);
      OperationsDataStore.deductInventoryOnSampleCollection();
    }
  },

  updateSampleStatus: (barcodeId, newStatus, location, techName) => {
    const samples = OperationsDataStore.getSamples();
    const idx = samples.findIndex((s) => s.barcode_id === barcodeId);
    if (idx !== -1) {
      samples[idx].status = newStatus;
      samples[idx].location = location;
      OperationsDataStore.saveSamples(samples);
    }
  },

  // Register Patient (Walk-in / Referral / Website) with Deduplication
  registerPatient: (patientData, actorName = 'Receptionist') => {
    const patients = OperationsDataStore.getPatients();

    const emailKey = patientData.email?.trim().toLowerCase();
    const mobileKey = patientData.mobile?.trim();

    const existing = patients.find(
      (p) => (emailKey && p.email?.toLowerCase() === emailKey) || (mobileKey && p.mobile === mobileKey)
    );

    if (existing) {
      return existing; // Avoid creating duplicate patient record
    }

    const newId = `PAT-${Math.floor(100000 + Math.random() * 900000)}`;

    const newPatient = {
      id: newId,
      patient_id: newId,
      full_name: patientData.fullName,
      age: parseInt(patientData.age, 10) || 30,
      gender: patientData.gender || 'Male',
      mobile: patientData.mobile,
      email: patientData.email || `${newId.toLowerCase()}@example.com`,
      address: patientData.address || 'Hyderabad',
      referring_doctor: patientData.referringDoctor || 'Self Walk-In',
      emergency_contact: patientData.emergencyContact || patientData.mobile,
      registered_at: new Date().toISOString(),
      visit_count: 0,
    };

    patients.unshift(newPatient);
    OperationsDataStore.savePatients(patients);

    OperationsDataStore.logActivity(
      'RECEPTIONIST',
      actorName,
      'Main Branch',
      'PATIENT_REGISTERED',
      `Registered patient ${newPatient.full_name} (${newPatient.patient_id}).`
    );

    return newPatient;
  },

  // Create Lab Visit / Home Collection Booking
  createVisit: ({
    patient,
    selectedTests = [],
    selectedPackages = [],
    branchName = 'Main Branch - Hyderabad',
    visitType = 'LAB_VISIT',
    paymentMethod = 'CASH',
    paymentPreference = 'PAY_LATER',
    actorName = 'Reception Desk',
  }) => {
    const visits = OperationsDataStore.getVisits();
    const samples = OperationsDataStore.getSamples();
    const visitId = `VIS-${Math.floor(100000 + Math.random() * 900000)}`;

    let testsSummary = [];
    let subtotal = 0;

    selectedTests.forEach((t) => {
      testsSummary.push(t.name);
      subtotal += t.price;
    });

    selectedPackages.forEach((p) => {
      testsSummary.push(p.name);
      subtotal += p.price;
    });

    const isPaidNow = paymentPreference === 'PAY_NOW';

    // Auto-generate specimen tracking sample barcode entry
    const seq = Math.floor(100000 + Math.random() * 900000);
    const bloodBarcode = `LLD-B-${seq}`;
    const serumBarcode = `LLD-S-${seq}`;

    const newVisit = {
      id: visitId,
      visit_id: visitId,
      patient_id: patient.patient_id || patient.id,
      patient_name: patient.full_name || patient.fullName,
      patient_age: patient.age,
      patient_gender: patient.gender,
      mobile: patient.mobile,
      branch_code: 'HYD-MAIN',
      branch_name: branchName,
      visit_type: visitType,
      status: 'REGISTERED',
      payment_status: isPaidNow ? 'PAID' : 'UNPAID',
      payment_method: paymentMethod,
      total_amount: subtotal || 500,
      amount_paid: isPaidNow ? (subtotal || 500) : 0,
      tests_summary: testsSummary.join(', ') || 'General Diagnostic Workup',
      created_at: new Date().toISOString(),
      technician_notes: '',
      pathologist_notes: '',
      assigned_technician: '',
      sample_ids: [bloodBarcode, serumBarcode],
    };

    // Add specimen barcode tracking entries
    samples.unshift({
      id: `SMP-${Date.now()}-1`,
      barcode_id: bloodBarcode,
      patient_name: patient.full_name || patient.fullName,
      visit_id: visitId,
      test_name: testsSummary[0] || 'General Diagnostic Suite',
      sample_type: 'Blood Sample (EDTA)',
      tube_color: 'EDTA Lavender (Whole Blood)',
      status: 'REGISTERED',
      collected_by: '',
      location: 'Phlebotomy Queue',
    });

    samples.unshift({
      id: `SMP-${Date.now()}-2`,
      barcode_id: serumBarcode,
      patient_name: patient.full_name || patient.fullName,
      visit_id: visitId,
      test_name: testsSummary[0] || 'General Diagnostic Suite',
      sample_type: 'Serum Sample (SST)',
      tube_color: 'SST Gold Gel (Serum Separator)',
      status: 'REGISTERED',
      collected_by: '',
      location: 'Centrifuge Station',
    });

    visits.unshift(newVisit);
    OperationsDataStore.saveVisits(visits);
    OperationsDataStore.saveSamples(samples);

    OperationsDataStore.logActivity(
      'RECEPTIONIST',
      actorName,
      branchName,
      'VISIT_CREATED',
      `Created ${visitType} Visit #${visitId} for ${patient.full_name || patient.fullName}. Generated Barcodes: ${bloodBarcode}, ${serumBarcode}. Payment: ${isPaidNow ? 'PAID NOW' : 'PAY LATER'}.`
    );

    return newVisit;
  },

  // Assign Technician to Visit / Accept Home Collection
  assignTechnician: (visitId, techName = 'Anil Kumar (Tech)', actorRole = 'RECEPTIONIST') => {
    const visits = OperationsDataStore.getVisits();
    const vIdx = visits.findIndex((v) => v.visit_id === visitId);
    if (vIdx === -1) return false;

    visits[vIdx].assigned_technician = techName;
    visits[vIdx].status = 'TECHNICIAN_ASSIGNED';

    OperationsDataStore.saveVisits(visits);

    OperationsDataStore.logActivity(
      actorRole,
      techName,
      'Main Branch',
      'TECHNICIAN_ASSIGNED',
      `Assigned ${techName} to Visit #${visitId} (${visits[vIdx].patient_name}).`
    );

    return visits[vIdx];
  },

  // Mark Home Collection Visit / Patient Arrival as "VISITED"
  markVisited: (visitId, techName = 'Anil Kumar (Tech)') => {
    const visits = OperationsDataStore.getVisits();
    const vIdx = visits.findIndex((v) => v.visit_id === visitId);
    if (vIdx === -1) return false;

    visits[vIdx].status = 'VISITED';
    OperationsDataStore.saveVisits(visits);

    OperationsDataStore.logActivity(
      'LAB_TECHNICIAN',
      techName,
      'Field / Phlebotomy Desk',
      'VISITED',
      `Marked Visit #${visitId} (${visits[vIdx].patient_name}) as VISITED.`
    );

    return visits[vIdx];
  },

  // Mark Sample Collected & Generate Sample Codes
  collectSampleAndGenerateCodes: (visitId, techName = 'Anil Kumar (Tech)', paymentCollected = false) => {
    const visits = OperationsDataStore.getVisits();
    const vIdx = visits.findIndex((v) => v.visit_id === visitId);
    if (vIdx === -1) return false;

    const visit = visits[vIdx];
    visit.status = 'SAMPLES_COLLECTED';

    if (paymentCollected) {
      visit.payment_status = 'PAID';
      visit.amount_paid = visit.total_amount;
    }

    OperationsDataStore.saveVisits(visits);
    OperationsDataStore.deductInventoryOnSampleCollection();

    OperationsDataStore.logActivity(
      'LAB_TECHNICIAN',
      techName,
      'Phlebotomy',
      'SAMPLE_COLLECTED',
      `Collected samples for Visit #${visitId}. ${paymentCollected ? 'Collected Pay Later amount.' : ''}`
    );

    return visit;
  },

  // Technician Enters Test Result Values & Submits for Pathologist/Owner Review
  submitTestResults: (visitId, parameters, techComments = '', techName = 'Anil Kumar (Tech)') => {
    const visits = OperationsDataStore.getVisits();
    const results = OperationsDataStore.getResults();

    const vIdx = visits.findIndex((v) => v.visit_id === visitId);
    if (vIdx === -1) return false;

    visits[vIdx].status = 'RESULTS_ENTERED';
    visits[vIdx].technician_notes = techComments;

    results[visitId] = {
      visit_id: visitId,
      test_title: visits[vIdx].tests_summary,
      category: 'GENERAL_LAB',
      entered_by: techName,
      entered_at: new Date().toISOString(),
      status: 'SUBMITTED_FOR_APPROVAL',
      parameters,
      tech_comments: techComments,
      pathologist_comments: '',
    };

    OperationsDataStore.saveVisits(visits);
    OperationsDataStore.saveResults(results);
    OperationsDataStore.deductInventoryOnTesting();

    OperationsDataStore.logActivity(
      'LAB_TECHNICIAN',
      techName,
      'Analyzer Station',
      'RESULT_SUBMITTED',
      `Submitted ${parameters.length} test parameter values for Visit #${visitId} for Owner/Pathologist review.`
    );

    return results[visitId];
  },

  // Pathologist / Owner Approves Test Report
  approveReport: (visitId, pathologistNotes = '', reviewerName = 'Dr. Sunita Rao (Pathologist / Owner)') => {
    const visits = OperationsDataStore.getVisits();
    const results = OperationsDataStore.getResults();

    const vIdx = visits.findIndex((v) => v.visit_id === visitId);
    if (vIdx === -1) return false;

    visits[vIdx].status = 'APPROVED';
    visits[vIdx].pathologist_notes = pathologistNotes;

    if (results[visitId]) {
      results[visitId].status = 'APPROVED';
      results[visitId].pathologist_comments = pathologistNotes;
      results[visitId].approved_by = reviewerName;
      results[visitId].approved_at = new Date().toISOString();
    }

    OperationsDataStore.saveVisits(visits);
    OperationsDataStore.saveResults(results);

    OperationsDataStore.logActivity(
      'PATHOLOGIST',
      reviewerName,
      'Review Desk',
      'REPORT_APPROVED',
      `Approved and digitally signed Official Letterhead Report for Visit #${visitId} (${visits[vIdx].patient_name}).`
    );

    return visits[vIdx];
  },

  // Pathologist / Owner Rejects Entered Values -> Redirects to Technician for Re-entry
  rejectReport: (visitId, rejectionNotes = '', reviewerName = 'Dr. Sunita Rao (Pathologist / Owner)') => {
    const visits = OperationsDataStore.getVisits();
    const results = OperationsDataStore.getResults();

    const vIdx = visits.findIndex((v) => v.visit_id === visitId);
    if (vIdx === -1) return false;

    visits[vIdx].status = 'REJECTED';
    visits[vIdx].pathologist_notes = rejectionNotes;

    if (results[visitId]) {
      results[visitId].status = 'REJECTED';
      results[visitId].pathologist_comments = rejectionNotes;
    }

    OperationsDataStore.saveVisits(visits);
    OperationsDataStore.saveResults(results);

    OperationsDataStore.logActivity(
      'PATHOLOGIST',
      reviewerName,
      'Review Desk',
      'REPORT_REJECTED',
      `Rejected test parameter values for Visit #${visitId}. Redirected to Technician for re-entry. Reason: ${rejectionNotes}`
    );

    return visits[vIdx];
  },
};

export default OperationsDataStore;
