import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pokémon TCG Rules Assistant',
  description: 'An AI assistant for Pokémon Trading Card Game rules and card lookups',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="fantasy">
      <body>{children}</body>
    </html>
  );
}