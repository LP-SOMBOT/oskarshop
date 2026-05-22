
'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/context';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserCircle, Smartphone, Gamepad2, Loader2, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';

/**
 * ProfileCompletionGuard Component
 * 
 * Ensures that all users complete their mandatory profile details before accessing the app.
 * Optimized for mobile with an ultra-compact layout to prevent scrolling on all screens.
 */
export default function ProfileCompletionGuard({ children }: { children: React.ReactNode }) {
  const { user, userProfile, isInitialLoading, loading, updateUserProfile } = useApp();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    gameUid: "",
    gameName: ""
  });

  useEffect(() => {
    // Trigger guard when user is authenticated AND data nodes are synchronized
    if (!isInitialLoading && !loading && user) {
      // Dual layer check: Cache for speed, DB for truth
      const localCompleted = localStorage.getItem(`oskar_profile_complete_${user.uid}`) === 'true';
      if (localCompleted) {
        setOpen(false);
        return;
      }

      // Check for missing mandatory info
      const isMissingInfo = !userProfile?.phoneNumber || !userProfile?.gameUid || !userProfile?.name;
      
      if (isMissingInfo) {
        setFormData({
          name: userProfile?.name || user?.displayName || "",
          phoneNumber: userProfile?.phoneNumber || "",
          gameUid: userProfile?.gameUid || "",
          gameName: userProfile?.gameName || ""
        });
        setOpen(true);
      } else {
        // Hydrate local cache if DB says we are done
        localStorage.setItem(`oskar_profile_complete_${user.uid}`, 'true');
        setOpen(false);
      }
    } else if (!loading && !user) {
      setOpen(false);
    }
  }, [user, userProfile, isInitialLoading, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phoneNumber || !formData.gameUid) {
      toast({ 
        variant: "destructive", 
        title: "Missing Information", 
        description: "Please fill in all required fields." 
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateUserProfile(formData);
      if (user) {
        localStorage.setItem(`oskar_profile_complete_${user.uid}`, 'true');
      }
      setOpen(false);
      toast({ title: "Profile Completed!", description: "Welcome to Oskar Shop." });
    } catch (error) {
      toast({ variant: "destructive", title: "Save Error", description: "Failed to update profile." });
    } finally {
      setIsSaving(false);
    }
  };

  // Prevent UI flickering by waiting for initial auth state
  if (isInitialLoading || loading) return <>{children}</>;

  return (
    <>
      <DialogPrimitive.Root open={open} onOpenChange={() => {}}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[100004] bg-black/90 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content 
            className="fixed left-[50%] top-[50%] z-[100005] grid w-[94%] max-w-sm translate-x-[-50%] translate-y-[-50%] border bg-background shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-[2rem] border-none bg-white dark:bg-slate-900 outline-none overflow-hidden max-h-[90vh] scrollbar-hide"
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            {/* Ultra Compact Header */}
            <div className="bg-primary p-4 sm:p-5 text-white relative overflow-hidden shrink-0">
               <div className="absolute top-0 right-0 p-3 opacity-10"><Sparkles size={32} /></div>
               <DialogPrimitive.Title className="text-lg font-headline font-bold uppercase tracking-tight">
                 Complete Profile
               </DialogPrimitive.Title>
               <DialogPrimitive.Description className="text-white/80 text-[8px] font-medium mt-0.5 uppercase tracking-widest">
                 Mandatory Step
               </DialogPrimitive.Description>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-5 pt-3 space-y-3 sm:space-y-4">
              {/* Reduced Avatar for Mobile */}
              <div className="flex flex-col items-center">
                 <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-4 border-slate-50 dark:border-slate-800 shadow-md overflow-hidden relative bg-slate-100 dark:bg-slate-800">
                    {userProfile?.photoURL || user?.photoURL ? (
                      <Image src={userProfile?.photoURL || user?.photoURL} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300"><UserCircle size={18} /></div>
                    )}
                 </div>
              </div>

              {/* Tighter Form Fields to prevent scrolling */}
              <div className="space-y-2">
                <div className="space-y-0.5">
                  <Label className="text-[8px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5">
                    <UserCircle size={10} /> Full Name
                  </Label>
                  <Input 
                    placeholder="Enter name" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="h-8 sm:h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold px-4 shadow-inner text-xs sm:text-sm focus-visible:ring-primary"
                    required
                  />
                </div>

                <div className="space-y-0.5">
                  <Label className="text-[8px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5">
                    <Smartphone size={10} /> WhatsApp No
                  </Label>
                  <Input 
                    type="tel"
                    placeholder="e.g. 613982172" 
                    value={formData.phoneNumber} 
                    onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                    className="h-8 sm:h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold px-4 shadow-inner text-xs sm:text-sm focus-visible:ring-primary"
                    required
                  />
                </div>

                <div className="space-y-0.5">
                  <Label className="text-[8px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5">
                    <Gamepad2 size={10} /> Game ID / UID
                  </Label>
                  <Input 
                    placeholder="e.g. 982172" 
                    value={formData.gameUid} 
                    onChange={e => setFormData({...formData, gameUid: e.target.value.replace(/\D/g, '')})}
                    className="h-8 sm:h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold px-4 shadow-inner text-xs sm:text-sm focus-visible:ring-primary"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSaving}
                className="w-full h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-base shadow-xl shadow-primary/20 transition-all active:scale-95 uppercase tracking-widest mt-1"
              >
                {isSaving ? <Loader2 className="animate-spin" /> : "Save & Access"}
              </Button>
              
              <p className="text-[7px] text-center text-slate-300 dark:text-slate-700 uppercase tracking-widest">
                Data used for diamond delivery only
              </p>
            </form>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
      {children}
    </>
  );
}
