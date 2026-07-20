
'use client';

import { useEffect, useState, useRef } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, X, Zap, Sparkles } from 'lucide-react';
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
      
      // Filter for very recent taps to avoid notification spam on load
      if (latestTap.timestamp > lastProcessedTime.current && (now - latestTap.timestamp) < 3000) {
        lastProcessedTime.current = latestTap.timestamp;
        setIsVisible(false);
        setTimeout(() => {
          setCurrentTap(latestTap);
          setIsVisible(true);
        }, 50);

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
        "bg-white dark:bg-slate-900 rounded-2xl py-3 px-4 flex items-center gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-primary/10 transition-all duration-500 transform border-r-[4px] border-pink-500 pointer-events-auto",
        "w-full max-w-[280px] sm:max-w-[320px] relative overflow-hidden",
        isVisible ? "translate-x-0 opacity-100 scale-100" : "translate-x-12 opacity-0 scale-95"
      )}>
         {/* Beautiful Accent Background for Light Mode */}
         <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-orange-500/5 dark:from-transparent dark:to-transparent pointer-events-none" />
         
         <Avatar className="w-10 h-10 border-2 border-slate-50 dark:border-slate-800 shrink-0 shadow-sm relative z-10">
            <AvatarImage src={currentTap.avatar} />
            <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600">
              <User size={20}/>
            </AvatarFallback>
         </Avatar>
         
         <div className="flex-1 min-w-0 pr-2 relative z-10">
            <p className="text-[12px] sm:text-[13px] font-black text-slate-900 dark:text-white leading-tight truncate">
               {currentTap.name} <span className="font-bold text-slate-500 dark:text-slate-400">ayaa bid gareeyay!</span>
            </p>
            <div className="flex items-center gap-1.5 mt-1">
               <div className="bg-pink-100 dark:bg-pink-500/20 px-1.5 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                  <Zap size={10} className="text-pink-600 dark:text-pink-400 fill-pink-600/20" />
                  <p className="text-[9px] sm:text-[10px] text-pink-700 dark:text-pink-300 font-black uppercase tracking-tight">
                    {currentTap.taps || 0} bid
                  </p>
               </div>
               <p className="text-[9px] sm:text-[10px] text-primary font-black uppercase tracking-widest flex items-center gap-1">
                  <Sparkles size={10} /> ${currentTap.value?.toFixed(2)}
               </p>
            </div>
         </div>

         <button 
           onClick={() => setIsVisible(false)}
           className="text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors shrink-0 p-1 relative z-10"
         >
           <X size={14} strokeWidth={3} />
         </button>
      </div>
    </div>
  );
}
