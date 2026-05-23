"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import { 
  ArrowLeft, 
  ShieldCheck, 
  Star, 
  Calendar, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  User,
  CheckCircle2,
  Gamepad2,
  X,
  Maximize2,
  Share2,
  Sword,
  Target,
  Zap,
  Bomb,
  Info,
  History,
  Check,
  PartyPopper,
  ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export default function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const { accountPosts, user, orders, buyAccountPost, reportAccountOutcome } = useApp();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const post = useMemo(() => {
    return (accountPosts || []).find(p => p.id === id);
  }, [accountPosts, id]);

  const associatedOrder = useMemo(() => {
    if (!post || !user) return null;
    return (orders || []).find(o => o.gameDetails?.postId === post.id);
  }, [orders, post, user]);

  const isBuyer = post?.holdingBy === user?.uid;
  const isOwner = post?.uid === user?.uid;
  const isAdmin = user?.isAdmin;
  
  const hasBought = associatedOrder?.buyerOutcome === 'bought';
  
  const showSold = post?.status === 'sold';
  const showSuccess = (post?.status === 'holding' || post?.buyerReported) && hasBought && isBuyer;
  const showHolding = post?.status === 'holding' && !isBuyer;

  const buyButtonText = useMemo(() => {
    if (showSold) return "Waa la iibiyay";
    if (showSuccess) return "Waa lagu guuleystay!";
    if (isOwner) return "Post-kaaga waaye";
    if (showHolding) return "Account kaan hada lama heli karo";
    return "Laxariir Seller-ka";
  }, [showSold, showSuccess, isOwner, showHolding]);

  const handleShare = async () => {
    if (!post) return;
    const shareUrl = `${window.location.origin}/accounts/${post.id}`;
    const shareTitle = `Oskar Shop - ${post.authorName}'s Account`;
    const shareText = `Account iib ah level ${post.level} (${post.gameType}), si amaan ah uga iibso Oskarshop.`;

    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
      } catch (err) {}
    } else {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      toast({ title: "Link-ga waa la koobiyey!" });
    }
  };

  if (!post) {
    return (
      <div className="min-h-screen pb-24 space-y-6 bg-white dark:bg-slate-950">
        <Skeleton className="h-64 md:h-[400px] w-full" />
        <div className="px-6 space-y-4 max-w-4xl mx-auto">
           <Skeleton className="h-10 w-3/4 rounded-xl" />
           <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const images = (post.imageUrls && post.imageUrls.length > 0) ? post.imageUrls : [post.thumbnailUrl];

  return (
    <div className="min-h-screen pb-32 bg-slate-50 dark:bg-transparent page-transition overflow-x-hidden">
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b dark:border-white/5 h-14 md:h-16 flex items-center px-4 md:px-6 justify-between">
         <div className="flex items-center gap-2 md:gap-4">
            <button onClick={() => router.push('/#accounts')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-90"><ArrowLeft size={20} className="md:w-6 md:h-6" /></button>
            <h1 className="text-base md:text-lg font-headline font-bold">Details</h1>
         </div>
         <button onClick={handleShare} className="p-2 text-primary bg-primary/10 rounded-full active:scale-90 transition-transform"><Share2 size={18} className="md:w-5 md:h-5" /></button>
      </header>

      <main className="max-w-6xl mx-auto md:mt-6 lg:mt-10 md:px-6">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-10">
          {/* Image Carousel */}
          <section className="lg:flex-1 relative aspect-[4/3] w-full bg-slate-900 md:rounded-[2rem] lg:rounded-[3rem] overflow-hidden shadow-xl">
             {images.map((url, idx) => (
               <div key={url + idx} className={cn("absolute inset-0 transition-opacity duration-500 flex items-center justify-center", idx === currentImageIndex ? "opacity-100 z-10" : "opacity-0 z-0")}>
                 <Image src={url} alt="" fill className="object-contain cursor-pointer" unoptimized onClick={() => setFullScreenImage(url)} />
               </div>
             ))}
             {images.length > 1 && (
               <>
                 <button onClick={() => setCurrentImageIndex((p) => (p > 0 ? p - 1 : images.length - 1))} className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-black/40 text-white rounded-full flex items-center justify-center z-20 active:scale-90"><ChevronLeft size={18} className="md:w-5 md:h-5" /></button>
                 <button onClick={() => setCurrentImageIndex((p) => (p < images.length - 1 ? p + 1 : 0))} className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-black/40 text-white rounded-full flex items-center justify-center z-20 active:scale-90"><ChevronRight size={18} className="md:w-5 md:h-5" /></button>
                 <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                    {images.map((_, i) => (
                      <div key={i} className={cn("w-1.5 h-1.5 rounded-full transition-all", i === currentImageIndex ? "bg-white w-4" : "bg-white/40")} />
                    ))}
                 </div>
               </>
             )}
          </section>

          {/* Content */}
          <div className="px-4 md:px-0 lg:flex-1 space-y-6 md:space-y-8">
             <div className="flex justify-between items-start">
                <div className="min-w-0 pr-4">
                   <div className="flex flex-wrap items-center gap-2 mb-1">
                     <h2 className="text-xl md:text-3xl font-headline font-bold truncate max-w-[200px] md:max-w-none">{post.authorName}</h2>
                     <Badge className="rounded-full bg-blue-500 font-bold text-[8px] md:text-[10px] uppercase tracking-wider">{post.platform}</Badge>
                   </div>
                   <p className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{post.gameType}</p>
                </div>
                <div className="text-right shrink-0">
                   <p className="text-2xl md:text-4xl font-headline font-bold text-primary tracking-tighter">${post.price.toFixed(2)}</p>
                </div>
             </div>

             <div className="grid grid-cols-3 gap-2 md:gap-4">
                <StatItem label="Lvl" value={post.level} icon={Star} color="text-amber-500" />
                {post.gameType === 'freefire' ? (
                  <>
                    <StatItem label="Age" value={post.age || 'N/A'} icon={Calendar} color="text-blue-500" />
                    <StatItem label="Prime" value={post.primeLevel || 1} icon={ShieldCheck} color="text-purple-500" />
                  </>
                ) : (
                  <>
                    <StatItem label="ID" value={post.accountId || '...'} icon={Gamepad2} color="text-blue-500" />
                    <StatItem label="Name" value={post.accountName || '...'} icon={User} color="text-purple-500" />
                  </>
                )}
             </div>

             <div className="space-y-3 md:space-y-4">
                <h3 className="text-lg md:text-xl font-headline font-bold flex items-center gap-2 uppercase tracking-tight">
                  <ShieldCheck className="text-primary w-4 h-4 md:w-5 md:h-5" /> Account Assets
                </h3>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                   {post.gameType === 'bloodstrike' ? (
                     <>
                        <AssetBadge icon={Sword} label="Evo" value={post.evoWeapons} />
                        <AssetBadge icon={Target} label="Internal" value={post.internalWeapons} />
                        <AssetBadge icon={Zap} label="Emotes" value={post.emotes} />
                        <AssetBadge icon={Bomb} label="Execution" value={post.executionEmotes} />
                        <AssetBadge icon={Star} label="Arrival" value={post.arrivalEmotes} />
                     </>
                   ) : (
                     <>
                        <AssetBadge icon={Sword} label="Evo" value={post.evoWeapons} />
                        <AssetBadge icon={Target} label="Weapons" value={post.totalWeapons} />
                        <AssetBadge icon={Zap} label="Emote" value={post.emotes} />
                        <AssetBadge icon={Star} label="Arrival" value={post.arrivalEmotes} />
                        <AssetBadge icon={ShoppingBag} label="Dharka" value={post.dharka} />
                     </>
                   )}
                </div>
             </div>

             {/* Dynamic Action Area */}
             <div className="pt-2 md:pt-6 space-y-4">
                {isBuyer && (post.status === 'holding' || post.buyerReported) && (
                  <div className="p-4 md:p-6 bg-primary/5 rounded-2xl md:rounded-[2rem] border border-primary/20 space-y-4 md:space-y-6 animate-in slide-in-from-bottom-2">
                    {hasBought ? (
                      <div className="flex flex-col items-center text-center gap-3 py-2">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center text-green-600">
                          <CheckCircle2 size={28} className="md:w-8 md:h-8" />
                        </div>
                        <h4 className="font-bold text-base md:text-lg">Mahadsanid!</h4>
                        <p className="text-[10px] md:text-xs text-muted-foreground max-w-[200px] md:max-w-none">Waad ku guuleysatay iibsiga. Admin-ka ayaa hadda hubinaya dalabkaaga.</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <History className="text-primary w-5 h-5 md:w-6 md:h-6" />
                          <div>
                            <h4 className="font-bold text-xs md:text-sm">Account-kan waa laguu hayaa!</h4>
                            <p className="text-[10px] md:text-[11px] text-muted-foreground">Ma iibsatay account-kan mise wali?</p>
                          </div>
                        </div>
                        <div className="flex flex-col xs:flex-row gap-2 md:gap-3">
                          <Button onClick={() => reportAccountOutcome(post.id, 'bought')} className="flex-1 h-11 md:h-12 rounded-xl bg-green-600 hover:bg-green-700 font-bold gap-2 text-xs md:text-sm">
                             <Check size={16} /> Waan iibsaday
                          </Button>
                          <Button onClick={() => reportAccountOutcome(post.id, 'not_bought')} variant="outline" className="flex-1 h-11 md:h-12 rounded-xl font-bold border-red-200 text-red-500 text-xs md:text-sm">
                             Ma iibsanin
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="hidden md:block">
                  <Button 
                    onClick={() => buyAccountPost(post)}
                    disabled={isOwner || showSold || showSuccess || showHolding}
                    className="w-full h-14 md:h-16 rounded-xl md:rounded-[2rem] text-lg md:text-xl font-bold shadow-xl shadow-primary/30 active:scale-95 transition-all"
                  >
                    {buyButtonText}
                  </Button>
                </div>
             </div>
          </div>
        </div>
      </main>

      {/* Floating Button (Mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t dark:border-white/5 z-50">
         <Button 
           onClick={() => buyAccountPost(post)}
           disabled={isOwner || showSold || showSuccess || showHolding}
           className="w-full h-14 rounded-xl text-base font-bold shadow-lg"
         >
            {buyButtonText}
         </Button>
      </div>

      {/* Full Screen Image Modal */}
      {fullScreenImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-in fade-in duration-300"
          onClick={() => setFullScreenImage(null)}
        >
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <Image src={fullScreenImage} alt="" fill className="object-contain" unoptimized />
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setFullScreenImage(null);
            }} 
            className="absolute top-6 right-4 text-white p-3 bg-white/10 rounded-full hover:bg-white/20 active:scale-90 transition-all z-[110]"
          >
            <X size={24} />
          </button>
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value, icon: Icon, color }: { label: string, value: any, icon: any, color: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-2 md:p-4 rounded-xl md:rounded-3xl flex flex-col items-center text-center gap-1 md:gap-2 border dark:border-white/5 shadow-sm">
       <Icon size={16} className={cn(color, "md:w-5 md:h-5")} />
       <div className="min-w-0 w-full">
         <p className="text-xs md:text-sm font-bold truncate w-full">{value}</p>
         <p className="text-[8px] md:text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mt-0.5">{label}</p>
       </div>
    </div>
  );
}

function AssetBadge({ icon: Icon, label, value }: { icon: any, label: string, value: number }) {
  return (
    <Badge className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-none px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl flex items-center gap-1.5 md:gap-2 font-bold shadow-sm ring-1 ring-slate-100 dark:ring-white/5">
       <Icon size={12} className="text-primary md:w-3.5 md:h-3.5" />
       <span className="text-[8px] md:text-[10px] uppercase tracking-tight">{label}:</span>
       <span className="text-[10px] md:text-xs text-primary font-black">{value || 0}</span>
    </Badge>
  );
}
