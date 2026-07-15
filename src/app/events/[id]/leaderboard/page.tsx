
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Trophy, 
  Star, 
  Clock,
  User,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ref, onValue, off } from 'firebase/database';
import { useDatabase } from '@/firebase';

export default function EventLeaderboardPage() {
  const { id } = useParams();
  const router = useRouter();
  const { eventAccounts, user, t } = useApp();
  const rtdb = useDatabase();

  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const event = useMemo(() => {
    return (eventAccounts || []).find(e => e.id === id);
  }, [eventAccounts, id]);

  useEffect(() => {
    if (!rtdb || !id) return;
    const participantsRef = ref(rtdb, `eventParticipants/${id}`);
    const unsub = onValue(participantsRef, (snap) => {
      const data = snap.val();
      if (data) setParticipants(Object.values(data).sort((a: any, b: any) => b.taps - a.taps));
      else setParticipants([]);
      setLoading(false);
    });
    return () => off(participantsRef);
  }, [rtdb, id]);

  const top3 = useMemo(() => participants.slice(0, 3), [participants]);
  const others = useMemo(() => participants.slice(3), [participants]);

  if (!event && !loading) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col overflow-hidden animate-in fade-in duration-500">
       <header className="h-16 md:h-20 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 md:px-10 shrink-0 z-50">
          <div className="flex items-center gap-3">
             <button onClick={() => router.back()} className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-white border border-white/5 active:scale-90">
                <ArrowLeft size={24} />
             </button>
             <div>
                <h1 className="font-headline font-bold text-sm md:text-2xl text-white uppercase tracking-tight truncate max-w-[180px] md:max-w-md">
                   {event?.title}
                </h1>
                <p className="text-[8px] md:text-[10px] font-black text-amber-500 uppercase tracking-widest">{t('kaalmaha') || 'Leaderboard'}</p>
             </div>
          </div>
          <Badge className="bg-primary/20 text-primary border-none text-[8px] md:text-[10px] font-black uppercase px-4 py-1.5 rounded-full">
             {participants.length} Active
          </Badge>
       </header>

       <div className="flex-1 overflow-y-auto scrollbar-hide">
          <main className="max-w-4xl mx-auto w-full p-4 sm:p-8 space-y-12">
             
             {/* PODIUM */}
             <div className="grid grid-cols-3 gap-2 md:gap-8 items-end pt-10 pb-6">
                {top3[1] && <PodiumCard user={top3[1]} rank={2} color="silver" delay="duration-700 delay-100" />}
                {top3[0] && <PodiumCard user={top3[0]} rank={1} color="gold" delay="duration-1000 delay-300" />}
                {top3[2] && <PodiumCard user={top3[2]} rank={3} color="bronze" delay="duration-700 delay-500" />}
             </div>

             {/* OTHERS LIST */}
             <div className="space-y-3">
                {participants.length === 0 && !loading && (
                   <div className="py-20 text-center opacity-20 italic uppercase font-bold">No participants yet</div>
                )}
                {others.map((p, i) => (
                   <RankItem key={p.uid} user={p} rank={i + 4} isMe={p.uid === user?.uid} />
                ))}
             </div>
          </main>
       </div>
    </div>
  );
}

function PodiumCard({ user, rank, color, delay }: { user: any, rank: number, color: 'gold' | 'silver' | 'bronze', delay?: string }) {
  const isGold = color === 'gold';
  const isSilver = color === 'silver';

  const borderClasses = isGold 
    ? "border-amber-400 ring-4 ring-amber-400/20 shadow-[0_0_30px_rgba(251,191,36,0.3)]" 
    : isSilver 
      ? "border-slate-300 ring-4 ring-slate-300/20 shadow-[0_0_15px_rgba(203,213,225,0.2)]" 
      : "border-orange-700 ring-4 ring-orange-700/20 shadow-[0_0_15px_rgba(194,65,12,0.2)]";

  return (
    <div className={cn(
      "flex flex-col items-center gap-3 relative transition-all animate-in slide-in-from-bottom-20",
      isGold ? "z-20 scale-110" : "z-10",
      delay
    )}>
       <div className="relative">
          <div className={cn(
            "w-16 h-16 md:w-28 md:h-28 rounded-full border-[4px] md:border-[6px] relative overflow-hidden bg-slate-900 shadow-2xl",
            borderClasses
          )}>
             {user.avatar ? (
                <Image src={user.avatar} alt="" fill className="object-cover" />
             ) : <div className="w-full h-full flex items-center justify-center bg-slate-800"><User size={24} className="text-white/20" /></div>}
          </div>
          <Badge className={cn(
            "absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black p-0 border-2 md:border-4 border-slate-950 shadow-lg text-[10px] md:text-sm",
            isGold ? "bg-amber-400 text-black" : isSilver ? "bg-slate-400 text-black" : "bg-orange-800 text-white"
          )}>
            {rank}
          </Badge>
          {isGold && <Trophy size={20} className="absolute -top-6 left-1/2 -translate-x-1/2 text-amber-400 animate-bounce" />}
       </div>
       
       <div className="text-center min-w-0 w-full">
          <p className="font-bold text-[10px] md:text-base text-white truncate px-1">
            {user.name?.split(' ')[0] || "Gamer"}
          </p>
          <div className="flex items-center justify-center gap-1 text-primary">
             <Star size={10} className="fill-primary" />
             <span className="text-[10px] md:text-sm font-black">{user.taps} TAPS</span>
          </div>
       </div>

       <div className={cn(
         "w-full rounded-t-[1.5rem] md:rounded-t-[2.5rem] shadow-inner flex flex-col items-center justify-center pt-2",
         isGold ? "h-24 md:h-32 bg-gradient-to-b from-amber-400/20 to-transparent" :
         isSilver ? "h-16 md:h-24 bg-gradient-to-b from-slate-400/10 to-transparent" :
         "h-12 md:h-16 bg-gradient-to-b from-orange-800/10 to-transparent"
       )}>
          <span className={cn(
            "text-[8px] md:text-[10px] font-black uppercase tracking-widest",
            isGold ? "text-amber-400" : isSilver ? "text-slate-400" : "text-orange-800"
          )}>TOP {rank}</span>
       </div>
    </div>
  );
}

function RankItem({ user, rank, isMe }: { user: any, rank: number, isMe?: boolean }) {
  return (
    <Card className={cn(
      "p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-sm transition-all flex items-center justify-between group",
      isMe ? "bg-primary shadow-[0_10px_30px_rgba(14,165,233,0.3)] ring-2 ring-white/20" : "bg-white/5 hover:bg-white/10"
    )}>
       <div className="flex items-center gap-4 md:gap-8">
          <span className={cn("w-6 md:w-10 font-headline font-bold text-sm md:text-2xl text-center", isMe ? "text-white" : "text-slate-600")}>{rank}</span>
          <div className="relative">
             <Avatar className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl border-2 border-white/10">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-slate-800"><User size={20} className="text-white/20"/></AvatarFallback>
             </Avatar>
             {isMe && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-primary" />}
          </div>
          <div>
             <p className={cn("font-bold text-sm md:text-xl", isMe ? "text-white" : "text-white")}>{user.name}</p>
             <p className={cn("text-[8px] md:text-[10px] font-black uppercase tracking-widest", isMe ? "text-white/60" : "text-slate-500")}>Active Competitor</p>
          </div>
       </div>
       <div className="text-right">
          <p className={cn("font-headline font-bold text-lg md:text-3xl", isMe ? "text-white" : "text-primary")}>${user.value.toFixed(2)}</p>
          <div className="flex items-center justify-end gap-1 opacity-60">
             <Star size={10} className={cn("fill-current", isMe ? "text-white" : "text-primary")} />
             <span className={cn("text-[10px] md:text-sm font-black", isMe ? "text-white" : "text-slate-400")}>{user.taps} TAPS</span>
          </div>
       </div>
    </Card>
  );
}
