'use client';

import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Clock, 
  Gamepad2, 
  ShieldCheck, 
  Trophy, 
  Activity,
  User,
  Star,
  Info,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { ref, onValue, off, limitToLast, query } from 'firebase/database';
import { useDatabase } from '@/firebase';
import { format } from 'date-fns';
import EventGetButton from '@/components/events/EventGetButton';
import EventLiveFeed from '@/components/events/EventLiveFeed';

export default function EventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { eventAccounts, tapEventAccount, user, setGlobalLoading, t, language } = useApp();
  const rtdb = useDatabase();

  const [timeLeft, setTimeLeft] = useState({ h: '00', m: '00', s: '00' });
  const [participants, setParticipants] = useState<any[]>([]);
  const [tapFeed, setTapFeed] = useState<any[]>([]);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  const [cooldown, setCooldown] = useState(0);

  const event = useMemo(() => {
    return (eventAccounts || []).find(e => e.id === id);
  }, [eventAccounts, id]);

  const myStats = useMemo(() => {
    if (!user) return null;
    return participants.find(p => p.uid === user.uid);
  }, [user, participants]);

  const myRank = useMemo(() => {
    if (!user) return 0;
    const rank = participants.findIndex(p => p.uid === user.uid) + 1;
    return rank;
  }, [user, participants]);

  // Real-time Participants & Feed Listeners
  useEffect(() => {
    if (!rtdb || !id) return;

    const partRef = ref(rtdb, `eventParticipants/${id}`);
    const feedRef = query(ref(rtdb, `eventTaps/${id}`), limitToLast(1));

    const partUnsub = onValue(partRef, (snap) => {
      const data = snap.val();
      if (data) {
        setParticipants(Object.values(data).sort((a: any, b: any) => b.taps - a.taps));
      } else {
        setParticipants([]);
      }
      setIsSyncing(false);
    });

    const feedUnsub = onValue(feedRef, (snap) => {
      const data = snap.val();
      if (data) {
        const taps = Object.values(data);
        setTapFeed(taps);
      }
    });

    return () => {
      off(partRef);
      off(feedRef);
    };
  }, [rtdb, id]);

  // Countdown & Cooldown Logic
  useEffect(() => {
    if (!event) return;

    const timer = setInterval(() => {
      const now = Date.now();
      
      // Cooldown check
      if (myStats?.lastTapTime) {
        const diff = now - myStats.lastTapTime;
        const remaining = Math.max(0, 120000 - diff);
        setCooldown(remaining);
      }

      // Event countdown
      const diff = event.endTime - now;
      if (diff <= 0) {
        setTimeLeft({ h: '00', m: '00', s: '00' });
        clearInterval(timer);
        return;
      }

      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setTimeLeft({ h, m, s });
    }, 1000);

    return () => clearInterval(timer);
  }, [event, myStats]);

  const handleTap = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (cooldown > 0 || isSyncing) return;
    await tapEventAccount(id as string);
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col gap-6">
         <Skeleton className="h-12 w-12 rounded-full" />
         <Skeleton className="h-64 w-full rounded-[2rem]" />
         <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    );
  }

  const isEnded = event.status === 'ended' || event.status === 'claimed';
  const isUpcoming = event.status === 'upcoming';
  const currentPrice = event.initialPrice + ((participants[0]?.taps || 0) * event.tapPrice);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-32 page-transition relative overflow-x-hidden">
      {/* SECTION 1: HEADER */}
      <div className="relative h-[35vh] w-full overflow-hidden">
         {event.imageUrls?.[0] ? (
            <Image src={event.imageUrls[0]} alt="" fill className="object-cover" unoptimized />
         ) : <div className="w-full h-full bg-slate-200" />}
         <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent" />
         
         <header className="absolute top-0 left-0 right-0 h-20 flex items-center justify-between px-6 z-50">
            <button onClick={() => router.back()} className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-2xl flex items-center justify-center text-slate-900 border border-slate-200 active:scale-90 transition-all shadow-sm">
               <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-2">
               {event.status === 'active' ? (
                 <Badge className="bg-red-500 text-white border-none rounded-full px-3 py-1 font-black flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" /> LIVE
                 </Badge>
               ) : (
                 <Badge className="bg-blue-500 text-white border-none rounded-full px-3 py-1 font-black uppercase text-[10px]">
                    {event.status}
                 </Badge>
               )}
            </div>
         </header>

         <div className="absolute bottom-4 left-6 right-6">
            <h1 className="text-2xl md:text-4xl font-headline font-bold uppercase tracking-tight leading-none text-slate-900">{event.title}</h1>
            <p className="text-primary font-black text-[10px] md:text-sm uppercase tracking-[0.3em] mt-1">{event.gameName}</p>
         </div>
      </div>

      <main className="px-6 space-y-8 md:space-y-12 max-w-4xl mx-auto relative z-10">
         {/* COUNTDOWN & PRICE */}
         <Card className="p-6 md:p-10 rounded-[2.5rem] bg-white border-slate-100 shadow-xl space-y-8">
            <div className="text-center space-y-2">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">{isUpcoming ? 'BILAABMAYSA' : isEnded ? 'DHAMMAATAY' : 'ENDS IN'}</p>
               <div className="text-4xl md:text-7xl font-headline font-bold tracking-tighter flex items-center justify-center gap-2 md:gap-4 text-slate-900">
                  <div className="bg-slate-50 rounded-2xl md:rounded-3xl w-16 h-16 md:w-24 md:h-24 flex items-center justify-center border border-slate-100">{timeLeft.h}</div>
                  <span className="opacity-20">:</span>
                  <div className="bg-slate-50 rounded-2xl md:rounded-3xl w-16 h-16 md:w-24 md:h-24 flex items-center justify-center border border-slate-100">{timeLeft.m}</div>
                  <span className="opacity-20">:</span>
                  <div className="bg-slate-50 rounded-2xl md:rounded-3xl w-16 h-16 md:w-24 md:h-24 flex items-center justify-center border border-slate-100">{timeLeft.s}</div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-8 border-t border-slate-50">
               <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('Qiimaha Asalka') || 'Initial Price'}</p>
                  <p className="text-xl md:text-3xl font-headline font-bold text-slate-400">${event.initialPrice.toFixed(2)}</p>
               </div>
               <div className="text-right space-y-1">
                  <p className="text-[9px] font-black text-primary uppercase tracking-widest">{t('Qiimaha Hadda') || 'Highest Bid'}</p>
                  <p className="text-4xl md:text-6xl font-headline font-bold text-primary tracking-tighter">
                    ${currentPrice.toFixed(2)}
                  </p>
               </div>
            </div>

            {participants[0] && (
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full border-2 border-primary overflow-hidden shrink-0 bg-white">
                        {participants[0].avatar ? <Image src={participants[0].avatar} alt="" width={32} height={32} unoptimized /> : <User className="m-auto text-slate-300" size={14} />}
                     </div>
                     <p className="text-xs font-bold truncate max-w-[120px] text-slate-700">{participants[0].name}</p>
                  </div>
                  <Badge className="bg-primary text-white border-none font-black text-[8px] tracking-widest px-3 uppercase">Leading</Badge>
               </div>
            )}
         </Card>

         {/* SECTION 2: IMAGES */}
         <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 text-slate-400">{t('account_gallery')}</h3>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x">
               {event.imageUrls.map((url, idx) => (
                  <div key={url + idx} className="relative aspect-[4/3] w-[280px] md:w-[400px] rounded-3xl overflow-hidden shrink-0 snap-center shadow-md border border-slate-100 bg-white">
                     <Image src={url} alt="" fill className="object-cover" unoptimized />
                  </div>
               ))}
            </div>
         </div>

         {/* SECTION 6: DETAILS - Collapsed by default */}
         <Card className="rounded-[2.5rem] bg-white border-slate-100 overflow-hidden shadow-sm">
            <button 
              onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
              className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
               <h3 className="font-headline font-bold uppercase tracking-tight flex items-center gap-3 text-slate-900">
                  <ShieldCheck size={20} className="text-primary" /> Item Details
               </h3>
               {isDetailsExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
            </button>
            {isDetailsExpanded && (
               <div className="px-6 pb-8 space-y-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Game</p>
                        <p className="text-sm font-bold text-slate-900">{event.gameName}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                        <p className="text-sm font-bold text-green-600">Live Auction</p>
                     </div>
                  </div>
                  <div className="prose prose-slate max-w-none">
                     <p className="text-sm md:text-base text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                        {event.details || event.description}
                     </p>
                  </div>
               </div>
            )}
         </Card>

         {/* SECTION 7: LEADERBOARD BUTTON */}
         <button 
           onClick={() => router.push(`/events/${id}/leaderboard`)}
           className="w-full p-6 md:p-10 rounded-[2.5rem] bg-white border border-slate-100 flex items-center justify-between group active:scale-[0.98] transition-all shadow-md"
         >
            <div className="flex items-center gap-6">
               <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                  <Trophy size={32} />
               </div>
               <div className="text-left">
                  <h4 className="font-headline font-bold text-xl uppercase tracking-tight text-slate-900">{t('kaalmaha') || 'Leaderboard'}</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{participants.length} Participants active</p>
               </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all text-slate-300">
               <ChevronRight size={24} />
            </div>
         </button>

         {/* SECTION 8: RULES - Fully visible and simple card at bottom */}
         <Card className="p-8 md:p-12 rounded-[2.5rem] bg-white border-slate-100 shadow-sm space-y-6">
            <h4 className="font-headline font-bold uppercase tracking-tight flex items-center gap-2 text-slate-900">
               <Info size={18} className="text-primary" /> Event Rules
            </h4>
            <ul className="space-y-4 text-sm md:text-base text-slate-600 font-medium">
               <li className="flex gap-3 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" /> 
                  <span>{language === 'so' ? 'Qof walba wuxuu taaban karaa badhanka "GET" mar walba oo ay u dhamaato 2-da daqiiqo.' : 'Everyone can tap the "GET" button every 2 minutes.'}</span>
               </li>
               <li className="flex gap-3 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" /> 
                  <span>{language === 'so' ? 'Taabasho kasta waxay kordhineysaa qiimaha account-ka $0.50.' : 'Every tap increases the account value by $0.50.'}</span>
               </li>
               <li className="flex gap-3 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" /> 
                  <span>{language === 'so' ? 'Qofka ugu taabashada badan marka uu wakhtigu dhamaado ayaa ku guuleysanaya.' : 'The person with the most taps at the end of the timer wins.'}</span>
               </li>
               <li className="flex gap-3 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" /> 
                  <span>{language === 'so' ? 'Hadii qofka guuleystay uu iibsan waayo mudo 24 saacadood ah, qofka labaad ayaa ku guuleysanaya.' : 'If the winner fails to buy within 24 hours, the next in line wins.'}</span>
               </li>
            </ul>
         </Card>
      </main>

      {/* SECTION 4: LIVE TAP FEED */}
      <EventLiveFeed taps={tapFeed} />

      {/* SECTION 5: GET BUTTON AREA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 md:p-8 bg-white/80 backdrop-blur-md border-t border-slate-100 z-[70] md:max-w-4xl md:mx-auto">
         <Card className="p-4 md:p-6 rounded-[2rem] bg-white border-slate-100 shadow-2xl flex flex-col items-center gap-4">
            {!user ? (
               <Button 
                onClick={() => router.push('/login')}
                className="w-full h-14 md:h-20 rounded-2xl bg-primary text-white font-black text-sm md:text-xl uppercase tracking-widest shadow-xl shadow-primary/20"
               >
                  Login si aad u qeybgasho
               </Button>
            ) : isEnded ? (
               <div className="w-full py-4 text-center space-y-1">
                  <p className="text-xl md:text-3xl font-headline font-bold uppercase text-primary">Auction Ended</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Winners are being processed</p>
               </div>
            ) : isUpcoming ? (
               <div className="w-full py-4 text-center space-y-1">
                  <p className="text-xl md:text-3xl font-headline font-bold uppercase text-blue-500">Starts Soon</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Get ready to tap!</p>
               </div>
            ) : (
               <div className="w-full space-y-4">
                  <EventGetButton 
                    onTap={handleTap}
                    cooldown={cooldown}
                    isSyncing={isSyncing}
                    tapPrice={event.tapPrice}
                  />
                  
                  <div className="flex justify-between items-center px-2">
                     <div className="space-y-0.5 text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Taps</p>
                        <p className="text-lg font-headline font-bold text-slate-900">{myStats?.taps || 0} taps = <span className="text-primary">${((myStats?.taps || 0) * event.tapPrice).toFixed(2)}</span></p>
                     </div>
                     <div className="text-right space-y-0.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rank</p>
                        <p className="text-lg font-headline font-bold text-primary">#{myRank || participants.length + 1} / {participants.length}</p>
                     </div>
                  </div>
               </div>
            )}
         </Card>
      </div>
    </div>
  );
}