import Link from 'next/link';
import { redirect } from 'next/navigation';
import { DashboardApiError, serverApiClient } from '@/lib/api-client';

type CampaignAnalyticsRow = {
  id: string;
  title: string;
  status: string;
  impressions: number;
  totalSpend: string;
  estimatedCtr: number;
};

function statusClasses(status: string): string {
  if (status === 'ACTIVE') {
    return 'bg-green-500/15 text-green-300 ring-1 ring-green-400/20';
  }
  if (status === 'PAUSED') {
    return 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/20';
  }
  return 'bg-slate-500/15 text-slate-300 ring-1 ring-slate-400/20';
}

function formatMidnight(value: string): string {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(parsed)} MID`;
  }

  return `${value} MID`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export default async function AnalyticsPage() {
  const api = await serverApiClient();

  try {
    const campaigns = await api.listCampaigns();

    if (campaigns.length === 0) {
      return (
        <main className="min-h-screen bg-[var(--color-midnight)] px-6 py-12">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-3xl border border-white/10 bg-black/30 p-10 text-center shadow-2xl shadow-black/20">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent)]/15 text-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/20">
                <span className="text-xl font-black">A</span>
              </div>
              <h1 className="mt-6 text-3xl font-bold tracking-tight">Analytics</h1>
              <p className="mt-3 text-sm text-gray-300">No campaign data yet.</p>
              <Link
                href="/campaigns/new"
                className="mt-6 inline-flex rounded-xl bg-[var(--color-accent)] px-5 py-3 font-semibold text-[var(--color-midnight)] transition-colors hover:bg-[var(--color-accent-dim)]"
              >
                Create a campaign
              </Link>
            </div>
          </div>
        </main>
      );
    }

    const rows = await Promise.all(
      campaigns.map(async (campaign): Promise<CampaignAnalyticsRow> => {
        const analytics = await api.getAnalytics(campaign.id);

        return {
          id: campaign.id,
          title: campaign.creative.title,
          status: campaign.status,
          impressions: analytics.impressions,
          totalSpend: analytics.totalSpend,
          estimatedCtr: analytics.estimatedCtr,
        };
      }),
    );

    const totals = rows.reduce(
      (accumulator, row) => {
        const spend = Number(row.totalSpend);

        return {
          impressions: accumulator.impressions + row.impressions,
          totalSpend: accumulator.totalSpend + (Number.isFinite(spend) ? spend : 0),
        };
      },
      { impressions: 0, totalSpend: 0 },
    );

    return (
      <main className="min-h-screen bg-[var(--color-midnight)] px-6 py-12">
        <div className="mx-auto max-w-7xl space-y-8">
          <section className="rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),_transparent_45%),rgba(0,0,0,0.35)] p-8 shadow-2xl shadow-black/20">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-accent)]">Live reporting</p>
                <h1 className="mt-3 text-4xl font-black tracking-tight">Analytics</h1>
                <p className="mt-3 max-w-2xl text-sm text-gray-300">
                  Performance data is pulled directly from the advertiser API for every campaign.
                </p>
              </div>
              <Link
                href="/campaigns/new"
                className="inline-flex rounded-xl bg-[var(--color-accent)] px-5 py-3 font-semibold text-[var(--color-midnight)] transition-colors hover:bg-[var(--color-accent-dim)]"
              >
                New Campaign
              </Link>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <div className="text-xs uppercase tracking-wide text-gray-400">Total impressions</div>
                <div className="mt-2 text-3xl font-bold">{new Intl.NumberFormat('en-US').format(totals.impressions)}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <div className="text-xs uppercase tracking-wide text-gray-400">Total spend</div>
                <div className="mt-2 text-3xl font-bold">{formatMidnight(totals.totalSpend.toString())}</div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-white/10 bg-black/30 shadow-2xl shadow-black/20">
            <div className="border-b border-white/10 px-6 py-4">
              <h2 className="text-lg font-semibold">Campaign performance</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-black/40 text-xs uppercase tracking-wide text-gray-400">
                  <tr>
                    <th className="px-6 py-4">Campaign</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Impressions</th>
                    <th className="px-6 py-4">Spend</th>
                    <th className="px-6 py-4">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.id} className="border-t border-white/10">
                      <td className="px-6 py-4 font-medium text-white">{row.title}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-200">{new Intl.NumberFormat('en-US').format(row.impressions)}</td>
                      <td className="px-6 py-4 text-gray-200">{formatMidnight(row.totalSpend)}</td>
                      <td className="px-6 py-4 text-gray-200">{formatPercent(row.estimatedCtr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
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