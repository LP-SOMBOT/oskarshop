"use client";

import { useState, useEffect, useMemo } from "react";
import { useApp } from "@/lib/context";
import { 
  User, 
  LogOut, 
  ShieldCheck, 
  Camera, 
  Loader2, 
  Star, 
  ChevronRight, 
  HelpCircle, 
  MessageCircle, 
  Video,
  ShoppingBag,
  Gamepad2,
  Trophy,
  UserCircle,
  LayoutDashboard,
  Moon,
  Sun,
  Globe,
  ScrollText,
  ShieldCheck as AccountIcon,
  Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { uploadToImgbb } from "@/lib/imgbb";
import { cn, formatWhatsAppNumber } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import VerifiedBadge from "@/components/VerifiedBadge";

export default function ProfileView() {
  const { 
    user, loading, logout, isInitialLoading, updateUserProfile, allUsers, setActiveTab, theme, toggleTheme, storeSettings, language, setLanguage, t, setGlobalLoading
  } = useApp();
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({ name: "", phoneNumber: "", photoURL: "" });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      const rawPhone = user.phoneNumber || "";
      const cleanPhone = rawPhone.replace("+252", "").replace(/\D/g, "");
      setEditData({ 
        name: user.name || "", 
        phoneNumber: cleanPhone, 
        photoURL: user.photoURL || "" 
      });
    }
  }, [user, loading, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanPhone = editData.phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      toast({ 
        title: language === 'so' ? "Lambar khaldan" : "Invalid Number",
        description: t('phone_digits_error'), 
        variant: "destructive" 
      });
      return;
    }

    setIsSaving(true);
    try { 
      await updateUserProfile({
        ...editData,
        phoneNumber: "+252" + cleanPhone
      }); 
      setIsEditModalOpen(false); 
    } finally { setIsSaving(false); }
  };

  const handlePhotoUpload = async (file: File) => {
    setIsSaving(true);
    try {
      const url = await uploadToImgbb(file);
      setEditData(prev => ({ ...prev, photoURL: url }));
      toast({ title: t('photo_updated') || "Sawirka waa la soo geliyey!" });
    } catch (e) { toast({ title: "Upload failed", variant: "destructive" }); } finally { setIsSaving(false); }
  };

  const userRank = useMemo(() => {
    if (!user || !allUsers.length) return 0;
    const sorted = [...allUsers].sort((a, b) => (b.points || 0) - (a.points || 0));
    const index = sorted.findIndex(u => u.uid === user.uid);
    return index === -1 ? 0 : index + 1;
  }, [user, allUsers]);

  const helpLinks = storeSettings?.helpLinks || {};

  if (isInitialLoading || loading) {
    return (
      <div className="min-h-screen px-4 py-8 space-y-10 max-w-[1600px] mx-auto pt-16">
        <div className="flex flex-col items-center">
          <Skeleton className="w-32 h-32 md:w-56 md:h-56 rounded-full mb-8" />
          <Skeleton className="h-10 w-48 md:h-12 md:w-64 mb-4" />
          <Skeleton className="h-6 w-32 md:h-8 md:w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
           {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 sm:h-64 w-full rounded-[2rem] md:rounded-[3rem]" />)}
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={cn("pb-32 px-4 py-8 md:py-10 max-w-[1600px] mx-auto space-y-10 md:space-y-16 lg:space-y-24 page-transition")}>
      <section className="flex flex-col items-center text-center">
        <div className="relative group mb-6 md:mb-10">
          <div className="w-32 h-32 sm:w-44 sm:h-44 lg:w-64 lg:h-64 rounded-full border-[6px] md:border-[10px] border-white dark:border-slate-800 shadow-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 ring-2 md:ring-4 ring-primary/10 relative group-hover:scale-105 transition-transform duration-500">
            {user.photoURL ? <Image src={user.photoURL} alt="" fill className="object-cover" unoptimized /> : <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700"><User className="w-1/2 h-1/2" /></div>}
            {isSaving && <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center text-primary z-20"><Loader2 className="animate-spin w-8 h-8 md:w-12 md:h-12" /></div>}
          </div>
          <button onClick={() => setIsEditModalOpen(true)} className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 lg:bottom-6 lg:right-6 w-10 h-10 sm:w-14 sm:h-14 lg:w-20 lg:h-20 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border-2 sm:border-4 border-white dark:border-slate-800 active:scale-90 hover:scale-110 transition-all z-30">
            <Camera className="w-5 h-5 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
          </button>
        </div>

        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center justify-center gap-2 min-w-0 px-4">
            <h2 className="truncate font-bold text-2xl sm:text-4xl lg:text-7xl text-slate-900 dark:text-white tracking-tight max-w-[280px] sm:max-w-none">{user.name}</h2>
            {user.isVerified && <VerifiedBadge />}
            {user.isAdmin && !user.isVerified && <ShieldCheck className="text-primary w-6 h-6 sm:w-10 sm:h-10 lg:w-12 lg:h-12" />}
          </div>
          <div className="flex items-center justify-center gap-2 md:gap-4">
            <Badge className="bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-none px-4 py-1.5 md:px-6 md:py-2.5 rounded-full flex gap-1.5 items-center font-black text-[10px] sm:text-sm lg:text-xl shadow-sm">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 fill-amber-600" /> {user.points || 0} {t('points')}
            </Badge>
            <Badge variant="outline" className="border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-black text-[10px] sm:text-sm lg:text-xl rounded-full px-4 py-1.5 md:px-6 md:py-2.5 uppercase tracking-widest">
              {t('rank')} #{userRank}
            </Badge>
          </div>
        </div>
      </section>

      <div className="space-y-10 md:space-y-12 lg:space-y-16">
         {user.isAdmin && (
           <div className="space-y-3 md:space-y-4 max-w-4xl mx-auto">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] ml-4 md:ml-8 flex items-center gap-2"> <ShieldCheck size={14} /> {t('restricted_access')} </p>
              <button onClick={() => { setGlobalLoading(true); router.push('/admin'); }} className="w-full p-6 md:p-8 lg:p-14 bg-slate-900 dark:bg-slate-800 text-white rounded-[2rem] md:rounded-[3rem] lg:rounded-[4rem] shadow-2xl flex items-center justify-between group active:scale-[0.98] transition-all border-2 md:border-4 border-white/5">
                <div className="flex items-center gap-4 md:gap-8 lg:gap-12 text-left min-w-0">
                  <div className="w-12 h-12 md:w-16 md:h-16 lg:w-28 lg:h-28 bg-white/10 rounded-2xl lg:rounded-3xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform shrink-0">
                    <LayoutDashboard className="w-6 h-6 md:w-8 md:h-8 lg:w-16 lg:h-16" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-headline font-bold text-lg md:text-2xl lg:text-5xl uppercase tracking-tighter truncate">{t('admin_hub')}</h3>
                    <p className="text-white/40 text-[10px] md:text-sm lg:text-xl font-medium mt-1 truncate">{t('manage_orders')}</p>
                  </div>
                </div>
                <div className="w-8 h-8 md:w-12 md:h-12 lg:w-20 lg:h-20 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                  <ChevronRight className="w-5 h-5 md:w-8 md:h-8 lg:w-12 lg:h-12" />
                </div>
              </button>
           </div>
         )}

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-14">
            <ProfileGroup title={t('store_marketplace')}>
                <ProfileOption icon={ShoppingBag} label={t('orders')} onClick={() => setActiveTab('orders')} />
                <ProfileOption icon={AccountIcon} label={t('my_accounts')} onClick={() => setActiveTab('my-accounts')} />
                <ProfileOption icon={Gamepad2} label={t('sell_account')} onClick={() => setActiveTab('accounts')} />
                <ProfileOption icon={Trophy} label={t('leaderboard')} onClick={() => setActiveTab('ranking')} />
            </ProfileGroup>
            <ProfileGroup title={t('support_center')}>
                <ProfileOption icon={HelpCircle} label={t('app_tutorial')} onClick={() => { if (helpLinks.tutorialUrl) window.open(helpLinks.tutorialUrl, '_blank'); else toast({ title: "Coming Soon" }); }} />
                <ProfileOption icon={MessageCircle} label={t('whatsapp_support')} onClick={() => { const num = formatWhatsAppNumber(helpLinks.whatsappNumber || "252613982172"); window.open(`https://wa.me/${num}`, '_blank'); }} />
                <ProfileOption icon={Video} label={t('tiktok')} onClick={() => { const url = helpLinks.tiktokUrl || "https://tiktok.com/@Oskarshop"; window.open(url, '_blank'); }} />
                <ProfileOption icon={ScrollText} label={t('terms_of_service')} onClick={() => router.push('/terms')} />
            </ProfileGroup>
            <ProfileGroup title={t('global_settings')}>
                <ProfileOption icon={theme === 'light' ? Moon : Sun} label={theme === 'light' ? t('dark_mode') : t('light_mode')} onClick={toggleTheme} />
                <ProfileOption 
                  icon={Globe} 
                  label={t('language')} 
                  onClick={() => setLanguage(language === 'so' ? 'en' : 'so')} 
                  subLabel={language === 'so' ? 'Somali' : 'English'}
                />
                <ProfileOption icon={UserCircle} label={t('update_profile')} onClick={() => setIsEditModalOpen(true)} />
                <ProfileOption icon={LogOut} label={t('logout')} onClick={logout} variant="danger" />
            </ProfileGroup>
         </div>
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
         <DialogContent className="rounded-[2.5rem] md:rounded-[4rem] p-0 border-none shadow-2xl max-w-2xl bg-white dark:bg-slate-900 max-h-[95vh] overflow-y-auto scrollbar-hide w-[95vw] sm:w-full mx-auto my-auto">
            <div className="h-2 md:h-3 bg-primary w-full shrink-0" />
            <DialogHeader className="p-6 md:p-12 pb-0">
               <DialogTitle className="text-xl md:text-4xl font-headline font-bold text-slate-900 dark:text-white">{t('update_profile')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="p-5 md:p-12 space-y-5 md:space-y-10">
               <div className="flex justify-center mb-2 md:mb-8">
                  <div className="relative w-28 h-28 sm:w-32 md:w-44 md:h-44 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 group border-[4px] md:border-[6px] border-slate-50 dark:border-slate-800 shadow-xl ring-2 md:ring-8 ring-primary/5">
                     {editData.photoURL ? <Image src={editData.photoURL} alt="" fill className="object-cover" unoptimized /> : <div className="w-full h-full flex flex-col items-center justify-center text-slate-300"><User size={40} /></div>}
                     <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                     <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="w-5 h-5 md:w-8 md:h-8" /> <span className="text-[8px] md:text-[10px] font-black mt-1.5 md:mt-2 uppercase tracking-widest">Update</span></div>
                     {isSaving && <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center text-primary z-20"><Loader2 className="animate-spin w-8 h-8 md:w-12 md:h-12" /></div>}
                  </div>
               </div>
               <div className="space-y-4 md:space-y-6">
                  <ProfileInput label="Magacaaga" value={editData.name} onChange={val => setEditData({...editData, name: val})} required />
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-[10px] md:text-xs font-black uppercase tracking-[0.1em] md:tracking-[0.3em] text-muted-foreground ml-3 md:ml-6">
                      {language === 'so' ? 'Whatsapp number kaaga' : 'WhatsApp Number'}
                    </Label>
                    <div className="relative">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10 pointer-events-none">
                        <Smartphone className="w-4 h-4 md:w-6 md:h-6 text-[#7C3AED]" />
                        <span className="font-bold text-xs md:text-lg text-gray-400 border-r border-gray-200 pr-3">+252</span>
                      </div>
                      <Input 
                        type="tel" 
                        inputMode="numeric" 
                        value={editData.phoneNumber} 
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          const normalized = val.startsWith('0') ? val.substring(1) : val;
                          setEditData({...editData, phoneNumber: normalized.substring(0, 9)});
                        }} 
                        required
                        className="h-10 md:h-16 lg:h-20 rounded-lg md:rounded-[1.5rem] lg:rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-none pl-28 md:pl-44 pr-8 font-bold text-xs md:text-lg lg:text-2xl focus-visible:ring-primary shadow-inner" 
                      />
                    </div>
                  </div>
               </div>
               <Button type="submit" disabled={isSaving} className="w-full h-12 md:h-20 rounded-xl md:rounded-[2.5rem] font-black text-xs md:text-xl shadow-2xl shadow-primary/20 active:scale-95 transition-transform uppercase tracking-widest">
                 {isSaving ? <Loader2 className="animate-spin w-5 h-5 md:w-8 md:h-8" /> : t('save')}
               </Button>
            </form>
         </DialogContent>
      </Dialog>
    </div>
  );
}

function ProfileGroup({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="space-y-3 md:space-y-5 flex flex-col">
       {title && <p className="text-[10px] md:text-xs font-black text-muted-foreground uppercase tracking-[0.3em] ml-4 md:ml-8">{title}</p>}
       <Card className="rounded-[2rem] md:rounded-[3rem] lg:rounded-[4rem] border-none shadow-sm overflow-hidden glass flex-1">
          <div className="divide-y divide-slate-50 dark:divide-white/5 h-full"> {children} </div>
       </Card>
    </div>
  );
}

function ProfileOption({ icon: Icon, label, onClick, variant, subLabel }: { icon: any, label: string, onClick: () => void, variant?: 'danger', subLabel?: string }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between p-5 sm:p-8 lg:p-10 transition-all hover:bg-slate-50/50 dark:hover:bg-white/5 active:scale-[0.98]">
      <div className="flex items-center gap-4 sm:gap-6 min-w-0">
         <div className={cn( 
           "w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm transition-transform shrink-0", 
           variant === 'danger' ? "bg-red-50 dark:bg-red-500/10 text-red-500" : "bg-primary/10 dark:bg-primary/20 text-primary" 
         )}>
            <Icon className="w-5 h-5 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
         </div>
         <div className="text-left min-w-0">
            <span className={cn( 
              "font-bold text-sm sm:text-lg lg:text-2xl text-slate-900 dark:text-white tracking-tight truncate block", 
              variant === 'danger' ? "text-red-500" : "" 
            )}>{label}</span>
            {subLabel && <p className="text-[10px] md:text-xs font-black text-primary uppercase tracking-widest">{subLabel}</p>}
         </div>
      </div>
      <ChevronRight size={18} className="text-slate-300 dark:white/20 shrink-0" />
    </button>
  );
}

function ProfileInput({ label, value, onChange, type = "text", inputMode, required }: { label: string, value: string, onChange: (val: string) => void, type?: string, inputMode?: any, required?: boolean }) {
  return (
    <div className="space-y-1.5 md:space-y-2">
      <Label className="text-[10px] md:text-xs font-black uppercase tracking-[0.1em] md:tracking-[0.3em] text-muted-foreground ml-3 md:ml-6">{label}</Label>
      <Input 
        type={type} 
        inputMode={inputMode} 
        value={value} 
        required={required}
        onChange={e => onChange(e.target.value)} 
        className="h-10 md:h-16 lg:h-20 rounded-lg md:rounded-[1.5rem] lg:rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-none px-4 md:px-8 font-bold text-xs md:text-lg lg:text-2xl focus-visible:ring-primary shadow-inner" 
      />
    </div>
  );
}
