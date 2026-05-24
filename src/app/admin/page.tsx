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
  LayoutGrid,
  Target as TargetIcon,
  Copy,
  ArrowLeft,
  Link as LinkIcon,
  PlusCircle,
  PencilLine,
  ImagePlus,
  Type,
  ExternalLink,
  Wallet,
  AlertTriangle,
  Ticket
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
import { format, formatDistanceToNow, subDays, startOfDay, isSameDay } from "date-fns";

/**
 * High-Fidelity Marketplace Countdown
 * Correctly calculates 7 days for Weekly and 30 days for Monthly terms.
 */
function MarketplaceExpiration({ expiresAt, status }: { expiresAt?: number, status: string }) {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0 });

  useEffect(() => {
    if (!expiresAt || status === 'sold') return;
    
    const update = () => {
      const now = Date.now();
      const diff = expiresAt - now;
      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0 });
      } else {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60));
        const m = Math.floor((diff % (1000 * 60)) / (1000 * 60));
        setTimeLeft({ d, h, m });
      }
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [expiresAt, status]);

  if (status === 'sold') return <Badge className="bg-slate-100 text-slate-400 border-none text-[8px] font-black uppercase">SOLD</Badge>;
  if (!expiresAt) return <span className="text-[10px] text-slate-300 italic font-medium uppercase">Awaiting Live</span>;

  return (
    <div className="flex flex-col items-start text-left">
      <span className="text-[11px] font-black text-primary uppercase tracking-tight">
        {timeLeft.d}D {timeLeft.h}H {timeLeft.m}M
      </span>
      <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">
        ENDS {format(new Date(expiresAt), "MMM d").toUpperCase()}
      </span>
    </div>
  );
}

/**
 * Wait Time Helper
 * Tracks responsiveness of seller since earliest buyer claim.
 */
function WaitTime({ post }: { post: any }) {
  const [elapsed, setElapsed] = useState("None");
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const claimants = Object.values(post.claimants || {});
    // Use the earliest claim timestamp as the start of the wait period
    const claimTime = claimants.length > 0 ? Math.min(...claimants.map((c: any) => c.timestamp)) : null;
    
    if (!claimTime || post.sold) {
      setElapsed("None");
      setIsUrgent(false);
      return;
    }

    const update = () => {
      const diff = Date.now() - claimTime;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setElapsed(`${h}h ${m}m`);
      // If wait time is >= 24 hours and seller hasn't responded, flag as urgent
      setIsUrgent(h >= 24 && !post.sellerReported);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [post]);

  return (
    <div className="flex items-center gap-2">
      <span className={cn(
        "text-[10px] font-bold", 
        elapsed === "None" ? "text-slate-200 italic" : isUrgent ? "text-red-500" : "text-slate-500"
      )}>
        {elapsed}
      </span>
      {isUrgent && <AlertTriangle size={12} className="text-red-500 animate-pulse" />}
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
    promoCodes,
    savePromoCode,
    deletePromoCode,
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
  const [activeView, setActiveTab] = useState<'dashboard' | 'orders' | 'inventory' | 'account-posts' | 'events' | 'users' | 'settings' | 'promo-codes'>('dashboard');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Detail Selection States (Full Page)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Expansion States
  const [expandedGameId, setExpandedGameId] = useState<string | null>(null);

  // Search States
  const [userSearch, setUserSearch] = useState("");

  // Dialog States
  const [isGameDialogOpen, setIsGameDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isBannerDialogOpen, setIsBannerDialogOpen] = useState(false);
  const [isPaymentMethodDialogOpen, setIsPaymentMethodDialogOpen] = useState(false);
  const [isPromoDialogOpen, setIsPromoDialogOpen] = useState(false);
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
  const [promoForm, setPromoForm] = useState({ code: "", discount: "", duration: "", durationUnit: "days" });
  
  // Settings Form States
  const [brandForm, setBrandForm] = useState({ announcementTicker: "", isLive: false, logo: "" });
  const [economyForm, setEconomyForm] = useState({ paymentNumber: "", listingFeeWeekly: 1.00, listingFeeMonthly: 3.00 });
  const [helpLinksForm, setHelpLinksForm] = useState({ tutorialUrl: "", whatsappNumber: "", tiktokUrl: "" });
  const [appStatusForm, setAppStatusForm] = useState({ offline: false, offlineTitle: "", offlineBody: "", offlineImageUrl: "" });
  const [termsForm, setTermsForm] = useState({ en: "", so: "" });
  const [emailjsForm, setEmailjsForm] = useState({ serviceId: "", templateId: "", publicKey: "" });

  const [pointAdjustment, setPointAdjustment] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!loading && !user?.isAdmin) router.replace('/');
  }, [user, loading, router]);

  useEffect(() => {
    if (storeSettings) {
      setBrandForm({
        announcementTicker: storeSettings.announcementTicker || "",
        isLive: storeSettings.isLive || false,
        logo: storeSettings.logo || ""
      });
      setEconomyForm({
        paymentNumber: storeSettings.paymentNumber || "",
        listingFeeWeekly: storeSettings.config?.shop?.listingFeeWeekly || 1.00,
        listingFeeMonthly: storeSettings.config?.shop?.listingFeeMonthly || 3.00
      });
      setHelpLinksForm(storeSettings.helpLinks || { tutorialUrl: "", whatsappNumber: "", tiktokUrl: "" });
      setAppStatusForm(storeSettings.appStatus || { offline: false, offlineTitle: "", offlineBody: "", offlineImageUrl: "" });
      setTermsForm(storeSettings.termsAndConditions || { en: "", so: "" });
      setEmailjsForm(storeSettings.emailjs || { serviceId: "", templateId: "", publicKey: "" });
    }
  }, [storeSettings]);

  // Live Performance Chart Data
  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      return {
        date: d,
        label: format(d, 'EEE'),
        v: 0
      };
    });

    allOrders
      .filter(o => o.status === 'successful')
      .forEach(order => {
        const orderDate = new Date(order.createdAt);
        const dayMatch = last7Days.find(d => isSameDay(d.date, orderDate));
        if (dayMatch) {
          dayMatch.v += order.total;
        }
      });

    return last7Days.map(d => ({ day: d.label, v: d.v }));
  }, [allOrders]);

  const selectedOrder = useMemo(() => allOrders.find(o => o.id === selectedOrderId), [selectedOrderId, allOrders]);
  const selectedAccount = useMemo(() => accountPosts.find(p => p.id === selectedAccountId), [selectedAccountId, accountPosts]);

  // Orders View Specific - Only Top Up Items
  const topUpOrders = useMemo(() => allOrders.filter(o => !o.gameDetails?.postId), [allOrders]);

  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => 
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phoneNumber?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.uid?.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [allUsers, userSearch]);

  const paymentMethods = useMemo(() => {
    if (!storeSettings?.paymentMethods) return [];
    return Object.entries(storeSettings.paymentMethods).map(([id, m]: any) => ({ ...m, id }));
  }, [storeSettings?.paymentMethods]);

  // Actions
  const handleOpenGameDialog = (game?: any) => {
    setEditingGame(game || null);
    setGameForm(game ? { title: game.title, icon: game.icon || "", category: game.category } : { title: "", icon: "", category: "top-up" });
    setIsGameDialogOpen(true);
  };

  const handleOpenProductDialog = (p?: any, gameId?: string) => {
    setEditingProduct(p || null);
    setProductForm(p ? { ...p, price: p.price.toString(), discountedPrice: p.discountedPrice?.toString() || "" } : { title: "", gameId: gameId || "", category: "top-up", description: "", price: "", discountedPrice: "", thumbnail: "", whatsappNumber: "" });
    setIsProductDialogOpen(true);
  };

  const handleOpenPaymentMethodDialog = (m?: any) => {
    setEditingPaymentMethod(m || null);
    setPaymentMethodForm(m ? { name: m.name, icon: m.icon || "", ussdTemplate: m.ussdTemplate || "", active: m.active } : { name: "", icon: "", ussdTemplate: "", active: true });
    setIsPaymentMethodDialogOpen(true);
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

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      await saveEvent({ ...eventForm, id: editingEvent?.id });
      setIsEventDialogOpen(false);
      toast({ title: "Event Saved" });
    } finally { setIsUploading(false); }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      await saveBanner({ ...bannerForm });
      setIsBannerDialogOpen(false);
      toast({ title: "Banner Added" });
    } finally { setIsUploading(false); }
  };

  const handleSavePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await savePaymentMethod({ ...paymentMethodForm, id: editingPaymentMethod?.id });
      setIsPaymentMethodDialogOpen(false);
    } catch (err) {}
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoForm.code || !promoForm.discount || !promoForm.duration) return;
    
    const now = Date.now();
    let durationMs = parseInt(promoForm.duration);
    const unit = promoForm.durationUnit;
    
    if (unit === 'minutes') durationMs *= 60000;
    else if (unit === 'hours') durationMs *= 3600000;
    else if (unit === 'days') durationMs *= 86400000;
    else if (unit === 'months') durationMs *= 2592000000;
    else if (unit === 'years') durationMs *= 31536000000;

    const expiresAt = now + durationMs;

    await savePromoCode({
      code: promoForm.code.trim().toUpperCase(),
      discount: parseInt(promoForm.discount),
      expiresAt,
      claimed: false,
      usedBy: null,
      expired: false
    });

    setIsPromoDialogOpen(false);
    setPromoForm({ code: "", discount: "", duration: "", durationUnit: "days" });
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
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'order') await deleteOrder(deleteTarget.id);
      if (deleteTarget.type === 'account') await deleteAccountPost(deleteTarget.id);
      if (deleteTarget.type === 'game') await deleteGame(deleteTarget.id);
      if (deleteTarget.type === 'product') await deleteProduct(deleteTarget.id);
      if (deleteTarget.type === 'user') await deleteUserFn(deleteTarget.id);
      if (deleteTarget.type === 'event') await deleteEvent(deleteTarget.id);
      if (deleteTarget.type === 'banner') await deleteBanner(deleteTarget.id);
      if (deleteTarget.type === 'paymentMethod') await deletePaymentMethod(deleteTarget.id);
      if (deleteTarget.type === 'promoCode') await deletePromoCode(deleteTarget.id);
      toast({ title: "Deleted Successfully" });
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast({ title: "Failed to delete from database", variant: "destructive" });
    } finally { 
      setDeleteTarget(null); 
      setIsDeleting(false);
    }
  };

  const handleImageUpload = async (file: File, target: string) => {
    setIsUploading(true);
    try {
      const url = await uploadToImgbb(file);
      if (target === 'game') setGameForm(f => ({ ...f, icon: url }));
      if (target === 'product') setProductForm(f => ({ ...f, thumbnail: url }));
      if (target === 'event') setEventForm(f => ({ ...f, thumbnailUrl: url }));
      if (target === 'banner') setBannerForm(f => ({ ...f, imageUrl: url }));
      if (target === 'logo') setBrandForm(f => ({ ...f, logo: url }));
      if (target === 'offlineImage') setAppStatusForm(f => ({ ...f, offlineImageUrl: url }));
      if (target === 'paymentIcon') setPaymentMethodForm(f => ({ ...f, icon: url }));
      toast({ title: "Media Uploaded" });
    } finally { setIsUploading(false); }
  };

  const syncEconomySettings = async () => {
    await updateStoreSettings({
      paymentNumber: economyForm.paymentNumber,
      config: {
        ...storeSettings.config,
        shop: {
          ...storeSettings.config?.shop,
          listingFeeWeekly: parseFloat(economyForm.listingFeeWeekly.toString()),
          listingFeeMonthly: parseFloat(economyForm.listingFeeMonthly.toString())
        }
      }
    });
    toast({ title: "Economy settings updated" });
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
        <SideNavItem icon={LayoutDashboard} label="Dashboard" active={activeView === 'dashboard'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveTab('dashboard'); setSelectedOrderId(null); setSelectedAccountId(null); setIsMobileMenuOpen(false); }} />
        <SideNavItem icon={ShoppingBag} label="Orders" active={activeView === 'orders'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveTab('orders'); setSelectedOrderId(null); setIsMobileMenuOpen(false); }} badge={topUpOrders.filter(o => o.status === 'pending').length} />
        <SideNavItem icon={Gamepad2} label="Marketplace" active={activeView === 'account-posts'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveTab('account-posts'); setSelectedAccountId(null); setIsMobileMenuOpen(false); }} badge={accountPosts.filter(p => p.status === 'pending').length} />
        <SideNavItem icon={Box} label="Inventory" active={activeView === 'inventory'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveTab('inventory'); setIsMobileMenuOpen(false); }} />
        <SideNavItem icon={Megaphone} label="Live Events" active={activeView === 'events'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveTab('events'); setIsMobileMenuOpen(false); }} />
        <SideNavItem icon={Ticket} label="Promo Codes" active={activeView === 'promo-codes'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveTab('promo-codes'); setIsMobileMenuOpen(false); }} />
        <SideNavItem icon={Users} label="Users" active={activeView === 'users'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }} />
        <SideNavItem icon={SettingsIcon} label="Settings" active={activeView === 'settings'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }} />
      </nav>
      <div className="p-4 border-t dark:border-white/5">
        <button onClick={logout} className="w-full h-12 flex items-center gap-4 text-red-500 rounded-xl hover:bg-red-950/20 px-4 font-bold text-sm">
          <LogOut size={20} /> {(isSidebarExpanded || isMobile) && "Logout"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={cn("hidden md:flex h-screen bg-white dark:bg-slate-900 border-r dark:border-white/5 flex-col transition-all duration-300 z-40 shadow-sm", isSidebarExpanded ? "w-64" : "w-20")}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-72 bg-white dark:bg-slate-900 border-none">
          <SheetHeader className="sr-only">
             <SheetTitle>Admin Menu</SheetTitle>
          </SheetHeader>
          <SidebarContent isMobile={true} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Header */}
        <header className="h-16 md:h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b dark:border-white/5 flex items-center justify-between px-4 sm:px-10 shrink-0 z-30">
          <div className="flex items-center gap-4">
             <button className="md:hidden p-2 text-slate-500 rounded-xl hover:bg-slate-50" onClick={() => setIsMobileMenuOpen(true)}><Menu size={24} /></button>
             <h2 className="text-base sm:text-xl font-headline font-bold uppercase tracking-tight text-slate-900 dark:text-white truncate">
               {selectedOrderId ? "Order Insight" : selectedAccountId ? "Listing Hub" : activeView.toUpperCase().replace('-', ' ')}
             </h2>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex items-center gap-2 bg-green-50 dark:bg-green-500/10 px-4 py-1.5 rounded-full text-green-600 font-bold text-[10px] uppercase tracking-widest border border-green-100 dark:border-green-500/20">
                <RefreshCw size={12} className="animate-spin" /> Live
             </div>
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
                     <AreaChart data={chartData}>
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
                   onDelete={() => { setDeleteTarget({id: selectedOrderId, type:'order'}); setIsDeleteDialogOpen(true); }}
                 />
               ) : (
                 <div className="space-y-8">
                    {/* Mobile Card List */}
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                       {topUpOrders.length === 0 ? (
                         <div className="py-20 text-center opacity-30 italic text-xs font-bold uppercase">No orders found.</div>
                       ) : (
                         topUpOrders.map(o => (
                           <Card key={o.id} className="p-5 rounded-[2rem] border-none shadow-lg bg-white dark:bg-slate-900 space-y-4">
                              <div className="flex items-center justify-between">
                                 <p className="font-headline font-bold text-sm text-primary uppercase tracking-tight">#{o.id.toUpperCase()}</p>
                                 <StatusBadge status={o.status} />
                              </div>
                              <div className="space-y-1">
                                 <p className="font-bold text-base text-slate-900 dark:text-white truncate">{o.gameDetails?.playerName || "Guest"}</p>
                                 <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tight">{o.items?.[0]?.title || "Unknown Item"}</p>
                              </div>
                              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border dark:border-white/5 flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 overflow-hidden relative shrink-0 shadow-sm border border-gray-100">
                                    {o.processedBy?.photoURL ? <Image src={o.processedBy.photoURL} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={14}/></div>}
                                 </div>
                                 <div className="min-w-0">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Handling Admin</p>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{o.processedBy?.name || "Unassigned"}</p>
                                 </div>
                              </div>
                              <div className="flex gap-2 pt-2 border-t dark:border-white/5">
                                 <button 
                                   onClick={() => { setSelectedOrderId(o.id); setPendingStatus(o.status); setCancellationReason(o.cancellationReason || ""); }}
                                   className="flex-1 h-12 bg-primary text-white rounded-xl flex items-center justify-center font-bold text-xs gap-2 active:scale-95 transition-transform"
                                 >
                                   <Eye size={16} /> View Insight
                                 </button>
                                 <button 
                                   onClick={() => { setDeleteTarget({id:o.id, type:'order'}); setIsDeleteDialogOpen(true); }}
                                   className="w-12 h-12 text-red-500 bg-red-50 dark:bg-red-950/20 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
                                 >
                                   <Trash2 size={16} />
                                 </button>
                              </div>
                           </Card>
                         ))
                       )}
                    </div>

                    {/* Desktop Table View */}
                    <Card className="hidden md:block rounded-[3rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
                       <Table>
                          <TableHeader className="bg-slate-50/50 dark:bg-slate-800/20">
                             <TableRow className="border-none h-16">
                                <TableHead className="px-10 font-bold uppercase text-[11px] tracking-widest text-slate-400">Reference</TableHead>
                                <TableHead className="font-bold uppercase text-[11px] tracking-widest text-slate-400">Player & Item</TableHead>
                                <TableHead className="font-bold uppercase text-[11px] tracking-widest text-slate-400">Admin Handling</TableHead>
                                <TableHead className="font-bold uppercase text-[11px] tracking-widest text-slate-400">Status</TableHead>
                                <TableHead className="text-right px-10 font-bold uppercase text-[11px] tracking-widest text-slate-400">Actions</TableHead>
                             </TableRow>
                          </TableHeader>
                          <TableBody>
                             {topUpOrders.length === 0 ? (
                               <TableRow><TableCell colSpan={5} className="h-64 text-center text-slate-300 italic uppercase font-bold text-xs">No orders found.</TableCell></TableRow>
                             ) : (
                               topUpOrders.map(o => (
                                 <TableRow key={o.id} className="border-slate-50 dark:border-white/5 h-24 hover:bg-slate-50/30 transition-colors">
                                    <TableCell className="px-10 font-headline font-bold text-sm text-primary">#{o.id.toUpperCase()}</TableCell>
                                    <TableCell>
                                       <div className="flex flex-col">
                                          <span className="font-bold text-base text-slate-900 dark:text-white">{o.gameDetails?.playerName || "Guest"}</span>
                                          <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tight">{o.items?.[0]?.title || "Unknown Item"}</span>
                                       </div>
                                    </TableCell>
                                    <TableCell>
                                       <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative border-2 border-white shadow-sm shrink-0">
                                             {o.processedBy?.photoURL ? <Image src={o.processedBy.photoURL} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={14} /></div>}
                                          </div>
                                          <span className={cn("text-xs font-bold", o.processedBy ? "text-slate-500" : "text-slate-300 italic")}>
                                            {o.processedBy?.name || "Unassigned"}
                                          </span>
                                       </div>
                                    </TableCell>
                                    <TableCell><StatusBadge status={o.status} /></TableCell>
                                    <TableCell className="text-right px-10">
                                       <div className="flex justify-end items-center gap-3">
                                          <button 
                                            onClick={() => { setSelectedOrderId(o.id); setPendingStatus(o.status); setCancellationReason(o.cancellationReason || ""); }}
                                            className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 active:scale-90 transition-transform"
                                          >
                                            <Eye size={18} />
                                          </button>
                                          <button 
                                            onClick={() => { setDeleteTarget({id:o.id, type:'order'}); setIsDeleteDialogOpen(true); }}
                                            className="w-10 h-10 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl flex items-center justify-center transition-colors"
                                          >
                                            <Trash2 size={18} />
                                          </button>
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
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
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
                   onDelete={() => { setDeleteTarget({id:selectedAccountId, type:'account'}); setIsDeleteDialogOpen(true); }}
                   onEnforce={() => setIsEnforceDialogOpen(true)}
                 />
               ) : (
                 <div className="space-y-10">
                    {/* Mobile View: Cards */}
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                       {accountPosts.length === 0 ? (
                         <div className="py-20 text-center opacity-30 italic text-xs font-bold uppercase">No account listings found.</div>
                       ) : (
                         accountPosts.map(p => {
                           const claimantsList = Object.values(p.claimants || {});
                           const earliestClaim = claimantsList.length > 0 ? Math.min(...claimantsList.map((c: any) => c.timestamp)) : null;
                           const isOverdue = earliestClaim && (Date.now() - earliestClaim) >= 86400000 && !p.sellerReported && !p.sold;

                           return (
                             <Card 
                               key={p.id} 
                               className={cn(
                                 "p-5 rounded-[2rem] border-none shadow-lg bg-white dark:bg-slate-900 space-y-5 transition-all",
                                 isOverdue && "ring-2 ring-red-500/50 bg-red-50/50"
                               )}
                             >
                                <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative shrink-0 shadow-sm border border-white">
                                         {p.authorAvatar ? <Image src={p.authorAvatar} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><User size={16}/></div>}
                                      </div>
                                      <span className="font-bold text-sm text-slate-900 dark:text-white truncate">{p.authorName || "Market User"}</span>
                                   </div>
                                   <StatusBadge status={p.status} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                   <div className="space-y-1">
                                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Game Type</p>
                                      <p className="font-bold text-xs uppercase">{p.gameType} - LV {p.level}</p>
                                   </div>
                                   <div className="space-y-1">
                                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pricing</p>
                                      <p className="font-bold text-xs text-primary">${p.price}</p>
                                   </div>
                                </div>

                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border dark:border-white/5 grid grid-cols-2 gap-4">
                                   <div className="space-y-1">
                                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Claims</p>
                                      <Badge className="bg-green-100 text-green-700 border-none text-[8px] font-black px-3">{claimantsList.length} Active</Badge>
                                   </div>
                                   <div className="space-y-1">
                                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Wait Time</p>
                                      <WaitTime post={p} />
                                   </div>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t dark:border-white/5">
                                   <MarketplaceExpiration expiresAt={p.expiresAt} status={p.status} />
                                   <div className="flex gap-2">
                                      <button 
                                        onClick={() => { setSelectedAccountId(p.id); setPendingAccountStatus(p.status); setAssignBuyerId(p.boughtBy || ""); }}
                                        className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-md active:scale-90 transition-transform"
                                      >
                                        <Eye size={18} />
                                      </button>
                                      <button 
                                        onClick={() => { setDeleteTarget({id:p.id, type:'account'}); setIsDeleteDialogOpen(true); }}
                                        className="w-10 h-10 text-red-500 bg-red-50 dark:bg-red-950/20 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                   </div>
                                </div>
                             </Card>
                           );
                         })
                       )}
                    </div>

                    {/* Desktop View: Table */}
                    <Card className="hidden md:block rounded-[3rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
                       <Table>
                          <TableHeader className="bg-slate-50/50 dark:bg-slate-800/20">
                             <TableRow className="border-none h-16">
                                <TableHead className="px-10 font-bold uppercase text-[11px] tracking-widest text-slate-400">Seller Info</TableHead>
                                <TableHead className="font-bold uppercase text-[11px] tracking-widest text-slate-400">Game Info</TableHead>
                                <TableHead className="font-bold uppercase text-[11px] tracking-widest text-slate-400">Active Claims</TableHead>
                                <TableHead className="font-bold uppercase text-[11px] tracking-widest text-slate-400">Admin Handling</TableHead>
                                <TableHead className="font-bold uppercase text-[11px] tracking-widest text-slate-400">Wait Time</TableHead>
                                <TableHead className="font-bold uppercase text-[11px] tracking-widest text-slate-400">Expiration</TableHead>
                                <TableHead className="font-bold uppercase text-[11px] tracking-widest text-slate-400">Status</TableHead>
                                <TableHead className="text-right px-10 font-bold uppercase text-[11px] tracking-widest text-slate-400">Actions</TableHead>
                             </TableRow>
                          </TableHeader>
                          <TableBody>
                             {accountPosts.length === 0 ? (
                               <TableRow><TableCell colSpan={8} className="h-64 text-center text-slate-300 italic uppercase font-bold text-xs">No account listings found.</TableCell></TableRow>
                             ) : (
                               accountPosts.map(p => {
                                 const claimantsList = Object.values(p.claimants || {});
                                 const earliestClaim = claimantsList.length > 0 ? Math.min(...claimantsList.map((c: any) => c.timestamp)) : null;
                                 const isOverdue = earliestClaim && (Date.now() - earliestClaim) >= 86400000 && !p.sellerReported && !p.sold;

                                 return (
                                 <TableRow 
                                    key={p.id} 
                                    className={cn(
                                      "border-slate-50 dark:border-white/5 h-24 transition-colors",
                                      isOverdue ? "bg-red-50/50 dark:bg-red-500/5" : "hover:bg-slate-50/50"
                                    )}
                                 >
                                    <TableCell className="px-10">
                                       <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative shrink-0 shadow-sm border border-white dark:border-white/10">
                                             {p.authorAvatar ? <Image src={p.authorAvatar} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><User size={16}/></div>}
                                          </div>
                                          <span className="font-bold text-sm text-slate-900 dark:text-white truncate">{p.authorName || "Market User"}</span>
                                       </div>
                                    </TableCell>
                                    <TableCell>
                                       <div className="flex flex-col">
                                         <span className="font-bold text-sm text-slate-900 dark:text-white uppercase truncate">{p.gameType} - LV {p.level}</span>
                                         <span className="text-[10px] text-muted-foreground font-medium">${p.price}</span>
                                       </div>
                                    </TableCell>
                                    <TableCell>
                                       <div className="flex items-center gap-2">
                                          <Badge className={cn(
                                            "rounded-full px-4 py-1 text-[8px] font-black uppercase tracking-widest border-none",
                                            claimantsList.length > 0 ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"
                                          )}>
                                            {claimantsList.length} Claims
                                          </Badge>
                                          {isOverdue && <Badge className="bg-red-500 text-white border-none text-[8px] font-black uppercase">STALLING</Badge>}
                                       </div>
                                    </TableCell>
                                    <TableCell>
                                       <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative border-2 border-white shadow-sm shrink-0">
                                             {p.processedBy?.photoURL ? <Image src={p.processedBy.photoURL} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-black">O</div>}
                                          </div>
                                          <span className={cn("text-xs font-bold", p.processedBy ? "text-slate-500" : "text-slate-300 italic")}>
                                            {p.processedBy?.name || "Unassigned"}
                                          </span>
                                       </div>
                                    </TableCell>
                                    <TableCell><WaitTime post={p} /></TableCell>
                                    <TableCell>
                                       <MarketplaceExpiration expiresAt={p.expiresAt} status={p.status} />
                                    </TableCell>
                                    <TableCell><StatusBadge status={p.status} /></TableCell>
                                    <TableCell className="text-right px-10">
                                      <div className="flex justify-end items-center gap-3">
                                        <button 
                                          onClick={() => { setSelectedAccountId(p.id); setPendingAccountStatus(p.status); setAssignBuyerId(p.boughtBy || ""); }}
                                          className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 active:scale-90 transition-transform"
                                        >
                                          <Eye size={18} />
                                        </button>
                                        <button 
                                          onClick={() => { setDeleteTarget({id:p.id, type:'account'}); setIsDeleteDialogOpen(true); }}
                                          className="w-10 h-10 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl flex items-center justify-center transition-colors"
                                        >
                                          <Trash2 size={18} />
                                        </button>
                                      </div>
                                    </TableCell>
                                 </TableRow>
                               );
                               })
                             )}
                          </TableBody>
                       </Table>
                    </Card>
                 </div>
               )}
            </div>
          )}

          {/* Inventory Management View */}
          {activeView === 'inventory' && (
            <div className="space-y-12 animate-in fade-in duration-700">
               <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                  <Button 
                    onClick={() => handleOpenGameDialog()} 
                    className="rounded-2xl h-16 px-10 gap-3 font-black shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90 text-white uppercase tracking-widest active:scale-95 transition-all w-full sm:w-auto"
                  >
                    <PlusCircle size={20} /> New Game
                  </Button>
               </div>

               <div className="grid grid-cols-1 gap-6 max-w-4xl">
                  {games.map(g => {
                    const isExpanded = expandedGameId === g.id;
                    const gameItems = products.filter(p => p.gameId === g.id);
                    
                    return (
                      <Card 
                        key={g.id} 
                        className={cn(
                          "rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden transition-all duration-300",
                          isExpanded && "ring-2 ring-primary shadow-2xl"
                        )}
                      >
                         {/* Card Header */}
                         <div 
                           onClick={() => setExpandedGameId(isExpanded ? null : g.id)}
                           className="p-4 md:p-8 flex items-center justify-between cursor-pointer group"
                         >
                            <div className="flex items-center gap-4 sm:gap-8 min-w-0">
                               <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-3xl bg-slate-50 dark:bg-slate-800 relative overflow-hidden shrink-0 border border-gray-100 dark:border-white/5 shadow-inner">
                                  {g.icon ? <Image src={g.icon} alt="" fill className="object-cover" /> : <Gamepad2 className="m-auto mt-8 text-slate-300" />}
                               </div>
                               <div className="min-w-0">
                                  <h4 className="font-headline font-bold text-base sm:text-2xl uppercase tracking-tight text-slate-900 dark:text-white truncate">{g.title}</h4>
                                  <p className="text-[10px] sm:text-xs font-black text-muted-foreground uppercase tracking-widest mt-1 opacity-60">{g.category}</p>
                               </div>
                            </div>
                            <div className="flex flex-col gap-3 shrink-0">
                               <button 
                                 onClick={(e) => { e.stopPropagation(); handleOpenGameDialog(g); }}
                                 className="text-blue-500 hover:scale-110 transition-transform"
                               >
                                 <PencilLine size={24} />
                               </button>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); setDeleteTarget({id:g.id, type:'game'}); setIsDeleteDialogOpen(true); }}
                                 className="text-red-500 hover:scale-110 transition-transform"
                               >
                                 <Trash2 size={24} />
                               </button>
                            </div>
                         </div>

                         {/* Expanded Inventory Items */}
                         {isExpanded && (
                           <div className="px-4 md:px-8 pb-8 pt-4 border-t dark:border-white/5 animate-in slide-in-from-top-2 duration-300">
                              <div className="flex justify-between items-center mb-6">
                                 <h5 className="text-[10px] md:text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Inventory Items</h5>
                                 <button 
                                   onClick={() => handleOpenProductDialog(null, g.id)}
                                   className="text-[10px] md:text-xs font-black text-primary uppercase tracking-widest flex items-center gap-1.5"
                                 >
                                    <Plus size={14} /> Add Item
                                 </button>
                              </div>

                              <div className="space-y-3">
                                 {gameItems.length === 0 ? (
                                   <div className="py-8 text-center opacity-30 italic text-xs uppercase font-bold">No items added yet</div>
                                 ) : (
                                   gameItems.map(p => (
                                     <div 
                                       key={p.id}
                                       onClick={() => handleOpenProductDialog(p)}
                                       className="p-3 md:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border dark:border-white/5 flex items-center justify-between group hover:bg-slate-100 transition-colors cursor-pointer"
                                     >
                                        <div className="flex items-center gap-3 md:gap-5">
                                           <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl overflow-hidden relative shrink-0 shadow-sm border border-white">
                                              {p.thumbnail ? <Image src={p.thumbnail} alt="" fill className="object-cover" /> : <div className="w-full h-full bg-slate-200" />}
                                           </div>
                                           <div>
                                              <p className="font-bold text-sm md:text-lg text-slate-900 dark:text-white leading-tight">{p.title}</p>
                                              <p className="text-[10px] md:text-sm font-black text-primary mt-0.5">${p.price}</p>
                                           </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                           <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({id:p.id, type:'product'}); setIsDeleteDialogOpen(true); }} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                              <Trash2 size={16} />
                                           </button>
                                           <ChevronRight size={18} className="text-slate-300" />
                                        </div>
                                     </div>
                                   ))
                                 )}
                              </div>
                           </div>
                         )}
                      </Card>
                    );
                  })}
               </div>
            </div>
          )}

          {/* Events & Banners View */}
          {activeView === 'events' && (
            <div className="space-y-12 animate-in fade-in duration-700">
               {/* Header Controls */}
               <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-6">
                  <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                     <Button 
                       variant="outline"
                       onClick={() => { setBannerForm({ imageUrl: "", linkTo: "" }); setIsBannerDialogOpen(true); }}
                       className="rounded-2xl h-14 md:h-16 px-8 gap-3 font-bold border-2 text-xs md:text-sm uppercase tracking-widest active:scale-95 w-full sm:w-auto"
                     >
                        <Plus size={18} /> New Banner
                     </Button>
                     <Button 
                       onClick={() => { setEditingEvent(null); setEventForm({ title: "", shortDescription: "", content: "", thumbnailUrl: "", type: "freefire_event", active: true, duration: "", durationUnit: "days" }); setIsEventDialogOpen(true); }}
                       className="rounded-2xl h-14 md:h-16 px-8 gap-3 font-black shadow-xl shadow-primary/30 bg-primary hover:bg-primary/90 text-white uppercase tracking-widest active:scale-95 transition-all w-full sm:w-auto"
                     >
                        <Megaphone size={18} /> Create Event
                     </Button>
                  </div>
               </div>

               {/* Events Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {events.map(e => (
                    <Card key={e.id} className="rounded-[2.5rem] overflow-hidden border-none shadow-xl bg-white dark:bg-slate-900 group">
                       <div className="aspect-[16/10] relative">
                          <Image src={e.thumbnailUrl} alt={e.title} fill className="object-cover" unoptimized />
                          <div className="absolute top-4 left-4">
                             <Badge className="bg-green-500 text-white border-none font-bold text-[8px] uppercase px-2 py-0.5">LIVE</Badge>
                          </div>
                          <div className="absolute top-4 right-4 flex gap-2">
                             <button onClick={() => { setEditingEvent(e); setEventForm({ ...e, duration: "", durationUnit: "days" }); setIsEventDialogOpen(true); }} className="w-8 h-8 rounded-lg bg-blue-500/90 text-white flex items-center justify-center backdrop-blur-sm shadow-lg hover:scale-110 transition-transform">
                                <Edit size={14} />
                             </button>
                             <button onClick={() => { setDeleteTarget({id:e.id, type:'event'}); setIsDeleteDialogOpen(true); }} className="w-8 h-8 rounded-lg bg-red-500/90 text-white flex items-center justify-center backdrop-blur-sm shadow-lg hover:scale-110 transition-transform">
                                <Trash2 size={14} />
                             </button>
                          </div>
                       </div>
                       <div className="p-6 md:p-8 space-y-4">
                          <h4 className="font-headline font-bold text-xl uppercase truncate text-slate-900 dark:text-white">{e.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed min-h-[2.5rem]">{e.shortDescription}</p>
                          <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest pt-2">
                             <Clock size={14} />
                             <span>ENDS {e.expiresAt ? format(new Date(e.expiresAt), "MMM d, HH:mm").toUpperCase() : "SOON"}</span>
                          </div>
                       </div>
                    </Card>
                  ))}
               </div>

               {/* Slider Banners Section */}
               <div className="space-y-6 pt-12">
                  <h4 className="text-[10px] md:text-xs font-black text-muted-foreground uppercase tracking-[0.3em]">Slider Banners</h4>
                  <div className="flex flex-wrap gap-4">
                     {banners.map(b => (
                        <div key={b.id} className="relative w-40 md:w-64 aspect-[3/1] rounded-2xl md:rounded-[1.5rem] overflow-hidden group shadow-lg">
                           <Image src={b.imageUrl} alt="" fill className="object-cover" unoptimized />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button onClick={() => { setDeleteTarget({id:b.id, type:'banner'}); setIsDeleteDialogOpen(true); }} className="p-2 bg-red-600 text-white rounded-full hover:scale-110 transition-transform">
                                 <Trash2 size={16} />
                              </button>
                           </div>
                        </div>
                     ))}
                     {banners.length === 0 && (
                        <div className="py-12 px-20 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2rem] flex flex-col items-center gap-4 opacity-30 italic text-xs font-bold uppercase">
                           No banners added
                        </div>
                     )}
                  </div>
               </div>
            </div>
          )}

          {/* Promo Codes Management */}
          {activeView === 'promo-codes' && (
            <div className="space-y-12 animate-in fade-in duration-700">
               <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-6">
                  <Button 
                    onClick={() => setIsPromoDialogOpen(true)}
                    className="rounded-2xl h-14 md:h-16 px-10 gap-3 font-black shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90 text-white uppercase tracking-widest active:scale-95 transition-all w-full sm:w-auto"
                  >
                    <PlusCircle size={20} /> New Promo Code
                  </Button>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {promoCodes.length === 0 ? (
                    <div className="col-span-full py-24 text-center opacity-30 italic text-xs font-bold uppercase border-2 border-dashed rounded-[3rem]">No promo codes active</div>
                  ) : (
                    promoCodes.map(promo => {
                      const isExpired = promo.expiresAt < Date.now();
                      const status = promo.claimed ? 'Claimed' : isExpired ? 'Expired' : 'Unclaimed';
                      const badgeColor = promo.claimed ? 'bg-purple-100 text-purple-700' : isExpired ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';
                      const claimedUser = promo.claimed ? allUsers.find(u => u.uid === promo.usedBy) : null;

                      return (
                        <Card key={promo.id} className="rounded-[2rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden group">
                           <div className="p-6 md:p-8 space-y-6">
                              <div className="flex items-center justify-between">
                                 <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shadow-inner">
                                    <Ticket size={20} />
                                 </div>
                                 <Badge className={cn("rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-widest border-none", badgeColor)}>
                                    {status}
                                 </Badge>
                              </div>

                              <div className="space-y-1">
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Promo Code</p>
                                 <div className="flex items-center gap-2">
                                    <h4 className="text-xl md:text-2xl font-headline font-bold text-slate-900 dark:text-white truncate">{promo.code}</h4>
                                    <button 
                                      onClick={() => {
                                        navigator.clipboard.writeText(promo.code);
                                        toast({ title: "Code Copied!", description: `${promo.code} is now in your clipboard.` });
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all active:scale-90"
                                    >
                                      <Copy size={16} />
                                    </button>
                                 </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1">
                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Discount</p>
                                    <p className="font-bold text-lg text-primary">{promo.discount}% OFF</p>
                                 </div>
                                 <div className="space-y-1 text-right">
                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Expires</p>
                                    <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{format(new Date(promo.expiresAt), 'MMM d, HH:mm')}</p>
                                 </div>
                              </div>

                              {promo.claimed && (
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border dark:border-white/5 flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden relative shrink-0">
                                      {claimedUser?.photoURL ? (
                                        <Image src={claimedUser.photoURL} alt="" fill className="object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                                          <User size={14} />
                                        </div>
                                      )}
                                   </div>
                                   <div className="min-w-0 flex-1">
                                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Claimed By</p>
                                      <p className="text-[10px] font-bold text-slate-900 dark:text-white truncate">{claimedUser?.name || 'Unknown User'}</p>
                                      <p className="text-[8px] text-muted-foreground truncate">{claimedUser?.email || promo.usedBy}</p>
                                   </div>
                                </div>
                              )}

                              <div className="pt-4 border-t dark:border-white/5">
                                 <Button 
                                   variant="ghost" 
                                   onClick={() => { setDeleteTarget({id: promo.id, type:'promoCode'}); setIsDeleteDialogOpen(true); }}
                                   className="w-full rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 font-bold uppercase text-[10px] tracking-widest h-10"
                                 >
                                    <Trash2 size={14} className="mr-2" /> Delete Voucher
                                 </Button>
                              </div>
                           </div>
                        </Card>
                      );
                    })
                  )}
               </div>
            </div>
          )}

          {activeView === 'users' && (
            <div className="space-y-8 animate-in fade-in duration-700">
               <div className="flex flex-col lg:flex-row lg:items-center justify-end gap-6">
                  <div className="relative w-full lg:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input 
                      placeholder="Search users..." 
                      className="pl-12 h-14 rounded-2xl bg-white dark:bg-slate-900 border-none shadow-sm font-bold"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>
               </div>

               {/* Mobile View: Cards */}
               <div className="grid grid-cols-1 gap-4 md:hidden">
                  {filteredUsers.length === 0 ? (
                    <div className="py-20 text-center opacity-30 italic text-xs font-bold uppercase">No users found</div>
                  ) : (
                    filteredUsers.map(u => {
                      const isOnline = u.lastActive && (Date.now() - u.lastActive) < 300000;
                      return (
                        <Card key={u.uid} className="p-5 rounded-[2rem] border-none shadow-lg bg-white dark:bg-slate-900 space-y-4">
                           <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden relative border-2 border-white shadow-sm shrink-0">
                                 {u.photoURL ? <Image src={u.photoURL} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-black">U</div>}
                              </div>
                              <div className="min-w-0">
                                 <p className="font-bold text-base text-slate-900 dark:text-white truncate">{u.name || "Legendary Gamer"}</p>
                                 <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border dark:border-white/5">
                                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Balance</p>
                                 <div className="flex items-center gap-1.5">
                                    <Star size={12} className="text-amber-500 fill-amber-500" />
                                    <span className="font-bold text-sm">{u.points || 0}</span>
                                 </div>
                              </div>
                              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border dark:border-white/5">
                                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Role</p>
                                 <Badge className="text-[8px] font-black h-5 py-0 px-2 uppercase tracking-tighter">{u.role || 'user'}</Badge>
                              </div>
                           </div>
                           <div className="flex items-center justify-between pt-2 border-t dark:border-white/5">
                              <div className="flex items-center gap-2">
                                 <div className={cn("w-2 h-2 rounded-full", isOnline ? "bg-green-500 animate-pulse" : "bg-slate-300")} />
                                 <span className="text-10px] font-black uppercase text-slate-400">{isOnline ? 'Online' : 'Offline'}</span>
                              </div>
                              <div className="flex gap-2">
                                 <button onClick={() => { setSelectedUser(u); setIsUserManageOpen(true); }} className="w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center shadow-md"><Edit size={16}/></button>
                                 <button onClick={() => { setDeleteTarget({id:u.uid, type:'user'}); setIsDeleteDialogOpen(true); }} className="w-9 h-9 text-red-500 bg-red-50 dark:bg-red-950/20 rounded-xl flex items-center justify-center"><Trash2 size={16}/></button>
                              </div>
                           </div>
                        </Card>
                      )
                    })
                  )}
               </div>

               {/* Desktop View: Table */}
               <Card className="hidden md:block rounded-[3rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden overflow-x-auto scrollbar-hide">
                  <Table className="min-w-[1000px]">
                     <TableHeader className="bg-slate-50/50 dark:bg-slate-800/20">
                        <TableRow className="border-none h-20">
                           <TableHead className="px-10 font-bold uppercase text-[11px] tracking-widest text-slate-400">User Identity</TableHead>
                           <TableHead className="font-bold uppercase text-[11px] tracking-widest text-slate-400">Contact & Role</TableHead>
                           <TableHead className="font-bold uppercase text-[11px] tracking-widest text-slate-400 text-center">Reward Balance</TableHead>
                           <TableHead className="font-bold uppercase text-[11px] tracking-widest text-slate-400">Presence</TableHead>
                           <TableHead className="font-bold uppercase text-[11px] tracking-widest text-slate-400 text-center">Status</TableHead>
                           <TableHead className="text-right px-10 font-bold uppercase text-[11px] tracking-widest text-slate-400">Actions</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {filteredUsers.length === 0 ? (
                          <TableRow><TableCell colSpan={6} className="h-64 text-center text-slate-300 italic uppercase font-bold text-xs">No users found.</TableCell></TableRow>
                        ) : (
                          filteredUsers.map(u => {
                            const isOnline = u.lastActive && (Date.now() - u.lastActive) < 300000;
                            return (
                              <TableRow key={u.uid} className="border-slate-50 dark:border-white/5 h-28 hover:bg-slate-50/30 transition-colors">
                                 <TableCell className="px-10">
                                    <div className="flex items-center gap-4">
                                       <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative border-2 border-white shadow-sm shrink-0">
                                          {u.photoURL ? <Image src={u.photoURL} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-black">U</div>}
                                       </div>
                                       <div className="flex flex-col min-w-0">
                                          <span className="font-bold text-sm md:text-lg text-slate-900 dark:text-white truncate">{u.name || "Legendary Gamer"}</span>
                                          <span className="text-[9px] md:text-xs text-muted-foreground uppercase font-black tracking-tight truncate">{u.email}</span>
                                       </div>
                                    </div>
                                 </TableCell>
                                 <TableCell>
                                    <div className="flex flex-col gap-1">
                                       <span className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300">{u.phoneNumber || "---"}</span>
                                       <Badge className={cn(
                                         "w-fit rounded-full px-2 py-0 text-[8px] font-black uppercase tracking-widest border-none",
                                         u.role === 'admin' || u.role === 'super_admin' ? "bg-primary text-white" : "bg-cyan-100 text-cyan-700"
                                       )}>
                                         {u.role || "USER"}
                                       </Badge>
                                    </div>
                                 </TableCell>
                                 <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                       <Star size={14} className="text-amber-500 fill-amber-500" />
                                       <span className="font-headline font-bold text-lg md:text-2xl text-slate-900 dark:text-white">{u.points || 0}</span>
                                    </div>
                                 </TableCell>
                                 <TableCell>
                                    <div className="flex flex-col">
                                       <div className="flex items-center gap-1.5">
                                          <div className={cn("w-1.5 h-1.5 rounded-full", isOnline ? "bg-green-500 animate-pulse" : "bg-slate-300")} />
                                          <span className={cn("text-[10px] font-black uppercase tracking-widest", isOnline ? "text-green-600" : "text-slate-400")}>
                                            {isOnline ? "Online" : "Offline"}
                                          </span>
                                       </div>
                                       <span className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5">
                                          {u.lastActive ? formatDistanceToNow(u.lastActive).toUpperCase() + " AGO" : "NEVER"}
                                       </span>
                                    </div>
                                 </TableCell>
                                 <TableCell className="text-center">
                                    <Badge className={cn(
                                      "rounded-full px-4 py-1 text-[8px] font-black uppercase tracking-widest border-none",
                                      u.banned ? "bg-red-500 text-white" : "bg-green-100 text-green-700"
                                    )}>
                                      {u.banned ? "Banned" : "Active"}
                                    </Badge>
                                 </TableCell>
                                 <TableCell className="text-right px-10">
                                    <div className="flex justify-end items-center gap-3">
                                       <button 
                                         onClick={() => { setSelectedUser(u); setPointAdjustment(""); setIsUserManageOpen(true); }}
                                         className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 active:scale-90 transition-transform"
                                       >
                                         <Edit size={18} />
                                       </button>
                                       <button 
                                         onClick={() => { setDeleteTarget({id:u.uid, type:'user'}); setIsDeleteDialogOpen(true); }}
                                         className="w-10 h-10 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl flex items-center justify-center transition-colors"
                                       >
                                         <Trash2 size={18} />
                                       </button>
                                    </div>
                                 </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                     </TableBody>
                  </Table>
               </Card>
            </div>
          )}

          {activeView === 'settings' && (
            <div className="max-w-5xl mx-auto space-y-6 sm:space-y-12 pb-20 sm:pb-24">
               <div className="space-y-2">
                  <h2 className="text-2xl md:text-4xl font-headline font-bold uppercase tracking-tight">Advanced Controls</h2>
                  <p className="text-muted-foreground font-medium uppercase text-xs tracking-widest">Fine-tune your store's identity, visibility, and marketplace logic.</p>
               </div>

               <Accordion type="single" collapsible className="space-y-4 sm:space-y-6">
                  {/* Brand Identity */}
                  <AccordionItem value="branding" className="border-none">
                     <Card className="rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                        <AccordionTrigger className="px-4 py-6 sm:px-8 sm:py-8 hover:no-underline">
                           <div className="flex items-center gap-4 text-blue-500">
                              <ImagePlus className="w-6 h-6" />
                              <div className="text-left">
                                 <h4 className="font-headline font-bold text-lg uppercase tracking-tight">Brand Identity</h4>
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Logo, Ticker & Live Toggles</p>
                              </div>
                           </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-6 pt-2 sm:px-8 sm:pb-8 sm:pt-4">
                           <div className="space-y-6 sm:space-y-10">
                              <div className="flex flex-col md:flex-row gap-6 md:gap-10">
                                 <div className="w-full md:w-48 space-y-3">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Store Logo</Label>
                                    <div className="relative aspect-square rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden shadow-inner group">
                                       {brandForm.logo ? <Image src={brandForm.logo} alt="Logo" fill className="object-cover p-4" /> : <ImagePlus className="text-slate-300" />}
                                       <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logo')} />
                                       {isUploading && <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex items-center justify-center"><Loader2 className="animate-spin" /></div>}
                                    </div>
                                 </div>
                                 <div className="flex-1 space-y-6">
                                    <SettingInput label="Announcement Ticker" value={brandForm.announcementTicker} onChange={v => setBrandForm(f => ({ ...f, announcementTicker: v }))} placeholder="Welcome to Oskar Shop..." />
                                    <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-between border dark:border-white/5">
                                       <div className="flex items-center gap-3">
                                          <Radio className={cn("w-5 h-5", brandForm.isLive ? "text-red-500 animate-pulse" : "text-slate-400")} />
                                          <div>
                                             <p className="text-sm font-bold">Oskar is LIVE</p>
                                             <p className="text-[10px] text-muted-foreground font-medium">Show TikTok live banner on home</p>
                                          </div>
                                       </div>
                                       <Switch checked={brandForm.isLive} onCheckedChange={v => setBrandForm(f => ({ ...f, isLive: v }))} />
                                    </div>
                                 </div>
                              </div>
                              <Button onClick={() => updateStoreSettings(brandForm).then(()=>toast({title:"Branding Synced"}))} className="w-full h-12 md:h-16 rounded-2xl font-black uppercase tracking-widest shadow-2xl bg-primary">Save Brand Updates</Button>
                           </div>
                        </AccordionContent>
                     </Card>
                  </AccordionItem>

                  {/* Marketplace Economy */}
                  <AccordionItem value="economy" className="border-none">
                     <Card className="rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                        <AccordionTrigger className="px-4 py-6 sm:px-8 sm:py-8 hover:no-underline">
                           <div className="flex items-center gap-4 text-amber-500">
                              <HandCoins className="w-6 h-6" />
                              <div className="text-left">
                                 <h4 className="font-headline font-bold text-lg uppercase tracking-tight">Marketplace Economy</h4>
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Payment number & listing fees</p>
                              </div>
                           </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-6 pt-2 sm:px-8 sm:pb-8 sm:pt-4">
                           <div className="space-y-6 sm:space-y-10">
                              <SettingInput label="EVC / Premier Payment Number" value={economyForm.paymentNumber} onChange={v => setEconomyForm(f => ({ ...f, paymentNumber: v }))} placeholder="613982172" />
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                 <SettingInput label="Weekly Listing Fee ($)" type="number" value={economyForm.listingFeeWeekly.toString()} onChange={v => setEconomyForm(f => ({ ...f, listingFeeWeekly: parseFloat(v) }))} placeholder="1.00" />
                                 <SettingInput label="Monthly Listing Fee ($)" type="number" value={economyForm.listingFeeMonthly.toString()} onChange={v => setEconomyForm(f => ({ ...f, listingFeeMonthly: parseFloat(v) }))} placeholder="3.00" />
                              </div>
                              <Button onClick={syncEconomySettings} className="w-full h-12 md:h-16 rounded-2xl font-black uppercase tracking-widest shadow-2xl bg-amber-500 hover:bg-amber-600">Update Economy</Button>
                           </div>
                        </AccordionContent>
                     </Card>
                  </AccordionItem>

                  {/* Payment Infrastructure */}
                  <AccordionItem value="gateways" className="border-none">
                     <Card className="rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                        <AccordionTrigger className="px-4 py-6 sm:px-8 sm:py-8 hover:no-underline">
                           <div className="flex items-center gap-4 text-emerald-500">
                              <Wallet className="w-6 h-6" />
                              <div className="text-left">
                                 <h4 className="font-headline font-bold text-lg uppercase tracking-tight">Payment Infrastructure</h4>
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Manage USSD Templates</p>
                              </div>
                           </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-6 pt-2 sm:px-8 sm:pb-8 sm:pt-4">
                           <div className="space-y-6 sm:space-y-8">
                              <div className="flex justify-end">
                                 <Button onClick={() => handleOpenPaymentMethodDialog()} size="sm" className="rounded-xl font-bold uppercase text-[10px] tracking-widest gap-2">
                                    <Plus size={14} /> Add Method
                                 </Button>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                 {paymentMethods.map(m => (
                                    <div key={m.id} className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between border dark:border-white/5">
                                       <div className="flex items-center gap-4">
                                          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-primary shadow-sm overflow-hidden relative">
                                             {m.icon ? <Image src={m.icon} alt="" fill className="object-cover" /> : <Smartphone size={24} />}
                                          </div>
                                          <div>
                                             <p className="font-bold text-sm">{m.name}</p>
                                             <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">{m.active ? 'Active' : 'Disabled'}</p>
                                          </div>
                                       </div>
                                       <div className="flex gap-2">
                                          <button onClick={() => handleOpenPaymentMethodDialog(m)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"><Edit size={18} /></button>
                                          <button onClick={() => { setDeleteTarget({id:m.id, type:'paymentMethod'}); setIsDeleteDialogOpen(true); }} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={18} /></button>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </AccordionContent>
                     </Card>
                  </AccordionItem>

                  {/* Communication Hub */}
                  <AccordionItem value="communication" className="border-none">
                     <Card className="rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                        <AccordionTrigger className="px-4 py-6 sm:px-8 sm:py-8 hover:no-underline">
                           <div className="flex items-center gap-4 text-indigo-500">
                              <MessageCircle className="w-6 h-6" />
                              <div className="text-left">
                                 <h4 className="font-headline font-bold text-lg uppercase tracking-tight">Communication Hub</h4>
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Socials, Support & Tutorials</p>
                              </div>
                           </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-6 pt-2 sm:px-8 sm:pb-8 sm:pt-4">
                           <div className="space-y-6 sm:space-y-10">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                 <SettingInput label="WhatsApp Support No" value={helpLinksForm.whatsappNumber} onChange={v => setHelpLinksForm(f => ({ ...f, whatsappNumber: v }))} placeholder="252613982172" />
                                 <SettingInput label="TikTok Channel URL" value={helpLinksForm.tiktokUrl} onChange={v => setHelpLinksForm(f => ({ ...f, tiktokUrl: v }))} placeholder="https://tiktok.com/@..." />
                                 <SettingInput label="Tutorial Video URL" value={helpLinksForm.tutorialUrl} onChange={v => setHelpLinksForm(f => ({ ...f, tutorialUrl: v }))} placeholder="https://youtube.com/..." />
                              </div>
                              <Button onClick={() => updateStoreSettings({ helpLinks: helpLinksForm }).then(()=>toast({title:"Links Synced"}))} className="w-full h-12 md:h-16 rounded-2xl font-black uppercase tracking-widest shadow-2xl bg-indigo-500 hover:bg-indigo-600">Save Communication Links</Button>
                           </div>
                        </AccordionContent>
                     </Card>
                  </AccordionItem>

                  {/* Compliance Editor */}
                  <AccordionItem value="legal" className="border-none">
                     <Card className="rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                        <AccordionTrigger className="px-4 py-6 sm:px-8 sm:py-8 hover:no-underline">
                           <div className="flex items-center gap-4 text-emerald-600">
                              <ScrollText className="w-6 h-6" />
                              <div className="text-left">
                                 <h4 className="font-headline font-bold text-lg uppercase tracking-tight">Compliance Editor</h4>
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Terms & Conditions (EN/SO)</p>
                              </div>
                           </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-6 pt-2 sm:px-8 sm:pb-8 sm:pt-4">
                           <div className="space-y-8 sm:space-y-12">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
                                 <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">English Terms</Label>
                                    <Textarea value={termsForm.en} onChange={e => setTermsForm(f => ({ ...f, en: e.target.value }))} className="min-h-[300px] rounded-3xl border-none bg-slate-50 dark:bg-slate-800 p-6 font-medium shadow-inner" placeholder="Enter English terms..." />
                                 </div>
                                 <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Somali Terms (Shuruudaha)</Label>
                                    <Textarea value={termsForm.so} onChange={e => setTermsForm(f => ({ ...f, so: e.target.value }))} className="min-h-[300px] rounded-3xl border-none bg-slate-50 dark:bg-slate-800 p-6 font-medium shadow-inner" placeholder="Geli shuruudaha afka Soomaaliga..." />
                                 </div>
                              </div>
                              <Button onClick={() => updateStoreSettings({ termsAndConditions: termsForm }).then(()=>toast({title:"Policy Updated"}))} className="w-full h-12 md:h-20 rounded-3xl font-black uppercase tracking-widest shadow-2xl bg-emerald-600">Sync Legal Policy</Button>
                           </div>
                        </AccordionContent>
                     </Card>
                  </AccordionItem>

                  {/* Maintenance Console */}
                  <AccordionItem value="maintenance" className="border-none">
                     <Card className="rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                        <AccordionTrigger className="px-4 py-6 sm:px-8 sm:py-8 hover:no-underline">
                           <div className="flex items-center gap-4 text-red-500">
                              <ShieldAlert className="w-6 h-6" />
                              <div className="text-left">
                                 <h4 className="font-headline font-bold text-lg uppercase tracking-tight">Maintenance Console</h4>
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Global Maintenance Mode</p>
                              </div>
                           </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-6 pt-2 sm:px-8 sm:pb-8 sm:pt-4">
                           <div className="space-y-8 sm:space-y-12">
                              <div className="p-6 md:p-10 bg-red-50 dark:bg-red-950/20 rounded-3xl flex items-center justify-between border-2 border-red-100 dark:border-red-900/30">
                                 <div className="flex items-center gap-4 md:gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg"><Monitor className="w-7 h-7" /></div>
                                    <div>
                                       <p className="text-lg md:text-2xl font-headline font-bold uppercase tracking-tight">Maintenance Mode</p>
                                       <p className="text-xs md:text-sm font-medium text-red-700 dark:text-red-400">Lock entire store for maintenance</p>
                                    </div>
                                 </div>
                                 <Switch checked={appStatusForm.offline} onCheckedChange={v => setAppStatusForm(f => ({ ...f, offline: v }))} className="scale-125" />
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14">
                                 <div className="space-y-6">
                                    <SettingInput label="Maintenance Title" value={appStatusForm.offlineTitle} onChange={v => setAppStatusForm(f => ({ ...f, offlineTitle: v }))} placeholder="Under Maintenance" />
                                    <div className="space-y-3">
                                       <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Maintenance Description</Label>
                                       <Textarea value={appStatusForm.offlineBody} onChange={e => setAppStatusForm(f => ({ ...f, offlineBody: e.target.value }))} className="min-h-[150px] rounded-3xl bg-slate-50 dark:bg-slate-800 border-none p-6 font-medium shadow-inner" placeholder="Describe the downtime..." />
                                    </div>
                                 </div>
                                 <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Maintenance Image / Poster</Label>
                                    <div className="relative aspect-video rounded-3xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center overflow-hidden shadow-inner group">
                                       {appStatusForm.offlineImageUrl ? <Image src={appStatusForm.offlineImageUrl} alt="Poster" fill className="object-cover" /> : <ImageIcon className="text-slate-300 w-10 h-10" />}
                                       <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'offlineImage')} />
                                       <p className="text-[8px] font-black uppercase text-slate-400 mt-2">Upload Poster</p>
                                    </div>
                                 </div>
                              </div>
                              <Button onClick={() => updateStoreSettings({ appStatus: appStatusForm }).then(()=>toast({title:"System State Synced"}))} variant="destructive" className="w-full h-12 md:h-20 rounded-3xl font-black uppercase tracking-widest shadow-2xl">Publish System State</Button>
                           </div>
                        </AccordionContent>
                     </Card>
                  </AccordionItem>

                  {/* Recovery Infrastructure */}
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
                                    These keys allow the application to send password reset codes directly through EmailJS.
                                 </p>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                 <div className="space-y-4 sm:space-y-6">
                                    <SettingInput label="Service ID" value={emailjsForm.serviceId || ''} onChange={v => setEmailjsForm(f => ({ ...f, serviceId: v }))} placeholder="service_xxxxxxxx" />
                                    <SettingInput label="Template ID" value={emailjsForm.templateId || ''} onChange={v => setEmailjsForm(f => ({ ...f, templateId: v }))} placeholder="template_xxxxxxxx" />
                                 </div>
                                 <div className="space-y-4 sm:space-y-6">
                                    <SettingInput label="Public Key" value={emailjsForm.publicKey || ''} onChange={v => setEmailjsForm(f => ({ ...f, publicKey: v }))} placeholder="xxxxxxxxxxxxxxxxx" />
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
               </Accordion>
            </div>
          )}
        </main>
      </div>

      {/* Dialogs */}
      <Dialog open={isUserManageOpen} onOpenChange={setIsUserManageOpen}>
        <DialogContent className="max-w-md w-[95%] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900 animate-in zoom-in duration-300">
           <DialogHeader className="sr-only"><DialogTitle>User Management</DialogTitle></DialogHeader>
           
           {/* Modal Header Gradient */}
           <div className="h-28 md:h-32 bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] relative shrink-0">
              <button 
                onClick={() => setIsUserManageOpen(false)}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
              >
                 <XCircle size={20} />
              </button>
              
              {/* Overlapping Avatar */}
              <div className="absolute -bottom-12 left-8">
                 <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl border-[6px] border-white dark:border-slate-900 bg-slate-100 overflow-hidden shadow-2xl relative">
                    {selectedUser?.photoURL ? (
                      <Image src={selectedUser.photoURL} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100"><User size={40} /></div>
                    )}
                 </div>
              </div>
           </div>

           <div className="p-6 md:p-8 pt-12 md:pt-16 space-y-6 md:space-y-8">
              {/* User Basic Info */}
              <div className="flex justify-between items-start">
                 <div className="min-w-0 pr-2">
                    <h3 className="text-xl md:text-2xl font-headline font-bold tracking-tight text-slate-900 dark:text-white truncate">{selectedUser?.name || "Gamer"}</h3>
                    <p className="text-[10px] md:text-xs font-medium text-muted-foreground truncate">{selectedUser?.email}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                       <Smartphone size={12} />
                       <span className="text-[10px] md:text-[11px] font-bold">{selectedUser?.phoneNumber || "No Phone"}</span>
                    </div>
                 </div>
                 <Badge className={cn(
                   "rounded-full uppercase text-[7px] md:text-[8px] font-black tracking-widest px-2 md:px-3 py-1 border-none shadow-sm shrink-0",
                   selectedUser?.banned ? "bg-red-50 text-white" : "bg-green-100 text-green-700"
                 )}>
                    {selectedUser?.banned ? 'Banned' : 'Active'}
                 </Badge>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                 <div className="p-4 md:p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl md:rounded-[1.5rem] border border-slate-100 dark:border-white/5 shadow-inner">
                    <p className="text-[8px] md:text-[9px] font-black uppercase text-slate-400 mb-1 md:mb-2 tracking-widest">Balance</p>
                    <div className="flex items-center gap-2">
                       <Star className="w-4 h-4 md:w-5 md:h-5 text-amber-500 fill-amber-500" />
                       <p className="text-2xl md:text-3xl font-headline font-bold text-slate-900 dark:text-white leading-none">{selectedUser?.points || 0}</p>
                    </div>
                 </div>
                 <div className="p-4 md:p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl md:rounded-[1.5rem] border border-slate-100 dark:border-white/5 shadow-inner">
                    <p className="text-[8px] md:text-[9px] font-black uppercase text-slate-400 mb-1 md:mb-2 tracking-widest">Role</p>
                    <Badge className="bg-primary/10 text-primary border-none text-[8px] md:text-[10px] font-black uppercase px-2 md:px-3 py-0.5 md:py-1 rounded-lg">
                      {selectedUser?.role || 'user'}
                    </Badge>
                 </div>
              </div>

              {/* Role Management */}
              <div className="space-y-2 md:space-y-3">
                 <div className="flex items-center gap-2 text-primary ml-1">
                    <LayoutGrid size={14} />
                    <Label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Role Management</Label>
                 </div>
                 <Select 
                    value={selectedUser?.role || 'user'} 
                    onValueChange={(val: any) => {
                      manageUser(selectedUser.uid, { role: val });
                      setSelectedUser({...selectedUser, role: val});
                      toast({title: "Role Updated"});
                    }}
                 >
                    <SelectTrigger className="h-12 md:h-16 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-4 md:px-6 font-bold text-sm md:text-base shadow-inner">
                       <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl bg-white dark:bg-slate-900">
                       <SelectItem value="user" className="rounded-xl p-4 font-bold text-xs uppercase">standard user</SelectItem>
                       <SelectItem value="staff" className="rounded-xl p-4 font-bold text-xs uppercase">staff member</SelectItem>
                       <SelectItem value="admin" className="rounded-xl p-4 font-bold text-xs uppercase">admin access</SelectItem>
                    </SelectContent>
                 </Select>
              </div>

              {/* Wallet Adjustments */}
              <div className="space-y-3 md:space-y-4">
                 <div className="flex items-center gap-2 text-amber-500 ml-1">
                    <DollarSign size={14} />
                    <Label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Wallet Adjustments</Label>
                 </div>
                 <div className="flex gap-2 md:gap-3">
                    <Input 
                      type="number" 
                      placeholder="Amt" 
                      value={pointAdjustment} 
                      onChange={e => setPointAdjustment(e.target.value)} 
                      className="h-12 md:h-16 rounded-xl md:rounded-2xl dark:bg-slate-800 border-none shadow-inner font-bold px-4 md:px-6 text-base md:text-lg focus:ring-2 focus:ring-primary" 
                    />
                    <Button onClick={() => handleAdjustPoints('credit')} className="h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-2xl bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20 shrink-0"><ArrowUpCircle size={24} className="md:size-7" /></Button>
                    <Button onClick={() => handleAdjustPoints('debit')} className="h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-2xl bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 shrink-0"><ArrowDownCircle size={24} className="md:size-7" /></Button>
                 </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-2">
                 <Button 
                    variant={selectedUser?.banned ? "default" : "destructive"} 
                    onClick={async () => { 
                      const newBanned = !selectedUser.banned;
                      await manageUser(selectedUser.uid, { banned: newBanned }); 
                      setSelectedUser({...selectedUser, banned: newBanned}); 
                      toast({title: newBanned ? "User Terminated" : "User Restored"}); 
                    }} 
                    className={cn(
                      "w-full h-14 md:h-18 rounded-2xl md:rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3",
                      selectedUser?.banned ? "bg-green-600 hover:bg-green-700" : "bg-red-50 hover:bg-red-600"
                    )}
                 >
                    {selectedUser?.banned ? (
                      <><RefreshCw size={18} /> RESTORE ACCESS</>
                    ) : (
                      <><Ban size={18} /> TERMINATE</>
                    )}
                 </Button>
                 <p className="text-[7px] md:text-[8px] text-center text-slate-300 uppercase font-black tracking-widest mt-4 md:mt-6 opacity-40">
                    JOINED: {selectedUser?.createdAt ? format(new Date(selectedUser.createdAt), 'MMM d, yyyy').toUpperCase() : 'N/A'}
                 </p>
              </div>
           </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isGameDialogOpen} onOpenChange={setIsGameDialogOpen}>
        <DialogContent className="max-md w-[95%] rounded-[2rem] p-6 md:p-8 border-none shadow-2xl bg-white dark:bg-slate-900">
           <DialogHeader><DialogTitle className="text-xl md:text-2xl font-headline font-bold">{editingGame ? 'Edit Collection' : 'New Game Collection'}</DialogTitle></DialogHeader>
           <form onSubmit={handleSaveGame} className="space-y-6 mt-6">
              <div className="flex justify-center mb-4">
                 <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-white/5 flex items-center justify-center overflow-hidden shadow-inner group">
                    {gameForm.icon ? <Image src={gameForm.icon} alt="" fill className="object-cover" /> : <ImageIcon className="text-slate-300" />}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'game')} />
                 </div>
              </div>
              <SettingInput label="Title" value={gameForm.title} onChange={v => setGameForm({ ...gameForm, title: v })} placeholder="e.g. Free Fire" />
              <div className="space-y-2">
                 <Label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 ml-1">Category</Label>
                 <Select value={gameForm.category} onValueChange={v => setGameForm({ ...gameForm, category: v as any })}>
                    <SelectTrigger className="h-12 rounded-xl dark:bg-slate-800 border-none px-4"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                       <SelectItem value="top-up" className="p-3 font-bold text-xs">Top-Up Items</SelectItem>
                       <SelectItem value="accounts" className="p-3 font-bold text-xs">Account Marketplace</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
              <Button type="submit" disabled={isUploading} className="w-full h-12 md:h-14 rounded-2xl font-bold shadow-lg uppercase tracking-widest">{isUploading ? <Loader2 className="animate-spin" /> : "Save Collection"}</Button>
           </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-xl w-[95%] rounded-[2rem] md:rounded-[3rem] p-0 border-none shadow-2xl bg-white dark:bg-slate-900 max-h-[90vh] overflow-y-auto scrollbar-hide">
           <div className="h-2 bg-primary w-full" />
           <DialogHeader className="p-6 md:p-10 pb-0">
              <DialogTitle className="text-xl md:text-3xl font-headline font-bold uppercase tracking-tight">
                {editingProduct ? 'Edit Package' : 'New Inventory Package'}
              </DialogTitle>
           </DialogHeader>
           <form onSubmit={handleSaveProduct} className="p-6 md:p-10 space-y-6 md:space-y-8">
              <div className="relative w-full aspect-video rounded-2xl md:rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center group overflow-hidden shadow-inner">
                 {productForm.thumbnail ? <Image src={productForm.thumbnail} alt="" fill className="object-cover" unoptimized /> : <><ImageIcon className="text-slate-300 w-10 h-10 md:w-12 md:h-12 mb-2" /><span className="text-[10px] font-black uppercase text-slate-400">Add Media</span></>}
                 <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'product')} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                 <SettingInput label="Package Title" value={productForm.title} onChange={v => setProductForm({ ...productForm, title: v })} placeholder="110 Diamonds" />
                 <div className="space-y-2">
                    <Label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 ml-1">Parent Game</Label>
                    <Select value={productForm.gameId} onValueChange={v => setProductForm({ ...productForm, gameId: v })}>
                       <SelectTrigger className="h-12 md:h-16 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-4 md:px-6 font-bold shadow-inner"><SelectValue placeholder="Select Game" /></SelectTrigger>
                       <SelectContent className="rounded-2xl border-none shadow-2xl z-[200]">
                          {games.filter(g => g.category === 'top-up').map(g => <SelectItem key={g.id} value={g.id} className="p-3 font-bold uppercase text-xs">{g.title}</SelectItem>)}
                       </SelectContent>
                    </Select>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                 <SettingInput label="Standard Price ($)" type="number" value={productForm.price} onChange={v => setProductForm({ ...productForm, price: v })} placeholder="2.99" />
                 <SettingInput label="Discount Price ($)" type="number" value={productForm.discountedPrice} onChange={v => setProductForm({ ...productForm, discountedPrice: v })} placeholder="1.99" />
              </div>
              <div className="space-y-2">
                 <Label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 ml-1">Special Handling</Label>
                 <Select value={productForm.category} onValueChange={v => setProductForm({ ...productForm, category: v as any })}>
                    <SelectTrigger className="h-12 md:h-16 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-4 md:px-6 font-bold shadow-inner"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl z-[200]">
                       <SelectItem value="top-up" className="p-3 font-bold text-xs">Standard Delivery</SelectItem>
                       <SelectItem value="booyah-pass" className="p-3 font-bold text-xs">Booyah Pass (Direct WhatsApp)</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
              {productForm.category === 'booyah-pass' && <SettingInput label="Admin WhatsApp for Direct Sale" value={productForm.whatsappNumber || ""} onChange={v => setProductForm({ ...productForm, whatsappNumber: v })} placeholder="252613982172" />}
              <Button type="submit" disabled={isUploading} className="w-full h-14 md:h-20 rounded-2xl md:rounded-[2.5rem] font-black text-lg md:text-xl shadow-2xl uppercase tracking-widest active:scale-[0.98] transition-all">
                {isUploading ? <Loader2 className="animate-spin w-8 h-8" /> : "Save Package"}
              </Button>
           </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="max-xl w-[95%] rounded-[2rem] md:rounded-[3rem] p-0 border-none shadow-2xl bg-white dark:bg-slate-900 max-h-[90vh] overflow-y-auto scrollbar-hide">
           <div className="h-2 bg-primary w-full" />
           <DialogHeader className="p-6 md:p-10 pb-0">
              <DialogTitle className="text-xl md:text-3xl font-headline font-bold uppercase tracking-tight">
                {editingEvent ? 'Edit Event' : 'Create Live Event'}
              </DialogTitle>
           </DialogHeader>
           <form onSubmit={handleSaveEvent} className="p-6 md:p-10 space-y-6 md:space-y-8">
              <div className="relative w-full aspect-video rounded-2xl md:rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center group overflow-hidden shadow-inner">
                 {eventForm.thumbnailUrl ? <Image src={eventForm.thumbnailUrl} alt="" fill className="object-cover" unoptimized /> : <><ImageIcon className="text-slate-300 w-10 h-10 md:w-12 md:h-12 mb-2" /><span className="text-[10px] font-black uppercase text-slate-400">Add Event Poster</span></>}
                 <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'event')} />
              </div>
              <SettingInput label="Event Title" value={eventForm.title} onChange={v => setEventForm({ ...eventForm, title: v })} placeholder="Hacker Store 2.0" />
              <SettingInput label="Short Description" value={eventForm.shortDescription} onChange={v => setEventForm({ ...eventForm, shortDescription: v })} placeholder="New legendary bundles are here!" />
              <div className="space-y-2">
                 <Label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 ml-1">Event Type</Label>
                 <Select value={eventForm.type} onValueChange={v => setEventForm({ ...eventForm, type: v as any })}>
                    <SelectTrigger className="h-12 md:h-16 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-4 md:px-6 font-bold shadow-inner"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl z-[200]">
                       <SelectItem value="freefire_event" className="p-3 font-bold text-xs uppercase">Free Fire Event</SelectItem>
                       <SelectItem value="general" className="p-3 font-bold text-xs uppercase">General Promotion</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                 <SettingInput label="Duration (Value)" value={eventForm.duration} type="number" onChange={v => setEventForm({ ...eventForm, duration: v })} placeholder="7" />
                 <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Unit</Label>
                    <Select value={eventForm.durationUnit} onValueChange={v => setEventForm({ ...eventForm, durationUnit: v })}>
                       <SelectTrigger className="h-12 md:h-16 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-4 md:px-6 font-bold shadow-inner"><SelectValue /></SelectTrigger>
                       <SelectContent className="rounded-2xl border-none shadow-2xl z-[200]">
                          <SelectItem value="days" className="p-3 font-bold uppercase text-xs uppercase">Days</SelectItem>
                          <SelectItem value="hours" className="p-3 font-bold uppercase text-xs uppercase">Hours</SelectItem>
                          <SelectItem value="minutes" className="p-3 font-bold uppercase text-xs uppercase">Minutes</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
              </div>
              <div className="space-y-2">
                 <Label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 ml-1">Detailed Content</Label>
                 <Textarea value={eventForm.content} onChange={e => setEventForm({ ...eventForm, content: e.target.value })} placeholder="Write full event details here..." className="rounded-2xl bg-slate-50 dark:bg-slate-800 border-none min-h-[120px] md:min-h-[150px] p-4 md:p-6 font-medium shadow-inner" />
              </div>
              <Button type="submit" disabled={isUploading} className="w-full h-14 md:h-20 rounded-2xl md:rounded-[2.5rem] font-black text-lg md:text-xl shadow-2xl uppercase tracking-widest bg-primary text-white">
                {isUploading ? <Loader2 className="animate-spin w-8 h-8" /> : "Publish Event"}
              </Button>
           </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isBannerDialogOpen} onOpenChange={setIsBannerDialogOpen}>
        <DialogContent className="max-md w-[95%] rounded-[2rem] p-6 md:p-8 border-none shadow-2xl bg-white dark:bg-slate-900">
           <DialogHeader><DialogTitle className="text-xl md:text-2xl font-headline font-bold">New Promotion Banner</DialogTitle></DialogHeader>
           <form onSubmit={handleSaveBanner} className="space-y-6 mt-6">
              <div className="relative w-full aspect-[21/9] rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center group overflow-hidden shadow-inner">
                 {bannerForm.imageUrl ? <Image src={bannerForm.imageUrl} alt="" fill className="object-cover" unoptimized /> : <><ImageIcon className="text-slate-300" /><span className="text-[10px] font-black uppercase text-slate-400 mt-2">Upload Banner</span></>}
                 <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'banner')} />
              </div>
              <SettingInput label="Link To (Optional)" value={bannerForm.linkTo || ""} onChange={v => setBannerForm({ ...bannerForm, linkTo: v })} placeholder="#games or #accounts" />
              <Button type="submit" disabled={isUploading || !bannerForm.imageUrl} className="w-full h-12 md:h-14 rounded-2xl font-bold shadow-lg uppercase tracking-widest bg-primary text-white">
                {isUploading ? <Loader2 className="animate-spin" /> : "Add Banner"}
              </Button>
           </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPromoDialogOpen} onOpenChange={setIsPromoDialogOpen}>
        <DialogContent className="max-md w-[95%] rounded-[2rem] p-6 md:p-8 border-none shadow-2xl bg-white dark:bg-slate-900">
           <DialogHeader>
              <DialogTitle className="text-xl md:text-2xl font-headline font-bold uppercase tracking-tight">Create Promo Voucher</DialogTitle>
              <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">Generate a unique code with custom discount</DialogDescription>
           </DialogHeader>
           <form onSubmit={handleSavePromo} className="space-y-6 mt-6">
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Voucher Code</Label>
                 <Input 
                   placeholder="e.g. DEVL26%OFF" 
                   value={promoForm.code} 
                   onChange={e => setPromoForm({...promoForm, code: e.target.value.toUpperCase().replace(/\s/g, '')})} 
                   className="h-12 md:h-16 rounded-xl md:rounded-2xl border-none bg-slate-50 dark:bg-slate-800 font-bold px-4 md:px-6 shadow-inner text-sm md:text-lg focus:ring-primary transition-all uppercase" 
                 />
              </div>
              <SettingInput label="Discount Percentage (%)" value={promoForm.discount} type="number" onChange={v => setPromoForm({...promoForm, discount: v})} placeholder="e.g. 15" />
              
              <div className="grid grid-cols-2 gap-4">
                 <SettingInput label="Duration Value" value={promoForm.duration} type="number" onChange={v => setPromoForm({...promoForm, duration: v})} placeholder="e.g. 7" />
                 <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Time Unit</Label>
                    <Select value={promoForm.durationUnit} onValueChange={v => setPromoForm({...promoForm, durationUnit: v})}>
                       <SelectTrigger className="h-12 md:h-16 rounded-xl bg-slate-50 dark:bg-slate-800 border-none px-4 font-bold shadow-inner"><SelectValue /></SelectTrigger>
                       <SelectContent className="rounded-2xl border-none shadow-2xl z-[200]">
                          <SelectItem value="minutes" className="p-3 font-bold uppercase text-[10px]">Minutes</SelectItem>
                          <SelectItem value="hours" className="p-3 font-bold uppercase text-[10px]">Hours</SelectItem>
                          <SelectItem value="days" className="p-3 font-bold uppercase text-[10px]">Days</SelectItem>
                          <SelectItem value="months" className="p-3 font-bold uppercase text-[10px]">Months</SelectItem>
                          <SelectItem value="years" className="p-3 font-bold uppercase text-[10px]">Years</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
              </div>

              <Button type="submit" className="w-full h-14 md:h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-[0.1em] shadow-xl active:scale-[0.98]">
                 Deploy Voucher Code
              </Button>
           </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentMethodDialogOpen} onOpenChange={setIsPaymentMethodDialogOpen}>
        <DialogContent className="max-w-md w-[95%] rounded-[2rem] p-6 md:p-8 border-none shadow-2xl bg-white dark:bg-slate-900">
           <DialogHeader><DialogTitle className="text-xl md:text-2xl font-headline font-bold">{editingPaymentMethod ? 'Edit Payment Method' : 'New Payment Method'}</DialogTitle></DialogHeader>
           <form onSubmit={handleSavePaymentMethod} className="space-y-6 mt-6">
              <div className="flex justify-center mb-4">
                 <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-white/5 flex items-center justify-center overflow-hidden shadow-inner group">
                    {paymentMethodForm.icon ? <Image src={paymentMethodForm.icon} alt="" fill className="object-cover" /> : <Smartphone className="text-slate-300" />}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'paymentIcon')} />
                 </div>
              </div>
              <SettingInput label="Provider Name" value={paymentMethodForm.name} onChange={v => setPaymentMethodForm(f => ({ ...f, name: v }))} placeholder="e.g. EVC Plus" />
              <SettingInput label="USSD Template" value={paymentMethodForm.ussdTemplate} onChange={v => setPaymentMethodForm(f => ({ ...f, ussdTemplate: v }))} placeholder="*712*613982172*$#" />
              <p className="text-[9px] font-bold text-slate-400 italic leading-relaxed">Use $ as a placeholder for the price (e.g. *711*613982172*$#)</p>
              <div className="flex items-center justify-between p-3 md:p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                 <Label className="font-bold text-sm">Active</Label>
                 <Switch checked={paymentMethodForm.active} onCheckedChange={v => setPaymentMethodForm(f => ({ ...f, active: v }))} />
              </div>
              <Button type="submit" disabled={isUploading} className="w-full h-12 md:h-14 rounded-2xl font-bold uppercase tracking-widest shadow-lg bg-primary">Save Method</Button>
           </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEnforceDialogOpen} onOpenChange={setIsEnforceDialogOpen}>
        <DialogContent className="max-w-md w-[95%] rounded-[2rem] md:rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900 animate-in zoom-in duration-300">
           <div className="bg-red-600 p-6 md:p-8 text-white">
              <DialogTitle className="text-xl md:text-2xl font-headline font-bold uppercase tracking-tight">Security Penalty</DialogTitle>
              <p className="text-white/60 text-[9px] md:text-[10px] font-bold uppercase mt-1">Enforcing policy for Listing #{selectedAccount?.id.toUpperCase()}</p>
           </div>
           <div className="p-6 md:p-8 space-y-5 md:space-y-6">
              <div className="grid grid-cols-2 gap-3">
                 {['delete', 'holding', 'approved', 'pending'].map(act => (
                   <Button key={act} variant={enforceAction === act ? 'default' : 'outline'} onClick={() => setEnforceAction(act as any)} className={cn("rounded-xl h-10 md:h-12 uppercase font-black text-[9px] tracking-widest", enforceAction === act && act === 'delete' ? 'bg-red-600' : '')}>{act}</Button>
                 ))}
              </div>
              <Textarea value={enforceMessage} onChange={e => setEnforceMessage(e.target.value)} placeholder="Reason for penalty..." className="rounded-xl md:rounded-2xl dark:bg-slate-800 border-none min-h-[100px] md:min-h-[120px] shadow-inner font-medium p-4" />
              <Button onClick={async () => { await enforceAccountAction(selectedAccount!.id, enforceAction, enforceMessage); setIsEnforceDialogOpen(false); setSelectedAccountId(null); setEnforceMessage(""); }} disabled={isSavingStatus || !enforceMessage} className="w-full h-14 md:h-16 rounded-xl md:rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest shadow-2xl">
                 Apply Enforcement
              </Button>
           </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-sm rounded-[2rem] p-6 md:p-10 border-none shadow-2xl bg-white dark:bg-slate-900 text-center">
           <div className="w-16 h-16 md:w-20 md:h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4 md:mb-6"><AlertCircle size={32} className="md:size-10" /></div>
           <DialogTitle className="text-xl md:text-2xl font-headline font-bold">Ma hubtaa?</DialogTitle>
           <DialogDescription className="text-[10px] md:text-xs uppercase font-black text-slate-400 mt-1 md:mt-2">Action cannot be undone.</DialogDescription>
           <div className="flex gap-3 mt-6 md:mt-10">
              <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1 rounded-xl h-12 md:h-14 font-bold" disabled={isDeleting}>Maya</Button>
              <Button variant="destructive" onClick={executeDelete} className="flex-1 rounded-xl h-12 md:h-14 font-black uppercase tracking-widest shadow-lg shadow-red-500/20" disabled={isDeleting}>
                {isDeleting ? <Loader2 className="animate-spin" /> : "Haa, Tirtir"}
              </Button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Full Page Order Management View
 */
function OrderDetailView({ order, onBack, onUpdate, status, setStatus, reason, setReason, isSaving, onDelete }: any) {
  if (!order) return null;
  const item = order.items?.[0];

  const handleCopyId = () => {
    navigator.clipboard.writeText(order.id.toUpperCase());
    toast({ title: "Reference Copied" });
  };

  const handleWhatsApp = () => {
    const num = formatWhatsAppNumber(order.gameDetails?.whatsappNumber || "252613982172");
    window.open(`https://wa.me/${num}`, '_blank');
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20 max-w-4xl mx-auto">
       <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-6">
             <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <ArrowLeft size={18} />
             </button>
             <div>
                <h3 className="font-headline font-bold text-xl uppercase tracking-tighter text-slate-900 dark:text-white">Order Insight</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">REF: #{order.id.toUpperCase()}</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <StatusBadge status={order.status} />
             <button onClick={onDelete} className="w-10 h-10 flex items-center justify-center text-red-500 bg-red-50 dark:bg-red-950/20 rounded-xl hover:bg-red-100 transition-colors">
                <Trash2 size={18} />
             </button>
          </div>
       </div>

       <Card className="rounded-[3.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden px-8 py-10 md:px-14 md:py-16">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-12">
             <div>
                <h2 className="text-2xl md:text-5xl font-headline font-bold uppercase tracking-tight text-slate-900 dark:text-white mb-2">
                   {item?.title || "ACCOUNT: UNKNOWN"}
                </h2>
                <div className="flex items-center gap-4">
                   <Badge variant="outline" className="rounded-full px-4 py-1 text-[8px] font-black uppercase tracking-widest border-slate-100 dark:border-white/5">
                      {order.paymentMethod || "WHATSAPP DIRECT"}
                   </Badge>
                   <span className="text-[10px] font-black text-muted-foreground uppercase opacity-40">
                      ABOUT {formatDistanceToNow(new Date(order.createdAt))} AGO
                   </span>
                </div>
             </div>
             <div className="text-right">
                <p className="text-4xl md:text-7xl font-headline font-bold text-primary tracking-tighter">
                   ${order.total.toFixed(2)}
                </p>
             </div>
          </div>

          <div className="h-px bg-slate-50 dark:bg-white/5 w-full mb-12" />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-12 gap-x-8">
             <InsightStat label="Player ID" value={order.gameDetails?.playerID || "N/A"} icon={Gamepad2} isPrimary />
             <InsightStat label="In-Game Name" value={order.gameDetails?.playerName || "N/A"} icon={User} />
             <InsightStat label="Sender Number" value={order.gameDetails?.senderNumber || "N/A"} icon={CreditCard} />
             <InsightStat label="WhatsApp" value={order.gameDetails?.whatsappNumber || "N/A"} icon={MessageCircle} />
             <InsightStat label="Order Date" value={format(new Date(order.createdAt), "MMM d, h:mm a")} icon={Clock} />
             <InsightStat label="Category" value={order.gameDetails?.category || "Top-Up"} icon={Layers} />
             {order.promoCode && <InsightStat label="Promo Code" value={order.promoCode} icon={Ticket} isPrimary />}
          </div>
       </Card>

       <Card className="rounded-[3.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 p-8 md:p-14 space-y-10">
          <div className="flex items-center gap-4 text-primary">
             <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                <ShieldCheck size={20} />
             </div>
             <h4 className="font-headline font-bold text-lg md:text-2xl uppercase tracking-tight text-slate-900 dark:text-white">Administration Log</h4>
          </div>

          <div className="p-6 md:p-10 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800/40 border dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-full overflow-hidden relative shadow-lg ring-4 ring-white dark:ring-slate-800 shrink-0">
                   {order.processedBy?.photoURL ? <Image src={order.processedBy.photoURL} alt="" fill className="object-cover" /> : <div className="w-full h-full bg-slate-200 flex items-center justify-center font-bold text-slate-400 text-2xl">O</div>}
                </div>
                <div className="min-w-0">
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Handling Admin</p>
                   <h5 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                      {order.processedBy?.name || "Unassigned"}
                   </h5>
                   {order.processedAt && (
                      <p className="text-[9px] font-black text-primary uppercase tracking-tighter mt-1">
                         STATUS CHANGED AT {formatDistanceToNow(new Date(order.processedAt))} AGO
                      </p>
                   )}
                </div>
             </div>
             <div className="text-right shrink-0">
                <p className="text-[10px] font-black text-muted-foreground uppercase opacity-40 mb-1">Resolved on</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                   {order.completedAt ? format(new Date(order.completedAt), "MMM d, HH:mm") : "PENDING..."}
                </p>
             </div>
          </div>
       </Card>

       <Card className="rounded-[3.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 p-8 md:p-14 space-y-12">
          <div className="flex items-center gap-4 text-amber-500">
             <RefreshCw size={24} />
             <h4 className="font-headline font-bold text-lg md:text-2xl uppercase tracking-tight text-slate-900 dark:text-white">Lifecycle Control</h4>
          </div>

          <div className="space-y-8">
             <div className="space-y-3">
                <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Change Order Status</label>
                <Select value={status} onValueChange={setStatus}>
                   <SelectTrigger className="h-16 md:h-20 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 border-none px-8 font-bold text-lg shadow-inner">
                      <SelectValue />
                   </SelectTrigger>
                   <SelectContent className="rounded-2xl border-none shadow-2xl z-[200]">
                      {['pending', 'processing', 'successful', 'cancelled'].map(s => (
                        <SelectItem key={s} value={s} className="p-4 font-bold uppercase text-xs rounded-xl">{s}</SelectItem>
                      ))}
                   </SelectContent>
                </Select>
             </div>

             {status === 'cancelled' && (
               <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-[11px] font-black text-red-500 uppercase tracking-widest ml-1">Reason for User</label>
                  <Textarea 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)} 
                    placeholder="e.g. Invalid Sender Number or Wrong Player ID" 
                    className="rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 border-none min-h-[150px] p-8 font-medium shadow-inner text-lg" 
                  />
               </div>
             )}

             <Button 
                onClick={onUpdate} 
                disabled={isSaving} 
                className="w-full h-16 md:h-24 rounded-[2rem] font-black text-xl md:text-2xl uppercase tracking-widest shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all"
             >
                {isSaving ? <Loader2 className="animate-spin w-8 h-8" /> : "Save Order"}
             </Button>

             <div className="pt-8 space-y-6">
                <p className="text-[10px] font-black text-center text-muted-foreground uppercase tracking-[0.3em]">Quick Actions</p>
                <div className="grid grid-cols-2 gap-4">
                   <button onClick={handleCopyId} className="h-14 rounded-full bg-slate-50 dark:bg-slate-800 border dark:border-white/5 font-black uppercase text-[11px] tracking-widest text-slate-500 hover:bg-slate-100 transition-colors">
                      Copy ID
                   </button>
                   <button onClick={handleWhatsApp} className="h-14 rounded-full bg-slate-50 dark:bg-slate-800 border dark:border-white/5 font-black uppercase text-[11px] tracking-widest text-slate-500 hover:bg-slate-100 transition-colors">
                      WhatsApp
                   </button>
                </div>
             </div>
          </div>
       </Card>
    </div>
  );
}

/**
 * Full Page Account Listing Management View
 */
function AccountDetailView({ post, allUsers, onBack, onUpdate, status, setStatus, buyerId, setBuyerId, isSaving, onDelete, onEnforce }: any) {
  if (!post) return null;
  const claimants = Object.values(post.claimants || {});
  const { updateAccountPostStatus } = useApp();

  // Check for critical wait time > 24h
  const earliestClaim = claimants.length > 0 ? Math.min(...claimants.map((c: any) => c.timestamp)) : null;
  const isStalling = earliestClaim && (Date.now() - earliestClaim) >= 86400000 && !post.sellerReported && !post.sold;

  const handleForceSold = (uid: string) => {
    updateAccountPostStatus(post.id, 'sold', uid);
    toast({ title: "Account assigned to buyer!" });
  };

  const handleWhatsApp = (num: string) => {
    const formatted = formatWhatsAppNumber(num);
    window.open(`https://wa.me/${formatted}`, '_blank');
  };

  // Find final buyer info for confirmation banner
  const finalBuyer = useMemo(() => {
    if (post.status !== 'sold' || !post.boughtBy) return null;
    return allUsers.find((u: any) => u.uid === post.boughtBy);
  }, [post.status, post.boughtBy, allUsers]);

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20 max-w-4xl mx-auto">
       <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-6">
             <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <ArrowLeft size={18} />
             </button>
             <div>
                <h3 className="font-headline font-bold text-xl uppercase tracking-tighter text-slate-900 dark:text-white">Listing Hub</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">REF: #{post.id.toUpperCase()}</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <StatusBadge status={post.status} />
             <button onClick={onDelete} className="w-10 h-10 flex items-center justify-center text-red-500 bg-red-50 dark:bg-red-950/20 rounded-xl hover:bg-red-100 transition-colors">
                <Trash2 size={18} />
             </button>
          </div>
       </div>

       {/* Sold Confirmation Banner */}
       {post.status === 'sold' && (
         <Card className="rounded-[3rem] border-none bg-green-500 text-white p-8 md:p-12 space-y-8 md:space-y-12 animate-in zoom-in duration-500 shadow-2xl shadow-green-500/20">
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md shrink-0">
                  <PartyPopper size={40} className="md:size-12" />
               </div>
               <div>
                  <h2 className="text-2xl md:text-4xl font-headline font-bold uppercase tracking-tight leading-none">Confirmed Sale!</h2>
                  <p className="text-white/80 text-xs md:text-lg font-medium mt-1">Verified and closed successfully.</p>
               </div>
            </div>
            
            <div className="p-6 md:p-8 bg-black/10 backdrop-blur-md rounded-[2.5rem] flex items-center gap-6 border border-white/10 w-fit min-w-[280px]">
               <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden relative border-2 border-white/30 shrink-0">
                  {finalBuyer?.photoURL ? (
                    <Image src={finalBuyer.photoURL} alt="" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/10 flex items-center justify-center"><User size={24}/></div>
                  )}
               </div>
               <div>
                  <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-white/60 mb-0.5">Final Buyer</p>
                  <p className="text-xl md:text-2xl font-bold">{finalBuyer?.name || "Market User"}</p>
               </div>
            </div>
         </Card>
       )}

       {/* Critical Stalling Warning Banner */}
       {isStalling && (
         <Card className="rounded-[3rem] border-none bg-red-600 text-white p-8 md:p-12 space-y-8 animate-in slide-in-from-top-4 duration-700 shadow-2xl shadow-red-500/20">
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md shrink-0 animate-pulse">
                  <ShieldAlert size={40} className="md:size-12 text-white" />
               </div>
               <div>
                  <h2 className="text-2xl md:text-4xl font-headline font-bold uppercase tracking-tight leading-none">Seller Non-Responsive</h2>
                  <p className="text-white/80 text-xs md:text-lg font-medium mt-1">Has not responded to purchase claims for over 24 hours.</p>
               </div>
            </div>
            <div className="flex gap-4">
               <Button onClick={onEnforce} className="bg-white text-red-600 hover:bg-slate-100 font-black uppercase tracking-widest px-8 h-14 rounded-2xl shadow-xl">
                  Take Penalty Action
               </Button>
               <Button variant="ghost" onClick={() => handleWhatsApp(post.phone)} className="text-white border-2 border-white/20 hover:bg-white/10 font-bold px-8 h-14 rounded-2xl">
                  Contact Seller
               </Button>
            </div>
         </Card>
       )}

       {/* Main Account Card */}
       <Card className="rounded-[3.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
          <div className="relative aspect-video w-full p-4 sm:p-8">
             <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden shadow-inner bg-slate-100 dark:bg-slate-800">
                {post.thumbnailUrl ? (
                   <Image src={post.thumbnailUrl} alt="" fill className="object-cover" unoptimized />
                ) : (
                   <div className="w-full h-full flex items-center justify-center opacity-10"><Gamepad2 size={64} /></div>
                )}
             </div>
          </div>

          <div className="px-8 pb-10 md:px-14 md:pb-16 space-y-10">
             <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div>
                   <h2 className="text-2xl md:text-5xl font-headline font-bold uppercase tracking-tight text-slate-900 dark:text-white mb-2">
                      {post.gameType} Account
                   </h2>
                   <div className="flex items-center gap-4">
                      <Badge variant="outline" className="rounded-full px-4 py-1 text-[8px] font-black uppercase tracking-widest border-slate-100 dark:border-white/5">
                         {post.platform}
                      </Badge>
                      <span className="text-[10px] font-black text-muted-foreground uppercase opacity-40">
                         ABOUT {formatDistanceToNow(new Date(post.createdAt))} AGO
                      </span>
                </div>
             </div>
             <div className="text-right">
                <p className="text-4xl md:text-7xl font-headline font-bold text-primary tracking-tighter">
                   ${post.price.toFixed(2)}
                </p>
             </div>
          </div>

          <div className="h-px bg-slate-50 dark:bg-white/5 w-full" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-8">
             <InsightStat label="Level" value={post.level || "0"} icon={Star} />
             <InsightStat label="ID" value={`#${post.id.toUpperCase()}`} icon={Hash} />
             <InsightStat label="Wait" value={formatDistanceToNow(new Date(post.createdAt))} icon={Clock} />
             <InsightStat label="Term" value={post.term || "Weekly"} icon={CalendarIcon} />
          </div>
       </div>
    </Card>

    {/* Stakeholder Hub */}
    <Card className="rounded-[3.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 p-8 md:p-14 space-y-10">
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-primary">
             <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                <LinkIcon size={20} />
             </div>
             <h4 className="font-headline font-bold text-lg md:text-2xl uppercase tracking-tight text-slate-900 dark:text-white">Stakeholder Hub</h4>
          </div>
          <Badge className="bg-primary text-white border-none rounded-full px-6 py-2 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
             {claimants.length} LIVE REQUESTS
          </Badge>
       </div>

       <div className="space-y-6">
          {/* Seller section */}
          <div className="p-6 md:p-10 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800/40 border dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-full overflow-hidden relative shadow-lg ring-4 ring-white dark:ring-slate-800 shrink-0 bg-slate-200">
                   {post.authorAvatar ? <Image src={post.authorAvatar} alt="" fill className="object-cover" /> : <User className="m-auto mt-2 text-slate-400" />}
                </div>
                <div className="min-w-0">
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Original Seller</p>
                   <h5 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                      {post.authorName || "Market User"}
                   </h5>
                   <div className="flex flex-wrap items-center gap-3 mt-2">
                      <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full flex items-center gap-2">
                         <span className="text-[10px] font-black uppercase whitespace-nowrap">{post.phone}</span>
                         <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white cursor-pointer" onClick={() => handleWhatsApp(post.phone)}>
                            <MessageCircle size={12} />
                         </div>
                      </div>
                      {post.senderNumber && (
                         <div className="bg-amber-50 text-amber-600 border border-amber-200 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tight">
                            NUMBER KA LACAGTA (SENDER): <span className="text-slate-900 ml-1">{post.senderNumber}</span>
                         </div>
                      )}
                   </div>
                </div>
             </div>
             <div className="opacity-10 shrink-0 hidden md:block">
                <User size={48} />
             </div>
          </div>

          {/* Buyer Reports Section */}
          {claimants.length === 0 ? (
            <div className="p-12 md:p-20 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-white/5 flex flex-col items-center justify-center text-center opacity-30">
               <ShieldCheck size={48} className="mb-4" />
               <p className="font-headline font-bold text-xl uppercase tracking-widest">Waiting for buyer reports...</p>
            </div>
          ) : (
            <div className="space-y-4">
               {claimants.map((c: any) => {
                 const claimStatus = c.status || 'pending';
                 return (
                   <div key={c.uid} className={cn(
                     "p-6 md:p-8 rounded-[2.5rem] border flex flex-col sm:flex-row items-center justify-between gap-6 transition-all",
                     claimStatus === 'accepted' ? "bg-green-50 border-green-200 dark:bg-green-950/20" : 
                     claimStatus === 'rejected' ? "bg-red-50 border-red-200 dark:bg-red-950/20" : 
                     "bg-slate-50 dark:bg-slate-800/40 border-transparent dark:border-white/5 hover:bg-slate-100/50"
                   )}>
                      <div className="flex items-center gap-5 w-full sm:w-auto">
                         <div className={cn(
                           "w-16 h-16 rounded-[1.5rem] bg-white dark:bg-slate-900 border-4 shadow-lg relative overflow-hidden shrink-0 flex items-center justify-center",
                           claimStatus === 'accepted' ? "border-green-500" : claimStatus === 'rejected' ? "border-red-500" : "border-white dark:border-slate-700"
                         )}>
                            {c.photo ? <Image src={c.photo} alt="" fill className="object-cover" /> : <User className="text-slate-200" size={32} />}
                         </div>
                         <div className="min-w-0">
                            <div className="flex items-center gap-2">
                               <h5 className="text-xl font-bold text-slate-900 dark:text-white truncate">{c.name}</h5>
                               <Badge className={cn(
                                 "text-[8px] font-black uppercase px-2 py-0 h-5 border-none shadow-sm",
                                 claimStatus === 'accepted' ? "bg-green-500 text-white" : claimStatus === 'rejected' ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                               )}>
                                 {claimStatus === 'accepted' ? 'SELLER CONFIRMED' : claimStatus === 'rejected' ? 'SELLER REJECTED' : 'AWAITING SELLER'}
                               </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                               <Badge className="bg-blue-100 text-blue-600 border-none text-[8px] font-black uppercase px-2 py-0">ID: {c.uid.substring(0,8)}</Badge>
                            </div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 tracking-tight">CLAIMED: {formatDistanceToNow(new Date(c.timestamp)).toUpperCase() + " AGO"}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                         <Button 
                           variant="outline" 
                           className="flex-1 sm:flex-none h-14 px-8 rounded-2xl border-slate-200 dark:border-white/10 font-bold gap-2"
                           onClick={() => handleWhatsApp(c.whatsapp)}
                         >
                            <MessageCircle size={18} /> WhatsApp
                         </Button>
                         <Button 
                           className="flex-1 sm:flex-none h-14 px-8 rounded-2xl bg-green-600 hover:bg-green-700 font-bold gap-2 shadow-lg shadow-green-600/20"
                           onClick={() => handleForceSold(c.uid)}
                         >
                            <Check size={18} /> FORCE SOLD
                         </Button>
                      </div>
                   </div>
                 );
               })}
            </div>
          )}
       </div>
    </Card>

    {/* Lifecycle Control */}
    <Card className="rounded-[3.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 p-8 md:p-14 space-y-12">
       <div className="flex items-center gap-4 text-amber-500">
          <RefreshCw size={24} />
          <h4 className="font-headline font-bold text-lg md:text-2xl uppercase tracking-tight text-slate-900 dark:text-white">Lifecycle Control</h4>
       </div>

       <div className="space-y-8">
          <div className="space-y-3">
             <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Change Account Status</label>
             <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-16 md:h-20 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 border-none px-8 font-bold text-lg shadow-inner">
                   <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl z-[200]">
                   {['pending', 'approved', 'holding', 'sold', 'rejected'].map(s => (
                     <SelectItem key={s} value={s} className="p-4 font-bold uppercase text-xs rounded-xl">{s}</SelectItem>
                   ))}
                </SelectContent>
             </Select>
          </div>

          {/* Manual Buyer Selection if Sold */}
          {status === 'sold' && (
             <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-[11px] font-black text-primary uppercase tracking-widest ml-1">Assign Final Buyer</label>
                <Select value={buyerId} onValueChange={setBuyerId}>
                   <SelectTrigger className="h-16 md:h-20 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 border-none px-8 font-bold text-lg shadow-inner">
                      <SelectValue placeholder="Select User..." />
                   </SelectTrigger>
                   <SelectContent className="rounded-2xl border-none shadow-2xl z-[200]">
                      <div className="max-h-[300px] overflow-y-auto">
                         {allUsers.map((u: any) => (
                           <SelectItem key={u.uid} value={u.uid} className="p-4 font-bold uppercase text-xs rounded-xl">
                              {u.name || "Unknown User"} ({u.phoneNumber || u.email})
                           </SelectItem>
                         ))}
                      </div>
                   </SelectContent>
                </Select>
                <p className="text-[9px] font-bold text-slate-400 italic ml-1">Admin can manually assign any registered user as the buyer.</p>
             </div>
          )}

          <Button 
             onClick={onUpdate} 
             disabled={isSaving} 
             className="w-full h-16 md:h-24 rounded-[2rem] font-black text-xl md:text-2xl uppercase tracking-widest shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
             {isSaving ? <Loader2 className="animate-spin w-8 h-8" /> : "SAVE LOGIC"}
          </Button>
       </div>
    </Card>
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

function InsightStat({ label, value, icon: Icon, isPrimary }: any) {
  return (
    <div className="space-y-2">
       <div className="flex items-center gap-2 text-muted-foreground">
          <Icon size={14} className="opacity-40" />
          <p className="text-[9px] font-black uppercase tracking-[0.2em]">{label}</p>
       </div>
       <p className={cn(
         "text-sm md:text-xl font-bold truncate",
         isPrimary ? "text-primary" : "text-slate-900 dark:text-white"
       )}>{value}</p>
    </div>
  );
}

function SettingInput({ label, value, onChange, placeholder, type = "text" }: { label: string, value: string, onChange: (v: string) => void, placeholder: string, type?: string }) {
  return (
    <div className="space-y-2">
       <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">{label}</Label>
       <Input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} className="h-12 md:h-16 rounded-xl md:rounded-2xl border-none bg-slate-50 dark:bg-slate-800 font-bold px-4 md:px-6 shadow-inner text-sm md:text-lg focus:ring-primary transition-all" />
    </div>
  );
}
