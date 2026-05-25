
"use client";

import { useApp } from "@/lib/context";
import { ShieldAlert, ArrowRight, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMemo, useState, useEffect } from "react";

/**
 * SellerResponsiveGuard
 * 
 * PERSISTENT SELLER NAG SYSTEM
 * Initial state: Blocking full-screen overlay.
 * After click "Resolve Now": Sticky top banner warning that appears on all pages.
 * Cannot be ignored until resolved or admin clears it.
 */
export default function SellerResponsiveGuard() {
  const { user, accountPosts, setActiveTab, language } = useApp();
  const [isDismissed, setIsDismissed] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Heartbeat timer to ensure realtime check of "stalling" status
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const stallingPosts = useMemo(() => {
    if (!user) return [];
    
    return (accountPosts || []).filter(p => {
      if (p.uid !== user.uid || p.sold || p.warningDismissedAt) return false;
      
      const claims = Object.values(p.claimants || {});
      return claims.some((c: any) => 
        c.status === 'pending' && (now - c.timestamp) > 3600000
      );
    });
  }, [user, accountPosts, now]);

  // Reset dismissal state if no more stalling posts, so it can pop up again if a new one arrives later
  useEffect(() => {
    if (stallingPosts.length === 0) {
      setIsDismissed(false);
    }
  }, [stallingPosts.length]);

  if (stallingPosts.length === 0) return null;

  const handleResolveClick = () => {
    setIsDismissed(true);
    setActiveTab('my-accounts');
  };

  // Top Warning Overlay (Banner Mode) - Appears on all pages after acknowledging the modal
  if (isDismissed) {
    return (
      <div className="sticky top-0 z-[9999] bg-red-600 text-white p-2.5 px-4 flex items-center justify-between shadow-2xl animate-in slide-in-from-top-full duration-500 border-b border-red-500/50">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
             <AlertTriangle size={18} className="animate-pulse" />
          </div>
          <div className="min-w-0">
             <p className="text-[10px] md:text-xs font-black uppercase tracking-widest leading-none">
               {language === 'so' ? "Arin deg deg ah" : "Security Alert"}
             </p>
             <p className="text-[9px] md:text-[11px] font-bold opacity-90 truncate">
               {language === 'so' 
                 ? "Fadlan kajawaab account kaaga inta aanan Laga saarin listing Ga" 
                 : `${stallingPosts.length} stalling account(s) detected! Resolve immediately in My Accounts.`}
             </p>
          </div>
        </div>
        <Button 
          size="sm" 
          onClick={() => setActiveTab('my-accounts')}
          className="bg-white text-red-600 hover:bg-slate-100 font-black h-8 px-6 rounded-full text-[10px] uppercase shadow-lg active:scale-95 transition-transform shrink-0 ml-4"
        >
          {language === 'so' ? "Hadda xalli" : "Resolve"}
        </Button>
      </div>
    );
  }

  // Full Screen Modal (Initial Pop-up Mode)
  return (
    <div className="fixed inset-0 z-[10000] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-500 overflow-y-auto">
       <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-2xl border-none ring-1 ring-red-500/20">
          {/* Danger Header */}
          <div className="bg-red-600 p-8 md:p-12 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldAlert size={160} /></div>
             <div className="relative z-10 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                   <AlertTriangle size={40} className="animate-pulse" />
                </div>
                <div>
                   <h2 className="text-3xl md:text-5xl font-headline font-bold uppercase tracking-tight leading-none">
                      {language === 'so' ? "Arin deg deg ah" : "Security Alert"}
                   </h2>
                   <p className="text-white/60 text-[10px] md:text-sm font-black uppercase tracking-[0.2em] mt-2">
                      {language === 'so' ? "Fadlan xogta ka jawaab" : "Action Required Immediately"}
                   </p>
                </div>
             </div>
          </div>

          <div className="p-8 md:p-12 space-y-8 md:space-y-12">
             <div className="space-y-4">
                <p className="text-slate-900 dark:text-white text-base md:text-xl font-bold leading-relaxed">
                   {language === 'so' 
                    ? `Waxaa jiro ${stallingPosts.length} account oo qof dhahay Waan iibsaday, adigana kama aadan jawaabin mudo 1 saac ah, fadlan kajawaab sida ugu dhaqsiyaha badan, Oskar team ayaa WhatsApp ka kaala Soo xariireen, hadii aadan ka jawaabin mudo 24 saacad guduhod account kaaga waala Ga Saari doonnaa.`
                    : `You have ${stallingPosts.length} account(s) that buyers have claimed but you haven't responded to the verification for over 1 hour.`}
                </p>
             </div>

             {/* Problematic Accounts List */}
             <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500 ml-1">
                   {language === 'so' ? "Account-yada xallinta u baahan:" : "Stalling Listings:"}
                </p>
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
                  onClick={handleResolveClick}
                  className="w-full h-16 md:h-20 rounded-2xl md:rounded-3xl bg-red-600 hover:bg-red-700 text-white font-black text-sm md:text-xl uppercase tracking-widest shadow-2xl shadow-red-500/20 active:scale-95 transition-all gap-3"
                >
                   {language === 'so' ? "Hadda xalli" : "Resolve Now"} <ArrowRight size={24} />
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
