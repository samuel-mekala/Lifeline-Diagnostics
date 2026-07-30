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
};

export { getErrorMessage };
export default portalAPI;
