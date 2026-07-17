
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useApp } from '@/lib/context';
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from '@/components/ui/button';
import { Trophy, ArrowRight, X, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * WinnerClaimGuard Component
 * Monitors all eventAccounts for a "pending" claim belonging to the current user.
 * Triggers full-screen confetti and a mandatory claim modal.
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
    router.push(`/checkout-event?id=${activeClaim.id}`);
    setShowModal(false);
  };

  const handleIgnore = () => {
    respondToEventClaim(activeClaim.id, 'ignored');
    setShowModal(false);
  };

  return (
    <Dialog open={showModal} onOpenChange={() => {}}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-[100002] bg-black/90 backdrop-blur-md" />
        <DialogPrimitive.Content 
          className={cn(
            "fixed left-[50%] top-[50%] z-[100003] grid w-[94%] max-w-md translate-x-[-50%] translate-y-[-50%] border bg-background shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-[2.5rem] border-none bg-white dark:bg-slate-900 outline-none overflow-hidden",
            "[&>button]:hidden" // Hide the standard close X button
          )}
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
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
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
