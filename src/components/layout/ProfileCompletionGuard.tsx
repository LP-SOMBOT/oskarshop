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
 * Ensures that all users (especially those joining via Google or first-time registration)
 * complete their mandatory profile details before accessing the app.
 * Optimized to show once and persists state in both DB and LocalStorage.
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
    if (!isInitialLoading && !loading && user) {
      // Step 1: Check local cache first for instant bypass if already completed
      const localCompleted = localStorage.getItem(`oskar_profile_complete_${user.uid}`) === 'true';
      if (localCompleted) {
        setOpen(false);
        return;
      }

      // Step 2: Check database profile fields
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
        // If DB is complete but local isn't, sync local
        localStorage.setItem(`oskar_profile_complete_${user.uid}`, 'true');
        setOpen(false);
      }
    } else if (!user) {
      setOpen(false);
    }
  }, [user, userProfile, isInitialLoading, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phoneNumber || !formData.gameUid) {
      toast({ 
        variant: "destructive", 
        title: "Required Fields", 
        description: "Please fill in all mandatory fields." 
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateUserProfile(formData);
      // Persist to local storage for quick bypass on next load
      if (user) {
        localStorage.setItem(`oskar_profile_complete_${user.uid}`, 'true');
      }
      setOpen(false);
      toast({ title: "Profile Completed!", description: "Welcome to the Oskar Shop community." });
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not save profile details." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isInitialLoading || loading) return <>{children}</>;

  return (
    <>
      <DialogPrimitive.Root open={open} onOpenChange={() => {}}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[100004] bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content 
            className="fixed left-[50%] top-[50%] z-[100005] grid w-[92%] max-w-md translate-x-[-50%] translate-y-[-50%] border bg-background shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-[2rem] md:rounded-[2.5rem] border-none bg-white dark:bg-slate-900 outline-none overflow-hidden max-h-[90vh] overflow-y-auto scrollbar-hide"
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <div className="bg-primary p-5 sm:p-8 text-white relative overflow-hidden shrink-0">
               <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={60} className="md:size-24" /></div>
               <DialogPrimitive.Title className="text-xl sm:text-3xl font-headline font-bold uppercase tracking-tight">
                 Complete Profile
               </DialogPrimitive.Title>
               <DialogPrimitive.Description className="text-white/80 text-[10px] sm:text-xs font-medium mt-1 uppercase tracking-widest">
                 Just one more step to start!
               </DialogPrimitive.Description>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-8 pt-4 sm:pt-6 space-y-4 sm:space-y-6">
              <div className="flex flex-col items-center mb-2">
                 <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-slate-50 dark:border-slate-800 shadow-lg overflow-hidden relative bg-slate-100 dark:bg-slate-800">
                    {userProfile?.photoURL || user?.photoURL ? (
                      <Image src={userProfile?.photoURL || user?.photoURL} alt="" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300"><UserCircle size={40} /></div>
                    )}
                 </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-1">
                  <Label className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest flex items-center gap-2">
                    <UserCircle size={10} /> Full Display Name
                  </Label>
                  <Input 
                    placeholder="Enter your name" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="h-11 sm:h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold px-4 shadow-inner text-sm"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest flex items-center gap-2">
                    <Smartphone size={10} /> WhatsApp Number
                  </Label>
                  <Input 
                    type="tel"
                    placeholder="e.g. 613982172" 
                    value={formData.phoneNumber} 
                    onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                    className="h-11 sm:h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold px-4 shadow-inner text-sm"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest flex items-center gap-2">
                    <Gamepad2 size={10} /> Game UID / Player ID
                  </Label>
                  <Input 
                    placeholder="e.g. 982172" 
                    value={formData.gameUid} 
                    onChange={e => setFormData({...formData, gameUid: e.target.value.replace(/\D/g, '')})}
                    className="h-11 sm:h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold px-4 shadow-inner text-sm"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest flex items-center gap-2">
                    <Sparkles size={10} /> In-Game Name (Optional)
                  </Label>
                  <Input 
                    placeholder="e.g. Ghost_01" 
                    value={formData.gameName} 
                    onChange={e => setFormData({...formData, gameName: e.target.value})}
                    className="h-11 sm:h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold px-4 shadow-inner text-sm"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSaving}
                className="w-full h-14 sm:h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-base sm:text-lg shadow-xl shadow-primary/20 transition-all active:scale-95 uppercase tracking-widest mt-2"
              >
                {isSaving ? <Loader2 className="animate-spin" /> : "Save & Access Store"}
              </Button>
            </form>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
      {children}
    </>
  );
}
