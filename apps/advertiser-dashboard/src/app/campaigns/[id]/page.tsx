import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { DashboardApiError, serverApiClient } from '@/lib/api-client';

function statusClasses(status: string): string {
  if (status === 'ACTIVE') {
    return 'bg-green-500/15 text-green-300';
  }
  if (status === 'PAUSED') {
    return 'bg-amber-500/15 text-amber-300';
  }
  return 'bg-slate-500/15 text-slate-300';
}

function auctionClasses(status: 'OPEN' | 'CLOSED' | 'SETTLED'): string {
  if (status === 'OPEN') {
    return 'bg-sky-500/15 text-sky-300';
  }
  if (status === 'CLOSED') {
    return 'bg-amber-500/15 text-amber-300';
  }
  return 'bg-emerald-500/15 text-emerald-300';
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CampaignDetailPage({ params }: PageProps) {
  const { id } = await params;
  const api = await serverApiClient();

  try {
    const [campaign, analytics] = await Promise.all([
      api.getCampaign(id),
      api.getAnalytics(id),
    ]);

    return (
      <main className="min-h-screen bg-[var(--color-midnight)] px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <Link href="/campaigns" className="mb-6 inline-block text-sm text-gray-400 hover:text-white">
            Back to campaigns
          </Link>

          <div className="mb-6 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold">{campaign.creative.title}</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(campaign.status)}`}>
              {campaign.status}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${auctionClasses(campaign.auctionStatus)}`}>
              {campaign.auctionStatus}
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <section className="rounded-2xl border border-white/10 bg-black/30 p-6">
              <h2 className="text-lg font-semibold">Creative</h2>
              <p className="mt-4 text-sm font-semibold">{campaign.creative.title}</p>
              <p className="mt-2 text-sm text-gray-300">{campaign.creative.description}</p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">Segment Threshold</div>
                  <div className="mt-1 text-sm">{campaign.segment.similarityThreshold}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">Budget</div>
                  <div className="mt-1 text-sm">{campaign.budgetMidnight}</div>
                </div>
              </div>
            </section>

            <aside className="rounded-2xl border border-white/10 bg-black/30 p-6">
              <h2 className="text-lg font-semibold">Analytics</h2>
              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">Impressions</div>
                  <div className="mt-1 text-lg font-semibold">{analytics.impressions}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">Total Spend</div>
                  <div className="mt-1 text-lg font-semibold">{analytics.totalSpend}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">Estimated CTR</div>
                  <div className="mt-1 text-lg font-semibold">{(analytics.estimatedCtr * 100).toFixed(2)}%</div>
                </div>
              </div>
            </aside>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-6">
            {campaign.auctionStatus === 'OPEN' ? (
              <Link
                href={`/campaigns/${id}/bid`}
                className="inline-flex rounded-xl bg-[var(--color-accent)] px-5 py-3 font-semibold text-[var(--color-midnight)]"
              >
                Place Bid
              </Link>
            ) : null}

            {campaign.auctionStatus === 'CLOSED' ? (
              <Link
                href={`/campaigns/${id}/reveal`}
                className="inline-flex rounded-xl bg-[var(--color-accent)] px-5 py-3 font-semibold text-[var(--color-midnight)]"
              >
                Reveal Bid
              </Link>
            ) : null}

            {campaign.auctionStatus === 'SETTLED' ? (
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">Winner</div>
                  <div className="mt-1 break-all">{campaign.winnerAdvertiserId}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">Settlement Tx</div>
                  <div className="mt-1 break-all">{campaign.settlementTxHash}</div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    );
  } catch (error) {
    if (error instanceof DashboardApiError && error.status === 401) {
      redirect('/login');
    }
    if (error instanceof DashboardApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
