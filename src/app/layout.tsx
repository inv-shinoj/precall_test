import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Agora WebRTC Troubleshooting',
  description: 'WebRTC diagnostic tool for testing browser compatibility, microphone, speaker, camera, and network connectivity',
  keywords: 'WebRTC, Agora, diagnostics, troubleshooting, audio, video, network',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        <div className="flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}