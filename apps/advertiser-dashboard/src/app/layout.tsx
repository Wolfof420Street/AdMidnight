import type { Metadata } from 'next';
import './globals.css';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { WalletProvider } from '@/providers/WalletProvider';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { PrivacyIndicator } from '@/components/shared/PrivacyIndicator';

export const metadata: Metadata = {
  title: 'AdMidnight — Privacy-Preserving Ad Protocol',
  description: 'Zero-knowledge advertising on Midnight Blockchain',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body className="bg-midnight-950 text-white antialiased">
        <ErrorBoundary
          title="The dashboard could not finish loading"
          message="A protected UI boundary failed before the page could render completely. Refresh to retry."
        >
          <WalletProvider>
            <DashboardHeader />
            <PrivacyIndicator />
            <main>{children}</main>
          </WalletProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

