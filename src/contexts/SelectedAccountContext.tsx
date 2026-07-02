import { createContext, useContext, useState, ReactNode } from "react";
import type { AdAccount } from "@/hooks/use-meta-connection";

type SelectedAccountContextType = {
  selectedAccount: AdAccount | null;
  setSelectedAccount: (account: AdAccount | null) => void;
};

const SelectedAccountContext = createContext<SelectedAccountContextType>({
  selectedAccount: null,
  setSelectedAccount: () => {},
});

export function SelectedAccountProvider({ children }: { children: ReactNode }) {
  const [selectedAccount, setSelectedAccount] = useState<AdAccount | null>(null);
  return (
    <SelectedAccountContext.Provider value={{ selectedAccount, setSelectedAccount }}>
      {children}
    </SelectedAccountContext.Provider>
  );
}

export function useSelectedAccount() {
  return useContext(SelectedAccountContext);
}
