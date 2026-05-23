import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { Providers } from '@/components/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HRDash — AI-Powered ATS Platform',
  description: 'AI-Powered Applicant Tracking System and CV Screening Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head />
      <body className={`${inter.className} bg-slate-50 text-slate-800 antialiased h-screen overflow-hidden flex`}>
        <Providers>
          {/* Dynamic Sidebar Component */}
          <Sidebar />

          {/* Main Content */}
          <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            {children}
          </main>
        </Providers>
        <Script 
          src="https://app.sandbox.midtrans.com/snap/snap.js" 
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
