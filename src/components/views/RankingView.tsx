'use client';

import { Trophy, Clock, Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/lib/context';
import { Badge } from '@/components/ui/badge';

export default function RankingView() {
  const { setActiveTab } = useApp();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center page-transition overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative mb-8 md:mb-12">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-[60px] animate-pulse" />
        <div className="relative w-28 h-28 md:w-48 md:h-48 bg-white dark:bg-slate-900 rounded-[2.5rem] md:rounded-[4rem] flex items-center justify-center text-primary shadow-2xl border border-primary/10 ring-8 ring-primary/5">
           <Trophy size={56} className="md:size-24" />
        </div>
        <div className="absolute -top-4 -right-4 bg-amber-400 text-white p-3 rounded-2xl shadow-xl animate-bounce">
           <Sparkles size={24} />
        </div>
      </div>

      <div className="max-w-lg space-y-4 md:space-y-8 relative z-10">
        <div className="space-y-2">
           <Badge variant="outline" className="border-primary/20 text-primary font-black px-4 py-1 rounded-full uppercase tracking-[0.3em] text-[10px] mb-4">
              Seasonal Update
           </Badge>
           <h1 className="text-4xl md:text-7xl font-headline font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none">
             Coming <br className="md:hidden" /> Soon
           </h1>
        </div>
        
        <p className="text-sm md:text-xl text-muted-foreground dark:text-slate-400 font-medium leading-relaxed max-w-md mx-auto">
          Our global ranking system and seasonal rewards are currently being calibrated. Check back soon to see where you stand among the legends!
        </p>
        
        <div className="pt-6 md:pt-12">
          <Button 
            onClick={() => setActiveTab('home')}
            className="rounded-xl md:rounded-[2rem] h-14 md:h-20 px-10 md:px-16 font-black text-sm md:text-xl shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90 text-white uppercase tracking-widest transition-all active:scale-95 gap-3"
          >
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" /> Ku laabo Home-ka
          </Button>
        </div>
      </div>

      <div className="mt-16 md:mt-24 flex items-center gap-3 text-[10px] md:text-xs font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.5em]">
         <Clock size={14} /> Systems Calibration 2026
      </div>
    </div>
  );
}
