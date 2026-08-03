'use client';

import { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/lib/context';
import { 
  ShieldCheck, 
  Plus, 
  ChevronRight, 
  Gamepad2, 
  Calendar,
  Star,
  Activity,
  Search,
  Loader2,
  ArrowLeft,
  ArrowRight,
  X,
  Trash2,
  Edit,
  Clock,
  Layers,
  Sparkles,
  DollarSign,
  ImageIcon,
  Share2,
  Sword,
  Target,
  Zap,
  Bomb,
  User,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from "@/components/ui/label";
import Image from 'next/image';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { uploadToImgbb } from '@/lib/imgbb';
import { useRouter } from 'next/navigation';
import VerifiedBadge from '@/components/VerifiedBadge';

export default function AccountsView() {
  const [searchQuery, setSearchQuery] = useState("");
  const { 
    accountPosts, 
    eventAccounts,
    user, 
    allUsers,
    orders, 
    setActiveTab, 
    isInitialLoading, 
    setIsPostingAccount,
    deleteAccountPost,
    language,
    t,
    setGlobalLoading,
    postAccount,
    updateAccountPost
  } = useApp();
  
  const router = useRouter();
  const [isPosting, setIsPosting] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const active = isPosting || !!editingPost;
    setIsPostingAccount(active);
    return () => setIsPostingAccount(false);
  }, [isPosting, editingPost, setIsPostingAccount]);

  const filteredPosts = useMemo(() => {
    const isAdmin = !!user?.isAdmin;
    const userId = user?.uid;

    const posts = (accountPosts || [])
      .filter(p => {
        const isOwner = userId && p.uid === userId;
        if (isAdmin || isOwner) return true;
        if (p.sold === true || p.status === 'sold') return false;
        if (p.status !== 'approved') return false;
        return true;
      });

    const events = (eventAccounts || [])
      .filter(e => {
        const isEndedByStatus = e.status === 'ended' || e.status === 'claimed';
        const isEndedByTime = e.endTime && now > e.endTime;
        if (isEndedByStatus || isEndedByTime) return false;
        return true;
      })
      .map(e => ({ ...e, isEvent: true }));

    return [...posts, ...events]
      .filter(p => {
        const queryStr = (searchQuery || "").toLowerCase();
        return (
          (p.title || "").toLowerCase().includes(queryStr) || 
          (p.authorName || "").toLowerCase().includes(queryStr) || 
          (p.gameType || "").toLowerCase().includes(queryStr) ||
          (p.gameName || "").toLowerCase().includes(queryStr)
        );
      })
      .sort((a, b) => {
        const aIsEvent = !!a.isEvent;
        const bIsEvent = !!b.isEvent;
        if (aIsEvent && !bIsEvent) return -1;
        if (!aIsEvent && bIsEvent) return 1;

        if (!aIsEvent && !bIsEvent) {
          const aProfile = allUsers.find(u => u.uid === a.uid);
          const bProfile = allUsers.find(u => u.uid === b.uid);
          const aVerified = aProfile?.isVerified ?? a.authorIsVerified;
          const bVerified = bProfile?.isVerified ?? b.authorIsVerified;

          if (aVerified && !bVerified) return -1;
          if (!aVerified && bVerified) return 1;
        }

        return (b.createdAt || 0) - (a.createdAt || 0);
      });
  }, [accountPosts, eventAccounts, searchQuery, user, now, allUsers]);

  const handleDeleteFinal = async () => {
    if (!deletingPostId) return;
    setIsDeleting(true);
    try {
      await deleteAccountPost(deletingPostId);
      setDeletingPostId(null);
    } catch (error) {
      toast({ title: "Failed to delete", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen pb-24 space-y-6 px-4 pt-6">
        <Skeleton className="h-10 w-48 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {[1, 2, 3].map(i => <Skeleton key={i} className="h-[400px] rounded-[2rem] w-full" />)}
        </div>
      </div>
    );
  }

  if (isPosting || editingPost) {
    return (
      <AccountPostingFlow 
        editingPost={editingPost} 
        onCancel={() => { setIsPosting(false); setEditingPost(null); }}
        onComplete={() => { setIsPosting(false); setEditingPost(null); }}
        postAccount={postAccount}
        updateAccountPost={updateAccountPost}
      />
    );
  }

  return (
    <div className="min-h-screen pb-24 page-transition bg-slate-50 dark:bg-transparent">
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-950/80 dark:backdrop-blur-md shadow-sm border-b border-gray-100 dark:border-white/5 h-16 flex items-center justify-between px-4 md:hidden">
        <h1 className="text-lg font-headline font-bold text-slate-900 dark:text-white tracking-tight">ciwaanada</h1>
        {user && (
          <button 
            onClick={() => setIsPosting(true)}
            className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-amber-500/20"
          >
            <Plus size={16} strokeWidth={3} />
            <span>iibi account</span>
          </button>
        )}
      </header>

      <main className="px-4 md:px-8 py-6 md:py-12 space-y-6 md:space-y-16 max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
           <div className="hidden md:block">
              <h1 className="text-3xl lg:text-5xl font-headline font-bold text-slate-900 dark:text-white">Account Marketplace</h1>
           </div>
           <div className="relative flex-1 md:w-64 lg:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input 
                placeholder={language === 'so' ? 'Raadi...' : 'Search listings...'} 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-14 rounded-2xl bg-white dark:bg-slate-900 border-none pl-12 font-bold shadow-sm"
              />
           </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-8">
          {filteredPosts.map((post: any) => {
            if (post.isEvent) {
              return (
                <EventAccountCard 
                  key={post.id} 
                  event={post} 
                  onClick={() => { setGlobalLoading(true); router.push(`/events/${post.id}`); }}
                />
              );
            }

            const authorProfile = allUsers.find(u => u.uid === post.uid);
            const authorIsVerified = authorProfile?.isVerified ?? post.authorIsVerified;

            return (
              <AccountPostCard 
                key={post.id} 
                post={post} 
                isVerified={authorIsVerified}
                onClick={() => { setGlobalLoading(true); router.push(`/accounts/${post.id}`); }}
                onEdit={(e) => { e.stopPropagation(); setEditingPost(post); }}
                onDelete={(e) => { e.stopPropagation(); setDeletingPostId(post.id); }}
                isOwner={post.uid === user?.uid}
                isAdmin={user?.isAdmin}
                language={language}
              />
            );
          })}
        </div>
      </main>

      <Dialog open={!!deletingPostId} onOpenChange={(v) => !v && setDeletingPostId(null)}>
        <DialogContent className="max-sm w-[90vw] rounded-[1.5rem]">
          <DialogHeader>
            <DialogTitle>Ma hubtaa?</DialogTitle>
            <DialogDescription>Post-kan waa la tirtiri doonaa.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4 flex-col sm:flex-row">
             <Button variant="ghost" onClick={() => setDeletingPostId(null)} className="rounded-xl flex-1 h-10" disabled={isDeleting}>Maya</Button>
             <Button variant="destructive" onClick={handleDeleteFinal} className="rounded-xl flex-1 h-10" disabled={isDeleting}>
                {isDeleting ? <Loader2 className="animate-spin" /> : "Haa, Tirtir"}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AccountPostingFlow({ editingPost, onCancel, onComplete, postAccount, updateAccountPost }: { editingPost: any, onCancel: () => void, onComplete: () => void, postAccount: any, updateAccountPost: any }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [form, setForm] = useState({
    gameType: 'freefire' as 'freefire' | 'bloodstrike',
    platform: 'Google Account',
    level: "",
    price: "",
    phone: "",
    imageUrls: [] as string[],
    evoWeapons: "",
    totalWeapons: "",
    emotes: "",
    arrivalEmotes: "",
    dharka: "",
    internalWeapons: "",
    executionEmotes: "",
    age: "",
    primeLevel: "Prime 1"
  });

  useEffect(() => {
    if (editingPost) {
      setForm({
        ...form,
        ...editingPost,
        level: editingPost.level?.toString() || "",
        price: editingPost.price?.toString() || "",
        evoWeapons: (editingPost.evoWeapons ?? "").toString(),
        totalWeapons: (editingPost.totalWeapons ?? "").toString(),
        emotes: (editingPost.emotes ?? "").toString(),
        arrivalEmotes: (editingPost.arrivalEmotes ?? "").toString(),
        dharka: (editingPost.dharka ?? "").toString(),
        internalWeapons: (editingPost.internalWeapons ?? "").toString(),
        executionEmotes: (editingPost.executionEmotes ?? "").toString(),
        primeLevel: editingPost.primeLevel || "Prime 1"
      });
    }
  }, [editingPost]);

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const url = await uploadToImgbb(file);
      setForm(prev => ({ ...prev, imageUrls: [...prev.imageUrls, url] }));
      toast({ title: "Sawirka waa la soo geliyey!" });
    } catch (error) {
      toast({ title: "Upload Failed", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        level: parseInt(form.level) || 0,
        price: parseFloat(form.price) || 0,
        evoWeapons: parseInt(form.evoWeapons) || 0,
        totalWeapons: parseInt(form.totalWeapons) || 0,
        emotes: parseInt(form.emotes) || 0,
        arrivalEmotes: parseInt(form.arrivalEmotes) || 0,
        dharka: parseInt(form.dharka) || 0,
        internalWeapons: parseInt(form.internalWeapons) || 0,
        executionEmotes: parseInt(form.executionEmotes) || 0,
        thumbnailUrl: form.imageUrls[0] || "",
      };

      if (editingPost) {
        await updateAccountPost(editingPost.id, payload);
      } else {
        await postAccount(payload);
      }
      onComplete();
    } catch (err) {
      toast({ title: "Failed to save post", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col animate-in slide-in-from-bottom-4 duration-500">
      <header className="h-16 md:h-20 bg-white dark:bg-slate-900 border-b dark:border-white/5 flex items-center justify-between px-4 md:px-10 shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full">
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h2 className="font-headline font-bold text-base md:text-lg uppercase tracking-tight">POST ACCOUNT</h2>
            <p className="text-primary font-black text-[8px] uppercase tracking-widest leading-none">VERIFIED MARKETPLACE</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
           <div className="w-1.5 h-1.5 rounded-full bg-primary" />
           <div className="w-3 h-1.5 rounded-full bg-primary/20" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 max-w-2xl mx-auto w-full space-y-6 md:space-y-8 pb-4">
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">SOO GELI DHAMAAN SAWIRADA ACCOUNTI-GA</h3>
          <div className="relative aspect-[16/10] w-full rounded-[1.5rem] md:rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 flex flex-col items-center justify-center group overflow-hidden shadow-inner cursor-pointer" onClick={() => !isUploading && document.getElementById('file-upload')?.click()}>
            {form.imageUrls.length > 0 ? (
               <div className="grid grid-cols-2 w-full h-full p-2 gap-2">
                  <div className="relative col-span-2 row-span-1 rounded-2xl overflow-hidden">
                     <Image src={form.imageUrls[0]} alt="" fill className="object-cover" unoptimized />
                  </div>
                  {form.imageUrls.slice(1, 3).map((url, idx) => (
                    <div key={idx} className="relative aspect-video rounded-xl overflow-hidden">
                       <Image src={url} alt="" fill className="object-cover" unoptimized />
                    </div>
                  ))}
               </div>
            ) : (
              <>
                <ImageIcon className="text-slate-300 w-10 h-10 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-black uppercase text-slate-400">RIIX HALKAAN SI AAD SAWIR USOO GELISID</span>
              </>
            )}
            <input id="file-upload" type="file" className="hidden" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
            {isUploading && <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>}
          </div>
        </div>

        <Card className="rounded-[1.5rem] md:rounded-[2rem] border-none shadow-sm bg-white dark:bg-slate-900 p-4 md:p-6 space-y-4">
           <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">DOORO NOOCA GAME KA</Label>
              <Select value={form.gameType} onValueChange={v => setForm({...form, gameType: v as any})}>
                 <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none px-4 font-bold shadow-inner">
                    <SelectValue />
                 </SelectTrigger>
                 <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem value="freefire" className="p-3 font-bold text-xs uppercase">Free Fire</SelectItem>
                    <SelectItem value="bloodstrike" className="p-3 font-bold text-xs uppercase">Blood Strike</SelectItem>
                 </SelectContent>
              </Select>
           </div>

           <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Main</Label>
              <Select value={form.platform} onValueChange={v => setForm({...form, platform: v})}>
                 <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none px-4 font-bold shadow-inner">
                    <SelectValue />
                 </SelectTrigger>
                 <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem value="Google Account" className="p-3 font-bold text-xs uppercase">Google Account</SelectItem>
                    <SelectItem value="Facebook Account" className="p-3 font-bold text-xs uppercase">Facebook Account</SelectItem>
                 </SelectContent>
              </Select>
           </div>

           {form.gameType === 'freefire' && (
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">PRIME LEVEL</Label>
                <Select value={form.primeLevel} onValueChange={v => setForm({...form, primeLevel: v})}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none px-4 font-bold shadow-inner">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(l => (
                        <SelectItem key={l} value={`Prime ${l}`} className="p-3 font-bold text-xs uppercase">Prime {l}</SelectItem>
                      ))}
                    </SelectContent>
                </Select>
              </div>
           )}

           <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">GELI DA' DA ACCOUNT TIGA</Label>
              <Input 
                value={form.age} 
                onChange={e => setForm({...form, age: e.target.value})} 
                className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold px-4 shadow-inner" 
                placeholder="e.g. 2 years" 
              />
           </div>
        </Card>

        <Card className="rounded-[1.5rem] md:rounded-[2rem] border-none shadow-sm bg-white dark:bg-slate-900 p-4 md:p-6 space-y-4">
           <h4 className="font-headline font-bold text-amber-500 flex items-center gap-2 uppercase text-xs">
             <Star size={16} fill="currentColor" /> LEVEL & PRICING
           </h4>

           <div className="space-y-4">
              <div className="space-y-1.5">
                 <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">ACCOUNT LEVEL</Label>
                 <Input 
                   type="number" 
                   value={form.level} 
                   onChange={e => setForm({...form, level: e.target.value})} 
                   className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold px-4 shadow-inner" 
                   placeholder="e.g. 65" 
                 />
              </div>

              <div className="space-y-1.5">
                 <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">QIIMAHA AAD KU RABTID ( $ )</Label>
                 <Input 
                   type="number" 
                   value={form.price} 
                   onChange={e => setForm({...form, price: e.target.value})} 
                   className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold px-4 shadow-inner text-primary" 
                   placeholder="e.g. 50" 
                 />
              </div>
           </div>
        </Card>

        <Card className="rounded-[1.5rem] md:rounded-[2rem] border-none shadow-sm bg-white dark:bg-slate-900 p-4 md:p-6 space-y-4">
           <div className="space-y-1">
              <h4 className="font-headline font-bold text-primary flex items-center gap-2 uppercase text-xs">
                <Target size={16} /> WAXYABAHA ACCOUNT TIGA YAALO
              </h4>
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest ml-6">SI FIICAN U XAQIIJI XOGTA</p>
           </div>

           <div className="grid grid-cols-2 gap-4">
              {form.gameType === 'bloodstrike' ? (
                <>
                  <AssetInput label="EVO WEAPONS" value={form.evoWeapons} onChange={v => setForm({...form, evoWeapons: v})} placeholder="54" />
                  <AssetInput label="INTERNAL WEAPONS" value={form.internalWeapons} onChange={v => setForm({...form, internalWeapons: v})} placeholder="3" />
                  <AssetInput label="EMOTES" value={form.emotes} onChange={v => setForm({...form, emotes: v})} placeholder="63" />
                  <AssetInput label="EXECUTION EMOTES" value={form.executionEmotes} onChange={v => setForm({...form, executionEmotes: v})} placeholder="12" />
                  <AssetInput label="ARRIVAL EMOTES" value={form.arrivalEmotes} onChange={v => setForm({...form, arrivalEmotes: v})} placeholder="8" />
                </>
              ) : (
                <>
                  <AssetInput label="EVO GUNS" value={form.evoWeapons} onChange={v => setForm({...form, evoWeapons: v})} placeholder="12" />
                  <AssetInput label="TOTAL WEAPONS" value={form.totalWeapons} onChange={v => setForm({...form, totalWeapons: v})} placeholder="240" />
                  <AssetInput label="EMOTES" value={form.emotes} onChange={v => setForm({...form, emotes: v})} placeholder="85" />
                  <AssetInput label="ARRIVAL EMOTES" value={form.arrivalEmotes} onChange={v => setForm({...form, arrivalEmotes: v})} placeholder="5" />
                  <AssetInput label="DHARKA" value={form.dharka} onChange={v => setForm({...form, dharka: v})} placeholder="150" />
                </>
              )}
           </div>
        </Card>

        <Card className="rounded-[1.5rem] md:rounded-[2rem] border-none shadow-sm bg-white dark:bg-slate-900 p-4 md:p-6 space-y-3">
           <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">GELI WHATSAPP KAGA</Label>
           <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10 pointer-events-none">
                 <span className="font-bold text-xs text-gray-400 border-r border-slate-200 pr-3">+252</span>
              </div>
              <Input 
                type="tel" 
                value={form.phone} 
                onChange={e => setForm({...form, phone: e.target.value.replace(/\D/g, '').substring(0, 9)})} 
                className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold pl-16 pr-4 shadow-inner" 
                placeholder="613982172" 
              />
           </div>
        </Card>

        <div className="pt-2">
          <Button 
            onClick={handleSubmit} 
            disabled={isSaving || !form.level || !form.price || form.imageUrls.length === 0} 
            className="w-full h-14 rounded-xl bg-primary text-white font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all gap-2"
          >
            {isSaving ? <Loader2 className="animate-spin" /> : <>SOO GELI <ArrowRight size={18} /></>}
          </Button>
        </div>
      </main>
    </div>
  );
}

function AssetInput({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string }) {
  return (
    <div className="space-y-1.5">
       <Label className="text-[8px] font-black uppercase text-slate-400 truncate ml-1">{label}</Label>
       <Input 
          type="number" 
          value={value} 
          onChange={e => onChange(e.target.value)} 
          className="h-10 rounded-lg bg-slate-50 dark:bg-slate-800 border-none font-bold px-3 shadow-inner text-xs" 
          placeholder={placeholder}
       />
    </div>
  );
}

function AccountPostCard({ post, isVerified, onClick, onEdit, onDelete, isOwner, isAdmin, language }: { post: any, isVerified: boolean, onClick: () => void, onEdit: (e:any)=>void, onDelete: (e:any)=>void, isOwner: boolean, isAdmin?: boolean, language: string }) {
  const firstName = (post.authorName || "Gamer").split(' ')[0];
  const [waitText, setWaitText] = useState("");

  useEffect(() => {
    if (!post.createdAt) return;
    const updateTime = () => setWaitText(formatDistanceToNow(new Date(post.createdAt)));
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [post.createdAt]);
  
  return (
    <Card 
      onClick={onClick}
      className="rounded-[2.5rem] md:rounded-[3rem] border-none shadow-lg bg-white dark:bg-slate-900 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98] cursor-pointer h-full flex flex-col"
    >
      <div className="p-4 flex items-center justify-between bg-white dark:bg-slate-950 border-b dark:border-white/5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative border-2 border-white dark:border-white/10 shadow-sm shrink-0">
            {post.authorAvatar ? <Image src={post.authorAvatar} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={16} /></div>}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-bold text-sm md:text-base text-slate-900 dark:text-white leading-tight">{firstName}</span>
              {isVerified && <VerifiedBadge />}
            </div>
            <p className="text-[7px] md:text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
               {post.createdAt ? format(new Date(post.createdAt), 'MMM d, h:mm a').toUpperCase() : '...'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
           {isOwner || isAdmin ? (
             <>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-full" onClick={onEdit}><Edit size={14}/></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 bg-red-50 dark:bg-red-950/20 rounded-full" onClick={onDelete}><Trash2 size={14}/></Button>
             </>
           ) : (
             <Button size="icon" variant="ghost" className="h-8 w-8 text-primary bg-primary/10 rounded-full" onClick={(e) => { e.stopPropagation(); }}><Share2 size={14} /></Button>
           )}
        </div>
      </div>

      <div className="aspect-[16/9] relative bg-slate-900 overflow-hidden flex items-center justify-center">
        {post.thumbnailUrl ? <Image src={post.thumbnailUrl} alt="" fill className="object-contain" unoptimized /> : <div className="w-full h-full flex items-center justify-center opacity-10"><Gamepad2 size={24} /></div>}
        <Badge className="absolute top-4 right-4 bg-primary/90 backdrop-blur-md text-white border-none rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest shadow-xl">LV {post.level || 0}</Badge>
      </div>

      <div className="p-5 space-y-5 flex-1 flex flex-col">
        <div className="flex justify-between items-center">
           <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[8px] font-black tracking-widest rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-4 py-1.5 uppercase border-none">{post.gameType}</Badge>
              <Badge className="bg-blue-500 text-white border-none font-bold text-[6px] md:text-[8px] uppercase tracking-tighter h-3.5 md:h-4 px-1.5">{post.platform?.toUpperCase().replace('ACCOUNT', '')}</Badge>
           </div>
           {isAdmin && (
             <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-primary/20 bg-primary/5 text-primary">
                <Clock size={12} strokeWidth={3} />
                <span className="text-sm font-black uppercase tracking-tight">{waitText}</span>
             </div>
           )}
        </div>

        <div className="flex flex-wrap gap-1.5">
           {post.gameType === 'bloodstrike' ? (
             <>
               <AssetPill label="Evo" value={post.evoWeapons} />
               <AssetPill label="Internal" value={post.internalWeapons} />
               <AssetPill label="Emotes" value={post.emotes} />
               <AssetPill label="Execution" value={post.executionEmotes} />
               <AssetPill label="Arrival" value={post.arrivalEmotes} />
             </>
           ) : (
             <>
               <AssetPill label="Evo" value={post.evoWeapons} />
               <AssetPill label="Weapons" value={post.totalWeapons} />
               <AssetPill label="Emote" value={post.emotes} />
               <AssetPill label="Arrival" value={post.arrivalEmotes} />
               <AssetPill label="Dharka" value={post.dharka} />
             </>
           )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-5 border-t dark:border-white/5">
           <div>
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1.5">QIIMAHA</p>
              <p className="text-2xl font-headline font-bold text-primary tracking-tighter leading-none">${parseFloat(post.price?.toString() || '0').toFixed(2)}</p>
           </div>
           <button className="rounded-full h-12 px-8 bg-primary text-white font-black text-[10px] shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center gap-2 uppercase tracking-[0.2em] border-none">
             IIBSO <ArrowRight size={14} strokeWidth={3} />
           </button>
        </div>
      </div>
    </Card>
  );
}

function AssetPill({ label, value }: { label: string, value: any }) {
  return (
    <Badge className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-none px-2 py-1 md:px-3 md:py-1.5 rounded-lg flex items-center gap-1.5 font-bold shadow-sm ring-1 ring-slate-100 dark:ring-white/5 whitespace-nowrap hover:ring-primary/20 transition-all">
       <span className="text-[7px] md:text-[9px] uppercase tracking-wider">{label}:</span>
       <span className="text-[9px] md:text-xs text-primary font-black">{value || 0}</span>
    </Badge>
  );
}

function EventAccountCard({ event, onClick }: { event: any, onClick: () => void }) {
  const [timeLeft, setTimeLeft] = useState({ h: "00", m: "00", s: "00" });
  
  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const diff = event.endTime - now;
      if (diff <= 0) { setTimeLeft({ h: "00", m: "00", s: "00" }); return; }
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setTimeLeft({ h, m, s });
    };
    update();
    const itv = setInterval(update, 1000);
    return () => clearInterval(itv);
  }, [event.endTime]);

  const highestBid = (event.initialPrice + ((event.topTapsCount || 0) * event.tapPrice)).toFixed(2);
  const topParticipants = event.topParticipants || [];

  return (
    <Card 
      onClick={onClick} 
      className="rounded-[2.5rem] md:rounded-[3rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer relative h-full flex flex-col group"
    >
       <div className="aspect-[4/3] relative overflow-hidden bg-slate-950">
          {event.imageUrls?.[0] ? (
            <Image src={event.imageUrls[0]} alt="" fill className="object-cover transition-transform duration-[5000ms] group-hover:scale-110" unoptimized />
          ) : <div className="w-full h-full bg-slate-800" />}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          
          <div className="absolute top-4 left-4 flex flex-col gap-2">
             <div className="bg-orange-500 text-white rounded-full px-4 py-1.5 font-black text-[9px] sm:text-[10px] uppercase tracking-widest shadow-lg w-fit">
                EVENT
             </div>
             <div className="bg-green-500 text-white rounded-full px-4 py-1.5 font-black text-[9px] sm:text-[10px] uppercase tracking-widest shadow-lg w-fit flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
             </div>
          </div>

          <div className="absolute bottom-4 left-5 right-5 text-white">
             <div className="flex items-center gap-2 mb-1.5">
                <Clock size={14} className="text-orange-400" />
                <p className="font-bold text-[9px] sm:text-[11px] uppercase tracking-widest opacity-90">
                   WAXAY DHAMAANAYSAA: <span className="font-mono text-orange-400">{timeLeft.h}:{timeLeft.m}:{timeLeft.s}</span>
                </p>
             </div>
             <h3 className="font-headline font-bold text-xl sm:text-3xl uppercase tracking-tight line-clamp-1 drop-shadow-lg">
               {event.title}
             </h3>
          </div>
       </div>

       <div className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
          <div className="flex justify-between items-end">
             <div className="space-y-2.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PARTICIPANTS</p>
                <div className="flex items-center gap-2">
                   <div className="flex -space-x-3">
                      {topParticipants.length === 0 ? (
                        <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-100 flex items-center justify-center text-slate-400"><User size={14} /></div>
                      ) : (
                        topParticipants.map((p: any, i: number) => (
                          <div key={p.uid + i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 overflow-hidden relative shadow-sm">
                             {p.avatar ? <Image src={p.avatar} alt="" fill className="object-cover" /> : <div className="w-full h-full bg-slate-200" />}
                          </div>
                        ))
                      )}
                   </div>
                   {event.participantsCount > topParticipants.length && (
                     <span className="text-sm font-bold text-slate-900 dark:text-white ml-1">+{event.participantsCount - topParticipants.length}</span>
                   )}
                </div>
             </div>

             <div className="text-right space-y-1">
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">HIGHEST BID</p>
                <p className="text-3xl sm:text-4xl font-headline font-bold text-orange-500 tracking-tighter leading-none">${highestBid}</p>
             </div>
          </div>

          <button className="w-full h-14 sm:h-16 rounded-[1.25rem] sm:rounded-[1.5rem] bg-[#00D1FF] hover:bg-[#00B8E6] text-white font-black uppercase tracking-widest text-xs sm:text-lg shadow-xl shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 border-none">
             KA QEEB GAL <ChevronRight size={20} strokeWidth={3} />
          </button>
       </div>
    </Card>
  );
}