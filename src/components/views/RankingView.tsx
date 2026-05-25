
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/lib/context';
import { 
  Trophy, 
  ArrowLeft, 
  Crown, 
  Star, 
  ChevronRight, 
  Clock,
  LayoutGrid,
  Sparkles,
  Medal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function RankingView() {
  const { allUsers, setActiveTab, language, t } = useApp();
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  const sortedUsers = useMemo(() => {
    return [...allUsers]
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .slice(0, 50);
  }, [allUsers]);

  const top3 = useMemo(() => sortedUsers.slice(0, 3), [sortedUsers]);
  const others = useMemo(() => sortedUsers.slice(3), [sortedUsers]);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const diff = nextMonth.getTime() - now.getTime();
      
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft({ d, h, m, s });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentMonthName = format(new Date(), 'MMMM yyyy');

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden animate-in fade-in duration-500">
      {/* Premium Header */}
      <header className="h-16 md:h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b dark:border-white/5 flex items-center justify-between px-3 md:px-10 shrink-0 z-50">
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setActiveTab('home')} className="rounded-full h-9 w-9 md:h-10 md:w-10">
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
          </Button>
          <div className="hidden xs:block">
            <h1 className="font-headline font-bold text-sm md:text-2xl uppercase tracking-tight text-slate-900 dark:text-white truncate">
              {t('ranking')}
            </h1>
            <Badge className="bg-primary text-white text-[7px] md:text-[8px] font-black uppercase px-1.5 md:px-2 py-0">LIVE</Badge>
          </div>
        </div>

        {/* Reward Tiers Info - Moved to Header */}
        <div className="flex items-center justify-center gap-1.5 md:gap-4 flex-1">
           <RewardBadge rank={1} discount={3} />
           <RewardBadge rank={2} discount={2} />
           <RewardBadge rank={3} discount={1} />
        </div>

        <div className="hidden sm:flex flex-col items-end shrink-0">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('current_month')}: {currentMonthName}</p>
           <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Clock size={14} className="animate-pulse" />
              <span>{timeLeft.d}d {timeLeft.h}h {timeLeft.m}m {timeLeft.s}s</span>
           </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide pb-24">
        <main className="max-w-4xl mx-auto w-full p-4 sm:p-8 space-y-10">
          
          {/* Mobile Timer */}
          <div className="sm:hidden p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between">
             <div className="space-y-0.5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('next_reset')}</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{currentMonthName}</p>
             </div>
             <div className="text-right">
                <p className="text-[10px] font-black text-primary uppercase">
                   {timeLeft.d}d {timeLeft.h}:{timeLeft.m}:{timeLeft.s}
                </p>
             </div>
          </div>

          {/* Top 3 Podium */}
          <div className="grid grid-cols-3 gap-3 md:gap-8 items-end pt-10 pb-4">
             {/* Rank 2 */}
             {top3[1] && <PodiumCard user={top3[1]} rank={2} color="silver" />}
             
             {/* Rank 1 */}
             {top3[0] && <PodiumCard user={top3[0]} rank={1} color="gold" />}
             
             {/* Rank 3 */}
             {top3[2] && <PodiumCard user={top3[2]} rank={3} color="bronze" />}
          </div>

          {/* List 4-50 */}
          <div className="space-y-3">
             {others.length > 0 ? (
               others.map((u, i) => (
                 <RankListItem key={u.uid} user={u} rank={i + 4} />
               ))
             ) : (
               <div className="py-20 text-center opacity-30 italic text-sm font-bold uppercase tracking-widest">
                  {t('no_participants')}
               </div>
             )}
          </div>
        </main>
      </div>
    </div>
  );
}

function RewardBadge({ rank, discount }: { rank: number, discount: number }) {
  const icon = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
  return (
    <div className="flex items-center gap-1 md:gap-1.5 bg-white dark:bg-slate-900 px-1.5 md:px-3 py-1 md:py-1.5 rounded-full border dark:border-white/5 shadow-sm">
       <span className="text-xs md:text-sm">{icon}</span>
       <span className="text-[8px] md:text-[10px] font-black uppercase text-slate-900 dark:text-white">-{discount}%</span>
    </div>
  );
}

function PodiumCard({ user, rank, color }: { user: UserProfile, rank: number, color: 'gold' | 'silver' | 'bronze' }) {
  const isGold = color === 'gold';
  const isSilver = color === 'silver';

  return (
    <div className={cn(
      "flex flex-col items-center gap-3 relative transition-all duration-700 animate-in slide-in-from-bottom-10",
      isGold ? "z-20 scale-110" : "z-10"
    )}>
       <div className="relative">
          {isGold && <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 w-8 h-8 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)] animate-bounce" />}
          <div className={cn(
            "w-16 h-16 md:w-24 md:h-24 rounded-full border-4 shadow-2xl relative overflow-hidden",
            isGold ? "border-yellow-500 ring-4 ring-yellow-500/20" : isSilver ? "border-slate-300" : "border-amber-600"
          )}>
             <Avatar className="w-full h-full">
                <AvatarImage src={user.photoURL} />
                <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-xs">{user.name.substring(0,2).toUpperCase()}</AvatarFallback>
             </Avatar>
          </div>
          <Badge className={cn(
            "absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-black p-0 border-2 border-white dark:border-slate-950",
            isGold ? "bg-yellow-500" : isSilver ? "bg-slate-400" : "bg-amber-700"
          )}>
            {rank}
          </Badge>
       </div>
       
       <div className="text-center min-w-0 px-1">
          <p className="font-bold text-[10px] md:text-sm text-slate-900 dark:text-white truncate max-w-full">
            {user.name.split(' ')[0]}
          </p>
          <div className="flex items-center justify-center gap-1 text-primary">
             <Star size={10} fill="currentColor" />
             <span className="text-[10px] md:text-xs font-black">{user.points || 0}</span>
          </div>
       </div>

       {/* Podium Pedestal */}
       <div className={cn(
         "w-full rounded-t-2xl shadow-inner flex flex-col items-center justify-center pt-2",
         isGold ? "h-20 md:h-28 bg-gradient-to-b from-yellow-500/20 to-transparent" :
         isSilver ? "h-16 md:h-20 bg-gradient-to-b from-slate-400/20 to-transparent" :
         "h-12 md:h-16 bg-gradient-to-b from-amber-700/20 to-transparent"
       )}>
          <span className={cn(
            "text-[8px] font-black uppercase tracking-widest",
            isGold ? "text-yellow-600" : isSilver ? "text-slate-500" : "text-amber-800"
          )}>TOP {rank}</span>
       </div>
    </div>
  );
}

function RankListItem({ user, rank }: { user: UserProfile, rank: number }) {
  return (
    <Card className="p-3 md:p-5 rounded-2xl md:rounded-[1.5rem] border-none bg-white dark:bg-slate-900 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
       <div className="flex items-center gap-3 md:gap-5">
          <span className="w-6 md:w-8 font-headline font-bold text-sm md:text-lg text-slate-400 group-hover:text-primary transition-colors text-center">{rank}</span>
          <Avatar className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl shadow-sm border dark:border-white/5">
             <AvatarImage src={user.photoURL} />
             <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-[10px]">{user.name.substring(0,2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
             <p className="font-bold text-sm md:text-lg text-slate-900 dark:text-white truncate">{user.name}</p>
             <p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40 leading-none mt-1">Player Profile</p>
          </div>
       </div>
       <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5 md:gap-2 text-primary font-headline font-bold text-sm md:text-xl">
             <Star size={14} className="fill-primary/20" />
             <span>{user.points || 0}</span>
          </div>
          <p className="text-[7px] md:text-[9px] font-black text-muted-foreground uppercase tracking-tighter">TOTAL PTS</p>
       </div>
    </Card>
  );
}
