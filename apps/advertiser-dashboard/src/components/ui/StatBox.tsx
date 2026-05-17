/**
 * StatBox — metric display. DRY: replaces 4 identical stat card patterns.
 */
import { type FC } from 'react';

interface StatBoxProps {
  label: string;
  value: string;
  subtitle?: string;
  color?: string;
}

export const StatBox: FC<StatBoxProps> = ({
  label,
  value,
  subtitle,
  color = 'var(--color-accent)',
}) => (
  <div className="bg-[var(--color-midnight-card)] rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-colors">
    <div className="text-xs text-gray-500 mb-2">{label}</div>
    <div className="text-2xl font-bold data-value" style={{ color }}>{value}</div>
    {subtitle && <div className="text-xs text-gray-600 mt-1">{subtitle}</div>}
  </div>
);
