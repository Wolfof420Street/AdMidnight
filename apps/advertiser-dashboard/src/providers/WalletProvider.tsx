'use client';

import {
  createContext, useContext, useState, useCallback,
  type ReactNode, type FC,
} from 'react';
import {
  connectLaceWallet,
  INITIAL_WALLET_STATE,
  type WalletState,
} from '@/lib/wallet/lace-connector';

interface WalletContextValue {
  wallet: WalletState;
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnecting: boolean;
  error: string | null;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export const WalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletState>(INITIAL_WALLET_STATE);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    const state = await connectLaceWallet();
    setWallet(state);
    if (state.status === 'error') {
      setError(state.error);
    }
    setIsConnecting(false);
  }, []);

  const disconnect = useCallback(() => {
    setWallet(INITIAL_WALLET_STATE);
    setError(null);
  }, []);

  return (
    <WalletContext.Provider value={{ wallet, connect, disconnect, isConnecting, error }}>
      {children}
    </WalletContext.Provider>
  );
};

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider');
  return ctx;
}
