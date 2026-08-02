
"use client";

import { useApp } from "@/lib/context";
import { 
  ShoppingBag, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Gamepad2,
  ShieldCheck,
  User,
  RefreshCw,
  XCircle,
  ShieldAlert,
  CreditCard,
  MessageCircle,
  Ticket,
  Trophy,
  Lock,
  Loader2,
  Zap,
  Globe
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function OrdersView() {
  const { orders, isInitialLoading, isGlobalLoading, setActiveTab, user, t, storeSettings, language } = useApp();
  const router = useRouter();

  if (isInitialLoading) {
    return (
      <div className="min-h-screen px-4 py-10 max-w-2xl mx-auto space-y-10">
        <div className="grid grid-cols-1 gap-8">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-[2rem] md:rounded-[3rem]" />)}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pb-32 px-4 py-20 flex flex-col items-center justify-center text-center space-y-8 page-transition">
        <div className="relative">
           <div className="absolute inset-0 bg-primary/20 rounded-full blur-[60px] animate-pulse" />
           <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-xl border border-slate-100 dark:border-white/5">
              <Lock size={48} className="text-primary" />
           </div>
        </div>
        <div className="space-y-3">
           <h3 className="text-xl sm:text-3xl font-headline font-bold text-slate-900 dark:text-white uppercase tracking-tight">
             {t('login_to_view_orders')}
           </h3>
           <p className="text-sm sm:text-lg text-muted-foreground max-w-xs mx-auto font-medium">
             {t('login_required_desc')}
           </p>
        </div>
        <Button 
          onClick={() => router.push('/login')}
          className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-white transition-all active:scale-95"
        >
          {t('login_button')}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 px-4 py-10 lg:max-w-2xl mx-auto page-transition relative">
      {isGlobalLoading && (
        <div className="absolute inset-0 z-50 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm rounded-[3rem] flex items-center justify-center">
           <div className="flex flex-col items-center gap-4">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                <div className="absolute inset-2 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center">
                   {storeSettings.logo ? (
                     <div className="relative w-full h-full p-2">
                       <Image src={storeSettings.logo} alt="" fill className="object-contain" unoptimized />
                     </div>
                   ) : <Gamepad2 className="w-6 h-6 text-primary" />}
                </div>
              </div>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] animate-pulse">Syncing Orders...</p>
           </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="py-20 md:py-40 text-center space-y-6 md:space-y-8 opacity-30 flex flex-col items-center">
          <div className="w-20 h-20 md:w-32 md:h-32 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center shadow-inner">
             <ShoppingBag size={40} className="md:size-16 text-slate-300 dark:text-slate-700" />
          </div>
          <div className="space-y-2 md:space-y-3 px-4">
             <h3 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white uppercase tracking-tighter">{t('no_orders')}</h3>
             <p className="text-sm md:text-lg max-w-md mx-auto">{t('no_orders_desc')}</p>
          </div>
          <button 
           onClick={() => setActiveTab('games')}
           className="text-primary font-black text-base md:text-xl flex items-center gap-2 md:gap-3 hover:gap-5 transition-all group"
          >
            {t('continue_shopping')} <ChevronRight size={20} className="md:size-6 group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      ) : (
        <div className={cn("grid grid-cols-1 gap-6 md:gap-8 transition-all", isGlobalLoading && "opacity-20 blur-[2px]")}>
           {orders.map((order) => ( <OrderCard key={order.id} order={order} language={language} /> ))}
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
       <span className="text-muted-foreground font-black uppercase tracking-widest text-[7px] sm:text-[9px] lg:text-[11px] flex items-center gap-1.5 md:gap-2 shrink-0 pt-0.5">
          <Icon size={12} className="opacity-60" /> {label}
       </span>
       <span className={cn("font-bold text-slate-900 dark:text-white text-[10px] sm:text-sm lg:text-base flex-1 text-right break-words", color)}>
          {value || "---"}
       </span>
    </div>
  );
}

function OrderCard({ order, language }: { order: any, language: string }) {
  const { t } = useApp();
  const item = order.items?.[0];
  
  const isAuctionWinner = !!order.gameDetails?.isEventWinner;
  const displayTitle = isAuctionWinner ? "Guuleystaha" : (item?.title || "Game Item");
  const isAccount = item?.gameId === 'accounts' || order.gameId === 'accounts' || isAuctionWinner;

  const statusColors = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
    processing: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
    successful: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400"
  };

  const StatusIcon = order.status === 'successful' ? CheckCircle2 : order.status === 'pending' ? Clock : order.status === 'processing' ? RefreshCw : XCircle;

  const getStatusLabel = (s: string) => {
    if (language !== 'so') return s;
    if (s === 'cancelled') return "La kansalay";
    if (s === 'successful') return "Lagu guuleeystay";
    return t(s);
  };

  return (
    <Card className="rounded-[2rem] md:rounded-[3rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden group hover:shadow-2xl transition-all duration-500">
       <div className="p-5 sm:p-6 lg:p-8 h-full flex flex-col">
          <div className="flex flex-col xs:flex-row justify-between items-start gap-4 mb-6 md:mb-8">
             <div className="flex gap-3 md:gap-5 min-w-0">
                <div className={cn(
                  "w-14 h-14 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-xl md:rounded-[1.5rem] flex items-center justify-center relative overflow-hidden shrink-0 shadow-inner transition-all",
                  isAccount ? "bg-amber-50 dark:bg-amber-500/10" : "bg-primary/5 dark:bg-primary/10"
                )}>
                   {item?.thumbnail ? (
                     <Image src={item.thumbnail} alt="" fill className="object-cover" unoptimized />
                   ) : isAccount ? (
                     <ShieldCheck className="text-amber-300 dark:text-amber-600" size={32} />
                   ) : (
                     <Gamepad2 className="text-primary/30 dark:text-primary/50" size={32} />
                   )}
                </div>
                <div className="min-w-0 flex-1">
                   <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-xl lg:text-2xl leading-tight mb-1 md:mb-2">{displayTitle}</h3>
                   <div className="flex flex-wrap items-center gap-2 md:gap-3">
                      <p className="text-[8px] sm:text-[10px] lg:text-[12px] font-black text-muted-foreground uppercase tracking-widest">{order.paymentMethod}</p>
                      <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800 hidden xs:block" />
                      <p className="text-[8px] sm:text-[10px] lg:text-[12px] font-black text-muted-foreground uppercase tracking-widest">ID: {order.id.toUpperCase()}</p>
                   </div>
                   <p className="text-[9px] sm:text-[11px] lg:text-[13px] text-muted-foreground font-bold mt-1 md:mt-2">
                      {format(new Date(order.createdAt), 'MMM d, yyyy - HH:mm')}
                   </p>
                </div>
             </div>
             <Badge className={cn( "rounded-full px-3 py-1 md:px-5 md:py-2 font-black text-[7px] sm:text-[10px] lg:text-[12px] border-none shadow-sm shrink-0 uppercase tracking-widest self-end xs:self-start", statusColors[order.status as keyof typeof statusColors] )}>
                <StatusIcon className={cn("w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 inline-block", order.status === 'processing' && "animate-spin")} /> {getStatusLabel(order.status)}
             </Badge>
          </div>

          <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-6 lg:p-8 space-y-3 sm:space-y-4 border border-slate-100 dark:border-white/5 flex-1 shadow-inner">
             {isAuctionWinner ? (
                <>
                  <DetailRow icon={Zap} label="Auction Event" value={order.gameDetails?.eventTitle || "Account Event"} />
                  <DetailRow icon={Gamepad2} label="Game" value={order.gameDetails?.gameName || "N/A"} />
                  <DetailRow icon={MessageCircle} label={t('whatsapp')} value={order.gameDetails?.whatsappNumber} color="text-primary" />
                </>
             ) : isAccount ? (
               <>
                 <DetailRow icon={User} label={t('seller')} value={order.gameDetails?.sellerName || "Market Seller"} />
                 <DetailRow icon={ShieldCheck} label={t('platform')} value={order.gameDetails?.platform || "Google"} />
                 <DetailRow icon={MessageCircle} label={t('whatsapp')} value={order.gameDetails?.whatsappNumber} color="text-primary" />
               </>
             ) : (
               <>
                 <DetailRow icon={Gamepad2} label={t('player_id')} value={order.gameDetails?.playerID} color="font-mono text-primary text-xs sm:text-sm" />
                 <DetailRow icon={User} label={t('game_name')} value={order.gameDetails?.playerName} />
                 <DetailRow icon={CreditCard} label={t('sender_no')} value={order.gameDetails?.senderNumber} color="text-green-600" />
                 <DetailRow icon={MessageCircle} label={t('whatsapp')} value={order.gameDetails?.whatsappNumber} />
               </>
             )}
             
             {order.rankDiscount > 0 && (
               <DetailRow 
                 icon={Trophy} 
                 label={t('rank_reward')} 
                 value={`${order.rank === 1 ? '🥇' : order.rank === 2 ? '🥈' : '🥉'} -${order.rankDiscount}%`} 
                 color="text-primary font-black" 
               />
             )}
             
             {order.rankDiscount === 0 && order.promoCode && (
               <DetailRow icon={Ticket} label="Promo Code" value={order.promoCode} color="text-primary font-black" />
             )}
             
             <div className="pt-3 md:pt-4 border-t border-slate-200/50 dark:border-white/5 flex justify-between items-center">
                <span className="text-muted-foreground font-black text-[8px] sm:text-[10px] lg:text-[14px] uppercase tracking-[0.1em] sm:tracking-[0.2em]">{t('final_amount')}</span>
                <span className="font-headline font-bold text-primary text-xl sm:text-3xl lg:text-4xl">${order.total.toFixed(2)}</span>
             </div>
          </div>
          
          <div className="mt-6 md:mt-8">
             {order.status === 'pending' && (
               <div className="p-4 sm:p-5 lg:p-6 bg-amber-50 dark:bg-amber-500/10 rounded-xl sm:rounded-[1.5rem] flex gap-3 md:gap-4 items-center text-amber-700 dark:text-amber-400 text-xs sm:text-sm lg:text-base font-black border border-amber-100 dark:border-amber-500/20 shadow-sm animate-pulse uppercase tracking-wider">
                  <Clock size={20} className="shrink-0" /> <p>{t('verifying_payment')}</p>
               </div>
             )}
             {order.status === 'processing' && (
               <div className="p-4 sm:p-5 lg:p-6 bg-blue-50 dark:bg-blue-500/10 rounded-xl sm:rounded-[1.5rem] flex gap-3 md:gap-4 items-center text-blue-700 dark:text-blue-400 text-xs sm:text-sm lg:text-base font-black border border-blue-100 dark:border-blue-500/20 shadow-sm uppercase tracking-wider">
                  <RefreshCw size={20} className="shrink-0 animate-spin" /> <p>{t('delivering_diamonds')}</p>
               </div>
             )}
             {order.status === 'successful' && (
               <div className="p-4 sm:p-5 lg:p-6 bg-green-50 dark:bg-green-500/10 rounded-xl sm:rounded-[1.5rem] flex gap-3 md:gap-4 items-center text-green-700 dark:text-green-400 text-xs sm:text-sm lg:text-base font-black border border-green-100 dark:border-confirm_reactivate_btn shadow-sm uppercase tracking-wider">
                  <CheckCircle2 size={20} className="shrink-0" /> <p>{t('delivered_success')}</p>
               </div>
             )}
             {order.status === 'cancelled' && (
               <div className="p-4 sm:p-6 bg-red-50 dark:bg-red-950/20 rounded-[1.5rem] md:rounded-[2rem] border border-red-100 dark:border-red-900/20 flex flex-col gap-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex gap-3 items-center">
                       <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
                          <XCircle size={18} className="text-red-600" />
                       </div>
                       <p className="text-[11px] sm:text-sm font-bold text-red-700 dark:text-red-400 leading-tight">
                          {order.cancellationReason 
                            ? `Dalabkaaga waa la kansalay sababtoo ah: ${order.cancellationReason}`
                            : "Dalabkaaga waa la kansalay"}
                       </p>
                    </div>
                  </div>
               </div>
             )}
          </div>
       </div>
    </Card>
  );
}
