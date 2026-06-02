
"use client";

import React, { useMemo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import { ArrowLeft, Clock, Calendar, ShieldCheck, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { format } from "date-fns";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const { events, setActiveTab, t } = useApp();
  const [timeLeft, setTimeLeft] = useState<string>("");

  const event = useMemo(() => {
    return (events || []).find(e => e.id === id);
  }, [events, id]);

  useEffect(() => {
    if (!event?.expiresAt) return;

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

      if (days > 0) {
        setTimeLeft(`${days} Maalin ${hours}:${minutes}:${seconds}`);
      } else {
        setTimeLeft(`${hours}:${minutes}:${seconds}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [event?.expiresAt]);

  const handleAction = () => {
    if (!event) return;
    if (event.redirectRoute) {
      router.push(event.redirectRoute);
    } else {
      setActiveTab('games');
    }
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-10 space-y-4">
        <Skeleton className="h-64 w-full max-w-4xl rounded-[3rem]" />
        <Skeleton className="h-10 w-3/4 max-w-4xl" />
        <Skeleton className="h-40 w-full max-w-4xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 page-transition pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-white/5 h-16 sm:h-20 flex items-center px-4 sm:px-8 justify-between">
         <div className="flex items-center gap-4 sm:gap-6">
            <button 
              onClick={() => router.push('/')} 
              className="p-2 sm:p-3 text-slate-900 dark:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 transition-all active:scale-90"
            >
                <ArrowLeft size={24} />
            </button>
            <h1 className="text-lg sm:text-2xl font-headline font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-md">
               {event.title}
            </h1>
         </div>
         <Badge className="bg-primary text-white border-none rounded-full px-4 py-1 font-bold text-[10px] sm:text-xs">
            LIVE NOW
         </Badge>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-8 space-y-10 sm:space-y-16">
        {/* Banner Section */}
        <section className="relative aspect-[21/9] sm:aspect-[2/1] w-full rounded-[2.5rem] sm:rounded-[4rem] overflow-hidden shadow-2xl ring-1 ring-slate-100 dark:ring-white/5">
           <Image 
            src={event.thumbnailUrl} 
            alt={event.title} 
            fill 
            className="object-cover" 
            unoptimized 
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
           <div className="absolute bottom-8 left-8 right-8 sm:bottom-12 sm:left-12 sm:right-12">
              <div className="flex flex-wrap items-center gap-3 mb-4 sm:mb-6">
                 <Badge className="bg-white/10 backdrop-blur-md text-white border-white/20 rounded-full px-4 py-1 font-bold text-[10px] uppercase tracking-widest">
                    {event.type.replace('_', ' ')}
                 </Badge>
                 {event.expiresAt && (
                    <div className="flex items-center gap-2 text-amber-400 bg-amber-400/10 backdrop-blur-md px-4 py-1 rounded-full border border-amber-400/20">
                       <Clock size={14} className="animate-pulse" />
                       <span className="text-[10px] font-bold font-mono tracking-wider">{timeLeft}</span>
                    </div>
                 )}
              </div>
              <h2 className="text-3xl sm:text-6xl font-headline font-bold text-white leading-tight drop-shadow-lg">
                 {event.title}
              </h2>
           </div>
        </section>

        {/* Content Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-12 sm:gap-16">
           <div className="lg:col-span-2 space-y-8 sm:space-y-10">
              <div className="space-y-6">
                 <div className="flex items-center gap-3 text-primary">
                    <Sparkles size={20} />
                    <span className="text-sm font-bold uppercase tracking-[0.3em]">Event Overview</span>
                 </div>
                 <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {event.shortDescription}
                 </p>
              </div>

              <div className="h-px bg-slate-100 dark:bg-white/5 w-full" />

              <div className="prose dark:prose-invert max-w-none">
                 <div className="text-base sm:text-lg text-slate-700 dark:text-slate-400 leading-loose whitespace-pre-wrap font-medium">
                    {event.content}
                 </div>
              </div>
           </div>

           <div className="space-y-8">
              <Card className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900 border-none shadow-sm flex flex-col gap-6">
                 <h3 className="font-headline font-bold text-xl dark:text-white flex items-center gap-3">
                    <ShieldCheck className="text-primary" /> Event Details
                 </h3>
                 <div className="space-y-4">
                    <DetailItem icon={Calendar} label="Started" value={format(new Date(event.createdAt), 'PPpp')} />
                    <DetailItem icon={ShieldCheck} label="Verified" value="Official Event" />
                 </div>
                 <Button 
                   onClick={handleAction}
                   className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 active:scale-95 transition-all mt-4 uppercase tracking-widest gap-2"
                 >
                    {event.buttonText || t('view')} <ChevronRight size={18} />
                 </Button>
              </Card>

              <div className="p-6 bg-primary/5 rounded-[2.5rem] border border-primary/10">
                 <p className="text-xs font-bold text-primary uppercase tracking-widest text-center">
                    OskarShop © 2026
                 </p>
              </div>
           </div>
        </section>
      </main>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-center gap-4">
       <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 shadow-sm">
          <Icon size={18} />
       </div>
       <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-none mb-1">{label}</p>
          <p className="text-sm font-bold text-slate-900 dark:text-white">{value}</p>
       </div>
    </div>
  );
}
