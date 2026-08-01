
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
 * Monitors all eventAccounts for a active claim belonging to the current user.
 * 
 * IMPROVED PERSISTENCE & FLICKER PREVENTION:
 * Uses LocalStorage cache for finalized/responded states to ensure immediate 
 * accurate rendering even before full DB sync.
 */
export default function WinnerClaimGuard() {
  const { user, eventAccounts, orders, respondToEventClaim, setGlobalLoading } = useApp();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  
  // Local state for finalized event IDs to prevent flickering during DB sync
  const [finalizedIds, setFinalizedIds] = useState<Set<string>>(new Set());

  // Load finalized state on mount to prevent flicker
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      const ids = new Set<string>();
      keys.forEach(k => {
        if (k.startsWith('oskar_claim_finalized_')) {
          ids.add(k.replace('oskar_claim_finalized_', ''));
        }
      });
      setFinalizedIds(ids);
    }
  }, []);

  // Find any active win where current user is the winner and hasn't placed an order
  const activeClaim = useMemo(() => {
    if (!user || !eventAccounts || !orders) return null;
    return eventAccounts.find(e => {
      // 1. Ownership check
      const isWinner = e.winnerId === user.uid;
      if (!isWinner) return false;

      // 2. Database terminal state check
      const claimStatus = e.winnerClaim?.status;
      if (claimStatus === 'ignored') return false;

      // 3. Local terminal state check (Flicker prevention)
      if (finalizedIds.has(e.id)) return false;
      
      const modalId = e.winnerClaim?.modalId;
      if (modalId) {
        // Persistent check for "ignored" responses
        if (localStorage.getItem(`oskar_claim_responded_${e.id}_${modalId}`) === 'ignored') return false;
      }

      // 4. Order state check
      const eventOrder = orders.find(o => 
        o.gameDetails?.eventId === e.id && 
        o.userId === user.uid
      );
      
      if (eventOrder) {
        // PERMANENT HIDE: If order reached terminal state (Successful or Cancelled)
        if (eventOrder.status === 'successful' || eventOrder.status === 'cancelled') {
          if (typeof window !== 'undefined') {
            localStorage.setItem(`oskar_claim_finalized_${e.id}`, 'true');
          }
          return false;
        }
        // TEMPORARY HIDE: If order is pending/processing, hide the nudge modal
        return false;
      }
      
      // If we are here, they are the winner and haven't placed an order yet
      return (claimStatus === 'pending' || claimStatus === 'accepted');
    });
  }, [user, eventAccounts, orders, finalizedIds]);

  const activeClaimId = activeClaim?.id;
  const winnerModalId = activeClaim?.winnerClaim?.modalId;

  useEffect(() => {
    let interval: any;
    if (activeClaimId && winnerModalId) {
      const lastFiredId = localStorage.getItem(`oskar_confetti_fired_${activeClaimId}`);
      
      if (lastFiredId !== winnerModalId) {
        setShowModal(true);
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };
        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        interval = setInterval(() => {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) return clearInterval(interval);
          const particleCount = 50 * (timeLeft / duration);
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
        
        localStorage.setItem(`oskar_confetti_fired_${activeClaimId}`, winnerModalId);
      } else {
        setShowModal(true);
      }
    } else {
      setShowModal(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeClaimId, winnerModalId]);

  if (!activeClaim) return null;

  const handleClaim = () => {
    if (activeClaim && user) {
      respondToEventClaim(activeClaim.id, 'accepted');
      setGlobalLoading(true);
      router.push(`/checkout-event?id=${activeClaim.id}`);
      setShowModal(false);
    }
  };

  const handleIgnore = () => {
    if (activeClaim && user) {
      respondToEventClaim(activeClaim.id, 'ignored');
      setShowModal(false);
    }
  };

  return (
    <Dialog open={showModal} onOpenChange={() => {}}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-[100002] bg-black/90 backdrop-blur-md" />
        <DialogPrimitive.Content 
          className={cn(
            "fixed left-[50%] top-[50%] z-[100003] grid w-[88%] max-w-sm translate-x-[-50%] translate-y-[-50%] border bg-background shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 rounded-[2rem] md:rounded-[2.5rem] border-none bg-white dark:bg-slate-900 outline-none overflow-hidden",
            "[&>button]:hidden" 
          )}
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="sr-only">
             <DialogTitle>Winner Notification</DialogTitle>
             <DialogDescription>Congratulations! You have won an auction event.</DialogDescription>
          </DialogHeader>
          
          <div className="bg-primary p-6 md:p-8 text-white relative overflow-hidden text-center">
             <div className="absolute top-0 right-0 p-8 opacity-10"><Trophy size={120} /></div>
             <div className="relative z-10 space-y-3">
                <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto flex items-center justify-center backdrop-blur-md shadow-inner">
                   <Trophy size={36} className="animate-bounce" />
                </div>
                <h2 className="text-xl md:text-3xl font-headline font-bold uppercase tracking-tight">Hampalyo! 🏆</h2>
                <p className="text-white/80 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">Waad ku guulaystay account kaan!</p>
             </div>
          </div>

          <div className="p-6 md:p-8 space-y-6 md:space-y-8">
             <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-inner ring-4 ring-primary/5">
                {activeClaim.imageUrls?.[0] ? (
                  <Image src={activeClaim.imageUrls[0]} alt="" fill className="object-cover" unoptimized />
                ) : <div className="w-full h-full flex items-center justify-center opacity-10">...</div>}
             </div>

             <div className="text-center space-y-1.5">
                <h3 className="font-bold text-lg md:text-xl uppercase text-slate-900 dark:text-white truncate px-2">{activeClaim.title}</h3>
                <div className="flex items-center justify-center gap-2">
                   <span className="text-muted-foreground font-black text-[9px] uppercase tracking-tighter">Qiimaha Final-ka:</span>
                   <span className="text-primary font-headline font-bold text-2xl md:text-3xl">${activeClaim.winnerClaim?.finalPrice?.toFixed(2)}</span>
                </div>
             </div>

             <div className="flex flex-col gap-2.5">
                <Button 
                 onClick={handleClaim}
                 className="w-full h-14 md:h-16 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-base uppercase tracking-widest shadow-xl shadow-primary/30 active:scale-95 transition-all gap-2"
                >
                   Iibso Hadda <ArrowRight size={18} />
                </Button>
                <button 
                 onClick={handleIgnore}
                 className="w-full py-2 text-slate-400 font-bold uppercase tracking-widest text-[9px] hover:text-red-500 transition-colors"
                >
                   Maya, Uma Baahni
                </button>
             </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
