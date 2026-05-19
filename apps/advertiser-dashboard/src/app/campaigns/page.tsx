import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { CampaignResponseDto } from '@admidnight/shared';
import { DashboardApiError, serverApiClient } from '@/lib/api-client';

type CampaignRow = {
  campaign: CampaignResponseDto;
  analytics: {
    impressions: number;
    estimatedCtr: number;
    totalSpend: string;
  };
};

function statusClasses(status: string): string {
  if (status === 'ACTIVE') {
    return 'bg-green-500/15 text-green-300';
  }
  if (status === 'PAUSED') {
    return 'bg-amber-500/15 text-amber-300';
  }
  return 'bg-slate-500/15 text-slate-300';
}

export default async function CampaignsPage() {
  const api = await serverApiClient();

  try {
    const campaigns = await api.listCampaigns();
    const rows = await Promise.all(
      campaigns.map(async (campaign): Promise<CampaignRow> => ({
        campaign,
        analytics: await api.getAnalytics(campaign.id),
      })),
    );

    return (
      <main className="min-h-screen bg-[var(--color-midnight)] px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Campaigns</h1>
              <p className="mt-2 text-sm text-gray-400">
                Live advertiser campaigns backed by the running API.
              </p>
            </div>
            <Link
              href="/campaigns/new"
              className="rounded-xl bg-[var(--color-accent)] px-5 py-3 font-semibold text-[var(--color-midnight)]"
            >
              New Campaign
            </Link>
          </div>

          {rows.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-10 text-center">
              <p className="text-lg font-semibold">No campaigns yet</p>
              <Link
                href="/campaigns/new"
                className="mt-3 inline-block text-sm text-[var(--color-accent)] hover:underline"
              >
                Create a campaign
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
              <table className="w-full text-left">
                <thead className="bg-black/40 text-sm text-gray-300">
                  <tr>
                    <th className="px-6 py-4">Campaign</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Impressions</th>
                    <th className="px-6 py-4">Spend</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ campaign, analytics }) => (
                    <tr key={campaign.id} className="border-t border-white/10 text-sm">
                      <td className="px-6 py-4">
                        <Link href={`/campaigns/${campaign.id}`} className="font-semibold hover:underline">
                          {campaign.creative.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">{analytics.impressions}</td>
                      <td className="px-6 py-4">{analytics.totalSpend}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    );
  } catch (error) {
    if (error instanceof DashboardApiError) {
      redirect('/login');
    }
    throw error;
  }
}
