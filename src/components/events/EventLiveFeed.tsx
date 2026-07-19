
'use client';

import { useEffect, useState, useRef } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, X, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TapNotification {
  name: string;
  avatar?: string;
  timestamp: number;
  taps?: number;
  value?: number;
}

export default function EventLiveFeed({ taps }: { taps: TapNotification[] }) {
  const [currentTap, setCurrentTap] = useState<TapNotification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const lastProcessedTime = useRef<number>(0);

  useEffect(() => {
    if (taps && taps.length > 0) {
      const latestTap = taps[taps.length - 1];
      const now = Date.now();
      
      // RULE 1: Only show if we haven't processed this specific timestamp yet
      // RULE 2: Only show if the tap happened within the last 3 seconds (Freshness check)
      if (latestTap.timestamp > lastProcessedTime.current && (now - latestTap.timestamp) < 3000) {
        lastProcessedTime.current = latestTap.timestamp;
        
        // Instant visual reset to trigger entry animation for the new item
        setIsVisible(false);
        
        // Short delay to allow the DOM to reset before sliding in the new one
        setTimeout(() => {
          setCurrentTap(latestTap);
          setIsVisible(true);
        }, 50);

        // Auto-expire after 3.5 seconds
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 3500);

        return () => clearTimeout(timer);
      }
    }
  }, [taps]);

  if (!currentTap) return null;

  return (
    <div className="fixed top-24 right-4 sm:right-8 z-[100] flex flex-col items-end pointer-events-none">
      <div className={cn(
        "bg-white dark:bg-slate-900 rounded-2xl py-3 px-4 flex items-center gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-primary/10 transition-all duration-500 transform border-r-[4px] border-orange-500 pointer-events-auto",
        "w-full max-w-[280px] sm:max-w-[320px] relative",
        isVisible ? "translate-x-0 opacity-100 scale-100" : "translate-x-12 opacity-0 scale-95"
      )}>
         <Avatar className="w-10 h-10 border-2 border-slate-50 dark:border-slate-800 shrink-0 shadow-sm">
            <AvatarImage src={currentTap.avatar} />
            <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600">
              <User size={20}/>
            </AvatarFallback>
         </Avatar>
         
         <div className="flex-1 min-w-0 pr-2">
            <p className="text-[12px] sm:text-[13px] font-black text-slate-900 dark:text-white leading-tight truncate">
               {currentTap.name} <span className="font-bold text-slate-500 dark:text-slate-400">ayaa bid gareeyay!</span>
            </p>
            <div className="flex items-center gap-1.5 mt-1">
               <div className="bg-orange-100 dark:bg-orange-500/20 px-1.5 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                  <Zap size={10} className="text-orange-500 fill-orange-500" />
                  <p className="text-[9px] sm:text-[10px] text-orange-600 dark:text-orange-400 font-black uppercase tracking-tight">
                    {currentTap.taps || 0} taps
                  </p>
               </div>
               <p className="text-[9px] sm:text-[10px] text-primary font-black uppercase tracking-widest">
                  ${currentTap.value?.toFixed(2)}
               </p>
            </div>
         </div>

         <button 
           onClick={() => setIsVisible(false)}
           className="text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors shrink-0 p-1"
         >
           <X size={14} strokeWidth={3} />
         </button>
      </div>
    </div>
  );
}
