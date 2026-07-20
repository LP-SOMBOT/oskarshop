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
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    setGlobalLoading
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

    // Regular Market Posts
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

    // Auction Event Posts
    const events = (eventAccounts || [])
      .filter(e => {
        const isEndedByStatus = e.status === 'ended' || e.status === 'claimed';
        const isEndedByTime = e.endTime && now > e.endTime;
        
        // ONLY display if it's "upcoming" or "active" AND hasn't reached its strict time limit
        if (isEndedByStatus || isEndedByTime) return false;
        
        return e.status === 'active' || e.status === 'upcoming';
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

  return (
    <div className="min-h-screen pb-24 page-transition bg-slate-50 dark:bg-transparent">
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-950/80 dark:backdrop-blur-md shadow-sm border-b border-gray-100 dark:border-white/5 h-16 flex items-center justify-between px-4 md:hidden">
        <h1 className="text-lg font-headline font-bold text-slate-900 dark:text-white tracking-tight">{t('marketplace')}</h1>
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
            <DialogTitle className="text-lg sm:text-xl">Ma hubtaa?</DialogTitle>
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

function EventAccountCard({ event, onClick }: { event: any, onClick: () => void }) {
  const { t } = useApp();
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const diff = event.endTime - now;
      if (diff <= 0) {
        setTimeLeft(t('dhammaatay'));
        clearInterval(timer);
        return;
      }
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setTimeLeft(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [event.endTime, t]);

  const currentPrice = event.initialPrice + ((event.topTapsCount || 0) * event.tapPrice);
  const topParticipants = event.topParticipants || [];

  return (
    <Card 
      onClick={onClick}
      className="rounded-[2.5rem] md:rounded-[3.5rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden group hover:-translate-y-2 transition-all cursor-pointer relative ring-4 ring-amber-400/20"
    >
       <div className="aspect-[4/3] relative bg-slate-900 overflow-hidden">
          {event.imageUrls?.[0] ? (
            <Image src={event.imageUrls[0]} alt="" fill className="object-cover group-hover:scale-110 transition-transform duration-1000" unoptimized />
          ) : <div className="w-full h-full bg-slate-800" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          
          <div className="absolute top-4 left-4 flex flex-col gap-2">
             <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-none font-black text-[10px] px-4 py-1 shadow-lg tracking-widest uppercase">
                {t('event')}
             </Badge>
             {event.status === 'active' && (
               <div className="flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg w-fit">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
               </div>
             )}
          </div>

          <div className="absolute bottom-6 left-6 right-6">
             <div className="flex items-center gap-2 text-white font-black text-[10px] uppercase tracking-widest mb-2">
                <Clock size={12} className="text-amber-400" />
                <span>Waxay dhamaanaysaa: {timeLeft}</span>
             </div>
             <h4 className="text-white font-headline font-bold text-xl md:text-3xl uppercase leading-none truncate">{event.title}</h4>
          </div>
       </div>

       <div className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Participants</p>
                <div className="flex items-center gap-2">
                   <div className="flex -space-x-2">
                      {topParticipants.length > 0 ? (
                        topParticipants.map((p: any, i: number) => (
                          <div key={p.uid + i} className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 relative overflow-hidden shrink-0">
                             {p.avatar ? (
                               <Image src={p.avatar} alt="" fill className="object-cover" unoptimized />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                 <User size={8} className="text-slate-400" />
                               </div>
                             )}
                          </div>
                        ))
                      ) : (
                        [1,2,3].map(i => <div key={i} className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200" />)
                      )}
                   </div>
                   <span className="text-xs font-bold text-slate-900 dark:text-white">+{event.participantsCount || 0}</span>
                </div>
             </div>
             <div className="text-right space-y-1">
                <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Highest Bid</p>
                <p className="text-2xl font-headline font-bold text-amber-500 tracking-tighter">${currentPrice.toFixed(2)}</p>
             </div>
          </div>

          <Button className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all">
             {t('ka_qeeb_gal')} <ChevronRight size={18} className="ml-2" />
          </Button>
       </div>
    </Card>
  );
}

function AccountPostCard({ post, onClick, onEdit, onDelete, isOwner, isAdmin }: { post: any, onClick: () => void, onEdit: (e:any)=>void, onDelete: (e:any)=>void, isOwner: boolean, isAdmin?: boolean }) {
  const isGoogle = post.platform === 'Google';
  
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

  const [waitText, setWaitTime] = useState("");

  useEffect(() => {
    if (!post.createdAt) return;
    const updateTime = () => {
      setWaitTime(formatDistanceToNow(new Date(post.createdAt)));
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
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <div className="w-8 h-8 md:w-11 md:h-11 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative border-2 border-white dark:border-white/10 shadow-sm shrink-0">
            {post.authorAvatar ? (
              <Image src={post.authorAvatar} alt="" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700"><User size={16} /></div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 md:gap-2">
              <p className="font-bold text-xs md:text-sm text-slate-900 dark:text-white truncate max-w-[60px] md:max-w-[80px]">{post.authorName}</p>
              <Badge className={cn(
                "rounded-full text-[6px] md:text-[8px] font-black px-1.5 md:px-2 py-0 border-none uppercase tracking-widest shrink-0",
                isGoogle ? "bg-blue-500 text-white" : "bg-[#1877F2] text-white"
              )}>
                {post.platform}
              </Badge>
            </div>
            <p className="text-[7px] md:text-[9px] text-muted-foreground font-black uppercase tracking-tighter">{post.createdAt ? format(new Date(post.createdAt), 'MMM d, h:mm a') : 'Now'}</p>
          </div>
        </div>
        
        <div className="flex gap-1 shrink-0">
           <button 
             onClick={handleShare}
             className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-2xl flex items-center justify-center text-primary bg-primary/10 hover:bg-primary/20 transition-colors active:scale-90"
           >
              <Share2 className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />
           </button>
           {(isOwner || isAdmin) && (
             <>
                <Button size="icon" variant="ghost" className="h-7 h-7 md:h-10 md:w-10 text-blue-500 rounded-lg md:rounded-2xl" onClick={onEdit}><Edit className="w-3.5 h-3.5 md:w-4 md:h-4"/></Button>
                <Button size="icon" variant="ghost" className="h-7 h-7 md:h-10 md:w-10 text-red-500 rounded-lg md:rounded-2xl" onClick={onDelete}><Trash2 size={3.5} className="w-3.5 h-3.5 md:w-4 md:h-4"/></Button>
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
           <Badge variant="secondary" className="text-[7px] md:text-[10px] uppercase font-black tracking-widest rounded-md md:rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 md:px-4 py-0.5 md:py-1 truncate">{post.gameType}</Badge>
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
             Details <ArrowRight className="w-3.5 h-3.5 md:w-5 md:h-5" />
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
