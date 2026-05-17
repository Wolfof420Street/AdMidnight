/**
 * Card — base surface component. Used everywhere — defined once.
 * DRY: replaces all inline bg-[var(--color-midnight-card)] rounded-2xl border... patterns.
 */
import { type ReactNode, type FC } from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Accent border glow — for ZK proof related cards */
  proofGlow?: boolean;
  /** Hover accent border */
  hoverable?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

const paddingMap = { sm: 'p-4', md: 'p-6', lg: 'p-8' } as const;

export const Card: FC<CardProps> = ({
  children,
  className,
  proofGlow = false,
  hoverable = false,
  padding = 'md',
}) => (
  <div
    className={clsx(
      'bg-[var(--color-midnight-card)] rounded-2xl border',
      paddingMap[padding],
      proofGlow
        ? 'border-[var(--color-proof)]/30 proof-glow'
        : 'border-white/5',
      hoverable && 'hover:border-[var(--color-accent)]/30 transition-colors duration-300',
      className,
    )}
  >
    {children}
  </div>
);
