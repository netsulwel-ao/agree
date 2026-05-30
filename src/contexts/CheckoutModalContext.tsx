import React, { createContext, useContext, useState, useCallback } from 'react';

type PlanOption = 'pro' | 'enterprise';
type ModalMode = 'upgrade' | 'renewal';

interface CheckoutModalContextType {
  open: boolean;
  preselectedPlan: PlanOption;
  mode: ModalMode;
  openCheckout: (plan?: PlanOption) => void;
  openRenewal: (plan?: PlanOption) => void;
  closeCheckout: () => void;
}

const CheckoutModalContext = createContext<CheckoutModalContextType>({
  open: false,
  preselectedPlan: 'pro',
  mode: 'upgrade',
  openCheckout: () => {},
  openRenewal: () => {},
  closeCheckout: () => {},
});

export const useCheckoutModal = () => useContext(CheckoutModalContext);

export function CheckoutModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [preselectedPlan, setPreselectedPlan] = useState<PlanOption>('pro');
  const [mode, setMode] = useState<ModalMode>('upgrade');

  const openCheckout = useCallback((plan?: PlanOption) => {
    if (plan) setPreselectedPlan(plan);
    setMode('upgrade');
    setOpen(true);
  }, []);

  const openRenewal = useCallback((plan?: PlanOption) => {
    if (plan) setPreselectedPlan(plan);
    setMode('renewal');
    setOpen(true);
  }, []);

  const closeCheckout = useCallback(() => setOpen(false), []);

  return (
    <CheckoutModalContext.Provider value={{ open, preselectedPlan, mode, openCheckout, openRenewal, closeCheckout }}>
      {children}
    </CheckoutModalContext.Provider>
  );
}
