import AppHeader from '@/src/components/AppHeader';
import AppProviders from '@/src/components/AppProviders';
import { IBM_Plex_Sans_Arabic, Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex-arabic',
  display: 'swap',
});

export const metadata = {
  title: 'SEU SRR',
  description:
    'Compare semester intersection workbooks against paper registration forms and export a reconciliation report.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${ibmPlexArabic.variable}`}>
        <AppProviders>
          <AppHeader />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}