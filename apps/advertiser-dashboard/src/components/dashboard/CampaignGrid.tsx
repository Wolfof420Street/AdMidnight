'use client';

import { useMemo } from 'react';
import { useCampaigns } from '@/features/campaigns/hooks/use-campaigns';
import type { CampaignResponseDto } from '@admidnight/shared';

type CampaignCardViewModel = {
  id: string;
  name: string;
  status: 'ACTIVE' | 'DRAFT' | 'COMPLETED' | 'PAUSED' | 'SETTLED';
  budget: string;
  segments: string[];
  similarityThreshold: number;
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-400/10 text-green-400 border-green-400/30',
  DRAFT: 'bg-gray-400/10 text-gray-400 border-gray-400/30',
  COMPLETED: 'bg-blue-400/10 text-blue-400 border-blue-400/30',
};

export function CampaignGrid(): JSX.Element {
  const { campaigns, isLoading, error } = useCampaigns();

  const content = useMemo(() => {
    if (isLoading) return <div className="p-6 text-sm text-gray-400">Loading campaigns…</div>;
    if (error)
      return (
        <div className="p-6 text-sm text-red-400">Could not load campaigns: {error}</div>
      );
    if (!campaigns || campaigns.length === 0)
      return <div className="p-6 text-sm text-gray-500">No active campaigns found.</div>;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) => (
          <CampaignCard
            key={campaign.id}
            campaign={toCardViewModel(campaign)}
          />
        ))}
      </div>
    );
  }, [campaigns, isLoading, error]);

  return <>{content}</>;
}

function CampaignCard({ campaign }: { campaign: CampaignCardViewModel }): JSX.Element {
  return (
    <article className="bg-[var(--color-midnight-card)] rounded-2xl p-6 border border-white/5 hover:border-[var(--color-accent)]/30 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm text-white/90 group-hover:text-white transition-colors">
            {campaign.name}
          </h3>
          <span className="text-xs font-mono text-gray-600">{campaign.id}</span>
        </div>
        <span
          className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${STATUS_STYLES[campaign.status]}`}
        >
          {campaign.status}
        </span>
      </div>

      <div className="mb-4">
        {campaign.segments.map((segment) => (
          <span
            key={segment}
            className="mr-1 text-xs px-2 py-1 rounded bg-[var(--color-proof)]/10 text-[var(--color-proof)] font-mono"
          >
            {segment}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
            ZK Threshold
          </div>
          <div className="text-lg font-bold data-value text-white">
            {campaign.similarityThreshold}
          </div>
        </div>
        <div className="col-span-2">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Budget</div>
          <div className="text-sm font-semibold data-value text-gray-300">{campaign.budget}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[10px] text-gray-600 border-t border-white/5 pt-4">
        <span>0 bytes of user data ingested</span>
        <span className="ml-auto text-[var(--color-proof)] font-mono">ZK verified</span>
      </div>
    </article>
  );
}

function toCardViewModel(campaign: CampaignResponseDto): CampaignCardViewModel {
  return {
    id: campaign.id,
    name: campaign.creative.title,
    status: campaign.status as CampaignCardViewModel['status'],
    budget: campaign.budgetMidnight,
    segments: campaign.segment.targetCategories,
    similarityThreshold: campaign.segment.similarityThreshold,
  };
}
