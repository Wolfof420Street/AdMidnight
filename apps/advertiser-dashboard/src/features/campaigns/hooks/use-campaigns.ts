/**
 * useCampaigns — custom hook for campaign data fetching.
 *
 * SRP: data fetching concern extracted from UI components.
 * DRY: campaign loading logic not duplicated across pages.
 * SoC: components display; hooks fetch.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { campaignsApi } from '@/lib/api/campaigns.api';
import { ApiError } from '@/lib/api/client';
import type { CampaignResponseDto } from '@admidnight/shared';

interface UseCampaignsResult {
  campaigns: CampaignResponseDto[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCampaigns(): UseCampaignsResult {
  const [campaigns, setCampaigns] = useState<CampaignResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await campaignsApi.list();
      setCampaigns(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Your session expired. Sign in again to view campaigns.');
      } else if (err instanceof ApiError && err.status === 408) {
        setError('Campaign loading timed out. The proof service may still be processing.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load campaigns');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return { campaigns, isLoading, error, refresh: load };
}
