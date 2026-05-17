import Link from 'next/link';
import { campaignsApi } from '@/lib/api/campaigns.api';
import type { CampaignResponseDto } from '@admidnight/shared';

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { id: campaignId } = await params;
  let campaign: CampaignResponseDto | null = null;
  let analytics: { impressions: number; estimatedCtr: number; totalSpend: string } | null = null;
  let error: string | null = null;

  try {
    // Fetch campaign details
    const campaigns = await campaignsApi.list();
    campaign = campaigns.find(c => c.id === campaignId) || null;
    
    if (!campaign) {
      error = 'Campaign not found';
    } else {
      // Fetch analytics
      analytics = await campaignsApi.getAnalytics(campaignId);
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load campaign';
  }

  if (error || !campaign) {
    return (
      <main className="min-h-screen bg-[var(--color-midnight)] px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <Link href="/campaigns" className="mb-8 inline-block text-gray-400 hover:text-white">
            ← Back to Campaigns
          </Link>
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {error || 'Campaign not found'}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-midnight)] px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <Link href="/campaigns" className="mb-8 inline-block text-gray-400 hover:text-white">
          ← Back to Campaigns
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">{campaign.title}</h1>
          <p className="mt-2 text-gray-400">{campaign.description}</p>
        </div>

        {/* Campaign Overview */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/10 bg-black/30 p-6">
            <div className="text-sm text-gray-400">Status</div>
            <div className="mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                backgroundColor: campaign.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                color: campaign.status === 'ACTIVE' ? '#86efac' : '#d1d5db'
              }}
            >
              {campaign.status}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-6">
            <div className="text-sm text-gray-400">Budget</div>
            <div className="mt-2 text-xl font-bold">{campaign.budgetMidnight} MIDNIGHT</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-6">
            <div className="text-sm text-gray-400">CPM Bid</div>
            <div className="mt-2 text-xl font-bold">{campaign.cpmBidMidnight} MIDNIGHT</div>
          </div>
        </div>

        {/* Analytics */}
        {analytics && (
          <div className="mb-8 rounded-xl border border-white/10 bg-black/30 p-6">
            <h2 className="mb-6 text-xl font-bold">Campaign Analytics</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-400">Impressions</div>
                <div className="mt-2 text-2xl font-bold">{analytics.impressions.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Estimated CTR</div>
                <div className="mt-2 text-2xl font-bold">{(analytics.estimatedCtr * 100).toFixed(2)}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Total Spend</div>
                <div className="mt-2 text-2xl font-bold">{analytics.totalSpend} MIDNIGHT</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href={`/campaigns/${campaignId}/bid`}
            className="rounded-xl bg-[var(--color-accent)] px-6 py-3 font-semibold text-[var(--color-midnight)] transition-colors hover:bg-[var(--color-accent-dim)]"
          >
            Place Sealed Bid
          </Link>
          <Link
            href={`/campaigns/${campaignId}/reveal`}
            className="rounded-xl border border-white/20 px-6 py-3 font-semibold transition-colors hover:border-white/40"
          >
            Reveal Bid
          </Link>
        </div>
      </div>
    </main>
  );
}
