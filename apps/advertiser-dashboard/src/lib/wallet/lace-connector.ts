'use client';

export type ConnectionStatus =
  | 'connected'
  | 'disconnected'
  | 'connecting'
  | 'error';

export interface WalletState {
  status: ConnectionStatus;
  address: string | null;
  balanceDust: bigint;
  networkId: string | null;
  error: string | null;
}

export const INITIAL_WALLET_STATE: WalletState = {
  status: 'disconnected',
  address: null,
  balanceDust: 0n,
  networkId: null,
  error: null,
};

interface ConnectedAPI {
  state: () => Promise<{
    unshieldedBalance: { available: bigint };
    coinPublicKey: string;
    networkId: string;
  }>;
  balanceTx: (tx: unknown, newCoins: bigint) => Promise<unknown>;
  submitTx: (tx: unknown) => Promise<{ txHash: string }>;
}

type MidnightWindow = Window & {
  midnight?: {
    mnLace?: {
      apiVersion: string;
      name: string;
      icon: string;
      enable: () => Promise<ConnectedAPI>;
      isEnabled: () => Promise<boolean>;
    };
  };
};

export function isLaceAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const currentWindow = window as MidnightWindow;
  return Boolean(currentWindow.midnight?.mnLace);
}

export async function connectLaceWallet(): Promise<WalletState> {
  if (!isLaceAvailable()) {
    return {
      ...INITIAL_WALLET_STATE,
      status: 'error',
      error:
        'Lace Midnight wallet not found. Install from: https://chromewebstore.google.com/detail/lace-midnight-preview/hgeekaiplokcnmakghbdfbgnlfheichg',
    };
  }

  try {
    const currentWindow = window as unknown as MidnightWindow & {
      midnight: {
        mnLace: {
          enable: () => Promise<ConnectedAPI>;
          isEnabled: () => Promise<boolean>;
        };
      };
    };

    const alreadyEnabled = await currentWindow.midnight.mnLace.isEnabled();
    const api = alreadyEnabled
      ? await currentWindow.midnight.mnLace.enable()
      : await currentWindow.midnight.mnLace.enable();
    const state = await api.state();

    return {
      status: 'connected',
      address: state.coinPublicKey,
      balanceDust: state.unshieldedBalance.available,
      networkId: state.networkId,
      error: null,
    };
  } catch (err) {
    return {
      ...INITIAL_WALLET_STATE,
      status: 'error',
      error: err instanceof Error ? err.message : 'Wallet connection failed',
    };
  }
}
