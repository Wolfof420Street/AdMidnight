/**
 * Base API client — single place for all fetch configuration.
 * DRY: fetch options, error handling, and response transformation defined once.
 * OCP: new API modules extend by importing this client, not by re-implementing it.
 */

import type { ApiResponse } from '@admidnight/shared';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  timeoutMs?: number;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, timeoutMs = 30_000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  if (fetchOptions.signal) {
    if (fetchOptions.signal.aborted) {
      controller.abort();
    } else {
      fetchOptions.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...fetchOptions,
      signal: controller.signal,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: response.statusText })) as {
        message?: string;
        requestId?: string;
      };
      throw new ApiError(response.status, errorBody.message ?? 'Request failed', errorBody.requestId);
    }

    const json = (await response.json()) as ApiResponse<T>;
    return json.data;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(408, 'Request timed out. Please retry after the proof service responds.');
    }

    throw error;
  } finally {
    clearTimeout(timeoutHandle);
  }
}
