'use client';

import Link from 'next/link';
import { type FormEvent, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auctionApi } from '@/lib/api/auction.api';
import { ApiError } from '@/lib/api/client';

export default function BidPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;
  
  const [bidAmount, setBidAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ txHash: string; bidReceiptId: string } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await auctionApi.submitBid({
        campaignId,
        actualBid: BigInt(bidAmount),
      });
      setSuccess(result);
      
      // Redirect back to campaign detail after 2 seconds
      setTimeout(() => {
        router.push(`/campaigns/${campaignId}`);
      }, 2000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Bid submission failed: ${err.message}`);
      } else {
        setError(err instanceof Error ? err.message : 'Bid submission failed');
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
          <h1 className="text-3xl font-bold">Place Sealed Bid</h1>
          <p className="mt-2 text-gray-400">Submit a sealed bid for this campaign auction</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-8">
          {success ? (
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-6 text-center">
              <div className="text-green-200">
                <div className="mb-2 font-semibold">Bid submitted successfully!</div>
                <div className="text-sm">Bid Receipt ID: {success.bidReceiptId}</div>
                <div className="mt-4 text-xs text-gray-400">Redirecting back to campaign...</div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium">Bid Amount (MIDNIGHT)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="Enter your bid amount"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition-colors focus:border-[var(--color-accent)]"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Your actual bid amount is hashed client-side and never sent to the server. Only the commitment hash is submitted.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting || !bidAmount}
                  className="flex-1 rounded-xl bg-[var(--color-accent)] px-6 py-3 font-semibold text-[var(--color-midnight)] transition-colors hover:bg-[var(--color-accent-dim)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Bid'}
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
