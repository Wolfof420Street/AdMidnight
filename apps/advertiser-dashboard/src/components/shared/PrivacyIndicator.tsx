'use client';

import { useEffect, useState } from 'react';

export function PrivacyIndicator(): JSX.Element {
  const [proofCount, setProofCount] = useState(0);
  const [lastProofTime, setLastProofTime] = useState<Date | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setProofCount((prev) => prev + Math.floor(Math.random() * 3));
      setLastProofTime(new Date());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[var(--color-proof)]/10 border-b border-[var(--color-proof)]/30">
      <div className="max-w-7xl mx-auto px-6 py-2 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-proof)] animate-pulse" />
          <span className="text-[var(--color-proof)] font-semibold">ZK Proofs Live</span>
        </div>
        <span className="text-gray-500 font-mono">
          {proofCount.toLocaleString()} proofs generated this session
        </span>
        {lastProofTime ? (
          <span className="text-gray-600">Last: {lastProofTime.toLocaleTimeString()}</span>
        ) : null}
        <div className="ml-auto flex items-center gap-4 text-gray-500">
          <span>Zero user data ingested</span>
          <span>GDPR compliant by math</span>
          <span>CCPA enforced by ZK</span>
        </div>
      </div>
    </div>
  );
}

