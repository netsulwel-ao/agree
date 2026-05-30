import React, { createContext, useContext, useState, useCallback } from 'react';

type PlanOption = 'pro' | 'enterprise';

interface CheckoutModalContextType {
  open: boolean;
  preselectedPlan: PlanOption;
  openCheckout: (plan?: PlanOption) => void;
  closeCheckout: () => void;
}

const CheckoutModalContext = createContext<CheckoutModalContextType>({
  open: false,
  preselectedPlan: 'pro',
  openCheckout: () => {},
  closeCheckout: () => {},
});

export const useCheckoutModal = () => useContext(CheckoutModalContext);

export function CheckoutModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [preselectedPlan, setPreselectedPlan] = useState<PlanOption>('pro');

  const openCheckout = useCallback((plan?: PlanOption) => {
    if (plan) setPreselectedPlan(plan);
    setOpen(true);
  }, []);

  const closeCheckout = useCallback(() => setOpen(false), []);

  return (
    <CheckoutModalContext.Provider value={{ open, preselectedPlan, openCheckout, closeCheckout }}>
      {children}
    </CheckoutModalContext.Provider>
  );
}
