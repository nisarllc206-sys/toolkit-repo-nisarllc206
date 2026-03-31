import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI PDF Super Toolkit',
  description: 'The most powerful AI PDF toolkit. Merge, split, compress, OCR, chat with PDFs, and more.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
