
'use client';

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface EventGetButtonProps {
  onTap: () => void;
  cooldown: number;
  isSyncing: boolean;
  isTapping?: boolean;
  tapPrice: number;
}

export default function EventGetButton({ onTap, cooldown, isSyncing, isTapping, tapPrice }: EventGetButtonProps) {
  const isCooldown = cooldown > 0;
  const isLoading = isSyncing || isTapping;
  
  return (
    <div className="w-full space-y-1.5 sm:space-y-2">
      <button 
        onClick={onTap}
        disabled={isCooldown || isLoading}
        className={cn(
          "w-full h-12 sm:h-16 md:h-24 rounded-xl sm:rounded-2xl md:rounded-3xl flex items-center justify-center relative overflow-hidden transition-all active:scale-95 group",
          isLoading 
            ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
            : isCooldown 
              ? "bg-slate-100 text-slate-400" 
              : "bg-gradient-to-r from-primary to-blue-500 text-white shadow-2xl shadow-primary/30 hover:shadow-primary/50"
        )}
      >
         {isLoading ? (
            <div className="flex items-center gap-2 sm:gap-3">
               <Loader2 className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 animate-spin" />
               <span className="font-black text-xs sm:text-lg md:text-2xl uppercase tracking-widest">
                  {isSyncing ? "Syncing..." : "Processing..."}
               </span>
            </div>
         ) : isCooldown ? (
            <div className="flex flex-col items-center">
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                  <svg className="w-10 h-10 sm:w-14 sm:h-14 md:w-24 md:h-24 transform -rotate-90">
                     <circle 
                       cx="50%" cy="50%" r="20%" 
                       fill="none" 
                       stroke="currentColor" 
                       strokeWidth="2" 
                       strokeDasharray="125.6" 
                       strokeDashoffset={(125.6 * (1 - cooldown / 120000)).toString()} 
                       className="transition-all duration-1000 linear"
                     />
                  </svg>
               </div>
               <span className="font-black text-xs sm:text-base md:text-2xl uppercase tracking-widest relative z-10">Sug: {format(new Date(cooldown), 'mm:ss')}</span>
            </div>
         ) : (
            <span className="font-black text-xl sm:text-3xl md:text-6xl uppercase tracking-[0.1em] sm:tracking-[0.2em] group-hover:scale-110 transition-transform">BID GAREE 👆</span>
         )}
         {!isCooldown && !isLoading && <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />}
      </button>
      <p className="text-[8px] sm:text-[10px] md:text-sm font-bold text-slate-400 text-center uppercase tracking-widest">
         +${tapPrice.toFixed(2)} markaa taabatid
      </p>
    </div>
  );
}

