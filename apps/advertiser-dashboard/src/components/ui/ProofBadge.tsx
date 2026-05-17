/**
 * ProofBadge — the universal "ZK verified" indicator.
 * Appears on every component that is proof-backed.
 * DRY: defined once, used in campaign cards, analytics, auction results.
 */
import { type FC } from 'react';

interface ProofBadgeProps {
  /** Number of proofs, or just show "ZK ✓" */
  proofCount?: number;
  size?: 'sm' | 'md';
}

export const ProofBadge: FC<ProofBadgeProps> = ({ proofCount, size = 'sm' }) => (
  <div className={`flex items-center gap-1.5 text-[var(--color-proof)] ${size === 'sm' ? 'text-[10px]' : 'text-xs'}`}>
    <div className="w-1 h-1 rounded-full bg-[var(--color-proof)] animate-pulse" />
    <span className="font-mono font-semibold">
      {proofCount !== undefined ? `${proofCount.toLocaleString()} proofs` : 'ZK ✓'}
    </span>
  </div>
);
