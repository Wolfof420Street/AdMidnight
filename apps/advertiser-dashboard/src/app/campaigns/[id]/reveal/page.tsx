'use client';

import Link from 'next/link';
import { type FormEvent, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auctionApi, type AuctionResultResponseDto } from '@/lib/api/auction.api';
import { ApiError } from '@/lib/api/client';

export default function RevealPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuctionResultResponseDto | null>(null);
  const [storedBidAmount, setStoredBidAmount] = useState<string>('');

  useEffect(() => {
    // Load stored bid from sessionStorage
    if (typeof window !== 'undefined') {
      const amount = sessionStorage.getItem(`bid:amount:${campaignId}`) ?? '';
      setStoredBidAmount(amount);
    }
  }, [campaignId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const auctionResult = await auctionApi.reveal({ campaignId });
      setResult(auctionResult);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Reveal failed: ${err.message}`);
      } else {
        setError(err instanceof Error ? err.message : 'Reveal failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-midnight)] px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <Link href={`/campaigns/${campaignId}`} className="mb-8 inline-block text-gray-400 hover:text-white">
          ← Back to Campaign
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Reveal Bid</h1>
          <p className="mt-2 text-gray-400">Reveal your sealed bid and settle the auction</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-8">
          {result ? (
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-6">
              <div className="mb-4 font-semibold text-green-200">Auction Settled</div>
              <div className="grid gap-4">
                <div>
                  <div className="text-sm text-gray-400">Status</div>
                  <div className="mt-1 text-lg font-bold capitalize">{result.auctionStatus}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Winner</div>
                  <div className="mt-1 break-all font-mono text-sm">{result.winnerId}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Winning Bid</div>
                  <div className="mt-1 text-lg font-bold">{result.winningBid} MIDNIGHT</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Price to Pay</div>
                  <div className="mt-1 text-lg font-bold">{result.priceToPay} MIDNIGHT</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Timestamp</div>
                  <div className="mt-1 text-sm">{new Date(result.timestamp).toLocaleString()}</div>
                </div>
              </div>
              <button
                onClick={() => router.push(`/campaigns/${campaignId}`)}
                className="mt-6 w-full rounded-xl bg-[var(--color-accent)] px-6 py-3 font-semibold text-[var(--color-midnight)] transition-colors hover:bg-[var(--color-accent-dim)]"
              >
                Back to Campaign
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium">Stored Bid Amount</label>
                <input
                  type="text"
                  disabled
                  value={storedBidAmount || '(No bid found in session)'}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-gray-400 outline-none disabled:opacity-50"
                />
                <p className="mt-2 text-xs text-gray-500">
                  This is the bid amount you submitted when placing the sealed bid. It's retrieved from your browser session.
                </p>
              </div>

              <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
                <p className="text-sm text-blue-200">
                  The nonce and commitment hash are stored in your session and will be used to reveal your bid on-chain.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting || !storedBidAmount}
                  className="flex-1 rounded-xl bg-[var(--color-accent)] px-6 py-3 font-semibold text-[var(--color-midnight)] transition-colors hover:bg-[var(--color-accent-dim)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Revealing...' : 'Reveal Bid'}
                </button>
                <Link
                  href={`/campaigns/${campaignId}`}
                  className="rounded-xl border border-white/20 px-6 py-3 font-semibold transition-colors hover:border-white/40"
                >
                  Cancel
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
