
import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppProvider } from "@/lib/context";
import PWAInstaller from "@/components/layout/PWAInstaller";
import { FirebaseClientProvider } from "@/firebase";
import OnboardingGuard from "@/components/layout/OnboardingGuard";
import NotificationGuard from "@/components/layout/NotificationGuard";
import TermsGuard from "@/components/layout/TermsGuard";
import ProfileCompletionGuard from "@/components/layout/ProfileCompletionGuard";
import GlobalLoading from "@/components/layout/GlobalLoading";
import DynamicHead from "@/components/layout/DynamicHead";
import SWRegistration from "@/components/layout/SWRegistration";
import MainAppLayout from "@/components/layout/MainAppLayout";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import SplashScreen from "@/components/layout/SplashScreen";
import BannedModal from "@/components/layout/BannedModal";

export const metadata: Metadata = {
  title: 'Oskar Shop - Game Top-Up & Accounts',
  description: 'The best gaming top-up service and accounts store.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Oskar Shop',
  },
};

export const viewport: Viewport = {
  themeColor: '#0EA5E9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen relative overflow-x-hidden transition-colors duration-500">
        {/* Global Deep Light Blue Background & Neon Accents */}
        <div className="fixed inset-0 bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE] dark:from-[#0F172A] dark:to-[#020617] -z-20 transition-all duration-700" />
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] bg-[#7DD3FC]/30 dark:bg-[#38BDF8]/10 blur-[140px] rounded-full transition-all duration-700" />
          <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-[#0EA5E9]/20 dark:bg-[#0284C7]/10 blur-[140px] rounded-full transition-all duration-700" />
          <div className="absolute bottom-[-10%] left-[20%] w-[45%] h-[45%] bg-[#00D1FF]/15 dark:bg-[#00D1FF]/5 blur-[140px] rounded-full transition-all duration-700" />
        </div>

        <ErrorBoundary>
          <FirebaseClientProvider>
            <AppProvider>
              <SWRegistration />
              <DynamicHead />
              <SplashScreen />
              <GlobalLoading />
              <PWAInstaller />
              <BannedModal />
              <NotificationGuard>
                <TermsGuard>
                  <OnboardingGuard>
                    <ProfileCompletionGuard>
                      <MainAppLayout>
                        {children}
                      </MainAppLayout>
                    </ProfileCompletionGuard>
                  </OnboardingGuard>
                </TermsGuard>
              </NotificationGuard>
              <Toaster />
            </AppProvider>
          </FirebaseClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
