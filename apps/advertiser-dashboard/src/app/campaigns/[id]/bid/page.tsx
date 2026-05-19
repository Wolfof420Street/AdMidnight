'use client';

import Link from 'next/link';
import { type FormEvent, useState } from 'react';
import { useParams } from 'next/navigation';
import { clientApiClient, DashboardApiError } from '@/lib/api-client';

export default function BidPage() {
  const params = useParams<{ id: string }>();
  const campaignId = params.id;
  const [commitmentHash, setCommitmentHash] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ bidReceiptId: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await clientApiClient.submitBid({ campaignId, commitmentHash });
      setResult({ bidReceiptId: response.bidReceiptId });
    } catch (submitError) {
      setError(
        submitError instanceof DashboardApiError
          ? submitError.message
          : 'Failed to submit bid',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-midnight)] px-6 py-12">
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-black/30 p-8">
        <Link href={`/campaigns/${campaignId}`} className="text-sm text-gray-400 hover:text-white">
          Back to campaign
        </Link>

        <h1 className="mt-6 text-3xl font-bold">Place Bid</h1>

        <form className="mt-6 space-y-5" onSubmit={onSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium">Commitment Hash</label>
            <input
              required
              value={commitmentHash}
              onChange={(event) => setCommitmentHash(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          {result ? <p className="text-sm text-green-300">bidReceiptId: {result.bidReceiptId}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-[var(--color-accent)] px-5 py-3 font-semibold text-[var(--color-midnight)] disabled:opacity-60"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Bid'}
          </button>
        </form>
      </div>
    </main>
  );
}
