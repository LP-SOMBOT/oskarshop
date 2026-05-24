'use client';

import { Trophy, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/lib/context';

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
      </div>

      <div className="max-w-lg space-y-6 md:space-y-10 relative z-10">
        <h1 className="text-4xl md:text-7xl font-headline font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none">
          Coming Soon
        </h1>
        
        <div className="pt-4 md:pt-8">
          <Button 
            onClick={() => setActiveTab('home')}
            className="rounded-xl md:rounded-[2rem] h-14 md:h-16 px-10 md:px-14 font-black text-sm md:text-lg shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90 text-white uppercase tracking-widest transition-all active:scale-95 gap-3"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" /> Ku laabo Home-ka
          </Button>
        </div>
      </div>
    </div>
  );
}
