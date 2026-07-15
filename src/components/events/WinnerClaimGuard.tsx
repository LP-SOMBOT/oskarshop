'use client';

import { useEffect, useState, useMemo } from 'react';
import { useApp } from '@/lib/context';
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, ArrowRight, X, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

/**
 * WinnerClaimGuard Component
 * Monitors all eventAccounts for a "pending" claim belonging to the current user.
 * Triggers full-screen confetti and a claim modal.
 */
export default function WinnerClaimGuard() {
  const { user, eventAccounts, respondToEventClaim, setGlobalLoading } = useApp();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  // Find any active claim where current user is the winner
  const activeClaim = useMemo(() => {
    if (!user || !eventAccounts) return null;
    return eventAccounts.find(e => 
      e.winnerId === user.uid && 
      e.winnerClaim?.status === 'pending'
    );
  }, [user, eventAccounts]);

  useEffect(() => {
    if (activeClaim) {
      setShowModal(true);
      // Fire celebratory confetti
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
    } else {
      setShowModal(false);
    }
  }, [activeClaim]);

  if (!activeClaim) return null;

  const handleClaim = () => {
    setGlobalLoading(true);
    // Specialized event checkout route
    router.push(`/checkout-event?id=${activeClaim.id}`);
    setShowModal(false);
  };

  const handleIgnore = () => {
    respondToEventClaim(activeClaim.id, 'ignored');
    setShowModal(false);
  };

  return (
    <Dialog open={showModal} onOpenChange={() => {}}>
      <DialogContent className="max-w-md w-[95%] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900 animate-in zoom-in duration-500">
         <DialogHeader className="sr-only">
            <DialogTitle>Winner Notification</DialogTitle>
            <DialogDescription>Congratulations! You have won an auction event.</DialogDescription>
         </DialogHeader>
         
         <div className="bg-primary p-8 text-white relative overflow-hidden text-center">
            <div className="absolute top-0 right-0 p-8 opacity-10"><Trophy size={160} /></div>
            <div className="relative z-10 space-y-4">
               <div className="w-20 h-20 bg-white/20 rounded-3xl mx-auto flex items-center justify-center backdrop-blur-md shadow-inner">
                  <Trophy size={48} className="animate-bounce" />
               </div>
               <h2 className="text-3xl font-headline font-bold uppercase tracking-tight">Hampalyo! 🏆</h2>
               <p className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em]">Waad ku guulaystay account kaan!</p>
            </div>
         </div>

         <div className="p-8 space-y-8">
            <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-inner ring-4 ring-primary/5">
               {activeClaim.imageUrls?.[0] ? (
                 <Image src={activeClaim.imageUrls[0]} alt="" fill className="object-cover" unoptimized />
               ) : <div className="w-full h-full flex items-center justify-center opacity-10">...</div>}
            </div>

            <div className="text-center space-y-2">
               <h3 className="font-bold text-xl uppercase text-slate-900 dark:text-white">{activeClaim.title}</h3>
               <div className="flex items-center justify-center gap-2">
                  <span className="text-muted-foreground font-black text-[10px] uppercase">Qiimaha Final-ka:</span>
                  <span className="text-primary font-headline font-bold text-3xl">${activeClaim.winnerClaim?.finalPrice?.toFixed(2)}</span>
               </div>
            </div>

            <div className="flex flex-col gap-3">
               <Button 
                onClick={handleClaim}
                className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg uppercase tracking-widest shadow-xl shadow-primary/30 active:scale-95 transition-all gap-3"
               >
                  Iibso Hadda <ArrowRight size={20} />
               </Button>
               <Button 
                variant="ghost" 
                onClick={handleIgnore}
                className="w-full h-12 text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:text-red-500"
               >
                  Maya, Uma Baahni
               </Button>
            </div>
         </div>
      </DialogContent>
    </Dialog>
  );
}