"use client";

import { useApp } from "@/lib/context";
import { AlertCircle, ArrowRight, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

/**
 * SellerResponsiveGuard
 * 
 * Persistent global warning banner for sellers who have unanswered claims.
 * Visible on all pages until resolved.
 */
export default function SellerResponsiveGuard() {
  const { user, accountPosts, setActiveTab } = useApp();

  const unansweredClaimsCount = useMemo(() => {
    if (!user) return 0;
    const now = Date.now();
    
    // Find my posts that have at least one pending claim older than 1 hour (3600000 ms)
    const stallingPosts = (accountPosts || []).filter(p => {
      if (p.uid !== user.uid || p.sold) return false;
      
      const claims = Object.values(p.claimants || {});
      return claims.some((c: any) => 
        c.status === 'pending' && (now - c.timestamp) > 3600000
      );
    });

    return stallingPosts.length;
  }, [user, accountPosts]);

  if (unansweredClaimsCount === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[1000] animate-in slide-in-from-top duration-500">
       <div className="bg-red-600 text-white px-4 py-3 md:py-4 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6 shadow-2xl">
          <div className="flex items-center gap-3">
             <ShieldAlert className="w-5 h-5 md:w-6 md:h-6 shrink-0 animate-pulse" />
             <p className="text-[10px] md:text-sm font-black uppercase tracking-widest text-center">
                Attention: You have {unansweredClaimsCount} stalling account {unansweredClaimsCount > 1 ? 'listings' : 'listing'}!
             </p>
          </div>
          <p className="hidden lg:block text-[11px] font-bold opacity-80 italic">
            Please respond to buyer claims in "My Accounts" to avoid removal.
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setActiveTab('my-accounts')}
            className="h-8 md:h-10 rounded-full border-white/40 bg-white/10 hover:bg-white text-white hover:text-red-600 font-bold px-6 gap-2 text-[9px] md:text-xs uppercase"
          >
             Take Action <ArrowRight size={14} />
          </Button>
       </div>
    </div>
  );
}
