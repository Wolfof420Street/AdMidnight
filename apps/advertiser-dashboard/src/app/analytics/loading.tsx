export default function AnalyticsLoading() {
  return (
    <main className="min-h-screen bg-[var(--color-midnight)] px-6 py-12">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="h-56 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
        <div className="h-80 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
      </div>
    </main>
  );
}