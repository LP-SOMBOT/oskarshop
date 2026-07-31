'use client';

import { useState, useMemo, useEffect, Suspense } from "react";
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
  CreditCard,
  MessageCircle,
  History,
  Check,
  XCircle,
  PartyPopper,
  ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { toast } from "@/hooks/use-toast";
import { cn, formatWhatsAppNumber } from "@/lib/utils";

function CheckoutEventContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { eventAccounts, user, createOrder, setGlobalLoading, storeSettings, language, t, setActiveTab } = useApp();
  
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [formData, setFormData] = useState({
    whatsappNumber: "",
    senderNumber: ""
  });

  const event = useMemo(() => {
    return (eventAccounts || []).find(e => e.id === id);
  }, [eventAccounts, id]);

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

  useEffect(() => {
    setGlobalLoading(false);
    if (!user) router.push('/login');
    if (!id && user) router.push('/');
  }, [id, user, router, setGlobalLoading]);

  if (!event) return <Skeleton className="h-96 w-full rounded-[2.5rem]" />;

  const finalPrice = event.winnerClaim?.finalPrice || 0;

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.whatsappNumber.length < 9 || formData.senderNumber.length < 9) {
       toast({ title: "Xogta waa khalad", description: "Fadlan geli numbero sax ah.", variant: "destructive" });
       return;
    }
    setStep(2);
  };

  const handlePaymentInitiation = () => {
    const method = paymentMethods.find(m => m.id === selectedMethodId);
    if (!method) return;
    const formattedPrice = finalPrice.toFixed(2).replace('.', '*');
    const ussd = method.ussdTemplate.replace('$', formattedPrice);
    toast({ title: "Dialer-ka ayaa la furayaa", description: "Fadlan dhameystir lacag bixinta." });
    window.location.href = `tel:${ussd.replace(/#/g, '%23')}`;
    setStep(3);
  };

  const handleFinalConfirm = async () => {
    setIsProcessing(true);
    setGlobalLoading(true);
    try {
      const purchaseItem = {
        id: event.id,
        title: `Auction Winner: ${event.title}`,
        price: finalPrice,
        quantity: 1,
        gameId: 'event-accounts',
        thumbnail: event.imageUrls?.[0] || ''
      };

      const selectedMethod = paymentMethods.find(m => m.id === selectedMethodId);

      await createOrder(selectedMethod?.name || 'Mobile Payment', {
        ...formData,
        eventId: event.id,
        gameName: event.gameName,
        eventTitle: event.title,
        isEventWinner: true
      }, purchaseItem);

      // AUTOMATED WHATSAPP REDIRECTION FOR WINNER
      const adminWa = formatWhatsAppNumber("252614929987");
      const msg = `Asc Oskar Shop.\n\nWaxaan ahay guuleystaha Auction-ka: *${event.title}*\nQiimaha Final-ka: *$${finalPrice.toFixed(2)}*\n\n*Xogta Xaqiijinta:*\nWhatsApp: ${formData.whatsappNumber}\nLacag Diraha: ${formData.senderNumber}\n\nFadlan account-ka ii soo wareeji, Mahadsanid!`;
      const encodedMsg = encodeURIComponent(msg);
      
      setIsProcessing(false);
      setGlobalLoading(false);
      setStep(4);
      
      // Open WhatsApp
      window.open(`https://wa.me/${adminWa}?text=${encodedMsg}`, '_blank');

    } catch (e: any) {
       toast({ title: "Khalad", description: e.message, variant: "destructive" });
       setIsProcessing(false);
       setGlobalLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 md:py-16 space-y-8 animate-in fade-in duration-500">
       {step < 4 && (
         <div className="flex items-center justify-center px-2">
            <div className="flex items-center gap-2">
               <div className={cn("w-2 h-2 rounded-full", step >= 1 ? "bg-primary" : "bg-slate-200")} />
               <div className={cn("w-2 h-2 rounded-full", step >= 2 ? "bg-primary" : "bg-slate-200")} />
               <div className={cn("w-2 h-2 rounded-full", step >= 3 ? "bg-primary" : "bg-slate-200")} />
            </div>
         </div>
       )}

       <div className={cn("space-y-8", step === 4 ? "" : "block")}>
          {step === 1 && (
            <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
               <div className="bg-primary p-6 md:p-8 text-white flex items-center justify-between">
                  <div>
                    <h2 className="text-xl md:text-2xl font-headline font-bold uppercase tracking-tight">Xogta Iibsiga</h2>
                    <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mt-1">Claim your auction win</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase opacity-60">Wadarta</p>
                    <p className="text-2xl font-headline font-bold">${finalPrice.toFixed(2)}</p>
                  </div>
               </div>
               <form onSubmit={handleNextStep} className="p-6 md:p-10 space-y-6">
                  <div className="flex gap-4 items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                     <div className="w-16 h-16 relative rounded-xl overflow-hidden shrink-0 shadow-sm">
                        {event.imageUrls?.[0] && <Image src={event.imageUrls[0]} alt="" fill className="object-cover" unoptimized />}
                     </div>
                     <div>
                        <h3 className="font-bold text-base">{event.title}</h3>
                        <Badge variant="secondary" className="text-[8px] uppercase font-black px-2">{event.gameName}</Badge>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">WhatsApp Number</Label>
                        <Input 
                          placeholder="Geli WhatsApp number-kaaga" 
                          required
                          value={formData.whatsappNumber}
                          onChange={e => setFormData({...formData, whatsappNumber: e.target.value.replace(/\D/g, '')})}
                          className="h-12 md:h-14 rounded-xl md:rounded-2xl border-none bg-slate-50 dark:bg-slate-800 font-bold px-6 shadow-inner"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Lacag Diraha (Sender Number)</Label>
                        <Input 
                          placeholder="Number-ka aad lacagta ka soo dirtay" 
                          required
                          value={formData.senderNumber}
                          onChange={e => setFormData({...formData, senderNumber: e.target.value.replace(/\D/g, '')})}
                          className="h-12 md:h-14 rounded-xl md:rounded-2xl border-none bg-slate-50 dark:bg-slate-800 font-bold px-6 shadow-inner"
                        />
                     </div>
                  </div>

                  <Button type="submit" className="w-full h-14 md:h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all">
                     Continue to Payment
                  </Button>
               </form>
            </Card>
          )}

          {step === 2 && (
            <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 p-6 md:p-10 space-y-8">
               <div className="space-y-2">
                  <h2 className="text-xl md:text-2xl font-headline font-bold text-slate-900 dark:text-white">Lacag Bixinta</h2>
                  <p className="text-xs text-muted-foreground font-medium">Dooro qaabka aad u bixinayso lacagta auction-ka.</p>
               </div>

               <RadioGroup value={selectedMethodId} onValueChange={setSelectedMethodId} className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div key={method.id} onClick={() => setSelectedMethodId(method.id)} className={cn(
                      "flex items-center justify-between p-5 border-2 rounded-[2rem] cursor-pointer transition-all active:scale-[0.98]",
                      selectedMethodId === method.id ? 'border-primary bg-primary/5' : 'border-slate-50 hover:bg-slate-50'
                    )}>
                      <Label htmlFor={method.id} className="flex items-center gap-4 cursor-pointer w-full">
                         <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors relative overflow-hidden shrink-0", selectedMethodId === method.id ? "bg-primary text-white" : "bg-slate-100")}>
                            {method.icon ? <Image src={method.icon} alt="" fill className="object-cover" /> : <Smartphone size={24} />}
                         </div>
                         <div className="flex-1">
                            <p className="font-bold text-lg">{method.name}</p>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Mobile Payment</p>
                         </div>
                         <RadioGroupItem value={method.id} id={method.id} />
                      </Label>
                    </div>
                  ))}
               </RadioGroup>

               <Button 
                onClick={handlePaymentInitiation} 
                disabled={!selectedMethodId} 
                className="w-full h-14 md:h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all"
               >
                  Bixi Lacagta (${finalPrice.toFixed(2)})
               </Button>
            </Card>
          )}

          {step === 3 && (
            <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 p-8 md:p-14 text-center space-y-10">
               <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mx-auto animate-bounce">
                  <CheckCircle2 size={48} />
               </div>
               <div className="space-y-3">
                  <h2 className="text-2xl md:text-3xl font-headline font-bold">Xaqiiji Dalabkaaga</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">Mahubtaa inaad lacagta dirtay? Hadii aad dirtay riix badhanka hoose si dalabkaaga loo bilaabo.</p>
               </div>
               
               <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl text-left space-y-3 shadow-inner">
                  <div className="flex justify-between items-center">
                     <span className="text-[10px] font-black text-slate-400 uppercase">Final Amount</span>
                     <span className="text-xl font-headline font-bold text-primary">${finalPrice.toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-slate-200 dark:bg-white/5 w-full" />
                  <div className="flex justify-between items-center">
                     <span className="text-[10px] font-black text-slate-400 uppercase">Lacag Diraha</span>
                     <span className="text-sm font-bold">{formData.senderNumber}</span>
                  </div>
               </div>

               <Button 
                onClick={handleFinalConfirm} 
                disabled={isProcessing} 
                className="w-full h-16 md:h-20 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-2xl shadow-primary/20 active:scale-[0.95] transition-all"
               >
                  {isProcessing ? <Loader2 className="animate-spin" /> : "Waan Bixiyay (Xaqiiji)"}
               </Button>
            </Card>
          )}

          {step === 4 && (
            <div className="py-10 md:py-20 flex flex-col items-center text-center space-y-10 animate-in zoom-in duration-700">
               <div className="relative">
                  <div className="absolute inset-0 bg-green-400 rounded-full blur-[100px] opacity-20 animate-pulse" />
                  <div className="relative w-24 h-24 md:w-40 md:h-40 bg-green-50 dark:bg-green-500/20 rounded-[2rem] md:rounded-[3.5rem] flex items-center justify-center text-green-600 dark:text-green-400 shadow-2xl border-4 md:border-8 border-white dark:border-slate-900">
                     <CheckCircle2 size={48} className="md:size-24" />
                  </div>
                  <PartyPopper className="absolute -top-4 -right-4 md:-top-8 md:-right-8 w-10 h-10 md:w-20 md:h-20 text-amber-500 animate-bounce" />
               </div>
               
               <div className="space-y-4">
                  <h1 className="text-3xl md:text-6xl font-headline font-bold text-slate-900 dark:text-white uppercase leading-none">Waa Lagu Guuleystay!</h1>
                  <p className="text-sm md:text-2xl text-muted-foreground font-medium max-w-lg mx-auto leading-relaxed">
                     Dalabkaaga waa la diray. Admin-ka ayaa hadda hubinaya iibsiga account-ka ee auction-ka. Sida ugu dhaqsiyaha badan ayaa lagugu soo xiriiri doonaa.
                  </p>
               </div>

               <div className="grid grid-cols-1 gap-4 w-full max-w-sm mx-auto">
                  <Button 
                    onClick={() => { setActiveTab('orders'); router.push('/#orders'); }}
                    className="h-14 md:h-18 rounded-2xl bg-primary text-white font-bold text-lg shadow-xl shadow-primary/30 active:scale-95 transition-all"
                  >
                     Eeg Dalabkaaga
                  </Button>
                  <Button variant="ghost" onClick={() => router.push('/')} className="h-12 font-bold text-slate-400 hover:text-slate-900">
                     Ku laabo Home-ka
                  </Button>
               </div>
            </div>
          )}
       </div>
    </div>
  );
}

export default function CheckoutEventPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-transparent page-transition">
      <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-[2.5rem]" />}>
        <CheckoutEventContent />
      </Suspense>
    </div>
  );
}
