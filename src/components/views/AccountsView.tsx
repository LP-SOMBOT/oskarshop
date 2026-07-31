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
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Smartphone,
  X,
  Trash2,
  Edit,
  Clock,
  LayoutGrid,
  Info,
  DollarSign,
  ImageIcon,
  Share2,
  Sword,
  Target,
  Zap,
  Bomb,
  ShoppingBag,
  User,
  CreditCard,
  Target as TargetIcon,
  Layers,
  Sparkles,
  Trophy,
  History,
  Lock,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Image from 'next/image';
import { format, formatDistanceToNow } from 'date-fns';
import { cn, formatWhatsAppNumber } from '@/lib/utils';
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
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
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
        const isInvolvedInDeal = userId && (orders || []).some(o => o.gameDetails?.postId === p.id && o.userId === userId);
        
        if (isAdmin || isOwner || isInvolvedInDeal) return true;
        if (p.sold === true || p.status === 'sold') return false;
        if (p.status !== 'approved') return false;
        if (p.hiddenFromMarket === true) return false;
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
  }, [accountPosts, eventAccounts, searchQuery, user, orders]);

  const myActivity = useMemo(() => {
    if (!user) return [];
    return (accountPosts || []).filter(p => p.uid === user.uid || (orders || []).some(o => o.gameDetails?.postId === p.id && o.userId === user.uid));
  }, [accountPosts, user, orders]);

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
      <div className="min-h-screen pb-24 space-y-6 md:space-y-10 max-w-[1600px] mx-auto px-4 md:px-6 pt-6 md:pt-10">
        <div className="flex justify-between items-center">
           <Skeleton className="h-10 md:h-12 w-48 md:w-64 rounded-2xl" />
           <Skeleton className="h-10 md:h-12 w-10 md:w-12 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-8">
           {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-[400px] md:h-[450px] rounded-[2rem] md:rounded-[3rem] w-full" />)}
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
        <button onClick={() => setIsActivityModalOpen(true)} className="relative p-2 text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-full">
           <Activity className="w-5 h-5" />
           {myActivity.some(p => p.status === 'pending' || p.status === 'holding') && (
             <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900" />
           )}
        </button>
      </header>

      <main className="px-4 md:px-8 py-6 md:py-12 space-y-6 md:space-y-16 max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
           <div className="hidden md:block">
              <h1 className="text-3xl lg:text-5xl font-headline font-bold text-slate-900 dark:text-white">Account Marketplace</h1>
              <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-xs lg:text-sm mt-1">Verified Gamer Accounts</p>
           </div>
           
           <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64 lg:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input 
                  placeholder={language === 'so' ? 'Raadi...' : 'Search listings...'} 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-14 lg:h-16 rounded-2xl md:rounded-[1.5rem] bg-white dark:bg-slate-900 border-none pl-12 font-bold shadow-sm"
                />
              </div>
              <button onClick={() => setIsActivityModalOpen(true)} className="hidden md:flex h-14 w-14 lg:h-16 lg:w-16 items-center justify-center bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-sm text-slate-400 hover:text-primary transition-colors border border-gray-100 dark:border-white/5">
                 <Activity className="w-7 h-7 lg:w-8 lg:h-8" />
              </button>
           </div>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="py-20 md:py-32 text-center space-y-4 md:space-y-6 opacity-30 flex flex-col items-center">
            <div className="w-20 h-20 md:w-32 md:h-32 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-10 h-10 md:w-16 md:h-16 text-slate-400 dark:text-slate-600" />
            </div>
            <div>
               <h3 className="font-bold text-xl md:text-3xl text-slate-900 dark:text-white">
                 {language === 'so' ? 'Hadda wax account ah ma yaalaan' : 'No active listings'}
               </h3>
               <p className="text-sm md:text-lg">
                 {language === 'so' ? 'Wali account lama soo dhigin' : 'Check back later or post your own account!'}
               </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-8 lg:gap-10">
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
        )}
      </main>

      {user && (
        <button 
          onClick={() => setIsPosting(true)}
          className="fixed bottom-24 right-4 md:right-6 lg:bottom-12 lg:right-12 w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-amber-500 text-white rounded-2xl md:rounded-[2rem] shadow-2xl shadow-amber-500/30 flex items-center justify-center active:scale-90 transition-all z-[90] hover:rotate-90"
        >
          <Plus className="w-8 h-8 md:w-10 md:h-10" strokeWidth={3} />
        </button>
      )}

      <Dialog open={!!deletingPostId} onOpenChange={(v) => !v && setDeletingPostId(null)}>
        <DialogContent className="max-w-sm w-[90vw] rounded-[1.5rem] sm:rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:xl">Ma hubtaa?</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">Post-kan waa la tirtiri doonaa, dibna looma heli karo.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4 flex-col sm:flex-row">
             <Button variant="ghost" onClick={() => setDeletingPostId(null)} className="rounded-xl flex-1 h-10 sm:h-12 order-2 sm:order-1" disabled={isDeleting}>Maya</Button>
             <Button variant="destructive" onClick={handleDeleteFinal} className="rounded-xl flex-1 h-10 sm:h-12 order-1 sm:order-2" disabled={isDeleting}>
                {isDeleting ? <Loader2 className="animate-spin" /> : "Haa, Tirtir"}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AccountPostingFlow({ editingPost, onCancel, onComplete, postAccount, updateAccountPost }: { editingPost: any, onCancel: () => void, onComplete: () => void, postAccount: any, updateAccountPost: any }) {
  const [step, setStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [form, setForm] = useState({
    gameType: 'freefire' as 'freefire' | 'bloodstrike',
    platform: 'Google',
    level: "",
    price: "",
    phone: "",
    imageUrls: [] as string[],
    evoWeapons: "0",
    totalWeapons: "0",
    emotes: "0",
    arrivalEmotes: "0",
    dharka: "0",
    internalWeapons: "0",
    executionEmotes: "0",
    age: "",
    primeLevel: "1"
  });

  useEffect(() => {
    if (editingPost) {
      setForm({
        ...form,
        ...editingPost,
        level: editingPost.level.toString(),
        price: editingPost.price.toString(),
        evoWeapons: (editingPost.evoWeapons || 0).toString(),
        totalWeapons: (editingPost.totalWeapons || 0).toString(),
        emotes: (editingPost.emotes || 0).toString(),
        arrivalEmotes: (editingPost.arrivalEmotes || 0).toString(),
        dharka: (editingPost.dharka || 0).toString(),
        internalWeapons: (editingPost.internalWeapons || 0).toString(),
        executionEmotes: (editingPost.executionEmotes || 0).toString(),
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
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col animate-in slide-in-from-bottom-4 duration-500">
      <header className="h-16 md:h-20 bg-white dark:bg-slate-900 border-b dark:border-white/5 flex items-center justify-between px-4 md:px-10 shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full">
            <ArrowLeft size={24} />
          </Button>
          <h2 className="font-headline font-bold text-lg md:text-2xl uppercase tracking-tight">
            {editingPost ? 'Edit Listing' : 'Post Account'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
           <div className={cn("w-2 h-2 rounded-full", step >= 1 ? "bg-primary" : "bg-slate-200")} />
           <div className={cn("w-2 h-2 rounded-full", step >= 2 ? "bg-primary" : "bg-slate-200")} />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-10 max-w-4xl mx-auto w-full space-y-10 pb-32">
        {step === 1 ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Account Gallery</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {form.imageUrls.map((url, idx) => (
                  <div key={url + idx} className="relative aspect-[4/3] rounded-2xl overflow-hidden group border dark:border-white/5 bg-slate-50 dark:bg-slate-900">
                    <Image src={url} alt="" fill className="object-cover" unoptimized />
                    <button 
                      onClick={() => setForm(f => ({ ...f, imageUrls: f.imageUrls.filter((_, i) => i !== idx) }))}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                    {idx === 0 && <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-white text-[8px] font-black uppercase text-center py-1">Thumbnail</div>}
                  </div>
                ))}
                {form.imageUrls.length < 8 && (
                  <div className="relative aspect-[4/3] rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center group hover:bg-slate-100 transition-colors">
                    {isUploading ? <Loader2 className="animate-spin text-primary" /> : <ImageIcon className="text-slate-300 w-10 h-10" />}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Game</Label>
                 <RadioGroup value={form.gameType} onValueChange={v => setForm({...form, gameType: v as any})} className="grid grid-cols-2 gap-3">
                    <div onClick={() => setForm({...form, gameType: 'freefire'})} className={cn("p-4 border-2 rounded-2xl cursor-pointer transition-all flex items-center gap-3", form.gameType === 'freefire' ? "border-primary bg-primary/5" : "border-slate-100 dark:border-white/5")}>
                       <Gamepad2 size={20} className={form.gameType === 'freefire' ? "text-primary" : "text-slate-400"} />
                       <span className="font-bold text-sm">Free Fire</span>
                    </div>
                    <div onClick={() => setForm({...form, gameType: 'bloodstrike'})} className={cn("p-4 border-2 rounded-2xl cursor-pointer transition-all flex items-center gap-3", form.gameType === 'bloodstrike' ? "border-primary bg-primary/5" : "border-slate-100 dark:border-white/5")}>
                       <Zap size={20} className={form.gameType === 'bloodstrike' ? "text-primary" : "text-slate-400"} />
                       <span className="font-bold text-sm">Blood Strike</span>
                    </div>
                 </RadioGroup>
              </div>
              <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Login Method</Label>
                 <Select value={form.platform} onValueChange={v => setForm({...form, platform: v})}>
                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none font-bold shadow-inner"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                       <SelectItem value="Google" className="p-4 font-bold text-xs uppercase">Google</SelectItem>
                       <SelectItem value="Facebook" className="p-4 font-bold text-xs uppercase">Facebook</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Level</Label>
                 <Input type="number" value={form.level} onChange={e => setForm({...form, level: e.target.value})} className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none font-bold shadow-inner" placeholder="75" />
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Price ($)</Label>
                 <Input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none font-bold shadow-inner text-primary" placeholder="10.00" />
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">WhatsApp No</Label>
                 <Input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value.replace(/\D/g, '')})} className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none font-bold shadow-inner" placeholder="613982172" />
              </div>
            </div>

            <Button onClick={() => setStep(2)} disabled={!form.level || !form.price || !form.phone || form.imageUrls.length === 0} className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
               Next: Asset Details <ArrowRight size={20} className="ml-2" />
            </Button>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border dark:border-white/5 space-y-8">
                <h3 className="font-headline font-bold text-lg uppercase tracking-tight flex items-center gap-2">
                  <ShieldCheck size={20} className="text-primary" /> {form.gameType === 'freefire' ? 'Free Fire Assets' : 'Blood Strike Assets'}
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                   {form.gameType === 'freefire' ? (
                     <>
                        <AssetInput label="Evo Weapons" value={form.evoWeapons} onChange={v => setForm({...form, evoWeapons: v})} />
                        <AssetInput label="Total Weapons" value={form.totalWeapons} onChange={v => setForm({...form, totalWeapons: v})} />
                        <AssetInput label="Emotes" value={form.emotes} onChange={v => setForm({...form, emotes: v})} />
                        <AssetInput label="Arrival Emotes" value={form.arrivalEmotes} onChange={v => setForm({...form, arrivalEmotes: v})} />
                        <AssetInput label="Dharka Sets" value={form.dharka} onChange={v => setForm({...form, dharka: v})} />
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Account Age</Label>
                           <Input value={form.age} onChange={e => setForm({...form, age: e.target.value})} className="h-12 rounded-xl bg-white dark:bg-slate-800 border-none font-bold shadow-inner" placeholder="2 Years" />
                        </div>
                     </>
                   ) : (
                     <>
                        <AssetInput label="Evo Skins" value={form.evoWeapons} onChange={v => setForm({...form, evoWeapons: v})} />
                        <AssetInput label="Internal Weapons" value={form.internalWeapons} onChange={v => setForm({...form, internalWeapons: v})} />
                        <AssetInput label="Total Emotes" value={form.emotes} onChange={v => setForm({...form, emotes: v})} />
                        <AssetInput label="Execution Emotes" value={form.executionEmotes} onChange={v => setForm({...form, executionEmotes: v})} />
                        <AssetInput label="Arrival Effects" value={form.arrivalEmotes} onChange={v => setForm({...form, arrivalEmotes: v})} />
                     </>
                   )}
                </div>
             </div>

             <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setStep(1)} className="flex-1 h-16 rounded-2xl font-bold uppercase tracking-widest border-2">Back</Button>
                <Button onClick={handleSubmit} disabled={isSaving} className="flex-[2] h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                  {isSaving ? <Loader2 className="animate-spin" /> : editingPost ? 'Update Listing' : 'Post Listing'}
                </Button>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}

function AssetInput({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
       <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 truncate block">{label}</Label>
       <Input type="number" value={value} onChange={e => onChange(e.target.value)} className="h-12 rounded-xl bg-white dark:bg-slate-800 border-none font-bold shadow-inner" />
    </div>
  );
}

function AccountPostCard({ post, onClick, onEdit, onDelete, isOwner, isAdmin, language }: { post: any, onClick: () => void, onEdit: (e:any)=>void, onDelete: (e:any)=>void, isOwner: boolean, isAdmin?: boolean, language: string }) {
  const isGoogle = post.platform === 'Google';
  const firstName = (post.authorName || "Gamer").split(' ')[0];
  
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/accounts/${post.id}`;
    const shareText = `Account iib ah level ${post.level} (${post.gameType}), ka iibso Oskarshop si amaan ah.`;
    if (navigator.share) {
      try { await navigator.share({ title: `Oskar Shop - ${post.authorName}`, text: shareText, url: shareUrl }); } catch (err) {}
    } else {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      toast({ title: "Link-ga waa la koobiyey!" });
    }
  };

  const [waitText, setWaitText] = useState("");

  useEffect(() => {
    if (!post.createdAt) return;
    const updateTime = () => {
      setWaitText(formatDistanceToNow(new Date(post.createdAt)));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [post.createdAt]);
  
  return (
    <Card 
      onClick={onClick}
      className={cn(
        "rounded-[2rem] md:rounded-[3rem] border-none shadow-lg md:shadow-xl bg-white dark:bg-slate-900 overflow-hidden transition-all hover:-translate-y-1 md:hover:-translate-y-2 hover:shadow-2xl active:scale-[0.98] group cursor-pointer h-full flex flex-col relative"
      )}
    >
      <div className="p-3.5 md:p-6 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 border-b dark:border-white/5">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <div className="w-8 h-8 md:w-11 md:h-11 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative border-2 border-white dark:border-white/10 shadow-sm shrink-0">
            {post.authorAvatar ? (
              <Image src={post.authorAvatar} alt="" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700"><User size={16} /></div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 min-w-0">
              <p className="truncate font-semibold text-xs md:text-sm text-slate-900 dark:text-white max-w-[120px]">{firstName}</p>
              {post.authorIsVerified && <VerifiedBadge />}
            </div>
            <p className="text-[7px] md:text-[9px] text-muted-foreground font-black uppercase tracking-tighter">{post.createdAt ? format(new Date(post.createdAt), 'MMM d, h:mm a') : 'Now'}</p>
          </div>
        </div>
        
        <div className="flex gap-1 shrink-0 ml-2">
           <button 
             onClick={handleShare}
             className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-2xl flex items-center justify-center text-primary bg-primary/10 hover:bg-primary/20 transition-colors active:scale-90"
           >
              <Share2 className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />
           </button>
           {(isOwner || isAdmin) && (
             <>
                <Button size="icon" variant="ghost" className="h-7 h-7 md:h-10 md:w-10 text-blue-500 rounded-lg md:rounded-2xl" onClick={onEdit}><Edit className="w-3.5 h-3.5 md:w-4 md:h-4"/></Button>
                <Button size="icon" variant="ghost" className="h-7 h-7 md:h-10 md:w-10 text-red-500 rounded-lg md:rounded-2xl" onClick={onDelete}><Trash2 size={16} className="w-3.5 h-3.5 md:w-4 md:h-4"/></Button>
             </>
           )}
        </div>
      </div>

      <div className="aspect-[4/3] relative bg-slate-900 overflow-hidden flex items-center justify-center">
        {post.thumbnailUrl ? (
          <Image src={post.thumbnailUrl} alt="" fill className="object-contain group-hover:scale-105 transition-transform duration-1000" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-10"><Gamepad2 className="w-12 h-12 md:w-20 md:h-20" /></div>
        )}
        
        <div className="absolute top-2.5 right-2.5 md:top-4 md:right-4 flex flex-col gap-1 md:gap-2 items-end">
           <Badge className="bg-primary/90 backdrop-blur-md text-white border-none rounded-lg md:rounded-2xl px-2.5 md:px-4 py-1 md:py-2 text-[7px] md:text-[10px] font-black uppercase tracking-widest shadow-xl">
             Lv {post.level || 0}
           </Badge>
        </div>
      </div>

      <div className="p-4 md:p-8 space-y-4 md:space-y-6 flex-1 flex flex-col">
        <div className="flex justify-between items-center">
           <div className="flex items-center gap-1.5 md:gap-2">
             <Badge variant="secondary" className="text-[7px] md:text-[10px] uppercase font-black tracking-widest rounded-md md:rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 md:px-4 py-0.5 md:py-1 truncate">{post.gameType}</Badge>
             <Badge className={cn(
                "rounded-md md:rounded-xl text-[6px] md:text-[8px] font-black px-1.5 md:px-2.5 py-0.5 md:py-1 border-none uppercase tracking-widest shrink-0",
                isGoogle ? "bg-blue-500 text-white" : "bg-[#1877F2] text-white"
              )}>
                {post.platform}
             </Badge>
           </div>
           <Badge variant="outline" className="text-[7px] md:text-[10px] font-black border-2 rounded-md md:rounded-xl py-0.5 md:py-1 px-1.5 md:px-3 shrink-0 text-primary border-primary/20 bg-primary/5">
              <Clock className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1 md:mr-1.5" /> {waitText}
           </Badge>
        </div>

        <div className="flex flex-wrap gap-2 md:gap-3">
           {post.gameType === 'bloodstrike' ? (
             <>
                <AssetMiniBadge label="Evo" value={post.evoWeapons} color="bg-amber-500" />
                <AssetMiniBadge label="Emotes" value={post.emotes} color="bg-purple-500" />
             </>
           ) : (
             <>
                <AssetMiniBadge label="Evo" value={post.evoWeapons} color="bg-amber-500" />
                <AssetMiniBadge label="Emotes" value={post.emotes} color="bg-purple-500" />
                <AssetMiniBadge label="Dharka" value={post.dharka} color="bg-pink-500" />
             </>
           )}
        </div>

        <div className="flex items-center justify-between pt-3 md:pt-6 border-t border-slate-50 dark:border-white/5 mt-auto">
           <div className="min-w-0">
             <p className="text-xl md:text-4xl font-headline font-bold text-primary tracking-tighter">${parseFloat(post.price?.toString() || '0').toFixed(2)}</p>
           </div>
           <button className="rounded-lg md:rounded-[1.5rem] h-9 md:h-14 px-3 md:px-8 font-black text-[10px] md:text-base shadow-xl shadow-primary/20 gap-1 md:gap-2 uppercase tracking-wide shrink-0 bg-primary text-white hover:bg-primary/90 flex items-center justify-center transition-all active:scale-95">
             {language === 'so' ? 'IIBSO' : 'BUY'} <ArrowRight className="w-3.5 h-3.5 md:w-5 md:h-5" />
           </button>
        </div>
      </div>
    </Card>
  );
}

function AssetMiniBadge({ label, value, color }: { label: string, value: number, color: string }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-2 py-1 border dark:border-white/5 shadow-sm shrink-0">
      <div className={cn("w-1 h-1 rounded-full", color)} />
      <span className="text-[7px] md:text-[9px] font-black uppercase text-muted-foreground tracking-wider">{label}:</span>
      <span className="text-[8px] md:text-[10px] font-bold text-slate-900 dark:text-white ml-auto">{value}</span>
    </div>
  );
}
