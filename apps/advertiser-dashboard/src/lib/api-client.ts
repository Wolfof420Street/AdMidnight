import type {
  ApiResponse,
  AuctionResultResponseDto,
  CampaignDetailResponseDto,
  CampaignResponseDto,
  LoginDto,
  SessionDto,
} from '@admidnight/shared';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export class DashboardApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'DashboardApiError';
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  cookieHeader?: string;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const json = (await response.json().catch(() => null)) as
    | ApiResponse<T>
    | { message?: string }
    | null;

  if (!response.ok) {
    throw new DashboardApiError(
      json && 'message' in json && json.message ? json.message : response.statusText,
      response.status,
    );
  }

  if (!json || !('data' in json)) {
    throw new DashboardApiError('Malformed API response', 500);
  }

  return json.data;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, cookieHeader, headers, ...rest } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
      ...headers,
    },
    cache: 'no-store',
  });

  return parseResponse<T>(response);
}

export async function serverApiClient() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  return {
    listCampaigns: () =>
      request<CampaignResponseDto[]>('/advertiser/campaign', { cookieHeader }),
    getCampaign: (id: string) =>
      request<CampaignDetailResponseDto>(`/advertiser/campaign/${id}`, { cookieHeader }),
    getAnalytics: (id: string) =>
      request<{ impressions: number; estimatedCtr: number; totalSpend: string }>(
        `/advertiser/campaign/${id}/analytics`,
        { cookieHeader },
      ),
  };
}

export const clientApiClient = {
  login: (body: LoginDto) =>
    request<SessionDto>('/auth/login', {
      method: 'POST',
      body,
    }),
  submitBid: (body: { campaignId: string; commitmentHash: string }) =>
    request<{ txHash: string; bidReceiptId: string }>('/advertiser/auction/bid', {
      method: 'POST',
      body,
    }),
  revealBid: (body: { campaignId: string; actualBid: string; nonce: string }) =>
    request<AuctionResultResponseDto>('/advertiser/auction/reveal', {
      method: 'POST',
      body,
    }),
};
