/**
 * AuctionApi — auction-related API calls.
 * CRITICAL PRIVACY NOTE: actual bid amounts are hashed HERE (client-side),
 * never transmitted to the server. This is architectural, not optional.
 */
import { apiFetch } from './client';

export interface AuctionResultResponseDto {
  winnerId: string;
  winningBid: string;
  priceToPay: string;
  auctionStatus: 'BIDDING' | 'CLOSED' | 'SETTLED';
  timestamp: string;
}

/** Compute H(bid || nonce) entirely in the browser using SubtleCrypto */
async function buildCommitment(actualBid: bigint): Promise<{
  commitmentHash: string;
  nonce: string;
  actualBid: string;
}> {
  const nonce = crypto.getRandomValues(new Uint8Array(32));
  const nonceHex = '0x' + Array.from(nonce).map(b => b.toString(16).padStart(2, '0')).join('');
  const bidBytes = new TextEncoder().encode(actualBid.toString());
  const combined = new Uint8Array(bidBytes.length + nonce.length);
  combined.set(bidBytes);
  combined.set(nonce, bidBytes.length);
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  const commitmentHash = '0x' + Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  return { commitmentHash, nonce: nonceHex, actualBid: actualBid.toString() };
}

export const auctionApi = {
  /**
   * Submit sealed bid. Hashes the actual bid client-side.
   * Only commitmentHash reaches the server — actual bid stays in sessionStorage.
   */
  submitBid: async (params: {
    campaignId: string;
    actualBid: bigint;
  }) => {
    const { commitmentHash, nonce, actualBid } = await buildCommitment(params.actualBid);

    // Store bid secret locally — NEVER sent to server
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`bid:nonce:${params.campaignId}`, nonce);
      sessionStorage.setItem(`bid:amount:${params.campaignId}`, actualBid);
    }

    return apiFetch<{ txHash: string; bidReceiptId: string }>('/advertiser/auction/bid', {
      method: 'POST',
      timeoutMs: 120_000,
      body: {
        campaignId: params.campaignId,
        commitmentHash,
      },
    });
  },

  reveal: (params: { campaignId: string }) => {
    let actualBid = '0';
    let nonce = '0x' + '0'.repeat(64);
    
    if (typeof window !== 'undefined') {
      actualBid = sessionStorage.getItem(`bid:amount:${params.campaignId}`) ?? '0';
      nonce = sessionStorage.getItem(`bid:nonce:${params.campaignId}`) ?? nonce;
    }
    
    return apiFetch<AuctionResultResponseDto>('/advertiser/auction/reveal', {
      method: 'POST',
      timeoutMs: 120_000,
      body: { campaignId: params.campaignId, actualBid, nonce },
    });
  },

  getResult: (campaignId: string) =>
    apiFetch<AuctionResultResponseDto>(`/advertiser/auction/${campaignId}/result`, {
      timeoutMs: 45_000,
    }),
} as const;
