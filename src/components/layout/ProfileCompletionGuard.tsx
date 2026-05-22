
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
 * Cannot be bypassed/cancelled.
 */
export default function ProfileCompletionGuard({ children }: { children: React.ReactNode }) {
  const { user, userProfile, isInitialLoading, loading, updateUserProfile, t } = useApp();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    gameUid: "",
    gameName: ""
  });

  useEffect(() => {
    // We only trigger this for logged-in users once initialization is done
    if (!isInitialLoading && !loading && user) {
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
            className="fixed left-[50%] top-[50%] z-[100005] grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] border bg-background shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-[2.5rem] border-none bg-white dark:bg-slate-900 outline-none overflow-hidden max-h-[95vh] overflow-y-auto scrollbar-hide"
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <div className="bg-primary p-8 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={100} /></div>
               <DialogPrimitive.Title className="text-2xl sm:text-3xl font-headline font-bold uppercase tracking-tight">
                 Complete Profile
               </DialogPrimitive.Title>
               <DialogPrimitive.Description className="text-white/80 text-sm font-medium mt-1 uppercase tracking-widest">
                 Just one more step to start!
               </DialogPrimitive.Description>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="flex flex-col items-center mb-4">
                 <div className="w-24 h-24 rounded-full border-4 border-slate-50 dark:border-slate-800 shadow-xl overflow-hidden relative bg-slate-100 dark:bg-slate-800">
                    {userProfile?.photoURL || user?.photoURL ? (
                      <Image src={userProfile?.photoURL || user?.photoURL} alt="" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300"><UserCircle size={48} /></div>
                    )}
                 </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest flex items-center gap-2">
                    <UserCircle size={12} /> Full Display Name
                  </Label>
                  <Input 
                    placeholder="Enter your name" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold px-4 shadow-inner"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest flex items-center gap-2">
                    <Smartphone size={12} /> WhatsApp Number
                  </Label>
                  <Input 
                    type="tel"
                    placeholder="e.g. 613982172" 
                    value={formData.phoneNumber} 
                    onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                    className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold px-4 shadow-inner"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest flex items-center gap-2">
                    <Gamepad2 size={12} /> Game UID / Player ID
                  </Label>
                  <Input 
                    placeholder="e.g. 982172" 
                    value={formData.gameUid} 
                    onChange={e => setFormData({...formData, gameUid: e.target.value.replace(/\D/g, '')})}
                    className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold px-4 shadow-inner"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest flex items-center gap-2">
                    <Sparkles size={12} /> In-Game Name (Optional)
                  </Label>
                  <Input 
                    placeholder="e.g. Ghost_01" 
                    value={formData.gameName} 
                    onChange={e => setFormData({...formData, gameName: e.target.value})}
                    className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold px-4 shadow-inner"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSaving}
                className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20 transition-all active:scale-95 uppercase tracking-widest"
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
