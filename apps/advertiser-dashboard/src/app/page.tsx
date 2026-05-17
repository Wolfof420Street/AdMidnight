import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { StatBox } from '@/components/ui/StatBox';
import { CampaignGrid } from '@/features/campaigns/components/CampaignGrid';

const STATS = [
  { label: 'Total ZK Proofs', value: '14,823', subtitle: 'verified impressions', color: 'var(--color-proof)' },
  { label: 'Active Campaigns', value: '3', subtitle: 'across 2 segments', color: 'var(--color-accent)' },
  { label: 'Protocol Spend', value: '2,401 tMIDN', subtitle: '↑ 18%', color: '#10b981' },
  { label: 'Avg. Match Rate', value: '34.7%', subtitle: 'ZK-verified', color: '#f59e0b' },
];
export default function DashboardPage(): JSX.Element {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Stats — DRY: StatBox replaces 4 identical card patterns */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {STATS.map(s => <StatBox key={s.label} {...s} />)}
      </div>

      {/* Campaigns */}
      <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Your Campaigns</h2>
            <p className="text-gray-400 mt-1 text-sm">All targeting verified by zero-knowledge proofs.</p>
          </div>
          <a
            href="/campaign/new"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[var(--color-accent)]
                     text-[var(--color-midnight)] hover:bg-[var(--color-accent-dim)] transition-all accent-glow"
          >
            + New Campaign
          </a>
      </div>

      <ErrorBoundary>
        <Suspense fallback={<div className="grid grid-cols-3 gap-6"><LoadingSkeleton rows={6} /></div>}>
          <CampaignGrid />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
