"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import Header from "./Header";
import BottomNav from "./BottomNav";
import DesktopSidebar from "./DesktopSidebar";
import OfflinePage from "./OfflinePage";
import SellerResponsiveGuard from "./SellerResponsiveGuard";
import GlobalLoading from "./GlobalLoading";
import { useApp } from "@/lib/context";
import { cn } from "@/lib/utils";

export default function MainAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { activeTab, storeSettings, user, isPostingAccount, setGlobalLoading } = useApp();
  
  // Clear loading state whenever the pathname changes
  useEffect(() => {
    setGlobalLoading(false);
  }, [pathname, setGlobalLoading]);

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isAdminPage = pathname.startsWith("/admin");
  const isRanking = activeTab === 'ranking';
  
  const isSpecialFlow = pathname === "/checkout" || pathname === "/checkout-account" || pathname.startsWith("/accounts/") || pathname.startsWith("/events/") || activeTab === 'chat' || isPostingAccount || isRanking;

  const isOffline = storeSettings?.appStatus?.offline;
  const isAdminUser = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'staff';

  if (isOffline && !isAdminUser) {
    return <OfflinePage />;
  }

  if (isAuthPage || isAdminPage) {
    return (
      <>
        <GlobalLoading />
        {children}
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {!isSpecialFlow && <DesktopSidebar />}

      <div className="flex-1 flex flex-col min-w-0 relative">
        <SellerResponsiveGuard />
        <GlobalLoading />

        {!isSpecialFlow && (
          <div className="md:hidden">
            <Header />
          </div>
        )}

        <main className={cn(
          "page-transition flex-1",
          !isSpecialFlow && "md:p-4 lg:p-8 xl:p-12"
        )}>
          {children}
        </main>

        {!isSpecialFlow && (
          <div className="md:hidden">
            <BottomNav />
          </div>
        )}
      </div>
    </div>
  );
}
