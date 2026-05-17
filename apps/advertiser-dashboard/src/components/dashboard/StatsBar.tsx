'use client';

export function StatsBar(): JSX.Element {
  const stats = [
    {
      label: 'Total ZK Proofs',
      value: '14,823',
      sub: 'verified impressions',
      color: 'var(--color-proof)',
    },
    {
      label: 'Active Campaigns',
      value: '3',
      sub: 'across 2 segments',
      color: 'var(--color-accent)',
    },
    {
      label: 'Protocol Spend',
      value: '2,401 tMIDN',
      sub: 'up 18% vs last period',
      color: 'var(--color-success)',
    },
    {
      label: 'Avg. Match Rate',
      value: '34.7%',
      sub: 'ZK-verified',
      color: 'var(--color-warning)',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-[var(--color-midnight-card)] rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-colors"
          >
            <div className="text-xs text-gray-500 mb-2">{stat.label}</div>
            <div className="text-2xl font-bold data-value" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="text-xs text-gray-600 mt-1">{stat.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

