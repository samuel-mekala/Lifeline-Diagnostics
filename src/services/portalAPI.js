/**
 * Patient Portal API Service
 * All calls go to the real Django REST backend at /api/portal/
 * No localStorage. Real database reads/writes.
 */
import api, { getErrorMessage } from './api';

const portalAPI = {

  // ── Profile ─────────────────────────────────────────────────────────
  getProfile: async () => {
    const { data } = await api.get('/api/portal/profile/');
    return data;
  },

  // ── Addresses ────────────────────────────────────────────────────────
  getAddresses: async () => {
    const { data } = await api.get('/api/portal/addresses/');
    return data;
  },

  addAddress: async ({ label, address, is_default = false }) => {
    const { data } = await api.post('/api/portal/addresses/', { label, address, is_default });
    return data;
  },

  // ── Appointments ─────────────────────────────────────────────────────
  getAppointments: async () => {
    const { data } = await api.get('/api/portal/appointments/');
    return data;
  },

  /**
   * Book a new appointment.
   * @param {Object} params
   * @param {string} params.collection_type - "HOME" or "LAB"
   * @param {string} params.scheduled_for   - ISO datetime string
   * @param {string} params.payment_preference - "PAY_NOW" or "PAY_LATER"
   * @param {string[]} params.test_ids      - array of test_id strings
   * @param {string[]} params.package_ids   - array of package_id strings
   * @param {string}  [params.address_id]   - UUID of existing saved address (HOME only)
   * @param {string}  [params.new_address]  - free-text new address (HOME only)
   * @param {string}  [params.new_address_label] - label for new address
   * @param {string}  [params.remarks]
   */
  bookAppointment: async (params) => {
    const { data } = await api.post('/api/portal/book/', params);
    return data;
  },

  // ── Invoices ─────────────────────────────────────────────────────────
  getInvoices: async () => {
    const { data } = await api.get('/api/portal/invoices/');
    return data;
  },

  payInvoice: async (invoiceId, paymentMethod = 'UPI') => {
    const { data } = await api.post(`/api/portal/invoices/${invoiceId}/pay/`, {
      payment_method: paymentMethod,
    });
    return data;
  },


  // ── Reports ──────────────────────────────────────────────────────────
  getReports: async () => {
    const { data } = await api.get('/api/portal/reports/');
    return data;
  },

  // ── Catalog ──────────────────────────────────────────────────────────
  getTestCatalog: async () => {
    const { data } = await api.get('/api/portal/catalog/tests/');
    return data;
  },

  getPackageCatalog: async () => {
    const { data } = await api.get('/api/portal/catalog/packages/');
    return data;
  },

  // ── Staff Operations ──────────────────────────────────────────────────
  getStaffAppointments: async () => {
    const { data } = await api.get('/api/portal/staff-appointments/');
    return data;
  },

  getStaffPatients: async () => {
    const { data } = await api.get('/api/portal/staff-patients/');
    return data;
  },

  updateStaffAppointment: async (appointmentId, updateFields) => {
    const { data } = await api.patch(`/api/portal/staff-appointments/${appointmentId}/update/`, updateFields);
    return data;
  },

  registerWalkInVisit: async (payload) => {
    const { data } = await api.post('/api/portal/staff-walkin-register/', payload);
    return data;
  },

  getStaffAllInvoices: async () => {
    const { data } = await api.get('/api/portal/staff-all-invoices/');
    return data;
  },

  getStaffAllReports: async () => {
    const { data } = await api.get('/api/portal/staff-all-reports/');
    return data;
  },

  // ── Staff Workflow Operations ──────────────────────────────────────────

  collectSample: async (appointmentId) => {
    const { data } = await api.post('/api/portal/staff-collect-sample/', {
      appointment_id: appointmentId,
    });
    return data;
  },

  markTested: async (appointmentId) => {
    const { data } = await api.post('/api/portal/staff-mark-tested/', {
      appointment_id: appointmentId,
    });
    return data;
  },

  getTestParameters: async (appointmentId) => {
    const { data } = await api.get(`/api/portal/staff-test-parameters/${appointmentId}/`);
    return data;
  },

  submitResults: async (appointmentId, results) => {
    const { data } = await api.post('/api/portal/staff-submit-results/', {
      appointment_id: appointmentId,
      results,
    });
    return data;
  },

  approveRejectResult: async (appointmentId, action, rejectionNotes = '') => {
    const { data } = await api.post('/api/portal/staff-approve-reject/', {
      appointment_id: appointmentId,
      action,
      rejection_notes: rejectionNotes,
    });
    return data;
  },

  collectPayment: async (appointmentId, paymentMethod = 'CASH') => {
    const { data } = await api.post('/api/portal/staff-collect-payment/', {
      appointment_id: appointmentId,
      payment_method: paymentMethod,
    });
    return data;
  },

  getResultValues: async (appointmentId) => {
    const { data } = await api.get(`/api/portal/staff-result-values/${appointmentId}/`);
    return data;
  },

  downloadReportPdf: async (visitId, filename = 'diagnostic_report.pdf') => {
    const response = await api.get(`/reports/${visitId}/download/`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export { getErrorMessage };
export default portalAPI;
