'use client';

import { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/lib/context';
import { 
  Trophy, 
  ArrowLeft, 
  Star, 
  Clock,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function RankingView() {
  const { allUsers, setActiveTab, storeSettings, t } = useApp();
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  const leaderboardSettings = useMemo(() => {
    return storeSettings?.leaderboard || {
      rewardsActive: true,
      rewards: { rank1: 3, rank2: 2, rank3: 1 }
    };
  }, [storeSettings]);

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
      <header className="h-16 md:h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b dark:border-white/5 flex items-center justify-between px-3 md:px-10 shrink-0 z-50">
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setActiveTab('home')} className="rounded-full h-9 w-9 md:h-10 md:w-10">
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
          </Button>
          <div className="hidden xs:block">
            <h1 className="font-headline font-bold text-sm md:text-2xl uppercase tracking-tight text-slate-900 dark:text-white truncate">
              {t('ranking')}
            </h1>
            <div className="flex items-center gap-1">
              <Badge className="bg-primary text-white text-[7px] md:text-[8px] font-black uppercase px-1.5 md:px-2 py-0">LIVE</Badge>
              <span className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('session_label')}1</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 md:gap-4 flex-1">
           {leaderboardSettings.rewardsActive && (
             <>
               <RewardBadge rank={1} discount={leaderboardSettings.rewards.rank1} />
               <RewardBadge rank={2} discount={leaderboardSettings.rewards.rank2} />
               <RewardBadge rank={3} discount={leaderboardSettings.rewards.rank3} />
             </>
           )}
           {!leaderboardSettings.rewardsActive && (
              <Badge className="bg-slate-100 text-slate-400 border-none text-[8px] md:text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm">
                 Rewards Period Closed
              </Badge>
           )}
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

          <div className="grid grid-cols-3 gap-3 md:gap-8 items-end pt-10 pb-4">
             {top3[1] && <PodiumCard user={top3[1]} rank={2} color="silver" activeRewards={leaderboardSettings.rewardsActive} delay="duration-700 delay-100" />}
             {top3[0] && <PodiumCard user={top3[0]} rank={1} color="gold" activeRewards={leaderboardSettings.rewardsActive} delay="duration-1000 delay-300" />}
             {top3[2] && <PodiumCard user={top3[2]} rank={3} color="bronze" activeRewards={leaderboardSettings.rewardsActive} delay="duration-700 delay-500" />}
          </div>

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

function PodiumCard({ user, rank, color, activeRewards, delay }: { user: any, rank: number, color: 'gold' | 'silver' | 'bronze', activeRewards: boolean, delay?: string }) {
  const isGold = color === 'gold';
  const isSilver = color === 'silver';

  const borderClasses = isGold 
    ? "border-yellow-400 ring-4 ring-yellow-400/20 shadow-[0_0_25px_rgba(234,179,8,0.5)]" 
    : isSilver 
      ? "border-slate-300 ring-4 ring-slate-300/20 shadow-[0_0_15px_rgba(203,213,225,0.3)]" 
      : "border-amber-700 ring-4 ring-amber-700/20 shadow-[0_0_15px_rgba(180,83,9,0.3)]";

  return (
    <div className={cn(
      "flex flex-col items-center gap-3 relative transition-all animate-in slide-in-from-bottom-20",
      isGold ? "z-20 scale-110 animate-float" : "z-10",
      delay
    )}>
       <div className="relative">
          <div className={cn(
            "w-16 h-16 md:w-28 md:h-28 rounded-full border-[4px] md:border-[6px] relative overflow-hidden",
            borderClasses
          )}>
             <Avatar className="w-full h-full">
                <AvatarImage src={user.photoURL} />
                <AvatarFallback className="bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                   <User className="w-1/2 h-1/2 text-slate-300 dark:text-slate-700" />
                </AvatarFallback>
             </Avatar>
          </div>
          <Badge className={cn(
            "absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black p-0 border-2 md:border-4 border-white dark:border-slate-950 shadow-lg text-[10px] md:text-sm",
            isGold ? "bg-yellow-500 text-white" : isSilver ? "bg-slate-400 text-white" : "bg-amber-700 text-white"
          )}>
            {rank}
          </Badge>
       </div>
       
       <div className="text-center min-w-0 px-1">
          <p className="font-bold text-[10px] md:text-base text-slate-900 dark:text-white truncate max-w-full">
            {user.name}
          </p>
          <div className="flex items-center justify-center gap-1 text-primary">
             <Star size={10} fill="currentColor" />
             <span className="text-[10px] md:text-sm font-black">{user.points || 0}</span>
          </div>
       </div>

       {activeRewards && (
         <div className={cn(
           "w-full rounded-t-[1.5rem] md:rounded-t-[2.5rem] shadow-inner flex flex-col items-center justify-center pt-2",
           isGold ? "h-24 md:h-32 bg-gradient-to-b from-yellow-500/30 to-transparent" :
           isSilver ? "h-16 md:h-24 bg-gradient-to-b from-slate-400/20 to-transparent" :
           "h-12 md:h-16 bg-gradient-to-b from-amber-700/20 to-transparent"
         )}>
            <span className={cn(
              "text-[8px] md:text-[10px] font-black uppercase tracking-widest",
              isGold ? "text-yellow-600" : isSilver ? "text-slate-500" : "text-amber-800"
            )}>TOP {rank}</span>
         </div>
       )}
    </div>
  );
}

function RankListItem({ user, rank }: { user: any, rank: number }) {
  const { t } = useApp();
  return (
    <Card className="p-3 md:p-6 rounded-2xl md:rounded-[2rem] border-none bg-white dark:bg-slate-900 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
       <div className="flex items-center gap-3 md:gap-6">
          <span className="w-6 md:w-10 font-headline font-bold text-sm md:text-xl text-slate-400 group-hover:text-primary transition-colors text-center">{rank}</span>
          <Avatar className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl shadow-sm border-2 border-white dark:border-white/5">
             <AvatarImage src={user.photoURL} />
             <AvatarFallback className="bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <User className="w-1/2 h-1/2 text-slate-300 dark:text-slate-700" />
             </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
             <p className="font-bold text-sm md:text-xl text-slate-900 dark:text-white truncate">{user.name}</p>
          </div>
       </div>
       <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5 md:gap-3 text-primary font-headline font-bold text-sm md:text-2xl">
             <Star size={14} className="fill-primary/20 md:size-6" />
             <span>{user.points || 0}</span>
          </div>
          <p className="text-[7px] md:text-[10px] font-black text-muted-foreground uppercase tracking-tighter">TOTAL PTS</p>
       </div>
    </Card>
  );
}