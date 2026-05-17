const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const apiOrigin = (() => {
  try {
    return new URL(apiUrl).origin;
  } catch {
    return 'http://localhost:3001';
  }
})();

const isDevelopment = process.env.NODE_ENV !== 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  async headers() {
    const scriptSrc = isDevelopment
      ? "'self' 'unsafe-eval' 'unsafe-inline'"
      : "'self' 'unsafe-inline'";

    const connectSrc = [
      "'self'",
      apiOrigin,
      'http://localhost:3000',
      'http://localhost:3001',
      'ws://localhost:3000',
      'ws://localhost:3001',
    ].join(' ');

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `script-src ${scriptSrc}`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              `connect-src ${connectSrc}`,
              "font-src 'self' data:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
};

export default nextConfig;

