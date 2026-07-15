'use client';

import { useEffect, useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';

interface TapNotification {
  name: string;
  avatar?: string;
  timestamp: number;
}

export default function EventLiveFeed({ taps }: { taps: TapNotification[] }) {
  const [currentTap, setCurrentTap] = useState<TapNotification | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (taps && taps.length > 0) {
      const latestTap = taps[taps.length - 1];
      setCurrentTap(latestTap);
      setIsVisible(true);

      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [taps]);

  if (!currentTap || !isVisible) return null;

  return (
    <div className="fixed top-24 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <div className="bg-white/90 backdrop-blur-xl border border-primary/20 rounded-2xl p-3 pr-6 flex items-center gap-3 shadow-2xl animate-in slide-in-from-right-4 fade-in duration-300">
         <Avatar className="w-10 h-10 border-2 border-primary/10 shadow-sm">
            <AvatarImage src={currentTap.avatar} unoptimized />
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