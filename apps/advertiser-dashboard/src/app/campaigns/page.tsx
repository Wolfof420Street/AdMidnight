import Link from 'next/link';
import { campaignsApi } from '@/lib/api/campaigns.api';
import type { CampaignResponseDto } from '@admidnight/shared';

export default async function CampaignsPage() {
  let campaigns: CampaignResponseDto[] = [];
  let error: string | null = null;

  try {
    campaigns = await campaignsApi.list();
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load campaigns';
  }

  return (
    <main className="min-h-screen bg-[var(--color-midnight)] px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Campaigns</h1>
            <p className="mt-2 text-gray-400">Manage your advertising campaigns</p>
          </div>
          <Link
            href="/campaigns/new"
            className="rounded-xl bg-[var(--color-accent)] px-6 py-3 font-semibold text-[var(--color-midnight)] transition-colors hover:bg-[var(--color-accent-dim)]"
          >
            New Campaign
          </Link>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {error}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-black/30 p-8 text-center">
            <p className="text-gray-400">No campaigns yet</p>
            <Link
              href="/campaigns/new"
              className="mt-4 inline-block text-[var(--color-accent)] hover:underline"
            >
              Create your first campaign
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
            <table className="w-full">
              <thead className="border-b border-white/10 bg-black/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Title</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Budget</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Created</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-white/10 hover:bg-black/40">
                    <td className="px-6 py-4">
                      <span className="font-medium">{campaign.title}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                          campaign.status === 'ACTIVE'
                            ? 'bg-green-500/20 text-green-300'
                            : campaign.status === 'PAUSED'
                              ? 'bg-yellow-500/20 text-yellow-300'
                              : 'bg-gray-500/20 text-gray-300'
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{campaign.budgetMidnight} MIDNIGHT</td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/campaigns/${campaign.id}`}
                        className="text-[var(--color-accent)] hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
