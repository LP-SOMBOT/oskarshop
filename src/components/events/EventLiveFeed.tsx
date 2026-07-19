'use client';

import { useEffect, useState, useRef } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TapNotification {
  name: string;
  avatar?: string;
  timestamp: number;
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

        // Auto-expire after 3 seconds
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 3000);

        return () => clearTimeout(timer);
      }
    }
  }, [taps]);

  if (!currentTap) return null;

  return (
    <div className="fixed top-20 left-0 right-0 z-[100] flex justify-center px-4 pointer-events-none">
      <div className={cn(
        "bg-white dark:bg-slate-900 rounded-full py-3 px-5 flex items-center gap-3 shadow-[0_15px_40px_rgba(0,0,0,0.12)] dark:shadow-primary/5 transition-all duration-500 transform border-l-[6px] border-orange-500 pointer-events-auto",
        "w-full max-w-[340px] sm:max-w-sm relative",
        isVisible ? "translate-y-0 opacity-100 scale-100" : "-translate-y-12 opacity-0 scale-90"
      )}>
         <Avatar className="w-10 h-10 border-2 border-slate-50 dark:border-slate-800 shrink-0 shadow-sm">
            <AvatarImage src={currentTap.avatar} />
            <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600">
              <User size={20}/>
            </AvatarFallback>
         </Avatar>
         
         <div className="flex-1 min-w-0 pr-2">
            <p className="text-[13px] sm:text-[14px] font-black text-slate-900 dark:text-white leading-tight truncate">
               {currentTap.name} <span className="font-bold text-slate-500 dark:text-slate-400">ayaa ku biiray!</span>
            </p>
            <p className="text-[10px] sm:text-[11px] text-orange-500 font-black uppercase tracking-widest mt-0.5">
               Kulan cusub
            </p>
         </div>

         <button 
           onClick={() => setIsVisible(false)}
           className="text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors shrink-0 p-1"
         >
           <X size={16} strokeWidth={3} />
         </button>
      </div>
    </div>
  );
}
