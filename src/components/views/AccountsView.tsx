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
  const { 
    accountPosts, 
    eventAccounts,
    user, 
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
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const active = isPosting || !!editingPost;
    setIsPostingAccount(active);
    return () => setIsPostingAccount(false);
  }, [isPosting, editingPost, setIsPostingAccount]);

  const filteredPosts = useMemo(() => {
    const isAdmin = !!user?.isAdmin;
    const userId = user?.uid;
    const now = Date.now();

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
        const query = searchQuery.toLowerCase();
        return (
          (p.title || "").toLowerCase().includes(query) || 
          (p.authorName || "").toLowerCase().includes(query) || 
          (p.gameType || "").toLowerCase().includes(query) ||
          (p.gameName || "").toLowerCase().includes(query)
        );
      })
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [accountPosts, eventAccounts, searchQuery, user]);

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

            return (
              <AccountPostCard 
                key={post.id} 
                post={post} 
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

      {user && (
        <button 
          onClick={() => setIsPosting(true)}
          className="fixed bottom-24 right-4 w-14 h-14 bg-amber-500 text-white rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 transition-all z-[90]"
        >
          <Plus className="w-8 h-8" strokeWidth={3} />
        </button>
      )}

      <Dialog open={!!deletingPostId} onOpenChange={(v) => !v && setDeletingPostId(null)}>
        <DialogContent className="max-w-sm w-[90vw] rounded-[1.5rem]">
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

      <main className="flex-1 overflow-y-auto p-4 md:p-6 max-w-2xl mx-auto w-full space-y-6 md:space-y-8">
        {/* Gallery Section */}
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

        {/* XOGTA GAME KA Section */}
        <Card className="rounded-[1.5rem] md:rounded-[2rem] border-none shadow-sm bg-white dark:bg-slate-900 p-5 md:p-8 space-y-5">
           <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">DOORO NOOCA GAME KA</Label>
              <Select value={form.gameType} onValueChange={v => setForm({...form, gameType: v as any})}>
                 <SelectTrigger className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-5 font-bold shadow-inner">
                    <SelectValue />
                 </SelectTrigger>
                 <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem value="freefire" className="p-3 font-bold text-xs uppercase">Free Fire</SelectItem>
                    <SelectItem value="bloodstrike" className="p-3 font-bold text-xs uppercase">Blood Strike</SelectItem>
                 </SelectContent>
              </Select>
           </div>

           <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">QAABKA LAGU SOO GALO</Label>
              <Select value={form.platform} onValueChange={v => setForm({...form, platform: v})}>
                 <SelectTrigger className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-5 font-bold shadow-inner">
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
                    <SelectTrigger className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-5 font-bold shadow-inner">
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
                className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold px-5 shadow-inner" 
                placeholder="e.g. 2 years" 
              />
           </div>
        </Card>

        {/* LEVEL & PRICING Section */}
        <Card className="rounded-[1.5rem] md:rounded-[2rem] border-none shadow-sm bg-white dark:bg-slate-900 p-5 md:p-8 space-y-5">
           <h4 className="font-headline font-bold text-amber-500 flex items-center gap-2 uppercase text-xs">
             <Star size={16} fill="currentColor" /> LEVEL & PRICING
           </h4>

           <div className="space-y-5">
              <div className="space-y-1.5">
                 <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">ACCOUNT LEVEL</Label>
                 <Input 
                   type="number" 
                   value={form.level} 
                   onChange={e => setForm({...form, level: e.target.value})} 
                   className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold px-5 shadow-inner" 
                   placeholder="e.g. 65" 
                 />
              </div>

              <div className="space-y-1.5">
                 <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">QIIMAHA AAD KU RABTID ( $ )</Label>
                 <Input 
                   type="number" 
                   value={form.price} 
                   onChange={e => setForm({...form, price: e.target.value})} 
                   className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold px-5 shadow-inner text-primary" 
                   placeholder="e.g. 50" 
                 />
              </div>
           </div>
        </Card>

        {/* WAXYABAHA ACCOUNT TIGA YAALO Section */}
        <Card className="rounded-[1.5rem] md:rounded-[2rem] border-none shadow-sm bg-white dark:bg-slate-900 p-5 md:p-8 space-y-6">
           <div className="space-y-1">
              <h4 className="font-headline font-bold text-primary flex items-center gap-2 uppercase text-xs">
                <Target size={16} /> WAXYABAHA ACCOUNT TIGA YAALO
              </h4>
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest ml-6">SI FIICAN U XAQIIJI XOGTA</p>
           </div>

           <div className="grid grid-cols-2 gap-4">
              {form.gameType === 'bloodstrike' ? (
                <>
                  <AssetInput icon={Sword} label="EVO WEAPONS" value={form.evoWeapons} onChange={v => setForm({...form, evoWeapons: v})} placeholder="54" />
                  <AssetInput icon={Target} label="INTERNAL WEAPONS" value={form.internalWeapons} onChange={v => setForm({...form, internalWeapons: v})} placeholder="3" />
                  <AssetInput icon={Zap} label="EMOTES" value={form.emotes} onChange={v => setForm({...form, emotes: v})} placeholder="63" />
                  <AssetInput icon={Bomb} label="EXECUTION EMOTES" value={form.executionEmotes} onChange={v => setForm({...form, executionEmotes: v})} placeholder="12" />
                  <AssetInput icon={Star} label="ARRIVAL EMOTES" value={form.arrivalEmotes} onChange={v => setForm({...form, arrivalEmotes: v})} placeholder="8" />
                </>
              ) : (
                <>
                  <AssetInput icon={Sword} label="EVO GUNS" value={form.evoWeapons} onChange={v => setForm({...form, evoWeapons: v})} placeholder="12" />
                  <AssetInput icon={Target} label="TOTAL WEAPONS" value={form.totalWeapons} onChange={v => setForm({...form, totalWeapons: v})} placeholder="240" />
                  <AssetInput icon={Zap} label="EMOTES" value={form.emotes} onChange={v => setForm({...form, emotes: v})} placeholder="85" />
                  <AssetInput icon={Star} label="ARRIVAL EMOTES" value={form.arrivalEmotes} onChange={v => setForm({...form, arrivalEmotes: v})} placeholder="5" />
                  <AssetInput icon={ShoppingBag} label="DHARKA" value={form.dharka} onChange={v => setForm({...form, dharka: v})} placeholder="150" />
                </>
              )}
           </div>
        </Card>

        {/* WHATSAPP Section */}
        <Card className="rounded-[1.5rem] md:rounded-[2rem] border-none shadow-sm bg-white dark:bg-slate-900 p-5 md:p-8 space-y-3">
           <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">GELI WHATSAPP KAGA</Label>
           <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10 pointer-events-none">
                 <span className="font-bold text-xs text-gray-400 border-r border-slate-200 pr-3">+252</span>
              </div>
              <Input 
                type="tel" 
                value={form.phone} 
                onChange={e => setForm({...form, phone: e.target.value.replace(/\D/g, '').substring(0, 9)})} 
                className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold pl-16 pr-5 shadow-inner" 
                placeholder="613982172" 
              />
           </div>
        </Card>

        <div className="pt-2">
          <Button 
            onClick={handleSubmit} 
            disabled={isSaving || !form.level || !form.price || form.imageUrls.length === 0} 
            className="w-full h-14 md:h-16 rounded-xl md:rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all gap-2"
          >
            {isSaving ? <Loader2 className="animate-spin" /> : <>SOO GELI <ArrowRight size={18} /></>}
          </Button>
        </div>
      </main>
    </div>
  );
}

function AssetInput({ icon: Icon, label, value, onChange, placeholder }: { icon: any, label: string, value: string, onChange: (v: string) => void, placeholder?: string }) {
  return (
    <div className="space-y-1.5">
       <div className="flex items-center gap-1 text-primary ml-1">
          <Icon size={10} />
          <Label className="text-[8px] font-black uppercase text-slate-400 truncate">{label}</Label>
       </div>
       <Input 
          type="number" 
          value={value} 
          onChange={e => onChange(e.target.value)} 
          className="h-10 md:h-12 rounded-lg md:rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold px-3 shadow-inner text-xs" 
          placeholder={placeholder}
       />
    </div>
  );
}

function AccountPostCard({ post, onClick, onEdit, onDelete, isOwner, isAdmin, language }: { post: any, onClick: () => void, onEdit: (e:any)=>void, onDelete: (e:any)=>void, isOwner: boolean, isAdmin?: boolean, language: string }) {
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
      {/* HEADER */}
      <div className="p-4 flex items-center justify-between bg-white dark:bg-slate-950 border-b dark:border-white/5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative border-2 border-white dark:border-white/10 shadow-sm shrink-0">
            {post.authorAvatar ? <Image src={post.authorAvatar} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={16} /></div>}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-bold text-sm md:text-base text-slate-900 dark:text-white leading-tight">{firstName}</span>
              {post.authorIsVerified && <VerifiedBadge />}
              <Badge className="bg-blue-500 text-white border-none font-bold text-[6px] md:text-[8px] uppercase tracking-tighter h-3.5 md:h-4 px-1.5">{post.platform?.toUpperCase().replace('ACCOUNT', '')}</Badge>
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
             <Button size="icon" variant="ghost" className="h-8 w-8 text-primary bg-primary/10 rounded-full" onClick={(e) => { e.stopPropagation(); /* share logic */ }}><Share2 size={14} /></Button>
           )}
        </div>
      </div>

      {/* IMAGE AREA */}
      <div className="aspect-[16/9] relative bg-slate-900 overflow-hidden flex items-center justify-center">
        {post.thumbnailUrl ? <Image src={post.thumbnailUrl} alt="" fill className="object-contain" unoptimized /> : <div className="w-full h-full flex items-center justify-center opacity-10"><Gamepad2 size={24} /></div>}
        <Badge className="absolute top-4 right-4 bg-primary/90 backdrop-blur-md text-white border-none rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest shadow-xl">LV {post.level || 0}</Badge>
      </div>

      {/* CONTENT AREA */}
      <div className="p-5 space-y-5 flex-1 flex flex-col">
        <div className="flex justify-between items-center">
           <Badge variant="secondary" className="text-[8px] font-black tracking-widest rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-4 py-1.5 uppercase border-none">{post.gameType}</Badge>
           <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-primary/20 bg-primary/5 text-primary">
              <Clock size={12} strokeWidth={3} />
              <span className="text-[10px] font-black uppercase tracking-tight">{waitText}</span>
           </div>
        </div>

        {/* ASSET PILLS GRID */}
        <div className="flex flex-wrap gap-2.5">
           {post.gameType === 'bloodstrike' ? (
             <>
               <AssetPill color="bg-orange-500" label="EVO WEAPONS" value={post.evoWeapons} />
               <AssetPill color="bg-blue-500" label="INTERNAL WEAPONS" value={post.internalWeapons} />
               <AssetPill color="bg-purple-500" label="EMOTES" value={post.emotes} />
               <AssetPill color="bg-indigo-500" label="EXECUTION" value={post.executionEmotes} />
               <AssetPill color="bg-cyan-500" label="ARRIVAL" value={post.arrivalEmotes} />
             </>
           ) : (
             <>
               <AssetPill color="bg-orange-500" label="EVO WEAPONS" value={post.evoWeapons} />
               <AssetPill color="bg-blue-500" label="TOTAL WEAPONS" value={post.totalWeapons} />
               <AssetPill color="bg-purple-500" label="EMOTES" value={post.emotes} />
               <AssetPill color="bg-indigo-500" label="ARRIVAL EMOTES" value={post.arrivalEmotes} />
               <AssetPill color="bg-pink-500" label="DHARKA" value={post.dharka} />
             </>
           )}
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between mt-auto pt-5 border-t dark:border-white/5">
           <div>
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1.5">QIIMAHA</p>
              <p className="text-2xl font-headline font-bold text-primary tracking-tighter leading-none">${parseFloat(post.price?.toString() || '0').toFixed(2)}</p>
           </div>
           <button className="rounded-full h-12 px-8 bg-primary text-white font-black text-[10px] shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center gap-2 uppercase tracking-[0.2em] border-none">
             DETAILS <ArrowRight size={14} strokeWidth={3} />
           </button>
        </div>
      </div>
    </Card>
  );
}

function AssetPill({ color, label, value }: { color: string, label: string, value: any }) {
  return (
    <div className="flex items-center gap-2.5 bg-white dark:bg-slate-800/50 border dark:border-white/5 px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-shadow">
       <div className={cn("w-2 h-2 rounded-full shrink-0 shadow-sm", color)} />
       <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{label}:</span>
       <span className="text-[12px] font-black text-slate-900 dark:text-white">{value || 0}</span>
    </div>
  );
}

function EventAccountCard({ event, onClick }: { event: any, onClick: () => void }) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const diff = event.endTime - now;
      if (diff <= 0) { setTimeLeft("Ended"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    update();
    const itv = setInterval(update, 1000);
    return () => clearInterval(itv);
  }, [event.endTime]);

  return (
    <Card onClick={onClick} className="rounded-[2.5rem] md:rounded-[3rem] border-none shadow-2xl bg-slate-900 text-white overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer relative h-full flex flex-col">
       <div className="aspect-[4/3] relative">
          {event.imageUrls?.[0] ? <Image src={event.imageUrls[0]} alt="" fill className="object-cover" unoptimized /> : <div className="w-full h-full bg-slate-800" />}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
          <div className="absolute top-4 left-4 flex gap-2">
             <Badge className="bg-red-500 text-white border-none font-black text-[9px] px-3 py-1 animate-pulse">LIVE BID</Badge>
             <Badge className="bg-white/10 backdrop-blur-md text-white border-none font-black text-[9px] px-3 py-1 flex items-center gap-1.5"><Clock size={10} /> {timeLeft}</Badge>
          </div>
       </div>
       <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
          <div className="space-y-1">
             <h3 className="font-headline font-bold text-lg md:text-xl uppercase tracking-tight line-clamp-1">{event.title}</h3>
             <p className="text-primary font-black text-[9px] uppercase tracking-widest">{event.gameName}</p>
          </div>
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
             <div className="space-y-0.5">
                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Highest Bid</p>
                <p className="text-xl md:text-2xl font-headline font-bold text-primary">${(event.initialPrice + ((event.topTapsCount || 0) * event.tapPrice)).toFixed(2)}</p>
             </div>
             <button className="h-10 md:h-12 px-6 rounded-xl md:rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[10px] md:text-xs shadow-xl shadow-white/5 group-hover:bg-primary group-hover:text-white transition-all">BID NOW</button>
          </div>
       </div>
    </Card>
  );
}

function EventCard({ event, viewLabel, timeLeftLabel }: { event: any, viewLabel: string, timeLeftLabel: string }) {
  const router = useRouter();
  const { setGlobalLoading } = useApp();
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!event.expiresAt) return;
    const updateTimer = () => {
      const now = Date.now();
      const diff = event.expiresAt! - now;
      if (diff <= 0) {
        setTimeLeft("Dhamaaday");
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(days > 0 ? `${days}d ${hours}:${minutes}:${seconds}` : `${hours}:${minutes}:${seconds}`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [event.expiresAt]);

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    setGlobalLoading(true);
    if (event.redirectRoute) {
      router.push(event.redirectRoute);
    } else {
      router.push(`/events/${event.id}`);
    }
  };

  return (
    <Card 
      onClick={handleAction}
      className="group overflow-hidden rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-lg bg-white dark:bg-slate-900 transition-all hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
    >
      <div className="relative aspect-[16/9] w-full">
        <Image src={event.thumbnailUrl || 'https://picsum.photos/seed/event/600/400'} alt={event.title} fill className="object-cover" unoptimized />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 md:bottom-6 md:left-6">
          <Badge className="bg-primary text-white border-none rounded-full px-2 py-0.5 md:px-3 md:py-1 text-[7px] md:text-[10px] font-bold mb-1.5 md:mb-3 uppercase tracking-widest">
            EVENT
          </Badge>
          <h3 className="text-white font-headline font-bold text-sm md:text-xl leading-tight line-clamp-1">{event.title}</h3>
        </div>
      </div>
      <div className="p-4 md:p-6">
        <p className="text-[11px] md:text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-4 md:mb-6 font-medium">{event.shortDescription || event.description}</p>
        
        {event.expiresAt && (
          <div className="mb-4 md:mb-6 p-2.5 md:p-4 bg-amber-50 dark:bg-amber-500/5 rounded-xl md:rounded-2xl flex items-center gap-2 md:gap-4 text-amber-700 dark:text-amber-400">
             <Clock className="w-4 h-4 md:w-5 md:h-5 animate-pulse" />
             <div className="flex flex-col">
                <span className="text-[7px] md:text-[10px] font-black uppercase tracking-wider opacity-60">{timeLeftLabel}</span>
                <span className="text-[11px] md:text-base font-bold font-mono">{timeLeft}</span>
             </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-slate-50 dark:border-white/5">
          <div className="flex items-center gap-1.5 text-[10px] md:text-sm font-bold text-primary">
            <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Active
          </div>
          <Button 
            variant="ghost" 
            className="rounded-full h-8 md:h-10 px-3 md:px-6 font-bold text-[10px] md:text-sm hover:bg-primary/10 transition-all uppercase tracking-widest" 
            onClick={handleAction}
          >
            {event.buttonText || viewLabel} <ChevronRight className="w-3 h-3 ml-0.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function GameCollectionCard({ game, onClick, buyLabel }: { game: any, onClick: () => void, buyLabel: string }) {
  return (
    <Card 
      onClick={onClick}
      className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 rounded-xl md:rounded-[1.5rem] p-0.5 md:p-1.5 flex items-center h-20 sm:h-24 md:h-28 lg:h-32 cursor-pointer w-full"
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 rounded-lg md:rounded-2xl overflow-hidden relative shrink-0 m-0.5 bg-slate-50 dark:bg-slate-800 border dark:border-white/5">
        {game.icon ? (
          <Image src={game.icon} alt={game.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-primary font-bold text-[10px] md:text-xl">G</div>
        )}
      </div>
      
      <div className="flex-1 px-3 md:px-5 lg:px-8 min-w-0">
        <h3 className="font-headline font-bold text-base sm:text-lg md:text-xl lg:text-3xl text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-primary transition-colors">
          {game.title}
        </h3>
      </div>

      <button className="h-full px-4 sm:px-6 md:px-10 lg:px-16 bg-primary text-white font-black text-xs sm:sm md:text-xl lg:text-3xl flex items-center justify-center transition-all group-hover:bg-primary/90 active:scale-95 uppercase tracking-widest shrink-0 ml-auto">
        {buyLabel}
      </button>
    </Card>
  );
}
