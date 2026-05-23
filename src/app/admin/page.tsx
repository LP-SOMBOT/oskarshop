"use client";

import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/lib/context";
import { 
  Settings as SettingsIcon, 
  Plus, 
  Trash2, 
  Edit, 
  Users, 
  User,
  Package, 
  ShoppingBag,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  Image as ImageIcon,
  Loader2,
  Menu,
  ChevronRight,
  Gamepad2,
  Search,
  Box,
  AlertCircle,
  RefreshCw,
  Clock,
  CreditCard,
  Hash,
  Smartphone,
  MessageCircle,
  Home,
  ShieldAlert,
  Bell,
  ChevronLeft,
  Megaphone,
  Tag,
  Sword,
  Target,
  Zap,
  Bomb,
  Check,
  PartyPopper,
  HandCoins,
  ShieldQuestion,
  Layers,
  Sparkles,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  Ban,
  Star,
  Radio,
  Monitor,
  Layout,
  ScrollText,
  Calendar as CalendarIcon,
  Mail,
  Send,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  History,
  Target as TargetIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { cn, formatWhatsAppNumber } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { uploadToImgbb } from "@/lib/imgbb";
import { format, formatDistanceToNow } from "date-fns";

/**
 * Advanced Countdown for Marketplace Expiry
 */
function CountdownDisplay({ expiresAt, status }: { expiresAt?: number, status: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!expiresAt || status === 'sold' || status === 'pending' || status === 'processing' || status === 'rejected') return;
    
    const update = () => {
      const now = Date.now();
      const diff = expiresAt - now;
      if (diff <= 0) setTimeLeft("EXPIRED");
      else {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${d}d ${h}h ${m}m`);
      }
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [expiresAt, status]);

  if (status === 'sold') return <Badge variant="outline" className="text-[8px] text-green-500 border-green-200 uppercase font-black">Sold</Badge>;
  if (!expiresAt) return <Badge variant="outline" className="text-[8px] opacity-40 uppercase font-black">Pending Approval</Badge>;

  return (
    <div className="flex flex-col gap-0.5">
      <span className={cn("text-[9px] font-bold uppercase", timeLeft === 'EXPIRED' ? "text-red-500" : "text-primary")}>{timeLeft}</span>
    </div>
  );
}

export default function AdminPage() {
  const { 
    user, 
    loading,
    storeSettings, 
    updateStoreSettings, 
    allUsers, 
    allOrders, 
    games,
    products, 
    accountPosts,
    events,
    banners,
    adminNotifications,
    markAdminNotificationsAsRead,
    updateOrderStatus,
    updateAccountPostStatus,
    enforceAccountAction,
    deleteUser: deleteUserFn,
    manageUser,
    saveGame,
    deleteGame,
    saveProduct,
    deleteProduct,
    saveEvent,
    deleteEvent,
    saveBanner,
    deleteBanner,
    savePaymentMethod,
    deletePaymentMethod,
    deleteOrder,
    deleteAccountPost,
    logout,
    isInitialLoading,
    refreshAdminData
  } = useApp();

  const router = useRouter();

  // View States
  const [activeView, setActiveView] = useState<'dashboard' | 'orders' | 'inventory' | 'account-posts' | 'events' | 'users' | 'settings'>('dashboard');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Detail Selection States (Full Page)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Dialog States
  const [isGameDialogOpen, setIsGameDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isBannerDialogOpen, setIsBannerDialogOpen] = useState(false);
  const [isPaymentMethodDialogOpen, setIsPaymentMethodDialogOpen] = useState(false);
  const [isUserManageOpen, setIsUserManageOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEnforceDialogOpen, setIsEnforceDialogOpen] = useState(false);

  // Form States
  const [editingGame, setEditingGame] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  const [pendingOrderStatus, setPendingStatus] = useState<string>("");
  const [cancellationReason, setCancellationReason] = useState<string>("");
  const [pendingAccountStatus, setPendingAccountStatus] = useState<string>("");
  const [assignBuyerId, setAssignBuyerId] = useState<string>("");
  const [enforceMessage, setEnforceMessage] = useState("");
  const [enforceAction, setEnforceAction] = useState<'delete' | 'holding' | 'approved' | 'pending'>('delete');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, type: string } | null>(null);

  const [gameForm, setGameForm] = useState({ title: "", icon: "", category: "top-up" });
  const [productForm, setProductForm] = useState({ title: "", gameId: "", category: "top-up" as any, description: "", price: "", discountedPrice: "", thumbnail: "", whatsappNumber: "" });
  const [eventForm, setEventForm] = useState({ title: "", shortDescription: "", content: "", thumbnailUrl: "", type: "freefire_event" as any, active: true, duration: "", durationUnit: "days" });
  const [bannerForm, setBannerForm] = useState({ imageUrl: "", linkTo: "" });
  const [paymentMethodForm, setPaymentMethodForm] = useState({ name: "", icon: "", ussdTemplate: "", active: true });
  const [pointAdjustment, setPointAdjustment] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  // Search/Filters
  const [orderSearch, setOrderSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");
  const [accountSearch, setAccountSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState("all");
  const [userSearch, setUserSearch] = useState("");

  // Settings Forms
  const [helpLinksForm, setHelpLinksForm] = useState({ tutorialUrl: "", whatsappNumber: "", tiktokUrl: "" });
  const [appStatusForm, setAppStatusForm] = useState({ offline: false, offlineTitle: "", offlineBody: "", offlineImageUrl: "" });
  const [feeConfigForm, setFeeConfigForm] = useState({ listingFeeWeekly: 1, listingFeeMonthly: 3 });
  const [termsForm, setTermsForm] = useState({ en: "", so: "" });
  const [emailjsForm, setEmailjsForm] = useState({ serviceId: "", templateId: "", publicKey: "" });

  useEffect(() => {
    if (!loading && !user?.isAdmin) router.replace('/');
  }, [user, loading, router]);

  useEffect(() => {
    if (storeSettings) {
      setHelpLinksForm(storeSettings.helpLinks || { tutorialUrl: "", whatsappNumber: "", tiktokUrl: "" });
      setAppStatusForm(storeSettings.appStatus || { offline: false, offlineTitle: "", offlineBody: "", offlineImageUrl: "" });
      setFeeConfigForm({
        listingFeeWeekly: storeSettings.config?.shop?.listingFeeWeekly || 1,
        listingFeeMonthly: storeSettings.config?.shop?.listingFeeMonthly || 3,
      });
      setTermsForm(storeSettings.termsAndConditions || { en: "", so: "" });
      setEmailjsForm(storeSettings.emailjs || { serviceId: "", templateId: "", publicKey: "" });
    }
  }, [storeSettings]);

  // Data Filtering
  const filteredOrders = useMemo(() => {
    return allOrders.filter(o => {
      const matchesSearch = o.id.toLowerCase().includes(orderSearch.toLowerCase()) || 
                           o.gameDetails?.playerName?.toLowerCase().includes(orderSearch.toLowerCase()) ||
                           o.gameDetails?.playerID?.toLowerCase().includes(orderSearch.toLowerCase());
      const matchesFilter = orderFilter === "all" || o.status === orderFilter;
      return matchesSearch && matchesFilter;
    });
  }, [allOrders, orderSearch, orderFilter]);

  const filteredAccounts = useMemo(() => {
    return accountPosts.filter(p => {
      const matchesSearch = p.authorName?.toLowerCase().includes(accountSearch.toLowerCase()) || 
                           p.gameType?.toLowerCase().includes(accountSearch.toLowerCase()) ||
                           p.id.toLowerCase().includes(accountSearch.toLowerCase());
      const matchesFilter = accountFilter === "all" || p.status === accountFilter;
      return matchesSearch && matchesFilter;
    }).sort((a,b) => b.createdAt - a.createdAt);
  }, [accountPosts, accountSearch, accountFilter]);

  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => 
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.uid.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [allUsers, userSearch]);

  const selectedOrder = useMemo(() => allOrders.find(o => o.id === selectedOrderId), [selectedOrderId, allOrders]);
  const selectedAccount = useMemo(() => accountPosts.find(p => p.id === selectedAccountId), [selectedAccountId, accountPosts]);

  // Actions
  const handleOpenGameDialog = (game?: any) => {
    setEditingGame(game || null);
    setGameForm(game ? { title: game.title, icon: game.icon || "", category: game.category } : { title: "", icon: "", category: "top-up" });
    setIsGameDialogOpen(true);
  };

  const handleOpenProductDialog = (p?: any) => {
    setEditingProduct(p || null);
    setProductForm(p ? { ...p, price: p.price.toString(), discountedPrice: p.discountedPrice?.toString() || "" } : { title: "", gameId: "", category: "top-up", description: "", price: "", discountedPrice: "", thumbnail: "", whatsappNumber: "" });
    setIsProductDialogOpen(true);
  };

  const handleSaveGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try { await saveGame({ ...gameForm, id: editingGame?.id }); setIsGameDialogOpen(false); toast({ title: "Game Saved" }); } finally { setIsUploading(false); }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try { 
      await saveProduct({ ...productForm, price: parseFloat(productForm.price), discountedPrice: productForm.discountedPrice ? parseFloat(productForm.discountedPrice) : undefined, id: editingProduct?.id }); 
      setIsProductDialogOpen(false); 
      toast({ title: "Item Saved" }); 
    } finally { setIsUploading(false); }
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrderId || !pendingOrderStatus) return;
    setIsSavingStatus(true);
    try { 
      await updateOrderStatus(selectedOrderId, pendingOrderStatus, pendingOrderStatus === 'cancelled' ? cancellationReason : undefined); 
      setSelectedOrderId(null); 
      toast({ title: "Order Updated" }); 
    } finally { setIsSavingStatus(false); }
  };

  const handleAccountStatusUpdate = async () => {
    if (!selectedAccountId || !pendingAccountStatus) return;
    setIsSavingStatus(true);
    try { 
      await updateAccountPostStatus(selectedAccountId, pendingAccountStatus, pendingAccountStatus === 'sold' ? assignBuyerId : undefined); 
      setSelectedAccountId(null); 
      toast({ title: "Listing Updated" }); 
    } finally { setIsSavingStatus(false); }
  };

  const handleAdjustPoints = async (type: 'credit' | 'debit') => {
    if (!selectedUser || !pointAdjustment) return;
    const amount = parseInt(pointAdjustment);
    const newPoints = (selectedUser.points || 0) + (type === 'credit' ? amount : -amount);
    await manageUser(selectedUser.uid, { points: newPoints });
    setSelectedUser({ ...selectedUser, points: newPoints });
    setPointAdjustment("");
    toast({ title: "Balance Updated" });
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'order') await deleteOrder(deleteTarget.id);
      if (deleteTarget.type === 'account') await deleteAccountPost(deleteTarget.id);
      if (deleteTarget.type === 'game') await deleteGame(deleteTarget.id);
      if (deleteTarget.type === 'product') await deleteProduct(deleteTarget.id);
      if (deleteTarget.type === 'user') await deleteUserFn(deleteTarget.id);
      toast({ title: "Deleted Successfully" });
      setIsDeleteDialogOpen(false);
    } finally { setDeleteTarget(null); }
  };

  const handleImageUpload = async (file: File, target: string) => {
    setIsUploading(true);
    try {
      const url = await uploadToImgbb(file);
      if (target === 'game') setGameForm(f => ({ ...f, icon: url }));
      if (target === 'product') setProductForm(f => ({ ...f, thumbnail: url }));
      if (target === 'event') setEventForm(f => ({ ...f, thumbnailUrl: url }));
      if (target === 'banner') setBannerForm(f => ({ ...f, imageUrl: url }));
      if (target === 'logo') updateStoreSettings({ logo: url });
      toast({ title: "Media Uploaded" });
    } finally { setIsUploading(false); }
  };

  if (loading || isInitialLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">Waking Oskar Control...</p>
      </div>
    );
  }

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full">
      {!isMobile && (
        <div className="h-20 px-6 flex items-center justify-between shrink-0">
          {isSidebarExpanded && <span className="font-headline font-bold text-lg text-slate-900 dark:text-white uppercase tracking-tight">Oskar Control</span>}
          <button onClick={() => setIsSidebarExpanded(!isSidebarExpanded)} className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"><Menu size={20} /></button>
        </div>
      )}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-hide">
        <SideNavItem icon={Home} label="Back to Store" active={false} expanded={isSidebarExpanded || isMobile} onClick={() => router.push('/')} className="text-primary hover:bg-primary/5 mb-4" />
        <div className="h-px bg-slate-100 dark:bg-white/5 my-4" />
        <SideNavItem icon={LayoutDashboard} label="Dashboard" active={activeView === 'dashboard'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveView('dashboard'); setSelectedOrderId(null); setSelectedAccountId(null); setIsMobileMenuOpen(false); }} />
        <SideNavItem icon={ShoppingBag} label="Orders" active={activeView === 'orders'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveView('orders'); setSelectedOrderId(null); setIsMobileMenuOpen(false); }} badge={allOrders.filter(o => o.status === 'pending').length} />
        <SideNavItem icon={ShieldCheck} label="Marketplace" active={activeView === 'account-posts'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveView('account-posts'); setSelectedAccountId(null); setIsMobileMenuOpen(false); }} badge={accountPosts.filter(p => p.status === 'pending').length} />
        <SideNavItem icon={Package} label="Inventory" active={activeView === 'inventory'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveView('inventory'); setIsMobileMenuOpen(false); }} />
        <SideNavItem icon={Megaphone} label="Events" active={activeView === 'events'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveView('events'); setIsMobileMenuOpen(false); }} />
        <SideNavItem icon={Users} label="Users" active={activeView === 'users'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveView('users'); setIsMobileMenuOpen(false); }} />
        <SideNavItem icon={SettingsIcon} label="Settings" active={activeView === 'settings'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveView('settings'); setIsMobileMenuOpen(false); }} />
      </nav>
      <div className="p-4 border-t dark:border-white/5">
        <button onClick={logout} className="w-full h-12 flex items-center gap-4 text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 px-4 font-bold text-sm">
          <LogOut size={20} /> {(isSidebarExpanded || isMobile) && "Logout"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={cn("hidden md:flex h-screen bg-white dark:bg-slate-Target-900 border-r dark:border-white/5 flex-col transition-all duration-300 z-40 shadow-sm", isSidebarExpanded ? "w-64" : "w-20")}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-72 bg-white dark:bg-slate-900 border-none">
          <SidebarContent isMobile={true} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Header */}
        <header className="h-16 md:h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b dark:border-white/5 flex items-center justify-between px-4 sm:px-10 shrink-0 z-30">
          <div className="flex items-center gap-4">
             <button className="md:hidden p-2 text-slate-500 rounded-xl hover:bg-slate-50" onClick={() => setIsMobileMenuOpen(true)}><Menu size={24} /></button>
             <h2 className="text-base sm:text-xl font-headline font-bold uppercase tracking-tight text-slate-900 dark:text-white truncate">
               {selectedOrderId ? "Order Details" : selectedAccountId ? "Account Details" : activeView.replace('-', ' ')}
             </h2>
          </div>
          <div className="flex items-center gap-4">
             <Popover>
               <PopoverTrigger asChild>
                  <button className="relative p-2.5 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-500 hover:text-primary transition-all active:scale-90">
                     <Bell size={20} />
                     {adminNotifications.filter(n => !n.readBy?.[user.uid]).length > 0 && (
                       <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
                          {adminNotifications.filter(n => !n.readBy?.[user.uid]).length}
                       </span>
                     )}
                  </button>
               </PopoverTrigger>
               <PopoverContent className="w-80 p-0 rounded-2xl border-none shadow-2xl bg-white dark:bg-slate-900 mt-2">
                  <div className="p-4 border-b dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Admin Alerts</h3>
                    <button onClick={() => markAdminNotificationsAsRead()} className="text-[10px] font-black uppercase text-primary">Clear All</button>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto p-2 space-y-1 scrollbar-hide">
                    {adminNotifications.length === 0 ? (
                      <div className="py-12 text-center opacity-30 italic text-xs uppercase font-bold">No active alerts</div>
                    ) : (
                      adminNotifications.map(n => (
                        <div key={n.id} className={cn("p-4 rounded-xl transition-all", n.readBy?.[user.uid] ? "opacity-40" : "bg-primary/5 border border-primary/10")}>
                           <p className="text-xs font-bold leading-tight">{n.title}</p>
                           <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{n.body}</p>
                           <p className="text-[8px] font-black uppercase text-slate-300 mt-2">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                        </div>
                      ))
                    )}
                  </div>
               </PopoverContent>
             </Popover>
             <div className="flex items-center gap-3 pl-4 border-l dark:border-white/5">
                <div className="text-right hidden sm:block">
                   <p className="text-xs font-bold leading-none">{user.name}</p>
                   <p className="text-[9px] font-black text-primary uppercase mt-1">Admin Session</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative border-2 border-white shadow-sm shrink-0">
                   {user.photoURL ? <Image src={user.photoURL} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={20} /></div>}
                </div>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-10 scrollbar-hide bg-slate-50 dark:bg-slate-950">
          {/* Dashboard View */}
          {activeView === 'dashboard' && !selectedOrderId && !selectedAccountId && (
            <div className="space-y-10 animate-in fade-in duration-700">
               <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                  <StatCard label="Total Revenue" value={`$${allOrders.filter(o => o.status === 'successful').reduce((acc, o) => acc + o.total, 0).toFixed(2)}`} icon={DollarSign} color="text-blue-500" bgColor="bg-blue-50 dark:bg-blue-500/10" />
                  <StatCard label="Pending Items" value={(allOrders.filter(o => o.status === 'pending').length + accountPosts.filter(p => p.status === 'pending').length).toString()} icon={Clock} color="text-amber-500" bgColor="bg-amber-50 dark:bg-amber-500/10" pulse />
                  <StatCard label="Active Users" value={allUsers.length.toString()} icon={Users} color="text-indigo-500" bgColor="bg-indigo-50 dark:bg-indigo-500/10" />
                  <StatCard label="Market Supply" value={accountPosts.filter(p => p.status === 'approved' && !p.sold).length.toString()} icon={ShieldCheck} color="text-emerald-500" bgColor="bg-emerald-50 dark:bg-emerald-500/10" />
               </div>
               <Card className="rounded-[2.5rem] p-6 sm:p-10 border-none shadow-xl bg-white dark:bg-slate-900 h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={[{day:'Mon',v:20},{day:'Tue',v:45},{day:'Wed',v:35},{day:'Thu',v:80},{day:'Fri',v:65},{day:'Sat',v:100},{day:'Sun',v:85}]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize:10, fontWeight:'bold'}} />
                        <YAxis hide />
                        <Tooltip contentStyle={{borderRadius: '16px', border:'none', boxShadow:'0 10px 40px rgba(0,0,0,0.1)'}} />
                        <Area type="monotone" dataKey="v" stroke="#0EA5E9" fillOpacity={0.1} fill="#0EA5E9" strokeWidth={4} />
                     </AreaChart>
                  </ResponsiveContainer>
               </Card>
            </div>
          )}

          {/* Orders Management */}
          {activeView === 'orders' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
               {selectedOrderId ? (
                 <OrderDetailView 
                   order={selectedOrder} 
                   onBack={() => setSelectedOrderId(null)} 
                   onUpdate={handleStatusUpdate}
                   status={pendingOrderStatus}
                   setStatus={setPendingStatus}
                   reason={cancellationReason}
                   setReason={setCancellationReason}
                   isSaving={isSavingStatus}
                 />
               ) : (
                 <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                       <h3 className="text-xl md:text-3xl font-headline font-bold text-slate-900 dark:text-white uppercase tracking-tight">Active Orders</h3>
                       <div className="flex items-center gap-3 w-full sm:w-auto">
                          <Input placeholder="Search orders..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} className="h-12 rounded-xl dark:bg-slate-900 border-none shadow-sm" />
                          <Select value={orderFilter} onValueChange={setOrderFilter}>
                             <SelectTrigger className="w-[140px] h-12 rounded-xl dark:bg-slate-900 border-none">
                                <SelectValue />
                             </SelectTrigger>
                             <SelectContent className="rounded-xl border-none shadow-2xl">
                                <SelectItem value="all" className="p-3 font-bold text-xs uppercase">All Status</SelectItem>
                                <SelectItem value="pending" className="p-3 font-bold text-xs uppercase">Pending</SelectItem>
                                <SelectItem value="processing" className="p-3 font-bold text-xs uppercase">Processing</SelectItem>
                                <SelectItem value="successful" className="p-3 font-bold text-xs uppercase">Success</SelectItem>
                                <SelectItem value="cancelled" className="p-3 font-bold text-xs uppercase">Cancelled</SelectItem>
                             </SelectContent>
                          </Select>
                       </div>
                    </div>
                    <Card className="rounded-2xl md:rounded-[2rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                       <Table>
                          <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                             <TableRow className="border-none">
                                <TableHead className="px-6 font-bold uppercase text-[10px] tracking-widest text-slate-400">Order ID</TableHead>
                                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-400">Customer</TableHead>
                                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-400">Package</TableHead>
                                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-400">Total</TableHead>
                                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-400">Status</TableHead>
                                <TableHead className="text-right px-6 font-bold uppercase text-[10px] tracking-widest text-slate-400">Actions</TableHead>
                             </TableRow>
                          </TableHeader>
                          <TableBody>
                             {filteredOrders.length === 0 ? (
                               <TableRow><TableCell colSpan={6} className="h-64 text-center text-slate-300 italic">No matching orders found.</TableCell></TableRow>
                             ) : (
                               filteredOrders.map(o => (
                                 <TableRow key={o.id} className="border-slate-50 dark:border-white/5 hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="px-6 font-mono font-bold text-xs text-primary">{o.id.toUpperCase()}</TableCell>
                                    <TableCell>
                                       <div className="flex flex-col">
                                          <span className="font-bold text-sm">{o.gameDetails?.playerName || "Gamer"}</span>
                                          <span className="text-[10px] opacity-40 uppercase font-black">{o.gameDetails?.whatsappNumber || "No Phone"}</span>
                                       </div>
                                    </TableCell>
                                    <TableCell className="font-bold text-xs text-slate-500">{o.items?.[0]?.title || "N/A"}</TableCell>
                                    <TableCell className="font-black text-primary">${o.total.toFixed(2)}</TableCell>
                                    <TableCell><StatusBadge status={o.status} /></TableCell>
                                    <TableCell className="text-right px-6">
                                       <div className="flex justify-end gap-2">
                                          <Button size="icon" variant="ghost" className="h-10 w-10 text-primary rounded-xl" onClick={() => { setSelectedOrderId(o.id); setPendingStatus(o.status); setCancellationReason(o.cancellationReason || ""); }}><Edit size={16}/></Button>
                                          <Button size="icon" variant="ghost" className="h-10 w-10 text-red-500 rounded-xl" onClick={() => { setDeleteTarget({id:o.id, type:'order'}); setIsDeleteDialogOpen(true); }}><Trash2 size={16}/></Button>
                                       </div>
                                    </TableCell>
                                 </TableRow>
                               ))
                             )}
                          </TableBody>
                       </Table>
                    </Card>
                 </div>
               )}
            </div>
          )}

          {/* Marketplace Management */}
          {activeView === 'account-posts' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
               {selectedAccountId ? (
                 <AccountDetailView 
                   post={selectedAccount} 
                   allUsers={allUsers}
                   onBack={() => setSelectedAccountId(null)}
                   onUpdate={handleAccountStatusUpdate}
                   status={pendingAccountStatus}
                   setStatus={setPendingAccountStatus}
                   buyerId={assignBuyerId}
                   setBuyerId={setAssignBuyerId}
                   isSaving={isSavingStatus}
                   onEnforce={() => setIsEnforceDialogOpen(true)}
                 />
               ) : (
                 <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                       <h3 className="text-xl md:text-3xl font-headline font-bold text-slate-900 dark:text-white uppercase tracking-tight">Marketplace Listings</h3>
                       <div className="flex items-center gap-3 w-full sm:w-auto">
                          <Input placeholder="Search listings..." value={accountSearch} onChange={e => setAccountSearch(e.target.value)} className="h-12 rounded-xl dark:bg-slate-900 border-none shadow-sm" />
                          <Select value={accountFilter} onValueChange={setAccountFilter}>
                             <SelectTrigger className="w-[140px] h-12 rounded-xl dark:bg-slate-900 border-none">
                                <SelectValue />
                             </SelectTrigger>
                             <SelectContent className="rounded-xl border-none shadow-2xl">
                                <SelectItem value="all" className="p-3 font-bold text-xs uppercase">All Listings</SelectItem>
                                <SelectItem value="pending" className="p-3 font-bold text-xs uppercase">Pending</SelectItem>
                                <SelectItem value="approved" className="p-3 font-bold text-xs uppercase">Live</SelectItem>
                                <SelectItem value="holding" className="p-3 font-bold text-xs uppercase">Holding</SelectItem>
                                <SelectItem value="sold" className="p-3 font-bold text-xs uppercase">Sold</SelectItem>
                             </SelectContent>
                          </Select>
                       </div>
                    </div>
                    <Card className="rounded-2xl md:rounded-[2rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                       <Table>
                          <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                             <TableRow className="border-none">
                                <TableHead className="px-6 font-bold uppercase text-[10px] tracking-widest text-slate-400">Seller</TableHead>
                                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-400">Game Type</TableHead>
                                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-400">Price</TableHead>
                                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-400">Status</TableHead>
                                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-400">Expiry</TableHead>
                                <TableHead className="text-right px-6 font-bold uppercase text-[10px] tracking-widest text-slate-400">Actions</TableHead>
                             </TableRow>
                          </TableHeader>
                          <TableBody>
                             {filteredAccounts.length === 0 ? (
                               <TableRow><TableCell colSpan={6} className="h-64 text-center text-slate-300 italic">No account listings found.</TableCell></TableRow>
                             ) : (
                               filteredAccounts.map(p => (
                                 <TableRow key={p.id} className="border-slate-50 dark:border-white/5 hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="px-6">
                                       <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative shrink-0">
                                             {p.authorAvatar ? <Image src={p.authorAvatar} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-black">O</div>}
                                          </div>
                                          <div className="flex flex-col">
                                             <span className="font-bold text-sm">{p.authorName}</span>
                                             <span className="text-[10px] opacity-40 uppercase font-black">{p.phone}</span>
                                          </div>
                                       </div>
                                    </TableCell>
                                    <TableCell className="font-bold text-xs uppercase text-slate-500">{p.gameType}</TableCell>
                                    <TableCell className="font-black text-primary">${p.price.toFixed(2)}</TableCell>
                                    <TableCell><StatusBadge status={p.status} /></TableCell>
                                    <TableCell><CountdownDisplay expiresAt={p.expiresAt} status={p.status} /></TableCell>
                                    <TableCell className="text-right px-6">
                                       <div className="flex justify-end gap-2">
                                          <Button size="icon" variant="ghost" className="h-10 w-10 text-primary rounded-xl" onClick={() => { setSelectedAccountId(p.id); setPendingAccountStatus(p.status); setAssignBuyerId(p.boughtBy || ""); }}><Eye size={16}/></Button>
                                          <Button size="icon" variant="ghost" className="h-10 w-10 text-amber-500 rounded-xl" onClick={() => { setSelectedAccountId(p.id); setIsEnforceDialogOpen(true); }}><ShieldAlert size={16}/></Button>
                                          <Button size="icon" variant="ghost" className="h-10 w-10 text-red-500 rounded-xl" onClick={() => { setDeleteTarget({id:p.id, type:'account'}); setIsDeleteDialogOpen(true); }}><Trash2 size={16}/></Button>
                                       </div>
                                    </TableCell>
                                 </TableRow>
                               ))
                             )}
                          </TableBody>
                       </Table>
                    </Card>
                 </div>
               )}
            </div>
          )}

          {/* Inventory Management */}
          {activeView === 'inventory' && (
            <div className="space-y-10 animate-in fade-in duration-700">
               <Tabs defaultValue="products" className="w-full">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                     <TabsList className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm h-14 w-full md:w-auto">
                        <TabsTrigger value="games" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">Collections</TabsTrigger>
                        <TabsTrigger value="products" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">Diamond Packages</TabsTrigger>
                        <TabsTrigger value="banners" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">Promo Banners</TabsTrigger>
                     </TabsList>
                     <div className="flex gap-4">
                        <Button onClick={() => handleOpenGameDialog()} className="rounded-xl h-14 gap-2 font-black shadow-lg shadow-primary/20">+ ADD COLLECTION</Button>
                        <Button onClick={() => handleOpenProductDialog()} variant="secondary" className="rounded-xl h-14 gap-2 font-black">+ NEW PACKAGE</Button>
                     </div>
                  </div>

                  <TabsContent value="games">
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {games.map(g => (
                          <Card key={g.id} className="p-6 rounded-[2rem] border-none shadow-xl bg-white dark:bg-slate-900 group">
                             <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 relative overflow-hidden shrink-0 border dark:border-white/5">
                                   {g.icon ? <Image src={g.icon} alt="" fill className="object-cover" /> : <Gamepad2 className="m-auto mt-4 text-slate-300" />}
                                </div>
                                <div className="min-w-0">
                                   <h4 className="font-bold text-lg uppercase tracking-tight truncate">{g.title}</h4>
                                   <Badge variant="outline" className="text-[8px] font-black uppercase">{g.category}</Badge>
                                </div>
                             </div>
                             <div className="flex gap-2">
                                <Button className="flex-1 rounded-xl h-12 gap-2" variant="outline" onClick={() => handleOpenGameDialog(g)}><Edit size={14}/> Edit</Button>
                                <Button size="icon" className="w-12 h-12 rounded-xl text-red-500 hover:bg-red-50" variant="ghost" onClick={() => { setDeleteTarget({id:g.id, type:'game'}); setIsDeleteDialogOpen(true); }}><Trash2 size={16}/></Button>
                             </div>
                          </Card>
                        ))}
                     </div>
                  </TabsContent>

                  <TabsContent value="products">
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                        {products.map(p => (
                          <Card key={p.id} className="p-6 rounded-[2rem] border-none shadow-xl bg-white dark:bg-slate-900 group">
                             <div className="relative aspect-video rounded-2xl overflow-hidden mb-6 bg-slate-100 dark:bg-slate-800">
                                {p.thumbnail ? <Image src={p.thumbnail} alt="" fill className="object-cover" /> : <Package className="m-auto absolute inset-0 text-slate-300 w-12 h-12" />}
                                <div className="absolute top-2 right-2 flex flex-col gap-1">
                                   <button onClick={() => handleOpenProductDialog(p)} className="p-2 bg-white/90 backdrop-blur-md rounded-xl text-primary shadow-sm hover:scale-105 active:scale-95 transition-transform"><Edit size={16} /></button>
                                   <button onClick={() => { setDeleteTarget({id:p.id, type:'product'}); setIsDeleteDialogOpen(true); }} className="p-2 bg-red-500/90 backdrop-blur-md rounded-xl text-white shadow-sm hover:scale-105 active:scale-95 transition-transform"><Trash2 size={16} /></button>
                                </div>
                             </div>
                             <h4 className="font-bold text-lg uppercase mb-2 truncate">{p.title}</h4>
                             <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                                <div className="flex flex-col">
                                   <span className="text-xl font-black text-primary">${p.price}</span>
                                   {p.discountedPrice && <span className="text-[10px] text-muted-foreground line-through opacity-40">${p.discountedPrice}</span>}
                                </div>
                                <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black">{games.find(g => g.id === p.gameId)?.title || "Game"}</Badge>
                             </div>
                          </Card>
                        ))}
                     </div>
                  </TabsContent>

                  <TabsContent value="banners">
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {banners.map(b => (
                          <Card key={b.id} className="aspect-video relative rounded-[2.5rem] overflow-hidden group shadow-xl">
                             <Image src={b.imageUrl} alt="" fill className="object-cover" />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                <Button variant="destructive" size="icon" className="w-12 h-12 rounded-full" onClick={() => { setDeleteTarget({id:b.id, type:'banner'}); setIsDeleteDialogOpen(true); }}><Trash2 size={20}/></Button>
                             </div>
                          </Card>
                        ))}
                        <button onClick={() => setIsBannerDialogOpen(true)} className="aspect-video rounded-[2.5rem] border-4 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-slate-300 hover:text-primary hover:border-primary/40 transition-all bg-white/50 dark:bg-slate-900/50">
                           <ImageIcon size={48} />
                           <span className="font-black uppercase tracking-widest text-sm mt-4">Add New Banner</span>
                        </button>
                     </div>
                  </TabsContent>
               </Tabs>
            </div>
          )}

          {/* User Directory */}
          {activeView === 'users' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-xl md:text-3xl font-headline font-bold text-slate-900 dark:text-white uppercase tracking-tight">User Directory</h3>
                  <div className="relative w-full sm:w-[350px]">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                     <Input placeholder="Search users by name, email, uid..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="pl-12 h-12 rounded-xl dark:bg-slate-900 border-none shadow-sm font-bold" />
                  </div>
               </div>
               <Card className="rounded-2xl md:rounded-[2rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                  <Table>
                     <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                        <TableRow className="border-none">
                           <TableHead className="px-6 font-bold uppercase text-[10px] tracking-widest text-slate-400">Profile</TableHead>
                           <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-400">Email/Phone</TableHead>
                           <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-400">Points</TableHead>
                           <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-400">Role</TableHead>
                           <TableHead className="text-right px-6 font-bold uppercase text-[10px] tracking-widest text-slate-400">Actions</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {filteredUsers.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="h-64 text-center text-slate-300 italic">No users found matching search.</TableCell></TableRow>
                        ) : (
                          filteredUsers.map(u => (
                            <TableRow key={u.uid} className="border-slate-50 dark:border-white/5 hover:bg-slate-50/50 transition-colors">
                               <TableCell className="px-6">
                                  <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative shrink-0 border-2 border-white shadow-sm">
                                        {u.photoURL ? <Image src={u.photoURL} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-black">U</div>}
                                     </div>
                                     <div className="flex flex-col">
                                        <span className="font-bold text-sm">{u.name}</span>
                                        <span className="text-[10px] font-mono opacity-40 uppercase">{u.uid.substring(0,8)}...</span>
                                     </div>
                                  </div>
                               </TableCell>
                               <TableCell>
                                  <div className="flex flex-col">
                                     <span className="text-xs font-medium">{u.email}</span>
                                     <span className="text-[10px] font-black text-primary">{u.phoneNumber || "---"}</span>
                                  </div>
                               </TableCell>
                               <TableCell><Badge className="bg-amber-400 text-white border-none font-black text-[10px] px-3">{u.points || 0} PTS</Badge></TableCell>
                               <TableCell><Badge variant="outline" className="text-[8px] font-black uppercase">{u.role}</Badge></TableCell>
                               <TableCell className="text-right px-6">
                                  <div className="flex justify-end gap-2">
                                     <Button size="icon" variant="ghost" className="h-10 w-10 text-primary rounded-xl" onClick={() => { setSelectedUser(u); setIsUserManageOpen(true); }}><Edit size={16}/></Button>
                                     <Button size="icon" variant="ghost" className="h-10 w-10 text-red-500 rounded-xl" onClick={() => { setDeleteTarget({id:u.uid, type:'user'}); setIsDeleteDialogOpen(true); }}><Trash2 size={16}/></Button>
                                  </div>
                               </TableCell>
                            </TableRow>
                          ))
                        )}
                     </TableBody>
                  </Table>
               </Card>
            </div>
          )}

          {/* Advanced Settings View */}
          {activeView === 'settings' && (
            <div className="max-w-5xl mx-auto space-y-6 sm:space-y-12 pb-20 sm:pb-24">
               <div className="space-y-2">
                  <h2 className="text-2xl md:text-4xl font-headline font-bold uppercase tracking-tight">Advanced Controls</h2>
                  <p className="text-muted-foreground font-medium uppercase text-xs tracking-widest">Fine-tune your store's identity, visibility, and marketplace logic.</p>
               </div>

               <Accordion type="single" collapsible className="space-y-4 sm:space-y-6">
                  {/* Recovery Infrastructure - EmailJS */}
                  <AccordionItem value="emailjs" className="border-none">
                     <Card className="rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                        <AccordionTrigger className="px-4 py-6 sm:px-8 sm:py-8 hover:no-underline">
                           <div className="flex items-center gap-4 text-purple-500">
                              <Mail className="w-6 h-6" />
                              <div className="text-left">
                                 <h4 className="font-headline font-bold text-lg uppercase tracking-tight">Recovery Infrastructure</h4>
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Automated OTP & verification keys</p>
                              </div>
                           </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-6 pt-2 sm:px-8 sm:pb-8 sm:pt-4">
                           <div className="space-y-6 sm:space-y-8">
                              <div className="p-4 sm:p-6 bg-purple-50 dark:bg-purple-950/20 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                                 <p className="text-[11px] sm:text-xs font-medium leading-relaxed flex items-start gap-3 text-purple-700 dark:text-purple-300">
                                    <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                                    These keys allow the application to send password reset codes directly through EmailJS. Ensure your EmailJS account is active and connected to Gmail.
                                 </p>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                 <div className="space-y-4 sm:space-y-6">
                                    <SettingInput label="Service ID" value={emailjsForm.serviceId} onChange={v => setEmailjsForm(f => ({ ...f, serviceId: v }))} placeholder="service_xxxxxxxx" />
                                    <SettingInput label="Template ID" value={emailjsForm.templateId} onChange={v => setEmailjsForm(f => ({ ...f, templateId: v }))} placeholder="template_xxxxxxxx" />
                                 </div>
                                 <div className="space-y-4 sm:space-y-6">
                                    <SettingInput label="Public Key" value={emailjsForm.publicKey} onChange={v => setEmailjsForm(f => ({ ...f, publicKey: v }))} placeholder="xxxxxxxxxxxxxxxxx" />
                                    <div className="pt-2">
                                       <Button onClick={() => updateStoreSettings({ emailjs: emailjsForm }).then(()=>toast({title:"Infrastructure Synced"}))} disabled={isUploading} className="w-full h-12 sm:h-16 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest shadow-2xl bg-purple-600 hover:bg-purple-700">
                                          {isUploading ? <Loader2 className="animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Sync Keys</>}
                                       </Button>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </AccordionContent>
                     </Card>
                  </AccordionItem>

                  {/* Brand Identity */}
                  <AccordionItem value="brand" className="border-none">
                     <Card className="rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                        <AccordionTrigger className="px-4 py-6 sm:px-8 sm:py-8 hover:no-underline group">
                           <div className="flex items-center gap-4 text-primary">
                              <Layout className="w-6 h-6" />
                              <div className="text-left">
                                 <h4 className="font-headline font-bold text-lg uppercase tracking-tight">Brand Identity</h4>
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Logo and visual presence</p>
                              </div>
                           </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-6 pt-2 sm:px-8 sm:pb-8 sm:pt-4">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                              <div className="flex flex-col items-center gap-6 p-10 bg-slate-50 dark:bg-slate-800/40 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-white/10 relative overflow-hidden group">
                                 <div className="w-40 h-40 rounded-[2.5rem] bg-white dark:bg-slate-900 flex items-center justify-center relative overflow-hidden shadow-2xl ring-8 ring-primary/5 transition-transform group-hover:scale-105">
                                    {storeSettings.logo ? <Image src={storeSettings.logo} alt="Logo" fill className="object-contain p-6" unoptimized /> : <div className="text-6xl font-black text-slate-100">O</div>}
                                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logo')} />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase text-center p-6">Click to Change Store Logo</div>
                                 </div>
                              </div>
                              <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                                 <p className="text-xs font-medium leading-relaxed">Your store logo is used for the PWA splash screen, favicon, and email notifications. Use a high-quality square image for best results.</p>
                              </div>
                           </div>
                        </AccordionContent>
                     </Card>
                  </AccordionItem>

                  {/* Maintenance Mode */}
                  <AccordionItem value="maintenance" className="border-none">
                     <Card className="rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                        <AccordionTrigger className="px-4 py-6 sm:px-8 sm:py-8 hover:no-underline">
                           <div className="flex items-center gap-4 text-amber-500">
                              <ShieldAlert className="w-6 h-6" />
                              <div className="text-left">
                                 <h4 className="font-headline font-bold text-lg uppercase tracking-tight">Maintenance Protocol</h4>
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Manage store visibility</p>
                              </div>
                           </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-6 pt-2 sm:px-8 sm:pb-8 sm:pt-4">
                           <div className="space-y-8">
                              <div className="flex items-center justify-between p-8 bg-slate-50 dark:bg-slate-800/40 rounded-[2rem] border-2 border-slate-100 dark:border-white/5">
                                 <div>
                                    <p className="font-bold text-2xl">Force Offline Mode</p>
                                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mt-1">Redirect all non-admin users to maintenance page</p>
                                 </div>
                                 <Switch checked={appStatusForm.offline} onCheckedChange={v => setAppStatusForm(f => ({ ...f, offline: v }))} className="scale-150" />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                 <div className="space-y-6">
                                    <SettingInput label="Maintenance Title" value={appStatusForm.offlineTitle || ''} onChange={v => setAppStatusForm(f => ({ ...f, offlineTitle: v }))} placeholder="Store is currently offline" />
                                    <Textarea placeholder="Maintenance description..." value={appStatusForm.offlineBody || ''} onChange={e => setAppStatusForm(f => ({ ...f, offlineBody: e.target.value }))} className="rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-medium min-h-[150px] p-6 shadow-inner" />
                                    <Button onClick={() => updateStoreSettings({ appStatus: appStatusForm }).then(()=>toast({title:"App Status Saved"}))} className="w-full h-16 rounded-2xl font-black uppercase bg-amber-500 hover:bg-amber-600">Sync Offline Config</Button>
                                 </div>
                                 <div className="relative aspect-video rounded-[2.5rem] bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-white/10 overflow-hidden group flex items-center justify-center">
                                    {appStatusForm.offlineImageUrl ? <Image src={appStatusForm.offlineImageUrl} alt="" fill className="object-cover" unoptimized /> : <div className="text-center opacity-30"><ImageIcon className="w-12 h-12 mx-auto mb-2" /><p className="text-[10px] font-black uppercase">Upload Banner</p></div>}
                                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'offline')} />
                                 </div>
                              </div>
                           </div>
                        </AccordionContent>
                     </Card>
                  </AccordionItem>

                  {/* Economy Settings */}
                  <AccordionItem value="economy" className="border-none">
                     <Card className="rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                        <AccordionTrigger className="px-4 py-6 sm:px-8 sm:py-8 hover:no-underline">
                           <div className="flex items-center gap-4 text-indigo-500">
                              <DollarSign className="w-6 h-6" />
                              <div className="text-left">
                                 <h4 className="font-headline font-bold text-lg uppercase tracking-tight">Marketplace Economy</h4>
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Listing fees and shop revenue logic</p>
                              </div>
                           </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-6 pt-2 sm:px-8 sm:pb-8 sm:pt-4">
                           <div className="space-y-10">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                 <div className="p-8 bg-slate-50 dark:bg-slate-800/40 rounded-[2.5rem] border-2 border-slate-100 dark:border-white/5 space-y-6">
                                    <div className="flex items-center gap-3"><CalendarIcon className="text-indigo-500 w-6 h-6" /><p className="font-bold text-xl uppercase tracking-tight">Weekly Fee</p></div>
                                    <SettingInput label="Amount ($)" type="number" value={feeConfigForm.listingFeeWeekly.toString()} onChange={v => setFeeConfigForm(f => ({ ...f, listingFeeWeekly: parseFloat(v) }))} placeholder="1.00" />
                                 </div>
                                 <div className="p-8 bg-slate-50 dark:bg-slate-800/40 rounded-[2.5rem] border-2 border-slate-100 dark:border-white/5 space-y-6">
                                    <div className="flex items-center gap-3"><CalendarIcon className="text-indigo-500 w-6 h-6" /><p className="font-bold text-xl uppercase tracking-tight">Monthly Fee</p></div>
                                    <SettingInput label="Amount ($)" type="number" value={feeConfigForm.listingFeeMonthly.toString()} onChange={v => setFeeConfigForm(f => ({ ...f, listingFeeMonthly: parseFloat(v) }))} placeholder="3.00" />
                                 </div>
                              </div>
                              <SettingInput label="Admin Payment Number (For Fees)" value={storeSettings.paymentNumber || ''} onChange={e => updateStoreSettings({ paymentNumber: e })} placeholder="613982172" />
                              <Button onClick={() => updateStoreSettings({ config: { ...storeSettings.config, shop: { ...storeSettings.config?.shop, ...feeConfigForm } } }).then(()=>toast({title:"Fees Saved"}))} className="w-full h-16 rounded-2xl font-black uppercase bg-indigo-600 hover:bg-indigo-700">Sync Economy Settings</Button>
                           </div>
                        </AccordionContent>
                     </Card>
                  </AccordionItem>
               </Accordion>
            </div>
          )}
        </main>
      </div>

      {/* Dialogs */}
      <Dialog open={isUserManageOpen} onOpenChange={setIsUserManageOpen}>
        <DialogContent className="max-w-md w-[95%] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900 animate-in zoom-in duration-300">
           <DialogHeader className="sr-only"><DialogTitle>User Management</DialogTitle></DialogHeader>
           <div className="h-32 bg-gradient-to-r from-primary to-blue-600 relative shrink-0">
              <div className="absolute -bottom-12 left-8 group">
                 <div className="w-24 h-24 rounded-3xl border-4 border-white dark:border-slate-900 bg-slate-100 overflow-hidden shadow-2xl relative">
                    {selectedUser?.photoURL ? <Image src={selectedUser.photoURL} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={32} /></div>}
                 </div>
              </div>
           </div>
           <div className="p-8 pt-16 space-y-8">
              <div className="flex justify-between items-start">
                 <div>
                    <h3 className="text-2xl font-headline font-bold tracking-tight">{selectedUser?.name}</h3>
                    <p className="text-xs font-medium text-muted-foreground">{selectedUser?.email}</p>
                 </div>
                 <Badge variant={selectedUser?.banned ? "destructive" : "outline"} className="rounded-lg uppercase text-[8px] font-black tracking-widest px-3 py-1">
                    {selectedUser?.banned ? 'Banned' : 'Active'}
                 </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border dark:border-white/5 shadow-inner">
                    <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Balance</p>
                    <div className="flex items-center gap-2">
                       <Star className="w-4 h-4 text-amber-500" fill="currentColor" />
                       <p className="text-2xl font-headline font-bold">{selectedUser?.points || 0}</p>
                    </div>
                 </div>
                 <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border dark:border-white/5 shadow-inner">
                    <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Role</p>
                    <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase">{selectedUser?.role}</Badge>
                 </div>
              </div>
              <div className="space-y-4">
                 <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Wallet Adjustments</Label>
                 <div className="flex gap-3">
                    <Input type="number" placeholder="Amt" value={pointAdjustment} onChange={e => setPointAdjustment(e.target.value)} className="h-14 rounded-2xl dark:bg-slate-800 border-none shadow-inner font-bold px-6" />
                    <Button onClick={() => handleAdjustPoints('credit')} className="h-14 w-14 rounded-2xl bg-green-500 hover:bg-green-600 shadow-lg shrink-0"><ArrowUpCircle size={24} /></Button>
                    <Button onClick={() => handleAdjustPoints('debit')} className="h-14 w-14 rounded-2xl bg-red-500 hover:bg-red-600 shadow-lg shrink-0"><ArrowDownCircle size={24} /></Button>
                 </div>
              </div>
              <Button variant={selectedUser?.banned ? "default" : "destructive"} onClick={async () => { await manageUser(selectedUser.uid, { banned: !selectedUser.banned }); setSelectedUser({...selectedUser, banned: !selectedUser.banned}); toast({title:selectedUser.banned?"Unbanned":"Banned"}); }} className="w-full h-16 rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl">
                 {selectedUser?.banned ? "Unban User" : "Terminate Account"}
              </Button>
           </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isGameDialogOpen} onOpenChange={setIsGameDialogOpen}>
        <DialogContent className="max-w-md w-[95%] rounded-[2rem] p-8 border-none shadow-2xl bg-white dark:bg-slate-900">
           <DialogHeader><DialogTitle className="text-2xl font-headline font-bold">{editingGame ? 'Edit Collection' : 'New Game Collection'}</DialogTitle></DialogHeader>
           <form onSubmit={handleSaveGame} className="space-y-6 mt-6">
              <div className="flex justify-center mb-4">
                 <div className="relative w-24 h-24 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-white/5 flex items-center justify-center group overflow-hidden">
                    {gameForm.icon ? <Image src={gameForm.icon} alt="" fill className="object-cover" /> : <ImageIcon className="text-slate-300" />}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'game')} />
                 </div>
              </div>
              <SettingInput label="Title" value={gameForm.title} onChange={v => setGameForm({ ...gameForm, title: v })} placeholder="e.g. Free Fire" />
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Category</Label>
                 <Select value={gameForm.category} onValueChange={v => setGameForm({ ...gameForm, category: v as any })}>
                    <SelectTrigger className="h-12 rounded-xl dark:bg-slate-800 border-none"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                       <SelectItem value="top-up" className="p-3 font-bold text-xs">Top-Up Items</SelectItem>
                       <SelectItem value="accounts" className="p-3 font-bold text-xs">Account Marketplace</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
              <Button type="submit" disabled={isUploading} className="w-full h-14 rounded-2xl font-bold shadow-lg uppercase tracking-widest">{isUploading ? <Loader2 className="animate-spin" /> : "Save Collection"}</Button>
           </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-xl w-[95%] rounded-[3rem] p-0 border-none shadow-2xl bg-white dark:bg-slate-900 max-h-[90vh] overflow-y-auto scrollbar-hide">
           <div className="h-2 bg-primary w-full" />
           <DialogHeader className="p-10 pb-0"><DialogTitle className="text-3xl font-headline font-bold uppercase tracking-tight">{editingProduct ? 'Edit Package' : 'New Inventory Package'}</DialogTitle></DialogHeader>
           <form onSubmit={handleSaveProduct} className="p-10 space-y-8">
              <div className="relative w-full aspect-video rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center group overflow-hidden shadow-inner">
                 {productForm.thumbnail ? <Image src={productForm.thumbnail} alt="" fill className="object-cover" unoptimized /> : <><ImageIcon className="text-slate-300 w-12 h-12 mb-2" /><span className="text-[10px] font-black uppercase text-slate-400">Add Media</span></>}
                 <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'product')} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                 <SettingInput label="Package Title" value={productForm.title} onChange={v => setProductForm({ ...productForm, title: v })} placeholder="110 Diamonds" />
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Parent Game</Label>
                    <Select value={productForm.gameId} onValueChange={v => setProductForm({ ...productForm, gameId: v })}>
                       <SelectTrigger className="h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-6 font-bold shadow-inner"><SelectValue placeholder="Select Game" /></SelectTrigger>
                       <SelectContent className="rounded-2xl border-none shadow-2xl z-[200]">
                          {games.filter(g => g.category === 'top-up').map(g => <SelectItem key={g.id} value={g.id} className="p-3 font-bold uppercase text-xs">{g.title}</SelectItem>)}
                       </SelectContent>
                    </Select>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                 <SettingInput label="Standard Price ($)" type="number" value={productForm.price} onChange={v => setProductForm({ ...productForm, price: v })} placeholder="2.99" />
                 <SettingInput label="Discount Price ($)" type="number" value={productForm.discountedPrice} onChange={v => setProductForm({ ...productForm, discountedPrice: v })} placeholder="1.99" />
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Special Handling</Label>
                 <Select value={productForm.category} onValueChange={v => setProductForm({ ...productForm, category: v as any })}>
                    <SelectTrigger className="h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-6 font-bold shadow-inner"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl z-[200]">
                       <SelectItem value="top-up" className="p-3 font-bold text-xs">Standard Delivery</SelectItem>
                       <SelectItem value="booyah-pass" className="p-3 font-bold text-xs">Booyah Pass (Direct WhatsApp)</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
              {productForm.category === 'booyah-pass' && <SettingInput label="Admin WhatsApp for Direct Sale" value={productForm.whatsappNumber || ""} onChange={v => setProductForm({ ...productForm, whatsappNumber: v })} placeholder="252613982172" />}
              <Button type="submit" disabled={isUploading} className="w-full h-20 rounded-[2.5rem] font-black text-xl shadow-2xl uppercase tracking-widest active:scale-95 transition-all">
                {isUploading ? <Loader2 className="animate-spin w-8 h-8" /> : "Save Package"}
              </Button>
           </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEnforceDialogOpen} onOpenChange={setIsEnforceDialogOpen}>
        <DialogContent className="max-w-md w-[95%] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900 animate-in zoom-in duration-300">
           <div className="bg-red-600 p-8 text-white">
              <DialogTitle className="text-2xl font-headline font-bold uppercase tracking-tight">Security Penalty</DialogTitle>
              <p className="text-white/60 text-[10px] font-bold uppercase mt-1">Enforcing policy for Listing #{selectedAccount?.id.toUpperCase()}</p>
           </div>
           <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-3">
                 {['delete', 'holding', 'approved', 'pending'].map(act => (
                   <Button key={act} variant={enforceAction === act ? 'default' : 'outline'} onClick={() => setEnforceAction(act as any)} className={cn("rounded-xl h-12 uppercase font-black text-[9px] tracking-widest", enforceAction === act && act === 'delete' ? 'bg-red-600' : '')}>{act}</Button>
                 ))}
              </div>
              <Textarea value={enforceMessage} onChange={e => setEnforceMessage(e.target.value)} placeholder="Reason for penalty..." className="rounded-2xl dark:bg-slate-800 border-none min-h-[120px] shadow-inner font-medium p-4" />
              <Button onClick={async () => { await enforceAccountAction(selectedAccount!.id, enforceAction, enforceMessage); setIsEnforceDialogOpen(false); setSelectedAccountId(null); setEnforceMessage(""); }} disabled={isSavingStatus || !enforceMessage} className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest shadow-2xl">
                 Apply Enforcement
              </Button>
           </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm rounded-[2rem] p-10 border-none shadow-2xl bg-white dark:bg-slate-900 text-center">
           <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6"><AlertCircle size={40} /></div>
           <DialogTitle className="text-2xl font-headline font-bold">Ma hubtaa?</DialogTitle>
           <DialogDescription className="text-xs uppercase font-black text-slate-400 mt-2">Action cannot be undone.</DialogDescription>
           <div className="flex gap-3 mt-10">
              <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1 rounded-xl h-14 font-bold">Maya</Button>
              <Button variant="destructive" onClick={executeDelete} className="flex-1 rounded-xl h-14 font-black uppercase tracking-widest shadow-lg shadow-red-500/20">Haa, Tirtir</Button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Full Page Order Management View
 */
function OrderDetailView({ order, onBack, onUpdate, status, setStatus, reason, setReason, isSaving }: any) {
  if (!order) return null;
  const item = order.items?.[0];
  const isAccount = item?.gameId === 'accounts' || order.gameId === 'accounts';

  const triggerUssd = () => {
    const template = order.gameDetails?.ussdTemplate || "*712*613982172*$#";
    const code = template.replace('$', order.total.toString().replace('.', '*'));
    window.location.href = `tel:${code.replace(/#/g, '%23')}`;
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20">
       <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="rounded-2xl h-12 gap-2 text-slate-500 font-bold"><ChevronLeft size={20} /> Back to List</Button>
          <div className="h-2 w-2 rounded-full bg-slate-300" />
          <h3 className="font-headline font-bold text-2xl uppercase tracking-tighter text-primary">#{order.id.toUpperCase()}</h3>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
             <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-8 flex items-center justify-between">
                   <div className="flex items-center gap-5">
                      <div className="w-20 h-20 rounded-3xl bg-white dark:bg-slate-900 flex items-center justify-center relative overflow-hidden shadow-md">
                         {item?.thumbnail ? <Image src={item.thumbnail} alt="" fill className="object-cover" /> : <Package className="text-slate-200 w-10 h-10" />}
                      </div>
                      <div>
                         <h4 className="font-headline font-bold text-2xl uppercase">{item?.title || "Game Item"}</h4>
                         <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">{order.paymentMethod}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Total Amount</p>
                      <p className="text-4xl font-headline font-bold text-primary tracking-tighter">${order.total.toFixed(2)}</p>
                   </div>
                </div>
                <div className="p-8 sm:p-10 grid grid-cols-1 sm:grid-cols-2 gap-10">
                   <div className="space-y-6">
                      <DetailRow label="Player Name" value={order.gameDetails?.playerName} icon={User} />
                      <DetailRow label="Game ID / UID" value={order.gameDetails?.playerID} icon={Hash} isMono />
                      <DetailRow label="Contact WA" value={order.gameDetails?.whatsappNumber} icon={MessageCircle} isPrimary />
                   </div>
                   <div className="space-y-6">
                      <DetailRow label="Sender Number" value={order.gameDetails?.senderNumber} icon={CreditCard} isSuccess />
                      <DetailRow label="Created At" value={format(new Date(order.createdAt), 'PPpp')} icon={Clock} />
                      <DetailRow label="Current Status" value={order.status.toUpperCase()} icon={ShieldCheck} isStatus />
                   </div>
                </div>
             </Card>

             <Card className="p-8 sm:p-10 rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 space-y-8">
                <div className="flex items-center gap-4 text-primary">
                   <Smartphone className="w-8 h-8" />
                   <h4 className="font-headline font-bold text-xl uppercase">Verification Helper</h4>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border dark:border-white/5 space-y-4">
                   <p className="text-xs font-bold leading-relaxed text-muted-foreground uppercase tracking-wide">
                      Click the button below to automatically dial the USSD code for this transaction amount on your device to verify payment.
                   </p>
                   <Button onClick={triggerUssd} className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest gap-3 shadow-xl active:scale-95 transition-all">
                      <CreditCard size={20} /> Verify Payment Dial
                   </Button>
                </div>
             </Card>
          </div>

          <div className="space-y-8">
             <Card className="p-8 sm:p-10 rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 space-y-8">
                <h4 className="font-headline font-bold text-xl uppercase tracking-tight text-slate-400">Process Action</h4>
                <div className="space-y-6">
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Update Status</Label>
                      <Select value={status} onValueChange={setStatus}>
                         <SelectTrigger className="h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-6 font-bold shadow-inner focus:ring-primary"><SelectValue /></SelectTrigger>
                         <SelectContent className="rounded-2xl border-none shadow-2xl z-[200]">
                            {['pending', 'processing', 'successful', 'cancelled'].map(s => (
                              <SelectItem key={s} value={s} className="p-4 font-bold uppercase text-xs rounded-xl">{s}</SelectItem>
                            ))}
                         </SelectContent>
                      </Select>
                   </div>

                   {status === 'cancelled' && (
                     <div className="space-y-2 animate-in slide-in-from-top-4">
                        <Label className="text-[10px] font-black uppercase text-red-500 ml-1">Cancellation Reason</Label>
                        <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Payment not verified..." className="rounded-2xl bg-red-50 dark:bg-red-950/20 border-none min-h-[120px] p-6 shadow-inner font-medium text-red-700" />
                     </div>
                   )}

                   <Button onClick={onUpdate} disabled={isSaving} className="w-full h-20 rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-2xl shadow-primary/20 bg-primary hover:bg-primary/90 active:scale-95 transition-all">
                      {isSaving ? <Loader2 className="animate-spin" /> : "Apply Status"}
                   </Button>
                </div>
             </Card>

             <div className="p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] text-center">Protocol V2.0 Secured</p>
             </div>
          </div>
       </div>
    </div>
  );
}

/**
 * Full Page Account Listing Management View
 */
function AccountDetailView({ post, allUsers, onBack, onUpdate, status, setStatus, buyerId, setBuyerId, isSaving, onEnforce }: any) {
  if (!post) return null;
  const buyer = allUsers.find((u: any) => u.uid === buyerId);

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20">
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             <Button variant="ghost" onClick={onBack} className="rounded-2xl h-12 gap-2 text-slate-500 font-bold"><ChevronLeft size={20} /> Marketplace List</Button>
             <div className="h-2 w-2 rounded-full bg-slate-300" />
             <h3 className="font-headline font-bold text-2xl uppercase tracking-tighter text-amber-500">#{post.id.toUpperCase()}</h3>
          </div>
          <Button variant="destructive" onClick={onEnforce} className="rounded-2xl h-12 gap-2 font-black uppercase tracking-widest text-[10px] px-6 shadow-lg shadow-red-500/20">
             <ShieldAlert size={16} /> Penalty Console
          </Button>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
             <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                <div className="aspect-video relative bg-slate-100 dark:bg-slate-800">
                   {post.thumbnailUrl ? <Image src={post.thumbnailUrl} alt="" fill className="object-contain" unoptimized /> : <Gamepad2 className="m-auto absolute inset-0 text-slate-300 w-24 h-24" />}
                   <div className="absolute top-6 right-6 flex flex-col gap-3">
                      <Badge className="bg-primary text-white border-none rounded-2xl px-6 py-2 font-black text-xs uppercase shadow-2xl tracking-widest">Level {post.level}</Badge>
                      <Badge className="bg-white/90 backdrop-blur-md text-slate-900 border-none rounded-2xl px-6 py-2 font-black text-xs uppercase shadow-2xl tracking-widest">{post.gameType}</Badge>
                   </div>
                </div>
                <div className="p-8 sm:p-12 space-y-10">
                   <div className="flex justify-between items-end">
                      <div className="flex items-center gap-5">
                         <div className="w-20 h-20 rounded-full border-4 border-white shadow-xl overflow-hidden relative bg-slate-50">
                            {post.authorAvatar ? <Image src={post.authorAvatar} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-200">U</div>}
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seller Profile</p>
                            <h4 className="text-3xl font-headline font-bold uppercase tracking-tight">{post.authorName}</h4>
                            <p className="text-xs font-black text-primary uppercase mt-1">{post.phone}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Asking Price</p>
                         <p className="text-6xl font-headline font-bold text-primary tracking-tighter">${post.price.toFixed(2)}</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 pt-10 border-t dark:border-white/5">
                      <AssetStat icon={Sword} label="Evo Guns" value={post.evoWeapons} />
                      <AssetStat icon={TargetIcon} label="Weapons" value={post.totalWeapons || post.internalWeapons} />
                      <AssetStat icon={Zap} label="Emotes" value={post.emotes} />
                      <AssetStat icon={Bomb} label="Execution" value={post.executionEmotes} />
                      <AssetStat icon={Star} label="Arrival" value={post.arrivalEmotes} />
                      <AssetStat icon={ShoppingBag} label="Dharka" value={post.dharka} />
                   </div>
                </div>
             </Card>
          </div>

          <div className="space-y-8">
             <Card className="p-8 sm:p-10 rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 space-y-8">
                <h4 className="font-headline font-bold text-xl uppercase tracking-tight text-slate-400">Moderation Hub</h4>
                <div className="space-y-6">
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Change Visibility</Label>
                      <Select value={status} onValueChange={setStatus}>
                         <SelectTrigger className="h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-6 font-bold shadow-inner"><SelectValue /></SelectTrigger>
                         <SelectContent className="rounded-2xl border-none shadow-2xl z-[200]">
                            {['pending', 'approved', 'holding', 'sold', 'rejected'].map(s => (
                              <SelectItem key={s} value={s} className="p-4 font-bold uppercase text-xs rounded-xl">{s}</SelectItem>
                            ))}
                         </SelectContent>
                      </Select>
                   </div>

                   {status === 'sold' && (
                     <div className="space-y-4 animate-in slide-in-from-top-4">
                        <Label className="text-[10px] font-black uppercase text-green-500 ml-1">Assign Success Buyer</Label>
                        <Select value={buyerId} onValueChange={setBuyerId}>
                           <SelectTrigger className="h-16 rounded-2xl bg-green-50 dark:bg-green-500/10 border-none px-6 font-bold shadow-inner focus:ring-green-500"><SelectValue placeholder="Select Buyer" /></SelectTrigger>
                           <SelectContent className="rounded-2xl border-none shadow-2xl z-[200]">
                              {allUsers.map((u: any) => <SelectItem key={u.uid} value={u.uid} className="p-4 font-bold text-xs rounded-xl">{u.name} ({u.email.substring(0,8)}...)</SelectItem>)}
                           </SelectContent>
                        </Select>
                        {buyer && (
                          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border-2 border-green-500/20 flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-slate-50 relative overflow-hidden">{buyer.photoURL && <Image src={buyer.photoURL} alt="" fill className="object-cover" />}</div>
                             <div className="min-w-0"><p className="text-xs font-bold truncate">{buyer.name}</p><p className="text-[9px] font-black text-primary uppercase">{buyer.phoneNumber}</p></div>
                          </div>
                        )}
                     </div>
                   )}

                   <Button onClick={onUpdate} disabled={isSaving} className="w-full h-20 rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-2xl shadow-primary/20 bg-primary hover:bg-primary/90 active:scale-95 transition-all">
                      {isSaving ? <Loader2 className="animate-spin" /> : "Sync Changes"}
                   </Button>
                </div>
             </Card>

             <Card className="p-8 rounded-[2.5rem] bg-slate-900 text-white border-none shadow-xl space-y-6">
                <div className="flex items-center gap-3 text-amber-500">
                   <Clock size={24} />
                   <h4 className="font-headline font-bold text-lg uppercase">Auto Expiry</h4>
                </div>
                <div className="p-6 bg-white/5 rounded-3xl space-y-2">
                   <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Time Remaining</p>
                   <CountdownDisplay expiresAt={post.expiresAt} status={post.status} />
                   <p className="text-[9px] font-bold text-white/60 italic pt-2">Listing will be hidden from market automatically after duration ends.</p>
                </div>
             </Card>
          </div>
       </div>
    </div>
  );
}

// Helper Components
function SideNavItem({ active, expanded, onClick, icon: Icon, label, className, badge }: { active: boolean, expanded: boolean, onClick: () => void, icon: any, label: string, className?: string, badge?: number }) {
  return (
    <button onClick={onClick} className={cn("w-full h-12 flex items-center transition-all duration-300 rounded-xl relative group", active ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800", expanded ? "px-4 gap-4" : "justify-center", className)}>
      <Icon size={20} className={cn("shrink-0 transition-transform group-hover:scale-110", active ? "stroke-[2.5px]" : "")} />
      {expanded && <span className="font-bold text-[13px] uppercase tracking-wider whitespace-nowrap overflow-hidden flex-1 text-left">{label}</span>}
      {badge !== undefined && badge > 0 && <span className={cn("bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center transition-all", expanded ? "px-2.5 py-0.5" : "absolute top-1 right-1 w-4 h-4")}>{badge}</span>}
    </button>
  );
}

function StatCard({ label, value, icon: Icon, color, bgColor, pulse }: { label: string, value: string, icon: any, color: string, bgColor: string, pulse?: boolean }) {
  return (
    <Card className="rounded-[2rem] p-6 sm:p-8 border-none shadow-lg bg-white dark:bg-slate-900 group hover:-translate-y-1 transition-all">
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm transition-transform group-hover:scale-110 relative", bgColor, color)}>
         <Icon size={28} />
         {pulse && <div className="absolute inset-0 bg-inherit rounded-2xl animate-ping opacity-20" />}
      </div>
      <h3 className="text-3xl font-headline font-bold text-slate-900 dark:text-white mb-1 truncate">{value}</h3>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    processing: "bg-blue-100 text-blue-700",
    successful: "bg-green-100 text-green-700",
    approved: "bg-green-100 text-green-700",
    holding: "bg-indigo-100 text-indigo-700",
    cancelled: "bg-red-100 text-red-700",
    rejected: "bg-red-100 text-red-700",
    sold: "bg-slate-900 text-white"
  };
  return <Badge className={cn("rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-widest border-none", colors[status] || colors.pending)}>{status}</Badge>;
}

function DetailRow({ label, value, icon: Icon, isMono, isPrimary, isSuccess, isStatus }: any) {
  return (
    <div className="space-y-1">
       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Icon size={12} /> {label}</p>
       <p className={cn(
         "text-sm font-bold truncate",
         isMono && "font-mono text-xs",
         isPrimary && "text-primary",
         isSuccess && "text-green-600",
         isStatus && "text-indigo-600"
       )}>{value || "---"}</p>
    </div>
  );
}

function AssetStat({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-center gap-3">
       <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary shadow-sm"><Icon size={18} /></div>
       <div className="min-w-0">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-0.5">{label}</p>
          <p className="text-base font-bold text-slate-900 dark:text-white leading-none">{value || 0}</p>
       </div>
    </div>
  );
}

function SettingInput({ label, value, onChange, placeholder, type = "text" }: { label: string, value: string, onChange: (v: string) => void, placeholder: string, type?: string }) {
  return (
    <div className="space-y-2">
       <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">{label}</Label>
       <Input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} className="h-16 rounded-2xl border-none bg-slate-50 dark:bg-slate-800 font-bold px-6 shadow-inner text-sm md:text-lg focus:ring-primary transition-all" />
    </div>
  );
}
