
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
  CreditCard,
  AlertTriangle,
  MessageCircle,
  ShoppingBag,
  Copy,
  Lock,
  Tag,
  DollarSign,
  Ticket,
  UserCheck,
  User,
  ShieldAlert,
  AlertCircle,
  Globe,
  Layers
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
  const { products, games, createOrder, setGlobalLoading, setActiveTab, user, loading, storeSettings, checkPromoCode, t, language } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('id');

  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  // FazerCards Dynamic Field States
  const [fazerFields, setFazerFields] = useState<any[]>([]);
  const [dynamicFields, setDynamicFields] = useState<Record<string, string>>({});
  
  // FazerCards Auto-Detect States
  const [ffUid, setFfUid] = useState('');
  const [ffPlayerName, setFfPlayerName] = useState('');
  const [ffRegion, setFfRegion] = useState('MENA');
  const [checking, setChecking] = useState(false);
  const [verified, setVerified] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [isValidationUnsupported, setIsValidationUnsupported] = useState(false);

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
      .filter(m => (m as any).active);
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

  const isAutoDetectEnabled = !!game?.autoDetectName;
  const isOneTime = !!item?.isOneTime;

  useEffect(() => {
    setGlobalLoading(false);
  }, [setGlobalLoading]);

  /**
   * Dynamic Field Discovery Effect
   */
  useEffect(() => {
    if (item?.fazercardsCategory_id) {
      fetch(`/api/fazercards/topups/offers?category_id=${item.fazercardsCategory_id}`)
        .then(res => res.json())
        .then(data => {
          if (data.ok && data.fields) {
            setFazerFields(data.fields);
            // Initialize dynamic fields object
            const initial: any = {};
            data.fields.forEach((f: any) => initial[f.key] = "");
            setDynamicFields(initial);
          }
        })
        .catch(err => console.error("Error fetching category fields:", err));
    }
  }, [item?.fazercardsCategory_id]);

  /**
   * Official FazerCards ID Validation Effect
   */
  useEffect(() => {
    if (!isAutoDetectEnabled) return;
    
    // We treat ffUid as the primary identifier (player_id, user_id, uid)
    const primaryId = ffUid.trim();

    if (!primaryId || primaryId.length < 5) {
      setFfPlayerName('');
      setVerified(false);
      setLookupError('');
      setIsValidationUnsupported(false);
      return;
    }

    const timer = setTimeout(async () => {
      setChecking(true);
      setVerified(false);
      setLookupError('');
      setFfPlayerName('');
      setIsValidationUnsupported(false);

      const categoryId = item?.fazercardsCategory_id;
      if (!categoryId) {
        setChecking(false);
        setLookupError('Item needs configuration for auto-detect.');
        return;
      }

      try {
        const res = await fetch('/api/fazercards/validate-id', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category_id: categoryId,
            player_id: primaryId
          })
        });

        const data = await res.json();

        if (data.ok && data.player_name) {
          setFfPlayerName(data.player_name);
          setVerified(true);
          setLookupError('');
          setIsValidationUnsupported(false);
          setGameDetails(prev => ({ 
            ...prev, 
            playerName: data.player_name, 
            playerID: primaryId 
          }));
          
          // Map to dynamic fields if key matches
          const idKeys = ['player_id', 'user_id', 'uid'];
          setDynamicFields(prev => {
            const next = { ...prev };
            idKeys.forEach(k => { if (k in next) next[k] = primaryId; });
            return next;
          });
        } else {
          const isUnsupported = data.error?.toLowerCase().includes('not available') || data.error?.toLowerCase().includes('unsupported');
          setFfPlayerName('');
          setVerified(false);
          setIsValidationUnsupported(isUnsupported);
          setLookupError(data.error || 'Player not found or ID is invalid.');
        }
      } catch (err) {
        console.error("Validation error:", err);
        setFfPlayerName('');
        setVerified(false);
        setLookupError('Could not verify ID at this moment.');
      } finally {
        setChecking(false);
      }
    }, 1000); 

    return () => clearTimeout(timer);
  }, [ffUid, isAutoDetectEnabled, item?.fazercardsCategory_id]);

  const basePrice = useMemo(() => Number(item?.price || 0), [item]);
  const storeDiscountedPrice = useMemo(() => Number(item?.discountedPrice || 0), [item]);
  
  const storeDiscountPct = useMemo(() => {
    if (storeDiscountedPrice > 0 && storeDiscountedPrice < basePrice) {
      return Math.round(((basePrice - storeDiscountedPrice) / basePrice) * 100);
    }
    return 0;
  }, [basePrice, storeDiscountedPrice]);

  const rankDiscount = user?.leaderboardDiscount || 0;
  const totalInitialDiscountPct = storeDiscountPct + rankDiscount;

  const priceAfterInitialDiscounts = useMemo(() => {
    return basePrice * (1 - totalInitialDiscountPct / 100);
  }, [basePrice, totalInitialDiscountPct]);

  const total = useMemo(() => {
    if (appliedPromoCode && promoDiscount > 0) {
      return priceAfterInitialDiscounts * (1 - promoDiscount / 100);
    }
    return priceAfterInitialDiscounts;
  }, [priceAfterInitialDiscounts, appliedPromoCode, promoDiscount]);
  
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
    
    const effectivePlayerName = isAutoDetectEnabled ? ffPlayerName : gameDetails.playerName;
    const effectivePlayerID = isAutoDetectEnabled ? ffUid : gameDetails.playerID;

    if (!isAutoDetectEnabled && effectivePlayerName.trim().length < 2) {
      toast({ title: "Magaca wuu gaabanyahay", description: "Magaca game-ka waa qasab.", variant: "destructive" });
      return;
    }

    if (effectivePlayerID.length < 5) {
      toast({ title: "Game ID khaldan", description: "Fadlan geli Game ID sax ah.", variant: "destructive" });
      return;
    }

    // Validate Dynamic Fields
    for (const f of fazerFields) {
      if (!dynamicFields[f.key]?.trim()) {
        toast({ title: "Missing Information", description: `Please enter ${f.name}.`, variant: "destructive" });
        return;
      }
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
    const effectivePlayerName = isAutoDetectEnabled ? ffPlayerName : gameDetails.playerName;
    const effectivePlayerID = isAutoDetectEnabled ? ffUid : gameDetails.playerID;

    if (!effectivePlayerName && !isAutoDetectEnabled) { toast({ title: "Magaca wuu gaabanyahay", variant: "destructive" }); return; }
    if (effectivePlayerID.length < 5) { toast({ title: "Game ID khaldan", variant: "destructive" }); return; }
    
    const adminWa = formatWhatsAppNumber(item?.whatsappNumber || "252613982172");
    const message = `Asc, Oskar Shop.\nWaxaan rabaa Booyah Pass: *${item?.title}*\nQiimaha: *$${total.toFixed(2)}*\n\n*Xogta Dalabka:*\nGame ID: ${effectivePlayerID}\nin-Game name: ${effectivePlayerName || 'N/A'}\nWhatsApp: ${gameDetails.whatsappNumber}\nLacag Diraha: ${gameDetails.senderNumber}\n\nFadlan ila soo xiriir.`;
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
    toast({ title: "Opening Dialer", description: `Please complete the ${method.name} transaction.` });
    window.location.href = `tel:${ussd.replace(/#/g, '%23')}`;
    setStep(3);
  };

  const handleFinalConfirm = () => {
    if (!item) return;
    setIsProcessing(true);
    setGlobalLoading(true);

    const effectivePlayerID = isAutoDetectEnabled ? ffUid : gameDetails.playerID;
    const effectivePlayerName = isAutoDetectEnabled ? ffPlayerName : gameDetails.playerName;

    const purchaseItem = { 
      id: item.id, 
      title: item.title, 
      price: total, 
      quantity: 1, 
      gameId: item.gameId, 
      thumbnail: item.thumbnail, 
      isOneTime: !!item.isOneTime,
      autoTopupEnabled: !!item.autoTopupEnabled,
      fazercardsCategory_id: item.fazercardsCategory_id,
      fazercardsOffer_id: item.fazercardsOffer_id,
      fazercardsMultiQuantity: item.fazercardsMultiQuantity || 1
    };

    const selectedMethod = paymentMethods.find(m => m.id === selectedMethodId);
    
    const finalDetails = { 
      ...gameDetails, 
      playerName: effectivePlayerName,
      playerID: effectivePlayerID,
      gameFields: dynamicFields,
      gameTitle: game?.title || "Unknown Game", 
      itemTitle: item.title, 
      category: isFreeFire ? "Free Fire" : isBloodStrike ? "Blood Strike" : "General" 
    };

    if (isAutoDetectEnabled) {
      (finalDetails as any).ffUid = ffUid.trim();
      (finalDetails as any).ffPlayerName = ffPlayerName;
      (finalDetails as any).ffVerified = verified;
      (finalDetails as any).ffRegion = ffRegion;
    }

    createOrder(selectedMethod?.name || "Mobile Payment", finalDetails, purchaseItem, appliedPromoCode || undefined);
    
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setStep(4);
      setGlobalLoading(false);
      toast({ title: "Order Confirmed!", description: "Your diamonds are on the way!" });
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
        <Card className="rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-8">
           <Skeleton className="h-8 w-1/2 mb-4" />
           <Skeleton className="h-12 w-full mb-4" />
           <Skeleton className="h-12 w-full" />
        </Card>
      </div>
    );
  }

  const RankIcon = user?.leaderboardRank === 1 ? "🥇" : user?.leaderboardRank === 2 ? "🥈" : user?.leaderboardRank === 3 ? "🥉" : null;
  const hasAnyDiscount = totalInitialDiscountPct > 0 || promoDiscount > 0;
  
  const isSubmitDisabled = checking || (ffUid.length > 0 && !verified && !isValidationUnsupported);

  // Group Dynamic Fields for rendering
  const isIdentifier = (k: string) => ['player_id', 'user_id', 'uid'].includes(k);
  const identifierField = fazerFields.find(f => isIdentifier(f.key));
  const otherFields = fazerFields.filter(f => !isIdentifier(f.key));

  return (
    <div className="relative min-h-[500px] px-1 sm:px-4 md:px-0">
      {step < 4 && (
        <div className="mb-8 md:mb-12 flex items-center justify-between px-2 gap-4">
          <div className="shrink-0">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => { setGlobalLoading(true); router.push('/#games'); }} 
              className="rounded-full text-muted-foreground hover:text-foreground h-9 w-9 md:h-12 md:w-12 bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-white/5"
            >
              <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" strokeWidth={3} />
            </Button>
          </div>

          {!isBooyahPass && (
            <div className="flex-1 flex justify-between items-center relative max-w-sm mx-auto">
              <div className="absolute left-0 right-0 h-0.5 bg-gray-100 dark:bg-white/5 top-[16px] md:top-[20px] mx-6 md:mx-8 -z-10" />
              <div className="absolute left-0 h-0.5 bg-primary top-[16px] md:top-[20px] mx-6 md:mx-8 -z-10 transition-all duration-500" style={{ width: `${((step - 1) / 2) * 100}%` }} />
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex flex-col items-center gap-1 md:gap-2">
                  <div className={cn(
                    "w-7 h-7 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold transition-all shadow-sm text-[9px] md:text-sm relative", 
                    step >= s ? "bg-primary text-white scale-110 shadow-primary/20" : "bg-white dark:bg-slate-900 text-gray-400 dark:text-slate-600 border-2 border-gray-100 dark:border-white/5"
                  )}>
                    {step === s && <div className="absolute inset-0 bg-primary/20 rounded-full blur-[8px] animate-pulse" />}
                    {step > s ? <CheckCircle2 className="w-3.5 h-3.5 md:w-5 md:h-5" /> : s}
                  </div>
                  <span className={cn("text-[7px] md:text-[10px] font-black uppercase tracking-widest text-center", step >= s ? "text-primary" : "text-gray-400 dark:text-slate-600")}>
                    {s === 1 ? "Xogta" : s === 2 ? "Lacagta" : "Xaqiiji"}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="w-9 md:w-12 shrink-0" />
        </div>
      )}

      <div className={cn("transition-all duration-300 transform", step === 1 ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none absolute inset-0")}>
        <Card className="rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border-none p-0.5 md:p-2 bg-white dark:bg-slate-900">
          <CardHeader className="p-4 md:p-8">
            <CardTitle className="font-headline font-bold text-lg md:text-2xl flex items-center gap-2 text-slate-900 dark:text-white">
              {isBooyahPass ? <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-primary" /> : <Gamepad2 className="w-5 h-5 md:w-6 md:h-6 text-primary" />} 
              {isBooyahPass ? "Booyah pass" : (game?.title || "Xogta Dalabka")}
              {isOneTime && <Badge className="bg-red-500 text-white border-none font-bold text-[8px] md:text-[12px] px-2 py-0.5 uppercase ml-2">ONE TIME</Badge>}
            </CardTitle>
            <CardDescription className="dark:text-slate-400 text-[10px] md:text-sm">
              {isBooyahPass ? "Fadlan buuxi form-ka Si saxan." : `Fadlan buuxi xogta saxda ah si laguugu soo diro ${item?.title}.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-8 pt-0 md:pt-0">
            <form onSubmit={!isBooyahPass ? handleDetailsSubmit : (e) => e.preventDefault()} className="space-y-4 md:space-y-6">
              <div className={cn(
                "p-3 md:p-5 rounded-xl md:rounded-2xl flex gap-3 md:gap-4 items-start shadow-inner", 
                isOneTime 
                  ? "bg-red-500 text-white border-none" 
                  : isBooyahPass 
                    ? "bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/20 text-blue-600 dark:text-blue-400" 
                    : "bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-blue-400"
              )}>
                 {isOneTime ? <ShieldAlert className="shrink-0 w-5 h-5 md:w-8 md:h-8 animate-pulse" /> : <AlertTriangle className="shrink-0 w-4 h-4 md:w-6 md:h-6" />}
                 {isBooyahPass ? (
                   <div className="flex flex-col gap-1.5 md:gap-2 min-w-0 text-blue-800 dark:text-blue-300">
                     <p className="text-[9px] md:text-xs font-bold leading-relaxed">Number kaan ku dir lacag dhan <span className="text-[11px] md:text-sm font-headline text-foreground dark:text-white">${total.toFixed(2)}</span></p>
                     <div className="flex items-center gap-2 bg-white/50 dark:bg-black/20 px-2 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl border border-blue-200/50 dark:border-blue-800/30 w-fit">
                        <span className="text-[10px] md:text-sm font-mono font-bold tracking-wider">{item?.whatsappNumber || "252613982172"}</span>
                        <button type="button" onClick={() => copyToClipboard(item?.whatsappNumber || "252613982172")} className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors text-blue-700 dark:text-blue-300">
                           <Copy size={12} />
                        </button>
                     </div>
                   </div>
                 ) : isOneTime ? (
                    <div className="flex flex-col gap-1 min-w-0">
                       <p className="text-[10px] md:text-sm font-black uppercase tracking-widest">
                         {language === 'so' ? 'DIGNIIN' : 'SECURITY ALERT: ONE-TIME ITEM'}
                       </p>
                       <p className="text-[9px] md:text-xs font-bold leading-relaxed opacity-90">
                          {language === 'so' 
                            ? 'Fadlan iska fiiri bahashaan waa wax Hal mar la furan karo ( one time use) hada horo u Soo furate mar kale ma furan kartid❗ iska firi intaa ku dhaqaaqin.' 
                            : 'This item is limited to ONE PURCHASE per user. Double-check your ID carefully. OskarShop is not responsible for errors after submission.'}
                       </p>
                    </div>
                 ) : (
                   <p className="text-[9px] md:text-xs font-bold leading-relaxed">Fadlan iska hubi Xogta sida ID gaga inta aadan dalabka dirin, dalabka mar hadii la diro lama Soo celin karo FADLAN ISKA HUBI, Mahadsanid!.</p>
                 )}
              </div>

              <div className="space-y-3 md:space-y-4">
                {/* PRIMARY IDENTIFIER FIELD (Support Auto-Detect) */}
                <div className="space-y-1 md:space-y-2">
                  <Label className="text-[10px] md:text-sm font-bold dark:text-slate-200 ml-1">
                    {identifierField?.name || (isFreeFire ? "Game UID" : "Game ID")}
                  </Label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 z-10 pointer-events-none">
                      <Gamepad2 size={18} />
                    </div>
                    <Input 
                      placeholder="Tusaale: 1803494801" 
                      required 
                      type="tel" 
                      inputMode="numeric" 
                      className="h-11 md:h-14 rounded-xl md:rounded-2xl bg-gray-50 dark:bg-slate-800 border-none pl-12 pr-4 md:pl-14 md:pr-5 font-bold text-xs md:text-base focus-visible:ring-primary shadow-inner" 
                      value={isAutoDetectEnabled ? ffUid : gameDetails.playerID} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (isAutoDetectEnabled) {
                          setFfUid(val);
                        } else {
                          setGameDetails({...gameDetails, playerID: val});
                          if (identifierField) {
                            setDynamicFields({...dynamicFields, [identifierField.key]: val});
                          }
                        }
                      }} 
                    />
                  </div>
                </div>

                {/* AUTO-DETECT NAME OVERLAY */}
                {isAutoDetectEnabled && (
                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-sm font-bold dark:text-slate-200 ml-1">In-Game Name</Label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 z-10 pointer-events-none">
                        <User size={18} />
                      </div>
                      <Input 
                        placeholder={checking ? "Xaqiijinta ID-ga..." : isValidationUnsupported ? "Geli magacaaga manually" : (language === 'so' ? "Magaca si toos ah ayaa loo keenayaa" : "Auto-detecting...")} 
                        readOnly={!isValidationUnsupported}
                        className={cn(
                          "h-11 md:h-14 rounded-xl md:rounded-2xl transition-all border-2 pl-12 pr-12 md:pl-14 md:pr-14 font-bold text-xs md:text-base",
                          checking ? "border-slate-200 animate-pulse bg-slate-100" : 
                          verified ? "border-green-500 bg-green-50/10 text-green-600" : 
                          isValidationUnsupported ? "border-amber-300 bg-white dark:bg-slate-800" :
                          lookupError ? "border-red-500 bg-red-50/10" : "border-transparent bg-slate-100 opacity-70"
                        )} 
                        value={ffPlayerName}
                        onChange={(e) => isValidationUnsupported && setFfPlayerName(e.target.value)}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                         {checking && <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin text-slate-400" />}
                         {verified && <UserCheck className="w-4 h-4 md:w-5 md:h-5 text-green-500" />}
                         {lookupError && !isValidationUnsupported && <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-red-500" />}
                         {isValidationUnsupported && <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />}
                      </div>
                    </div>
                    {verified && <p className="text-[10px] font-bold text-green-500 ml-1">✓ Xogta waa sax</p>}
                    {lookupError && <p className={cn("text-[10px] font-bold ml-1", isValidationUnsupported ? "text-amber-600" : "text-red-500")}>{lookupError}</p>}
                  </div>
                )}

                {/* ADDITIONAL DYNAMIC FIELDS (Zone ID, Server, server_id etc) */}
                {otherFields.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {otherFields.map(field => (
                      <div key={field.key} className="space-y-1 md:space-y-2">
                        <Label className="text-[10px] md:text-sm font-bold dark:text-slate-200 ml-1">{field.name}</Label>
                        <div className="relative">
                           <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 z-10 pointer-events-none">
                              <Layers size={18} />
                           </div>
                           <Input 
                            placeholder={field.name} 
                            required 
                            className="h-11 md:h-14 rounded-xl md:rounded-2xl bg-gray-50 dark:bg-slate-800 border-none pl-12 font-bold text-xs md:text-base focus-visible:ring-primary shadow-inner" 
                            value={dynamicFields[field.key] || ""}
                            onChange={(e) => setDynamicFields({...dynamicFields, [field.key]: e.target.value})}
                           />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* MANUAL NAME FIELD (If not auto-detecting) */}
                {!isAutoDetectEnabled && (
                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-sm font-bold dark:text-slate-200 ml-1">in-game name</Label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 z-10 pointer-events-none">
                        <User size={18} />
                      </div>
                      <Input placeholder="Geli magaca game ka kugu qoran" required className="h-11 md:h-14 rounded-xl md:rounded-2xl bg-gray-50 dark:bg-slate-800 border-none pl-12 pr-4 md:pl-14 md:pr-5 font-bold text-xs md:text-base focus-visible:ring-primary shadow-inner" value={gameDetails.playerName} onChange={(e) => setGameDetails({...gameDetails, playerName: e.target.value})} />
                    </div>
                  </div>
                )}

                <div className="space-y-1 md:space-y-2">
                  <Label className="text-[10px] md:text-sm font-bold dark:text-slate-200 ml-1">WhatsApp Number</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10 pointer-events-none">
                      <span className="font-bold text-[10px] md:text-sm text-gray-400 border-r border-gray-200 pr-2">+252</span>
                    </div>
                    <Input 
                      type="tel" 
                      placeholder="613982172" 
                      required 
                      className="h-11 md:h-14 rounded-xl md:rounded-2xl bg-gray-50 dark:bg-slate-800 border-none pl-16 md:pl-20 pr-4 md:pr-5 font-bold text-xs md:text-base focus-visible:ring-primary shadow-inner" 
                      value={gameDetails.whatsappNumber} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        const normalized = val.startsWith('0') ? val.substring(1) : val;
                        setGameDetails({...gameDetails, whatsappNumber: normalized.substring(0, 9)});
                      }} 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 md:space-y-2 pt-4 md:pt-5 border-t dark:border-white/5">
                <Label htmlFor="sender" className="text-[10px] md:text-sm font-bold flex items-center gap-1.5 md:gap-2 text-primary ml-1"><CreditCard className="w-3.5 h-3.5 md:w-4 md:h-4" /> Lacag Diraha</Label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10 pointer-events-none">
                    <span className="font-bold text-sm md:text-lg text-gray-400 border-r border-gray-200 pr-3">+252</span>
                  </div>
                  <Input 
                    id="sender" 
                    type="tel" 
                    placeholder="613982172" 
                    required 
                    className="h-12 md:h-16 rounded-xl md:rounded-2xl bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-100 dark:border-blue-500/20 focus-visible:ring-primary font-headline font-bold text-base md:text-xl dark:text-white pl-20 md:pl-28 pr-4 md:pr-6" 
                    value={gameDetails.senderNumber} 
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      const normalized = val.startsWith('0') ? val.substring(1) : val;
                      setGameDetails({...gameDetails, senderNumber: normalized.substring(0, 9)});
                    }} 
                  />
                </div>
                <p className="text-[8px] md:text-[11px] text-muted-foreground dark:text-slate-500 font-medium italic ml-1">* Number-kan waxaa loo isticmaali doonaa in lagu hubiyo lacag bixintaada.</p>
              </div>

              <Button 
                type="button" 
                onClick={isBooyahPass ? handleBooyahRedirect : handleDetailsSubmit} 
                disabled={isSubmitDisabled}
                className="w-full h-14 sm:h-16 md:h-20 rounded-xl md:rounded-[2rem] text-base md:text-2xl font-bold gap-3 shadow-2xl shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] transition-all bg-primary hover:bg-primary/90 text-white uppercase tracking-widest mt-4"
              >
                {isBooyahPass ? "iibso" : "Continue to Payment"} 
                {isBooyahPass ? <MessageCircle className="w-5 h-5 md:w-8 md:h-8" /> : <ChevronRight className="w-5 h-5 md:w-8 md:h-8" />}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className={cn("transition-all duration-300 transform", step === 2 ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none absolute inset-0")}>
        <Card className="rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border-none p-0.5 md:p-2 bg-white dark:bg-slate-900">
          <CardHeader className="p-4 md:p-8">
            <CardTitle className="font-headline font-bold text-lg md:text-2xl text-slate-900 dark:text-white">Lacag Bixinta</CardTitle>
            <CardDescription className="text-[10px] md:text-sm font-medium">Dooro qaabka aad u bixinayso</CardDescription>
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
                  <div key={method.id} onClick={() => setSelectedMethodId(method.id)} className={cn("flex items-center justify-between p-3 md:p-5 border-2 rounded-xl md:rounded-[2rem] cursor-pointer transition-all active:scale-[0.98]", selectedMethodId === method.id ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-slate-800/50')}>
                    <Label htmlFor={method.id} className="flex items-center gap-3 md:gap-4 cursor-pointer w-full">
                      <div className={cn("w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-2xl flex items-center justify-center transition-colors relative overflow-hidden shrink-0", selectedMethodId === method.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400")}>
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

            <div className="mb-6 md:mb-8 space-y-3">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2"><Ticket size={12} /> {t('promo_code_prompt')}</Label>
              <div className="flex gap-2">
                 <Input placeholder="Geli code-ka..." value={promoCodeInput} onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())} className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-4 font-bold shadow-inner" />
                 <Button onClick={handleApplyPromo} disabled={!promoCodeInput || isValidatingPromo} className="h-12 md:h-14 px-6 md:px-10 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all">{isValidatingPromo ? <Loader2 className="animate-spin" /> : "Apply"}</Button>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-800/40 p-4 md:p-8 rounded-2xl md:rounded-[2rem] mb-6 md:mb-8 border border-gray-100 dark:border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 md:p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Lock size={40} className="md:size-[60px]" /></div>
              <div className="flex flex-col gap-3 relative z-10">
                {hasAnyDiscount && (
                  <div className="flex justify-between items-center text-sm md:text-lg">
                    <span className="text-muted-foreground dark:text-slate-400 font-medium">{language === 'so' ? 'Qiimaha hore' : 'Original Price:'}</span>
                    <span className={cn("font-bold text-slate-900 dark:text-white", hasAnyDiscount && "line-through opacity-40")}>${(basePrice || 0).toFixed(2)}</span>
                  </div>
                )}
                
                {totalInitialDiscountPct > 0 && (
                  <div className="flex justify-between items-center text-sm md:text-lg animate-in slide-in-from-right-2 text-primary">
                     <div className="flex items-center gap-2">
                        <span className="text-lg">{RankIcon}</span>
                        <span className="font-bold uppercase tracking-tight">{language === 'so' ? 'Diskoonti' : 'Discount'} (-{totalInitialDiscountPct}%):</span>
                     </div>
                     <span className="font-black">-${(basePrice * totalInitialDiscountPct / 100).toFixed(2)}</span>
                  </div>
                )}

                {appliedPromoCode && (
                  <div className="flex justify-between items-center text-sm md:text-lg animate-in slide-in-from-left-2 text-indigo-500">
                     <div className="flex items-center gap-2">
                        <Ticket size={16} />
                        <span className="font-bold uppercase tracking-tight">Promo ({appliedPromoCode}) (-{promoDiscount}%):</span>
                     </div>
                     <span className="font-black">-${(priceAfterInitialDiscounts * promoDiscount / 100).toFixed(2)}</span>
                  </div>
                )}

                <div className="h-px bg-slate-200 dark:bg-white/5 my-1" />
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2"><span className="text-xs md:base text-muted-foreground dark:text-slate-400 font-black uppercase tracking-widest">{t('final_total')}</span></div>
                  <div className="text-right">
                    <span className="text-2xl md:text-5xl font-headline font-bold text-primary tracking-tighter">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
              <Button 
                variant="ghost" 
                onClick={() => setStep(1)} 
                className="order-2 sm:order-1 w-full sm:w-auto flex-1 h-14 sm:h-16 md:h-20 rounded-xl md:rounded-[2rem] gap-2 font-bold dark:text-slate-300 text-xs md:text-xl transition-all active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5 md:w-5 md:h-5" /> {language === 'so' ? 'Dib U noqo' : 'Back'}
              </Button>
              <Button 
                onClick={handlePaymentInitiation} 
                disabled={paymentMethods.length === 0} 
                className="order-1 sm:order-2 w-full flex-[2] h-14 sm:h-16 md:h-20 rounded-xl md:rounded-[2rem] text-base xs:text-lg md:text-2xl font-bold shadow-2xl shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] transition-all bg-primary hover:bg-primary/90 text-white uppercase tracking-widest"
              >
                Ku bixi {paymentMethods.find(m => m.id === selectedMethodId)?.name || 'lacagta'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className={cn("transition-all duration-300 transform", step === 3 ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none absolute inset-0")}>
        <Card className="rounded-[1.5rem] md:rounded-[3.5rem] shadow-2xl border-none p-3 md:p-8 text-center bg-white dark:bg-slate-900">
          <CardContent className="pt-6 md:pt-10">
            <div className="mx-auto w-14 h-14 md:w-24 md:h-24 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mb-5 md:mb-10 animate-bounce"><ShieldCheck className="w-7 h-7 md:w-14 md:h-14 text-green-500" /></div>
            <h2 className="text-lg md:text-3xl font-headline font-bold mb-2 md:mb-6 text-slate-900 dark:text-white">Xaqiiji Dalabkaaga</h2>
            <p className="text-muted-foreground dark:text-slate-400 mb-6 md:mb-12 text-[11px] md:text-base leading-relaxed max-w-sm mx-auto">Mahubtaa inaad lacagta dirtay? Hadii aadan dirin taabo <strong>"Dib U noqo"</strong>. Hadii aad dirtay Riix <strong>"Xaqiiji"</strong>.</p>
            <div className="bg-primary/5 dark:bg-primary/10 p-4 md:p-8 rounded-2xl md:rounded-[2rem] mb-6 md:mb-12 text-left border border-primary/10 dark:border-primary/20 shadow-inner">
              <div className="flex justify-between font-bold text-sm md:text-xl mb-2.5 md:mb-4 dark:text-white"><span>Wadarta dhabta ah</span><span className="text-primary font-headline text-lg md:text-3xl">${total.toFixed(2)}</span></div>
              <div className="space-y-1.5 md:space-y-3 pt-3 md:pt-5 border-t border-primary/10 dark:border-white/5 mt-2">
                <div className="text-[10px] md:text-[13px] text-muted-foreground dark:text-slate-500 flex justify-between items-center gap-2"><span className="truncate">Lacag Diraha:</span><span className="font-mono font-bold text-foreground dark:text-slate-200 shrink-0">{gameDetails.senderNumber}</span></div>
                {/* Display all captured game fields */}
                {Object.entries(dynamicFields).map(([k, v]) => (
                  <div key={k} className="text-[10px] md:text-[13px] text-muted-foreground dark:text-slate-500 flex justify-between items-center gap-2">
                    <span className="truncate uppercase">{k.replace('_', ' ')}:</span>
                    <span className="font-mono font-bold text-foreground dark:text-slate-200 shrink-0">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2.5 md:gap-4">
              <Button onClick={handleFinalConfirm} disabled={isProcessing} className="w-full h-14 xs:h-16 md:h-20 rounded-xl md:rounded-[2.5rem] text-sm xs:text-lg md:text-2xl font-bold shadow-xl shadow-primary/30 active:scale-95 transition-all uppercase tracking-widest">{isProcessing ? <div className="flex items-center justify-center gap-2 md:gap-3"><Loader2 className="w-4 h-4 md:w-6 md:h-6 animate-spin" /><span>Verifying...</span></div> : "Waan Bixiyay (Xaqiiji)"}</Button>
              <Button variant="ghost" onClick={() => setStep(2)} className="w-full h-11 md:h-14 rounded-xl text-[10px] md:text-sm text-muted-foreground dark:text-slate-500 hover:dark:text-slate-300 font-bold uppercase tracking-widest">Dib u noqo</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className={cn("transition-all duration-700 transform", step === 4 ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-12 scale-95 pointer-events-none absolute inset-0")}>
        <div className="py-6 md:py-16 flex flex-col items-center text-center px-2">
          <div className="relative mb-6 md:mb-12">
            <div className="absolute inset-0 bg-green-400 rounded-full blur-3xl opacity-20 animate-pulse" /><div className="relative w-16 h-16 md:w-32 md:h-32 bg-green-50 dark:bg-green-500/20 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 shadow-2xl border-2 md:border-4 border-white dark:border-slate-900"><CheckCircle2 className="w-8 h-8 md:w-16 md:h-16" /></div><PartyPopper className="absolute -top-2 -right-2 md:-top-3 md:-right-3 w-6 h-6 md:w-12 md:h-12 text-yellow-500 animate-bounce" />
          </div>
          <h1 className="text-2xl md:text-6xl font-headline font-bold mb-3 md:mb-6 text-slate-900 dark:text-white tracking-tight">Waa Lagu guuleystay!</h1>
          <p className="text-[11px] md:text-xl text-muted-foreground dark:text-slate-400 max-w-[280px] md:max-w-xl mb-8 md:mb-16 leading-relaxed font-medium">{isBooyahPass ? `WhatsApp kaan (${item?.whatsappNumber || "252613982172"}) nagala Soo xariire si aad u iibsato booyah pass, Mahadsanid!.` : "Dalabkaga waa la diray. Sida ugu dhaqsiyaha badan ayaa lagugu adeegi doonnaa i.a, fadlan dulqaadka badi mahadsanid. Dalabkaaga waxaad Kala socon kartaa halkaan."}</p>
          <div className="grid grid-cols-1 gap-2.5 md:gap-5 w-full max-w-[280px] md:max-w-sm">{!isBooyahPass && (<Button className="h-12 md:h-18 rounded-xl md:rounded-[2rem] font-bold text-sm md:text-xl shadow-xl shadow-primary/20 active:scale-95 transition-all" onClick={() => { setActiveTab('orders'); router.push('/#orders'); }}>Eeg Dalabkaaga</Button>)}<Button variant="ghost" className="h-11 md:h-14 rounded-xl text-xs md:text-base text-muted-foreground dark:text-slate-500 font-bold" onClick={() => router.push('/')}>Ku laabo Home-ka</Button></div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl min-h-screen">
      <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-[2.5rem]" />}>
        <CheckoutContent />
      </Suspense>
    </div>
  );
}
