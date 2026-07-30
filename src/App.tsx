import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider, { useAuth } from './providers/AuthProvider';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import PortalLayout from './layouts/PortalLayout';
import { Activity, ShieldCheck, HeartPulse, Sparkles, CheckCircle2, TestTube, Users, FileText, ClipboardList } from 'lucide-react';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-semibold text-slate-700">Restoring LIMS Session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect patients to patient portal, staff to operations dashboard
    if (user.role === 'PATIENT') return <Navigate to="/portal/dashboard" replace />;
    return <Navigate to="/operations/dashboard" replace />;
  }

  return children;
};

import PatientDashboardPage from './features/portal/pages/PatientDashboardPage';
import LandingPage from './features/public/pages/LandingPage';
import BookAppointmentPage from './features/portal/pages/BookAppointmentPage';
import TestCatalogPage from './features/portal/pages/TestCatalogPage';
import MyReportsPage from './features/portal/pages/MyReportsPage';
import MyInvoicesPage from './features/portal/pages/MyInvoicesPage';
import PatientSupportPage from './features/portal/pages/PatientSupportPage';
import MyAppointmentsPage from './features/portal/pages/MyAppointmentsPage';
import PatientProfilePage from './features/portal/pages/PatientProfilePage';

// Operations Pages for Task 3 & Task 4
import OperationsDashboardPage from './features/dashboard/pages/OperationsDashboardPage';
import OnlineBookingsPage from './features/operations/pages/OnlineBookingsPage';
import WalkInRegistrationPage from './features/operations/pages/WalkInRegistrationPage';
import PatientDirectoryPage from './features/operations/pages/PatientDirectoryPage';
import LabVisitsBillingPage from './features/operations/pages/LabVisitsBillingPage';
import AllInvoicesPage from './features/operations/pages/AllInvoicesPage';
import AllReportsPage from './features/operations/pages/AllReportsPage';
import ReceptionDeskPage from './features/operations/pages/ReceptionDeskPage';
import TechnicianWorkstationPage from './features/operations/pages/TechnicianWorkstationPage';
import PathologistApprovalPage from './features/operations/pages/PathologistApprovalPage';
import BranchManagementPage from './features/admin/pages/BranchManagementPage';
import InventoryPage from './features/inventory/pages/InventoryPage';
import FinancialAnalyticsPage from './features/analytics/pages/FinancialAnalyticsPage';
import EmployeeWorkAnalysisPage from './features/analytics/pages/EmployeeWorkAnalysisPage';
import SystemAuditLogsPage from './features/admin/pages/SystemAuditLogsPage';

// Generic Placeholder for sub-routes
const SubRoutePlaceholder = ({ title }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
    <p className="text-xs text-slate-500 mt-1">
      This module workspace is initialized and ready for Task execution.
    </p>
  </div>
);

import ErrorBoundary from './components/common/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
        <Routes>
          {/* Public Landing & Authentication Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Patient Portal Routes */}
          <Route
            path="/portal"
            element={
              <ProtectedRoute allowedRoles={['PATIENT']}>
                <PortalLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<PatientDashboardPage />} />
            <Route path="appointments" element={<MyAppointmentsPage />} />
            <Route path="appointments/book" element={<BookAppointmentPage />} />
            <Route path="tests" element={<TestCatalogPage />} />
            <Route path="reports" element={<MyReportsPage />} />
            <Route path="invoices" element={<MyInvoicesPage />} />
            <Route path="support" element={<PatientSupportPage />} />
            <Route path="profile" element={<PatientProfilePage />} />
            <Route path="" element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Operations & Staff Portal Routes */}
          <Route
            path="/operations"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'RECEPTIONIST',
                  'LAB_TECHNICIAN',
                  'PATHOLOGIST',
                  'BRANCH_MANAGER',
                  'ADMIN',
                  'OWNER',
                ]}
              >
                <PortalLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<OperationsDashboardPage />} />
            <Route path="online-bookings" element={<OnlineBookingsPage />} />
            <Route path="walkin-registration" element={<WalkInRegistrationPage />} />
            <Route path="patients" element={<PatientDirectoryPage />} />
            <Route path="visits" element={<LabVisitsBillingPage />} />
            <Route path="all-invoices" element={<AllInvoicesPage />} />
            <Route path="all-reports" element={<AllReportsPage />} />
            <Route path="reception" element={<ReceptionDeskPage />} />
            <Route path="samples" element={<TechnicianWorkstationPage mode="samples" />} />
            <Route path="results" element={<TechnicianWorkstationPage mode="results" />} />
            <Route path="workstation" element={<Navigate to="samples" replace />} />
            <Route path="approvals" element={<PathologistApprovalPage mode="approvals" />} />
            <Route path="approval" element={<Navigate to="approvals" replace />} />
            <Route path="branches" element={<BranchManagementPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="staff" element={<BranchManagementPage />} />
            <Route path="analytics" element={<FinancialAnalyticsPage />} />
            <Route path="employee-analysis" element={<EmployeeWorkAnalysisPage />} />
            <Route path="audit-logs" element={<SystemAuditLogsPage />} />
            <Route path="" element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
