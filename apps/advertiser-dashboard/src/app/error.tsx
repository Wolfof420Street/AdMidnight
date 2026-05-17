'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  useEffect(() => {
    console.error('[dashboard:error]', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-midnight-950 text-white antialiased">
        <main className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-16">
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-left text-sm text-red-100">
            <p className="text-xs uppercase tracking-[0.35em] text-red-200/80">Rendering error</p>
            <h1 className="mt-3 text-2xl font-bold text-white">The dashboard stopped rendering safely</h1>
            <p className="mt-3 max-w-xl text-red-100/80">
              A protected boundary caught an unexpected failure. Refresh the page or retry the current view.
            </p>
            <button
              onClick={reset}
              className="mt-6 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[var(--color-midnight)]"
            >
              Retry
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}