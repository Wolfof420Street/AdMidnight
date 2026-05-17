/**
 * Badge — status indicator. DRY: replaces duplicated badge patterns.
 */
import { type FC } from 'react';
import { clsx } from 'clsx';

type BadgeVariant = 'active' | 'draft' | 'completed' | 'proof' | 'warning';

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  active:    'bg-green-400/10 text-green-400 border-green-400/30',
  draft:     'bg-gray-400/10 text-gray-400 border-gray-400/30',
  completed: 'bg-blue-400/10 text-blue-400 border-blue-400/30',
  proof:     'bg-[var(--color-proof)]/10 text-[var(--color-proof)] border-[var(--color-proof)]/30',
  warning:   'bg-yellow-400/10 text-yellow-400 border-yellow-400/30',
};

interface BadgeProps {
  variant: BadgeVariant;
  label: string;
  className?: string;
}

export const Badge: FC<BadgeProps> = ({ variant, label, className }) => (
  <span
    className={clsx(
      'text-[10px] font-semibold px-2 py-1 rounded-full border',
      VARIANT_STYLES[variant],
      className,
    )}
  >
    {label}
  </span>
);
