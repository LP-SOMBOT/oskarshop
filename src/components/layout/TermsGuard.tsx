'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/context';
import { usePathname, useRouter } from 'next/navigation';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from '@/components/ui/button';
import { ScrollText, ArrowRight } from 'lucide-react';

/**
 * TermsGuard Component
 * 
 * Ensures every user reviews the shop's Terms & Conditions before access.
 * Displays a mandatory modal for guests and new/logged-in users who haven't accepted.
 * Acceptance is synced across LocalStorage and RTDB for a consistent cross-device experience.
 */
export default function TermsGuard({ children }: { children: React.ReactNode }) {
  const { user, userProfile, acceptTerms, isInitialLoading, loading, t } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Avoid showing the modal on the terms page itself to allow reading
    if (pathname === '/terms') {
      setOpen(false);
      return;
    }

    const checkAcceptanceStatus = () => {
      const localAccepted = localStorage.getItem('oskar_terms_accepted') === 'true';
      
      if (user) {
        // Logged in users: Prioritize database record
        if (userProfile && userProfile.termsAccepted !== true) {
          setOpen(true);
        } else if (userProfile && userProfile.termsAccepted === true) {
          setOpen(false);
        }
      } else {
        // Guests: Rely on device cache
        if (!localAccepted) {
          setOpen(true);
        } else {
          setOpen(false);
        }
      }
    };

    if (!isInitialLoading && !loading) {
      checkAcceptanceStatus();
    }
  }, [user, userProfile, pathname, isInitialLoading, loading]);

  const handleReadTerms = async () => {
    await acceptTerms();
    setOpen(false);
    router.push('/terms');
  };

  // Do not interrupt the branding splash screen
  if (isInitialLoading || loading) return <>{children}</>;

  return (
    <>
      <DialogPrimitive.Root open={open} onOpenChange={() => {}}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[100002] bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content 
            className="fixed left-[50%] top-[50%] z-[100003] grid w-full max-w-sm translate-x-[-50%] translate-y-[-50%] gap-6 border bg-background p-8 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 text-center outline-none"
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary mb-6 shadow-inner">
                <ScrollText size={40} />
              </div>
              
              <DialogPrimitive.Title className="text-2xl font-headline font-bold text-slate-900 dark:text-white mb-2">
                {t('terms_of_service')}
              </DialogPrimitive.Title>
              
              <DialogPrimitive.Description className="text-muted-foreground dark:text-slate-400 text-sm leading-relaxed mb-8">
                {t('terms_welcome')}
              </DialogPrimitive.Description>

              <Button 
                onClick={handleReadTerms}
                className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg gap-2 shadow-xl shadow-primary/20 active:scale-95 transition-all"
              >
                {t('read_terms')} <ArrowRight size={20} />
              </Button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
      {children}
    </>
  );
}
