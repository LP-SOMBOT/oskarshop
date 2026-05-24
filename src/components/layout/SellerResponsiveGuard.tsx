
"use client";

import { useApp } from "@/lib/context";
import { ShieldAlert, ArrowRight, MessageCircle, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

/**
 * SellerResponsiveGuard
 * 
 * PERSISTENT FULL-SCREEN OVERLAY
 * Visible when a seller has unanswered buyer claims older than 1 hour.
 * Cannot be ignored until resolved or admin clears it.
 */
export default function SellerResponsiveGuard() {
  const { user, accountPosts, setActiveTab } = useApp();

  const stallingPosts = useMemo(() => {
    if (!user) return [];
    const now = Date.now();
    
    return (accountPosts || []).filter(p => {
      if (p.uid !== user.uid || p.sold || p.warningDismissedAt) return false;
      
      const claims = Object.values(p.claimants || {});
      return claims.some((c: any) => 
        c.status === 'pending' && (now - c.timestamp) > 3600000
      );
    });
  }, [user, accountPosts]);

  if (stallingPosts.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-500 overflow-y-auto">
       <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-2xl border-none ring-1 ring-red-500/20">
          {/* Danger Header */}
          <div className="bg-red-600 p-8 md:p-12 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldAlert size={160} /></div>
             <div className="relative z-10 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                   <AlertTriangle size={40} className="animate-pulse" />
                </div>
                <div>
                   <h2 className="text-3xl md:text-5xl font-headline font-bold uppercase tracking-tight leading-none">Security Alert</h2>
                   <p className="text-white/60 text-[10px] md:text-sm font-black uppercase tracking-[0.2em] mt-2">Action Required Immediately</p>
                </div>
             </div>
          </div>

          <div className="p-8 md:p-12 space-y-8 md:space-y-12">
             <div className="space-y-4">
                <p className="text-slate-900 dark:text-white text-base md:text-xl font-bold leading-relaxed">
                   Waxaad haysataa {stallingPosts.length} account oo ay qof iibsadeen laakiin aadan wali ka jawaabin verification-ka muddo ka badan 1 saac.
                </p>
                <p className="text-muted-foreground text-xs md:text-base font-medium">
                   Fadlan si deg-deg ah ugu jawaab si aan account-kaaga looga saarin listing-ka ama aanan garka kugu soo xirin.
                </p>
             </div>

             {/* Problematic Accounts List */}
             <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500 ml-1">Stalling Listings:</p>
                <div className="grid grid-cols-1 gap-2">
                   {stallingPosts.map(p => (
                     <div key={p.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-between border dark:border-white/5">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 shrink-0 flex items-center justify-center">
                              <Clock className="w-5 h-5 text-red-500" />
                           </div>
                           <div>
                              <p className="text-xs font-bold uppercase">{p.gameType} Account</p>
                              <p className="text-[9px] font-black opacity-40 uppercase tracking-widest">REF: #{p.id.toUpperCase()}</p>
                           </div>
                        </div>
                        <Badge className="bg-red-500 text-white text-[8px] font-black">STALLING</Badge>
                     </div>
                   ))}
                </div>
             </div>

             <div className="pt-4 flex flex-col gap-4">
                <Button 
                  onClick={() => setActiveTab('my-accounts')}
                  className="w-full h-16 md:h-20 rounded-2xl md:rounded-3xl bg-red-600 hover:bg-red-700 text-white font-black text-sm md:text-xl uppercase tracking-widest shadow-2xl shadow-red-500/20 active:scale-95 transition-all gap-3"
                >
                   Resolve Now <ArrowRight size={24} />
                </Button>
                <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest">
                   Oskar Security Protocol Active
                </p>
             </div>
          </div>
       </div>
    </div>
  );
}
