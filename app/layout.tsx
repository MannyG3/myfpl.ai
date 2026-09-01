import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FPL Weekly Analyser — Custom Metrics & Squad Dashboard',
  description:
    'Personal Fantasy Premier League dashboard with form-adjusted fixture ratings, minutes security, differential scores, transfer alerts, and captain recommendations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
