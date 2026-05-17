/**
 * CampaignGrid — pure display component.
 * SoC: fetching in useCampaigns hook; rendering here.
 * DRY: uses shared Card and Badge primitives.
 */
'use client';

import { useCampaigns } from '../hooks/use-campaigns';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProofBadge } from '@/components/ui/ProofBadge';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import type { CampaignResponseDto } from '@admidnight/shared';

const STATUS_TO_BADGE = {
  ACTIVE: 'active',
  DRAFT: 'draft',
  COMPLETED: 'completed',
  PAUSED: 'warning',
  SETTLED: 'completed',
} as const;

export function CampaignGrid() {
  const { campaigns, isLoading, error } = useCampaigns();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 text-gray-500">
        <div className="text-red-400 mb-2">Failed to load campaigns</div>
        <div className="text-xs font-mono">{error}</div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <div className="text-4xl mb-4">🎯</div>
        <div className="font-semibold">No campaigns yet</div>
        <div className="text-sm mt-2">Create your first privacy-preserving campaign above.</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {campaigns.map(c => <CampaignCard key={c.id} campaign={c} />)}
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: CampaignResponseDto }) {
  return (
    <Card hoverable>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm text-white/90">{campaign.creative.title}</h3>
          <span className="text-xs font-mono text-gray-600">{campaign.id.substring(0, 14)}...</span>
        </div>
        <Badge variant={STATUS_TO_BADGE[campaign.status as keyof typeof STATUS_TO_BADGE] ?? 'draft'} label={campaign.status} />
      </div>

      <div className="mb-4">
        {campaign.segment.targetCategories.map(cat => (
          <span key={cat} className="text-xs px-2 py-1 mr-1 rounded bg-[var(--color-proof)]/10 text-[var(--color-proof)] font-mono">
            {cat}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Budget</div>
          <div className="text-sm font-bold data-value">{campaign.budgetMidnight} tMIDN</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">ZK Threshold</div>
          <div className="text-sm font-bold data-value">{campaign.segment.similarityThreshold}</div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/5 pt-4">
        <span className="text-[10px] text-gray-600">🔒 0 bytes user data</span>
        <ProofBadge />
      </div>
    </Card>
  );
}
