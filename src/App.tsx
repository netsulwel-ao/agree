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
import AdminUsers from './components/AdminUsers';
import AdminPayments from './components/AdminPayments';
import AdminSettings from './components/AdminSettings';
import Checkout from './components/Checkout';
import Upgrade from './components/Upgrade';
import { GlobalLoadingProvider, useGlobalLoading } from './contexts/GlobalLoadingContext';
import { useAuth } from './contexts/AuthContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <LoadingScreen message="A validar acesso..." />;
  if (!user) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
};

function AppRoutes() {
  const { user, isLoading } = useAuth();
  const { isLoading: globalLoading, loadingMessage } = useGlobalLoading();

  if (isLoading || globalLoading) {
    return <LoadingScreen message={loadingMessage || "A carregar..."} />;
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <AuthenticationScreen />} />
      
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
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/upgrade" element={<Upgrade />} />
      </Route>
      
      {/* Signature capture via QR scan — standalone, no layout */}
      <Route path="/capture-signature/:sessionId" element={<CaptureSignature />} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}
