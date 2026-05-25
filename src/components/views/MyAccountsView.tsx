
'use client';

import { useApp } from '@/lib/context';
import { 
  Trash2, 
  CheckCircle2, 
  Clock, 
  ChevronLeft, 
  Gamepad2, 
  Smartphone,
  Calendar,
  DollarSign,
  AlertCircle,
  AlertTriangle,
  XCircle,
  ArrowRight,
  RefreshCw,
  User,
  MessageCircle,
  Check,
  ShieldAlert,
  Eye,
  Star,
  ShoppingBag,
  TrendingUp,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { format, formatDistanceToNow } from 'date-fns';
import { cn, formatWhatsAppNumber } from '@/lib/utils';
import { useState, useMemo, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function MyAccountsView() {
  const { accountPosts, user, setActiveTab, deleteAccountPost, respondToSaleReport, renewAccountPost, markDeletionAsSeen, markAccountAsSold, storeSettings, isInitialLoading } = useApp();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renewingPost, setRenewingPost] = useState<any>(null);
  const [renewTerm, setRenewTerm] = useState<'weekly' | 'monthly'>('weekly');
  const [hasTriggeredRenewUssd, setHasTriggeredRenewUssd] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const myPosts = useMemo(() => {
    if (!user) return [];
    return (accountPosts || [])
      .filter(p => p.uid === user.uid)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [accountPosts, user]);

  const stats = useMemo(() => {
    return {
      active: myPosts.filter(p => p.status === 'approved' && !p.sold).length,
      pendingClaims: myPosts.reduce((acc, p) => {
        const claims = Object.values(p.claimants || {}).filter((c: any) => c.status === 'pending').length;
        return acc + (p.sold ? 0 : claims);
      }, 0),
      sold: myPosts.filter(p => p.sold).length
    };
  }, [myPosts]);

  const latePosts = useMemo(() => {
    const now = Date.now();
    return myPosts.filter(p => {
      const hasUnansweredClaim = Object.values(p.claimants || {}).some((c: any) => (now - c.timestamp) > 3600000 && c.status === 'pending');
      return hasUnansweredClaim && !p.sold && (p.status === 'approved' || p.status === 'holding');
    });
  }, [myPosts]);

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await deleteAccountPost(deletingId);
      setDeletingId(null);
    } catch (error) {
      toast({ title: "Failed to delete", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRenewUssd = () => {
    const fee = renewTerm === 'monthly' 
      ? (storeSettings?.config?.shop?.listingFeeMonthly || 3.00)
      : (storeSettings?.config?.shop?.listingFeeWeekly || 1.00);
    
    const paymentNum = storeSettings.paymentNumber || "613982172";
    const formattedFee = fee.toString().replace('.', '*');
    const ussdCode = `*712*${paymentNum}*${formattedFee}#`;
    
    window.location.href = `tel:${ussdCode.replace(/#/g, '%23')}`;
    setHasTriggeredRenewUssd(true);
  };

  const handleRenewFinal = async () => {
    if (!renewingPost) return;
    await renewAccountPost(renewingPost.id, renewTerm);
    setRenewingPost(null);
    setHasTriggeredRenewUssd(false);
  };

  if (isInitialLoading) {
    return (
      <div className="pb-24 px-4 sm:px-6 py-6 sm:py-10 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 sm:h-10 w-40 sm:w-48 rounded-xl" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 sm:h-64 w-full rounded-[1.5rem] sm:rounded-[2.5rem]" />)}
      </div>
    );
  }

  return (
    <div className="pb-32 px-4 sm:px-6 py-6 sm:py-10 max-w-5xl mx-auto page-transition overflow-x-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 sm:mb-16">
        <div className="flex items-center gap-4">
           <button 
             onClick={() => setActiveTab('profile')}
             className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-slate-400 hover:text-primary transition-colors border dark:border-white/5"
           >
             <ChevronLeft className="w-6 h-6" />
           </button>
           <div>
             <h1 className="text-2xl sm:text-4xl font-headline font-bold text-slate-900 dark:text-white uppercase tracking-tight">Management</h1>
             <p className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-widest opacity-60">Verified Listings Dashboard</p>
           </div>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-6">
           <StatBox icon={ShoppingBag} label="Active" value={stats.active} color="text-primary" />
           <StatBox icon={TrendingUp} label="Claims" value={stats.pendingClaims} color="text-amber-500" />
           <StatBox icon={CheckCircle2} label="Sold" value={stats.sold} color="text-green-500" />
        </div>
      </header>

      {latePosts.length > 0 && (
        <Card className="mb-10 p-6 md:p-10 rounded-[2.5rem] border-2 border-red-500 bg-red-50 dark:bg-red-950/20 shadow-2xl shadow-red-500/10 animate-in slide-in-from-top-4 duration-700 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-5"><ShieldAlert size={120} /></div>
           <div className="flex items-start gap-6 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg shrink-0 animate-pulse">
                 <AlertTriangle size={36} />
              </div>
              <div className="space-y-3 flex-1">
                 <h3 className="text-xl md:text-2xl font-headline font-bold text-red-700 dark:text-red-400 uppercase tracking-tight">Kaja Waab Account-yadaada</h3>
                 <p className="text-xs md:text-sm font-bold leading-relaxed text-red-800 dark:text-red-500/80 uppercase tracking-wide max-w-2xl">
                   Account-kaaga qof ayaa dhahay "Waan iibsaday", admin-ka ayaa WhatsApp ka kaala soo hadli doona. Fadlan si deg-deg ah ugu jawaab verification-ka. 24 saac gudahood haddii aadan uga jawaabin, account-ka waa laga saari doonaa listing-ka.
                 </p>
              </div>
           </div>
        </Card>
      )}

      {myPosts.length === 0 ? (
        <div className="py-24 sm:py-40 text-center space-y-6 sm:space-y-8 opacity-30 flex flex-col items-center">
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-100 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center text-slate-300 dark:text-slate-700 shadow-inner">
            <Gamepad2 className="w-12 h-12 sm:w-16 sm:h-16" />
          </div>
          <div className="space-y-2">
             <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">No Listings Found</p>
             <p className="text-sm sm:text-lg">Wali wax account ah maadan soo dhigin Marketplace-ka.</p>
          </div>
          <button onClick={() => setActiveTab('accounts')} className="bg-primary text-white rounded-2xl px-10 h-14 gap-2 font-black uppercase tracking-widest shadow-xl shadow-primary/20">
             Start Selling <ArrowRight size={20} />
          </button>
        </div>
      ) : (
        <div className="space-y-8 sm:space-y-12">
          {myPosts.map((post) => (
            <AccountManagedCard 
              key={post.id} 
              post={post} 
              onDelete={() => setDeletingId(post.id)}
              onRespond={(buyerId, confirmed) => respondToSaleReport(post.id, confirmed, buyerId)}
              onRenew={() => setRenewingPost(post)}
              onSeen={() => markDeletionAsSeen(post.id)}
              onMarkAsSold={() => markAccountAsSold(post.id)}
            />
          ))}
        </div>
      )}

      <Dialog open={!!renewingPost} onOpenChange={(v) => { if(!v) { setRenewingPost(null); setHasTriggeredRenewUssd(false); } }}>
        <DialogContent className="max-w-md w-[95vw] rounded-[2.5rem] p-8 border-none shadow-2xl bg-white dark:bg-slate-900">
           <DialogHeader className="mb-8">
             <DialogTitle className="text-2xl font-headline font-bold text-slate-900 dark:text-white uppercase tracking-tight">Renew Listing</DialogTitle>
             <DialogDescription className="text-xs sm:text-sm font-bold text-slate-50">Muda cusub u door account-kaaga si uu marketplace-ka ugu soo laabto.</DialogDescription>
           </DialogHeader>
           
           <div className="space-y-8">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Dooro Muda Cusub</label>
                 <Select value={renewTerm} onValueChange={(val: any) => setRenewTerm(val)}>
                    <SelectTrigger className="h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-6 font-bold shadow-inner">
                       <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl dark:bg-slate-900 border-none shadow-2xl z-[200]">
                       <SelectItem value="weekly" className="rounded-xl p-4 font-bold text-xs">Weekly (Isbuucle) - ${storeSettings?.config?.shop?.listingFeeWeekly || 1.00}</SelectItem>
                       <SelectItem value="monthly" className="rounded-xl p-4 font-bold text-xs">Monthly (Bile) - ${storeSettings?.config?.shop?.listingFeeMonthly || 3.00}</SelectItem>
                    </SelectContent>
                 </Select>
              </div>

              {!hasTriggeredRenewUssd ? (
                <Button onClick={handleRenewUssd} className="w-full h-20 rounded-3xl text-lg font-black uppercase tracking-widest shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90">
                   PAY FOR RENEWAL
                </Button>
              ) : (
                <Button onClick={handleRenewFinal} className="w-full h-20 rounded-3xl text-lg font-black uppercase tracking-widest shadow-2xl shadow-green-500/30 bg-green-600 hover:bg-green-700">
                   CONFIRM & REACTIVATE
                </Button>
              )}
           </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)}>
        <DialogContent className="max-sm rounded-[2rem] p-10 border-none shadow-2xl bg-white dark:bg-slate-900 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6"><Trash2 size={40}/></div>
          <DialogTitle className="text-2xl font-headline font-bold mb-2">Ma hubtaa?</DialogTitle>
          <DialogDescription className="text-sm font-bold text-slate-500 mb-8 uppercase tracking-widest">Post-kan dibna looma heli karo.</DialogDescription>
          <DialogFooter className="gap-3 flex-col sm:flex-row">
             <Button variant="ghost" onClick={() => setDeletingId(null)} className="rounded-xl flex-1 h-14 font-bold order-2 sm:order-1" disabled={isDeleting}>Maya</Button>
             <Button variant="destructive" onClick={handleDelete} className="rounded-xl flex-1 h-14 font-black uppercase tracking-widest order-1 sm:order-2 shadow-lg shadow-red-500/20" disabled={isDeleting}>
                {isDeleting ? <Loader2 className="animate-spin" /> : "Haa, Tirtir"}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AccountManagedCard({ post, onDelete, onRespond, onRenew, onSeen, onMarkAsSold }: { post: any, onDelete: () => void, onRespond: (buyerId: string, conf: boolean) => void, onRenew: () => void, onSeen: () => void, onMarkAsSold: () => void }) {
  const isExpired = post.expiresAt ? post.expiresAt < Date.now() : false;
  const isRejected = post.status === 'rejected';
  const [timeLeft, setTimeLeft] = useState("");
  const [autoDeleteTime, setAutoDeleteTime] = useState("");
  const { deleteAccountPost, allUsers } = useApp();

  const claimants = useMemo(() => Object.values(post.claimants || {}), [post.claimants]);
  const showVerification = claimants.length > 0 && !post.sold;
  
  const finalBuyer = useMemo(() => {
    if (!post.sold || !post.boughtBy) return null;
    const buyerProfile = allUsers.find(u => u.uid === post.boughtBy);
    const claimantRecord = post.claimants?.[post.boughtBy];
    return { ...buyerProfile, ...claimantRecord };
  }, [post.sold, post.boughtBy, allUsers, post.claimants]);

  useEffect(() => {
    if (!post.expiresAt) return;
    const updateCountdown = () => {
      const now = Date.now();
      const diff = post.expiresAt - now;
      if (diff <= 0) setTimeLeft("EXPIRED");
      else {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${d}d ${h}h ${m}m`);
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [post.expiresAt]);

  useEffect(() => {
    if (post.sellerSeenDeletionAt) {
      const interval = setInterval(() => {
        const now = Date.now();
        const diff = (post.sellerSeenDeletionAt! + 1800000) - now;
        if (diff <= 0) {
          deleteAccountPost(post.id);
          clearInterval(interval);
        } else {
          const m = Math.floor(diff / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          setAutoDeleteTime(`${m}m ${s}s`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [post.sellerSeenDeletionAt, post.id, deleteAccountPost]);

  const statusColors = {
    approved: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
    holding: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
    rejected: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
    sold: "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
  };

  return (
    <Card className={cn(
      "rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden group transition-all relative",
      isExpired && !post.sold && "ring-2 ring-red-500/20",
      showVerification && "ring-2 ring-primary shadow-2xl shadow-primary/10",
      post.sold && "ring-2 ring-green-500/30 grayscale-[0.2]"
    )}>
       <div className="p-6 sm:p-10 space-y-10">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            <div className="w-full lg:w-64 aspect-video lg:aspect-square relative rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 shadow-inner group-hover:shadow-2xl transition-all">
               {post.thumbnailUrl ? (
                 <Image src={post.thumbnailUrl} alt="" fill className="object-cover transition-transform duration-1000 group-hover:scale-110" unoptimized />
               ) : <Gamepad2 className="m-auto absolute inset-0 text-slate-300 w-12 h-12" />}
               
               {post.sold && (
                 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
                    <Badge className="bg-green-500 text-white border-none font-black uppercase tracking-[0.2em] text-[10px] px-4 py-1.5 shadow-2xl">SOLD</Badge>
                 </div>
               )}
               {(isExpired || isRejected) && !post.sold && (
                 <div className="absolute inset-0 bg-red-900/70 backdrop-blur-sm flex items-center justify-center z-10">
                    <Badge className="bg-red-600 text-white border-none font-black uppercase tracking-[0.2em] text-[10px] px-4 py-1.5 shadow-2xl">{isRejected ? 'REJECTED' : 'EXPIRED'}</Badge>
                 </div>
               )}
            </div>

            <div className="flex-1 space-y-8">
               <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0 pr-2">
                     <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-headline font-bold text-xl sm:text-3xl text-slate-900 dark:text-white uppercase truncate">{post.gameType} Account</h3>
                        <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase">{post.platform}</Badge>
                     </div>
                     <p className="text-[10px] sm:text-xs font-black text-muted-foreground uppercase tracking-widest opacity-40">Reference: #{post.id.toUpperCase()}</p>
                  </div>
                  <Badge className={cn(
                    "rounded-full px-5 py-2 font-black text-[10px] border-none uppercase tracking-[0.2em] shadow-sm shrink-0 transition-colors",
                    statusColors[post.status as keyof typeof statusColors] || statusColors.pending
                  )}>
                     {post.status}
                  </Badge>
               </div>

               <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t dark:border-white/5">
                  <StatusInfo icon={Calendar} label="Posted" value={post.createdAt ? format(new Date(post.createdAt), 'MMM d') : '...'} />
                  <StatusInfo icon={Star} label="Level" value={post.level || '0'} />
                  <StatusInfo icon={Clock} label="Expires" value={timeLeft || 'N/A'} color={isExpired ? "text-red-500" : "text-amber-500"} />
                  <StatusInfo icon={DollarSign} label="Value" value={`$${post.price || 0}`} color="text-primary" />
               </div>

               {/* SOLD SUCCESS BLOCK */}
               {post.sold && finalBuyer && (
                 <div className="p-6 md:p-8 bg-green-50 dark:bg-green-500/10 rounded-3xl border-2 border-green-500/20 space-y-6 animate-in zoom-in duration-700">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3 text-green-600">
                          <CheckCircle2 size={24} />
                          <h4 className="font-headline font-bold text-lg uppercase tracking-tight">Finalized Sale</h4>
                       </div>
                       <Badge variant="outline" className="border-green-500/30 text-green-600 font-bold text-[10px] uppercase">Verified</Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-white/50 dark:bg-black/20 p-4 rounded-2xl">
                       <div className="w-12 h-12 rounded-full overflow-hidden relative border-2 border-green-500/50 shrink-0">
                          {finalBuyer.photo ? <Image src={finalBuyer.photo} alt="" fill className="object-cover" /> : <User className="m-auto mt-2 opacity-20" />}
                       </div>
                       <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-black text-green-600/60 uppercase tracking-widest leading-none mb-1">Final Buyer</p>
                          <p className="text-lg font-bold text-slate-900 dark:text-white truncate">{finalBuyer.name || "Client"}</p>
                          <div className="flex items-center gap-2 mt-1">
                             <Smartphone size={12} className="text-green-500" />
                             <span className="text-xs font-black text-green-700 dark:text-green-400">{finalBuyer.whatsapp || "N/A"}</span>
                          </div>
                       </div>
                       <div className="text-right shrink-0">
                          <p className="text-[10px] font-black text-muted-foreground uppercase opacity-40 mb-1">Sold at</p>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{post.completedAt ? format(new Date(post.completedAt), 'MMM d, HH:mm') : '...'}</p>
                       </div>
                    </div>
                 </div>
               )}

               {/* Admin Feedback Block */}
               {(post.adminMessage || isRejected) && (
                  <div className="p-6 bg-slate-900 text-white rounded-3xl border-4 border-red-500/30 space-y-5 shadow-2xl">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <ShieldAlert className="text-red-500 w-6 h-6" />
                           <h4 className="font-black text-[10px] sm:text-xs uppercase tracking-widest text-red-400">Admin Response</h4>
                        </div>
                        <span className="text-[9px] font-black opacity-40 uppercase tracking-widest">Urgent Notice</span>
                     </div>
                     <p className="text-xs md:text-lg font-medium leading-relaxed italic text-slate-300 border-l-2 border-red-500/50 pl-4 py-1">
                        "{post.adminMessage || "Listing was flagged by security. Penalty enforcement applied."}"
                     </p>
                     
                     {!post.sellerSeenDeletionAt ? (
                       <Button onClick={onSeen} className="w-full h-12 md:h-16 rounded-2xl bg-white text-black hover:bg-slate-200 font-black uppercase tracking-widest text-xs md:text-sm gap-3 active:scale-[0.98] transition-all">
                          <Eye size={20} /> I have read the decision
                       </Button>
                     ) : (
                        <div className="flex items-center justify-between p-4 bg-red-950/30 rounded-2xl text-[11px] font-black uppercase text-red-400 border border-red-900/30">
                           <div className="flex items-center gap-2">
                              <History size={16} className="animate-spin-slow" />
                              <span>Auto-Deleting record in:</span>
                           </div>
                           <span className="bg-red-600 text-white px-4 py-1 rounded-full shadow-lg">{autoDeleteTime}</span>
                        </div>
                     )}
                  </div>
               )}
            </div>
          </div>

          {showVerification && (
            <div className="space-y-6 pt-10 border-t dark:border-white/5 animate-in slide-in-from-bottom-4">
               <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4 text-primary">
                     <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center"><AlertCircle size={24} /></div>
                     <div>
                        <h4 className="font-headline font-bold text-lg md:text-2xl uppercase tracking-tight">Purchase Claims</h4>
                        <p className="text-[10px] md:text-xs text-muted-foreground font-black uppercase tracking-widest opacity-60">Xaqiiji qofka kaa iibsaday account-ka</p>
                     </div>
                  </div>
                  <Badge className="bg-primary text-white border-none rounded-full h-8 px-4 font-black uppercase text-[10px]">{claimants.length} Requests</Badge>
               </div>
               
               <div className="grid grid-cols-1 gap-4">
                  {claimants.map((claim: any) => {
                    const isDecisionMade = claim.status !== 'pending';
                    return (
                      <Card key={claim.uid} className={cn(
                        "p-5 sm:p-8 rounded-3xl border transition-all flex flex-col sm:flex-row items-center justify-between gap-6",
                        claim.status === 'accepted' ? "bg-green-50 dark:bg-green-500/5 border-green-500/20" : 
                        claim.status === 'rejected' ? "bg-red-50 dark:bg-red-500/5 border-red-500/10 opacity-70 grayscale-[0.3]" : 
                        "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-white/5"
                      )}>
                         <div className="flex items-center gap-5 min-w-0 w-full sm:w-auto">
                            <div className={cn(
                              "w-16 h-16 rounded-3xl overflow-hidden relative border-4 shrink-0 shadow-lg",
                              claim.status === 'accepted' ? "border-green-500" : claim.status === 'rejected' ? "border-red-500" : "border-white dark:border-slate-800"
                            )}>
                               {claim.photo ? <Image src={claim.photo} alt="" fill className="object-cover" /> : <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400"><User size={24} /></div>}
                            </div>
                            <div className="min-w-0 space-y-1">
                               <div className="flex items-center gap-2">
                                  <p className="text-lg md:text-2xl font-bold truncate">{claim.name}</p>
                                  {isDecisionMade && (
                                    <Badge className={cn("text-[8px] h-5 uppercase font-black", claim.status === 'accepted' ? "bg-green-500" : "bg-red-500")}>
                                      {claim.status}
                                    </Badge>
                                  )}
                               </div>
                               <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2 text-primary font-black text-xs md:text-sm">
                                     <MessageCircle size={14} className="text-green-500" /> {claim.whatsapp}
                                  </div>
                                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                                  <p className="text-[10px] uppercase font-black text-muted-foreground opacity-40">{formatDistanceToNow(new Date(claim.timestamp), { addSuffix: true })}</p>
                               </div>
                            </div>
                         </div>
                         
                         {!isDecisionMade ? (
                           <div className="flex gap-3 w-full sm:w-auto shrink-0">
                              <Button onClick={() => onRespond(claim.uid, true)} className="flex-1 sm:flex-none h-14 md:h-16 px-8 bg-green-600 hover:bg-green-700 font-black uppercase tracking-widest text-xs rounded-2xl gap-2 shadow-xl shadow-green-600/20 active:scale-[0.98]">
                                 <Check size={20} /> SOLD
                              </Button>
                              <Button onClick={() => onRespond(claim.uid, false)} variant="outline" className="flex-1 sm:flex-none h-14 md:h-16 px-6 text-red-500 border-red-100 dark:border-red-900/20 font-black uppercase tracking-widest text-xs rounded-2xl gap-2 hover:bg-red-50 dark:hover:bg-red-950/20">
                                 <XCircle size={20} /> REJECT
                              </Button>
                           </div>
                         ) : (
                           <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground p-3 border rounded-xl border-dashed">
                              Final Decision Recorded
                           </div>
                         )}
                      </Card>
                    );
                  })}
               </div>
            </div>
          )}

          <div className="pt-8 border-t dark:border-white/5 flex flex-wrap gap-3">
             {!post.sold && post.status === 'approved' && (
                <Button 
                  onClick={onMarkAsSold}
                  className="h-12 md:h-14 rounded-2xl bg-green-600 hover:bg-green-700 font-black text-xs uppercase tracking-widest gap-2 shadow-xl shadow-green-600/20 px-8"
                >
                   <CheckCircle2 className="w-4 h-4" /> Mark as Sold
                </Button>
             )}
             {!post.sold && isExpired && !isRejected && (
               <Button onClick={onRenew} className="h-12 md:h-14 rounded-2xl bg-primary hover:bg-primary/90 font-black text-xs uppercase tracking-widest gap-2 shadow-xl shadow-primary/20 px-8">
                  <RefreshCw className="w-4 h-4" /> Renew Listing
               </Button>
             )}
             <Button variant="ghost" className="h-12 md:h-14 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 font-black text-xs uppercase tracking-widest gap-2 px-6" onClick={onDelete}>
                <Trash2 className="w-4 h-4" /> Delete record
             </Button>
          </div>
       </div>
    </Card>
  );
}

function StatBox({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-5 rounded-2xl sm:rounded-[2rem] border dark:border-white/5 shadow-sm text-center space-y-0.5 sm:space-y-1 min-w-0">
       <div className={cn("mx-auto w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center mb-1 sm:mb-2 bg-slate-50 dark:bg-slate-800", color)}>
          <Icon size={16} className="sm:w-5 sm:h-5" />
       </div>
       <p className="text-base sm:text-2xl font-headline font-bold text-slate-900 dark:text-white leading-none">{value}</p>
       <p className="text-[7px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 truncate">{label}</p>
    </div>
  );
}

function StatusInfo({ icon: Icon, label, value, color }: { icon: any, label: string, value: any, color?: string }) {
  return (
    <div className="space-y-1 min-w-0">
      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 opacity-50">
        <Icon size={10} /> {label}
      </p>
      <p className={cn("text-xs sm:text-base font-bold truncate", color || "text-slate-900 dark:text-white")}>{value}</p>
    </div>
  );
}
