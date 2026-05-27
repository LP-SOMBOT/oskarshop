
"use client";

import { useState, useMemo, useEffect } from "react";
import AnnouncementTicker from "@/components/home/AnnouncementTicker";
import HeroSlider from "@/components/home/HeroSlider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/lib/context";
import { cn } from "@/lib/utils";
import { 
  Flame, 
  Trophy, 
  Radio, 
  ExternalLink, 
  Zap, 
  X,
  ChevronRight,
  Star,
  Gamepad2,
  Calendar,
  ShoppingBag,
  Clock
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function HomeView() {
  const { storeSettings, games, events, setActiveTab, isInitialLoading, t } = useApp();
  const [localDismiss, setLocalDismiss] = useState(false);
  const router = useRouter();

  const isVisible = storeSettings?.isLive && !localDismiss;

  const activeEvents = useMemo(() => {
    const now = Date.now();
    return (events || []).filter(e => e.active && (!e.expiresAt || e.expiresAt > now));
  }, [events]);

  if (isInitialLoading) {
    return (
      <div className="pb-24 animate-in fade-in duration-500">
        <AnnouncementTicker />
        <main className="container mx-auto px-4 pt-4 md:pt-6 space-y-8 md:space-y-12 w-full max-w-[1100px] xl:max-w-[1400px] 2xl:max-w-[1800px] min-[2000px]:max-w-[2200px]">
          <Skeleton className="w-full aspect-[21/9] md:aspect-[3/1] rounded-[1.5rem] md:rounded-[2.5rem]" />
          <section>
            <div className="flex justify-between mb-4 md:mb-6">
              <Skeleton className="h-6 md:h-8 w-32 md:w-48 rounded-lg" />
            </div>
            <div className="space-y-3 md:space-y-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 md:h-24 w-full rounded-xl md:rounded-2xl" />)}
            </div>
          </section>
        </main>
      </div>
    );
  }

  const handleGameRedirect = (gameId: string) => {
    setActiveTab('games');
    window.location.hash = `#games-${gameId}`;
  };

  return (
    <div className="pb-24 page-transition">
      <AnnouncementTicker />
      
      <main className="container mx-auto px-4 pt-4 md:pt-6 lg:pt-10 space-y-8 md:space-y-12 lg:space-y-20 w-full max-w-[1100px] xl:max-w-[1400px] 2xl:max-w-[1800px] min-[2000px]:max-w-[2400px] min-[3000px]:max-w-[3200px] min-[4000px]:max-w-[4000px]">
        {/* Main Hero Slider */}
        <section className="relative">
          <HeroSlider />
        </section>

        {/* Live TikTok Promo */}
        {isVisible && (
          <section className="relative bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl rounded-[1.5rem] md:rounded-[2.5rem] lg:rounded-[3.5rem] p-5 md:p-10 lg:p-14 border border-gray-100 dark:border-white/5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-700">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 md:top-4 md:right-4 h-8 w-8 lg:h-10 lg:w-10 rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors z-10"
              onClick={() => setLocalDismiss(true)}
            >
              <X className="w-4 h-4 lg:w-5 lg:h-5" />
            </Button>
            <div className="flex items-center gap-4 md:gap-8 lg:gap-14 w-full md:w-auto">
              <div className="relative shrink-0">
                <div className="w-14 h-14 md:w-20 md:h-20 lg:w-32 lg:h-32 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center ring-4 lg:ring-8 ring-red-50 dark:ring-red-950/20">
                  <Radio className="w-6 h-6 md:w-10 md:h-10 lg:w-16 lg:h-16 text-red-500 animate-pulse" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[7px] md:text-[10px] lg:text-[14px] px-1.5 py-0.5 md:px-2 md:py-1 rounded-full font-bold uppercase border-2 lg:border-4 border-white dark:border-slate-900 shadow-lg">
                  Live
                </div>
              </div>
              <div className="space-y-0.5 md:space-y-1">
                <h3 className="font-headline font-bold text-lg md:text-3xl lg:text-5xl text-slate-900 dark:text-white leading-tight">Oskar is LIVE</h3>
                <p className="text-[10px] md:text-sm lg:text-xl text-muted-foreground font-medium max-w-[200px] md:max-w-2xl leading-tight">Join our TikTok for exclusive deals!</p>
              </div>
            </div>
            <Button 
              className="bg-[#FE2C55] hover:bg-[#FE2C55]/90 rounded-xl md:rounded-2xl px-6 md:px-8 h-10 md:h-16 lg:h-20 gap-2 font-bold w-full md:w-auto shadow-xl shadow-[#FE2C55]/30 text-xs md:text-base active:scale-95 transition-transform"
              onClick={() => {
                const url = storeSettings?.helpLinks?.tiktokUrl || 'https://tiktok.com/@Oskarshop';
                window.open(url, '_blank');
              }}
            >
              <ExternalLink className="w-3.5 h-3.5 md:w-5 md:h-5 lg:w-7 lg:h-7" /> Watch Now
            </Button>
          </section>
        )}

        {/* Game Collections */}
        <section>
          <div className="flex items-center gap-2 md:gap-4 mb-4 md:mb-6 lg:mb-10 min-[2500px]:mb-16">
            <div className="p-1.5 md:p-3 lg:p-5 bg-primary/10 rounded-lg md:rounded-2xl lg:rounded-3xl">
              <Gamepad2 className="w-4 h-4 md:w-8 md:h-8 lg:w-12 lg:h-12 min-[3000px]:w-16 min-[3000px]:h-16 text-primary" />
            </div>
            <h2 className="text-lg md:text-3xl lg:text-5xl min-[3000px]:text-7xl font-headline font-bold text-slate-900 dark:text-white uppercase tracking-tight">{t('select_game')}</h2>
          </div>
          
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[2500px]:grid-cols-6 min-[3500px]:grid-cols-8 min-[4500px]:grid-cols-10 gap-2.5 md:gap-4 lg:gap-8 min-[2500px]:gap-12">
            {games.filter(g => g.category === 'top-up').map((game) => (
              <GameCollectionCard 
                key={game.id} 
                game={game} 
                onClick={() => handleGameRedirect(game.id)} 
                buyLabel={t('buy_button')}
              />
            ))}
          </div>
        </section>

        {/* Live Events */}
        {activeEvents.length > 0 && (
          <section className="space-y-4 md:space-y-8 lg:space-y-16 min-[2500px]:space-y-24">
            <div className="flex items-center gap-2 md:gap-5">
              <div className="p-1.5 md:p-3 lg:p-5 bg-blue-100 dark:bg-blue-500/10 rounded-lg md:rounded-2xl lg:rounded-3xl">
                <Flame className="w-4 h-4 md:w-8 md:h-8 lg:w-12 lg:h-12 min-[3000px]:w-16 min-[3000px]:h-16 text-blue-500" />
              </div>
              <div>
                <h2 className="text-lg md:text-3xl lg:text-5xl min-[3000px]:text-7xl font-headline font-bold text-slate-900 dark:text-white uppercase tracking-tight">{t('active_events')}</h2>
                <p className="text-[9px] md:text-sm lg:text-lg min-[3000px]:text-2xl text-muted-foreground font-medium uppercase tracking-[0.2em] mt-0.5">{t('take_advantage')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-[2000px]:grid-cols-5 min-[3000px]:grid-cols-6 gap-4 md:gap-8 xl:gap-12 min-[2500px]:gap-16">
              {activeEvents.map((event) => (
                <EventCard key={event.id} event={event} viewLabel={t('view')} timeLeftLabel={t('time_left')} />
              ))}
            </div>
          </section>
        )}

        {/* Global Ranking Quick Link */}
        <section className="pt-2 md:pt-6 lg:pt-16">
          <div 
            onClick={() => setActiveTab('ranking')} 
            className="w-full p-5 xs:p-6 sm:p-10 md:p-14 lg:p-20 xl:p-24 min-[3000px]:p-32 rounded-[1.5rem] md:rounded-[3rem] lg:rounded-[4rem] min-[3000px]:rounded-[6rem] bg-primary text-white flex flex-col md:flex-row items-center justify-between group cursor-pointer shadow-xl active:scale-[0.98] transition-all relative overflow-hidden text-center md:text-left"
          >
            <div className="flex items-center gap-5 sm:gap-8 lg:gap-14 min-[3000px]:gap-24 flex-col md:flex-row max-w-5xl lg:max-w-7xl">
               <div className="w-14 h-14 sm:w-20 sm:h-20 lg:w-32 xl:w-40 min-[3000px]:w-64 min-[3000px]:h-64 bg-white/10 rounded-2xl md:rounded-3xl lg:rounded-[2.5rem] min-[3000px]:rounded-[4rem] flex items-center justify-center text-white shrink-0 shadow-inner">
                  <Trophy className="w-7 h-7 sm:w-10 sm:h-10 lg:w-16 xl:w-20 min-[3000px]:w-32 min-[3000px]:h-32" />
               </div>
               <div className="space-y-1 sm:space-y-2 lg:space-y-4 min-[3000px]:space-y-8">
                  <h3 className="text-xl sm:text-3xl lg:text-5xl xl:text-6xl min-[3000px]:text-8xl font-headline font-bold tracking-tight uppercase leading-none">{t('ranking')}</h3>
                  <p className="text-white/80 text-[11px] xs:text-xs sm:text-base lg:text-xl xl:text-2xl min-[3000px]:text-4xl font-medium leading-relaxed max-w-3xl lg:max-w-5xl">
                    {t('ranking_desc')}
                  </p>
               </div>
            </div>
            <div className="mt-8 md:mt-0 self-center w-12 h-12 sm:w-16 sm:h-16 lg:w-24 xl:w-32 min-[3000px]:w-48 min-[3000px]:h-48 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all shadow-lg shrink-0">
               <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 xl:w-16 min-[3000px]:w-24 min-[3000px]:h-24 group-hover:translate-x-1 transition-transform" />
            </div>
            
            {/* Background Decorative Element */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 md:w-80 md:h-80 min-[3000px]:w-[500px] min-[3000px]:h-[500px] bg-white/5 rounded-full blur-3xl pointer-events-none" />
          </div>
        </section>
      </main>
    </div>
  );
}

function EventCard({ event, viewLabel, timeLeftLabel }: { event: any, viewLabel: string, timeLeftLabel: string }) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!event.expiresAt) return;
    const updateTimer = () => {
      const now = Date.now();
      const diff = event.expiresAt! - now;
      if (diff <= 0) {
        setTimeLeft("Dhamaaday");
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(days > 0 ? `${days}d ${hours}:${minutes}:${seconds}` : `${hours}:${minutes}:${seconds}`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [event.expiresAt]);

  return (
    <Card 
      onClick={() => router.push(`/events/${event.id}`)}
      className="group overflow-hidden rounded-[1.5rem] md:rounded-[2.5rem] lg:rounded-[3.5rem] border-none shadow-lg md:shadow-xl bg-white dark:bg-slate-900 transition-all hover:shadow-2xl hover:-translate-y-1 md:hover:-translate-y-2 cursor-pointer"
    >
      <div className="relative aspect-[16/9] w-full">
        <Image src={event.thumbnailUrl || 'https://picsum.photos/seed/event/600/400'} alt={event.title} fill className="object-cover" unoptimized />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 md:bottom-6 md:left-6 md:right-6">
          <Badge className="bg-primary text-white border-none rounded-full px-2 py-0.5 md:px-3 md:py-1 text-[7px] md:text-[10px] lg:text-[12px] font-bold mb-1.5 md:mb-3 uppercase tracking-widest">
            EVENT
          </Badge>
          <h3 className="text-white font-headline font-bold text-sm md:text-xl lg:text-3xl leading-tight line-clamp-1">{event.title}</h3>
        </div>
      </div>
      <div className="p-4 md:p-6 lg:p-10">
        <p className="text-[11px] md:text-sm lg:text-lg text-muted-foreground line-clamp-2 leading-relaxed mb-4 md:mb-8 font-medium">{event.shortDescription || event.description}</p>
        
        {event.expiresAt && (
          <div className="mb-4 md:mb-8 p-2.5 md:p-4 bg-amber-50 dark:bg-amber-500/5 rounded-xl md:rounded-3xl flex items-center gap-2 md:gap-4 text-amber-700 dark:text-amber-400">
             <Clock className="w-4 h-4 md:w-6 md:h-6 animate-pulse" />
             <div className="flex flex-col">
                <span className="text-[7px] md:text-[10px] font-black uppercase tracking-wider opacity-60">{timeLeftLabel}</span>
                <span className="text-[11px] md:text-lg font-bold font-mono leading-none">{timeLeft}</span>
             </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 md:pt-6 border-t border-slate-50 dark:border-white/5">
          <div className="flex items-center gap-1.5 text-[10px] md:text-sm lg:text-lg font-bold text-primary">
            <Calendar className="w-3.5 h-3.5 md:w-5 md:h-5 lg:w-7 lg:h-7" />
            Active
          </div>
          <Button 
            variant="ghost" 
            className="rounded-full h-8 md:h-12 lg:h-14 px-3 md:px-8 lg:px-10 font-bold text-[10px] md:text-sm lg:text-lg hover:bg-primary/10 transition-all active:scale-95" 
            onClick={(e) => { e.stopPropagation(); router.push(`/events/${event.id}`); }}
          >
            {viewLabel} <ChevronRight className="w-3 h-3 ml-0.5 md:ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function GameCollectionCard({ game, onClick, buyLabel }: { game: any, onClick: () => void, buyLabel: string }) {
  return (
    <Card 
      onClick={onClick}
      className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 rounded-xl md:rounded-[1.5rem] lg:rounded-[2.5rem] min-[3000px]:rounded-[4rem] p-0.5 md:p-1 flex items-center h-16 xs:h-20 md:h-28 lg:h-36 min-[3000px]:h-56 cursor-pointer"
    >
      <div className="w-14 h-14 xs:w-16 xs:h-16 md:w-24 md:h-24 lg:w-32 lg:h-32 min-[3000px]:w-48 min-[3000px]:h-48 rounded-lg md:rounded-xl lg:rounded-3xl min-[3000px]:rounded-[3rem] overflow-hidden relative shrink-0 m-0.5 bg-slate-50 dark:bg-slate-800 border dark:border-white/5">
        {game.icon ? (
          <Image src={game.icon} alt={game.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-primary font-bold text-[10px] md:text-xl">G</div>
        )}
      </div>
      
      <div className="flex-1 px-2.5 xs:px-4 md:px-6 lg:px-8 min-w-0">
        <h3 className="font-headline font-bold text-[10px] xs:text-sm md:text-xl lg:text-3xl min-[3000px]:text-5xl text-slate-900 dark:text-white truncate uppercase tracking-tight group-hover:text-primary transition-colors">
          {game.title}
        </h3>
      </div>

      <button className="h-full px-3 xs:px-6 md:px-10 lg:px-16 min-[3000px]:px-24 bg-primary text-white font-black text-[9px] xs:text-xs md:text-xl lg:text-2xl min-[3000px]:text-4xl flex items-center justify-center transition-all group-hover:bg-primary/90 active:scale-95 uppercase tracking-widest shrink-0">
        {buyLabel}
      </button>
    </Card>
  );
}
