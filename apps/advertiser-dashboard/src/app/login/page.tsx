'use client';

import { Suspense, type FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { clientApiClient, DashboardApiError } from '@/lib/api-client';

export default function LoginPage(): JSX.Element {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') ?? '/';
  const [email, setEmail] = useState('demo@admidnight.io');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await clientApiClient.login({ email, password });
      router.replace(nextPath);
    } catch (loginError) {
      if (loginError instanceof DashboardApiError && loginError.status === 401) {
        setError('Invalid advertiser credentials. The session cookie was not issued.');
      } else if (loginError instanceof DashboardApiError && loginError.status === 408) {
        setError('Login timed out. Retry after the auth service responds.');
      } else {
        setError(loginError instanceof Error ? loginError.message : 'Login failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-midnight)] px-6 py-16">
      <div className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-[var(--color-midnight-card)] p-8 shadow-2xl shadow-black/30">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-proof)]">Advertiser Access</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Sign in to AdMidnight</h1>
        <p className="mt-3 text-sm text-gray-400">
          Use your advertiser credentials to receive an HttpOnly session cookie. Nothing is written to localStorage.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit} data-testid="login-form">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm text-gray-300">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-[var(--color-accent)]"
              data-testid="login-email"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm text-gray-300">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-[var(--color-accent)]"
              data-testid="login-password"
            />
          </div>

          {error ? <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-[var(--color-midnight)] transition-colors hover:bg-[var(--color-accent-dim)] disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="login-submit"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-xs text-gray-500">
          Default local credentials can be provided through the API environment. Cookie-based auth is required for protected API calls.
        </p>
      </div>
    </main>
  );
}

function LoginPageFallback(): JSX.Element {
  return (
    <main className="min-h-screen bg-[var(--color-midnight)] px-6 py-16">
      <div className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-[var(--color-midnight-card)] p-8 shadow-2xl shadow-black/30">
        <p className="text-sm text-gray-400">Loading sign-in…</p>
      </div>
    </main>
  );
}
