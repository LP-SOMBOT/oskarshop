'use client';

import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { useState, useEffect, useMemo, useRef } from 'react';
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
  Loader2,
  CheckCircle2,
  X,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn, formatWhatsAppNumber } from '@/lib/utils';
import Image from 'next/image';
import { ref, onValue, off, limitToLast, query } from 'firebase/database';
import { useDatabase } from '@/firebase';
import { format } from 'date-fns';
import EventGetButton from '@/components/events/EventGetButton';
import EventLiveFeed from '@/components/events/EventLiveFeed';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

const EVENT_CACHE_PREFIX = 'oskar_event_cache_';
const EVENT_AGREEMENT_PREFIX = 'oskar_event_agreed_';
const EVENT_PHONE_PREFIX = 'oskar_event_phone_';

export default function EventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { eventAccounts, tapEventAccount, user, setGlobalLoading, t, language, updateEventStatus } = useApp();
  const rtdb = useDatabase();

  const [timeLeft, setTimeLeft] = useState({ h: '00', m: '00', s: '00' });
  const [participants, setParticipants] = useState<any[]>([]);
  const [tapFeed, setTapFeed] = useState<any[]>([]);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  const [isTapping, setIsTapping] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [hasCheckedAgreement, setHasCheckedAgreement] = useState(false);
  const [providedPhone, setProvidedPhone] = useState("");

  const transitionTriggered = useRef(false);

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

  useEffect(() => {
    if (user && id) {
      const agreed = localStorage.getItem(`${EVENT_AGREEMENT_PREFIX}${id}_${user.uid}`);
      if (!agreed) {
        // Disclaimer is shown first
      } else {
        const storedPhone = localStorage.getItem(`${EVENT_PHONE_PREFIX}${id}_${user.uid}`);
        if (storedPhone) setProvidedPhone(storedPhone);
      }
    }
  }, [user, id]);

  useEffect(() => {
    if (!rtdb || !id) return;

    const partRef = ref(rtdb, `eventParticipants/${id}`);
    const feedRef = query(ref(rtdb, `eventTaps/${id}`), limitToLast(1));

    const partUnsub = onValue(partRef, (snap) => {
      const data = snap.val();
      if (data) {
        setParticipants(Object.values(data).sort((a: any, b: any) => {
          if (b.taps !== a.taps) return b.taps - a.taps;
          return a.lastTapTime - b.lastTapTime;
        }));
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
      partUnsub();
      feedUnsub();
    };
  }, [rtdb, id]);

  useEffect(() => {
    if (!event || event.status === 'ended' || event.status === 'claimed') return;

    const timer = setInterval(() => {
      const now = Date.now();
      
      const localCooldownKey = `oskar_cooldown_${id}_${user?.uid}`;
      const localLastTap = Number(localStorage.getItem(localCooldownKey)) || 0;
      const dbLastTap = myStats?.lastTapTime || 0;
      const effectiveLastTap = Math.max(localLastTap, dbLastTap);

      if (effectiveLastTap) {
        const diff = now - effectiveLastTap;
        const remaining = Math.max(0, 120000 - diff); 
        setCooldown(remaining);
      } else {
        setCooldown(0);
      }

      const isUpcoming = event.status === 'upcoming' || (event.startTime && now < event.startTime);
      const targetTime = isUpcoming ? event.startTime : event.endTime;
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft({ h: '00', m: '00', s: '00' });
        
        if (!transitionTriggered.current) {
           if (event.status === 'upcoming') {
             transitionTriggered.current = true;
             updateEventStatus(event.id, 'active');
           } else if (event.status === 'active') {
             transitionTriggered.current = true;
             updateEventStatus(event.id, 'ended');
           }
        }
        return;
      }

      transitionTriggered.current = false;

      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % (3600000) / 60000)).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setTimeLeft({ h, m, s });
    }, 1000);

    return () => clearInterval(timer);
  }, [event, myStats, id, user?.uid, updateEventStatus]);

  const handleTap = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Check for Disclaimer Acceptance first
    const agreed = localStorage.getItem(`${EVENT_AGREEMENT_PREFIX}${id}_${user.uid}`);
    if (!agreed) {
      setShowDisclaimer(true);
      return;
    }

    // Check for Event-Specific Phone Number (Separate Modal)
    const phoneToUse = providedPhone || localStorage.getItem(`${EVENT_PHONE_PREFIX}${id}_${user.uid}`);
    if (!phoneToUse || phoneToUse.length < 9) {
       setShowPhonePrompt(true);
       return;
    }

    const isEndedByTime = event.endTime && Date.now() > event.endTime;
    if (cooldown > 0 || isSyncing || isEndedByTime || isTapping || event.status !== 'active') return;
    
    setIsTapping(true);
    try {
      await tapEventAccount(id as string, phoneToUse);
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

  const handleDisclaimerJoin = () => {
    if (!hasCheckedAgreement || !user || !id) return;
    localStorage.setItem(`${EVENT_AGREEMENT_PREFIX}${id}_${user.uid}`, 'true');
    setShowDisclaimer(false);
    
    // Check if phone number is needed after disclaimer
    const storedPhone = localStorage.getItem(`${EVENT_PHONE_PREFIX}${id}_${user.uid}`);
    if (!storedPhone) {
      setShowPhonePrompt(true);
    }
  };

  const handlePhoneSubmit = () => {
    const cleanPhone = providedPhone.replace(/\D/g, "");
    if (cleanPhone.length < 9) {
       toast({ title: "WhatsApp Number Required", description: "Fadlan geli number-kaaga WhatsApp ka si aad u qeybgasho.", variant: "destructive" });
       return;
    }

    const fullPhone = cleanPhone.startsWith('252') ? `+${cleanPhone}` : `+252${cleanPhone}`;
    localStorage.setItem(`${EVENT_PHONE_PREFIX}${id}_${user.uid}`, fullPhone);
    setProvidedPhone(fullPhone);
    setShowPhonePrompt(false);
    toast({ title: "Joined Event!", description: "You can now start bidding." });
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 flex flex-col gap-4">
         <Skeleton className="h-10 w-10 rounded-xl" />
         <Skeleton className="h-48 w-full rounded-[1.5rem]" />
         <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  const now = Date.now();
  const isUpcoming = event.status === 'upcoming' || (event.startTime && now < event.startTime);
  const isEnded = event.status === 'ended' || event.status === 'claimed' || (event.endTime && now > event.endTime);
  
  const currentPrice = event.initialPrice + ((participants[0]?.taps || 0) * event.tapPrice);

  const images = event.imageUrls || [];
  const hasMultipleImages = images.length > 1;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-40 page-transition relative overflow-x-hidden">
      <div className="relative h-[25vh] sm:h-[35vh] w-full overflow-hidden">
         {images[0] ? (
            <Image src={images[0]} alt="" fill className="object-cover" unoptimized />
         ) : <div className="w-full h-full bg-slate-200 dark:bg-slate-800" />}
         <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-slate-950 via-transparent to-transparent" />
         
         <header className="absolute top-0 left-0 right-0 h-16 sm:h-20 flex items-center justify-between px-4 sm:px-6 z-50">
            <button onClick={handleBack} className="w-9 h-9 sm:w-10 sm:h-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-xl flex items-center justify-center text-slate-900 dark:text-white border border-slate-200 dark:border-white/5 active:scale-90 transition-all shadow-sm">
               <ArrowLeft size={20} className="sm:size-6" />
            </button>
            <div className="flex items-center gap-2">
               {event.status === 'active' && !isEnded && (
                 <Badge className="bg-red-500 text-white border-none rounded-full px-2 py-0.5 sm:px-3 sm:py-1 font-black flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                 </Badge>
               )}
            </div>
         </header>

         <div className="absolute bottom-2 left-4 right-4 sm:bottom-4 sm:left-6 sm:right-6">
            <h1 className="text-xl sm:text-2xl md:text-4xl font-headline font-bold uppercase tracking-tight leading-none text-slate-900 dark:text-white truncate">{event.title}</h1>
            <p className="text-primary font-black text-[8px] sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-0.5 sm:mt-1">{event.gameName}</p>
         </div>
      </div>

      <main className="px-4 sm:px-6 space-y-6 sm:space-y-12 max-w-4xl mx-auto relative z-10 pb-40">
         <Card className="p-4 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-xl space-y-6 sm:space-y-8">
            <div className="text-center space-y-1.5 sm:space-y-2">
               <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] sm:tracking-[0.4em]">{isUpcoming ? 'BILAABMAYSA' : isEnded ? 'DHAMMAATAY' : 'ENDS IN'}</p>
               <div className="text-2xl sm:text-4xl md:text-7xl font-headline font-bold tracking-tighter flex items-center justify-center gap-1.5 sm:gap-4 text-slate-900 dark:text-white">
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl sm:rounded-3xl w-12 h-12 sm:w-24 sm:h-24 flex items-center justify-center border border-slate-100 dark:border-white/5 text-xl sm:text-5xl md:text-7xl">{timeLeft.h}</div>
                  <span className="opacity-20">:</span>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl sm:rounded-3xl w-12 h-12 sm:w-24 sm:h-24 flex items-center justify-center border border-slate-100 dark:border-white/5 text-xl sm:text-5xl md:text-7xl">{timeLeft.m}</div>
                  <span className="opacity-20">:</span>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl sm:rounded-3xl w-12 h-12 sm:w-24 sm:h-24 flex items-center justify-center border border-slate-100 dark:border-white/5 text-xl sm:text-5xl md:text-7xl">{timeLeft.s}</div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6 pt-4 sm:pt-8 border-t border-slate-50 dark:border-white/5">
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
               <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                     <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-primary overflow-hidden shrink-0 bg-white dark:bg-slate-900">
                        {participants[0].avatar ? <Image src={participants[0].avatar} alt="" width={32} height={32} unoptimized /> : <User className="m-auto text-slate-300" size={12} />}
                     </div>
                     <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs font-bold truncate max-w-[100px] sm:max-w-[120px] text-slate-700 dark:text-slate-300">{participants[0].name}</p>
                        <p className="text-[8px] font-black text-primary uppercase tracking-widest mt-0.5">
                           {participants[0].taps} BID • ${participants[0].value.toFixed(2)}
                        </p>
                     </div>
                  </div>
                  <Badge className="bg-primary text-white border-none font-black text-[7px] sm:text-[8px] tracking-widest px-2 sm:px-3 uppercase shadow-md shadow-primary/20">ugu sareeya</Badge>
               </div>
            )}
         </Card>

         {hasMultipleImages && (
           <div className="space-y-3 sm:space-y-4">
              <h3 className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] ml-1 sm:ml-2 text-slate-400">
                sawirda ciwaanka
              </h3>
              <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2 sm:pb-4 snap-x">
                 {images.map((url: string, idx: number) => (
                    <div key={url + idx} className="relative aspect-[4/3] w-[240px] sm:w-[400px] rounded-2xl sm:rounded-3xl overflow-hidden shrink-0 snap-center shadow-md border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-800">
                       <Image src={url} alt="" fill className="object-cover" unoptimized />
                    </div>
                 ))}
              </div>
           </div>
         )}

         <Card className="rounded-[1.5rem] sm:rounded-[2.5rem] bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 overflow-hidden shadow-sm">
            <button 
              onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
              className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
               <h3 className="font-headline font-bold uppercase tracking-tight flex items-center gap-2 sm:gap-3 text-slate-900 dark:text-white text-sm sm:text-base">
                  <ShieldCheck size={18} className="text-primary sm:size-5" /> Account Details
               </h3>
               {isDetailsExpanded ? <ChevronUp size={18} className="text-slate-400 sm:size-5" /> : <ChevronDown size={18} className="text-slate-400 sm:size-5" />}
            </button>
            {isDetailsExpanded && (
               <div className="px-4 sm:px-6 pb-6 sm:pb-8 space-y-4 sm:space-y-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-0.5">
                     <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Game</p>
                     <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{event.gameName}</p>
                  </div>
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                     <p className="text-[11px] sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                        {event.details || event.description}
                     </p>
                  </div>
               </div>
            )}
         </Card>

         <button 
           onClick={() => router.push(`/events/${id}/leaderboard`)}
           className="w-full p-4 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 flex items-center justify-between group active:scale-[0.98] transition-all shadow-md"
         >
            <div className="flex items-center gap-4 sm:gap-6 min-w-0">
               <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                  <Trophy size={20} className="sm:size-8" />
               </div>
               <div className="text-left min-w-0">
                  <h4 className="font-headline font-bold text-sm sm:text-xl uppercase tracking-tight text-slate-900 dark:text-white">
                    {language === 'so' ? 'kaalmaha' : (t('kaalmaha') || 'Leaderboard')}
                  </h4>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest truncate">{participants.length} Participants active</p>
               </div>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all text-slate-300 dark:text-slate-600 shrink-0">
               <ChevronRight size={20} className="sm:size-6" />
            </div>
         </button>

         <Card className="p-6 sm:p-12 rounded-[1.5rem] sm:rounded-[2.5rem] bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-sm space-y-8">
            <div className="space-y-4">
              <h4 className="font-headline font-bold uppercase tracking-tight flex items-center gap-2 text-slate-900 dark:text-white text-sm sm:text-lg">
                 <Info size={16} className="text-primary sm:size-[18px]" /> Event rules
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {language === 'so' ? (
                  <div className="space-y-4 col-span-full">
                    <ul className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                       <li className="flex gap-2.5 items-start">
                          <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[8px] font-black shrink-0">1</span> 
                          <span>badhanka <strong className="text-primary">"BID GAREE"</strong> mar hadaa taabatid waa inaa sugta 2 daqiiqo inta taabanin mar kale.</span>
                       </li>
                       <li className="flex gap-2.5 items-start">
                          <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[8px] font-black shrink-0">2</span> 
                          <span>mar kista aa taabatid badhanka <strong className="text-primary">"BID GAREE"</strong> Qiimaha account lagu gadaayo kor ayuu u kaca qiimaha ${event.tapPrice.toFixed(2)}.</span>
                       </li>
                       <li className="flex gap-2.5 items-start">
                          <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[8px] font-black shrink-0">3</span> 
                          <span>Bid ka waqtigiisa marku dhamaado qof UGU sareeya <strong className="text-primary">"BIDKA"</strong> wuu inu baxiya qiimahaas.</span>
                       </li>
                       <li className="flex gap-2.5 items-start">
                          <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[8px] font-black shrink-0">4</span> 
                          <span>12 saac gudahooda hadaa ku baxi weyso lacgta, qof ku kale ku xego kalinta ayuu u gudba.</span>
                       </li>
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-4 col-span-full">
                    <ul className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                      {[
                        "Participants must use only one valid account.",
                        "Every click on the \"BID GAREE\" button places one valid bid.",
                        "Each valid bid increases the auction price by the displayed amount.",
                        "All bid fees are final and non-refundable.",
                        "If a valid bid is placed within the last 2 seconds, the countdown timer will reset to 2 seconds.",
                        "The participant with the highest valid bid when the timer reaches 0 will be declared the winner.",
                        "The winner must complete payment within the specified time or may forfeit the winning position.",
                        "The use of bots, scripts, fake accounts, or any unfair method is strictly prohibited.",
                        "The organizer reserves the right to suspend, extend, restart, or cancel any auction if necessary to ensure fairness and security.",
                        "Any participant who violates these rules may be disqualified, have their bids canceled, or have their account permanently suspended.",
                        "The organizer's decisions regarding the auction are final, except where otherwise required by applicable law."
                      ].map((rule, i) => (
                        <li key={i} className="flex gap-2.5 items-start">
                          <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[8px] font-black shrink-0">{i+1}</span>
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
         </Card>
      </main>

      <EventLiveFeed taps={tapFeed} />

      <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-8 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-t border-slate-100 dark:border-white/5 z-[70]">
         <div className="max-w-4xl mx-auto">
            <Card className="p-3 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-2xl flex flex-col items-center gap-3 sm:gap-4">
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
                     <p className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Get ready to bid!</p>
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
                           <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] sm:tracking-widest">Your Bid</p>
                           <p className="text-xs sm:text-lg font-headline font-bold text-slate-900 dark:text-white truncate">
                              {myStats?.taps || 0} bid = <span className="text-primary">${((myStats?.taps || 0) * event.tapPrice).toFixed(2)}</span>
                           </p>
                        </div>
                        <div className="text-right space-y-0 shrink-0 ml-4">
                           <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] sm:tracking-widest">Rank</p>
                           <p className="text-xs sm:text-lg font-headline font-bold text-primary">
                              #{myRank || participants.length + 1} <span className="text-slate-300 dark:text-slate-700 font-normal text-[10px] sm:text-sm">/ {participants.length}</span>
                           </p>
                        </div>
                     </div>
                  </div>
               )}
            </Card>
         </div>
      </div>

      {/* MODAL 1: Disclaimer (Accepted Once per Event) */}
      <Dialog open={showDisclaimer} onOpenChange={() => {}}>
        <DialogContent className="w-[94%] max-w-lg rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden p-0 animate-in zoom-in duration-300">
           <DialogHeader className="bg-primary p-6 sm:p-10 text-white text-center">
              <ShieldCheck className="w-12 h-12 sm:size-16 mx-auto mb-4" />
              <DialogTitle className="text-lg sm:text-xl md:text-2xl font-headline font-bold uppercase tracking-tight leading-tight">ACCOUNT BID – AGREEMENT</DialogTitle>
              <DialogDescription className="text-white/60 text-[10px] uppercase tracking-widest mt-1">Please read carefully</DialogDescription>
           </DialogHeader>
           
           <div className="p-6 sm:p-10 space-y-6 max-h-[50vh] overflow-y-auto scrollbar-hide">
              <ul className="space-y-4 text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 font-medium">
                 {[
                   "I have read and agree to the Account Bid – Event Rules.",
                   "I understand that every bid is final and non-refundable.",
                   "I understand that placing a bid does not guarantee that I will win.",
                   "I agree not to use bots, scripts, or any unfair methods.",
                   "If I win, I agree to complete payment within the required time.",
                   "The organizer's decisions regarding the auction are final."
                 ].map((item, i) => (
                   <li key={i} className="flex gap-2 items-start">
                      <span className="font-black text-primary shrink-0">{i+1}:</span>
                      <span>{item}</span>
                   </li>
                 ))}
              </ul>

              <div className="flex items-center space-x-3 px-2 pt-2">
                 <Checkbox 
                   id="agree-event" 
                   checked={hasCheckedAgreement} 
                   onCheckedChange={(v) => setHasCheckedAgreement(!!v)}
                 />
                 <label htmlFor="agree-event" className="text-[11px] sm:text-sm font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
                    I have read & accept the rules
                 </label>
              </div>
           </div>

           <DialogFooter className="p-6 sm:p-10 pt-0 flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleDisclaimerJoin}
                disabled={!hasCheckedAgreement}
                className="w-full sm:flex-[2] h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs shadow-xl active:scale-95"
              >
                 Accept & Continue
              </Button>
              <Button variant="ghost" onClick={handleBack} className="w-full sm:flex-1 h-14 rounded-2xl text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                 Cancel
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Phone Prompt (Triggered after acceptance or if number is missing) */}
      <Dialog open={showPhonePrompt} onOpenChange={() => {}}>
        <DialogContent className="w-[94%] max-w-sm rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden p-0 animate-in slide-in-from-bottom-8 duration-300">
           <DialogHeader className="bg-amber-500 p-6 sm:p-8 text-white text-center">
              <Smartphone className="w-10 h-10 mx-auto mb-3" />
              <DialogTitle className="text-xl font-headline font-bold uppercase tracking-tight">Xogta WhatsApp</DialogTitle>
              <DialogDescription className="text-white/70 text-[10px] uppercase font-black tracking-widest">Numbarka kugu habboon</DialogDescription>
           </DialogHeader>

           <div className="p-6 sm:p-8 space-y-6">
              <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">WhatsApp Number for this Event</Label>
                 <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10 pointer-events-none">
                       <span className="font-bold text-xs text-gray-400 border-r border-slate-200 pr-3">+252</span>
                    </div>
                    <Input 
                      type="tel"
                      placeholder="613982172"
                      value={providedPhone.replace("+252", "")}
                      onChange={e => setProvidedPhone(e.target.value.replace(/\D/g, '').substring(0, 9))}
                      className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none pl-16 font-bold text-lg shadow-inner focus-visible:ring-amber-500"
                    />
                 </div>
                 <p className="text-[10px] font-bold text-slate-400 italic leading-relaxed text-center">
                    Admin-ka ayaa number-kan kaala soo xiriiri doona haddii aad guuleysato.
                 </p>
              </div>

              <Button 
                onClick={handlePhoneSubmit}
                disabled={providedPhone.replace(/\D/g, '').length < 9}
                className="w-full h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
              >
                 Start Bidding Now
              </Button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
