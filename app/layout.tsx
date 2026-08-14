import type { Metadata } from 'next';
import './globals.css';
import SmoothScrollProvider from './components/SmoothScroll';
import ReduxProvider from './components/ReduxProvider';

export const metadata: Metadata = {
  title: 'TrackPulse — YouTube Playlist Metadata Studio',
  description: 'Extract video titles, durations, timecodes and calculate total playlist runtime as JSON & TXT.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ReduxProvider>
          <SmoothScrollProvider>{children}</SmoothScrollProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
