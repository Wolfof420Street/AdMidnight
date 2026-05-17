/**
 * LoadingSkeleton — DRY loading state. Replaces all inline shimmer divs.
 */
import { type FC } from 'react';
import { clsx } from 'clsx';

interface LoadingSkeletonProps {
  rows?: number;
  className?: string;
  variant?: 'card' | 'line' | 'stat';
}

export const LoadingSkeleton: FC<LoadingSkeletonProps> = ({
  rows = 1,
  className,
  variant = 'card',
}) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className={clsx(
          'shimmer bg-[var(--color-midnight-card)]',
          variant === 'card' && 'h-64 rounded-2xl',
          variant === 'stat' && 'h-24 rounded-xl',
          variant === 'line' && 'h-4 rounded-full w-full',
          className,
        )}
      />
    ))}
  </>
);
