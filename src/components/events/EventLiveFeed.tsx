'use client';

import { useEffect, useState, useRef } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
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

        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 3000);

        return () => clearTimeout(timer);
      }
    }
  }, [taps]);

  if (!currentTap) return null;

  return (
    <div className="fixed top-24 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <div className={cn(
        "bg-white/90 backdrop-blur-xl border border-primary/20 rounded-2xl p-3 pr-6 flex items-center gap-3 shadow-2xl transition-all duration-300 transform",
        isVisible ? "translate-x-0 opacity-100 scale-100" : "translate-x-12 opacity-0 scale-95"
      )}>
         <Avatar className="w-10 h-10 border-2 border-primary/10 shadow-sm">
            <AvatarImage src={currentTap.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary">
              <User size={16}/>
            </AvatarFallback>
         </Avatar>
         <div className="min-w-0">
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">
               <span className="text-primary">{currentTap.name}</span> ayaa taabtay! 🔥
            </p>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Auction Update</p>
         </div>
      </div>
    </div>
  );
}
