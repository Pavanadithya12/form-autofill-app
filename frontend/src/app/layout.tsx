import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import { AppProviders } from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'Intelligent Form Auto-Filler — Full-Stack AI Application',
  description: 'AI-powered document parser and form auto-filler built with Next.js 15, Material UI, EasyOCR, spaCy, and FastAPI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body style={{ margin: 0, padding: 0 }}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
