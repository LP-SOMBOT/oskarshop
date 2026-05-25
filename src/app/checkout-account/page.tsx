"use client";

import { useState, useMemo, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/lib/context";
import { 
  ShieldCheck, 
  ArrowLeft, 
  CheckCircle2, 
  Loader2, 
  Smartphone, 
  Gamepad2,
  AlertCircle,
  X,
  CreditCard,
  Copy,
  MessageCircle,
  History,
  Check,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { toast } from "@/hooks/use-toast";
import { formatWhatsAppNumber } from "@/lib/utils";

function CheckoutAccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { accountPosts, user, orders, loading, setActiveTab, createOrder, setGlobalLoading, reportAccountOutcome } = useApp();
  
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [name, setName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [outcome, setOutcome] = useState<'bought' | 'not_bought' | null>(null);

  const prefilledRef = useRef(false);

  const post = useMemo(() => {
    return (accountPosts || []).find(p => p.id === id);
  }, [accountPosts, id]);

  const associatedOrder = useMemo(() => {
    if (!post || !user) return null;
    return (orders || []).find(o => o.gameDetails?.postId === post.id && o.userId === user.uid);
  }, [orders, post, user]);

  const hasBought = associatedOrder?.buyerOutcome === 'bought';

  useEffect(() => {
    if (!loading && !user && step < 3) {
      router.push('/login');
    }
    
    // Prefill user name only once to allow editing (even clearing the field)
    if (user && !prefilledRef.current) {
      setName(user.name || "");
      prefilledRef.current = true;
    }

    if (!id && step < 3 && user) {
      router.push('/#accounts');
    }
  }, [id, step, router, user, loading]);

  const handleContactSeller = async () => {
    if (!post || !user) return;
    setIsProcessing(true);
    setGlobalLoading(true);

    try {
      const purchaseItem = {
        id: post.id,
        title: `Account: ${post.authorName}`,
        price: post.price,
        quantity: 1,
        gameId: 'accounts',
        thumbnail: post.thumbnailUrl
      };

      await createOrder('WhatsApp Direct', { 
        name,
        whatsappNumber,
        postId: post.id,
        sellerPhone: post.phone,
        gameType: post.gameType,
        sellerName: post.authorName,
        platform: post.platform
      }, purchaseItem);

      let msg = "";
      if (post.gameType === 'bloodstrike') {
        msg = `Asc, waxaan rabaa inaan iibsado account-kaaga Blood Strike Soo dhigte website ka OskarShop. Level: ${post.level}, Qiimaha: $${post.price}, Diyaar miyaa tahay?`;
      } else {
        msg = `Asc, waxaan rabaa inaan iibsado account-kaaga Free Fire Soo dhigte website ka OskarShop. Level: ${post.level}, Qiimaha: $${post.price}, Diyaar miyaa tahay?`;
      }

      const encoded = encodeURIComponent(msg);
      const formattedPhone = formatWhatsAppNumber(post.phone);
      setStep(3);
      setOutcome(null);
      window.open(`https://wa.me/${formattedPhone}?text=${encoded}`, '_blank');
      toast({ title: "Opening WhatsApp!", description: "Lala xariir seller-ka hadda." });
    } catch (e: any) {
       toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
      setGlobalLoading(false);
    }
  };

  const handleOutcome = async (newOutcome: 'bought' | 'not_bought') => {
    if (!post || isReporting) return;
    setIsReporting(true);
    try {
      await reportAccountOutcome(post.id, newOutcome);
      setOutcome(newOutcome);
      if (newOutcome === 'bought') {
        toast({ title: "Waa lagu guuleystay!" });
      } else {
        toast({ title: "Waa la kansalay", description: "Mahadsanid!" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Khalad ayaa dhacay", description: "Fadlan mar kale isku day." });
    } finally {
      setIsReporting(false);
    }
  };

  if (!post && step < 3) return <Skeleton className="h-96 w-full rounded-[1.5rem]" />;

  return (
    <main className="max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
       {step < 3 && (
         <div className="mb-6 sm:mb-8 flex items-center justify-between px-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-full gap-2 text-muted-foreground h-9 text-xs sm:text-sm">
              <ArrowLeft size={16} className="sm:w-[18px] sm:h-[18px]" /> Dib u Noqo
            </Button>
            <Button variant="ghost" size="icon" onClick={() => router.push('/#accounts')} className="rounded-full text-muted-foreground hover:text-red-500 w-9 h-9 sm:w-10 sm:h-10">
              <X size={18} className="sm:w-5 sm:h-5" />
            </Button>
         </div>
       )}

       {step === 1 && (
         <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <h1 className="text-2xl sm:text-3xl font-headline font-bold text-center text-slate-900 dark:text-white">Iibsiga Account</h1>
            
            <Card className="rounded-[1.5rem] sm:rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white dark:bg-slate-900 p-4 sm:p-6">
               <div className="flex gap-3 sm:gap-4 mb-6 sm:mb-8 items-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 relative rounded-xl sm:rounded-2xl overflow-hidden shrink-0 shadow-sm bg-slate-100">
                     {post?.thumbnailUrl && <Image src={post.thumbnailUrl} alt="" fill className="object-cover" unoptimized />}
                  </div>
                  <div className="min-w-0">
                     <h3 className="font-bold text-base sm:text-lg dark:text-white truncate">{post?.authorName}'s Account</h3>
                     <Badge variant="outline" className="text-[8px] sm:text-[9px] uppercase font-black px-2 py-0">
                       {post?.gameType}
                     </Badge>
                  </div>
               </div>

               <div className="space-y-4 sm:space-y-6">
                  <div className="space-y-1 sm:space-y-2">
                     <Label className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Magacaaga</Label>
                     <Input 
                      placeholder="Geli magacaaga" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-4 sm:px-6 font-bold shadow-inner text-sm sm:text-base"
                     />
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                     <Label className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">WhatsApp-kaaga</Label>
                     <Input 
                      type="tel"
                      inputMode="numeric"
                      placeholder="Geli WhatsApp number-kaaga" 
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
                      className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-4 sm:px-6 font-bold shadow-inner text-sm sm:text-base"
                     />
                  </div>

                  <div className="p-4 sm:p-5 bg-blue-50 dark:bg-blue-500/5 rounded-xl sm:rounded-2xl border border-blue-100 dark:border-blue-500/20 flex gap-2.5 sm:gap-3">
                     <AlertCircle className="text-blue-500 shrink-0 w-4 h-4 sm:w-5 sm:h-5 mt-0.5" />
                     <p className="text-[10px] sm:text-[11px] font-medium text-blue-800 dark:text-blue-300 leading-relaxed">
                        Markaad taabato badhanka hoose, waxaa si toos ah Laguu geeyn doonaa WhatsApp-ka iibiyaha si aad ula heshiisid. Fadlan halkaan Ku Soo laabo si aad inoogu xaqiijisid inaad iibsatay Iyo in kale, Mahadsanid!
                     </p>
                  </div>
               </div>
            </Card>

            <Button 
              onClick={handleContactSeller}
              disabled={!name || whatsappNumber.length < 9 || isProcessing}
              className="w-full h-14 sm:h-18 rounded-xl sm:rounded-[2rem] text-base sm:text-xl font-bold shadow-xl shadow-primary/20 gap-2 active:scale-95 transition-all"
            >
              {isProcessing ? <Loader2 className="animate-spin" /> : <><MessageCircle size={20} className="sm:w-[22px] sm:h-[22px]" /> LAXARIIR SELLER-KA</>}
            </Button>
         </div>
       )}

       {step === 3 && (
          <div className="space-y-6 sm:space-y-10 animate-in zoom-in duration-500 text-center py-6 sm:py-10 px-1">
             <div className="relative mx-auto w-24 h-24 sm:w-32 sm:h-32">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                <div className="relative w-full h-full bg-primary text-white rounded-full flex items-center justify-center shadow-2xl">
                   <MessageCircle size={44} className="sm:w-[60px] sm:h-[60px]" />
                </div>
             </div>

             <div className="space-y-4 sm:space-y-6 px-2">
                <h2 className="text-2xl sm:text-4xl font-headline font-bold">Kala hadal WhatsApp!</h2>
                <div className="space-y-4">
                  <p className="text-xs sm:text-base text-muted-foreground font-medium max-w-xs sm:max-w-sm mx-auto leading-relaxed">
                    Fadlan number kaan <span className="font-bold text-primary">{post?.phone}</span> Kala hadal, ama Riix halkaan:
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-full border-primary/20 text-primary font-bold h-11 px-8 mx-auto gap-2 shadow-sm"
                    onClick={() => {
                      if (!post) return;
                      let msg = "";
                      if (post.gameType === 'bloodstrike') {
                        msg = `Asc, waxaan rabaa inaan iibsado account-kaaga Blood Strike Soo dhigte website ka OskarShop. Level: ${post.level}, Qiimaha: $${post.price}, Diyaar miyaa tahay?`;
                      } else {
                        msg = `Asc, waxaan rabaa inaan iibsado account-kaaga Free Fire Soo dhigte website ka OskarShop. Level: ${post.level}, Qiimaha: $${post.price}, Diyaar miyaa tahay?`;
                      }
                      const encoded = encodeURIComponent(msg);
                      const formattedPhone = formatWhatsAppNumber(post.phone);
                      window.open(`https://wa.me/${formattedPhone}?text=${encoded}`, '_blank');
                    }}
                  >
                    <MessageCircle size={18} /> LA XARIIR
                  </Button>
                </div>
             </div>

             {outcome === 'bought' || hasBought ? (
               <div className="p-6 sm:p-8 bg-green-50 dark:bg-green-500/10 rounded-[1.5rem] sm:rounded-[2.5rem] border border-green-100 dark:border-green-500/20 animate-in fade-in slide-in-from-top-4 mx-auto max-w-sm sm:max-w-none">
                  <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 mx-auto mb-3" />
                  <h3 className="font-bold text-lg sm:text-xl text-green-900 dark:text-green-400">Waa lagu guuleystay!</h3>
                  <p className="text-xs sm:text-sm text-green-700 dark:text-green-500/70 mt-1 leading-relaxed">Mahadsanid, dalabkaaga waxaa hadda hubinaya admin-ka.</p>
               </div>
             ) : outcome === 'not_bought' ? (
               <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-white/5 animate-in fade-in slide-in-from-top-4 text-center mx-auto max-w-sm sm:max-w-none">
                  <XCircle className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white">Mahadsanid!</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                    Hadii aad hadhow u baahato account-kan waad u soo laaban kartaa si aad u iibsato. 
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => { setStep(1); setOutcome(null); }} 
                    className="mt-5 sm:mt-6 w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl font-bold bg-white dark:bg-slate-900 border-primary/20 text-primary hover:bg-primary/5 text-sm"
                  >
                     Mar kale isku day (Restart)
                  </Button>
               </div>
             ) : (
               <div className="bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] shadow-xl space-y-4 sm:space-y-6 border border-slate-100 dark:border-white/5 mx-auto max-w-[320px] sm:max-w-none">
                  <p className="font-bold text-[10px] sm:text-sm uppercase tracking-widest text-muted-foreground">Ma iibsatay account-kan?</p>
                  <div className="flex flex-col gap-2.5 sm:gap-3">
                     <Button 
                       onClick={() => handleOutcome('bought')} 
                       disabled={isReporting}
                       className="h-14 sm:h-16 rounded-xl sm:rounded-2xl bg-green-600 hover:bg-green-700 text-base sm:text-lg font-bold gap-2 active:scale-[0.98]"
                     >
                        {isReporting ? <Loader2 className="animate-spin" /> : <Check size={18} className="sm:w-5 sm:h-5" />} Haa, Waan iibsaday
                     </Button>
                     <Button 
                       onClick={() => handleOutcome('not_bought')} 
                       disabled={isReporting}
                       variant="outline" 
                       className="h-12 sm:h-14 rounded-xl sm:rounded-2xl font-bold border-red-100 text-red-500 text-xs sm:text-sm active:scale-[0.98]"
                     >
                        {isReporting ? <Loader2 className="animate-spin" /> : null} Maya, Ma iibsanin
                     </Button>
                  </div>
               </div>
             )}
             
             <div className="flex flex-col gap-2.5 sm:gap-3 pt-4 sm:pt-6 max-w-sm mx-auto w-full">
                <Button 
                  onClick={() => {
                    setActiveTab('orders');
                    router.push(`/#orders`);
                  }} 
                  className="h-14 sm:h-16 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg shadow-md active:scale-95 transition-all"
                >
                  Eeg Dalabkayga
                </Button>
                <Button variant="ghost" onClick={() => router.push('/')} className="h-11 sm:h-12 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm text-muted-foreground hover:text-foreground">
                  Ku laabo Home-ka
                </Button>
             </div>
          </div>
       )}
    </main>
  );
}

export default function CheckoutAccountPage() {
  return (
    <div className="min-h-screen pb-24 md:pb-32 bg-slate-50 dark:bg-transparent page-transition">
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-[1.5rem]" />}>
        <CheckoutAccountContent />
      </Suspense>
    </div>
  );
}