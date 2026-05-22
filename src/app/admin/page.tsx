
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
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  Loader2,
  Lock,
  Menu,
  ChevronRight,
  Gamepad2,
  Search,
  Box,
  AlertCircle,
  RefreshCw,
  Clock,
  ArrowRight,
  Eye,
  CreditCard,
  Hash,
  Smartphone,
  MessageCircle,
  Home,
  ShieldAlert,
  Video,
  Bell,
  ChevronLeft,
  Trophy,
  Megaphone,
  UserCircle,
  Tag,
  Sword,
  Target,
  Zap,
  Bomb,
  History,
  AlertTriangle,
  Send,
  Copy,
  Check,
  PartyPopper,
  HandCoins,
  ShieldQuestion,
  Layers,
  Sparkles,
  Info,
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
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
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
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${d}d ${h}h ${m}m`);
      }
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [expiresAt, status]);

  if (status === 'sold') {
    return <Badge variant="outline" className="text-[10px] text-green-500 border-green-200 font-black uppercase tracking-widest">Sale Closed</Badge>;
  }

  if (status === 'pending' || status === 'processing') {
    return <Badge variant="outline" className="text-[10px] opacity-40 font-black uppercase tracking-widest">Clock Paused</Badge>;
  }

  if (status === 'rejected') {
     return <Badge variant="outline" className="text-[10px] text-red-500 border-red-200 font-black uppercase tracking-widest">Stopped</Badge>;
  }

  if (!expiresAt) {
    return <Badge variant="outline" className="text-[10px] opacity-40 font-black uppercase tracking-widest">Not Started</Badge>;
  }

  return (
    <div className="flex flex-col gap-0.5">
      <span className={cn("text-[10px] font-bold uppercase tracking-tight", timeLeft === 'EXPIRED' ? "text-red-500" : "text-primary")}>
        {timeLeft}
      </span>
      <span className="text-[8px] text-muted-foreground uppercase font-black opacity-60">Ends {format(new Date(expiresAt), 'MMM d')}</span>
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

  const paymentMethods = useMemo(() => {
    if (!storeSettings?.paymentMethods) return [];
    return Object.entries(storeSettings.paymentMethods).map(([id, m]) => ({ ...m, id }));
  }, [storeSettings?.paymentMethods]);

  const [activeView, setActiveView] = useState<'dashboard' | 'orders' | 'inventory' | 'account-posts' | 'events' | 'users' | 'settings'>('dashboard');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  const [isGameDialogOpen, setIsGameDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isBannerDialogOpen, setIsBannerDialogOpen] = useState(false);
  const [isPaymentMethodDialogOpen, setIsPaymentMethodDialogOpen] = useState(false);
  const [isUserManageOpen, setIsUserManageOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEnforceDialogOpen, setIsEnforceDialogOpen] = useState(false);

  const [editingGame, setEditingGame] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [pendingOrderStatus, setPendingStatus] = useState<string>("");
  const [cancellationReason, setCancellationReason] = useState<string>("");
  
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [pendingAccountStatus, setPendingAccountStatus] = useState<string>("");
  const [assignBuyerId, setAssignBuyerId] = useState<string>("");
  const [enforceMessage, setEnforceMessage] = useState("");
  const [enforceAction, setEnforceAction] = useState<'delete' | 'holding' | 'approved' | 'pending'>('delete');

  const [deleteTarget, setDeleteTarget] = useState<{ id: string, type: 'user' | 'game' | 'product' | 'event' | 'banner' | 'account' | 'order' | 'payment' } | null>(null);

  const [gameForm, setGameForm] = useState({ title: "", icon: "", category: "top-up" });
  const [productForm, setProductForm] = useState({ title: "", gameId: "", category: "top-up" as any, description: "", price: "", discountedPrice: "", thumbnail: "", whatsappNumber: "" });
  const [eventForm, setEventForm] = useState({ 
    title: "", 
    shortDescription: "", 
    content: "", 
    thumbnailUrl: "", 
    type: "freefire_event" as any, 
    active: true,
    duration: "",
    durationUnit: "days"
  });
  const [bannerForm, setBannerForm] = useState({ imageUrl: "", linkTo: "" });
  const [paymentMethodForm, setPaymentMethodForm] = useState({ name: "", icon: "", ussdTemplate: "", active: true });

  const [pointAdjustment, setPointAdjustment] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");

  const [accountSearchQuery, setAccountSearchQuery] = useState("");
  const [accountStatusFilter, setAccountStatusFilter] = useState<string>("all");

  const [userSearchQuery, setUserSearchQuery] = useState("");

  const [helpLinksForm, setHelpLinksForm] = useState({
    tutorialUrl: "",
    whatsappNumber: "",
    tiktokUrl: ""
  });

  const [emailConfigForm, setEmailConfigForm] = useState({
    senderEmail: "",
    appPassword: ""
  });

  const [appStatusForm, setAppStatusForm] = useState({
    offline: false,
    offlineTitle: "",
    offlineBody: "",
    offlineImageUrl: ""
  });

  const [feeConfigForm, setFeeConfigForm] = useState({
    listingFeeWeekly: 1,
    listingFeeMonthly: 3,
  });

  const [termsForm, setTermsForm] = useState({
    en: "",
    so: ""
  });

  useEffect(() => {
    if (!loading && !user?.isAdmin) {
      router.replace('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (storeSettings) {
      if (storeSettings.helpLinks) {
        setHelpLinksForm({
          tutorialUrl: storeSettings.helpLinks.tutorialUrl || "",
          whatsappNumber: storeSettings.helpLinks.whatsappNumber || "",
          tiktokUrl: storeSettings.helpLinks.tiktokUrl || ""
        });
      }
      if (storeSettings.emailConfig) {
        setEmailConfigForm({
          senderEmail: storeSettings.emailConfig.senderEmail || "",
          appPassword: storeSettings.emailConfig.appPassword || ""
        });
      }
      if (storeSettings.appStatus) {
        setAppStatusForm({
          offline: storeSettings.appStatus.offline || false,
          offlineTitle: storeSettings.appStatus.offlineTitle || "",
          offlineBody: storeSettings.appStatus.offlineBody || "",
          offlineImageUrl: storeSettings.appStatus.offlineImageUrl || ""
        });
      }
      if (storeSettings.config?.shop) {
        setFeeConfigForm({
          listingFeeWeekly: storeSettings.config.shop.listingFeeWeekly || 1,
          listingFeeMonthly: storeSettings.config.shop.listingFeeMonthly || 3,
        });
      }
      if (storeSettings.termsAndConditions) {
        setTermsForm({
          en: storeSettings.termsAndConditions.en || "",
          so: storeSettings.termsAndConditions.so || ""
        });
      }
    }
  }, [storeSettings]);

  const selectedAccount = useMemo(() => {
    if (!selectedAccountId) return null;
    return accountPosts.find(p => p.id === selectedAccountId);
  }, [selectedAccountId, accountPosts]);

  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return allOrders.find(o => o.id === selectedOrderId);
  }, [selectedOrderId, allOrders]);

  const urgentAccounts = useMemo(() => {
    const now = Date.now();
    return accountPosts.filter(p => {
       const hasUnansweredClaim = Object.values(p.claimants || {}).some(c => (now - c.timestamp) > 86400000);
       return hasUnansweredClaim && !p.sold && (p.status === 'approved' || p.status === 'holding');
    });
  }, [accountPosts]);

  const sortedAndFilteredAccounts = useMemo(() => {
    return [...accountPosts]
      .filter(p => {
        const matchesSearch = p.authorName?.toLowerCase().includes(accountSearchQuery.toLowerCase()) || 
                             p.gameType?.toLowerCase().includes(accountSearchQuery.toLowerCase()) ||
                             p.id.toLowerCase().includes(accountSearchQuery.toLowerCase());
        const matchesStatus = accountStatusFilter === "all" || p.status === accountStatusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [accountPosts, accountSearchQuery, accountStatusFilter]);

  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => 
      u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
      u.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.uid.toLowerCase().includes(userSearchQuery.toLowerCase())
    ).sort((a, b) => (b.points || 0) - (a.points || 0));
  }, [allUsers, userSearchQuery]);

  const handleOpenAccountPage = (id: string) => {
    const acc = accountPosts.find(p => p.id === id);
    if (!acc) return;
    setSelectedAccountId(id);
    setPendingAccountStatus(acc.status);
    const claimants = Object.values(acc.claimants || {});
    const winner = claimants.find(c => c.status === 'accepted');
    setAssignBuyerId(acc.boughtBy || acc.holdingBy || (winner ? winner.uid : claimants.length > 0 ? claimants[0].uid : ""));
  };

  const handleOpenGameDialog = (game?: any) => {
    if (game) {
      setEditingGame(game);
      setGameForm({ title: game.title, icon: game.icon || "", category: game.category || "top-up" });
    } else {
      setEditingGame(null);
      setGameForm({ title: "", icon: "", category: "top-up" });
    }
    setIsGameDialogOpen(true);
  };

  const handleOpenProductDialog = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({ 
        ...product, 
        price: product.price?.toString(), 
        discountedPrice: product.discountedPrice?.toString() || "",
        category: product.category || "top-up",
        whatsappNumber: product.whatsappNumber || ""
      });
    } else {
      setEditingProduct(null);
      setProductForm({ title: "", gameId: selectedGameId || "", category: "top-up", description: "", price: "", discountedPrice: "", thumbnail: "", whatsappNumber: "" });
    }
    setIsProductDialogOpen(true);
  };

  const handleOpenEventDialog = (ev?: any) => {
    if (ev) {
      setEditingEvent(ev);
      setEventForm({
        ...ev,
        duration: "",
        durationUnit: "days"
      });
    } else {
      setEditingEvent(null);
      setEventForm({ title: "", shortDescription: "", content: "", thumbnailUrl: "", type: "freefire_event", active: true, duration: "", durationUnit: "days" });
    }
    setIsEventDialogOpen(true);
  };

  const handleOpenPaymentMethodDialog = (method?: any) => {
    if (method) {
      setEditingPaymentMethod(method);
      setPaymentMethodForm({ name: method.name, icon: method.icon || "", ussdTemplate: method.ussdTemplate || "", active: method.active ?? true });
    } else {
      setEditingPaymentMethod(null);
      setPaymentMethodForm({ name: "", icon: "", ussdTemplate: "", active: true });
    }
    setIsPaymentMethodDialogOpen(true);
  };

  const handleOpenOrderPage = (order: any) => {
    setSelectedOrderId(order.id);
    setPendingStatus(order.status);
    setCancellationReason(order.cancellationReason || "");
  };

  const confirmDelete = (id: string, type: 'user' | 'game' | 'product' | 'event' | 'banner' | 'account' | 'order' | 'payment') => {
    setDeleteTarget({ id, type });
    setIsDeleteDialogOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'user') await deleteUserFn(deleteTarget.id);
      if (deleteTarget.type === 'game') await deleteGame(deleteTarget.id);
      if (deleteTarget.type === 'product') await deleteProduct(deleteTarget.id);
      if (deleteTarget.type === 'event') await deleteEvent(deleteTarget.id);
      if (deleteTarget.type === 'banner') await deleteBanner(deleteTarget.id);
      if (deleteTarget.type === 'order') await deleteOrder(deleteTarget.id);
      if (deleteTarget.type === 'account') await deleteAccountPost(deleteTarget.id);
      if (deleteTarget.type === 'payment') await deletePaymentMethod(deleteTarget.id);
      toast({ title: "Deleted Successfully" });
      if (deleteTarget.type === 'account') setSelectedAccountId(null);
      if (deleteTarget.type === 'order') setSelectedOrderId(null);
    } finally {
      setDeleteTarget(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleSaveGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      await saveGame({ ...gameForm, id: editingGame?.id });
      toast({ title: "Game Collection Saved" });
      setIsGameDialogOpen(false);
    } finally { setIsUploading(false); }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      await saveProduct({ 
        ...productForm, 
        price: parseFloat(productForm.price),
        discountedPrice: productForm.discountedPrice ? parseFloat(productForm.discountedPrice) : undefined,
        id: editingProduct?.id
      });
      toast({ title: "Item Saved" });
      setIsProductDialogOpen(false);
    } catch (err) { 
      toast({ title: "Save Failed", variant: "destructive" }); 
    } finally { 
      setIsUploading(false); 
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      await saveEvent({ ...eventForm, id: editingEvent?.id });
      toast({ title: "Event Saved" });
      setIsEventDialogOpen(false);
    } finally { setIsUploading(false); }
  };

  const handleSavePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      await savePaymentMethod({ ...paymentMethodForm, id: editingPaymentMethod?.id });
      setIsPaymentMethodDialogOpen(false);
    } finally { setIsUploading(false); }
  };

  const handleSaveBanner = async () => {
    if (!bannerForm.imageUrl) return;
    setIsUploading(true);
    try {
      await saveBanner(bannerForm);
      toast({ title: "Banner Added" });
      setBannerForm({ imageUrl: "", linkTo: "" });
      setIsBannerDialogOpen(false);
    } finally { setIsUploading(false); }
  };

  const handleSaveHelpLinks = async () => {
    setIsUploading(true);
    try {
      await updateStoreSettings({ helpLinks: helpLinksForm });
      toast({ title: "Support links updated" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveEmailConfig = async () => {
    setIsUploading(true);
    try {
      await updateStoreSettings({ emailConfig: emailConfigForm });
      toast({ title: "Email service updated" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveAppStatus = async () => {
    setIsUploading(true);
    try {
      await updateStoreSettings({ appStatus: appStatusForm });
      toast({ title: "App status updated" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveFees = async () => {
    setIsUploading(true);
    try {
      await updateStoreSettings({ config: { ...storeSettings.config, shop: { ...storeSettings.config?.shop, ...feeConfigForm } } });
      toast({ title: "Fee settings updated" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveTerms = async () => {
    setIsUploading(true);
    try {
      await updateStoreSettings({ termsAndConditions: termsForm });
      toast({ title: "Terms & Conditions updated" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAdjustPoints = async (type: 'credit' | 'debit') => {
    if (!selectedUser || !pointAdjustment) return;
    const amount = parseInt(pointAdjustment);
    const newPoints = (selectedUser.points || 0) + (type === 'credit' ? amount : -amount);
    await manageUser(selectedUser.uid, { points: newPoints });
    setSelectedUser({ ...selectedUser, points: newPoints });
    setPointAdjustment("");
    toast({ title: `Points ${type === 'credit' ? 'Credited' : 'Debited'}` });
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;
    const isBanned = !selectedUser.banned;
    await manageUser(selectedUser.uid, { banned: isBanned });
    setSelectedUser({ ...selectedUser, banned: isBanned });
    toast({ title: isBanned ? "User Banned" : "User Unbanned", variant: isBanned ? "destructive" : "default" });
  };

  const handleStatusSave = async () => {
    if (!selectedOrderId || !pendingOrderStatus) return;
    setIsSavingStatus(true);
    try {
      await updateOrderStatus(selectedOrderId, pendingOrderStatus, pendingOrderStatus === 'cancelled' ? cancellationReason : undefined);
      toast({ title: `Order set to ${pendingOrderStatus}` });
      setSelectedOrderId(null);
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleAccountStatusSave = async () => {
    if (!selectedAccount || !pendingAccountStatus) return;
    setIsSavingStatus(true);
    try {
      await updateAccountPostStatus(selectedAccount.id, pendingAccountStatus, pendingAccountStatus === 'sold' ? assignBuyerId : undefined);
      toast({ title: `Listing set to ${pendingAccountStatus}` });
      setSelectedAccountId(null);
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleForceSold = async (buyerId: string, buyerName: string) => {
    if (!selectedAccount) return;
    setPendingAccountStatus('sold');
    setAssignBuyerId(buyerId);
    setIsSavingStatus(true);
    try {
      await updateAccountPostStatus(selectedAccount.id, 'sold', buyerId);
      toast({ title: `Successfully sold to ${buyerName}` });
      setSelectedAccountId(null);
    } catch (e) {
      toast({ title: "Failed to perform force sold", variant: "destructive" });
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleEnforceAccountPenalty = async () => {
    if (!selectedAccount || !enforceMessage) return;
    setIsSavingStatus(true);
    try {
      await enforceAccountAction(selectedAccount.id, enforceAction, enforceMessage);
      setIsEnforceDialogOpen(false);
      setSelectedAccountId(null);
      setEnforceMessage("");
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleImageUpload = async (file: File, target: 'game' | 'product' | 'event' | 'banner' | 'offline' | 'logo' | 'onboarding' | 'payment') => {
    setIsUploading(true);
    try {
      const url = await uploadToImgbb(file);
      if (target === 'game') setGameForm(g => ({ ...g, icon: url }));
      if (target === 'product') setProductForm(p => ({ ...p, thumbnail: url }));
      if (target === 'event') setEventForm(e => ({ ...e, thumbnailUrl: url }));
      if (target === 'banner') setBannerForm(b => ({ ...b, imageUrl: url }));
      if (target === 'payment') setPaymentMethodForm(p => ({ ...p, icon: url }));
      if (target === 'offline') setAppStatusForm(a => ({ ...a, offlineImageUrl: url }));
      if (target === 'logo') updateStoreSettings({ logo: url });
      toast({ title: "Image Uploaded" });
      return url;
    } catch (e) { 
      toast({ title: "Upload Failed", variant: "destructive" }); 
    } finally { 
      setIsUploading(false); 
    }
  };

  const handleOnboardingImageUpload = async (file: File, index: number) => {
    const url = await handleImageUpload(file, 'onboarding');
    if (url) {
      const newImages = [...(storeSettings.onboardingImages || ['', '', ''])];
      newImages[index] = url;
      updateStoreSettings({ onboardingImages: newImages });
      toast({ title: `Onboarding Step ${index + 1} Image Updated` });
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: "La koobiyey!", description: "Field copied to clipboard." });
  };

  const getSmartTimestamp = (ts: number | undefined) => {
    if (!ts) return "Not Yet";
    const date = new Date(ts);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    if (diffInHours < 24) return formatDistanceToNow(date, { addSuffix: true });
    return format(date, 'MMM d h:mm a');
  };

  if (loading || isInitialLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">Waking Oskar Control...</p>
      </div>
    );
  }

  if (!user?.isAdmin) return null;

  const metrics = {
    revenue: allOrders.filter(o => o.status === 'successful').reduce((acc, o) => acc + (o.total || 0), 0),
    orders: allOrders.length,
    users: allUsers.length,
    inventory: products.length,
    pendingCount: allOrders.filter(o => o.status === 'pending').length + accountPosts.filter(p => p.status === 'pending').length
  };

  const filteredOrders = allOrders.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(searchQuery.toLowerCase()) || o.gameDetails?.playerName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = orderStatusFilter === "all" || o.status === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': case 'successful': case 'sold': return "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400";
      case 'pending': return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400";
      case 'processing': case 'holding': return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400";
      default: return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400";
    }
  };

  const unreadAdminNotifs = adminNotifications.filter(n => !n.readBy?.[user.uid]).length;

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full">
      {isMobile && (
        <SheetHeader className="p-4 border-b dark:border-white/5">
          <SheetTitle className="font-headline font-bold text-lg text-slate-900 dark:text-white">Oskar Navigation</SheetTitle>
        </SheetHeader>
      )}
      {!isMobile && (
        <div className="h-20 px-6 flex items-center justify-between shrink-0">
          {isSidebarExpanded && <span className="font-headline font-bold text-lg text-slate-900 dark:text-white">Oskar Control</span>}
          <button onClick={() => setIsSidebarExpanded(!isSidebarExpanded)} className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"><Menu size={20} /></button>
        </div>
      )}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-hide">
        <SideNavItem icon={Home} label="Back to Store" active={false} expanded={isSidebarExpanded || isMobile} onClick={() => router.push('/')} className="text-primary hover:bg-primary/5 mb-4" />
        <div className="h-px bg-slate-50 dark:bg-white/5 my-4 mx-2" />
        <SideNavItem icon={LayoutDashboard} label="Dashboard" active={activeView === 'dashboard'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveView('dashboard'); setIsMobileMenuOpen(false); setSelectedAccountId(null); setSelectedOrderId(null); }} />
        <SideNavItem icon={ShoppingBag} label="Orders" active={activeView === 'orders'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveView('orders'); setIsMobileMenuOpen(false); setSelectedAccountId(null); }} badge={allOrders.filter(o => o.status === 'pending').length} />
        <SideNavItem icon={Gamepad2} label="Marketplace" active={activeView === 'account-posts'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveView('account-posts'); setIsMobileMenuOpen(false); setSelectedOrderId(null); }} badge={accountPosts.filter(p => p.status === 'pending' || p.conflict || p.buyerReported).length} />
        <SideNavItem icon={Package} label="Inventory" active={activeView === 'inventory'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveView('inventory'); setIsMobileMenuOpen(false); setSelectedAccountId(null); setSelectedOrderId(null); }} />
        <SideNavItem icon={Megaphone} label="Live Events" active={activeView === 'events'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveView('events'); setIsMobileMenuOpen(false); setSelectedAccountId(null); setSelectedOrderId(null); }} />
        <SideNavItem icon={Users} label="Users" active={activeView === 'users'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveView('users'); setIsMobileMenuOpen(false); setSelectedAccountId(null); setSelectedOrderId(null); }} badge={allUsers.filter(u => u.banned).length} />
        <SideNavItem icon={SettingsIcon} label="Settings" active={activeView === 'settings'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveView('settings'); setIsMobileMenuOpen(false); setSelectedAccountId(null); setSelectedOrderId(null); }} />
      </nav>
      <div className="p-4 border-t dark:border-white/5 shrink-0">
        <button onClick={logout} className="w-full h-12 flex items-center gap-4 text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 px-4"><LogOut size={20} /><span className={cn("font-bold text-sm", (!isSidebarExpanded && !isMobile) && "hidden")}>Logout</span></button>
      </div>
    </div>
  );

  const chartData = [ { day: 'MON', value: 400 }, { day: 'TUE', value: 300 }, { day: 'WED', value: 500 }, { day: 'THU', value: 450 }, { day: 'FRI', value: 700 }, { day: 'SAT', value: 650 }, { day: 'SUN', value: 800 } ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex overflow-hidden">
      <aside className={cn("hidden md:flex h-screen bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-white/5 flex-col transition-all duration-300 z-40", isSidebarExpanded ? "w-64" : "w-20")}><SidebarContent /></aside>

      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-72 bg-white dark:bg-slate-900 border-none">
          <SidebarContent isMobile={true} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <header className="h-20 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-b dark:border-white/5 flex items-center justify-between px-4 sm:px-6 md:px-10 shrink-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl" onClick={() => setIsMobileMenuOpen(true)}><Menu size={24} /></button>
            <h2 className="text-base sm:text-xl font-headline font-bold uppercase tracking-tight text-slate-900 dark:text-white truncate">{activeView.replace('-', ' ')}</h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative p-2.5 bg-slate-50 dark:bg-slate-target-800 rounded-full text-slate-500 hover:text-primary transition-colors focus:outline-none">
                  <Bell size={20} />
                  {unreadAdminNotifs > 0 && <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">{unreadAdminNotifs > 9 ? '9+' : unreadAdminNotifs}</span>}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 rounded-2xl border-none shadow-2xl bg-white dark:bg-slate-900">
                <div className="p-4 border-b dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 rounded-t-2xl">
                  <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">Admin Alerts</h3>
                  <Button variant="ghost" size="sm" onClick={() => markAdminNotificationsAsRead()} className="h-7 text-[10px] font-black uppercase text-primary hover:bg-primary/5">Mark Read</Button>
                </div>
                <div className="max-h-[400px] overflow-y-auto p-2 space-y-1 scrollbar-hide">
                  {adminNotifications.length === 0 ? (
                    <div className="py-12 text-center flex flex-col items-center gap-2 opacity-30">
                       <Bell size={24} />
                       <p className="text-[10px] font-bold uppercase tracking-widest">No active alerts</p>
                    </div>
                  ) : (
                    adminNotifications.map(n => (
                      <div key={n.id} className={cn("p-4 rounded-xl transition-all border border-transparent", n.readBy?.[user.uid] ? "opacity-50" : "bg-primary/5 hover:bg-primary/10 border-primary/10")}>
                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{n.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{n.body}</p>
                        <div className="flex items-center gap-1.5 mt-2 opacity-60">
                           <Clock size={10} />
                           <p className="text-[8px] font-black uppercase tracking-tighter">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

             <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 rounded-full cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors" onClick={refreshAdminData}><RefreshCw size={12} className="animate-spin" /><span className="text-[10px] font-bold uppercase">Live</span></div>
            <div className="flex items-center gap-2 sm:gap-3"><div className="text-right hidden xs:block"><p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-[100px]">{user?.name}</p><p className="text-[9px] sm:text-[10px] text-primary uppercase font-bold">{user?.role}</p></div><div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-sm overflow-hidden relative shrink-0">{user?.photoURL ? <Image src={user.photoURL} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600"><User size={16} /></div>}</div></div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 space-y-6 sm:space-y-10 scrollbar-hide">
          {activeView === 'dashboard' && (
            <div className="space-y-6 sm:space-y-10">
              <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"><StatCard label="Revenue" value={`$${metrics.revenue.toFixed(2)}`} icon={DollarSign} color="blue" /><StatCard label="Pending Items" value={metrics.pendingCount.toString()} icon={ShoppingBag} color="amber" badge={metrics.pendingCount > 0} /><StatCard label="Users" value={metrics.users.toString()} icon={Users} color="emerald" /><StatCard label="Inventory" value={metrics.inventory.toString()} icon={Package} color="indigo" /></div>
              <Card className="rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-6 md:p-10 border-none shadow-xl bg-white dark:bg-slate-900 h-[300px] sm:h-[400px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.1} /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10}} /><YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10}} /><Tooltip contentStyle={{backgroundColor: '#1E293B', border: 'none', borderRadius: '12px', color: '#fff'}} itemStyle={{color: '#0EA5E9'}} /><Area type="monotone" dataKey="value" stroke="#0EA5E9" fillOpacity={0.1} fill="#0EA5E9" strokeWidth={4} /></AreaChart></ResponsiveContainer></Card>
            </div>
          )}

          {activeView === 'orders' && !selectedOrderId && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div className="relative w-full max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="Search ID or Player..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-11 h-12 rounded-xl dark:bg-slate-900 dark:border-white/5 font-bold" />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full sm:w-auto">
                    {["all", "pending", "processing", "successful", "cancelled"].map(s => (
                      <Button key={s} variant={orderStatusFilter === s ? "default" : "outline"} onClick={() => orderStatusFilter === s ? setOrderStatusFilter("all") : setOrderStatusFilter(s)} className="rounded-full h-10 px-6 uppercase font-black text-[10px] shrink-0 dark:border-white/5">{s}</Button>
                    ))}
                  </div>
                </div>
              </div>
              <Card className="rounded-[1.5rem] sm:rounded-[2rem] border-none shadow-xl overflow-hidden bg-white dark:bg-slate-900">
                <div className="overflow-x-auto scrollbar-hide">
                  <Table className="min-w-[800px]">
                    <TableHeader className="bg-slate-50/50 dark:bg-slate-800/40">
                      <TableRow className="border-none">
                        <TableHead className="font-bold px-4 sm:px-8">Reference</TableHead>
                        <TableHead className="font-bold">Player & Item</TableHead>
                        <TableHead className="font-bold">Admin Handling</TableHead>
                        <TableHead className="font-bold">Status</TableHead>
                        <TableHead className="text-right px-4 sm:px-8">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-40 text-center text-slate-400 italic">No orders matching filters.</TableCell>
                        </TableRow>
                      ) : (
                        filteredOrders.map(o => (
                          <TableRow key={o.id} className="border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <TableCell className="px-4 sm:px-8 font-mono text-[10px] font-bold text-primary relative">
                              {o.status === 'pending' && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />}
                              #{o.id.toUpperCase()}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-[120px]">{o.gameDetails?.playerName || o.gameDetails?.name || "Client"}</span>
                                <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase truncate max-w-[120px]">{o.items?.[0]?.title}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {o.processedBy ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative border border-white dark:border-white/10">
                                    {o.processedBy.photoURL ? <Image src={o.processedBy.photoURL} alt="" fill className="object-cover" /> : <User size={12} className="m-auto mt-1" />}
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 truncate max-w-[80px]">{o.processedBy.name}</span>
                                </div>
                              ) : <span className="text-[10px] text-slate-300 italic">Unassigned</span>}
                            </TableCell>
                            <TableCell><Badge className={cn("rounded-full uppercase text-[8px] font-bold border-none", getStatusBadge(o.status))}>{o.status}</Badge></TableCell>
                            <TableCell className="text-right px-4 sm:px-8">
                              <div className="flex justify-end gap-1 sm:gap-2">
                                <Button size="sm" onClick={() => handleOpenOrderPage(o)} className="rounded-full h-8 px-2 sm:px-4 font-bold text-[9px] sm:text-[10px] gap-1 sm:gap-2 shrink-0"><Eye size={12} /> <span className="hidden xs:inline">Details</span></Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 shrink-0" onClick={() => confirmDelete(o.id, 'order')}><Trash2 size={16} /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          )}

          {activeView === 'orders' && selectedOrderId && selectedOrder && (
            <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-500">
               <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b dark:border-white/5 flex items-center justify-between px-4 sm:px-10 shrink-0">
                  <div className="flex items-center gap-4">
                     <Button variant="ghost" onClick={() => setSelectedOrderId(null)} className="rounded-full h-12 w-12 p-0">
                        <ChevronLeft className="w-8 h-8" />
                     </Button>
                     <div>
                       <h3 className="font-headline font-bold text-xl md:text-2xl dark:text-white uppercase tracking-tight">Order Insight</h3>
                       <p className="text-[10px] font-bold text-muted-foreground uppercase">Ref: #{selectedOrder.id.toUpperCase()}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <Badge className={cn("rounded-full px-4 py-1 uppercase font-black text-[10px]", getStatusBadge(selectedOrder.status))}>{selectedOrder.status}</Badge>
                     <Button size="icon" variant="ghost" className="text-red-500" onClick={() => confirmDelete(selectedOrder.id, 'order')}><Trash2 size={20} /></Button>
                  </div>
               </header>

               <div className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-8 scrollbar-hide pb-32">
                  <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                     <div className="lg:col-span-2 space-y-8">
                        <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 p-8 md:p-12 space-y-10">
                           <div className="flex justify-between items-start">
                              <div className="space-y-2">
                                 <h4 className="text-2xl md:text-4xl font-headline font-bold uppercase tracking-tight">{selectedOrder.items?.[0]?.title || "Game Package"}</h4>
                                 <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="font-black text-[10px] tracking-widest uppercase">{selectedOrder.paymentMethod}</Badge>
                                    <span className="text-xs font-bold text-muted-foreground uppercase">{getSmartTimestamp(selectedOrder.createdAt)}</span>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="text-3xl md:text-5xl font-headline font-bold text-primary tracking-tighter">${selectedOrder.total?.toFixed(2)}</p>
                              </div>
                           </div>

                           <div className="grid grid-cols-2 md:grid-cols-3 gap-8 pt-8 border-t dark:border-white/5">
                              <DetailItem icon={Gamepad2} label="Player ID" value={selectedOrder.gameDetails?.playerID || "N/A"} color="text-primary font-mono" />
                              <DetailItem icon={User} label="In-Game Name" value={selectedOrder.gameDetails?.playerName || "N/A"} />
                              <DetailItem icon={CreditCard} label="Sender Number" value={selectedOrder.gameDetails?.senderNumber || "N/A"} />
                              <DetailItem icon={Smartphone} label="WhatsApp" value={selectedOrder.gameDetails?.whatsappNumber || "N/A"} />
                              <DetailItem icon={Clock} label="Order Date" value={format(new Date(selectedOrder.createdAt), 'MMM d, h:mm a')} />
                              <DetailItem icon={Tag} label="Category" value={selectedOrder.gameDetails?.category || "Top-Up"} />
                           </div>
                        </Card>

                        <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 p-8 md:p-12 space-y-8">
                           <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-500"><ShieldCheck size={24}/></div>
                              <h4 className="font-headline font-bold text-xl md:text-2xl uppercase">Administration Log</h4>
                           </div>
                           
                           {selectedOrder.processedBy ? (
                             <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-[2rem] border dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                   <div className="w-14 h-14 rounded-full overflow-hidden relative border-2 border-white dark:border-slate-800 shadow-lg">
                                      {selectedOrder.processedBy.photoURL ? <Image src={selectedOrder.processedBy.photoURL} alt="" fill className="object-cover" /> : <User size={24} className="m-auto mt-2 opacity-20" />}
                                   </div>
                                   <div>
                                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">Handling Admin</p>
                                      <p className="text-lg font-bold">{selectedOrder.processedBy.name}</p>
                                      <p className="text-[10px] font-bold text-primary uppercase mt-1">Status changed at {getSmartTimestamp(selectedOrder.processedAt)}</p>
                                   </div>
                                </div>
                                {selectedOrder.completedAt && (
                                   <div className="text-right">
                                      <p className="text-[10px] font-black uppercase text-muted-foreground opacity-40">Resolved on</p>
                                      <p className="text-xs font-bold">{format(new Date(selectedOrder.completedAt), 'MMM d, HH:mm')}</p>
                                   </div>
                                )}
                             </div>
                           ) : (
                             <div className="py-12 text-center opacity-30 italic flex flex-col items-center gap-4 bg-slate-50/50 dark:bg-slate-800/20 rounded-[2rem] border-2 border-dashed">
                                <ShieldQuestion size={48} className="text-slate-300" />
                                <p className="text-lg font-bold uppercase tracking-widest">Awaiting Assignment...</p>
                             </div>
                           )}

                           {selectedOrder.status === 'cancelled' && selectedOrder.cancellationReason && (
                              <div className="p-6 bg-red-50 dark:bg-red-950/20 border-2 border-red-100 dark:border-red-900/30 rounded-[2rem] space-y-2">
                                 <p className="text-[10px] font-black uppercase text-red-500 tracking-widest">Reason for Cancellation</p>
                                 <p className="text-sm font-medium italic text-red-700 dark:text-red-400">"{selectedOrder.cancellationReason}"</p>
                              </div>
                           )}
                        </Card>
                     </div>

                     <div className="space-y-8">
                        <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 p-8 space-y-8 sticky top-8">
                           <div className="space-y-6">
                              <div className="flex items-center gap-3">
                                 <RefreshCw className="text-amber-500" size={24} />
                                 <h4 className="font-bold text-lg uppercase tracking-tight">Lifecycle Control</h4>
                              </div>
                              <div className="space-y-5">
                                 <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Change Order Status</Label>
                                    <Select value={pendingOrderStatus} onValueChange={setPendingStatus}>
                                       <SelectTrigger className="h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-6 font-bold text-base shadow-inner"><SelectValue /></SelectTrigger>
                                       <SelectContent className="rounded-2xl border-none shadow-2xl z-[200]">
                                          {["pending", "processing", "successful", "cancelled"].map(s => <SelectItem key={s} value={s} className="rounded-xl uppercase font-bold text-xs p-3">{s}</SelectItem>)}
                                       </SelectContent>
                                    </Select>
                                 </div>

                                 {pendingOrderStatus === 'cancelled' && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2">
                                       <Label className="text-[10px] font-black text-red-500 ml-2 tracking-widest">Reason for User</Label>
                                       <Textarea 
                                          placeholder="e.g. Invalid Sender Number or Wrong Player ID" 
                                          value={cancellationReason}
                                          onChange={e => setCancellationReason(e.target.value)}
                                          className="rounded-2xl bg-slate-50 dark:bg-slate-800 border-none min-h-[100px] p-4 font-medium text-xs sm:text-sm shadow-inner"
                                       />
                                    </div>
                                 )}

                                 <Button onClick={handleStatusSave} disabled={isSavingStatus} className="w-full h-20 rounded-3xl font-black text-xl shadow-2xl shadow-primary/20 bg-primary hover:bg-primary/90 uppercase tracking-[0.2em] active:scale-95 transition-all">
                                    {isSavingStatus ? <Loader2 className="animate-spin w-8 h-8" /> : "Sync Order Status"}
                                 </Button>
                              </div>
                           </div>
                           
                           <div className="pt-8 border-t dark:border-white/5 space-y-4">
                              <p className="text-[9px] font-black uppercase text-muted-foreground text-center tracking-widest">Quick Actions</p>
                              <div className="flex gap-2">
                                 <Button variant="outline" className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest" onClick={() => copyToClipboard(selectedOrder.gameDetails?.playerID)}>Copy ID</Button>
                                 <Button variant="outline" className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest" onClick={() => window.open(`https://wa.me/${formatWhatsAppNumber(selectedOrder.gameDetails?.whatsappNumber)}`, '_blank')}>WhatsApp</Button>
                              </div>
                           </div>
                        </Card>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeView === 'account-posts' && !selectedAccountId && (
            <div className="space-y-8">
               {urgentAccounts.length > 0 && (
                 <Card className="p-6 md:p-8 rounded-[2rem] border-2 border-red-500 bg-red-50 dark:bg-red-950/20 shadow-xl shadow-red-500/10 animate-in zoom-in duration-500">
                    <div className="flex items-center gap-4 mb-6">
                       <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg animate-pulse">
                          <AlertTriangle size={32} />
                       </div>
                       <div>
                          <h3 className="text-xl md:text-2xl font-headline font-bold text-red-700 dark:text-red-400">Critical Delays: 24+ Hours</h3>
                          <p className="text-sm font-medium text-red-600/80 dark:text-red-400/60 uppercase tracking-widest">Immediate admin intervention required for {urgentAccounts.length} listings.</p>
                       </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {urgentAccounts.map(p => (
                         <div key={p.id} onClick={() => handleOpenAccountPage(p.id)} className="p-4 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-between border border-red-200 dark:border-red-900/40 cursor-pointer hover:scale-[1.02] transition-transform">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden relative"><Image src={p.thumbnailUrl} alt="" fill className="object-cover" /></div>
                               <div className="min-w-0"><p className="text-xs font-bold truncate">#{p.id.toUpperCase()}</p><p className="text-[10px] text-muted-foreground uppercase">{p.authorName}</p></div>
                            </div>
                            <Button size="sm" variant="ghost" className="text-red-500"><ChevronRight size={20} /></Button>
                         </div>
                       ))}
                    </div>
                 </Card>
               )}

               <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="relative w-full max-w-md">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        placeholder="Search Seller or ID..." 
                        value={accountSearchQuery} 
                        onChange={e => setAccountSearchQuery(e.target.value)} 
                        className="pl-12 h-12 rounded-xl dark:bg-slate-900 dark:border-white/5 font-bold" 
                      />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full sm:w-auto">
                      {["all", "pending", "holding", "approved", "sold"].map(s => (
                        <Button 
                          key={s} 
                          variant={accountStatusFilter === s ? "default" : "outline"} 
                          onClick={() => setAccountStatusFilter(s)} 
                          className="rounded-full h-10 px-6 uppercase font-black text-[10px] shrink-0 dark:border-white/5"
                        >
                          {s}
                        </Button>
                      ))}
                    </div>
                  </div>
               </div>

               <Card className="rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden border-none shadow-xl bg-white dark:bg-slate-900">
                <div className="overflow-x-auto scrollbar-hide">
                  <Table className="min-w-[1100px]">
                    <TableHeader className="bg-slate-50/50 dark:bg-slate-800/40">
                      <TableRow className="border-none">
                        <TableHead className="px-4 sm:px-8">Seller</TableHead>
                        <TableHead>Game & Info</TableHead>
                        <TableHead>Active Claims</TableHead>
                        <TableHead>Admin Handling</TableHead>
                        <TableHead>Wait Time</TableHead>
                        <TableHead>Expiration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right px-4 sm:px-8">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedAndFilteredAccounts.length === 0 ? (
                        <TableRow>
                           <TableCell colSpan={8} className="h-40 text-center text-slate-400 italic">No listings match filters.</TableCell>
                        </TableRow>
                      ) : (
                        sortedAndFilteredAccounts.map(p => {
                          const claimants = Object.values(p.claimants || {});
                          const longestWaitMs = claimants.length > 0 ? Date.now() - Math.min(...claimants.map(c => c.timestamp)) : 0;
                          const isUrgent = longestWaitMs > 86400000;
                          
                          return (
                            <TableRow key={p.id} className={cn("border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/30", isUrgent && "bg-red-50/30")}>
                              <TableCell className="px-4 sm:px-8 relative">
                                {(p.status === 'pending' || p.conflict || claimants.length > 0) && <div className={cn("absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full animate-pulse", isUrgent ? "bg-red-600 scale-150" : "bg-amber-500")} />}
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative shrink-0">
                                    {p.authorAvatar && <Image src={p.authorAvatar} alt="" fill className="object-cover" />}
                                  </div>
                                  <span className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[100px]">{p.authorName}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">{p.gameType} - Lv {p.level}</span>
                                  <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500">${p.price}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                   <Badge className={cn("rounded-full text-[8px] font-black uppercase", claimants.length > 0 ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500")}>
                                     {claimants.length} CLAIMS
                                   </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                {p.processedBy ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative border border-white dark:border-white/10">
                                      {p.processedBy.photoURL ? <Image src={p.processedBy.photoURL} alt="" fill className="object-cover" /> : <User size={12} className="m-auto mt-1" />}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 truncate max-w-[80px]">{p.processedBy.name}</span>
                                  </div>
                                ) : <span className="text-[10px] text-slate-300 italic">Unassigned</span>}
                              </TableCell>
                              <TableCell>
                                 {claimants.length > 0 ? (
                                   <div className="flex flex-col">
                                      <span className={cn("text-[10px] font-black", isUrgent ? "text-red-600" : "text-slate-400")}>
                                         {Math.floor(longestWaitMs / 3600000)}h {Math.floor((longestWaitMs % 3600000) / 60000)}m
                                      </span>
                                   </div>
                                 ) : <span className="text-[10px] text-slate-300 italic">None</span>}
                              </TableCell>
                              <TableCell>
                                 <CountdownDisplay expiresAt={p.expiresAt} status={p.status} />
                              </TableCell>
                              <TableCell><Badge className={cn("rounded-full text-[8px] font-black uppercase border-none", getStatusBadge(p.status))}>{p.status}</Badge></TableCell>
                              <TableCell className="text-right px-4 sm:px-8">
                                <div className="flex justify-end gap-1 sm:gap-2">
                                  <Button size="sm" onClick={() => handleOpenAccountPage(p.id)} className="rounded-full h-8 px-2 sm:px-4 font-bold text-[9px] sm:text-[10px] gap-1 sm:gap-2 shrink-0"><Eye size={12} /> <span className="hidden xs:inline">Manage</span></Button>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 shrink-0" onClick={() => confirmDelete(p.id, 'account')}><Trash2 size={16} /></Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
               </Card>
            </div>
          )}

          {activeView === 'account-posts' && selectedAccountId && selectedAccount && (
            <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-500">
               <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b dark:border-white/5 flex items-center justify-between px-4 sm:px-10 shrink-0">
                  <div className="flex items-center gap-4">
                     <Button variant="ghost" onClick={() => setSelectedAccountId(null)} className="rounded-full h-12 w-12 p-0">
                        <ChevronLeft className="w-8 h-8" />
                     </Button>
                     <div>
                       <h3 className="font-headline font-bold text-xl md:text-2xl dark:text-white uppercase tracking-tight">Listing Hub</h3>
                       <p className="text-[10px] font-bold text-muted-foreground uppercase">Ref: #{selectedAccount.id.toUpperCase()}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <Badge className={cn("rounded-full px-4 py-1 uppercase font-black text-[10px]", getStatusBadge(selectedAccount.status))}>{selectedAccount.status}</Badge>
                     <Button size="icon" variant="ghost" className="text-red-500" onClick={() => confirmDelete(selectedAccount.id, 'account')}><Trash2 size={20} /></Button>
                  </div>
               </header>

               <div className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-8 scrollbar-hide pb-32">
                  <div className="max-w-6xl mx-auto space-y-8">
                     
                     {selectedAccount.status === 'sold' && (
                       <Card className="rounded-[2.5rem] border-none shadow-2xl bg-green-500 text-white overflow-hidden animate-in zoom-in duration-500">
                           <div className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                             <div className="flex items-center gap-6">
                                 <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md shrink-0">
                                   <PartyPopper size={40} className="animate-bounce" />
                                 </div>
                                 <div>
                                   <h4 className="text-2xl md:text-4xl font-headline font-bold uppercase tracking-tight">Confirmed Sale!</h4>
                                   <p className="text-white/80 font-medium text-sm md:text-lg">Verified and closed successfully.</p>
                                 </div>
                             </div>
                             
                             {(() => {
                               const buyer = allUsers.find(u => u.uid === selectedAccount.boughtBy);
                               const claimant = selectedAccount.claimants?.[selectedAccount.boughtBy || ''];
                               return (
                                 <div className="flex items-center gap-4 bg-white/10 p-4 md:p-6 rounded-3xl backdrop-blur-xl border border-white/20 min-w-[320px]">
                                     <div className="w-14 h-14 rounded-full overflow-hidden relative border-2 border-white/50 shrink-0 shadow-lg">
                                       {buyer?.photoURL ? <Image src={buyer.photoURL} alt="" fill className="object-cover" /> : <User size={24} className="m-auto mt-2 opacity-50" />}
                                     </div>
                                     <div className="min-w-0 flex-1">
                                       <p className="text-[10px] font-black uppercase text-white/60 tracking-widest leading-none mb-1">Final Buyer</p>
                                       <p className="text-lg font-bold truncate">{buyer?.name || "Verified Client"}</p>
                                       {claimant?.whatsapp && (
                                          <div className="flex items-center gap-2 mt-2 bg-white/20 px-3 py-1 rounded-full w-fit">
                                             <Smartphone size={12} className="text-green-300" />
                                             <span className="text-[12px] font-black">{claimant.whatsapp}</span>
                                             <button onClick={() => copyToClipboard(claimant.whatsapp)} className="ml-1 p-0.5 hover:bg-white/20 rounded-md transition-colors"><Copy size={12}/></button>
                                          </div>
                                       )}
                                     </div>
                                 </div>
                               );
                             })()}
                           </div>
                       </Card>
                     )}

                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                       <div className="lg:col-span-2 space-y-8">
                         <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                           <div className="aspect-video relative bg-slate-950 flex items-center justify-center">
                              <Image src={selectedAccount.thumbnailUrl} alt="" fill className="object-contain" unoptimized />
                           </div>
                           <div className="p-8 md:p-12 space-y-10">
                             <div className="flex justify-between items-start">
                               <div className="space-y-2">
                                  <h4 className="text-2xl md:text-4xl font-headline font-bold uppercase tracking-tight">{selectedAccount.gameType} Account</h4>
                                  <div className="flex items-center gap-3">
                                     <Badge variant="outline" className="font-black text-[10px] tracking-widest uppercase">{selectedAccount.platform}</Badge>
                                     <span className="text-xs font-bold text-muted-foreground uppercase">{getSmartTimestamp(selectedAccount.createdAt)}</span>
                                  </div>
                               </div>
                               <div className="text-right">
                                  <p className="text-3xl md:text-5xl font-headline font-bold text-primary tracking-tighter">${selectedAccount.price.toFixed(2)}</p>
                               </div>
                             </div>

                             <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t dark:border-white/5">
                                <DetailItem icon={Star} label="Level" value={selectedAccount.level} />
                                <DetailItem icon={Hash} label="ID" value={selectedAccount.id.toUpperCase().slice(0, 8)} />
                                <DetailItem icon={Clock} label="Wait" value={getSmartTimestamp(selectedAccount.createdAt)} />
                                <DetailItem icon={Tag} label="Term" value={selectedAccount.term} />
                             </div>
                           </div>
                         </Card>

                         <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 p-8 md:p-12 space-y-10">
                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-3">
                                  <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-500"><HandCoins size={24}/></div>
                                  <h4 className="font-headline font-bold text-xl md:text-2xl uppercase">Stakeholder Hub</h4>
                               </div>
                               <Badge className="bg-primary text-white border-none rounded-full h-8 px-4 font-black">
                                  {Object.keys(selectedAccount.claimants || {}).length} LIVE REQUESTS
                               </Badge>
                            </div>

                            <div className="grid grid-cols-1 gap-8">
                               <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-800/40 rounded-[2rem] border dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 relative group overflow-hidden">
                                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><User size={48}/></div>
                                  <div className="flex items-center gap-5">
                                     <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden relative border-4 border-white dark:border-slate-800 shadow-xl bg-slate-200">
                                        {selectedAccount.authorAvatar && <Image src={selectedAccount.authorAvatar} alt="" fill className="object-cover" />}
                                     </div>
                                     <div className="min-w-0">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Original Seller</p>
                                        <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white truncate">{selectedAccount.authorName}</p>
                                        <div className="flex flex-wrap items-center gap-3 mt-2">
                                           <div className="flex flex-col gap-1">
                                              <span className="text-[8px] font-black text-slate-400 uppercase">WhatsApp Support</span>
                                              <div className="flex items-center gap-2">
                                                 <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black">{selectedAccount.phone}</Badge>
                                                 <button onClick={() => window.open(`https://wa.me/${formatWhatsAppNumber(selectedAccount.phone)}`, '_blank')} className="p-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors shadow-sm"><MessageCircle size={14}/></button>
                                              </div>
                                           </div>
                                           {selectedAccount.senderNumber && (
                                             <div className="flex flex-col gap-1">
                                                <span className="text-[8px] font-black text-amber-500 uppercase">Number ka lacagta (Sender)</span>
                                                <Badge variant="outline" className="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40 font-black flex items-center gap-1.5">
                                                   <CreditCard size={10} /> {selectedAccount.senderNumber}
                                                </Badge>
                                             </div>
                                           )}
                                        </div>
                                     </div>
                                  </div>
                               </div>

                               <div className="h-px bg-slate-100 dark:bg-white/5 mx-8" />

                               <div className="space-y-6">
                                  {(() => {
                                    const claimants = Object.values(selectedAccount.claimants || {});
                                    if (claimants.length === 0) return (
                                      <div className="py-20 text-center opacity-30 italic flex flex-col items-center gap-4 bg-slate-50/50 dark:bg-slate-800/20 rounded-[2rem] border-2 border-dashed">
                                         <ShieldQuestion size={48} className="text-slate-300" />
                                         <p className="text-lg font-bold uppercase tracking-widest">Waiting for buyer reports...</p>
                                      </div>
                                    );
                                    return claimants.map((claim: any) => (
                                      <div key={claim.uid} className={cn(
                                        "p-6 md:p-8 rounded-[2rem] border-2 transition-all relative overflow-hidden group",
                                        selectedAccount.boughtBy === claim.uid 
                                          ? "bg-green-50 dark:bg-green-950/20 border-green-500 shadow-xl shadow-green-500/10" 
                                          : claim.status === 'rejected'
                                          ? "bg-red-50 dark:bg-red-950/10 border-red-200 dark:border-red-900/20 opacity-80"
                                          : "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-white/5"
                                      )}>
                                         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex items-center gap-5">
                                               <div className={cn(
                                                 "w-16 h-16 md:w-20 md:h-20 rounded-3xl overflow-hidden relative border-4 shadow-xl",
                                                 claim.status === 'accepted' ? "border-green-500" : claim.status === 'rejected' ? "border-red-500" : "border-white dark:border-slate-800"
                                               )}>
                                                  {claim.photo ? <Image src={claim.photo} alt="" fill className="object-cover" /> : <User size={24} className="m-auto mt-4 opacity-20"/>}
                                               </div>
                                               <div className="min-w-0">
                                                  <div className="flex items-center gap-2 mb-1">
                                                     <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white truncate">{claim.name}</p>
                                                     {claim.status === 'accepted' && <Badge className="bg-green-500 text-white uppercase text-[8px] h-5">Verified Sale</Badge>}
                                                     {claim.status === 'rejected' && <Badge className="bg-red-500 text-white uppercase text-[8px] h-5">Seller Rejected</Badge>}
                                                  </div>
                                                  <div className="flex flex-wrap items-center gap-3">
                                                     <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-[11px] font-black uppercase">
                                                        <Smartphone size={12}/> {claim.whatsapp}
                                                     </div>
                                                     <span className="text-inter font-bold text-muted-foreground uppercase opacity-60">Claimed: {getSmartTimestamp(claim.timestamp)}</span>
                                                  </div>
                                               </div>
                                            </div>

                                            <div className="flex gap-2">
                                               <button onClick={() => window.open(`https://wa.me/${formatWhatsAppNumber(claim.whatsapp)}`, '_blank')} className="h-12 md:h-16 px-6 rounded-2xl gap-2 font-bold bg-white dark:bg-slate-900 border border-slate-200 flex items-center justify-center">
                                                  <MessageCircle size={18} className="text-green-500" /> WhatsApp
                                               </button>
                                               {selectedAccount.status !== 'sold' && (
                                                 <Button 
                                                   onClick={() => handleForceSold(claim.uid, claim.name)}
                                                   className="h-12 md:h-16 px-8 rounded-2xl gap-2 font-black uppercase tracking-widest bg-green-600 hover:bg-green-700 text-white shadow-xl shadow-green-500/20"
                                                 >
                                                    <Check size={18}/> Force Sold
                                                 </Button>
                                               )}
                                            </div>
                                         </div>
                                      </div>
                                    ));
                                  })()}
                               </div>
                            </div>
                         </Card>
                       </div>

                       <div className="space-y-8">
                         <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 p-8 space-y-8 sticky top-8">
                            <div className="space-y-6">
                               <div className="flex items-center gap-3">
                                  <RefreshCw className="text-amber-500" size={24} />
                                  <h4 className="font-bold text-lg uppercase tracking-tight">Lifecycle Control</h4>
                               </div>
                               <div className="space-y-5">
                                  <div className="space-y-2">
                                     <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Change Account Status</Label>
                                     <Select value={pendingAccountStatus} onValueChange={setPendingAccountStatus}>
                                        <SelectTrigger className="h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-6 font-bold text-base shadow-inner"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl border-none shadow-2xl z-[200]">
                                           {["pending", "processing", "approved", "rejected", "holding", "sold"].map(s => <SelectItem key={s} value={s} className="rounded-xl uppercase font-bold text-xs p-3">{s}</SelectItem>)}
                                        </SelectContent>
                                     </Select>
                                  </div>

                                  {pendingAccountStatus === 'sold' && (
                                     <div className="space-y-2 animate-in slide-in-from-top-2">
                                        <Label className="text-[10px] font-black text-primary ml-2 tracking-widest">Assign Final Buyer</Label>
                                        <Select value={assignBuyerId} onValueChange={setAssignBuyerId}>
                                           <SelectTrigger className="h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-6 font-bold text-sm shadow-inner"><SelectValue placeholder="Select Winner" /></SelectTrigger>
                                           <SelectContent className="rounded-2xl border-none shadow-2xl z-[200]">
                                              {allUsers.map(u => <SelectItem key={u.uid} value={u.uid} className="text-xs p-3">{u.name} ({u.email?.slice(0, 15) || '...'})</SelectItem>)}
                                           </SelectContent>
                                        </Select>
                                     </div>
                                  )}

                                  <Button onClick={handleAccountStatusSave} disabled={isSavingStatus} className="w-full h-20 rounded-3xl font-black text-xl shadow-2xl shadow-primary/20 bg-primary hover:bg-primary/90 uppercase tracking-[0.2em] active:scale-95 transition-all">
                                     {isSavingStatus ? <Loader2 className="animate-spin w-8 h-8" /> : "Save Logic"}
                                  </Button>
                               </div>
                            </div>

                            {urgentAccounts.some(p => p.id === selectedAccount.id) && (
                               <div className="space-y-6 pt-8 border-t dark:border-white/5">
                                  <div className="flex items-center gap-3">
                                     <ShieldAlert className="text-red-500" size={24} />
                                     <h4 className="font-bold text-lg uppercase tracking-tight text-red-500">Enforcement Action</h4>
                                  </div>
                                  <p className="text-[11px] font-bold text-muted-foreground uppercase leading-relaxed bg-red-50 dark:bg-red-950/20 p-4 rounded-2xl border border-red-100 dark:border-red-900/20">
                                     SELLER UNRESPONSIVE (24H+). REJECT LISTING OR FORCE SALE IMMEDIATELY.
                                  </p>
                                  <Button variant="destructive" onClick={() => setIsEnforceDialogOpen(true)} className="w-full h-20 rounded-3xl font-black text-xl shadow-2xl shadow-red-500/20 uppercase tracking-[0.1em] active:scale-95 transition-all">
                                    Apply Penalty
                                  </Button>
                               </div>
                            )}
                         </Card>
                       </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeView === 'inventory' && (
            <div className="space-y-12">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h2 className="text-2xl md:text-4xl font-headline font-bold uppercase tracking-tight">Game Collections</h2>
                    <p className="text-muted-foreground font-medium uppercase text-xs tracking-widest mt-1">Manage parent games and their top-up packages.</p>
                  </div>
                  <Button onClick={() => handleOpenGameDialog()} className="h-14 rounded-2xl gap-2 font-bold bg-primary px-8 shadow-xl shadow-primary/20"><Plus size={20}/> New Game</Button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {games.map(game => (
                    <Card key={game.id} className={cn("p-4 rounded-[1.5rem] border-none shadow-lg transition-all group", selectedGameId === game.id ? "ring-2 ring-primary bg-primary/5" : "bg-white dark:bg-slate-900")}>
                       <div className="flex items-center gap-4 cursor-pointer" onClick={() => setSelectedGameId(game.id === selectedGameId ? null : game.id)}>
                          <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 overflow-hidden relative shadow-sm shrink-0 border border-white dark:border-white/5">
                             {game.icon ? <Image src={game.icon} alt="" fill className="object-cover" /> : <Gamepad2 size={24} className="m-auto mt-5 text-slate-300"/>}
                          </div>
                          <div className="flex-1 min-w-0">
                             <h3 className="font-bold text-base md:text-lg truncate uppercase tracking-tight">{game.title}</h3>
                             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{game.category}</p>
                          </div>
                          <div className="flex flex-col gap-1">
                             <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-500" onClick={(e) => { e.stopPropagation(); handleOpenGameDialog(game); }}><Edit size={16}/></Button>
                             <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={(e) => { e.stopPropagation(); confirmDelete(game.id, 'game'); }}><Trash2 size={16}/></Button>
                          </div>
                       </div>
                       
                       {selectedGameId === game.id && (
                         <div className="mt-4 pt-4 border-t dark:border-white/5 space-y-3 animate-in slide-in-from-top-2">
                            <div className="flex justify-between items-center px-1">
                               <span className="text-[10px] font-black uppercase text-slate-400">Inventory Items</span>
                               <Button size="sm" variant="ghost" onClick={() => handleOpenProductDialog()} className="h-7 text-[10px] text-primary uppercase font-black">+ Add Item</Button>
                            </div>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-hide">
                               {products.filter(p => p.gameId === game.id).map(p => (
                                 <div key={p.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-between group/item">
                                    <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 overflow-hidden relative border border-white dark:border-white/10 shrink-0">
                                          {p.thumbnail ? <Image src={p.thumbnail} alt="" fill className="object-cover" unoptimized /> : <Box size={14} className="m-auto mt-2 text-slate-300"/>}
                                       </div>
                                       <div className="min-w-0">
                                          <p className="text-[11px] font-bold truncate max-w-[120px] uppercase">{p.title}</p>
                                          <p className="text-[9px] font-black text-primary">${p.price}</p>
                                       </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                       <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-500" onClick={() => handleOpenProductDialog(p)}><Edit size={12}/></Button>
                                       <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => confirmDelete(p.id, 'product')}><Trash2 size={12}/></Button>
                                    </div>
                                 </div>
                               ))}
                            </div>
                         </div>
                       )}
                    </Card>
                  ))}
               </div>
            </div>
          )}

          {activeView === 'events' && (
            <div className="space-y-12">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h2 className="text-2xl md:text-4xl font-headline font-bold uppercase tracking-tight">Active Events</h2>
                    <p className="text-muted-foreground font-medium uppercase text-xs tracking-widest mt-1">Manage banners, time-limited sales, and community updates.</p>
                  </div>
                  <div className="flex gap-4">
                     <Button variant="outline" onClick={() => setIsBannerDialogOpen(true)} className="h-14 rounded-2xl gap-2 font-bold px-8"><ImageIcon size={20}/> New Banner</Button>
                     <Button onClick={() => handleOpenEventDialog()} className="h-14 rounded-2xl gap-2 font-bold bg-primary px-8 shadow-xl shadow-primary/20"><Megaphone size={20}/> Create Event</Button>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {events.map(ev => {
                    const isExpired = ev.expiresAt && ev.expiresAt < Date.now();
                    const isLive = ev.active && !isExpired;
                    
                    return (
                    <Card key={ev.id} className="rounded-[2.5rem] bg-white dark:bg-slate-900 border-none shadow-xl overflow-hidden group">
                       <div className="aspect-video relative bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          {ev.thumbnailUrl ? <Image src={ev.thumbnailUrl} alt="" fill className="object-cover group-hover:scale-110 transition-transform duration-1000" unoptimized /> : <Megaphone size={32} className="m-auto absolute inset-0 text-slate-300"/>}
                          <div className="absolute top-4 right-4 flex gap-2">
                             <Button size="icon" className="bg-white/80 dark:bg-black/40 text-blue-500 rounded-xl" onClick={() => handleOpenEventDialog(ev)}><Edit size={16}/></Button>
                             <Button size="icon" className="bg-white/80 dark:bg-black/40 text-red-500 rounded-xl" onClick={() => confirmDelete(ev.id, 'event')}><Trash2 size={16}/></Button>
                          </div>
                          <div className="absolute bottom-4 left-4">
                             <Badge className={cn(
                               "rounded-full uppercase text-[8px] font-black px-3 py-1 border-none shadow-lg", 
                               isLive ? "bg-green-600 text-white" : "bg-red-600 text-white"
                             )}>
                                {isLive ? "Live" : "Ended"}
                             </Badge>
                          </div>
                       </div>
                       <div className="p-6 md:p-8 space-y-2">
                          <h3 className="font-bold text-base md:text-xl truncate uppercase tracking-tight">{ev.title}</h3>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed font-medium">{ev.shortDescription}</p>
                          <div className="pt-4 border-t dark:border-white/5 flex items-center gap-2">
                             <Clock size={12} className="text-primary"/>
                             <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                                {ev.expiresAt ? `Ends ${format(new Date(ev.expiresAt), 'MMM d, HH:mm')}` : "Permanent"}
                             </span>
                          </div>
                       </div>
                    </Card>
                  )})}
               </div>

               <div className="space-y-6 pt-12 border-t dark:border-white/5">
                  <h3 className="text-xl font-headline font-bold uppercase tracking-tight ml-2">Slider Banners</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                     {banners.map(b => (
                       <div key={b.id} className="relative aspect-[3/1] rounded-2xl overflow-hidden group shadow-lg">
                          <Image src={b.imageUrl} alt="" fill className="object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                             <Button size="icon" variant="ghost" className="text-white hover:text-red-500" onClick={() => confirmDelete(b.id, 'banner')}><Trash2 size={18}/></Button>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          )}

          {activeView === 'users' && (
            <div className="space-y-12">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h2 className="text-2xl md:text-4xl font-headline font-bold uppercase tracking-tight">Community Control</h2>
                    <p className="text-muted-foreground font-medium uppercase text-xs tracking-widest mt-1">Search users, update roles, and manage reward points.</p>
                  </div>
                  <div className="relative w-full max-w-md">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                     <Input 
                       placeholder="Search name, email, or UID..." 
                       value={userSearchQuery} 
                       onChange={e => setUserSearchQuery(e.target.value)} 
                       className="pl-12 h-14 rounded-2xl dark:bg-slate-900 dark:border-white/5 font-bold shadow-sm" 
                     />
                  </div>
               </div>

               <Card className="rounded-[1.5rem] overflow-hidden border-none shadow-xl bg-white dark:bg-slate-900">
                  <div className="overflow-x-auto scrollbar-hide">
                    <Table className="min-w-[1000px]">
                      <TableHeader className="bg-slate-50/50 dark:bg-slate-800/40">
                        <TableRow className="border-none">
                          <TableHead className="px-8 font-bold">User Identity</TableHead>
                          <TableHead className="font-bold">Contact & Role</TableHead>
                          <TableHead className="font-bold">Reward Balance</TableHead>
                          <TableHead className="font-bold">Presence</TableHead>
                          <TableHead className="font-bold">Status</TableHead>
                          <TableHead className="text-right px-8 font-bold">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length === 0 ? (
                          <TableRow><TableCell colSpan={6} className="h-40 text-center opacity-30 italic">No users found.</TableCell></TableRow>
                        ) : (
                          filteredUsers.map(u => (
                            <TableRow key={u.uid} className="border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                              <TableCell className="px-8">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-full overflow-hidden relative bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-white/10 shrink-0">
                                      {u.photoURL ? <Image src={u.photoURL} alt="" fill className="object-cover" /> : <User size={16} className="m-auto mt-3 text-slate-300"/>}
                                   </div>
                                   <div className="min-w-0">
                                      <p className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-[150px]">{u.name}</p>
                                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest truncate max-w-[150px]">{u.email}</p>
                                   </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                   <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{u.phoneNumber || "No Phone"}</span>
                                   <Badge variant="secondary" className="w-fit text-[8px] font-black uppercase h-5">{u.role}</Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                 <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-amber-50 dark:bg-amber-500/10 rounded-lg text-amber-500"><Star size={14} fill="currentColor"/></div>
                                    <span className="font-headline font-bold text-lg">{u.points || 0}</span>
                                 </div>
                              </TableCell>
                              <TableCell>
                                 <div className="flex flex-col">
                                    {u.lastActive && (Date.now() - u.lastActive < 600000) ? (
                                      <div className="flex items-center gap-1.5 text-green-500">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Online</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1.5 text-slate-400">
                                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Offline</span>
                                      </div>
                                    )}
                                    <span className="text-[8px] font-bold text-muted-foreground uppercase mt-0.5 whitespace-nowrap">
                                      {u.lastActive ? formatDistanceToNow(new Date(u.lastActive), { addSuffix: true }) : 'Never'}
                                    </span>
                                 </div>
                              </TableCell>
                              <TableCell>
                                 {u.banned ? (
                                   <Badge className="bg-red-500 text-white border-none text-[8px] font-black uppercase">Banned</Badge>
                                 ) : (
                                   <Badge className="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-none text-[8px] font-black uppercase">Active</Badge>
                                 )}
                              </TableCell>
                              <TableCell className="text-right px-8">
                                 <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="outline" className="rounded-full h-9 px-4 font-bold text-xs" onClick={() => { setSelectedUser(u); setIsUserManageOpen(true); }}>Manage</Button>
                                    <Button size="icon" variant="ghost" className="h-9 w-9 text-red-500" onClick={() => confirmDelete(u.uid, 'user')}><Trash2 size={18}/></Button>
                                 </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
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
                  <AccordionItem value="brand" className="border-none">
                     <Card className="rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                        <AccordionTrigger className="px-4 py-6 sm:px-8 sm:py-8 hover:no-underline group">
                           <div className="flex items-center gap-4 text-primary">
                              <Layout className="w-6 h-6" />
                              <div className="text-left">
                                 <h4 className="font-headline font-bold text-lg uppercase tracking-tight">Brand Identity</h4>
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Logo, visual presence, and icons</p>
                              </div>
                           </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-6 pt-2 sm:px-8 sm:pb-8 sm:pt-4">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
                              <div className="flex flex-col items-center gap-6 p-6 sm:p-10 bg-slate-50 dark:bg-slate-800/40 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-white/10 relative overflow-hidden group">
                                 <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2.5rem] bg-white dark:bg-slate-900 flex items-center justify-center relative overflow-hidden shadow-2xl ring-8 ring-primary/5 transition-transform group-hover:scale-105">
                                    {storeSettings.logo ? <Image src={storeSettings.logo} alt="Logo" fill className="object-contain p-4 sm:p-6" unoptimized /> : <div className="text-4xl sm:text-6xl font-black text-slate-100">O</div>}
                                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logo')} />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase text-center p-4">Click to Change Store Logo</div>
                                 </div>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Application Favicon & Branding</p>
                              </div>
                              <div className="space-y-6">
                                 <div className="p-4 sm:p-6 bg-primary/5 rounded-[1.5rem] sm:rounded-[2rem] border border-primary/10">
                                    <p className="text-[11px] sm:text-xs font-medium leading-relaxed">Your store logo is used for the PWA splash screen, favicon, and email notifications. Use a high-quality square image for best results.</p>
                                 </div>
                              </div>
                           </div>
                        </AccordionContent>
                     </Card>
                  </AccordionItem>

                  {/* Email Service Protocol */}
                  <AccordionItem value="email-service" className="border-none">
                     <Card className="rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                        <AccordionTrigger className="px-4 py-6 sm:px-8 sm:py-8 hover:no-underline">
                           <div className="flex items-center gap-4 text-blue-600">
                              <Mail className="w-6 h-6" />
                              <div className="text-left">
                                 <h4 className="font-headline font-bold text-lg uppercase tracking-tight">Email Service Protocol</h4>
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Automated OTP & recovery credentials</p>
                              </div>
                           </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-6 pt-2 sm:px-8 sm:pb-8 sm:pt-4">
                           <div className="space-y-6 sm:space-y-8">
                              <div className="p-4 sm:p-6 bg-blue-50 dark:bg-blue-950/20 rounded-[1.5rem] border border-blue-100 dark:border-blue-900/30 flex gap-3">
                                 <Info className="text-blue-500 shrink-0 mt-1" size={20} />
                                 <p className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-300 leading-relaxed">
                                    These credentials are used by the Cloud Functions to send 6-digit OTP codes. For "App Password", generate a unique 16-character code in your Google Account security settings.
                                 </p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                 <SettingInput 
                                    label="Sender Gmail Address" 
                                    value={emailConfigForm.senderEmail} 
                                    onChange={v => setEmailConfigForm(f => ({ ...f, senderEmail: v }))} 
                                    placeholder="admin@gmail.com" 
                                 />
                                 <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Google App Password</Label>
                                    <div className="relative">
                                       <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                       <Input 
                                          type="password"
                                          value={emailConfigForm.appPassword} 
                                          onChange={e => setEmailConfigForm(f => ({ ...f, appPassword: e.target.value }))} 
                                          className="h-12 sm:h-16 rounded-xl sm:rounded-2xl border-none bg-slate-50 dark:bg-slate-800 font-mono pl-12 shadow-inner" 
                                          placeholder="•••• •••• •••• ••••" 
                                       />
                                    </div>
                                 </div>
                              </div>
                              <Button onClick={handleSaveEmailConfig} className="w-full h-12 sm:h-16 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest shadow-2xl bg-blue-600 hover:bg-blue-700">Sync Email Service</Button>
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
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Manage store visibility and downtime</p>
                              </div>
                           </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-6 pt-2 sm:px-8 sm:pb-8 sm:pt-4">
                           <div className="space-y-6 sm:space-y-8">
                              <div className="flex items-center justify-between p-4 sm:p-8 bg-slate-50 dark:bg-slate-800/40 rounded-[1.5rem] sm:rounded-[2rem] border-2 border-slate-100 dark:border-white/5 shadow-inner">
                                 <div className="min-w-0 pr-2">
                                    <p className="font-bold text-lg sm:text-2xl text-slate-900 dark:text-white">Force Offline Mode</p>
                                    <p className="text-[10px] sm:text-xs font-black text-muted-foreground uppercase tracking-widest mt-1">Redirect all non-admin users to maintenance page</p>
                                 </div>
                                 <Switch checked={appStatusForm.offline} onCheckedChange={v => setAppStatusForm(f => ({ ...f, offline: v }))} className="scale-110 sm:scale-150" />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 animate-in slide-in-from-top-4 duration-500">
                                 <div className="space-y-4 sm:space-y-6">
                                    <SettingInput label="Maintenance Title" value={appStatusForm.offlineTitle || ''} onChange={v => setAppStatusForm(f => ({ ...f, offlineTitle: v }))} placeholder="Store is currently offline" />
                                    <div className="space-y-2">
                                       <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Maintenance Description</Label>
                                       <Textarea 
                                         placeholder="Provide a reason for the downtime to your users..." 
                                         value={appStatusForm.offlineBody || ''} 
                                         onChange={e => setAppStatusForm(f => ({ ...f, offlineBody: e.target.value }))} 
                                         className="rounded-xl sm:rounded-2xl border-none bg-slate-50 dark:bg-slate-800 font-medium min-h-[120px] sm:min-h-[150px] shadow-inner p-4 sm:p-6" 
                                       />
                                    </div>
                                    <Button onClick={handleSaveAppStatus} className="w-full h-12 sm:h-16 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest shadow-2xl bg-amber-500 hover:bg-amber-600">Sync Offline Config</Button>
                                 </div>
                                 <div className="space-y-4 sm:space-y-6">
                                    <p className="text-[10px] font-black uppercase text-slate-400 ml-1">Maintenance Hero Image</p>
                                    <div className="relative aspect-video rounded-[1.5rem] sm:rounded-[2.5rem] bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-white/10 overflow-hidden group flex items-center justify-center">
                                       {appStatusForm.offlineImageUrl ? (
                                         <Image src={appStatusForm.offlineImageUrl} alt="Offline Hero" fill className="object-cover" unoptimized />
                                       ) : (
                                         <div className="text-center opacity-30">
                                            <ImageIcon className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2" />
                                            <p className="text-[10px] font-black uppercase">Upload Banner</p>
                                         </div>
                                       )}
                                       <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'offline')} />
                                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase">Update Visual</div>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </AccordionContent>
                     </Card>
                  </AccordionItem>

                  {/* Communication Hub */}
                  <AccordionItem value="communication" className="border-none">
                     <Card className="rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                        <AccordionTrigger className="px-4 py-6 sm:px-8 sm:py-8 hover:no-underline">
                           <div className="flex items-center gap-4 text-green-500">
                              <MessageCircle className="w-6 h-6" />
                              <div className="text-left">
                                 <h4 className="font-headline font-bold text-lg uppercase tracking-tight">Communication Hub</h4>
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Social presence and support links</p>
                              </div>
                           </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-6 pt-2 sm:px-8 sm:pb-8 sm:pt-4">
                           <div className="space-y-6 sm:space-y-10">
                              <div className="flex items-center justify-between p-4 sm:p-8 bg-slate-50 dark:bg-slate-800/40 rounded-[1.5rem] sm:rounded-[2rem] border-2 border-slate-100 dark:border-white/5 shadow-inner">
                                 <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="p-2 sm:p-3 bg-red-100 dark:bg-red-500/10 rounded-xl sm:rounded-2xl text-red-500"><Radio className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" /></div>
                                    <div className="min-w-0 pr-2">
                                       <p className="font-bold text-lg sm:text-2xl text-slate-900 dark:text-white">TikTok LIVE Visibility</p>
                                       <p className="text-[10px] sm:text-xs font-black text-muted-foreground uppercase tracking-widest mt-1">Show live promo banner on homepage</p>
                                    </div>
                                 </div>
                                 <Switch checked={storeSettings.isLive} onCheckedChange={v => updateStoreSettings({ isLive: v })} className="scale-110 sm:scale-150" />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                 <div className="space-y-4 sm:space-y-6">
                                    <SettingInput label="Support WhatsApp (e.g. 613982172)" value={helpLinksForm.whatsappNumber} onChange={v => setHelpLinksForm(f => ({ ...f, whatsappNumber: v }))} placeholder="252613982172" />
                                    <SettingInput label="TikTok Profile URL" value={helpLinksForm.tiktokUrl} onChange={v => setHelpLinksForm(f => ({ ...f, tiktokUrl: v }))} placeholder="https://tiktok.com/@oskar" />
                                 </div>
                                 <div className="space-y-4 sm:space-y-6">
                                    <SettingInput label="Tutorial Video (YouTube Link)" value={helpLinksForm.tutorialUrl} onChange={v => setHelpLinksForm(f => ({ ...f, tutorialUrl: v }))} placeholder="https://youtube.com/..." />
                                    <div className="space-y-2">
                                       <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Announcement Ticker Text</Label>
                                       <Input 
                                          value={storeSettings.announcementTicker || ''} 
                                          onChange={e => updateStoreSettings({ announcementTicker: e.target.value })} 
                                          className="h-12 sm:h-16 rounded-xl sm:rounded-2xl border-none bg-slate-50 dark:bg-slate-800 font-bold px-4 sm:px-6 shadow-inner" 
                                          placeholder="Welcome to Oskar Shop..." 
                                       />
                                    </div>
                                 </div>
                              </div>
                              <Button onClick={handleSaveHelpLinks} className="w-full h-12 sm:h-16 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest shadow-2xl bg-green-600 hover:bg-green-700">Apply Communications Update</Button>
                           </div>
                        </AccordionContent>
                     </Card>
                  </AccordionItem>

                  {/* Marketplace Economy */}
                  <AccordionItem value="economy" className="border-none">
                     <Card className="rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                        <AccordionTrigger className="px-4 py-6 sm:px-8 sm:py-8 hover:no-underline">
                           <div className="flex items-center gap-4 text-indigo-500">
                              <DollarSign className="w-6 h-6" />
                              <div className="text-left">
                                 h4 className="font-headline font-bold text-lg uppercase tracking-tight">Marketplace Economy</h4>
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Listing fees and shop revenue logic</p>
                              </div>
                           </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-6 pt-2 sm:px-8 sm:pb-8 sm:pt-4">
                           <div className="space-y-6 sm:space-y-10">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                                 <div className="p-5 sm:p-8 bg-slate-50 dark:bg-slate-800/40 rounded-[1.5rem] sm:rounded-[2.5rem] border-2 border-slate-100 dark:border-white/5 space-y-4 sm:space-y-6">
                                    <div className="flex items-center gap-3">
                                       <CalendarIcon className="text-indigo-500 w-5 h-5 sm:w-6 sm:h-6" />
                                       <p className="font-bold text-lg sm:text-xl uppercase tracking-tight">Weekly Fee</p>
                                    </div>
                                    <SettingInput label="Amount ($)" type="number" value={feeConfigForm.listingFeeWeekly.toString()} onChange={v => setFeeConfigForm(f => ({ ...f, listingFeeWeekly: parseFloat(v) }))} placeholder="1.00" />
                                 </div>
                                 <div className="p-5 sm:p-8 bg-slate-50 dark:bg-slate-800/40 rounded-[1.5rem] sm:rounded-[2.5rem] border-2 border-slate-100 dark:border-white/5 space-y-4 sm:space-y-6">
                                    <div className="flex items-center gap-3">
                                       <CalendarIcon className="text-indigo-500 w-5 h-5 sm:w-6 sm:h-6" />
                                       <p className="font-bold text-lg sm:text-xl uppercase tracking-tight">Monthly Fee</p>
                                    </div>
                                    <SettingInput label="Amount ($)" type="number" value={feeConfigForm.listingFeeMonthly.toString()} onChange={v => setFeeConfigForm(f => ({ ...f, listingFeeMonthly: parseFloat(v) }))} placeholder="3.00" />
                                 </div>
                              </div>
                              
                              <div className="space-y-2">
                                 <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Admin Payment Number (For Fees)</Label>
                                 <Input 
                                    value={storeSettings.paymentNumber || ''} 
                                    onChange={e => updateStoreSettings({ paymentNumber: e.target.value })} 
                                    className="h-12 sm:h-16 rounded-xl sm:rounded-2xl border-none bg-slate-50 dark:bg-slate-800 font-bold px-4 sm:px-6 shadow-inner" 
                                    placeholder="613982172" 
                                 />
                              </div>

                              <Button onClick={handleSaveFees} className="w-full h-12 sm:h-16 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest shadow-2xl bg-indigo-600 hover:bg-indigo-700">Sync Economy Settings</Button>
                           </div>
                        </AccordionContent>
                     </Card>
                  </AccordionItem>

                  {/* Payment Methods */}
                  <AccordionItem value="payments" className="border-none">
                     <Card className="rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                        <AccordionTrigger className="px-4 py-6 sm:px-8 sm:py-8 hover:no-underline">
                           <div className="flex items-center gap-4 text-emerald-500">
                              <CreditCard className="w-6 h-6" />
                              <div className="text-left">
                                 <h4 className="font-headline font-bold text-lg uppercase tracking-tight">Payment Ecosystem</h4>
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Manage available payment providers</p>
                              </div>
                           </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-0">
                           <div className="p-4 sm:p-8 border-b dark:border-white/5 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/20">
                              <h3 className="font-bold text-sm sm:text-base uppercase tracking-widest text-muted-foreground">Active Providers</h3>
                              <Button size="sm" onClick={() => handleOpenPaymentMethodDialog()} className="h-10 sm:h-12 rounded-xl gap-2 font-black px-4 sm:px-6 shadow-xl shadow-emerald-500/20 bg-emerald-600">+ Add Method</Button>
                           </div>
                           <div className="overflow-x-auto scrollbar-hide">
                             <Table className="min-w-[700px]">
                               <TableHeader className="bg-slate-50/50 dark:bg-slate-800/40">
                                 <TableRow className="border-none">
                                   <TableHead className="px-4 sm:px-8 font-bold">Provider</TableHead>
                                   <TableHead className="font-bold">USSD Template</TableHead>
                                   <TableHead className="font-bold">Status</TableHead>
                                   <TableHead className="text-right px-4 sm:px-8 font-bold">Action</TableHead>
                                 </TableRow>
                               </TableHeader>
                               <TableBody>
                                 {paymentMethods.map(m => (
                                   <TableRow key={m.id} className="border-slate-50 dark:border-white/5">
                                     <TableCell className="px-4 sm:px-8">
                                        <div className="flex items-center gap-3 sm:gap-4">
                                           <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden relative shrink-0 border border-white dark:border-white/10 shadow-sm">
                                              {m.icon ? <Image src={m.icon} alt="" fill className="object-cover" /> : <Monitor size={18} className="m-auto mt-3 text-slate-300"/>}
                                           </div>
                                           <span className="font-black text-xs sm:text-sm uppercase tracking-widest">{m.name}</span>
                                        </div>
                                     </TableCell>
                                     <TableCell><code className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-black text-primary font-mono">{m.ussdTemplate}</code></TableCell>
                                     <TableCell>
                                        {m.active ? <Badge className="bg-green-500 text-white border-none text-[8px] font-black uppercase tracking-widest">Live</Badge> : <Badge className="bg-slate-500 text-white border-none text-[8px] font-black uppercase tracking-widest">Paused</Badge>}
                                     </TableCell>
                                     <TableCell className="text-right px-4 sm:px-8">
                                        <div className="flex justify-end gap-1 sm:gap-2">
                                           <Button size="icon" variant="ghost" className="h-9 w-9 sm:h-10 sm:w-10 text-blue-500 rounded-lg sm:rounded-xl" onClick={() => handleOpenPaymentMethodDialog(m)}><Edit size={16}/></Button>
                                           <Button size="icon" variant="ghost" className="h-9 w-9 sm:h-10 sm:w-10 text-red-500 rounded-lg sm:rounded-xl" onClick={() => confirmDelete(m.id, 'payment')}><Trash2 size={16}/></Button>
                                        </div>
                                     </TableCell>
                                   </TableRow>
                                 ))}
                               </TableBody>
                             </Table>
                           </div>
                        </AccordionContent>
                     </Card>
                  </AccordionItem>

                  {/* Onboarding Slider */}
                  <AccordionItem value="onboarding" className="border-none">
                     <Card className="rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                        <AccordionTrigger className="px-4 py-6 sm:px-8 sm:py-8 hover:no-underline">
                           <div className="flex items-center gap-4 text-purple-500">
                              <Monitor className="w-6 h-6" />
                              <div className="text-left">
                                 <h4 className="font-headline font-bold text-lg uppercase tracking-tight">Onboarding Slider</h4>
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Manage the 3-step introductory screens</p>
                              </div>
                           </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-6 pt-2 sm:px-8 sm:pb-8 sm:pt-4">
                           <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-10">
                              {[0, 1, 2].map(idx => (
                                <div key={idx} className="space-y-4">
                                   <p className="text-[10px] font-black uppercase text-slate-400 text-center tracking-widest">Slide {idx + 1}</p>
                                   <div className="relative aspect-[3/4] rounded-[1.5rem] sm:rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-white/10 overflow-hidden group shadow-lg">
                                      {storeSettings.onboardingImages?.[idx] ? (
                                        <Image src={storeSettings.onboardingImages[idx]} alt={`Slide ${idx + 1}`} fill className="object-cover" unoptimized />
                                      ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30">
                                           <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 mb-2" />
                                           <p className="text-[10px] font-black uppercase">No Image</p>
                                        </div>
                                      )}
                                      <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => e.target.files?.[0] && handleOnboardingImageUpload(e.target.files[0], idx)} />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase text-center p-4 sm:p-6">Click to Upload Slide {idx + 1}</div>
                                      {isUploading && <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex items-center justify-center z-20"><Loader2 className="animate-spin text-primary" /></div>}
                                   </div>
                                </div>
                              ))}
                           </div>
                        </AccordionContent>
                     </Card>
                  </AccordionItem>

                  {/* Terms & Conditions */}
                  <AccordionItem value="terms" className="border-none">
                     <Card className="rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                        <AccordionTrigger className="px-4 py-6 sm:px-8 sm:py-8 hover:no-underline">
                           <div className="flex items-center gap-4 text-purple-600">
                              <ScrollText className="w-6 h-6" />
                              <div className="text-left">
                                 <h4 className="font-headline font-bold text-lg uppercase tracking-tight">Terms & Conditions</h4>
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Legal agreements and user policies</p>
                              </div>
                           </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-6 pt-2 sm:px-8 sm:pb-8 sm:pt-4">
                           <div className="space-y-6 sm:space-y-10">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                 <div className="space-y-3 sm:space-y-4">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Somali Version</Label>
                                    <Textarea 
                                      placeholder="Geli shuruudaha iyo qawaaniinta (Somali)..." 
                                      value={termsForm.so} 
                                      onChange={e => setTermsForm(f => ({ ...f, so: e.target.value }))} 
                                      className="rounded-xl sm:rounded-2xl border-none bg-slate-50 dark:bg-slate-800 font-medium min-h-[200px] sm:min-h-[300px] shadow-inner p-4 sm:p-6" 
                                    />
                                 </div>
                                 <div className="space-y-3 sm:space-y-4">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">English Version</Label>
                                    <Textarea 
                                      placeholder="Enter terms and conditions (English)..." 
                                      value={termsForm.en} 
                                      onChange={e => setTermsForm(f => ({ ...f, en: e.target.value }))} 
                                      className="rounded-xl sm:rounded-2xl border-none bg-slate-50 dark:bg-slate-800 font-medium min-h-[200px] sm:min-h-[300px] shadow-inner p-4 sm:p-6" 
                                    />
                                 </div>
                              </div>
                              <Button onClick={handleSaveTerms} className="w-full h-12 sm:h-16 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest shadow-2xl bg-purple-600 hover:bg-purple-700">Sync Terms & Conditions</Button>
                           </div>
                        </AccordionContent>
                     </Card>
                  </AccordionItem>
               </Accordion>
            </div>
          )}
        </main>
      </div>

      <Dialog open={isUserManageOpen} onOpenChange={setIsUserManageOpen}>
        <DialogContent className="max-w-md w-[95%] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900 animate-in zoom-in duration-300">
           <DialogHeader className="sr-only">
             <DialogTitle>User Management: {selectedUser?.name}</DialogTitle>
           </DialogHeader>
           
           <div className="h-24 sm:h-32 bg-gradient-to-r from-primary to-blue-600 relative shrink-0">
              <div className="absolute -bottom-8 sm:-bottom-12 left-6 sm:left-8 group">
                 <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl border-[3px] sm:border-4 border-white dark:border-slate-900 bg-slate-100 overflow-hidden shadow-2xl relative">
                    {selectedUser?.photoURL ? <Image src={selectedUser.photoURL} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={32} /></div>}
                    {selectedUser?.banned && (
                      <div className="absolute inset-0 bg-red-500/40 flex items-center justify-center">
                         <Ban className="text-white w-6 h-6 sm:w-8 sm:h-8" />
                      </div>
                    )}
                 </div>
                 {selectedUser?.isAdmin && (
                   <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-amber-400 text-white p-1 sm:p-1.5 rounded-lg sm:rounded-xl shadow-lg border-[2px] sm:border-2 border-white dark:border-slate-900">
                      <ShieldCheck className="w-3 h-3 sm:w-[14px] sm:h-[14px]" />
                   </div>
                 )}
              </div>
           </div>

           <div className="p-5 sm:p-8 pt-10 sm:pt-16 space-y-6 sm:space-y-8">
              <div className="flex justify-between items-start">
                 <div className="min-w-0 pr-2">
                    <h3 className="text-lg sm:text-2xl font-headline font-bold text-slate-900 dark:text-white tracking-tight truncate">{selectedUser?.name}</h3>
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">{selectedUser?.email}</p>
                    <div className="flex items-center gap-2 mt-1 sm:mt-2">
                       <Smartphone className="w-2.5 h-2.5 sm:w-[10px] sm:h-[10px] text-slate-400" />
                       <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">{selectedUser?.phoneNumber || 'No phone'}</span>
                    </div>
                 </div>
                 <Badge variant={selectedUser?.banned ? "destructive" : "outline"} className="rounded-lg uppercase text-[6px] sm:text-[8px] font-black tracking-widest px-2 py-0.5 sm:px-3 sm:py-1 shrink-0">
                    {selectedUser?.banned ? 'Banned' : 'Active'}
                 </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                 <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl sm:rounded-2xl border dark:border-white/5 shadow-inner">
                    <p className="text-[7px] sm:text-[9px] font-black uppercase text-slate-400 mb-0.5 sm:mb-1 tracking-widest">Balance</p>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                       <div className="p-1 bg-amber-400/10 text-amber-500 rounded-md sm:rounded-lg"><Star className="w-3 h-3 sm:w-[14px] sm:h-[14px]" fill="currentColor" /></div>
                       <p className="text-lg sm:text-2xl font-headline font-bold text-slate-900 dark:text-white">{selectedUser?.points || 0}</p>
                    </div>
                 </div>
                 <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl sm:rounded-2xl border dark:border-white/5 shadow-inner">
                    <p className="text-[7px] sm:text-[9px] font-black uppercase text-slate-400 mb-0.5 sm:mb-1 tracking-widest">Role</p>
                    <Badge className="bg-primary/10 text-primary border-none text-[8px] sm:text-[10px] font-black uppercase">{selectedUser?.role}</Badge>
                 </div>
              </div>

              <div className="space-y-2 sm:space-y-4">
                 <div className="flex items-center gap-2 ml-1">
                    <LayoutDashboard className="w-3 h-3 sm:w-[14px] sm:h-[14px] text-primary" />
                    <Label className="text-[8px] sm:text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Role Management</Label>
                 </div>
                 <Select 
                   value={selectedUser?.role} 
                   onValueChange={(val: any) => {
                     manageUser(selectedUser.uid, { role: val });
                     setSelectedUser({ ...selectedUser, role: val });
                   }}
                 >
                    <SelectTrigger className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-4 sm:px-6 font-bold text-xs sm:text-sm shadow-inner focus:ring-primary">
                       <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl z-[200]">
                       {['user', 'staff', 'admin', 'super_admin'].map(r => (
                         <SelectItem key={r} value={r} className="rounded-xl font-bold uppercase text-xs p-3">{r}</SelectItem>
                       ))}
                    </SelectContent>
                 </Select>
              </div>

              <div className="space-y-2 sm:space-y-4">
                 <div className="flex items-center gap-2 ml-1">
                    <DollarSign className="w-3 h-3 sm:w-[14px] sm:h-[14px] text-amber-500" />
                    <Label className="text-[8px] sm:text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Wallet Adjustments</Label>
                 </div>
                 <div className="flex gap-2 sm:gap-3">
                    <Input 
                      type="number" 
                      placeholder="Amt" 
                      value={pointAdjustment} 
                      onChange={e => setPointAdjustment(e.target.value)} 
                      className="h-12 sm:h-14 rounded-xl sm:rounded-2xl dark:bg-slate-800 border-none shadow-inner font-bold px-4 sm:px-6 text-xs sm:text-sm" 
                    />
                    <Button onClick={() => handleAdjustPoints('credit')} className="h-12 sm:h-14 w-12 sm:w-14 rounded-xl sm:rounded-2xl bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20 shrink-0">
                       <ArrowUpCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                    </Button>
                    <Button onClick={() => handleAdjustPoints('debit')} className="h-12 sm:h-14 w-12 sm:w-14 rounded-xl sm:rounded-2xl bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 shrink-0">
                       <ArrowDownCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                    </Button>
                 </div>
              </div>

              <div className="pt-2 sm:pt-4 flex flex-col gap-2 sm:gap-3">
                 <Button 
                   variant={selectedUser?.banned ? "default" : "destructive"} 
                   onClick={handleBanUser} 
                   className="w-full h-14 sm:h-16 rounded-[1.25rem] sm:rounded-[1.5rem] font-black gap-2 sm:gap-3 uppercase tracking-widest text-xs sm:text-sm shadow-xl active:scale-95 transition-all"
                 >
                    {selectedUser?.banned ? <><ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" /> Unban</> : <><Ban className="w-4 h-4 sm:w-5 sm:h-5" /> Terminate</>}
                 </Button>
                 <p className="text-[8px] font-bold text-center text-slate-300 uppercase tracking-widest">
                    Joined: {selectedUser?.createdAt ? format(new Date(selectedUser.createdAt), 'MMM d, yyyy') : 'Recently'}
                 </p>
              </div>
           </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isGameDialogOpen} onOpenChange={setIsGameDialogOpen}>
        <DialogContent className="max-w-md w-[95%] rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-8 border-none shadow-2xl bg-white dark:bg-slate-900">
           <DialogHeader><DialogTitle className="text-xl sm:text-2xl font-headline font-bold">{editingGame ? 'Edit Game' : 'Add New Game'}</DialogTitle></DialogHeader>
           <form onSubmit={handleSaveGame} className="space-y-5 sm:space-y-6 mt-4 sm:mt-6">
              <div className="flex justify-center mb-4">
                 <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-white/5 flex items-center justify-center group overflow-hidden">
                    {gameForm.icon ? <Image src={gameForm.icon} alt="" fill className="object-cover" /> : <ImageIcon className="text-slate-300" />}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'game')} />
                 </div>
              </div>
              <div className="space-y-1.5 sm:space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Title</Label><Input value={gameForm.title} onChange={e => setGameForm({ ...gameForm, title: e.target.value })} className="h-11 sm:h-12 rounded-xl dark:bg-slate-800 border-none px-4" placeholder="Free Fire, PUBG, etc." required /></div>
              <div className="space-y-1.5 sm:space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Category</Label><Select value={gameForm.category} onValueChange={v => setGameForm({ ...gameForm, category: v as any })}><SelectTrigger className="h-11 sm:h-12 rounded-xl dark:bg-slate-800 border-none"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="top-up">Top-Up Packages</SelectItem><SelectItem value="accounts">Account Marketplace</SelectItem></SelectContent></Select></div>
              <Button type="submit" disabled={isUploading} className="w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl font-bold shadow-lg uppercase tracking-widest">{isUploading ? <Loader2 className="animate-spin" /> : "Save Game Collection"}</Button>
           </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-xl w-[95%] rounded-[2rem] sm:rounded-[3rem] p-0 border-none shadow-2xl bg-white dark:bg-slate-900 max-h-[90vh] overflow-y-auto scrollbar-hide">
           <div className="h-2 bg-primary w-full shrink-0" />
           <DialogHeader className="p-6 sm:p-10 pb-0">
             <DialogTitle className="text-xl md:text-3xl font-headline font-bold text-slate-900 dark:text-white uppercase tracking-tight">{editingProduct ? 'Edit Inventory' : 'New Package'}</DialogTitle>
           </DialogHeader>

           <form onSubmit={handleSaveProduct} className="p-5 sm:p-10 space-y-6 sm:space-y-8">
              <div className="flex flex-col items-center gap-4">
                 <div className="relative w-full aspect-video rounded-2xl md:rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center group overflow-hidden shadow-inner transition-all hover:border-primary/40">
                    {productForm.thumbnail ? (
                      <Image src={productForm.thumbnail} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <>
                        <ImageIcon className="text-slate-300 w-10 h-10 md:w-12 md:h-12 mb-2" />
                        <span className="text-[10px] font-black uppercase text-slate-400">Add Package Media</span>
                      </>
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'product')} />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase">Change Image</div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                 <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-[10px] sm:text-xs font-black uppercase text-slate-400 ml-1 tracking-widest">Item Title</Label>
                    <Input value={productForm.title} onChange={e => setProductForm({ ...productForm, title: e.target.value })} className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold px-4 sm:px-6 shadow-inner" placeholder="100 Diamonds" required />
                 </div>
                 <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-[10px] sm:text-xs font-black uppercase text-slate-400 ml-1 tracking-widest">Parent Game</Label>
                    <Select value={productForm.gameId} onValueChange={v => setProductForm({ ...productForm, gameId: v })}>
                       <SelectTrigger className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-4 sm:px-6 font-bold shadow-inner">
                          <SelectValue placeholder="Select Game" />
                       </SelectTrigger>
                       <SelectContent className="rounded-2xl border-none shadow-2xl z-[200]">
                          {games.filter(g => g.category === 'top-up').map(g => <SelectItem key={g.id} value={g.id} className="p-3 font-bold uppercase text-xs">{g.title}</SelectItem>)}
                       </SelectContent>
                    </Select>
                 </div>
              </div>

              <div className="p-5 sm:p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl md:rounded-[2rem] border dark:border-white/5 space-y-4 sm:space-y-6">
                 <div className="flex items-center gap-3 text-primary mb-1 sm:mb-2">
                    <DollarSign size={16} className="md:size-[18px]" />
                    <h4 className="font-bold text-xs sm:text-sm uppercase tracking-tight">Financial Config</h4>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-1.5 sm:space-y-2">
                       <Label className="text-[10px] sm:text-xs font-black uppercase text-slate-400 ml-1">Real Price ($)</Label>
                       <Input type="number" step="0.01" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} className="h-12 md:h-14 rounded-xl bg-white dark:bg-slate-900 border-none font-bold px-4 sm:px-6 shadow-inner" placeholder="2.99" required />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                       <Label className="text-[10px] sm:text-xs font-black uppercase text-slate-400 ml-1">Promo Price ($) - Optional</Label>
                       <Input type="number" step="0.01" value={productForm.discountedPrice} onChange={e => setProductForm({ ...productForm, discountedPrice: e.target.value })} className="h-12 md:h-14 rounded-xl bg-white dark:bg-slate-900 border-none font-bold px-4 sm:px-6 shadow-inner" placeholder="1.99" />
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-[10px] sm:text-xs font-black uppercase text-slate-400 ml-1 tracking-widest">Special Category</Label>
                    <Select value={productForm.category} onValueChange={v => setProductForm({ ...productForm, category: v as any })}>
                       <SelectTrigger className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-4 sm:px-6 font-bold shadow-inner">
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent className="rounded-2xl border-none shadow-2xl z-[200]">
                          <SelectItem value="top-up" className="p-3 font-bold uppercase text-xs">Normal Top-Up</SelectItem>
                          <SelectItem value="booyah-pass" className="p-3 font-bold uppercase text-xs">Booyah Pass (Direct WA)</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>

                 {productForm.category === 'booyah-pass' && (
                   <div className="space-y-1.5 sm:space-y-2 animate-in slide-in-from-top-4 duration-500">
                      <Label className="text-[10px] sm:text-xs font-black uppercase text-primary ml-1 tracking-widest flex items-center gap-2">
                         <Smartphone size={12} /> Admin WhatsApp (Direct Orders)
                      </Label>
                      <Input value={productForm.whatsappNumber} onChange={e => setProductForm({ ...productForm, whatsappNumber: e.target.value })} className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-primary/5 dark:bg-primary/10 border-2 border-primary/20 font-bold px-4 sm:px-6 shadow-inner" placeholder="252613982172" />
                      <p className="text-[8px] sm:text-[9px] font-bold text-muted-foreground italic ml-2">* Used for redirecting users directly to your DM for Booyah Pass purchases.</p>
                   </div>
                 )}
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                 <Label className="text-[10px] sm:text-xs font-black uppercase text-slate-400 ml-1">Short Description</Label>
                 <Textarea value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} className="rounded-xl md:rounded-2xl border-none bg-slate-50 dark:bg-slate-800 font-medium p-4 sm:p-6 shadow-inner min-h-[100px]" placeholder="Get 100 FF diamonds fast" />
              </div>

              <Button type="submit" disabled={isUploading} className="w-full h-14 md:h-18 rounded-xl md:rounded-[2.5rem] font-black text-xs sm:text-lg md:text-xl shadow-2xl shadow-primary/30 uppercase tracking-widest active:scale-95 transition-all">
                {isUploading ? <Loader2 className="animate-spin w-6 h-6" /> : "Save Inventory Package"}
              </Button>
           </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="max-w-md w-[95%] rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-8 border-none shadow-2xl bg-white dark:bg-slate-900">
           <DialogHeader><DialogTitle className="text-xl sm:text-2xl font-headline font-bold">{editingEvent ? 'Edit Event' : 'New Event'}</DialogTitle></DialogHeader>
           <form onSubmit={handleSaveEvent} className="space-y-5 sm:space-y-6 mt-4 sm:mt-6">
              <div className="flex justify-center mb-4">
                 <div className="relative w-full aspect-video rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-white/5 flex items-center justify-center group overflow-hidden">
                    {eventForm.thumbnailUrl ? <Image src={eventForm.thumbnailUrl} alt="" fill className="object-cover" unoptimized /> : <ImageIcon className="text-slate-300" />}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'event')} />
                 </div>
              </div>
              <div className="space-y-1.5 sm:space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Title</Label><Input value={eventForm.title} onChange={e => setEventForm({ ...eventForm, title: e.target.value })} className="h-11 sm:h-12 rounded-xl dark:bg-slate-800 border-none px-4" placeholder="Flash Sale Sunday!" required /></div>
              <div className="space-y-1.5 sm:space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Short Tagline</Label><Input value={eventForm.shortDescription} onChange={e => setEventForm({ ...eventForm, shortDescription: e.target.value })} className="h-11 sm:h-12 rounded-xl dark:bg-slate-800 border-none" placeholder="30% off for 24 hours" required /></div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                 <div className="space-y-1.5 sm:space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Duration</Label><Input type="number" value={eventForm.duration} onChange={e => setEventForm({ ...eventForm, duration: e.target.value })} className="h-11 sm:h-12 rounded-xl dark:bg-slate-800 border-none" placeholder="24" /></div>
                 <div className="space-y-1.5 sm:space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Unit</Label><Select value={eventForm.durationUnit} onValueChange={v => setEventForm({ ...eventForm, durationUnit: v })}> <SelectTrigger className="h-11 sm:h-12 rounded-xl dark:bg-slate-800 border-none"><SelectValue /></SelectTrigger> <SelectContent className="rounded-xl"><SelectItem value="days">Days</SelectItem><SelectItem value="hours">Hours</SelectItem><SelectItem value="minutes">Minutes</SelectItem></SelectContent> </Select></div>
              </div>
              <Button type="submit" disabled={isUploading} className="w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl font-bold shadow-lg uppercase tracking-widest">{isUploading ? <Loader2 className="animate-spin" /> : "Save Live Event"}</Button>
           </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isBannerDialogOpen} onOpenChange={setIsBannerDialogOpen}>
        <DialogContent className="max-w-md w-[95%] rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-8 border-none shadow-2xl bg-white dark:bg-slate-900">
           <DialogHeader>
             <DialogTitle className="text-xl sm:text-2xl font-headline font-bold">New Promotion Banner</DialogTitle>
             <DialogDescription className="text-xs">This image will appear in the homepage slider.</DialogDescription>
           </DialogHeader>
           <div className="space-y-5 sm:space-y-6 mt-4 sm:mt-6">
              <div className="flex justify-center mb-4">
                 <div className="relative w-full aspect-[3/1] rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center group overflow-hidden">
                    {bannerForm.imageUrl ? (
                      <Image src={bannerForm.imageUrl} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <ImageIcon className="text-slate-300" />
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'banner')} />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase text-center p-4">Click to Upload Image</div>
                    {isUploading && <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex items-center justify-center z-20"><Loader2 className="animate-spin text-primary" /></div>}
                 </div>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Link Target (Optional)</Label>
                <Input value={bannerForm.linkTo} onChange={e => setBannerForm({ ...bannerForm, linkTo: e.target.value })} className="h-11 sm:h-12 rounded-xl dark:bg-slate-800 border-none px-4" placeholder="e.g. #games-freefire" />
              </div>
              <Button onClick={handleSaveBanner} disabled={isUploading || !bannerForm.imageUrl} className="w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl font-bold shadow-lg uppercase tracking-widest">{isUploading ? <Loader2 className="animate-spin" /> : "Publish Banner"}</Button>
           </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentMethodDialogOpen} onOpenChange={setIsPaymentMethodDialogOpen}>
        <DialogContent className="max-w-md w-[95%] rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-8 border-none shadow-2xl bg-white dark:bg-slate-900">
           <DialogHeader><DialogTitle className="text-xl sm:text-2xl font-headline font-bold">{editingPaymentMethod ? 'Edit Method' : 'Add Payment Method'}</DialogTitle></DialogHeader>
           <form onSubmit={handleSavePaymentMethod} className="space-y-5 sm:space-y-6 mt-4 sm:mt-6">
              <div className="flex justify-center mb-4">
                 <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-white/5 flex items-center justify-center group overflow-hidden">
                    {paymentMethodForm.icon ? <Image src={paymentMethodForm.icon} alt="" fill className="object-cover" /> : <Smartphone className="text-slate-300" />}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'payment')} />
                 </div>
              </div>
              <div className="space-y-1.5 sm:space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Provider Name</Label><Input value={paymentMethodForm.name} onChange={e => setPaymentMethodForm({ ...paymentMethodForm, name: e.target.value })} className="h-11 sm:h-12 rounded-xl dark:bg-slate-800 border-none" placeholder="EVC Plus, Premier, etc." required /></div>
              <div className="space-y-1.5 sm:space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 ml-1">USSD Template ($ for price)</Label><Input value={paymentMethodForm.ussdTemplate} onChange={e => setPaymentMethodForm({ ...paymentMethodForm, ussdTemplate: e.target.value })} className="h-11 sm:h-12 rounded-xl dark:bg-slate-800 border-none font-mono" placeholder="*712*613982172*$#" required /></div>
              <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                 <span className="text-xs font-bold">Active Method</span>
                 <Switch checked={paymentMethodForm.active} onCheckedChange={v => setPaymentMethodForm({ ...paymentMethodForm, active: v })} />
              </div>
              <Button type="submit" disabled={isUploading} className="w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl font-bold shadow-lg uppercase tracking-widest">{isUploading ? <Loader2 className="animate-spin" /> : "Save Payment Method"}</Button>
           </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm w-[90%] rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-10 border-none shadow-2xl bg-white dark:bg-slate-900">
           <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center text-red-500 mb-2"><AlertCircle size={32} /></div>
              <DialogTitle className="text-lg sm:text-xl font-headline font-bold">Confirm Deletion</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">This action is permanent. Are you sure you want to delete this {deleteTarget?.type} record?</DialogDescription>
              <div className="flex gap-2 sm:gap-3 w-full pt-4">
                 <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1 rounded-xl h-11 sm:h-12 font-bold text-xs sm:text-sm">Cancel</Button>
                 <Button variant="destructive" onClick={executeDelete} className="flex-1 rounded-xl h-11 sm:h-12 font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-lg shadow-red-500/20">Delete Now</Button>
              </div>
           </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEnforceDialogOpen} onOpenChange={setIsEnforceDialogOpen}>
        <DialogContent className="max-w-md w-[95%] rounded-[2rem] sm:rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900 animate-in zoom-in duration-300">
           <div className="bg-red-600 p-6 sm:p-8 text-white">
              <div className="flex justify-between items-start">
                 <div>
                    <DialogTitle className="text-xl sm:text-2xl font-headline font-bold">Penalty Enforcement</DialogTitle>
                    <p className="text-white/60 text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-1">Listing: #{selectedAccount?.id.toUpperCase()}</p>
                 </div>
              </div>
           </div>
           
           <div className="p-6 sm:p-8 space-y-5 sm:space-y-6">
              <div className="space-y-3 sm:space-y-4">
                 <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Enforcement Action</Label>
                 <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {['delete', 'holding', 'approved', 'pending'].map((act) => (
                       <Button 
                        key={act}
                        variant={enforceAction === act ? 'default' : 'outline'}
                        onClick={() => setEnforceAction(act as any)}
                        className={cn( "h-11 sm:h-12 rounded-xl font-bold uppercase text-[9px] sm:text-[10px] transition-all", enforceAction === act && act === 'delete' ? 'bg-red-600 hover:bg-red-700 shadow-lg' : '' )}
                       >
                          {act}
                       </Button>
                    ))}
                 </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                 <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Seller Message</Label>
                 <Textarea 
                   value={enforceMessage}
                   onChange={e => setEnforceMessage(e.target.value)}
                   className="rounded-xl sm:rounded-2xl dark:bg-slate-800 border-none p-4 min-h-[100px] sm:min-h-[120px] shadow-inner font-medium italic text-xs sm:text-sm"
                   placeholder="e.g. Your listing was removed due to invalid proof."
                 />
              </div>

              <Button onClick={handleEnforceAccountPenalty} disabled={isSavingStatus || !enforceMessage} className="w-full h-14 sm:h-16 rounded-xl sm:rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-sm sm:text-lg gap-2 shadow-2xl active:scale-95 transition-all uppercase tracking-widest">
                {isSavingStatus ? <Loader2 className="animate-spin" /> : <><span className="mr-1">Apply Penalty</span> <Send size={18} /></>}
              </Button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SideNavItem({ active, expanded, onClick, icon: Icon, label, className, badge }: { active: boolean, expanded: boolean, onClick: () => void, icon: any, label: string, className?: string, badge?: number }) {
  return (
    <button onClick={onClick} className={cn("w-full h-12 flex items-center transition-all duration-300 rounded-xl relative group", active ? "bg-primary text-white shadow-lg" : "text-slate-400 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800", expanded ? "px-4 gap-4" : "justify-center", className)}>
      <Icon size={20} className="shrink-0" />
      {expanded && <span className="font-bold text-sm whitespace-nowrap overflow-hidden flex-1 text-left">{label}</span>}
      {badge !== undefined && badge > 0 && <span className={cn("bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center transition-all", expanded ? "px-2 py-0.5" : "absolute top-1 right-1 w-4 h-4")}>{badge}</span>}
    </button>
  );
}

function StatCard({ label, value, icon: Icon, color, badge }: { label: string, value: string, icon: any, color: string, badge?: boolean }) {
  const colors: Record<string, string> = { blue: "bg-blue-50 dark:bg-blue-500/10 text-blue-500", amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-500", emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500", indigo: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500" };
  return (
    <Card className="rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-6 border-none shadow-lg bg-white dark:bg-slate-900 relative">
      {badge && <div className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />}
      <div className={cn("w-10 h-10 sm:w-12 h-12 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6", colors[color])}><Icon size={20} className="sm:w-6 sm:h-6" /></div>
      <h3 className="text-xl sm:text-3xl font-headline font-bold text-slate-900 dark:text-white mb-1 truncate">{value}</h3>
      <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em] sm:tracking-[0.2em]">{label}</p>
    </Card>
  );
}

function DetailItem({ icon: Icon, label, value, color }: { icon: any, label: string, value: any, color?: string }) {
  return (
    <div className="space-y-1">
       <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5"><Icon size={10} /> {label}</p>
       <p className={cn("text-sm font-bold text-slate-900 dark:text-white truncate", color)}>{value}</p>
    </div>
  );
}

function SettingInput({ label, value, onChange, placeholder, type = "text" }: { label: string, value: string, onChange: (v: string) => void, placeholder: string, type?: string }) {
  return (
    <div className="space-y-2">
       <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">{label}</Label>
       <Input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} className="h-12 sm:h-16 rounded-xl sm:rounded-2xl border-none bg-slate-50 dark:bg-slate-800 font-bold px-4 sm:px-6 shadow-inner" />
    </div>
  );
}
