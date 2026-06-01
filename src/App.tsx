import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ContractList from './components/ContractList';
import ContractForm from './components/ContractForm';
import ContractDetail from './components/ContractDetail';
import Analytics from './components/Analytics';
import Compliance from './components/Compliance';
import LandingPage from './components/LandingPage';
import AuthenticationScreen from './components/AuthenticationScreen';
import LoadingScreen from './components/LoadingScreen';
import RegisterSignature from './components/RegisterSignature';
import SignatureList from './components/SignatureList';
import CaptureSignature from './components/CaptureSignature';
import EmailConfirmed from './components/EmailConfirmed';
import AdminUsers from './components/AdminUsers';
import AdminPayments from './components/AdminPayments';
import AdminSettings from './components/AdminSettings';
import AdminPlanHistory from './components/AdminPlanHistory';
import ProfileSettings from './components/ProfileSettings';
import ResetPassword from './components/ResetPassword';
import ClientList from './components/ClientList';
import ClientForm from './components/ClientForm';
import ClientDetail from './components/ClientDetail';
import MyTemplates from './components/MyTemplates';
import ApprovalWorkflowConfig from './components/ApprovalWorkflowConfig';
import ApprovalRequestList from './components/ApprovalRequestList';
import ApprovalDetail from './components/ApprovalDetail';
import InvoiceList from './components/InvoiceList';
import InvoiceForm from './components/InvoiceForm';
import InvoiceDetail from './components/InvoiceDetail';
import AuditLogList from './components/AuditLogList';
import SignatureWebhook from './components/SignatureWebhook';
import NotificationsPage from './components/NotificationsPage';

import { GlobalLoadingProvider, useGlobalLoading } from './contexts/GlobalLoadingContext';
import { useAuth } from './contexts/AuthContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <LoadingScreen message="A validar acesso..." />;
  if (!user) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
};

function RedirectIfAuthenticated({ children, fallback }: { children: React.ReactNode; fallback?: string }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen message="A carregar..." />;
  if (user) {
    const pending = sessionStorage.getItem('redirectAfterLogin');
    if (pending) {
      sessionStorage.removeItem('redirectAfterLogin');
      return <Navigate to={pending} replace />;
    }
    return <Navigate to={fallback || '/dashboard'} replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { user, isLoading } = useAuth();
  const { isLoading: globalLoading, loadingMessage } = useGlobalLoading();

  if (isLoading || globalLoading) {
    return <LoadingScreen message={loadingMessage || "A carregar..."} />;
  }

  return (
    <Routes>
      <Route path="/" element={<RedirectIfAuthenticated><LandingPage /></RedirectIfAuthenticated>} />
      <Route path="/login" element={<RedirectIfAuthenticated fallback="/dashboard"><AuthenticationScreen /></RedirectIfAuthenticated>} />
      
      {/* Protected Routes wrapped in Layout */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/contracts" element={<ContractList />} />
        <Route path="/contracts/new" element={<ContractForm />} />
        <Route path="/contracts/:id/edit" element={<ContractForm />} />
        <Route path="/contracts/:id" element={<ContractDetail />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/compliance" element={<Compliance />} />
        <Route path="/signatures" element={<SignatureList />} />
        <Route path="/signatures/register" element={<RegisterSignature />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/payments" element={<AdminPayments />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/plan-history" element={<AdminPlanHistory />} />
        <Route path="/clients" element={<ClientList />} />
        <Route path="/clients/new" element={<ClientForm />} />
        <Route path="/clients/:id/edit" element={<ClientForm />} />
        <Route path="/clients/:id" element={<ClientDetail />} />
        <Route path="/templates" element={<MyTemplates />} />
        <Route path="/invoices" element={<InvoiceList />} />
        <Route path="/invoices/new" element={<InvoiceForm />} />
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
        <Route path="/invoices/:id/edit" element={<InvoiceForm />} />
        <Route path="/approvals" element={<ApprovalRequestList />} />
        <Route path="/approvals/:id" element={<ApprovalDetail />} />
        <Route path="/admin/approval-workflows" element={<ApprovalWorkflowConfig />} />
        <Route path="/admin/audit-logs" element={<AuditLogList />} />
        <Route path="/profile" element={<ProfileSettings />} />
        <Route path="/notifications" element={<NotificationsPage />} />

      </Route>
      
      {/* Signature capture via QR scan — standalone, no layout */}
      <Route path="/capture-signature/:sessionId" element={<CaptureSignature />} />
      
      {/* Email confirmation / recovery — standalone */}
      <Route path="/confirmado" element={<EmailConfirmed />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Signature provider webhook endpoint */}
      <Route path="/signature-webhook" element={<SignatureWebhook />} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}
