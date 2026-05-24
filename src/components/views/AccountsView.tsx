
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
import { format } from 'date-fns';
import { cn, formatWhatsAppNumber } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { uploadToImgbb } from '@/lib/imgbb';
import { useRouter } from 'next/navigation';

export default function AccountsView() {
  const { 
    accountPosts, 
    user, 
    orders, 
    setActiveTab, 
    isInitialLoading, 
    setIsPostingAccount,
    deleteAccountPost,
    t 
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
    const now = Date.now();
    const isAdmin = !!user?.isAdmin;
    const userId = user?.uid;

    return (accountPosts || [])
      .filter(p => {
        const isOwner = userId && p.uid === userId;
        const isInvolvedInDeal = userId && (orders || []).some(o => o.gameDetails?.postId === p.id && o.userId === userId);
        
        if (isAdmin || isOwner || isInvolvedInDeal) {
          return true;
        }

        // HIDDEN logic: Hide sold accounts from public feed (non-owners/non-admins)
        if (p.sold === true || p.status === 'sold') return false;

        if (p.status !== 'approved') return false;
        if (p.hiddenFromMarket === true) return false;

        const isExpired = p.expiresAt ? p.expiresAt < now : false;
        if (isExpired) return false;

        return true;
      })
      .filter(p => 
        p.authorName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.gameType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.platform?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [accountPosts, searchQuery, user, orders]);

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
      <PostAccountView 
        editingPost={editingPost}
        onCancel={() => { setIsPosting(false); setEditingPost(null); }}
        onComplete={() => { setIsPosting(false); setEditingPost(null); }}
      />
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
              <div className="relative flex-1 md:w-96 lg:w-[500px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                <Input 
                  placeholder="Search accounts..." 
                  className="pl-10 md:pl-12 h-12 md:h-14 lg:h-16 rounded-xl md:rounded-[1.5rem] bg-white dark:bg-slate-900 border-none shadow-sm dark:shadow-none font-bold text-sm md:text-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
               <h3 className="font-bold text-xl md:text-3xl text-slate-900 dark:text-white">No active listings</h3>
               <p className="text-sm md:text-lg">Check back later or post your own account!</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-8 lg:gap-10">
            {filteredPosts.map((post) => {
              const isBuyer = (orders || []).some(o => o.gameDetails?.postId === post.id && o.userId === user?.uid);
              return (
                <AccountPostCard 
                  key={post.id} 
                  post={post} 
                  onClick={() => router.push(`/accounts/${post.id}`)}
                  onEdit={(e) => { e.stopPropagation(); setEditingPost(post); }}
                  onDelete={(e) => { e.stopPropagation(); setDeletingPostId(post.id); }}
                  isOwner={post.uid === user?.uid}
                  isBuyer={isBuyer}
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

      <Dialog open={isActivityModalOpen} onOpenChange={setIsActivityModalOpen}>
         <DialogContent className="max-w-xl rounded-[2rem] md:rounded-[3rem] p-0 border-none shadow-2xl bg-white dark:bg-slate-900 mx-4">
            <DialogHeader className="p-6 md:p-10 pb-4 md:pb-6">
               <DialogTitle className="text-xl md:text-3xl font-headline font-bold text-slate-900 dark:text-white">My Market Activity</DialogTitle>
               <DialogDescription className="text-xs md:text-sm font-bold text-slate-50">Track the status of your listed and pending accounts.</DialogDescription>
            </DialogHeader>
            <div className="p-6 md:p-10 pt-0 space-y-4 md:space-y-6 max-h-[60vh] overflow-y-auto scrollbar-hide">
               {myActivity.length === 0 ? (
                 <div className="py-10 md:py-16 text-center opacity-30">
                    <Clock className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-4" />
                    <p className="text-sm md:text-lg font-bold">No recent activity</p>
                 </div>
               ) : (
                 myActivity.map(p => {
                    const isSeller = p.uid === user?.uid;
                    return (
                      <Card key={p.id} className="p-4 md:p-5 rounded-2xl md:rounded-[1.5rem] border-none bg-slate-50 dark:bg-slate-800 flex items-center justify-between group hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors cursor-pointer" onClick={() => { setIsActivityModalOpen(false); router.push(`/accounts/${p.id}`); }}>
                         <div className="flex items-center gap-3 md:gap-4">
                            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-700 relative shadow-sm shrink-0">
                               {p.thumbnailUrl && <Image src={p.thumbnailUrl} alt="" fill className="object-cover" />}
                            </div>
                            <div className="min-w-0">
                               <p className="text-sm md:text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight truncate max-w-[120px] md:max-w-none">{p.gameType} - Lv {p.level}</p>
                               <div className="flex items-center gap-2 mt-0.5">
                                  <p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest">{p.platform}</p>
                                  {isSeller ? <Badge className="h-4 text-[7px] md:text-[8px] bg-indigo-500 text-white border-none py-0 font-black">SELLER</Badge> : <Badge className="h-4 text-[7px] md:text-[8px] bg-green-500 text-white border-none py-0 font-black">BUYING</Badge>}
                               </div>
                            </div>
                         </div>
                         <Badge className={cn(
                           "rounded-full px-2 md:px-4 py-0.5 md:py-1 text-[8px] md:text-[10px] font-black uppercase tracking-widest border-none shadow-sm shrink-0",
                           p.status === 'approved' ? "bg-green-100 text-green-700" : (p.status === 'pending' || p.status === 'holding') ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                         )}>
                           {p.status}
                         </Badge>
                      </Card>
                    );
                 })
               )}
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}

function PostAccountView({ editingPost, onCancel, onComplete }: { editingPost?: any, onCancel: () => void, onComplete: () => void }) {
  const { postAccount, updateAccountPost, storeSettings, user, enhancedUser, t, language } = useApp();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [hasTriggeredUssd, setHasTriggeredUssd] = useState(false);

  const [formData, setFormData] = useState({
    gameType: editingPost?.gameType || 'freefire',
    platform: editingPost?.platform || 'Google',
    level: editingPost?.level?.toString() || '',
    price: editingPost?.price?.toString() || '',
    phone: editingPost?.phone || '',
    imageUrls: editingPost?.imageUrls || (editingPost?.thumbnailUrl ? [editingPost.thumbnailUrl] : []),
    evoWeapons: editingPost?.evoWeapons?.toString() || '',
    totalWeapons: editingPost?.totalWeapons?.toString() || '',
    emotes: editingPost?.emotes?.toString() || '',
    executionEmotes: editingPost?.executionEmotes?.toString() || '',
    arrivalEmotes: editingPost?.arrivalEmotes?.toString() || '',
    dharka: editingPost?.dharka?.toString() || '',
    term: editingPost?.term || 'weekly',
    primeLevel: editingPost?.primeLevel?.toString() || '1',
    age: editingPost?.age || '',
    accountId: editingPost?.accountId || '',
    accountName: editingPost?.accountName || '',
    internalWeapons: editingPost?.internalWeapons?.toString() || '',
    senderNumber: editingPost?.senderNumber || ''
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

  const isFreeFire = formData.gameType === 'freefire';

  const listingFee = useMemo(() => {
    if (formData.term === 'monthly') return storeSettings?.config?.shop?.listingFeeMonthly || 3.00;
    return storeSettings?.config?.shop?.listingFeeWeekly || 1.00;
  }, [formData.term, storeSettings]);

  const handleNext = () => {
    if (!formData.level || !formData.price || !formData.phone || !formData.senderNumber || formData.imageUrls.length === 0) {
      toast({ title: "Fadlan buuxi meelaha banaan", variant: "destructive" });
      return;
    }
    setStep(2);
  };

  const handleTriggerUssd = () => {
    const method = paymentMethods.find(m => m.id === selectedMethodId);
    if (!method) return;

    const formattedPrice = listingFee.toFixed(2).replace('.', '*');
    const ussd = method.ussdTemplate.replace('$', formattedPrice);
    
    toast({
      title: "Opening Dialer",
      description: `Please complete the ${method.name} transaction.`,
    });
    
    window.location.href = `tel:${ussd.replace(/#/g, '%23')}`;
    setHasTriggeredUssd(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        thumbnailUrl: formData.imageUrls[0] || '', 
        level: parseInt(formData.level || '0'),
        price: parseFloat(formData.price || '0'),
        evoWeapons: parseInt(formData.evoWeapons || '0'),
        totalWeapons: parseInt(formData.totalWeapons || '0'),
        emotes: parseInt(formData.emotes || '0'),
        executionEmotes: parseInt(formData.executionEmotes || '0'),
        arrivalEmotes: parseInt(formData.arrivalEmotes || '0'),
        dharka: parseInt(formData.dharka || '0'),
        primeLevel: parseInt(formData.primeLevel || '1'),
        internalWeapons: parseInt(formData.internalWeapons || '0'),
        fee: listingFee
      };

      if (editingPost) {
        await updateAccountPost(editingPost.id, payload);
      } else {
        await postAccount(payload);
      }
      setStep(3);
    } catch (e) {
      toast({ title: "Failed to post", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setIsSubmitting(true);
    try {
      const url = await uploadToImgbb(file);
      setFormData(prev => ({ 
        ...prev, 
        imageUrls: [...prev.imageUrls, url] 
      }));
      toast({ title: "Sawirka waa la galiyay!" });
    } catch (e) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#F8FAFC] dark:bg-slate-950 flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-500">
       <header className="h-16 md:h-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-100 dark:border-white/5 flex items-center justify-between px-4 sm:px-10 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full h-10 w-10 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <ArrowLeft className="w-6 h-6 text-slate-900 dark:text-white" />
             </Button>
             <div>
                <h2 className="font-headline font-bold text-lg md:text-2xl uppercase tracking-tight text-slate-900 dark:text-white">
                  {editingPost ? 'Edit Listing' : 'Post Account'}
                </h2>
                <p className="text-[9px] md:text-xs font-black text-primary uppercase tracking-widest leading-none mt-1">Verified Marketplace</p>
             </div>
          </div>
          
          <div className="flex items-center gap-1.5 md:gap-4 bg-slate-50 dark:bg-slate-800 px-3 md:px-6 py-1.5 md:py-2.5 rounded-full border border-slate-100 dark:border-white/5">
             {[1, 2, 3].map(s => (
               <div key={s} className="flex items-center gap-1 md:gap-2">
                  <div className={cn(
                    "w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all duration-500", 
                    step === s ? "bg-primary scale-125 shadow-[0_0_8px_rgba(14,165,233,0.6)]" : "bg-slate-300 dark:bg-slate-700"
                  )} />
                  <span className={cn(
                    "text-[8px] md:text-[10px] font-black uppercase tracking-tighter hidden xs:inline",
                    step === s ? 'text-primary' : 'text-slate-400'
                  )}>
                    {s === 1 ? 'Xogta' : s === 2 ? 'Payment' : 'Done'}
                  </span>
               </div>
             ))}
          </div>
       </header>

       <div className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-8 scrollbar-hide">
          <div className="max-w-3xl mx-auto w-full">
             {step === 1 && (
               <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {/* Hero Gallery Section */}
                  <div className="space-y-4">
                     <p className="text-[10px] md:text-xs font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">{t('account_gallery')}</p>
                     
                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                        {formData.imageUrls.map((url, idx) => (
                           <div key={url + idx} className="group relative aspect-square rounded-2xl md:rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 shadow-sm">
                              <Image src={url} alt="" fill className="object-cover" unoptimized />
                              {idx === 0 && <Badge className="absolute top-2 left-2 bg-primary text-white text-[8px] font-black uppercase px-2 py-0">Main</Badge>}
                              <button 
                                onClick={() => removeImage(idx)}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                 <X size={12} />
                              </button>
                           </div>
                        ))}
                        
                        <div className={cn(
                          "relative aspect-square rounded-2xl md:rounded-[2rem] bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center overflow-hidden transition-all hover:border-primary/40 group",
                          formData.imageUrls.length === 0 && "col-span-full aspect-video md:rounded-[3rem]"
                        )}>
                           <ImageIcon size={formData.imageUrls.length === 0 ? 32 : 24} className="text-slate-300 group-hover:text-primary transition-colors" />
                           <p className={cn(
                             "font-black uppercase tracking-widest mt-2 transition-colors group-hover:text-primary text-center px-4",
                             formData.imageUrls.length === 0 ? t('upload_photos_prompt') : (language === 'so' ? 'Ku dar' : 'Add More')
                           )}>
                             {formData.imageUrls.length === 0 ? t('upload_photos_prompt') : (language === 'so' ? 'Ku dar' : 'Add More')}
                           </p>
                           <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                           {isSubmitting && <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex items-center justify-center z-20"><Loader2 className="animate-spin text-primary" /></div>}
                        </div>
                     </div>
                  </div>

                  {/* Core Settings Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                     <Card className="p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-lg bg-white dark:bg-slate-900 space-y-6 md:space-y-8">
                        <div className="flex items-center gap-3 text-primary mb-2">
                           <Layers size={18} />
                           <h4 className="font-headline font-bold text-sm md:text-lg uppercase tracking-tight">{t('game_identity')}</h4>
                        </div>
                        <FormGroup label={t('game_type')}>
                           <Select value={formData.gameType} onValueChange={v => setFormData({...formData, gameType: v as any})}>
                              <SelectTrigger className="h-12 md:h-16 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-6 font-bold text-sm md:text-lg focus:ring-2 focus:ring-primary shadow-inner">
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl border-none shadow-2xl bg-white dark:bg-slate-900 z-[200]">
                                 <SelectItem value="freefire" className="rounded-xl font-bold uppercase text-xs p-3">Free Fire</SelectItem>
                                 <SelectItem value="bloodstrike" className="rounded-xl font-bold uppercase text-xs p-3">Blood Strike</SelectItem>
                              </SelectContent>
                           </Select>
                        </FormGroup>
                        <FormGroup label={t('login_method')}>
                           <Select value={formData.platform} onValueChange={v => setFormData({...formData, platform: v})}>
                              <SelectTrigger className="h-12 md:h-16 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-6 font-bold text-sm md:text-lg focus:ring-2 focus:ring-primary shadow-inner">
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl border-none shadow-2xl bg-white dark:bg-slate-900 z-[200]">
                                 <SelectItem value="Google" className="rounded-xl font-bold uppercase text-xs p-3">Google Account</SelectItem>
                                 <SelectItem value="Facebook" className="rounded-xl font-bold uppercase text-xs p-3">Facebook Login</SelectItem>
                              </SelectContent>
                           </Select>
                        </FormGroup>
                        
                        {isFreeFire ? (
                          <>
                            <FormGroup label="Prime Level">
                              <Select value={formData.primeLevel} onValueChange={v => setFormData({...formData, primeLevel: v})}>
                                  <SelectTrigger className="h-12 md:h-16 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-6 font-bold text-sm md:text-lg shadow-inner">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-2xl border-none shadow-2xl bg-white dark:bg-slate-900 z-[200]">
                                    {[1,2,3,4,5,6,7,8].map(l => <SelectItem key={l} value={l.toString()} className="rounded-xl font-bold uppercase text-xs p-3">Level {l}</SelectItem>)}
                                  </SelectContent>
                              </Select>
                            </FormGroup>
                            <FormInput label={t('account_age')} value={formData.age} onChange={v => setFormData({...formData, age: v})} placeholder="e.g. 2 years" />
                          </>
                        ) : (
                          <>
                             <ProfileInput label="In-Game Name (Alias)" value={formData.accountName} onChange={v => setFormData({...formData, accountName: v})} placeholder="e.g. Ghost_01" />
                             <ProfileInput label="Account ID" value={formData.accountId} onChange={v => setFormData({...formData, accountId: v})} placeholder="e.g. 982172" />
                          </>
                        )}
                     </Card>

                     <Card className="p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-lg bg-white dark:bg-slate-900 space-y-6 md:space-y-8">
                        <div className="flex items-center gap-3 text-amber-500 mb-2">
                           <Star size={18} />
                           <h4 className="font-headline font-bold text-sm md:text-lg uppercase tracking-tight">Level & Pricing</h4>
                        </div>
                        <FormInput label="ACCOUNT LEVEL" value={formData.level} type="number" onChange={v => setFormData({...formData, level: v})} placeholder="e.g. 65" />
                        <FormInput label={t('selling_price')} value={formData.price} type="number" onChange={v => setFormData({...formData, price: v})} placeholder="e.g. 50" highlight />
                     </Card>
                  </div>

                  {/* Asset Management Grid */}
                  <Card className="p-6 md:p-10 rounded-[1.5rem] md:rounded-[3rem] border-none shadow-lg bg-white dark:bg-slate-900">
                     <div className="flex items-center gap-3 text-indigo-500 mb-8 md:mb-12">
                        <TargetIcon size={20} />
                        <div>
                           <h4 className="font-headline font-bold text-base md:text-2xl uppercase tracking-tight">{t('premium_assets')}</h4>
                           <p className="text-[10px] md:text-xs text-muted-foreground font-black uppercase tracking-widest mt-0.5">{t('verify_assets_desc')}</p>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-8 lg:gap-12">
                        {isFreeFire ? (
                          <>
                            <FormInput label="Evo Guns" icon={Sword} value={formData.evoWeapons} type="number" onChange={v => setFormData({...formData, evoWeapons: v})} placeholder="0" />
                            <FormInput label="Total Weapons" icon={Target} value={formData.totalWeapons} type="number" onChange={v => setFormData({...formData, totalWeapons: v})} placeholder="0" />
                            <FormInput label="Emotes" icon={Zap} value={formData.emotes} type="number" onChange={v => setFormData({...formData, emotes: v})} placeholder="0" />
                            <FormInput label="Arrival Emotes" icon={Star} value={formData.arrivalEmotes} type="number" onChange={v => setFormData({...formData, arrivalEmotes: v})} placeholder="0" />
                            <FormInput label="Dharka" icon={ShoppingBag} value={formData.dharka} type="number" onChange={v => setFormData({...formData, dharka: v})} placeholder="0" />
                          </>
                        ) : (
                          <>
                             <FormInput label="Evo Weapons" icon={Sword} value={formData.evoWeapons} type="number" onChange={v => setFormData({...formData, evoWeapons: v})} placeholder="0" />
                             <FormInput label="Internal Weapons" icon={Target} value={formData.internalWeapons} type="number" onChange={v => setFormData({...formData, internalWeapons: v})} placeholder="0" />
                             <FormInput label="Emotes" icon={Zap} value={formData.emotes} type="number" onChange={v => setFormData({...formData, emotes: v})} placeholder="0" />
                             <FormInput label="Execution Emotes" icon={Bomb} value={formData.executionEmotes} type="number" onChange={v => setFormData({...formData, executionEmotes: v})} placeholder="0" />
                             <FormInput label="Arrival Emotes" icon={Star} value={formData.arrivalEmotes} type="number" onChange={v => setFormData({...formData, arrivalEmotes: v})} placeholder="0" />
                          </>
                        )}
                     </div>
                  </Card>

                  {/* Final Listing Settings */}
                  <Card className="p-6 md:p-10 rounded-[1.5rem] md:rounded-[3rem] border-none shadow-lg bg-white dark:bg-slate-900 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                     <FormGroup label={t('listing_duration')}>
                        <Select value={formData.term} onValueChange={v => setFormData({...formData, term: v as any})}>
                           <SelectTrigger className="h-12 md:h-20 rounded-xl md:rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 border-none px-6 font-bold text-sm md:text-xl shadow-inner">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent className="rounded-2xl border-none shadow-2xl z-[200]">
                              <SelectItem value="weekly" className="p-4 rounded-xl font-bold uppercase text-xs">Weekly - ${storeSettings?.config?.shop?.listingFeeWeekly || 1.00}</SelectItem>
                              <SelectItem value="monthly" className="p-4 rounded-xl font-bold uppercase text-xs">Monthly - ${storeSettings?.config?.shop?.listingFeeMonthly || 3.00}</SelectItem>
                           </SelectContent>
                        </Select>
                     </FormGroup>
                     <FormInput label={t('whatsapp_number_support')} value={formData.phone} type="tel" onChange={v => setFormData({...formData, phone: v})} placeholder="e.g. 613982172" />
                     <FormInput label={t('sender_number_label')} value={formData.senderNumber} type="tel" onChange={v => setFormData({...formData, senderNumber: v})} placeholder="e.g. 613982172" icon={CreditCard} />
                  </Card>

                  <div className="pt-4 md:pt-10">
                     <Button onClick={handleNext} className="w-full h-14 md:h-24 rounded-2xl md:rounded-[2.5rem] font-black text-sm md:text-3xl shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90 text-white uppercase tracking-[0.1em] active:scale-95 transition-all">
                        {language === 'so' ? "Horeye usoco" : "Continue"} <ChevronRight size={28} className="ml-2 md:ml-4" />
                     </Button>
                  </div>
               </div>
             )}

             {step === 2 && (
               <div className="space-y-6 sm:space-y-12 animate-in fade-in slide-in-from-right-4 duration-700 text-center max-w-2xl mx-auto">
                  <div className="relative mx-auto w-24 h-24 md:w-32 md:h-32">
                     <div className="absolute inset-0 bg-primary/20 rounded-full blur-[60px] animate-pulse" />
                     <div className="relative w-full h-full bg-white dark:bg-slate-900 rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center text-primary shadow-2xl border border-slate-100 dark:border-white/5">
                        <CreditCard className="w-10 h-10 md:w-14 md:h-14" />
                     </div>
                  </div>
                  
                  <div className="space-y-3 md:space-y-4">
                     <h3 className="text-2xl md:text-5xl font-headline font-bold uppercase tracking-tight text-slate-900 dark:text-white leading-tight">{t('pay_listing_fee_title')}</h3>
                     <p className="text-[11px] md:text-lg text-muted-foreground font-medium leading-relaxed max-w-md mx-auto">
                        {t('pay_listing_fee_desc')} <span className="text-primary font-black ml-1">${listingFee.toFixed(2)}</span>
                     </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 md:gap-10">
                     {/* Method Selection Card */}
                     <Card className="rounded-[1.5rem] md:rounded-[3rem] shadow-xl border-none p-1 md:p-2 bg-white dark:bg-slate-900">
                       <div className="p-5 md:p-10 space-y-6">
                          <p className="text-left text-[10px] md:text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Dooro qaabka aad u bixinayso</p>
                          
                          {paymentMethods.length === 0 ? (
                            <div className="py-12 opacity-40 italic font-bold">No payment methods configured.</div>
                          ) : (
                            <RadioGroup value={selectedMethodId} onValueChange={setSelectedMethodId} className="space-y-3 md:space-y-4">
                               {paymentMethods.map((method) => (
                                 <div 
                                   key={method.id}
                                   onClick={() => setSelectedMethodId(method.id)}
                                   className={cn(
                                     "flex items-center justify-between p-4 md:p-6 border-2 rounded-2xl md:rounded-[2rem] cursor-pointer transition-all active:scale-[0.98]",
                                     selectedMethodId === method.id 
                                       ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-lg shadow-primary/5' 
                                       : 'border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                   )}
                                 >
                                   <Label htmlFor={method.id} className="flex items-center gap-4 md:gap-6 cursor-pointer w-full">
                                     <div className={cn(
                                       "w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-[1.25rem] flex items-center justify-center transition-colors relative overflow-hidden shrink-0",
                                       selectedMethodId === method.id ? "bg-primary text-white shadow-lg" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                     )}>
                                       {method.icon ? <Image src={method.icon} alt={method.name} fill className="object-cover" unoptimized /> : <Smartphone className="w-6 h-6 md:w-8 md:h-8" />}
                                     </div>
                                     <div className="flex-1 text-left min-w-0">
                                       <p className="font-bold text-sm md:text-xl dark:text-white truncate">{method.name}</p>
                                     </div>
                                     <RadioGroupItem value={method.id} id={method.id} className="dark:border-white/20 h-4 w-4 md:h-6 md:w-6" />
                                   </Label>
                                 </div>
                               ))}
                            </RadioGroup>
                          )}
                       </div>
                     </Card>

                     {/* Summary and USSD Block */}
                     <Card className="rounded-[1.5rem] md:rounded-[3rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden relative">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-primary" />
                        <div className="p-6 md:p-10 space-y-8">
                           <div className="flex justify-between items-center text-[10px] md:text-sm font-black uppercase tracking-widest text-muted-foreground border-b dark:border-white/5 pb-4 md:pb-6">
                              <span>Listing Type</span>
                              <span>Total Fee</span>
                           </div>
                           
                           <div className="flex justify-between items-center text-left">
                              <div>
                                 <p className="font-headline font-bold text-lg md:text-3xl text-slate-900 dark:text-white uppercase tracking-tight">{formData.gameType} Account</p>
                                 <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase mt-1.5">{formData.term} access</Badge>
                              </div>
                              <p className="font-headline font-bold text-3xl md:text-6xl text-primary tracking-tighter">${listingFee.toFixed(2)}</p>
                           </div>

                           <div className="h-px bg-slate-50 dark:bg-white/5 w-full" />

                           {!hasTriggeredUssd ? (
                             <Button 
                               onClick={handleTriggerUssd} 
                               disabled={!selectedMethodId}
                               className="w-full h-16 md:h-24 rounded-2xl md:rounded-[2rem] bg-slate-900 text-white hover:bg-black font-black text-xs md:text-2xl gap-3 shadow-2xl active:scale-95 transition-all uppercase tracking-widest"
                             >
                                <Smartphone className="w-6 h-6 md:w-10 md:h-10" /> 
                                {language === 'so' ? `KU BIXI ${paymentMethods.find(m => m.id === selectedMethodId)?.name || ''}` : `${paymentMethods.find(m => m.id === selectedMethodId)?.name || 'PAY'} (DIAL)`}
                             </Button>
                           ) : (
                             <div className="space-y-4 md:space-y-8 animate-in zoom-in duration-500">
                                <div className="p-4 md:p-8 bg-green-50 dark:bg-green-500/10 rounded-2xl md:rounded-[2rem] border-2 border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400 font-bold text-[10px] md:text-xl lg:text-2xl flex flex-col items-center justify-center gap-3 md:gap-5 shadow-inner">
                                   <CheckCircle2 className="w-6 h-6 md:w-12 md:h-12" />
                                   <p className="text-center px-4">
                                      Iska hubi Number Kan <span className="text-slate-900 dark:text-white font-black underline decoration-primary/30">({storeSettings.paymentNumber || "613982172"})</span> inaad Ku dirtay Lacag dhan <span className="text-primary font-black underline decoration-primary/30">(${listingFee.toFixed(2)})</span>.
                                   </p>
                                </div>
                                <Button 
                                  onClick={handleSubmit} 
                                  disabled={isSubmitting} 
                                  className="w-full h-16 md:h-24 rounded-2xl md:rounded-[2rem] bg-primary text-white font-black text-xs md:text-3xl gap-4 shadow-2xl shadow-primary/30 active:scale-95 transition-all uppercase tracking-widest"
                                >
                                   {isSubmitting ? <Loader2 className="animate-spin w-8 h-8 md:w-12 md:h-12" /> : (language === 'so' ? "Waan bixiyay" : "I'VE PAID (SUBMIT LISTING)")}
                                </Button>
                             </div>
                           )}
                           
                           <div className="p-5 md:p-8 bg-slate-50 dark:bg-slate-800 rounded-2xl md:rounded-[2.5rem] border dark:border-white/5 flex gap-4 text-left">
                              <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                 <Info className="text-primary w-6 h-6 md:w-8 md:h-8" />
                              </div>
                              <p className="text-[9px] md:text-sm text-muted-foreground italic leading-relaxed font-medium">
                                 Dalabkaaga waxey qaadan kartaa 1-24 saac, Fadlan dulqaadka badi, Mahadsanid!.
                              </p>
                           </div>
                        </div>
                     </Card>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 md:gap-6 justify-center">
                     <Button 
                       variant="ghost" 
                       onClick={() => setStep(1)} 
                       className="text-slate-400 font-bold hover:text-slate-900 dark:hover:text-white uppercase text-[10px] md:text-sm tracking-widest h-12 md:h-16 px-8 rounded-xl md:rounded-2xl"
                     >
                        <ArrowLeft size={16} className="mr-2" /> Back to Account Details
                     </Button>
                  </div>
               </div>
             )}

             {step === 3 && (
               <div className="py-10 md:py-24 flex flex-col items-center justify-center text-center space-y-8 md:space-y-16 animate-in zoom-in duration-1000">
                  <div className="relative">
                     <div className="absolute inset-0 bg-green-400 rounded-full blur-[100px] opacity-30 animate-pulse" />
                     <div className="relative w-28 h-28 md:w-56 md:h-56 bg-green-50 dark:bg-green-500/20 rounded-[2rem] md:rounded-[4rem] flex items-center justify-center text-green-600 dark:text-green-400 shadow-2xl border-4 md:border-8 border-white dark:border-slate-900 ring-8 md:ring-[16px] ring-green-500/5">
                        <CheckCircle2 size={48} className="md:size-32" />
                     </div>
                     <Sparkles className="absolute -top-4 -right-4 md:-top-8 md:-right-8 w-10 h-10 md:w-20 md:h-20 text-amber-400 animate-bounce" />
                  </div>
                  
                  <div className="space-y-3 md:space-y-6">
                     <h2 className="text-3xl md:text-7xl font-headline font-bold tracking-tight text-slate-900 dark:text-white uppercase leading-none">Waa lagu guuleystay!</h2>
                     <p className="text-sm md:text-2xl text-muted-foreground font-medium max-w-lg mx-auto leading-relaxed">
                        Waad ku mahadsantahay! Post-kaaga waa "Pending". Admin-ka ayaa hadda hubinaya payment-kaaga si loo fasaxo Account-kaaga.
                     </p>
                  </div>

                  <div className="flex flex-col gap-3 md:gap-5 w-full max-md mx-auto">
                     <Button onClick={onComplete} className="h-14 md:h-24 rounded-2xl md:rounded-[2.5rem] font-black text-sm md:text-2xl shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90 text-white uppercase tracking-widest transition-transform active:scale-95">
                        Eeg Marketplace-ka
                     </Button>
                     <Button variant="ghost" onClick={onComplete} className="h-12 md:h-16 rounded-xl text-slate-400 font-bold hover:text-slate-900 dark:hover:text-white uppercase tracking-widest text-[10px] md:text-base">
                        Back to Home
                     </Button>
                  </div>
               </div>
             )}
          </div>
       </div>
    </div>
  );
}

function AccountPostCard({ post, onClick, onEdit, onDelete, isOwner, isBuyer, isAdmin }: { post: any, onClick: () => void, onEdit: (e:any)=>void, onDelete: (e:any)=>void, isOwner: boolean, isBuyer: boolean, isAdmin?: boolean }) {
  const isGoogle = post.platform === 'Google';
  const isExpired = post.expiresAt ? post.expiresAt < Date.now() : false;
  
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

  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!post.expiresAt || (!isOwner && !isAdmin)) return;
    const updateTime = () => {
      const now = Date.now();
      const diff = post.expiresAt - now;
      if (diff <= 0) {
        setTimeLeft("DHAMAADAY");
      } else {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${d}d ${h}h ${m}m remaining`);
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [post.expiresAt, isOwner, isAdmin]);
  
  return (
    <Card 
      onClick={onClick}
      className={cn(
        "rounded-[2rem] md:rounded-[3rem] border-none shadow-lg md:shadow-xl bg-white dark:bg-slate-900 overflow-hidden transition-all hover:-translate-y-1 md:hover:-translate-y-2 hover:shadow-2xl active:scale-[0.98] group cursor-pointer h-full flex flex-col relative",
        isExpired && "opacity-60 grayscale-[0.5]",
        isBuyer && "ring-2 ring-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.2)]"
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
           {isBuyer && <Badge className="bg-green-500 text-white text-[6px] uppercase font-black px-1.5 py-0.5 h-6 flex items-center shadow-md">MY DEAL</Badge>}
           <button 
             onClick={handleShare}
             className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-2xl flex items-center justify-center text-primary bg-primary/10 hover:bg-primary/20 transition-colors active:scale-90"
           >
              <Share2 className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />
           </button>
           {(isOwner || isAdmin) && (
             <>
                <Button size="icon" variant="ghost" className="h-7 h-7 md:h-10 md:w-10 text-blue-500 rounded-lg md:rounded-2xl" onClick={onEdit}><Edit className="w-3.5 h-3.5 md:w-4 md:h-4"/></Button>
                <Button size="icon" variant="ghost" className="h-7 h-7 md:h-10 md:w-10 text-red-500 rounded-lg md:rounded-2xl" onClick={onDelete}><Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4"/></Button>
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
           {post.status === 'holding' && (
             <Badge className="bg-blue-600 text-white border-none rounded-lg md:rounded-2xl px-2.5 md:px-4 py-1 md:py-2 text-[7px] md:text-[10px] font-black uppercase tracking-widest shadow-xl">
               HOLDING
             </Badge>
           )}
           {post.status === 'sold' && (
             <Badge className="bg-red-600 text-white border-none rounded-lg md:rounded-2xl px-2.5 md:px-4 py-1 md:py-2 text-[7px] md:text-[10px] font-black uppercase tracking-widest shadow-xl">
               SOLD
             </Badge>
           )}
        </div>

        {isExpired && !post.sold && (
          <div className="absolute inset-0 bg-red-950/70 backdrop-blur-sm flex items-center justify-center z-10 px-4 md:px-8">
             <div className="px-4 md:px-8 py-1.5 md:py-3 bg-red-600 text-white font-headline font-bold text-base md:text-2xl rounded-xl md:rounded-3xl transform -rotate-12 shadow-[0_15px_40px_rgba(239,68,68,0.5)] border-2 md:border-4 border-white/20">DHAMAADAY</div>
          </div>
        )}
      </div>

      <div className="p-4 md:p-8 space-y-4 md:space-y-6 flex-1 flex flex-col">
        <div className="flex justify-between items-center">
           <div className="flex gap-1 md:gap-2 min-w-0">
              <Badge variant="secondary" className="text-[7px] md:text-[10px] uppercase font-black tracking-widest rounded-md md:rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 md:px-4 py-0.5 md:py-1 truncate">{post.gameType}</Badge>
           </div>
           {(isOwner || isAdmin) && timeLeft && (
             <Badge variant="outline" className={cn("text-[7px] md:text-[10px] font-black border-2 rounded-md md:rounded-xl py-0.5 md:py-1 px-1.5 md:px-3 shrink-0", isExpired ? "text-red-500 border-red-500/20" : "text-primary border-primary/20 bg-primary/5")}>
               <Clock className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1 md:mr-1.5" /> {timeLeft}
             </Badge>
           )}
        </div>

        <div className="flex flex-wrap gap-2 md:gap-3">
           {post.gameType === 'bloodstrike' ? (
             <>
                <AssetMiniBadge label="Evo Weapons" value={post.evoWeapons} color="bg-amber-500" />
                <AssetMiniBadge label="Internal Weapons" value={post.internalWeapons} color="bg-blue-500" />
                <AssetMiniBadge label="Emotes" value={post.emotes} color="bg-purple-500" />
                <AssetMiniBadge label="Execution Emotes" value={post.executionEmotes} color="bg-red-500" />
                <AssetMiniBadge label="Arrival Emotes" value={post.arrivalEmotes} color="bg-indigo-500" />
             </>
           ) : (
             <>
                <AssetMiniBadge label="Evo Weapons" value={post.evoWeapons} color="bg-amber-500" />
                <AssetMiniBadge label="Total Weapons" value={post.totalWeapons} color="bg-blue-500" />
                <AssetMiniBadge label="Emotes" value={post.emotes} color="bg-purple-500" />
                <AssetMiniBadge label="Arrival Emotes" value={post.arrivalEmotes} color="bg-indigo-500" />
                <AssetMiniBadge label="Dharka" value={post.dharka} color="bg-pink-500" />
             </>
           )}
        </div>

        <div className="flex items-center justify-between pt-3 md:pt-6 border-t border-slate-50 dark:border-white/5 mt-auto">
           <div className="min-w-0">
             <p className="text-[8px] md:text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-0.5 md:mb-1 opacity-60">Price Value</p>
             <p className="text-xl md:text-4xl font-headline font-bold text-primary tracking-tighter">${parseFloat(post.price?.toString() || '0').toFixed(2)}</p>
           </div>
           <button className="rounded-lg md:rounded-[1.5rem] h-9 md:h-14 px-3 md:px-8 font-black text-[10px] md:text-base shadow-xl shadow-primary/20 gap-1 md:gap-2 uppercase tracking-wide shrink-0 bg-primary text-white hover:bg-primary/90">
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
    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-1.5 border dark:border-white/5 shadow-sm shrink-0 min-w-[80px] md:min-w-[100px]">
      <div className={cn("w-1.5 h-1.5 rounded-full", color)} />
      <span className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-wider">{label}:</span>
      <span className="text-[10px] md:text-xs font-bold text-slate-900 dark:text-white ml-auto">{value}</span>
    </div>
  );
}

function FormGroup({ label, children, icon: Icon }: { label: string | any, children: React.ReactNode, icon?: any }) {
  return (
    <div className="space-y-2 md:space-y-3">
       <label className="text-[10px] md:text-xs font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 flex items-center gap-1.5">
          {Icon && <Icon size={12} className="text-primary/60" />}
          {label}
       </label>
       {children}
    </div>
  );
}

function FormInput({ label, value, onChange, placeholder, type = "text", className, highlight, icon: Icon }: { label: string | any, value: string, onChange: (v: string) => void, placeholder: string, type?: string, className?: string, highlight?: boolean, icon?: any }) {
  return (
    <div className={cn("space-y-2 md:space-y-3", className)}>
       <label className="text-[10px] md:text-xs font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 flex items-center gap-1.5">
          {Icon && <Icon size={12} className="text-primary/60" />}
          {label}
       </label>
       <Input 
        type={type} 
        placeholder={placeholder} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        className={cn(
          "h-12 md:h-16 rounded-xl md:rounded-2xl border-none px-4 md:px-8 font-bold text-xs md:text-lg shadow-inner transition-all focus:ring-2 focus:ring-primary",
          highlight ? "bg-primary/5 text-primary" : "bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
        )} 
       />
    </div>
  );
}

function ProfileInput({ label, value, onChange, type = "text", inputMode }: { label: string, value: string, onChange: (val: string) => void, type?: string, inputMode?: any }) {
  return (
    <div className="space-y-1.5 md:space-y-2">
      <Label className="text-[10px] md:text-xs font-black uppercase tracking-[0.1em] md:tracking-[0.3em] text-muted-foreground ml-3 md:ml-6">{label}</Label>
      <Input 
        type={type} 
        inputMode={inputMode} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        className="h-10 md:h-16 lg:h-20 rounded-lg md:rounded-[1.5rem] lg:rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-none px-4 md:px-8 font-bold text-xs md:text-lg lg:text-2xl focus-visible:ring-primary shadow-inner" 
      />
    </div>
  );
}
