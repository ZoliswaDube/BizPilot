import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BizPilot - Business Management Platform',
  description: 'Comprehensive business management platform built with modern technologies',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}