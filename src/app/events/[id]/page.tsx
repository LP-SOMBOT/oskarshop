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

const EVENT_CACHE_PREFIX = 'oskar_event_cache_';

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
  const [isTapping, setIsTapping] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Local Storage Caching for Event Data
  const [cachedEvent, setCachedEvent] = useState<any>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem(EVENT_CACHE_PREFIX + id);
    return saved ? JSON.parse(saved) : null;
  });

  const event = useMemo(() => {
    const liveEvent = (eventAccounts || []).find(e => e.id === id);
    if (liveEvent) {
      localStorage.setItem(EVENT_CACHE_PREFIX + id, JSON.stringify(liveEvent));
      return liveEvent;
    }
    return cachedEvent;
  }, [eventAccounts, id, cachedEvent]);

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
      
      // Persistence: Check both DB and LocalStorage for the most recent tap
      const localCooldownKey = `oskar_cooldown_${id}_${user?.uid}`;
      const localLastTap = Number(localStorage.getItem(localCooldownKey)) || 0;
      const dbLastTap = myStats?.lastTapTime || 0;
      const effectiveLastTap = Math.max(localLastTap, dbLastTap);

      if (effectiveLastTap) {
        const diff = now - effectiveLastTap;
        const remaining = Math.max(0, 120000 - diff); // 2 minutes cooldown
        setCooldown(remaining);
      } else {
        setCooldown(0);
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
  }, [event, myStats, id, user?.uid]);

  const handleTap = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    const isEndedByTime = event.endTime && Date.now() > event.endTime;
    if (cooldown > 0 || isSyncing || isEndedByTime || isTapping) return;
    
    setIsTapping(true);
    try {
      await tapEventAccount(id as string);
      // Immediately cache the tap timestamp locally to prevent refresh bypass
      if (typeof window !== 'undefined') {
        const localCooldownKey = `oskar_cooldown_${id}_${user.uid}`;
        localStorage.setItem(localCooldownKey, Date.now().toString());
      }
    } finally {
      setIsTapping(false);
    }
  };

  const handleBack = () => {
    setGlobalLoading(true);
    router.push('/#accounts');
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex flex-col gap-4">
         <Skeleton className="h-10 w-10 rounded-xl" />
         <Skeleton className="h-48 w-full rounded-[1.5rem]" />
         <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  const isEnded = event.status === 'ended' || event.status === 'claimed' || (event.endTime && Date.now() > event.endTime);
  const isUpcoming = event.status === 'upcoming';
  const currentPrice = event.initialPrice + ((participants[0]?.taps || 0) * event.tapPrice);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-32 page-transition relative overflow-x-hidden">
      {/* SECTION 1: HEADER */}
      <div className="relative h-[25vh] sm:h-[35vh] w-full overflow-hidden">
         {event.imageUrls?.[0] ? (
            <Image src={event.imageUrls[0]} alt="" fill className="object-cover" unoptimized />
         ) : <div className="w-full h-full bg-slate-200" />}
         <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent" />
         
         <header className="absolute top-0 left-0 right-0 h-16 sm:h-20 flex items-center justify-between px-4 sm:px-6 z-50">
            <button onClick={handleBack} className="w-9 h-9 sm:w-10 sm:h-10 bg-white/80 backdrop-blur-md rounded-xl flex items-center justify-center text-slate-900 border border-slate-200 active:scale-90 transition-all shadow-sm">
               <ArrowLeft size={20} className="sm:size-6" />
            </button>
            <div className="flex items-center gap-2">
               {event.status === 'active' && !isEnded ? (
                 <Badge className="bg-red-500 text-white border-none rounded-full px-2 py-0.5 sm:px-3 sm:py-1 font-black flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                 </Badge>
               ) : (
                 <Badge className="bg-blue-500 text-white border-none rounded-full px-2 py-0.5 sm:px-3 sm:py-1 font-black uppercase text-[8px] sm:text-[10px]">
                    {isEnded ? 'ENDED' : event.status}
                 </Badge>
               )}
            </div>
         </header>

         <div className="absolute bottom-2 left-4 right-4 sm:bottom-4 sm:left-6 sm:right-6">
            <h1 className="text-xl sm:text-2xl md:text-4xl font-headline font-bold uppercase tracking-tight leading-none text-slate-900 truncate">{event.title}</h1>
            <p className="text-primary font-black text-[8px] sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-0.5 sm:mt-1">{event.gameName}</p>
         </div>
      </div>

      <main className="px-4 sm:px-6 space-y-6 sm:space-y-12 max-w-4xl mx-auto relative z-10">
         {/* COUNTDOWN & PRICE */}
         <Card className="p-4 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] bg-white border-slate-100 shadow-xl space-y-6 sm:space-y-8">
            <div className="text-center space-y-1.5 sm:space-y-2">
               <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] sm:tracking-[0.4em]">{isUpcoming ? 'BILAABMAYSA' : isEnded ? 'DHAMMAATAY' : 'ENDS IN'}</p>
               <div className="text-2xl sm:text-4xl md:text-7xl font-headline font-bold tracking-tighter flex items-center justify-center gap-1.5 sm:gap-4 text-slate-900">
                  <div className="bg-slate-50 rounded-xl sm:rounded-3xl w-12 h-12 sm:w-24 sm:h-24 flex items-center justify-center border border-slate-100 text-xl sm:text-5xl md:text-7xl">{timeLeft.h}</div>
                  <span className="opacity-20">:</span>
                  <div className="bg-slate-50 rounded-xl sm:rounded-3xl w-12 h-12 sm:w-24 sm:h-24 flex items-center justify-center border border-slate-100 text-xl sm:text-5xl md:text-7xl">{timeLeft.m}</div>
                  <span className="opacity-20">:</span>
                  <div className="bg-slate-50 rounded-xl sm:rounded-3xl w-12 h-12 sm:w-24 sm:h-24 flex items-center justify-center border border-slate-100 text-xl sm:text-5xl md:text-7xl">{timeLeft.s}</div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6 pt-4 sm:pt-8 border-t border-slate-50">
               <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-[7px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('Qiimaha_Asalka') || 'Initial Price'}</p>
                  <p className="text-base sm:text-3xl font-headline font-bold text-slate-400">${event.initialPrice.toFixed(2)}</p>
               </div>
               <div className="text-right space-y-0.5 sm:space-y-1">
                  <p className="text-[7px] sm:text-[9px] font-black text-primary uppercase tracking-widest">{t('Qiimaha_Hadda') || 'Highest Bid'}</p>
                  <p className="text-xl sm:text-4xl md:text-6xl font-headline font-bold text-primary tracking-tighter">
                    ${currentPrice.toFixed(2)}
                  </p>
               </div>
            </div>

            {participants[0] && (
               <div className="p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                     <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-primary overflow-hidden shrink-0 bg-white">
                        {participants[0].avatar ? <Image src={participants[0].avatar} alt="" width={32} height={32} unoptimized /> : <User className="m-auto text-slate-300" size={12} />}
                     </div>
                     <p className="text-[10px] sm:text-xs font-bold truncate max-w-[100px] sm:max-w-[120px] text-slate-700">{participants[0].name}</p>
                  </div>
                  <Badge className="bg-primary text-white border-none font-black text-[7px] sm:text-[8px] tracking-widest px-2 sm:px-3 uppercase">Leading</Badge>
               </div>
            )}
         </Card>

         {/* SECTION 2: IMAGES */}
         <div className="space-y-3 sm:space-y-4">
            <h3 className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] ml-1 sm:ml-2 text-slate-400">{t('account_gallery')}</h3>
            <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2 sm:pb-4 snap-x">
               {event.imageUrls.map((url, idx) => (
                  <div key={url + idx} className="relative aspect-[4/3] w-[240px] sm:w-[400px] rounded-2xl sm:rounded-3xl overflow-hidden shrink-0 snap-center shadow-md border border-slate-100 bg-white">
                     <Image src={url} alt="" fill className="object-cover" unoptimized />
                  </div>
               ))}
            </div>
         </div>

         {/* SECTION 6: DETAILS */}
         <Card className="rounded-[1.5rem] sm:rounded-[2.5rem] bg-white border-slate-100 overflow-hidden shadow-sm">
            <button 
              onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
              className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
               <h3 className="font-headline font-bold uppercase tracking-tight flex items-center gap-2 sm:gap-3 text-slate-900 text-sm sm:text-base">
                  <ShieldCheck size={18} className="text-primary sm:size-5" /> Item Details
               </h3>
               {isDetailsExpanded ? <ChevronUp size={18} className="text-slate-400 sm:size-5" /> : <ChevronDown size={18} className="text-slate-400 sm:size-5" />}
            </button>
            {isDetailsExpanded && (
               <div className="px-4 sm:px-6 pb-6 sm:pb-8 space-y-4 sm:space-y-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                     <div className="space-y-0.5">
                        <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Game</p>
                        <p className="text-xs sm:text-sm font-bold text-slate-900">{event.gameName}</p>
                     </div>
                     <div className="space-y-0.5">
                        <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                        <p className="text-xs sm:text-sm font-bold text-green-600">Live Auction</p>
                     </div>
                  </div>
                  <div className="prose prose-slate max-w-none">
                     <p className="text-[11px] sm:text-base text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                        {event.details || event.description}
                     </p>
                  </div>
               </div>
            )}
         </Card>

         {/* SECTION 7: LEADERBOARD BUTTON */}
         <button 
           onClick={() => router.push(`/events/${id}/leaderboard`)}
           className="w-full p-4 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] bg-white border border-slate-100 flex items-center justify-between group active:scale-[0.98] transition-all shadow-md"
         >
            <div className="flex items-center gap-4 sm:gap-6 min-w-0">
               <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                  <Trophy size={20} className="sm:size-8" />
               </div>
               <div className="text-left min-w-0">
                  <h4 className="font-headline font-bold text-sm sm:text-xl uppercase tracking-tight text-slate-900">{t('kaalmaha') || 'Leaderboard'}</h4>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest truncate">{participants.length} Participants active</p>
               </div>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all text-slate-300 shrink-0">
               <ChevronRight size={20} className="sm:size-6" />
            </div>
         </button>

         {/* SECTION 8: RULES */}
         <Card className="p-6 sm:p-12 rounded-[1.5rem] sm:rounded-[2.5rem] bg-white border-slate-100 shadow-sm space-y-4 sm:space-y-6">
            <h4 className="font-headline font-bold uppercase tracking-tight flex items-center gap-2 text-slate-900 text-sm sm:text-lg">
               <Info size={16} className="text-primary sm:size-[18px]" /> Event Rules
            </h4>
            <ul className="space-y-3 sm:space-y-4 text-xs sm:text-base text-slate-600 font-medium">
               <li className="flex gap-2.5 sm:gap-3 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" /> 
                  <span>{language === 'so' ? 'Qof walba wuxuu taaban karaa badhanka "GET" mar walba oo ay u dhamaato 2-da daqiiqo.' : 'Everyone can tap the "GET" button every 2 minutes.'}</span>
               </li>
               <li className="flex gap-2.5 sm:gap-3 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" /> 
                  <span>{language === 'so' ? 'Taabasho kasta waxay kordhineysaa qiimaha account-ka $0.50.' : 'Every tap increases the account value by $0.50.'}</span>
               </li>
               <li className="flex gap-2.5 sm:gap-3 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" /> 
                  <span>{language === 'so' ? 'Qofka ugu taabashada badan marka uu wakhtigu dhamaado ayaa ku guuleysanaya.' : 'The person with the most taps at the end of the timer wins.'}</span>
               </li>
               <li className="flex gap-2.5 sm:gap-3 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" /> 
                  <span>{language === 'so' ? 'Hadii qofka guuleystay uu iibsan waayo mudo 24 saacadood ah, qofka labaad ayaa ku guuleysanaya.' : 'If the winner fails to buy within 24 hours, the next in line wins.'}</span>
               </li>
            </ul>
         </Card>
      </main>

      {/* SECTION 4: LIVE TAP FEED */}
      <EventLiveFeed taps={tapFeed} />

      {/* SECTION 5: GET BUTTON AREA */}
      <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-8 bg-white/80 backdrop-blur-md border-t border-slate-100 z-[70]">
         <div className="max-w-4xl mx-auto">
            <Card className="p-3 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] bg-white border-slate-100 shadow-2xl flex flex-col items-center gap-3 sm:gap-4">
               {!user ? (
                  <Button 
                   onClick={() => router.push('/login')}
                   className="w-full h-12 sm:h-20 rounded-xl sm:rounded-2xl bg-primary text-white font-black text-xs sm:text-xl uppercase tracking-widest shadow-xl shadow-primary/20"
                  >
                     Login si aad u qeybgasho
                  </Button>
               ) : isEnded ? (
                  <div className="w-full py-2 sm:py-4 text-center space-y-0.5 sm:space-y-1">
                     <p className="text-lg sm:text-3xl font-headline font-bold uppercase text-primary">Auction Ended</p>
                     <p className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Winners are being processed</p>
                  </div>
               ) : isUpcoming ? (
                  <div className="w-full py-2 sm:py-4 text-center space-y-0.5 sm:space-y-1">
                     <p className="text-lg sm:text-3xl font-headline font-bold uppercase text-blue-500">Starts Soon</p>
                     <p className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Get ready to tap!</p>
                  </div>
               ) : (
                  <div className="w-full space-y-3 sm:space-y-4">
                     <EventGetButton 
                       onTap={handleTap}
                       cooldown={cooldown}
                       isSyncing={isSyncing}
                       isTapping={isTapping}
                       tapPrice={event.tapPrice}
                     />
                     
                     <div className="flex justify-between items-center px-1 sm:px-2">
                        <div className="space-y-0 text-left min-w-0 flex-1">
                           <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] sm:tracking-widest">Your Taps</p>
                           <p className="text-xs sm:text-lg font-headline font-bold text-slate-900 truncate">
                              {myStats?.taps || 0} taps = <span className="text-primary">${((myStats?.taps || 0) * event.tapPrice).toFixed(2)}</span>
                           </p>
                        </div>
                        <div className="text-right space-y-0 shrink-0 ml-4">
                           <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] sm:tracking-widest">Rank</p>
                           <p className="text-xs sm:text-lg font-headline font-bold text-primary">
                              #{myRank || participants.length + 1} <span className="text-slate-300 font-normal text-[10px] sm:text-sm">/ {participants.length}</span>
                           </p>
                        </div>
                     </div>
                  </div>
               )}
            </Card>
         </div>
      </div>
    </div>
  );
}