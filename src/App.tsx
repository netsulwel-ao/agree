import React, { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';

const Dashboard = lazy(() => import('./components/Dashboard'));
const ContractList = lazy(() => import('./components/ContractList'));
const ContractEntry = lazy(() => import('./components/ContractEntry'));
const ContractForm = lazy(() => import('./components/ContractForm'));
const ContractDetail = lazy(() => import('./components/ContractDetail'));
const Analytics = lazy(() => import('./components/Analytics'));
const Compliance = lazy(() => import('./components/Compliance'));
import LandingPage from './components/LandingPage';
const AuthenticationScreen = lazy(() => import('./components/AuthenticationScreen'));
const RegisterSignature = lazy(() => import('./components/RegisterSignature'));
const SignatureList = lazy(() => import('./components/SignatureList'));
const CaptureSignature = lazy(() => import('./components/CaptureSignature'));
const EmailConfirmed = lazy(() => import('./components/EmailConfirmed'));
const AdminUsers = lazy(() => import('./components/AdminUsers'));
const AdminPayments = lazy(() => import('./components/AdminPayments'));
const AdminSettings = lazy(() => import('./components/AdminSettings'));
const AdminPlanHistory = lazy(() => import('./components/AdminPlanHistory'));
const ProfileSettings = lazy(() => import('./components/ProfileSettings'));
const ResetPassword = lazy(() => import('./components/ResetPassword'));
const ClientList = lazy(() => import('./components/ClientList'));
const ClientForm = lazy(() => import('./components/ClientForm'));
const ClientDetail = lazy(() => import('./components/ClientDetail'));
const MyTemplates = lazy(() => import('./components/MyTemplates'));
const ApprovalWorkflowConfig = lazy(() => import('./components/ApprovalWorkflowConfig'));
const ApprovalRequestList = lazy(() => import('./components/ApprovalRequestList'));
const ApprovalDetail = lazy(() => import('./components/ApprovalDetail'));
const InvoiceList = lazy(() => import('./components/InvoiceList'));
const InvoiceForm = lazy(() => import('./components/InvoiceForm'));
const InvoiceDetail = lazy(() => import('./components/InvoiceDetail'));
const AuditLogList = lazy(() => import('./components/AuditLogList'));
const NotificationsPage = lazy(() => import('./components/NotificationsPage'));
const BillingPortal = lazy(() => import('./components/BillingPortal'));
const CompaniesPage = lazy(() => import('./pages/admin/CompaniesPage'));
const PermissionsPage = lazy(() => import('./pages/admin/PermissionsPage'));
const Termos = lazy(() => import('./components/Termos'));
const Privacidade = lazy(() => import('./components/Privacidade'));

import { useGlobalLoading } from './contexts/GlobalLoadingContext';
import { useAuth } from './contexts/AuthContext';
import { Toaster, toast } from 'sonner';

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingScreen message="A carregar..." />}>{children}</Suspense>;
}

// ─── Guards de rota ────────────────────────────────────

/** Requer utilizador autenticado. Redireciona para /login caso contrário. */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen message="A validar acesso..." />;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

/**
 * Requer role de administrador.
 * Se o utilizador estiver autenticado mas não for admin, redireciona para /dashboard.
 * Aguarda o perfil estar carregado (isLoading) antes de decidir — evita flash de redirect.
 */
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen message="A validar acesso..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

/**
 * Requer Super Admin.
 * Se o utilizador estiver autenticado mas não for Super Admin, redireciona para /dashboard.
 */
const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isSuperAdmin, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen message="A validar acesso..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

/** Redireciona utilizadores já autenticados para o dashboard (ou rota pendente). */
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

/**
 * Captura erros de auth vindos do Supabase no hash do URL
 * (ex.: `#error=access_denied&error_code=otp_expired&error_description=...`).
 * Mostra o erro num toast e limpa o URL.
 */
function AuthErrorHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.startsWith('#error')) return;

    const params = new URLSearchParams(hash.slice(1));
    const errorCode = params.get('error_code');
    const errorDescription = params.get('error_description');

    let message = errorDescription ? decodeURIComponent(errorDescription) : 'Falha na autenticação.';
    if (errorCode === 'otp_expired') {
      message = 'O link que usaste expirou ou já foi utilizado. Gera um novo.';
    } else if (errorCode === 'otp_disabled') {
      message = 'O email não está confirmado ou o login por link está desativado.';
    } else if (errorCode === 'invalid_credentials' || errorCode === 'email_not_confirmed') {
      message = 'Credenciais inválidas ou email ainda não confirmado.';
    }

    window.history.replaceState(null, '', window.location.pathname);
    toast.error(message, { duration: 6000 });
    navigate('/login', { replace: true });
  }, [navigate]);

  return null;
}

// ─── Rotas ────────────────────────────────────────────

function AppRoutes() {
  const { isLoading: globalLoading, loadingMessage } = useGlobalLoading();

  // Loading global apenas para operações específicas, não para carregar a app
  if (globalLoading) {
    return <LoadingScreen message={loadingMessage || 'A carregar...'} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Lazy><LandingPage /></Lazy>} />
      <Route path="/login" element={<RedirectIfAuthenticated fallback="/dashboard"><Lazy><AuthenticationScreen /></Lazy></RedirectIfAuthenticated>} />

      {/* Rotas protegidas (utilizador autenticado) dentro do Layout */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Lazy><Dashboard /></Lazy>} />
        <Route path="/contracts" element={<Lazy><ContractList /></Lazy>} />
        <Route path="/contracts/new" element={<Lazy><ContractEntry /></Lazy>} />
        <Route path="/contracts/:id/edit" element={<Lazy><ContractForm /></Lazy>} />
        <Route path="/contracts/:id" element={<Lazy><ContractDetail /></Lazy>} />
        <Route path="/analytics" element={<Lazy><Analytics /></Lazy>} />
        <Route path="/compliance" element={<Lazy><Compliance /></Lazy>} />
        <Route path="/signatures" element={<Lazy><SignatureList /></Lazy>} />
        <Route path="/signatures/register" element={<Lazy><RegisterSignature /></Lazy>} />
        <Route path="/clients" element={<Lazy><ClientList /></Lazy>} />
        <Route path="/clients/new" element={<Lazy><ClientForm /></Lazy>} />
        <Route path="/clients/:id/edit" element={<Lazy><ClientForm /></Lazy>} />
        <Route path="/clients/:id" element={<Lazy><ClientDetail /></Lazy>} />
        <Route path="/templates" element={<Lazy><MyTemplates /></Lazy>} />
        <Route path="/invoices" element={<Lazy><InvoiceList /></Lazy>} />
        <Route path="/invoices/new" element={<Lazy><InvoiceForm /></Lazy>} />
        <Route path="/invoices/:id" element={<Lazy><InvoiceDetail /></Lazy>} />
        <Route path="/invoices/:id/edit" element={<Lazy><InvoiceForm /></Lazy>} />
        <Route path="/approvals" element={<Lazy><ApprovalRequestList /></Lazy>} />
        <Route path="/approvals/:id" element={<Lazy><ApprovalDetail /></Lazy>} />
        <Route path="/profile" element={<Lazy><ProfileSettings /></Lazy>} />
        <Route path="/notifications" element={<Lazy><NotificationsPage /></Lazy>} />
        <Route path="/billing" element={<Lazy><BillingPortal /></Lazy>} />

        {/* Rotas de administração — requerem role=admin */}
        <Route path="/admin/users" element={<AdminRoute><Lazy><AdminUsers /></Lazy></AdminRoute>} />
        <Route path="/admin/payments" element={<AdminRoute><Lazy><AdminPayments /></Lazy></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><Lazy><AdminSettings /></Lazy></AdminRoute>} />
        <Route path="/admin/plan-history" element={<AdminRoute><Lazy><AdminPlanHistory /></Lazy></AdminRoute>} />
        <Route path="/admin/approval-workflows" element={<AdminRoute><Lazy><ApprovalWorkflowConfig /></Lazy></AdminRoute>} />
        <Route path="/admin/audit-logs" element={<AdminRoute><Lazy><AuditLogList /></Lazy></AdminRoute>} />

        {/* Rotas de Super Admin — requerem is_super_admin=true */}
        <Route path="/admin/companies" element={<SuperAdminRoute><Lazy><CompaniesPage /></Lazy></SuperAdminRoute>} />
        <Route path="/admin/permissions" element={<SuperAdminRoute><Lazy><PermissionsPage /></Lazy></SuperAdminRoute>} />
      </Route>

      {/* Captura de assinatura via QR — standalone, sem layout */}
      <Route path="/capture-signature/:sessionId" element={<Lazy><CaptureSignature /></Lazy>} />

      {/* Confirmação de email / recuperação de password — standalone */}
      <Route path="/confirmado" element={<Lazy><EmailConfirmed /></Lazy>} />
      <Route path="/reset-password" element={<Lazy><ResetPassword /></Lazy>} />
      <Route path="/termos" element={<Lazy><Termos /></Lazy>} />
      <Route path="/privacidade" element={<Lazy><Privacidade /></Lazy>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <>
      <AuthErrorHandler />
      <AppRoutes />
      <Toaster position="top-right" richColors />
    </>
  );
}
