import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { GlobalLoadingProvider } from './contexts/GlobalLoadingContext';
import { CheckoutModalProvider } from './contexts/CheckoutModalContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initSentry } from './lib/sentry';
import App from './App.tsx';
import './index.css';

// Inicializar Sentry antes de qualquer render
initSentry();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Não repetir silenciosamente — deixar o ErrorBoundary apanhar
      retry: 1,
      staleTime: 30_000,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <GlobalLoadingProvider>
            <AuthProvider>
              <CheckoutModalProvider>
                <App />
              </CheckoutModalProvider>
            </AuthProvider>
          </GlobalLoadingProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
