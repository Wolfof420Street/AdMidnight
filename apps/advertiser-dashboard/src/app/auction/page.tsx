import Link from 'next/link';
import { redirect } from 'next/navigation';
import { DashboardApiError, serverApiClient } from '@/lib/api-client';

type AuctionCampaignRow = {
  id: string;
  title: string;
  auctionStatus: 'OPEN' | 'CLOSED' | 'SETTLED';
  bidStatus: string;
  winnerAdvertiserId?: string;
  settlementTxHash?: string;
  campaignStatus: string;
};

function auctionStatusClasses(status: 'OPEN' | 'CLOSED' | 'SETTLED'): string {
  if (status === 'OPEN') {
    return 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/20';
  }
  if (status === 'CLOSED') {
    return 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/20';
  }
  return 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20';
}

function statusClasses(status: string): string {
  if (status === 'ACTIVE') {
    return 'bg-green-500/15 text-green-300 ring-1 ring-green-400/20';
  }
  if (status === 'PAUSED') {
    return 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/20';
  }
  return 'bg-slate-500/15 text-slate-300 ring-1 ring-slate-400/20';
}

function bidStatusFor(auctionStatus: 'OPEN' | 'CLOSED' | 'SETTLED'): string {
  if (auctionStatus === 'OPEN') {
    return 'Commitment pending';
  }

  if (auctionStatus === 'CLOSED') {
    return 'Ready to reveal';
  }

  return 'Settled';
}

export default async function AuctionPage() {
  const api = await serverApiClient();

  try {
    const campaigns = await api.listCampaigns();

    if (campaigns.length === 0) {
      return (
        <main className="min-h-screen bg-[var(--color-midnight)] px-6 py-12">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-3xl border border-white/10 bg-black/30 p-10 text-center shadow-2xl shadow-black/20">
              <h1 className="text-3xl font-bold tracking-tight">Auctions</h1>
              <p className="mt-3 text-sm text-gray-300">No auctions yet.</p>
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
      campaigns.map(async (campaign): Promise<AuctionCampaignRow> => {
        const detail = await api.getCampaign(campaign.id);

        return {
          id: campaign.id,
          title: campaign.creative.title,
          auctionStatus: detail.auctionStatus,
          bidStatus: bidStatusFor(detail.auctionStatus),
          winnerAdvertiserId: detail.winnerAdvertiserId,
          settlementTxHash: detail.settlementTxHash,
          campaignStatus: campaign.status,
        };
      }),
    );

    return (
      <main className="min-h-screen bg-[var(--color-midnight)] px-6 py-12">
        <div className="mx-auto max-w-7xl space-y-8">
          <section className="rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_45%),rgba(0,0,0,0.35)] p-8 shadow-2xl shadow-black/20">
            <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Live auctions</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">Auction Center</h1>
            <p className="mt-3 max-w-2xl text-sm text-gray-300">
              Every auction row below is fetched from the running advertiser API with no mocked state.
            </p>
          </section>

          <section className="overflow-hidden rounded-3xl border border-white/10 bg-black/30 shadow-2xl shadow-black/20">
            <div className="border-b border-white/10 px-6 py-4">
              <h2 className="text-lg font-semibold">Campaign auctions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-black/40 text-xs uppercase tracking-wide text-gray-400">
                  <tr>
                    <th className="px-6 py-4">Campaign</th>
                    <th className="px-6 py-4">Auction Status</th>
                    <th className="px-6 py-4">Bid Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.id} className="border-t border-white/10 align-top">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{row.title}</div>
                        <div className="mt-2 text-xs uppercase tracking-wide text-gray-500">Campaign status</div>
                        <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(row.campaignStatus)}`}>
                          {row.campaignStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${auctionStatusClasses(row.auctionStatus)}`}>
                          {row.auctionStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-200">{row.bidStatus}</td>
                      <td className="px-6 py-4">
                        <div className="space-y-3">
                          {row.auctionStatus === 'OPEN' ? (
                            <Link
                              href={`/campaigns/${row.id}/bid`}
                              className="inline-flex rounded-xl bg-[var(--color-accent)] px-4 py-2 font-semibold text-[var(--color-midnight)] transition-colors hover:bg-[var(--color-accent-dim)]"
                            >
                              Place Bid
                            </Link>
                          ) : null}

                          {row.auctionStatus === 'CLOSED' ? (
                            <Link
                              href={`/campaigns/${row.id}/reveal`}
                              className="inline-flex rounded-xl bg-[var(--color-accent)] px-4 py-2 font-semibold text-[var(--color-midnight)] transition-colors hover:bg-[var(--color-accent-dim)]"
                            >
                              Reveal Bid
                            </Link>
                          ) : null}

                          {row.auctionStatus === 'SETTLED' ? (
                            <div className="space-y-2 rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-gray-300">
                              <div>
                                <div className="uppercase tracking-wide text-gray-500">Winner advertiser</div>
                                <div className="mt-1 break-all text-sm text-white">{row.winnerAdvertiserId ?? 'Unavailable'}</div>
                              </div>
                              <div>
                                <div className="uppercase tracking-wide text-gray-500">Settlement tx</div>
                                <div className="mt-1 break-all text-sm text-white">{row.settlementTxHash ?? 'Unavailable'}</div>
                              </div>
                            </div>
                          ) : null}

                          <Link href={`/campaigns/${row.id}`} className="inline-block text-xs text-sky-300 hover:underline">
                            View campaign
                          </Link>
                        </div>
                      </td>
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
      const status = (error as any).status ?? (error as any).statusCode;
      if (status === 401 || status === 403) {
        redirect('/login');
      }
    }

    throw error;
  }
}