import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { Inter } from 'next/font/google';
import { FirebaseClientProvider } from '@/firebase';
import { AuthProvider } from '@/contexts/auth-context';
import { FamilyProvider } from '@/contexts/family-context';
import { NotificationProvider } from '@/contexts/notification-context';

export const metadata: Metadata = {
  title: 'AgoraCare',
  description: 'The voice of care in your home.',
  openGraph: {
    images: [
      {
        url: '/agoracare.jpg',
        width: 1200,
        height: 630,
        alt: 'AgoraCare - Voice AI Medical Triage',
      },
    ],
  },
};

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      </head>
      <body className={cn('font-body antialiased', 'min-h-screen bg-background font-sans', inter.variable)}>
        <FirebaseClientProvider>
          <AuthProvider>
            <FamilyProvider>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </FamilyProvider>
          </AuthProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
