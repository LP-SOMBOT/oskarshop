
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/context';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserCircle, Smartphone, Gamepad2, Loader2, Sparkles, Camera } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';
import { uploadToImgbb } from '@/lib/imgbb';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    gameUid: "",
    gameName: "",
    photoURL: ""
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
          gameName: userProfile?.gameName || "",
          photoURL: userProfile?.photoURL || user?.photoURL || ""
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSaving(true);
    try {
      const url = await uploadToImgbb(file);
      setFormData(prev => ({ ...prev, photoURL: url }));
      toast({ title: "Photo Uploaded!", description: "Looks great!" });
    } catch (error) {
      toast({ variant: "destructive", title: "Upload Failed", description: "Try again later." });
    } finally {
      setIsSaving(false);
    }
  };

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
            className="fixed left-[50%] top-[50%] z-[100005] grid w-[94%] max-w-sm translate-x-[-50%] translate-y-[-50%] border bg-background shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-[2rem] border-none bg-white dark:bg-slate-900 outline-none overflow-hidden max-h-[95vh] scrollbar-hide"
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
                 Update your identity
               </DialogPrimitive.Description>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 pt-3 space-y-4 sm:space-y-6">
              {/* Interactive Avatar Button */}
              <div className="flex flex-col items-center">
                 <button 
                   type="button"
                   onClick={() => fileInputRef.current?.click()}
                   className="group relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-slate-50 dark:border-slate-800 shadow-md overflow-hidden bg-slate-100 dark:bg-slate-800 active:scale-95 transition-transform"
                 >
                    {formData.photoURL ? (
                      <Image src={formData.photoURL} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <UserCircle size={32} className="sm:w-10 sm:h-10" />
                      </div>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                       <Camera size={14} className="mb-0.5" />
                       <span className="text-[7px] font-black uppercase">Change</span>
                    </div>

                    {isSaving && (
                      <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex items-center justify-center z-20">
                         <Loader2 className="animate-spin text-primary w-6 h-6" />
                      </div>
                    )}
                 </button>
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   className="hidden" 
                   accept="image/*" 
                   onChange={handlePhotoUpload} 
                 />
                 <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mt-2">Tap to upload photo</p>
              </div>

              {/* Tighter Form Fields to prevent scrolling */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5">
                    <UserCircle size={10} /> Full Name
                  </Label>
                  <Input 
                    placeholder="Enter your name" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="h-10 sm:h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold px-4 shadow-inner text-xs sm:text-sm focus-visible:ring-primary"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5">
                    <Smartphone size={10} /> WhatsApp No
                  </Label>
                  <Input 
                    type="tel"
                    placeholder="e.g. 613982172" 
                    value={formData.phoneNumber} 
                    onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                    className="h-10 sm:h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold px-4 shadow-inner text-xs sm:text-sm focus-visible:ring-primary"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5">
                    <Gamepad2 size={10} /> Game ID / UID
                  </Label>
                  <Input 
                    placeholder="e.g. 982172" 
                    value={formData.gameUid} 
                    onChange={e => setFormData({...formData, gameUid: e.target.value.replace(/\D/g, '')})}
                    className="h-10 sm:h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold px-4 shadow-inner text-xs sm:text-sm focus-visible:ring-primary"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSaving}
                className="w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-sm sm:text-base shadow-xl shadow-primary/20 transition-all active:scale-95 uppercase tracking-widest"
              >
                {isSaving ? <Loader2 className="animate-spin" /> : "Save & Access"}
              </Button>
              
              <p className="text-[8px] text-center text-slate-300 dark:text-slate-700 uppercase tracking-widest leading-relaxed">
                Your data is only used for diamond delivery
              </p>
            </form>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
      {children}
    </>
  );
}
