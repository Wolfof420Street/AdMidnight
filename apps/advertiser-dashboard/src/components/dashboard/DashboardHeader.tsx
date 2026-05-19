'use client';

import Link from 'next/link';
import { useState } from 'react';

export function DashboardHeader(): JSX.Element {
  const [networkStatus] = useState<'connected' | 'syncing' | 'offline'>('connected');

  return (
    <header className="border-b border-white/10 bg-[var(--color-midnight)]/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
            <span className="text-[var(--color-midnight)] text-xs font-black">AM</span>
          </div>
          <span className="text-lg font-bold tracking-tight">AdMidnight</span>
          <span className="text-xs text-gray-500 font-mono ml-1">Protocol v1.0</span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-400">
          <Link href="/campaigns" className="hover:text-white transition-colors">
            Campaigns
          </Link>
          <Link href="/campaigns/new" className="hover:text-white transition-colors">
            New Campaign
          </Link>
          <Link href="/login" className="hover:text-white transition-colors">
            Sign In
          </Link>
          <Link href="/auction" className="hover:text-white transition-colors">
            Auctions
          </Link>
          <Link href="/analytics" className="hover:text-white transition-colors">
            Analytics
          </Link>
        </nav>

        <div className="flex items-center gap-2 text-xs">
          <div
            className={`w-2 h-2 rounded-full ${
              networkStatus === 'connected'
                ? 'bg-green-400 animate-pulse'
                : networkStatus === 'syncing'
                  ? 'bg-yellow-400 animate-pulse'
                  : 'bg-red-400'
            }`}
          />
          <span className="text-gray-400 font-mono">
            Midnight {networkStatus === 'connected' ? 'Mainnet' : networkStatus}
          </span>
        </div>
      </div>
    </header>
  );
}

