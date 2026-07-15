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
      
      // Ensure we only show a tap once based on timestamp
      if (latestTap.timestamp > lastProcessedTime.current) {
        lastProcessedTime.current = latestTap.timestamp;
        
        // Instant visual swap for high frequency
        setIsVisible(false);
        
        setTimeout(() => {
          setCurrentTap(latestTap);
          setIsVisible(true);
        }, 50);

        // Disappear after 3 seconds
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
        "bg-white rounded-2xl md:rounded-full py-3 px-4 flex items-center gap-3 shadow-[0_10px_40px_rgba(0,0,0,0.08)] transition-all duration-500 transform border-l-[6px] border-orange-500 pointer-events-auto",
        "w-full max-w-[340px] sm:max-w-sm relative",
        isVisible ? "translate-y-0 opacity-100 scale-100" : "-translate-y-12 opacity-0 scale-95"
      )}>
         <Avatar className="w-10 h-10 border-2 border-slate-100 shrink-0">
            <AvatarImage src={currentTap.avatar} />
            <AvatarFallback className="bg-slate-100 text-slate-400">
              <User size={20}/>
            </AvatarFallback>
         </Avatar>
         
         <div className="flex-1 min-w-0 pr-4">
            <p className="text-[13px] sm:text-[15px] font-bold text-slate-900 leading-tight truncate">
               {currentTap.name} ayaa ku biiray!
            </p>
            <p className="text-[11px] sm:text-[12px] text-slate-400 font-medium mt-0.5">
               Kulan cusub
            </p>
         </div>

         <button 
           onClick={() => setIsVisible(false)}
           className="text-slate-300 hover:text-slate-500 transition-colors shrink-0"
         >
           <X size={16} />
         </button>
      </div>
    </div>
  );
}
