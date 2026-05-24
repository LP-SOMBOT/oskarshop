"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useApp } from "@/lib/context";
import { 
  CheckCircle2, 
  Loader2, 
  ArrowLeft,
  Gamepad2,
  ShieldCheck,
  PartyPopper,
  Smartphone,
  ChevronRight,
  X,
  CreditCard,
  AlertTriangle,
  MessageCircle,
  ShoppingBag,
  Copy,
  Lock,
  Tag,
  DollarSign,
  Ticket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { cn, formatWhatsAppNumber } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

function CheckoutContent() {
  const { products, games, createOrder, setGlobalLoading, setActiveTab, user, loading, storeSettings, checkPromoCode } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('id');

  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  
  // Promo Code States
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  const [gameDetails, setGameDetails] = useState({
    playerID: "",
    playerName: "",
    whatsappNumber: "",
    senderNumber: ""
  });

  const paymentMethods = useMemo(() => {
    if (!storeSettings.paymentMethods) return [];
    return Object.entries(storeSettings.paymentMethods)
      .map(([id, m]) => ({ ...m, id }))
      .filter(m => m.active);
  }, [storeSettings.paymentMethods]);

  useEffect(() => {
    if (paymentMethods.length > 0 && !selectedMethodId) {
      setSelectedMethodId(paymentMethods[0].id);
    }
  }, [paymentMethods, selectedMethodId]);

  const item = useMemo(() => {
    return (products || []).find(p => p.id === productId);
  }, [products, productId]);

  const game = useMemo(() => {
    return (games || []).find(g => g.id === item?.gameId);
  }, [games, item?.gameId]);

  const basePrice = useMemo(() => Number(item?.price || 0), [item]);
  const discountedPrice = useMemo(() => Number(item?.discountedPrice || 0), [item]);
  const hasStoreDiscount = useMemo(() => discountedPrice > 0 && discountedPrice < basePrice, [discountedPrice, basePrice]);

  const subtotal = useMemo(() => {
    return hasStoreDiscount ? discountedPrice : basePrice;
  }, [hasStoreDiscount, discountedPrice, basePrice]);

  const total = useMemo(() => {
    if (appliedPromoCode && promoDiscount > 0) {
      return subtotal * (1 - promoDiscount / 100);
    }
    return subtotal;
  }, [subtotal, appliedPromoCode, promoDiscount]);
  
  const gameTitle = game?.title?.toLowerCase() || "";
  const isFreeFire = gameTitle.includes("free fire");
  const isBloodStrike = gameTitle.includes("blood strike");
  const isBooyahPass = item?.category === 'booyah-pass';

  useEffect(() => {
    if (!loading && !user && !isSuccess) {
      router.push('/login');
    }
    if (!productId && !isSuccess && user) {
      router.push('/');
    }
  }, [productId, isSuccess, router, user, loading]);

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return;
    setIsValidatingPromo(true);
    try {
      const standardizedInput = promoCodeInput.trim().toUpperCase();
      const discount = await checkPromoCode(standardizedInput);
      setAppliedPromoCode(standardizedInput);
      setPromoDiscount(discount);
      toast({ title: "Promo Applied!", description: `You saved ${discount}% extra!` });
    } catch (err: any) {
      toast({ title: "Invalid Code", description: err.message, variant: "destructive" });
      setAppliedPromoCode(null);
      setPromoDiscount(0);
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation logic
    if (gameDetails.playerName.trim().length < 4) {
      toast({ title: "Magaca wuu gaabanyahay", description: "Magaca game-ka waa inuu ugu yaraan ka koobnaadaa 4 xaraf.", variant: "destructive" });
      return;
    }

    if (gameDetails.playerID.length < 5) {
      toast({ title: "Game ID khaldan", description: "Fadlan geli Game ID sax ah (ugu yaraan 5 nambar).", variant: "destructive" });
      return;
    }

    const cleanWhatsapp = gameDetails.whatsappNumber.replace(/\D/g, '');
    if (cleanWhatsapp.length < 9) {
      toast({ title: "WhatsApp No. khaldan", description: "WhatsApp number-ka waa inuu ka koobnaadaa ugu yaraan 9 nambar.", variant: "destructive" });
      return;
    }

    const cleanSender = gameDetails.senderNumber.replace(/\D/g, '');
    if (cleanSender.length < 9) {
      toast({ title: "Lacag Diraha khaldan", description: "Number-ka lacagta laga soo diray waa inuu ka koobnaadaa ugu yaraan 9 nambar.", variant: "destructive" });
      return;
    }

    setStep(2);
  };

  const handleBooyahRedirect = () => {
    // Re-use validation logic
    if (gameDetails.playerName.trim().length < 4) {
      toast({ title: "Magaca wuu gaabanyahay", variant: "destructive" });
      return;
    }
    if (gameDetails.playerID.length < 5) {
      toast({ title: "Game ID khaldan", variant: "destructive" });
      return;
    }
    const cleanWhatsapp = gameDetails.whatsappNumber.replace(/\D/g, '');
    const cleanSender = gameDetails.senderNumber.replace(/\D/g, '');
    if (cleanWhatsapp.length < 9 || cleanSender.length < 9) {
      toast({ title: "Fadlan geli number-ada saxda ah (9+ nambar)", variant: "destructive" });
      return;
    }
    
    const adminWa = formatWhatsAppNumber(item?.whatsappNumber || "252613982172");
    const message = `Asc, Oskar Shop.
Waxaan rabaa Booyah Pass: *${item?.title}*
Qiimaha: *$${total.toFixed(2)}*

*Xogta Dalabka:*
Game ID: ${gameDetails.playerID}
in-Game name: ${gameDetails.playerName}
WhatsApp: ${gameDetails.whatsappNumber}
Lacag Diraha: ${gameDetails.senderNumber}

Fadlan ila soo xiriir.`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${adminWa}?text=${encoded}`, '_blank');
    
    setIsSuccess(true);
    setStep(4);
  };

  const handlePaymentInitiation = () => {
    const method = paymentMethods.find(m => m.id === selectedMethodId);
    if (!method) return;

    const formattedPrice = total.toFixed(2).replace('.', '*');
    const ussd = method.ussdTemplate.replace('$', formattedPrice);
    
    toast({
      title: "Opening Dialer",
      description: `Please complete the ${method.name} transaction.`,
    });
    
    window.location.href = `tel:${ussd.replace(/#/g, '%23')}`;
    setStep(3);
  };

  const handleFinalConfirm = () => {
    if (!item) return;
    setIsProcessing(true);
    setGlobalLoading(true);
    
    const purchaseItem = {
      id: item.id,
      title: item.title,
      price: total,
      quantity: 1,
      gameId: item.gameId,
      thumbnail: item.thumbnail
    };

    const selectedMethod = paymentMethods.find(m => m.id === selectedMethodId);

    const finalDetails = {
      ...gameDetails,
      gameTitle: game?.title || "Unknown Game",
      itemTitle: item.title,
      category: isFreeFire ? "Free Fire" : isBloodStrike ? "Blood Strike" : "General"
    };

    createOrder(selectedMethod?.name || "Mobile Payment", finalDetails, purchaseItem, appliedPromoCode || undefined);
    
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setStep(4);
      setGlobalLoading(false);
      
      toast({
        title: "Order Confirmed!",
        description: "Your diamonds are on the way!",
      });
    }, 1500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "La koobiyey!", description: "Number-ka waa la koobiyey." });
  };

  if (!item && step < 4) {
    return (
      <div className="space-y-6 px-4">
        <Skeleton className="h-10 w-3/4 mx-auto rounded-full" />
        <Card className="rounded-[2.5rem] p-6 md:p-8">
           <Skeleton className="h-8 w-1/2 mb-4" />
           <Skeleton className="h-12 w-full mb-4" />
           <Skeleton className="h-12 w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-[500px] px-1 sm:px-4 md:px-0">
      {step < 4 && (
        <div className="mb-6 flex items-center justify-between px-2">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="rounded-full gap-1.5 md:gap-2 text-muted-foreground hover:text-foreground h-9 md:h-10 px-3 md:px-4 text-xs md:text-sm">
            <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" /> Go Back
          </Button>
          <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="rounded-full text-muted-foreground hover:text-red-500 w-9 h-9 md:w-10 md:h-10">
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>
      )}

      {step < 4 && !isBooyahPass && (
        <div className="flex justify-between items-center mb-6 md:mb-12 px-1 relative max-w-sm mx-auto">
          <div className="absolute left-0 right-0 h-0.5 bg-gray-100 dark:bg-white/5 top-[18px] md:top-[20px] mx-6 md:mx-8 -z-10" />
          <div 
            className="absolute left-0 h-0.5 bg-primary top-[18px] md:top-[20px] mx-6 md:mx-8 -z-10 transition-all duration-500" 
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          />
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-col items-center gap-1 md:gap-2">
              <div className={cn(
                "w-8 h-8 md:w-11 md:h-11 rounded-full flex items-center justify-center font-bold transition-all shadow-sm text-[10px] md:text-sm",
                step >= s 
                  ? "bg-primary text-white scale-110 shadow-primary/20" 
                  : "bg-white dark:bg-slate-900 text-gray-400 dark:text-gray-600 border-2 border-gray-100 dark:border-white/5"
              )}>
                {step > s ? <CheckCircle2 className="w-3.5 h-3.5 md:w-5 md:h-5" /> : s}
              </div>
              <span className={cn(
                "text-[7px] md:text-[10px] font-black uppercase tracking-widest text-center",
                step >= s ? "text-primary" : "text-gray-400 dark:text-gray-600"
              )}>
                {s === 1 ? "Xogta" : s === 2 ? "Lacagta" : "Xaqiiji"}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className={cn(
        "transition-all duration-300 transform",
        step === 1 ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none absolute inset-0"
      )}>
        <Card className="rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border-none p-0.5 md:p-2 bg-white dark:bg-slate-900">
          <CardHeader className="p-4 md:p-8">
            <CardTitle className="font-headline font-bold text-lg md:text-2xl flex items-center gap-2 text-slate-900 dark:text-white">
              {isBooyahPass ? <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-primary" /> : <Gamepad2 className="w-5 h-5 md:w-6 md:h-6 text-primary" />} 
              {isBooyahPass ? "Booyah pass" : (game?.title || "Xogta Dalabka")}
            </CardTitle>
            <CardDescription className="dark:text-slate-400 text-[10px] md:text-sm">
              {isBooyahPass ? "Fadlan buuxi form-ka Si saxan." : `Fadlan buuxi xogta saxda ah si laguugu soo diro ${item?.title}.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-8 pt-0 md:pt-0">
            <form onSubmit={!isBooyahPass ? handleDetailsSubmit : (e) => e.preventDefault()} className="space-y-4 md:space-y-6">
              
              <div className={cn(
                "p-3 md:p-4 rounded-xl md:rounded-2xl flex gap-2 md:gap-3",
                isBooyahPass 
                  ? "bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/20 text-blue-600 dark:text-blue-400"
                  : "bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/20 text-red-600 dark:text-red-400"
              )}>
                 <AlertTriangle className="shrink-0 w-4 h-4 md:w-6 md:h-6" />
                 {isBooyahPass ? (
                   <div className="flex flex-col gap-1.5 md:gap-2 min-w-0">
                     <p className="text-[9px] md:text-xs font-bold leading-relaxed">
                        Number kaan ku dir lacag dhan <span className="text-[11px] md:text-sm font-headline text-foreground dark:text-white">${total.toFixed(2)}</span>
                     </p>
                     <div className="flex items-center gap-2 bg-white/50 dark:bg-black/20 px-2 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl border border-blue-200/50 dark:border-blue-800/30 w-fit">
                        <span className="text-[10px] md:text-sm font-mono font-bold tracking-wider">{item?.whatsappNumber || "252613982172"}</span>
                        <button 
                          type="button"
                          onClick={() => copyToClipboard(item?.whatsappNumber || "252613982172")}
                          className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors text-blue-700 dark:text-blue-300"
                        >
                           <Copy size={12} />
                        </button>
                     </div>
                   </div>
                 ) : (
                   <p className="text-[9px] md:text-xs font-bold leading-relaxed">
                     Fadlan iska hubi Xogta sida ID gaga inta aadan dalabka dirin, dalabka mar hadii la diro lama Soo celin karo FADLAN ISKA HUBI, Mahadsanid!.
                   </p>
                 )}
              </div>

              <div className="space-y-3 md:space-y-4">
                <div className="space-y-1 md:space-y-2">
                  <Label className="text-[10px] md:text-sm font-bold dark:text-slate-200 ml-1">in-game name</Label>
                  <Input 
                    placeholder="Geli magaca game ka kugu qoran" 
                    required 
                    className="h-11 md:h-14 rounded-xl md:rounded-2xl bg-gray-50 dark:bg-slate-800 border-none px-4 md:px-5 font-bold text-xs md:text-base focus-visible:ring-primary shadow-inner"
                    value={gameDetails.playerName}
                    onChange={(e) => setGameDetails({...gameDetails, playerName: e.target.value})}
                  />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label className="text-[10px] md:text-sm font-bold dark:text-slate-200 ml-1">
                    {isBooyahPass ? "Game id" : (isFreeFire ? "Game UID" : "Game ID")}
                  </Label>
                  <Input 
                    placeholder={isBooyahPass ? "Geli ID Ga game kugu qoran" : (isFreeFire ? "Geli ID-Ga game ka kugu qoran" : "Geli ID game ka kugu qoran")}
                    required 
                    type="tel"
                    inputMode="numeric"
                    className="h-11 md:h-14 rounded-xl md:rounded-2xl bg-gray-50 dark:bg-slate-800 border-none px-4 md:px-5 font-bold text-xs md:text-base focus-visible:ring-primary shadow-inner"
                    value={gameDetails.playerID}
                    onChange={(e) => setGameDetails({...gameDetails, playerID: e.target.value.replace(/\D/g, '')})}
                  />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label className="text-[10px] md:text-sm font-bold dark:text-slate-200 ml-1">WhatsApp Number</Label>
                  <Input 
                    type="tel"
                    placeholder="Geli WhatsApp number kaaga"
                    required 
                    className="h-11 md:h-14 rounded-xl md:rounded-2xl bg-gray-50 dark:bg-slate-800 border-none px-4 md:px-5 font-bold text-xs md:text-base focus-visible:ring-primary shadow-inner"
                    value={gameDetails.whatsappNumber}
                    onChange={(e) => setGameDetails({...gameDetails, whatsappNumber: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5 md:space-y-2 pt-4 md:pt-5 border-t dark:border-white/5">
                <Label htmlFor="sender" className="text-[10px] md:text-sm font-bold flex items-center gap-1.5 md:gap-2 text-primary ml-1">
                  <CreditCard className="w-3.5 h-3.5 md:w-4 md:h-4" /> Lacag Diraha
                </Label>
                <Input 
                  id="sender" 
                  type="tel" 
                  placeholder="Geli number ka lacagta kasoo direesid" 
                  required 
                  className="h-12 md:h-16 rounded-xl md:rounded-2xl bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-100 dark:border-blue-500/20 focus-visible:ring-primary font-headline font-bold text-base md:text-xl dark:text-white"
                  value={gameDetails.senderNumber}
                  onChange={(e) => setGameDetails({...gameDetails, senderNumber: e.target.value})}
                />
                <p className="text-[8px] md:text-[11px] text-muted-foreground dark:text-slate-500 font-medium italic ml-1">
                  * Number-kan waxaa loo isticmaali doonaa in lagu hubiyo lacag bixintaada.
                </p>
              </div>

              <Button 
                type="button" 
                onClick={isBooyahPass ? handleBooyahRedirect : handleDetailsSubmit}
                className="w-full h-13 md:h-16 rounded-xl md:rounded-2xl text-sm md:text-xl font-bold gap-2 shadow-xl shadow-primary/20 active:scale-95 transition-all"
              >
                {isBooyahPass ? "iibso" : "Continue to Payment"} {isBooyahPass ? <MessageCircle className="w-4 h-4 md:w-6 md:h-6" /> : <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className={cn(
        "transition-all duration-300 transform",
        step === 2 ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none absolute inset-0"
      )}>
        <Card className="rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border-none p-0.5 md:p-2 bg-white dark:bg-slate-900">
          <CardHeader className="p-4 md:p-8">
            <CardTitle className="font-headline font-bold text-lg md:text-2xl text-slate-900 dark:text-white">Lacag Bixinta</CardTitle>
            <CardDescription className="text-[10px] md:text-sm font-medium">Dooro qaabka aad lacagta u bixinayso</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-8 pt-0 md:pt-0">
            {paymentMethods.length === 0 ? (
              <div className="py-10 md:py-12 text-center opacity-40">
                <Smartphone className="mx-auto w-10 h-10 md:w-12 md:h-12 mb-3 md:mb-4" />
                <p className="text-xs md:text-sm font-bold">No payment methods configured.</p>
              </div>
            ) : (
              <RadioGroup value={selectedMethodId} onValueChange={setSelectedMethodId} className="space-y-2 md:space-y-4 mb-6 md:mb-8">
                {paymentMethods.map((method) => (
                  <div 
                    key={method.id}
                    onClick={() => setSelectedMethodId(method.id)}
                    className={cn(
                      "flex items-center justify-between p-3 md:p-5 border-2 rounded-xl md:rounded-[2rem] cursor-pointer transition-all active:scale-[0.98]",
                      selectedMethodId === method.id 
                        ? 'border-primary bg-primary/5 dark:bg-primary/10' 
                        : 'border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                    )}
                  >
                    <Label htmlFor={method.id} className="flex items-center gap-3 md:gap-4 cursor-pointer w-full">
                      <div className={cn(
                        "w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-2xl flex items-center justify-center transition-colors relative overflow-hidden shrink-0",
                        selectedMethodId === method.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400"
                      )}>
                        {method.icon ? <Image src={method.icon} alt={method.name} fill className="object-cover" unoptimized /> : <Smartphone className="w-4 h-4 md:w-6 md:h-6" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm md:text-lg dark:text-white truncate">{method.name}</p>
                        <p className="text-[8px] md:text-xs text-muted-foreground dark:text-slate-500 font-medium">Fast mobile payment</p>
                      </div>
                      <RadioGroupItem value={method.id} id={method.id} className="dark:border-white/20 h-4 w-4 md:h-5 md:w-5" />
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {/* Promo Code Entry */}
            <div className="mb-6 md:mb-8 space-y-3">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2">
                <Ticket size={12} /> Dooro Promo Code (Hadaad haysato)
              </Label>
              <div className="flex gap-2">
                 <Input 
                  placeholder="Geli code-ka..." 
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                  className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-4 font-bold shadow-inner"
                 />
                 <Button 
                   onClick={handleApplyPromo}
                   disabled={!promoCodeInput || isValidatingPromo}
                   className="h-12 md:h-14 px-6 md:px-10 rounded-xl md:rounded-2xl font-black uppercase text-xs"
                 >
                    {isValidatingPromo ? <Loader2 className="animate-spin" /> : "Apply"}
                 </Button>
              </div>
            </div>

            {/* Price Detail Summary Block */}
            <div className="bg-gray-50 dark:bg-slate-800/40 p-4 md:p-8 rounded-2xl md:rounded-[2rem] mb-6 md:mb-8 border border-gray-100 dark:border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 md:p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Lock size={40} className="md:size-[60px]" />
              </div>
              <div className="flex flex-col gap-3 relative z-10">
                <div className="flex justify-between items-center text-sm md:text-lg">
                   <span className="text-muted-foreground dark:text-slate-400 font-medium">Base Price:</span>
                   <span className={cn("font-bold text-slate-900 dark:text-white", hasStoreDiscount && "line-through opacity-40")}>${basePrice.toFixed(2)}</span>
                </div>
                {hasStoreDiscount && (
                  <div className="flex justify-between items-center text-sm md:text-lg animate-in slide-in-from-right-2">
                     <div className="flex items-center gap-2">
                        <Tag size={16} className="text-green-500" />
                        <span className="text-muted-foreground dark:text-slate-400 font-medium">Store Discount:</span>
                     </div>
                     <span className="font-bold text-green-500">-${(basePrice - discountedPrice).toFixed(2)}</span>
                  </div>
                )}
                {appliedPromoCode && (
                  <div className="flex justify-between items-center text-sm md:text-lg animate-in slide-in-from-left-2 text-primary">
                     <div className="flex items-center gap-2">
                        <Ticket size={16} />
                        <span className="font-bold uppercase tracking-tight">Promo ({appliedPromoCode}):</span>
                     </div>
                     <span className="font-black">-{promoDiscount}%</span>
                  </div>
                )}
                <div className="h-px bg-slate-200 dark:bg-white/5 my-1" />
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs md:text-base text-muted-foreground dark:text-slate-400 font-black uppercase tracking-widest">Final Total:</span>
                    {(hasStoreDiscount || appliedPromoCode) && (
                      <Badge className="bg-primary/10 text-primary border-none text-[7px] md:text-[10px] font-black uppercase tracking-tighter md:tracking-normal px-1.5 md:px-2 py-0.5">Applied</Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-2xl md:text-5xl font-headline font-bold text-primary tracking-tighter">${total.toFixed(2)}</span>
                    <div className="flex items-center justify-end gap-1 text-[8px] md:text-[11px] text-green-600 dark:text-green-400 font-black uppercase tracking-widest mt-0.5 md:mt-1">
                      <ShieldCheck size={10} className="md:w-3.5 md:h-3.5" /> Secure Rate
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
              <Button variant="ghost" onClick={() => setStep(1)} className="order-2 sm:order-1 flex-1 h-11 md:h-14 rounded-xl md:rounded-2xl gap-2 font-bold dark:text-slate-300 text-xs md:text-base">
                <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" /> Back
              </Button>
              <Button 
                onClick={handlePaymentInitiation} 
                disabled={paymentMethods.length === 0}
                className="order-1 sm:order-2 flex-[2] h-12 md:h-16 rounded-xl md:rounded-2xl text-sm md:text-xl font-bold shadow-xl shadow-primary/20 active:scale-[0.98] transition-all"
              >
                Ku bixi {paymentMethods.find(m => m.id === selectedMethodId)?.name || 'lacagta'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className={cn(
        "transition-all duration-300 transform",
        step === 3 ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none absolute inset-0"
      )}>
        <Card className="rounded-[1.5rem] md:rounded-[3.5rem] shadow-2xl border-none p-3 md:p-8 text-center bg-white dark:bg-slate-900">
          <CardContent className="pt-6 md:pt-10">
            <div className="mx-auto w-14 h-14 md:w-24 md:h-24 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mb-5 md:mb-10 animate-bounce">
              <ShieldCheck className="w-7 h-7 md:w-14 md:h-14 text-green-500" />
            </div>
            <h2 className="text-lg md:text-3xl font-headline font-bold mb-2 md:mb-6 text-slate-900 dark:text-white">Xaqiiji Dalabkaaga</h2>
            <p className="text-muted-foreground dark:text-slate-400 mb-6 md:mb-12 text-[11px] md:text-base leading-relaxed max-w-sm mx-auto">
              Mahubtaa inaad lacagta dirtay? Hadii aadan dirin taabo <strong>"Dib U noqo"</strong>. Hadii aad dirtay Riix <strong>"Xaqiiji"</strong>.
            </p>
            <div className="bg-primary/5 dark:bg-primary/10 p-4 md:p-8 rounded-2xl md:rounded-[2rem] mb-6 md:mb-12 text-left border border-primary/10 dark:border-primary/20 shadow-inner">
              <div className="flex justify-between font-bold text-sm md:text-xl mb-2.5 md:mb-4 dark:text-white">
                <span>Wadarta dhabta ah</span>
                <span className="text-primary font-headline text-lg md:text-3xl">${total.toFixed(2)}</span>
              </div>
              <div className="space-y-1.5 md:space-y-3 pt-3 md:pt-5 border-t border-primary/10 dark:border-white/5 mt-2">
                <div className="text-[10px] md:text-[13px] text-muted-foreground dark:text-slate-500 flex justify-between items-center gap-2">
                  <span className="truncate">Lacag Diraha:</span>
                  <span className="font-mono font-bold text-foreground dark:text-slate-200 shrink-0">{gameDetails.senderNumber}</span>
                </div>
                <div className="text-[10px] md:text-[13px] text-muted-foreground dark:text-slate-500 flex justify-between items-center gap-2">
                  <span className="truncate">Player ID:</span>
                  <span className="font-mono font-bold text-foreground dark:text-slate-200 shrink-0">{gameDetails.playerID}</span>
                </div>
                {appliedPromoCode && (
                  <div className="text-[10px] md:text-[13px] text-primary flex justify-between items-center gap-2">
                    <span className="truncate font-bold">Promo Applied:</span>
                    <span className="font-black shrink-0">{appliedPromoCode} (-{promoDiscount}%)</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2.5 md:gap-4">
              <Button 
                onClick={handleFinalConfirm} 
                disabled={isProcessing}
                className="w-full h-14 xs:h-16 md:h-20 rounded-xl md:rounded-[2.5rem] text-sm xs:text-lg md:text-2xl font-bold shadow-xl shadow-primary/30 active:scale-95 transition-all uppercase tracking-wider"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center gap-2 md:gap-3">
                    <Loader2 className="w-4 h-4 md:w-6 md:h-6 animate-spin" />
                    <span>Verifying...</span>
                  </div>
                ) : "Waan Bixiyay (Xaqiiji)"}
              </Button>
              <Button variant="ghost" onClick={() => setStep(2)} className="h-11 md:h-14 rounded-xl text-[10px] md:text-sm text-muted-foreground dark:text-slate-500 hover:dark:text-slate-300 font-bold uppercase tracking-widest">
                 Dib u noqo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className={cn(
        "transition-all duration-700 transform",
        step === 4 ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-12 scale-95 pointer-events-none absolute inset-0"
      )}>
        <div className="py-6 md:py-16 flex flex-col items-center text-center px-2">
          <div className="relative mb-6 md:mb-12">
            <div className="absolute inset-0 bg-green-400 rounded-full blur-3xl opacity-20 animate-pulse" />
            <div className="relative w-16 h-16 md:w-32 md:h-32 bg-green-50 dark:bg-green-500/20 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 shadow-2xl border-2 md:border-4 border-white dark:border-slate-900">
              <CheckCircle2 className="w-8 h-8 md:w-16 md:h-16" />
            </div>
            <PartyPopper className="absolute -top-2 -right-2 md:-top-3 md:-right-3 w-6 h-6 md:w-12 md:h-12 text-yellow-500 animate-bounce" />
          </div>
          
          <h1 className="text-2xl md:text-6xl font-headline font-bold mb-3 md:mb-6 text-slate-900 dark:text-white tracking-tight">Waa Lagu guuleystay!</h1>
          <p className="text-[11px] md:text-xl text-muted-foreground dark:text-slate-400 max-w-[280px] md:max-w-xl mb-8 md:mb-16 leading-relaxed font-medium">
            {isBooyahPass 
              ? `WhatsApp kaan (${item?.whatsappNumber || "252613982172"}) nagala Soo xariire si aad u iibsato booyah pass, Mahadsanid!.`
              : "Dalabkaga waa la diray. Sida ugu dhaqsiyaha badan ayaa lagugu adeegi doonnaa i.a, fadlan dulqaadka badi mahadsanid. Dalabkaaga waxaad Kala socon kartaa halkaan."}
          </p>

          <div className="grid grid-cols-1 gap-2.5 md:gap-5 w-full max-w-[280px] md:max-w-sm">
            {!isBooyahPass && (
              <Button 
                className="h-12 md:h-18 rounded-xl md:rounded-[2rem] font-bold text-sm md:text-xl shadow-xl shadow-primary/20 active:scale-95 transition-all"
                onClick={() => {
                   setActiveTab('orders');
                   router.push('/#orders');
                }}
              >
                Eeg Dalabkaaga
              </Button>
            )}
            <Button 
              variant="ghost"
              className="h-11 md:h-14 rounded-xl text-xs md:text-base text-muted-foreground dark:text-slate-500 font-bold"
              onClick={() => router.push('/')}
            >
              Ku laabo Home-ka
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-10 page-transition">
      <main className="container mx-auto px-1 sm:px-4 py-4 md:py-12 max-w-2xl">
        <Suspense fallback={<Skeleton className="h-96 w-full rounded-[1.5rem] md:rounded-[2.5rem]" />}>
          <CheckoutContent />
        </Suspense>
      </main>
    </div>
  );
}
