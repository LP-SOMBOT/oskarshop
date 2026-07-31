"use client";

import { useState, useMemo, useEffect, useRef } from "react";
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
  X,
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
  Ticket,
  GripVertical,
  Trophy,
  Save,
  Info,
  Video,
  UserCheck,
  Globe,
  BellRing,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ref, onValue, off, get } from "firebase/database";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import VerifiedBadge from "@/components/VerifiedBadge";

// DND Kit Imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensors,
  useSensor,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';

function MarketplaceExpiration({ createdAt, status }: { createdAt?: number, status: string }) {
  const [age, setAge] = useState("Just now");

  useEffect(() => {
    if (!createdAt) return;
    
    const update = () => {
      setAge(formatDistanceToNow(new Date(createdAt)));
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [createdAt]);

  if (status === 'sold') return <Badge className="bg-slate-100 text-slate-400 border-none text-[8px] font-black uppercase">SOLD</Badge>;

  return (
    <div className="flex flex-col items-start text-left">
      <span className="text-[11px] font-black text-primary uppercase tracking-tight">
        {age}
      </span>
      <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">
        WAIT TIME
      </span>
    </div>
  );
}

function WaitTime({ post }: { post: any }) {
  const [elapsed, setElapsed] = useState("None");
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const claimants = Object.values(post.claimants || {});
    const pendingClaims = claimants.filter((c: any) => c.status === 'pending');
    const claimTime = pendingClaims.length > 0 ? Math.min(...pendingClaims.map((c: any) => {
      const t = Number(c.timestamp);
      return isNaN(t) ? Infinity : t;
    })) : null;
    
    if (!claimTime || claimTime === Infinity || post.sold || post.sellerReported || post.status === 'sold' || post.status === 'approved') {
      setElapsed("None");
      setIsUrgent(false);
      return;
    }

    const update = () => {
      const diff = Date.now() - claimTime;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % (3600000) / 60000));
      
      if (h === 0) {
        setElapsed(m === 0 ? "less than a minute" : `${m}m`);
      } else {
        setElapsed(`${h}h ${m}m`);
      }
      
      setIsUrgent(h >= 1 && !post.sellerReported && !post.warningDismissedAt);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => typeof window !== 'undefined' && clearInterval(interval);
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

// Sortable Item Component
function SortableProductItem({ p, onEdit, onDelete }: { p: any, onEdit: () => void, onDelete: (e: any) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: p.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : undefined,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-3 md:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border dark:border-white/5 flex items-center justify-between group hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer",
        isDragging && "opacity-50 border-primary ring-2 ring-primary/20 shadow-2xl scale-[1.02]"
      )}
      onClick={onEdit}
    >
      <div className="flex items-center gap-3 md:gap-5 min-w-0">
        <div 
          {...attributes} 
          {...listeners}
          className="p-2 text-slate-300 hover:text-primary transition-colors cursor-grab active:cursor-grabbing shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={20} />
        </div>
        <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl overflow-hidden relative shrink-0 shadow-sm border border-white">
          {p.thumbnail ? <Image src={p.thumbnail} alt="" fill className="object-cover" unoptimized /> : <div className="w-full h-full bg-slate-200" />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-sm md:text-lg text-slate-900 dark:text-white leading-tight truncate">{p.title}</p>
            {p.isOneTime && <Badge className="bg-red-500 text-white text-[7px] uppercase font-black px-1.5 h-4">One Time</Badge>}
          </div>
          <p className="text-[10px] md:sm font-black text-primary mt-0.5">${p.price}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(e); }} 
          className="p-2 text-slate-300 hover:text-red-500 transition-colors"
        >
          <Trash2 size={16} />
        </button>
        <ChevronRight size={18} className="text-slate-300" />
      </div>
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
    eventAccounts,
    saveEventAccount,
    deleteEventAccount,
    assignEventWinner,
    updateEventStatus,
    promoCodes,
    savePromoCode,
    deletePromoCode,
    events,
    banners,
    markAdminNotificationsAsRead,
    updateOrderStatus,
    updateAccountPostStatus,
    enforceAccountAction,
    suspendSeller,
    dismissAccountWarning,
    deleteUser: deleteUserFn,
    manageUser,
    saveGame,
    deleteGame,
    saveProduct,
    deleteProduct,
    updateProductsOrder,
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
    refreshAdminData,
    resetLeaderboard,
    setGlobalLoading,
    rtdb,
    adminNotifications
  } = useApp();

  const router = useRouter();

  const [activeView, setActiveTab] = useState<'dashboard' | 'orders' | 'inventory' | 'account-posts' | 'account-events' | 'events' | 'users' | 'settings' | 'promo-codes' | 'leaderboard'>('dashboard');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const [expandedGameId, setExpandedGameId] = useState<string | null>(null);

  const [userSearch, setSearchQuery] = useState("");

  const [isGameDialogOpen, setIsGameDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [isBannerDialogOpen, setIsBannerDialogOpen] = useState(false);
  const [isPaymentMethodDialogOpen, setIsPaymentMethodDialogOpen] = useState(false);
  const [isPromoDialogOpen, setIsPromoDialogOpen] = useState(false);
  const [isPromoUsageOpen, setIsPromoUsageOpen] = useState(false);
  const [isUserManageOpen, setIsUserManageOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEndEarlyDialogOpen, setIsEndEarlyDialogOpen] = useState(false);
  const [isEnforceDialogOpen, setIsEnforceDialogOpen] = useState(false);

  const [editingGame, setEditingGame] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<any>(null);
  const [selectedPromo, setSelectedPromo] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  const [pendingOrderStatus, setPendingStatus] = useState<string>("");
  const [cancellationReason, setCancellationReason] = useState<string>("");
  const [pendingAccountStatus, setPendingAccountStatus] = useState<string>("");
  const [assignBuyerId, setAssignBuyerId] = useState<string>("");
  const [enforceMessage, setEnforceMessage] = useState("");
  const [enforceAction, setEnforceAction] = useState<'delete' | 'holding' | 'approved' | 'pending'>('delete');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, type: string } | null>(null);
  const [endEarlyTargetId, setEndEarlyTargetId] = useState<string | null>(null);

  const [gameForm, setGameForm] = useState({ title: "", icon: "", category: "top-up", autoDetectName: false });
  const [productForm, setProductForm] = useState({ title: "", gameId: "", category: "top-up" as any, description: "", price: "", discountedPrice: "", thumbnail: "", whatsappNumber: "", isOneTime: false });
  const [eventForm, setEventForm] = useState({ title: "", shortDescription: "", content: "", thumbnailUrl: "", type: "freefire_event" as any, active: true, duration: "", durationUnit: "days", redirectRoute: "", buttonText: "" });
  const [bannerForm, setBannerForm] = useState({ imageUrl: "", linkTo: "" });
  const [paymentMethodForm, setPaymentMethodForm] = useState({ name: "", icon: "", ussdTemplate: "", active: true });
  const [promoCodeForm, setPromoCodeInput] = useState({ code: "", discount: "", duration: "", durationUnit: "days", note: "", type: 'single_use' as any });
  
  const [brandForm, setBrandForm] = useState({ announcementTicker: "", isLive: false, logo: "" });
  const [economyForm, setEconomyForm] = useState({ paymentNumber: "" });
  const [helpLinksForm, setHelpLinksForm] = useState({ tutorialUrl: "", tutorialThumbnail: "", tutorialBannerActive: false, whatsappNumber: "", tiktokUrl: "" });
  const [appStatusForm, setAppStatusForm] = useState({ offline: false, offlineTitle: "", offlineBody: "", offlineImageUrl: "" });
  const [termsForm, setTermsForm] = useState({ en: "", so: "" });
  const [telegramForm, setTelegramForm] = useState({ telegramBotToken: "", telegramAdminChatIds: "" });

  const [leaderboardForm, setLeaderboardForm] = useState({
    rewardsActive: true,
    rewards: { rank1: "", rank2: "", rank3: "" } as any
  });

  const [pointAdjustment, setPointAdjustment] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formsInitialized = useRef(false);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setGlobalLoading(false);
  }, [setGlobalLoading]);

  useEffect(() => {
    if (!loading && !user?.isAdmin) router.replace('/');
  }, [user, loading, router]);

  useEffect(() => {
    if (storeSettings && !formsInitialized.current) {
      setBrandForm({
        announcementTicker: storeSettings.announcementTicker || "",
        isLive: storeSettings.isLive || false,
        logo: storeSettings.logo || ""
      });
      setEconomyForm({
        paymentNumber: storeSettings.paymentNumber || ""
      });
      setHelpLinksForm(storeSettings.helpLinks || { tutorialUrl: "", tutorialThumbnail: "", tutorialBannerActive: false, whatsappNumber: "", tiktokUrl: "" });
      setAppStatusForm(storeSettings.appStatus || { offline: false, offlineTitle: "", offlineBody: "", offlineImageUrl: "" });
      setTermsForm(storeSettings.termsAndConditions || { en: "", so: "" });
      setTelegramForm({
        telegramBotToken: storeSettings.telegramBotToken || "",
        telegramAdminChatIds: storeSettings.telegramAdminChatIds || ""
      });
      
      const lb = storeSettings.leaderboard || {
        rewardsActive: true,
        rewards: { rank1: 0, rank2: 0, rank3: 0 }
      };
      setLeaderboardForm({
        rewardsActive: lb.rewardsActive,
        rewards: {
          rank1: lb.rewards?.rank1?.toString() || "",
          rank2: lb.rewards?.rank2?.toString() || "",
          rank3: lb.rewards?.rank3?.toString() || "",
        }
      });
      formsInitialized.current = true;
    }
  }, [storeSettings]);

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
      .filter(order => order.status === 'successful')
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
  const selectedEventAccount = useMemo(() => eventAccounts.find(e => e.id === selectedEventId), [selectedEventId, eventAccounts]);

  const topUpOrders = useMemo(() => allOrders.filter(o => !o.gameDetails?.postId), [allOrders]);

  const filteredUsers = useMemo(() => {
    const filtered = allUsers.filter(u => 
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phoneNumber?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.uid?.toLowerCase().includes(userSearch.toLowerCase())
    );

    return filtered.sort((a, b) => {
      const aIsAdmin = a.role === 'admin';
      const bIsAdmin = b.role === 'admin';
      if (aIsAdmin && !bIsAdmin) return -1;
      if (!aIsAdmin && bIsAdmin) return 1;
      return 0;
    });
  }, [allUsers, userSearch]);

  const onlineUsersCount = useMemo(() => {
    return allUsers.filter(u => {
      const lastActive = Number(u.lastActive);
      return !isNaN(lastActive) && (Date.now() - lastActive) < 300000;
    }).length;
  }, [allUsers]);

  const paymentMethods = useMemo(() => {
    if (!storeSettings?.paymentMethods) return [];
    return Object.entries(storeSettings.paymentMethods).map(([id, m]: any) => ({ ...m, id }));
  }, [storeSettings?.paymentMethods]);

  const handleOpenGameDialog = (game?: any) => {
    setEditingGame(game || null);
    setGameForm(game ? { title: game.title, icon: game.icon || "", category: game.category, autoDetectName: !!game.autoDetectName } : { title: "", icon: "", category: "top-up", autoDetectName: false });
    setIsGameDialogOpen(true);
  };

  const handleOpenProductDialog = (p?: any, gameId?: string) => {
    setEditingProduct(p || null);
    setProductForm(p ? { ...p, price: p.price.toString(), discountedPrice: p.discountedPrice?.toString() || "", isOneTime: !!p.isOneTime } : { title: "", gameId: gameId || "", category: "top-up", description: "", price: "", discountedPrice: "", thumbnail: "", whatsappNumber: "", isOneTime: false });
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
      await saveProduct({ 
        ...productForm, 
        price: parseFloat(productForm.price), 
        discountedPrice: productForm.discountedPrice ? parseFloat(productForm.discountedPrice) : null,
        id: editingProduct?.id 
      }); 
      setIsProductDialogOpen(false); 
      toast({ title: "Item Saved" }); 
    } finally { setIsUploading(false); }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      await saveEvent({ ...eventForm, id: editingEvent?.id });
      setIsEditingEvent(false);
      setEditingEvent(null);
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
    setIsSavingStatus(true);
    try {
      await savePromoCode(promoCodeForm);
      setIsPromoDialogOpen(false);
      setPromoCodeInput({ code: "", discount: "", duration: "", durationUnit: "days", note: "", type: 'single_use' as any });
      toast({ title: "Promo Saved" });
    } finally {
      setIsSavingStatus(false);
    }
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

  const handleDragEnd = (event: DragEndEvent, gameId: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const gameItems = products.filter(p => p.gameId === gameId).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    const oldIndex = gameItems.findIndex(p => p.id === active.id);
    const newIndex = gameItems.findIndex(p => p.id === over.id);

    const reordered = arrayMove(gameItems, oldIndex, newIndex);
    const updates = reordered.map((p, i) => ({ id: p.id, orderIndex: i }));
    
    updateProductsOrder(updates);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'order') await deleteOrder(deleteTarget.id);
      if (deleteTarget.type === 'account') await deleteAccountPost(deleteTarget.id);
      if (deleteTarget.type === 'eventAccount') await deleteEventAccount(deleteTarget.id);
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

  const executeEndEarly = async () => {
    if (!endEarlyTargetId) return;
    setIsSavingStatus(true);
    try {
      await updateEventStatus(endEarlyTargetId, 'ended');
      toast({ title: "Event Ended Early" });
      setIsEndEarlyDialogOpen(false);
    } finally {
      setIsSavingStatus(false);
      setEndEarlyTargetId(null);
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
      if (target === 'tutorialThumbnail') setHelpLinksForm(f => ({ ...f, tutorialThumbnail: url }));
      toast({ title: "Media Uploaded" });
    } finally { setIsUploading(false); }
  };

  const syncEconomySettings = async () => {
    await updateStoreSettings({
      paymentNumber: economyForm.paymentNumber
    });
    toast({ title: "Economy settings updated" });
  };

  const handleSaveLeaderboard = async () => {
    setIsSavingStatus(true);
    try {
      const finalLeaderboard = {
        rewardsActive: leaderboardForm.rewardsActive,
        rewards: {
          rank1: parseInt(leaderboardForm.rewards.rank1) || 0,
          rank2: parseInt(leaderboardForm.rewards.rank2) || 0,
          rank3: parseInt(leaderboardForm.rewards.rank3) || 0,
        }
      };
      await updateStoreSettings({
        leaderboard: finalLeaderboard
      });
      toast({ title: "Leaderboard Updated", description: "Rewards settings have been updated live." });
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleSaveTelegram = async () => {
    setIsSavingStatus(true);
    try {
      await updateStoreSettings(telegramForm);
      toast({ title: "Telegram Config Synced", description: "Alerts will now use these credentials." });
    } finally {
      setIsSavingStatus(false);
    }
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
          {isSidebarExpanded && <span className="font-headline font-bold text-lg text-slate-900 dark:white uppercase tracking-tight text-nowrap">Oskar Control</span>}
          <button onClick={() => setIsSidebarExpanded(!isSidebarExpanded)} className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"><Menu size={20} /></button>
        </div>
      )}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-hide">
        <SideNavItem icon={Home} label="Back to Store" active={false} expanded={isSidebarExpanded || isMobile} onClick={() => { setGlobalLoading(true); router.push('/'); }} className="text-primary hover:bg-primary/5 mb-4" />
        <div className="h-px bg-slate-100 dark:bg-white/5 my-4" />
        <SideNavItem icon={LayoutDashboard} label="Dashboard" active={activeView === 'dashboard'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveTab('dashboard'); setSelectedOrderId(null); setSelectedAccountId(null); setIsMobileMenuOpen(false); }} />
        <SideNavItem icon={ShoppingBag} label="Orders" active={activeView === 'orders'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveTab('orders'); setSelectedOrderId(null); setIsMobileMenuOpen(false); }} badge={topUpOrders.filter(o => o.status === 'pending').length} />
        <SideNavItem icon={Gamepad2} label="ciwaanada" active={activeView === 'account-posts'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveTab('account-posts'); setSelectedAccountId(null); setIsMobileMenuOpen(false); }} badge={accountPosts.filter(p => p.status === 'pending').length} />
        <SideNavItem icon={Sparkles} label="Account Events" active={activeView === 'account-events'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveTab('account-events'); setSelectedEventId(null); setIsMobileMenuOpen(false); }} badge={eventAccounts.filter(e => e.status === 'active').length} />
        <SideNavItem icon={Trophy} label="Leaderboard" active={activeView === 'leaderboard'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveTab('leaderboard'); setIsMobileMenuOpen(false); }} />
        <SideNavItem icon={Box} label="Inventory" active={activeView === 'inventory'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveTab('inventory'); setIsMobileMenuOpen(false); }} />
        <SideNavItem icon={Megaphone} label="Live Events" active={activeView === 'events'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveTab('events'); setIsMobileMenuOpen(false); }} />
        <SideNavItem icon={Ticket} label="Promo Codes" active={activeView === 'promo-codes'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveTab('promo-codes'); setIsMobileMenuOpen(false); }} badge={promoCodes.filter(p => !p.claimed).length} />
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

  const getDeleteDescription = () => {
    if (!deleteTarget) return "Are you sure you want to delete this item? This action cannot be undone.";
    const type = deleteTarget.type;
    switch (type) {
      case 'user': return "Are you sure you want to permanently delete this user? This cannot be undone.";
      case 'account': return "Are you sure you want to delete this marketplace listing?";
      case 'eventAccount': return "Are you sure you want to delete this auction event?";
      case 'order': return "Are you sure you want to delete this order record?";
      case 'game': return "Are you sure you want to delete this game collection? This will also remove all its items.";
      case 'product': return "Are you sure you want to delete this inventory package?";
      case 'event': return "Are you sure you want to delete this game event?";
      case 'banner': return "Are you sure you want to remove this banner?";
      case 'paymentMethod': return "Are you sure you want to delete this payment method?";
      case 'promoCode': return "Are you sure you want to delete this promo voucher?";
      default: return "Are you sure you want to delete this item? This action cannot be undone.";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex overflow-hidden">
      <aside className={cn("hidden md:flex h-screen bg-white dark:bg-slate-900 border-r dark:border-white/5 flex-col transition-all duration-300 z-40 shadow-sm", isSidebarExpanded ? "w-64" : "w-20")}>
        <SidebarContent />
      </aside>

      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-72 bg-white dark:bg-slate-900 border-none">
          <SheetHeader className="sr-only">
             <SheetTitle>Admin Menu</SheetTitle>
          </SheetHeader>
          <SidebarContent isMobile={true} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <header className="h-16 md:h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b dark:border-white/5 flex items-center justify-between px-4 sm:px-10 shrink-0 z-30">
          <div className="flex items-center gap-4">
             <button className="md:hidden p-2 text-slate-500 rounded-xl hover:bg-slate-50" onClick={() => setIsMobileMenuOpen(true)}><Menu size={24} /></button>
             <h2 className="text-base sm:text-xl font-headline font-bold uppercase tracking-tight text-slate-900 dark:text-white truncate">
               {selectedOrderId ? "Order Insight" : selectedAccountId ? "Listing Hub" : selectedEventId ? "Auction Manager" : activeView.toUpperCase().replace('-', ' ')}
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
                       <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
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

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 space-y-10 scrollbar-hide bg-slate-50 dark:bg-slate-950">
          {activeView === 'dashboard' && !selectedOrderId && !selectedAccountId && !selectedEventId && (
            <div className="space-y-10 animate-in fade-in duration-700">
               <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                  <StatCard label="Total Revenue" value={`$${allOrders.filter(order => order.status === 'successful').reduce((acc, order) => acc + order.total, 0).toFixed(2)}`} icon={DollarSign} color="text-blue-500" bgColor="bg-blue-50 dark:bg-blue-500/10" />
                  <StatCard label="Pending Items" value={(allOrders.filter(order => order.status === 'pending').length + accountPosts.filter(p => p.status === 'pending').length).toString()} icon={Clock} color="text-amber-500" bgColor="bg-amber-50 dark:bg-amber-500/10" pulse />
                  <StatCard label="Active Users" value={allUsers.length.toString()} icon={Users} color="text-indigo-500" bgColor="bg-indigo-50 dark:bg-indigo-500/10" />
                  <StatCard label="Market Supply" value={accountPosts.filter(p => p.status === 'approved' && !p.sold).length.toString()} icon={ShieldCheck} color="text-emerald-500" bgColor="bg-emerald-50 dark:bg-emerald-500/10" />
               </div>
               <Card className="rounded-[2.5rem] p-4 sm:p-8 md:p-10 border-none shadow-xl bg-white dark:bg-slate-900 h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize:10, fontWeight:'bold'}} />
                        <YAxis hide />
                        <Tooltip contentStyle={{borderRadius: '16px', border:'none', boxShadow:'0 10px 40px rgba(0,0,0,0.1)'}} />
                        <Area type="monotone" dataKey="v" stroke="#7B5CE5" fillOpacity={0.1} fill="#7B5CE5" strokeWidth={4} />
                     </AreaChart>
                  </ResponsiveContainer>
               </Card>
            </div>
          )}

          {activeView === 'leaderboard' && (
            <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700">
               <Card className="rounded-[2rem] sm:rounded-[3rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
                  <div className="relative p-4 sm:p-8 md:p-12 space-y-12 md:space-y-12">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />

                     <div className="flex flex-col lg:flex-row lg:items-center justify-between bg-slate-50 dark:bg-slate-800/40 p-5 sm:p-8 md:p-10 rounded-[2rem] sm:rounded-[2.5rem] border dark:border-white/5 gap-8">
                        <div className="flex items-center gap-4 sm:gap-6">
                           <div className="w-12 h-12 sm:w-16 md:w-20 md:h-20 bg-primary/10 rounded-2xl sm:rounded-3xl flex items-center justify-center text-primary shadow-inner shrink-0">
                              <Trophy size={28} className="sm:size-10 md:size-12" />
                           </div>
                           <div className="min-w-0">
                              <h3 className="font-headline font-bold text-lg sm:text-2xl md:text-4xl uppercase tracking-tight text-slate-900 dark:text-white truncate">Leaderboard Rewards</h3>
                              <p className="text-[9px] sm:text-[10px] md:text-sm font-black text-muted-foreground uppercase tracking-widest opacity-60 mt-0.5 sm:mt-1 truncate">Control active discount incentives</p>
                           </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                           <Button 
                             variant="outline" 
                             onClick={resetLeaderboard}
                             className="w-full sm:w-auto h-12 sm:h-16 rounded-xl sm:rounded-2xl border-2 font-black uppercase text-[10px] sm:text-xs tracking-widest gap-2 bg-white dark:bg-slate-900 text-red-500 hover:bg-red-50"
                           >
                             <RefreshCw size={16} /> Reset All Points
                           </Button>
                           
                           <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-4 sm:gap-3 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl sm:rounded-[2rem] shadow-sm border border-slate-100 dark:border-white/5 w-full sm:min-w-[160px] md:sm:min-w-[200px]">
                              <Label className="font-black text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-400">Status</Label>
                              <div className="flex items-center gap-3 sm:gap-4">
                                 <span className={cn("text-xs font-bold uppercase", leaderboardForm.rewardsActive ? "text-green-500" : "text-slate-400")}>
                                    {leaderboardForm.rewardsActive ? 'Active' : 'Closed'}
                                 </span>
                                 <Switch 
                                   checked={leaderboardForm.rewardsActive} 
                                   onCheckedChange={async (v) => {
                                     const updatedForm = { ...leaderboardForm, rewardsActive: v };
                                     setLeaderboardForm(updatedForm);
                                     setIsSavingStatus(true);
                                     try {
                                       const savePayload = {
                                         rewardsActive: v,
                                         rewards: {
                                           rank1: parseInt(leaderboardForm.rewards.rank1) || 0,
                                           rank2: parseInt(leaderboardForm.rewards.rank2) || 0,
                                           rank3: parseInt(leaderboardForm.rewards.rank3) || 0,
                                         }
                                       };
                                       await updateStoreSettings({ leaderboard: savePayload });
                                       toast({ title: v ? "Rewards Enabled" : "Rewards Disabled" });
                                     } finally {
                                       setIsSavingStatus(false);
                                     }
                                   }} 
                                   className="scale-110 sm:scale-125"
                                 />
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-10">
                        <RewardControl 
                          rank={1} 
                          value={leaderboardForm.rewards.rank1} 
                          onChange={(v) => setLeaderboardForm({
                            ...leaderboardForm, 
                            rewards: { ...leaderboardForm.rewards, rank1: v }
                          })}
                          onSave={handleSaveLeaderboard}
                        />
                        <RewardControl 
                          rank={2} 
                          value={leaderboardForm.rewards.rank2} 
                          onChange={(v) => setLeaderboardForm({
                            ...leaderboardForm, 
                            rewards: { ...leaderboardForm.rewards, rank2: v }
                          })}
                          onSave={handleSaveLeaderboard}
                        />
                        <RewardControl 
                          rank={3} 
                          value={leaderboardForm.rewards.rank3} 
                          onChange={(v) => setLeaderboardForm({
                            ...leaderboardForm, 
                            rewards: { ...leaderboardForm.rewards, rank3: v }
                          })}
                          onSave={handleSaveLeaderboard}
                        />
                     </div>
                  </div>
               </Card>
            </div>
          )}

          {activeView === 'account-events' && (
            <div className="space-y-12 animate-in fade-in duration-700">
               <div className="pt-2">
                  <Button 
                    onClick={() => router.push('/admin/event-accounts/edit')} 
                    className="rounded-full h-14 md:h-20 px-10 md:px-16 gap-3 font-black shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90 text-white uppercase tracking-widest active:scale-95 transition-all w-full sm:w-auto text-sm md:text-xl"
                  >
                    <PlusCircle size={24} /> Add New Event
                  </Button>
               </div>

               {selectedEventId ? (
                 <EventAccountParticipantsView 
                    eventId={selectedEventId}
                    eventAccount={selectedEventAccount}
                    onBack={() => setSelectedEventId(null)}
                    onAssignWinner={assignEventWinner}
                 />
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 md:gap-12">
                    {eventAccounts.map(event => (
                      <EventAccountAdminCard 
                        key={event.id}
                        event={event}
                        onEdit={() => router.push(`/admin/event-accounts/edit?id=${event.id}`)}
                        onDelete={() => { setDeleteTarget({id: event.id, type: 'eventAccount'}); setIsDeleteDialogOpen(true); }}
                        onViewParticipants={() => setSelectedEventId(event.id)}
                        onEndEarly={() => { setEndEarlyTargetId(event.id); setIsEndEarlyDialogOpen(true); }}
                        onAssignWinner={() => setSelectedEventId(event.id)}
                      />
                    ))}
                    {eventAccounts.length === 0 && (
                      <div className="col-span-full py-32 border-4 border-dashed rounded-[3rem] text-center opacity-30 italic font-black uppercase text-sm md:text-xl">No account events scheduled</div>
                    )}
                 </div>
               )}
            </div>
          )}

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
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                       {topUpOrders.length === 0 ? (
                         <div className="py-20 text-center opacity-30 italic text-xs font-bold uppercase">No orders found.</div>
                       ) : (
                         topUpOrders.map(order => {
                           const item = order.items?.[0];
                           const isEventWinnerOrder = !!order.gameDetails?.isEventWinner;
                           return (
                             <Card key={order.id} className="p-5 rounded-[2rem] border-none shadow-lg bg-white dark:bg-slate-900 space-y-4">
                                <div className="flex items-center justify-between">
                                   <p className="font-headline font-bold text-sm text-primary uppercase tracking-tight">#{order.id.toUpperCase()}</p>
                                   <StatusBadge status={order.status} />
                                </div>
                                <div className="space-y-1">
                                   <p className="font-bold text-base text-slate-900 dark:text-white truncate">{order.gameDetails?.playerName || order.gameDetails?.name || "Guest"}</p>
                                   <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tight">
                                     {isEventWinnerOrder ? 'Guuleystaha' : item?.title || "Unknown Item"}
                                   </p>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border dark:border-white/5 flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 overflow-hidden relative shrink-0 shadow-sm border border-gray-100">
                                      {order.processedBy?.photoURL ? <Image src={order.processedBy.photoURL} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={14}/></div>}
                                   </div>
                                   <div className="min-w-0">
                                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Handling Admin</p>
                                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{order.processedBy?.name || "Wali lama furin"}</p>
                                   </div>
                                </div>
                                <div className="flex gap-2 pt-2 border-t dark:border-white/5">
                                   <button 
                                     onClick={() => { setSelectedOrderId(order.id); setPendingStatus(order.status); setCancellationReason(order.cancellationReason || ""); }}
                                     className="flex-1 h-12 bg-primary text-white rounded-xl flex items-center justify-center font-bold text-xs gap-2 active:scale-95 transition-transform"
                                   >
                                     <Eye size={16} /> View
                                   </button>
                                   <button 
                                     onClick={() => { setDeleteTarget({id:order.id, type:'order'}); setIsDeleteDialogOpen(true); }}
                                     className="w-12 h-12 text-red-500 bg-red-50 dark:bg-red-950/20 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
                                   >
                                     <Trash2 size={16} />
                                   </button>
                                </div>
                             </Card>
                           );
                         })
                       )}
                    </div>

                    <Card className="hidden md:block rounded-[3rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
                       <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-slate-50/50 dark:bg-slate-800/20">
                             <TableRow className="border-none h-16">
                                <TableHead className="px-6 lg:px-10 font-bold uppercase text-[11px] tracking-widest text-slate-400">Reference</TableHead>
                                <TableHead className="font-bold uppercase text-[11px] tracking-widest text-slate-400">Player & Item</TableHead>
                                <TableHead className="font-bold uppercase text-[11px] tracking-widest text-slate-400">Admin Handling</TableHead>
                                <TableHead className="font-bold uppercase text-[11px] tracking-widest text-slate-400">Status</TableHead>
                                <TableHead className="text-right px-6 lg:px-10 font-bold uppercase text-[11px] tracking-widest text-slate-400">Actions</TableHead>
                             </TableRow>
                          </TableHeader>
                          <TableBody>
                             {topUpOrders.length === 0 ? (
                               <TableRow><TableCell colSpan={5} className="h-64 text-center text-slate-300 italic uppercase font-bold text-xs">No orders found.</TableCell></TableRow>
                             ) : (
                               topUpOrders.map(order => {
                                 const item = order.items?.[0];
                                 const isEventWinnerOrder = !!order.gameDetails?.isEventWinner;
                                 return (
                                 <TableRow key={order.id} className="border-slate-50 dark:border-white/5 h-24 hover:bg-slate-50/30 transition-colors">
                                    <TableCell className="px-6 lg:px-10 font-headline font-bold text-sm text-primary">#{order.id.toUpperCase()}</TableCell>
                                    <TableCell>
                                       <div className="flex flex-col">
                                          <span className="font-bold text-base text-slate-900 dark:text-white">{order.gameDetails?.playerName || order.gameDetails?.name || "Guest"}</span>
                                          <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tight">
                                            {isEventWinnerOrder ? 'Guuleystaha' : item?.title || "Unknown Item"}
                                          </span>
                                       </div>
                                    </TableCell>
                                    <TableCell>
                                       <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative border-2 border-white shadow-sm shrink-0">
                                             {order.processedBy?.photoURL ? <Image src={order.processedBy.photoURL} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={14} /></div>}
                                          </div>
                                          <span className={cn("text-xs font-bold", order.processedBy ? "text-slate-500" : "text-slate-300 italic")}>
                                            {order.processedBy?.name || "Wali lama furin"}
                                          </span>
                                       </div>
                                    </TableCell>
                                    <TableCell><StatusBadge status={order.status} /></TableCell>
                                    <TableCell className="text-right px-6 lg:px-10">
                                       <div className="flex justify-end items-center gap-3">
                                          <button 
                                            onClick={() => { setSelectedOrderId(order.id); setPendingStatus(order.status); setCancellationReason(order.cancellationReason || ""); }}
                                            className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 active:scale-90 transition-transform"
                                          >
                                            <Eye size={18} />
                                          </button>
                                          <button 
                                            onClick={() => { setDeleteTarget({id:order.id, type:'order'}); setIsDeleteDialogOpen(true); }}
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
                       </div>
                    </Card>
                 </div>
               )}
            </div>
          )}

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
                   enforceAccountAction={enforceAccountAction}
                   suspendSeller={suspendSeller}
                   dismissAccountWarning={dismissAccountWarning}
                 />
               ) : (
                 <div className="space-y-10">
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                       {accountPosts.length === 0 ? (
                         <div className="py-20 text-center opacity-30 italic text-xs font-bold uppercase">No account listings found.</div>
                       ) : (
                         accountPosts.map(p => {
                           const claimantsList = Object.values(p.claimants || {});
                           const pendingClaims = claimantsList.filter((c: any) => c.status === 'pending');
                           const earliestClaim = pendingClaims.length > 0 ? Math.min(...pendingClaims.map((c: any) => {
                             const t = Number(c.timestamp);
                             return isNaN(t) ? Infinity : t;
                           })) : null;
                           const isOverdue = earliestClaim && earliestClaim !== Infinity && (Date.now() - earliestClaim) >= 3600000 && !p.sellerReported && !p.sold && !p.warningDismissedAt;

                           return (
                             <Card 
                               key={p.id} 
                               className={cn(
                                 "p-5 rounded-[2rem] border-none shadow-lg bg-white dark:bg-slate-900 space-y-5 transition-all",
                                 isOverdue && "ring-2 ring-red-500/50 bg-red-50/50"
                               )}
                             >
                                <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-1 min-w-0">
                                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative shrink-0 shadow-sm border border-white">
                                         {p.authorAvatar ? <Image src={p.authorAvatar} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><User size={16}/></div>}
                                      </div>
                                      <div className="flex items-center gap-1 min-w-0">
                                        <span className="truncate font-semibold text-sm text-slate-900 dark:text-white max-w-[120px]">{p.authorName || "Market User"}</span>
                                        {p.authorIsVerified && <VerifiedBadge />}
                                      </div>
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
                                   <MarketplaceExpiration createdAt={p.createdAt} status={p.status} />
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
                                        <Trash2 size={16} />
                                      </button>
                                   </div>
                                </div>
                             </Card>
                           );
                         })
                       )}
                    </div>

                    <Card className="hidden md:block rounded-[3rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
                       <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-slate-50/50 dark:bg-slate-800/20">
                             <TableRow className="border-none h-16">
                                <TableHead className="px-6 lg:px-10 font-bold uppercase text-[11px] tracking-widest text-slate-400">Seller Info</TableHead>
                                <TableHead className="font-bold uppercase text-[11px] tracking-widest text-slate-400">Game Info</TableHead>
                                <TableHead className="font-bold uppercase text-[11px] tracking-widest text-slate-400">Active Claims</TableHead>
                                <TableHead className="font-bold uppercase text-[11px] tracking-widest text-slate-400">Admin Handling</TableHead>
                                <TableHead className="font-bold uppercase text-[11px] tracking-widest text-slate-400">Wait Time</TableHead>
                                <TableHead className="font-bold uppercase text-[11px] tracking-widest text-slate-400">Age</TableHead>
                                <TableHead className="font-bold uppercase text-[11px] tracking-widest text-slate-400">Status</TableHead>
                                <TableHead className="text-right px-6 lg:px-10 font-bold uppercase text-[11px] tracking-widest text-slate-400">Actions</TableHead>
                             </TableRow>
                          </TableHeader>
                          <TableBody>
                             {accountPosts.length === 0 ? (
                               <TableRow><TableCell colSpan={8} className="h-64 text-center text-slate-300 italic uppercase font-bold text-xs">No account listings found.</TableCell></TableRow>
                             ) : (
                               accountPosts.map(p => {
                                 const claimantsList = Object.values(p.claimants || {});
                                 const pendingClaims = claimantsList.filter((c: any) => c.status === 'pending');
                                 const earliestClaim = pendingClaims.length > 0 ? Math.min(...pendingClaims.map((c: any) => {
                                   const t = Number(c.timestamp);
                                   return isNaN(t) ? Infinity : t;
                                 })) : null;
                                 const isOverdue = earliestClaim && earliestClaim !== Infinity && (Date.now() - earliestClaim) >= 3600000 && !p.sellerReported && !p.sold && !p.warningDismissedAt;

                                 return (
                                 <TableRow 
                                    key={p.id} 
                                    className={cn(
                                      "border-slate-50 dark:border-white/5 h-24 transition-colors",
                                      isOverdue ? "bg-red-50/50 dark:bg-red-500/5" : "hover:bg-slate-50/50"
                                    )}
                                 >
                                    <TableCell className="px-6 lg:px-10">
                                       <div className="flex items-center gap-1 min-w-0">
                                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative shrink-0 shadow-sm border border-white dark:border-white/10">
                                             {p.authorAvatar ? <Image src={p.authorAvatar} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><User size={16}/></div>}
                                          </div>
                                          <div className="flex items-center gap-1 min-w-0">
                                            <span className="truncate font-semibold text-sm text-slate-900 dark:text-white max-w-[150px]">{p.authorName || "Market User"}</span>
                                            {p.authorIsVerified && <VerifiedBadge />}
                                          </div>
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
                                             {user?.photoURL ? <Image src={user.photoURL} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-black">O</div>}
                                          </div>
                                          <span className={cn("text-xs font-bold", p.processedBy ? "text-slate-500" : "text-slate-300 italic")}>
                                            {p.processedBy?.name || "Wali lama furin"}
                                          </span>
                                       </div>
                                    </TableCell>
                                    <TableCell><WaitTime post={p} /></TableCell>
                                    <TableCell>
                                       <MarketplaceExpiration createdAt={p.createdAt} status={p.status} />
                                    </TableCell>
                                    <TableCell><StatusBadge status={p.status} /></TableCell>
                                    <TableCell className="text-right px-6 lg:px-10">
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
                       </div>
                    </Card>
                 </div>
               )}
            </div>
          )}

          {activeView === 'inventory' && (
            <div className="space-y-12 animate-in fade-in duration-700">
               <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                  <Button 
                    onClick={() => handleOpenGameDialog()} 
                    className="rounded-2xl h-16 px-10 gap-3 font-black shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90 text-white uppercase tracking-widest active:scale-95 transition-all w-full sm:auto"
                  >
                    <PlusCircle size={20} /> New Game
                  </Button>
               </div>

               <div className="grid grid-cols-1 gap-6 max-w-4xl">
                  {games.map(g => {
                    const isExpanded = expandedGameId === g.id;
                    const gameItems = products.filter(p => p.gameId === g.id).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
                    
                    return (
                      <Card 
                        key={g.id} 
                        className={cn(
                          "rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden transition-all duration-300",
                          isExpanded && "ring-2 ring-primary shadow-2xl"
                        )}
                      >
                         <div 
                           onClick={() => setExpandedGameId(isExpanded ? null : g.id)}
                           className="p-4 md:p-8 flex items-center justify-between cursor-pointer group"
                         >
                            <div className="flex items-center gap-4 sm:gap-8 min-w-0">
                               <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-3xl bg-slate-50 dark:bg-slate-800 relative overflow-hidden shrink-0 border border-gray-100 dark:border-white/5 shadow-inner">
                                  {g.icon ? <Image src={g.icon} alt={g.title} fill className="object-cover" /> : <Gamepad2 className="m-auto mt-8 text-slate-300" />}
                               </div>
                               <div className="min-w-0">
                                  <h4 className="font-headline font-bold text-base sm:text-2xl uppercase tracking-tight text-slate-900 dark:text-white truncate">{g.title}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <p className="text-[10px] sm:text-xs font-black text-muted-foreground uppercase tracking-widest opacity-60">{g.category}</p>
                                    {g.autoDetectName && <Badge className="bg-primary/10 text-primary border-none text-[7px] uppercase font-black px-1.5 h-4">Auto Detect</Badge>}
                                  </div>
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
                                   <DndContext
                                     sensors={sensors}
                                     collisionDetection={closestCenter}
                                     onDragEnd={(e) => handleDragEnd(e, g.id)}
                                     modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
                                   >
                                     <SortableContext
                                       items={gameItems.map(p => p.id)}
                                       strategy={verticalListSortingStrategy}
                                     >
                                       <div className="space-y-3">
                                         {gameItems.map(p => (
                                           <SortableProductItem 
                                             key={p.id} 
                                             p={p} 
                                             onEdit={() => handleOpenProductDialog(p)}
                                             onDelete={(e) => { e.stopPropagation(); setDeleteTarget({id:p.id, type:'product'}); setIsDeleteDialogOpen(true); }}
                                           />
                                         ))}
                                       </div>
                                     </SortableContext>
                                   </DndContext>
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

          {activeView === 'events' && (
            <div className="space-y-12 animate-in fade-in duration-700">
               {isEditingEvent ? (
                 <div className="space-y-10 animate-in slide-in-from-right-4 duration-500 max-w-4xl mx-auto pb-32">
                    <div className="flex items-center gap-6">
                       <Button variant="ghost" onClick={() => { setIsEditingEvent(false); setEditingEvent(null); }} className="rounded-2xl h-12 w-12 p-0">
                          <ArrowLeft size={24} />
                       </Button>
                       <h2 className="text-3xl font-headline font-bold uppercase tracking-tight">
                         {editingEvent ? 'Edit Event' : 'Create Live Event'}
                       </h2>
                    </div>

                    <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
                       <form onSubmit={handleSaveEvent} className="p-8 md:p-12 space-y-8">
                          <div className="relative w-full aspect-video rounded-3xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center group overflow-hidden shadow-inner group">
                             {eventForm.thumbnailUrl ? <Image src={eventForm.thumbnailUrl} alt={eventForm.title} fill className="object-cover" unoptimized /> : <><ImageIcon className="text-slate-300 w-12 h-12 mb-2" /><span className="text-xs font-black uppercase text-slate-400">Add Event Poster</span></>}
                             <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'event')} />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <SettingInput label="Event Title" value={eventForm.title} onChange={v => setEventForm({ ...eventForm, title: v })} placeholder="e.g. Hacker Store 2.0" />
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Event Type</Label>
                                <Select value={eventForm.type} onValueChange={v => setEventForm({ ...eventForm, type: v as any })}>
                                   <SelectTrigger className="h-14 md:h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-6 font-bold shadow-inner"><SelectValue /></SelectTrigger>
                                   <SelectContent className="rounded-2xl border-none shadow-2xl z-[200]">
                                      <SelectItem value="freefire_event" className="p-4 font-bold text-xs uppercase">Free Fire Event</SelectItem>
                                      <SelectItem value="general" className="p-4 font-bold text-xs uppercase">General Promotion</SelectItem>
                                   </SelectContent>
                                </Select>
                             </div>
                          </div>

                          <SettingInput label="Short Description" value={eventForm.shortDescription} onChange={v => setEventForm({ ...eventForm, shortDescription: v })} placeholder="Appears on the home card" />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <SettingInput label="Redirect Route (Optional)" value={eventForm.redirectRoute || ""} onChange={v => setEventForm({ ...eventForm, redirectRoute: v })} placeholder="e.g. /checkout?id=..." />
                             <SettingInput label="Custom Button Text" value={eventForm.buttonText || ""} onChange={v => setEventForm({ ...eventForm, buttonText: v })} placeholder="e.g. iibso (Defaults to 'eeg')" />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <SettingInput label="Duration (Value)" value={eventForm.duration} type="number" onChange={v => setEventForm({ ...eventForm, duration: v })} placeholder="e.g. 7" />
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Unit</Label>
                                <Select value={eventForm.durationUnit} onValueChange={v => setEventForm({ ...eventForm, durationUnit: v })}>
                                   <SelectTrigger className="h-14 md:h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-6 font-bold shadow-inner"><SelectValue /></SelectTrigger>
                                   <SelectContent className="rounded-2xl border-none shadow-2xl z-[200]">
                                      <SelectItem value="days" className="p-4 font-bold text-xs uppercase">Days</SelectItem>
                                      <SelectItem value="hours" className="p-4 font-bold text-xs uppercase">Hours</SelectItem>
                                      <SelectItem value="minutes" className="p-4 font-bold text-xs uppercase">Minutes</SelectItem>
                                   </SelectContent>
                                </Select>
                             </div>
                          </div>

                          <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Detailed Content</Label>
                             <Textarea value={eventForm.content} onChange={e => setEventForm({ ...eventForm, content: e.target.value })} placeholder="Full event article..." className="rounded-3xl bg-slate-50 dark:bg-slate-800 border-none min-h-[200px] p-8 font-medium shadow-inner" />
                          </div>

                          <div className="pt-8">
                             <Button type="submit" disabled={isUploading} className="w-full h-16 md:h-24 rounded-3xl font-black text-xl md:text-3xl shadow-2xl uppercase tracking-widest bg-primary text-white active:scale-95 transition-all">
                               {isUploading ? <Loader2 className="animate-spin w-10 h-10" /> : "Publish Event"}
                             </Button>
                          </div>
                       </form>
                    </Card>
                 </div>
               ) : (
                 <div className="space-y-12">
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
                           onClick={() => { setEditingEvent(null); setEventForm({ title: "", shortDescription: "", content: "", thumbnailUrl: "", type: "freefire_event", active: true, duration: "", durationUnit: "days", redirectRoute: "", buttonText: "" }); setIsEditingEvent(true); }}
                           className="rounded-2xl h-14 md:h-16 px-8 gap-3 font-black shadow-xl shadow-primary/30 bg-primary hover:bg-primary/90 text-white uppercase tracking-widest active:scale-95 transition-all w-full sm:auto"
                         >
                            <Megaphone size={18} /> Create Event
                         </Button>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
                      {events.map(e => (
                        <Card key={e.id} className="rounded-[2.5rem] overflow-hidden border-none shadow-xl bg-white dark:bg-slate-900 group">
                           <div className="aspect-[16/10] relative">
                              <Image src={e.thumbnailUrl} alt={e.title} fill className="object-cover" unoptimized />
                              <div className="absolute top-4 left-4">
                                 <Badge className="bg-green-500 text-white border-none font-bold text-[8px] uppercase px-2 py-0.5">LIVE</Badge>
                              </div>
                              <div className="absolute top-4 right-4 flex gap-2">
                                 <button onClick={() => { setEditingEvent(e); setEventForm({ ...e, duration: "", durationUnit: "days" }); setIsEditingEvent(true); }} className="w-8 h-8 rounded-lg bg-blue-500/90 text-white flex items-center justify-center backdrop-blur-sm shadow-lg hover:scale-110 transition-transform">
                                    <Edit size={14} />
                                 </button>
                                 <button onClick={() => { setDeleteTarget({id:e.id, type:'event'}); setIsDeleteDialogOpen(true); }} className="w-8 h-8 rounded-lg bg-red-500/90 text-white flex items-center justify-center backdrop-blur-sm shadow-lg hover:scale-110 transition-transform">
                                    <Trash2 size={14} />
                                 </button>
                              </div>
                           </div>
                           <div className="p-6 md:p-8 space-y-4">
                              <h4 className="font-headline font-bold text-xl uppercase truncate text-slate-900 dark:text-white">{e.title}</h4>
                              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-medium min-h-[2.5rem]">{e.shortDescription}</p>
                              <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest pt-2">
                                 <Clock size={14} />
                                 <span>ENDS {e.expiresAt ? format(new Date(e.expiresAt), "MMM d, HH:mm").toUpperCase() : "SOON"}</span>
                              </div>
                           </div>
                        </Card>
                      ))}
                   </div>

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
            </div>
          )}

          {activeView === 'promo-codes' && (
            <div className="space-y-12 animate-in fade-in duration-700">
               <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-6">
                  <Button 
                    onClick={() => setIsPromoDialogOpen(true)}
                    className="rounded-2xl h-14 md:h-16 px-10 gap-3 font-black shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90 text-white uppercase tracking-widest active:scale-95 w-full sm:w-auto"
                  >
                    <PlusCircle size={20} /> New Promo Code
                  </Button>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {promoCodes.length === 0 ? (
                    <div className="col-span-full py-24 text-center opacity-30 italic text-xs font-bold uppercase border-2 border-dashed rounded-[3rem]">No promo codes active</div>
                  ) : (
                    promoCodes.map(promo => {
                      const expiryTime = Number(promo.expiresAt) || 0;
                      const isExpired = expiryTime ? expiryTime < Date.now() : false;
                      const isMulti = promo.type === 'multi_use';
                      const usageCount = isMulti ? Object.keys(promo.usedByUsers || {}).length : (promo.claimed ? 1 : 0);
                      const status = promo.claimed && !isMulti ? 'Claimed' : isExpired ? 'Expired' : 'Active';
                      const badgeColor = promo.claimed && !isMulti ? 'bg-purple-100 text-purple-700' : isExpired ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';

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
                                 <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Promo Code</p>
                                    <Badge variant="outline" className="text-[7px] font-bold uppercase py-0">{isMulti ? 'Multi-Use' : 'Single-Use'}</Badge>
                                 </div>
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
                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Usage</p>
                                    <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                      {usageCount} Used
                                    </p>
                                 </div>
                              </div>

                              <div className="pt-4 border-t dark:border-white/5 space-y-2">
                                 <Button 
                                   variant="outline" 
                                   onClick={() => { setSelectedPromo(promo); setIsPromoUsageOpen(true); }}
                                   className="w-full rounded-xl text-[10px] font-black uppercase tracking-widest h-10 border-2"
                                 >
                                    <Users size={14} className="mr-2" /> View Usage
                                 </Button>
                                 <Button 
                                   variant="ghost" 
                                   onClick={() => { setDeleteTarget({id: promo.id, type:'promoCode'}); setIsDeleteDialogOpen(true); }}
                                   className="w-full text-red-500 hover:bg-red-50 hover:text-red-600 font-bold uppercase text-[10px] tracking-widest h-10"
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
            <div className="space-y-8 fade-in duration-700">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard label="Total Registered" value={allUsers.length.toString()} icon={Users} color="text-indigo-500" bgColor="bg-indigo-50 dark:bg-indigo-500/10" />
                  <StatCard label="Online Now" value={onlineUsersCount.toString()} icon={Activity} color="text-green-500" bgColor="bg-green-50 dark:bg-green-500/10" pulse={onlineUsersCount > 0} />
                  <div className="flex flex-col justify-center gap-4">
                     <div className="relative w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input 
                          placeholder="Search users..." 
                          className="pl-12 h-14 rounded-2xl bg-white dark:bg-slate-900 border-none shadow-sm font-bold"
                          value={userSearch}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 gap-4 md:hidden">
                  {filteredUsers.length === 0 ? (
                    <div className="py-20 text-center opacity-30 italic text-xs font-bold uppercase">No users found</div>
                  ) : (
                    filteredUsers.map(u => {
                      const lastActive = Number(u.lastActive);
                      const isOnline = !isNaN(lastActive) && (Date.now() - lastActive) < 300000;
                      return (
                        <Card key={u.uid} className="p-5 rounded-[2rem] border-none shadow-lg bg-white dark:bg-slate-900 space-y-4">
                           <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden relative border-2 border-white shadow-sm shrink-0">
                                 {u.photoURL ? <Image src={u.photoURL} alt={u.name} fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100 dark:bg-slate-900"><User size={24} /></div>}
                              </div>
                              <div className="min-w-0">
                                 <div className="flex items-center gap-1 min-w-0">
                                   <p className="truncate font-semibold text-sm text-slate-900 dark:text-white max-w-[150px]">{u.name || "Legendary Gamer"}</p>
                                   {u.isVerified && <VerifiedBadge />}
                                 </div>
                                 <p className="text-[10px] text-muted-foreground truncate">{u.phoneNumber}</p>
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
                                 <span className="text-[10px] font-black uppercase text-slate-400">{isOnline ? 'Online' : 'Offline'}</span>
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

               <Card className="hidden md:block rounded-[3rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
                  <div className="overflow-x-auto scrollbar-hide">
                    <Table className="min-w-[1000px]">
                      <TableHeader className="bg-slate-50/50 dark:bg-slate-800/20">
                          <TableRow className="border-none h-20">
                            <TableHead className="px-6 lg:px-10 font-bold uppercase text-[11px] tracking-widest text-slate-400">User Identity</TableHead>
                            <TableHead className="font-bold uppercase text-[11px] tracking-widest text-slate-400">Contact & Role</TableHead>
                            <TableHead className="font-bold uppercase text-[11px] tracking-widest text-slate-400 text-center">Reward Balance</TableHead>
                            <TableHead className="font-bold uppercase text-[11px] tracking-widest text-slate-400">Presence</TableHead>
                            <TableHead className="font-bold uppercase text-[11px] tracking-widest text-center">Status</TableHead>
                            <TableHead className="text-right px-6 lg:px-10 font-bold uppercase text-[11px] tracking-widest text-slate-400">Actions</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {filteredUsers.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="h-64 text-center text-slate-300 italic uppercase font-bold text-xs">No users found.</TableCell></TableRow>
                          ) : (
                            filteredUsers.map(u => {
                              const lastActive = Number(u.lastActive);
                              const isOnline = !isNaN(lastActive) && (Date.now() - lastActive) < 300000;
                              return (
                                <TableRow key={u.uid} className="border-slate-50 dark:border-white/5 h-28 hover:bg-slate-50/30 transition-colors">
                                  <TableCell className="px-6 lg:px-10">
                                      <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative border-2 border-white shadow-sm shrink-0">
                                            {u.photoURL ? <Image src={u.photoURL} alt={u.name} fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100 dark:bg-slate-900"><User size={20} /></div>}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-1 min-w-0">
                                              <span className="truncate font-semibold text-sm md:text-lg text-slate-900 dark:text-white max-w-[200px]">{u.name || "Legendary Gamer"}</span>
                                              {u.isVerified && <VerifiedBadge />}
                                            </div>
                                            <span className="text-[9px] md:text-xs text-muted-foreground uppercase font-black tracking-tight truncate">{u.phoneNumber || "No Number"}</span>
                                        </div>
                                      </div>
                                  </TableCell>
                                  <TableCell>
                                      <div className="flex flex-col gap-1">
                                        <span className="text-xs md:sm font-bold text-slate-700 dark:text-slate-300">{u.phoneNumber || "---"}</span>
                                        <Badge className={cn(
                                          "w-fit rounded-full px-2 py-0 text-[8px] font-black uppercase tracking-widest border-none",
                                          u.role === 'admin' ? "bg-primary text-white" : "bg-cyan-100 text-cyan-700"
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
                                            {!isNaN(lastActive) ? formatDistanceToNow(lastActive).toUpperCase() + " AGO" : "NEVER"}
                                        </span>
                                      </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                      <Badge className={cn(
                                        "rounded-full px-4 py-1 text-[8px] font-black uppercase tracking-widest border-none",
                                        u.banned ? "bg-red-50 text-white" : "bg-green-100 text-green-700"
                                      )}>
                                        {u.banned ? "Banned" : "Active"}
                                      </Badge>
                                  </TableCell>
                                  <TableCell className="text-right px-6 lg:px-10">
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
                  </div>
               </Card>
            </div>
          )}

          {activeView === 'settings' && (
            <div className="max-w-5xl mx-auto space-y-6 sm:space-y-12 pb-20 sm:pb-24">
               <Accordion type="single" collapsible className="space-y-4 sm:space-y-6">
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

                  <AccordionItem value="economy" className="border-none">
                     <Card className="rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                        <AccordionTrigger className="px-4 py-6 sm:px-8 sm:py-8 hover:no-underline">
                           <div className="flex items-center gap-4 text-amber-500">
                              <HandCoins className="w-6 h-6" />
                              <div className="text-left">
                                 <h4 className="font-headline font-bold text-lg uppercase tracking-tight">Financial Settings</h4>
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Payment number & config</p>
                              </div>
                           </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-6 pt-2 sm:px-8 sm:pb-8 sm:pt-4">
                           <div className="space-y-6 sm:space-y-10">
                              <SettingInput label="EVC / Premier Payment Number" value={economyForm.paymentNumber} onChange={v => setEconomyForm(f => ({ ...f, paymentNumber: v }))} placeholder="613982172" />
                              <Button onClick={syncEconomySettings} className="w-full h-12 md:h-16 rounded-2xl font-black uppercase tracking-widest shadow-2xl bg-amber-500 hover:bg-amber-600">Update Financials</Button>
                           </div>
                        </AccordionContent>
                     </Card>
                  </AccordionItem>

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
                                             {m.icon ? <Image src={m.icon} alt={m.name} fill className="object-cover" /> : <Smartphone size={24} />}
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

                  <AccordionItem value="telegram" className="border-none">
                     <Card className="rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                        <AccordionTrigger className="px-4 py-6 sm:px-8 sm:py-8 hover:no-underline">
                           <div className="flex items-center gap-4 text-primary">
                              <BellRing className="w-6 h-6" />
                              <div className="text-left">
                                 <h4 className="font-headline font-bold text-lg uppercase tracking-tight">Notification Center</h4>
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Telegram Bot & Admin Alerts</p>
                              </div>
                           </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-6 pt-2 sm:px-8 sm:pb-8 sm:pt-4">
                           <div className="space-y-6 sm:space-y-8">
                              <div className="p-4 sm:p-6 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20">
                                 <p className="text-[11px] sm:text-xs font-medium leading-relaxed flex items-start gap-3 text-primary dark:text-blue-300">
                                    <span className="w-5 h-5 shrink-0 mt-0.5"><Info /></span>
                                    Connect your Telegram Bot to receive real-time order alerts. Use @userinfobot to get Chat IDs.
                                 </p>
                              </div>
                              <div className="grid grid-cols-1 gap-6">
                                 <SettingInput 
                                   label="Telegram Bot Token" 
                                   value={telegramForm.telegramBotToken} 
                                   onChange={v => setTelegramForm(f => ({ ...f, telegramBotToken: v }))} 
                                   placeholder="8817771628:AA..." 
                                 />
                                 <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Admin Chat IDs (Comma Separated)</Label>
                                    <Textarea 
                                      value={telegramForm.telegramAdminChatIds} 
                                      onChange={e => setTelegramForm(f => ({ ...f, telegramAdminChatIds: e.target.value }))} 
                                      className="min-h-[100px] rounded-3xl bg-slate-50 dark:bg-slate-800 border-none p-6 font-bold shadow-inner" 
                                      placeholder="8105182517, 123456789" 
                                    />
                                 </div>
                              </div>
                              <Button onClick={handleSaveTelegram} className="w-full h-12 md:h-16 rounded-2xl font-black uppercase tracking-widest shadow-2xl bg-primary">Sync Telegram Config</Button>
                           </div>
                        </AccordionContent>
                     </Card>
                  </AccordionItem>

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
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div className="space-y-6">
                                    <SettingInput label="WhatsApp Support No" value={helpLinksForm.whatsappNumber} onChange={v => setHelpLinksForm(f => ({ ...f, whatsappNumber: v }))} placeholder="252613982172" />
                                    <SettingInput label="TikTok Channel URL" value={helpLinksForm.tiktokUrl} onChange={v => setHelpLinksForm(f => ({ ...f, tiktokUrl: v }))} placeholder="https://tiktok.com/@..." />
                                    <SettingInput label="Tutorial Video URL" value={helpLinksForm.tutorialUrl} onChange={v => setHelpLinksForm(f => ({ ...f, tutorialUrl: v }))} placeholder="https://youtube.com/..." />
                                 </div>
                                 <div className="space-y-6">
                                    <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-between border dark:border-white/5">
                                       <div className="flex items-center gap-3">
                                          <Video className={cn("w-5 h-5", helpLinksForm.tutorialBannerActive ? "text-primary" : "text-slate-400")} />
                                          <div>
                                             <p className="text-sm font-bold">Tutorial Banner</p>
                                             <p className="text-[10px] text-muted-foreground font-medium">Show app guide on home slider</p>
                                          </div>
                                       </div>
                                       <Switch checked={helpLinksForm.tutorialBannerActive} onCheckedChange={v => setHelpLinksForm(f => ({ ...f, tutorialBannerActive: v }))} />
                                    </div>
                                    <div className="space-y-3">
                                       <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tutorial Thumbnail</Label>
                                       <div className="relative aspect-video rounded-3xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center overflow-hidden shadow-inner group">
                                          {helpLinksForm.tutorialThumbnail ? <Image src={helpLinksForm.tutorialThumbnail} alt="Tutorial" fill className="object-cover" /> : <ImageIcon className="text-slate-300 w-10 h-10" />}
                                          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'tutorialThumbnail')} />
                                          {isUploading && <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex items-center justify-center"><Loader2 className="animate-spin" /></div>}
                                       </div>
                                    </div>
                                 </div>
                              </div>
                              <Button onClick={() => updateStoreSettings({ helpLinks: helpLinksForm }).then(()=>toast({title:"Links Synced"}))} className="w-full h-12 md:h-16 rounded-2xl font-black uppercase tracking-widest shadow-2xl bg-indigo-500 hover:bg-indigo-600">Save Communication Links</Button>
                           </div>
                        </AccordionContent>
                     </Card>
                  </AccordionItem>

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
                                    <Button onClick={() => updateStoreSettings({ termsAndConditions: termsForm }).then(()=>toast({title:"Policy Updated"}))} className="w-full h-12 md:h-20 rounded-3xl font-black uppercase tracking-widest shadow-2xl bg-emerald-600">Sync Legal Policy</Button>
                                    <Textarea value={termsForm.en} onChange={e => setTermsForm(f => ({ ...f, en: e.target.value }))} className="min-h-[300px] rounded-3xl border-none bg-slate-50 dark:bg-slate-800 p-6 font-medium shadow-inner" placeholder="Enter English terms..." />
                                 </div>
                                 <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Somali Terms (Shuruudaha)</Label>
                                    <Textarea value={termsForm.so} onChange={e => setTermsForm(f => ({ ...f, so: e.target.value }))} className="min-h-[300px] rounded-3xl border-none bg-slate-50 dark:bg-slate-800 p-6 font-medium shadow-inner" placeholder="Geli shuruudaha afka Soomaaliga..." />
                                 </div>
                              </div>
                           </div>
                        </AccordionContent>
                     </Card>
                  </AccordionItem>

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
                                       <p className="text-xs text-sm font-medium text-red-700 dark:text-red-400">Lock entire store for maintenance</p>
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
               </Accordion>
            </div>
          )}
        </main>
      </div>

      <Dialog open={isUserManageOpen} onOpenChange={setIsUserManageOpen}>
        <DialogContent className="max-w-md w-[94%] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900 animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
           <DialogHeader className="sr-only"><DialogTitle>User Management</DialogTitle></DialogHeader>
           
           <div className="h-24 md:h-28 bg-gradient-to-r from-[#7B5CE5] to-[#534AB7] relative shrink-0">
              <button 
                onClick={() => setIsUserManageOpen(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/40 transition-colors z-20"
              >
                 <X size={16} strokeWidth={3} />
              </button>
              
              <div className="absolute -bottom-10 left-6">
                 <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl border-[4px] border-white dark:border-slate-900 bg-slate-100 overflow-hidden shadow-xl relative">
                    {selectedUser?.photoURL ? (
                      <Image src={selectedUser.photoURL} alt={selectedUser.name} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100 dark:bg-slate-800"><User size={32} /></div>
                    )}
                 </div>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto p-5 md:p-8 pt-12 md:pt-14 space-y-5 md:space-y-6 scrollbar-hide">
              <div className="flex justify-between items-start">
                 <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h3 className="truncate font-bold text-lg md:text-xl tracking-tight text-slate-900 dark:text-white max-w-[180px]">{selectedUser?.name || "Gamer"}</h3>
                      {selectedUser?.isVerified && <VerifiedBadge />}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                       <Smartphone size={10} />
                       <span className="text-[9px] md:text-[10px] font-bold">{selectedUser?.phoneNumber || "No Phone"}</span>
                    </div>
                 </div>
                 <Badge className={cn(
                   "rounded-full uppercase text-[7px] font-black tracking-widest px-2 py-0.5 border-none shadow-sm shrink-0",
                   selectedUser?.banned ? "bg-red-500 text-white" : "bg-green-100 text-green-700"
                 )}>
                    {selectedUser?.banned ? 'Banned' : 'Active'}
                 </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div className="p-3 md:p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl md:rounded-2xl border border-slate-100 dark:border-white/5 shadow-inner">
                    <p className="text-[7px] md:text-[8px] font-black uppercase text-slate-400 mb-1 tracking-widest">Balance</p>
                    <div className="flex items-center gap-1.5">
                       <Star className="w-3 h-3 md:size-4 text-amber-500 fill-amber-500" />
                       <p className="text-xl md:text-2xl font-headline font-bold text-slate-900 dark:text-white leading-none">{selectedUser?.points || 0}</p>
                    </div>
                 </div>
                 <div className="p-3 md:p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl md:rounded-2xl border border-slate-100 dark:border-white/5 shadow-inner">
                    <p className="text-[7px] md:text-[8px] font-black uppercase text-slate-400 mb-1 tracking-widest">Role</p>
                    <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase px-2 py-0.5 rounded-lg">
                      {selectedUser?.role || 'user'}
                    </Badge>
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <div className="flex items-center gap-1.5 text-primary ml-1">
                      <LayoutGrid size={12} />
                      <Label className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">Role</Label>
                   </div>
                   <Select 
                      value={selectedUser?.role || 'user'} 
                      onValueChange={(val: any) => {
                        manageUser(selectedUser.uid, { role: val });
                        setSelectedUser({...selectedUser, role: val});
                        toast({title: "Role Updated"});
                      }}
                   >
                      <SelectTrigger className="h-10 md:h-12 rounded-lg md:rounded-xl bg-slate-50 dark:bg-slate-800 border-none px-3 font-bold text-xs shadow-inner">
                         <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-2xl bg-white dark:bg-slate-900">
                         <SelectItem value="user" className="rounded-lg p-2 font-bold text-xs uppercase">User</SelectItem>
                         <SelectItem value="admin" className="rounded-lg p-2 font-bold text-xs uppercase">Admin</SelectItem>
                      </SelectContent>
                   </Select>
                </div>

                <div className="space-y-1.5">
                   <div className="flex items-center gap-1.5 text-blue-500 ml-1">
                      <ShieldCheck size={12} />
                      <Label className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">Verified</Label>
                   </div>
                   <div className="h-10 md:h-12 rounded-lg md:rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between px-3 border dark:border-white/5 shadow-inner">
                      <span className={cn("truncate text-[10px] font-bold uppercase", selectedUser?.isVerified ? "text-blue-500" : "text-slate-400")}>
                        {selectedUser?.isVerified ? 'Haa' : 'Maya'}
                      </span>
                      <Switch 
                        checked={selectedUser?.isVerified || false} 
                        onCheckedChange={async (v) => {
                          await manageUser(selectedUser.uid, { isVerified: v });
                          setSelectedUser({...selectedUser, isVerified: v});
                          toast({ title: v ? "User Verified" : "Verification Removed" });
                        }} 
                        className="scale-90"
                      />
                   </div>
                </div>
              </div>

              <div className="space-y-2">
                 <div className="flex items-center gap-1.5 text-amber-500 ml-1">
                    <DollarSign size={12} />
                    <Label className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">Adjust Balance</Label>
                 </div>
                 <div className="flex gap-2">
                    <Input 
                      type="number" 
                      placeholder="Amt" 
                      value={pointAdjustment} 
                      onChange={e => setPointAdjustment(e.target.value)} 
                      className="h-10 md:h-12 rounded-lg md:rounded-xl dark:bg-slate-800 border-none shadow-inner font-bold px-3 text-sm focus:ring-1 focus:ring-primary" 
                    />
                    <Button onClick={() => handleAdjustPoints('credit')} size="sm" className="h-10 w-10 md:h-12 md:w-12 rounded-lg md:rounded-xl bg-green-500 hover:bg-green-600 shadow-md shrink-0 p-0"><Plus size={20} /></Button>
                    <Button onClick={() => handleAdjustPoints('debit')} size="sm" className="h-10 w-10 md:h-12 md:w-12 rounded-lg md:rounded-xl bg-red-500 hover:bg-red-600 shadow-md shrink-0 p-0"><Trash2 size={16} /></Button>
                 </div>
              </div>

              <div className="pt-2">
                 <Button 
                    variant={selectedUser?.banned ? "default" : "destructive"} 
                    onClick={async () => { 
                      const newBanned = !selectedUser.banned;
                      await manageUser(selectedUser.uid, { banned: newBanned }); 
                      setSelectedUser({...selectedUser, banned: newBanned}); 
                      toast({title: newBanned ? "User Banned" : "User Restored"}); 
                    }} 
                    className={cn(
                      "w-full h-11 md:h-13 rounded-xl md:rounded-2xl font-black uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-xs",
                      selectedUser?.banned 
                        ? "bg-green-600 hover:bg-green-700 text-white border-none" 
                        : "bg-red-600 hover:bg-red-700 text-white border-none"
                    )}
                 >
                    {selectedUser?.banned ? (
                      <><RefreshCw size={14} /> Restore User</>
                    ) : (
                      <><Ban size={14} /> Ban User</>
                    )}
                 </Button>
                 <p className="text-[6px] md:text-[7px] text-center text-slate-300 dark:text-slate-600 uppercase font-black tracking-widest mt-4 opacity-60">
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
                 <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden shadow-inner group">
                    {gameForm.icon ? <Image src={gameForm.icon} alt={gameForm.title} fill className="object-cover" /> : <ImageIcon className="text-slate-300" />}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'game')} />
                 </div>
              </div>
              <SettingInput label="Title" value={gameForm.title} onChange={v => setGameForm({ ...gameForm, title: v })} placeholder="e.g. Free Fire" />
              <div className="space-y-2">
                 <Label className="text-[9px] md:text-10px] font-black uppercase text-slate-400 ml-1">Category</Label>
                 <Select value={gameForm.category} onValueChange={v => setGameForm({ ...gameForm, category: v as any })}>
                    <SelectTrigger className="h-12 rounded-xl dark:bg-slate-800 border-none px-4"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                       <SelectItem value="top-up" className="p-3 font-bold text-xs">Top-Up Items</SelectItem>
                       <SelectItem value="accounts" className="p-3 font-bold text-xs">Account Marketplace</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
              <div className="flex items-center justify-between p-3 md:p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                 <Label className="font-bold text-sm">Auto Detect Name</Label>
                 <Switch checked={gameForm.autoDetectName} onCheckedChange={v => setGameForm(f => ({ ...f, autoDetectName: v }))} />
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
                 {productForm.thumbnail ? <Image src={productForm.thumbnail} alt={productForm.title} fill className="object-cover" unoptimized /> : <><ImageIcon className="text-slate-300 w-10 h-10 md:w-12 md:h-12 mb-2" /><span className="text-[10px] font-black uppercase text-slate-400">Add Media</span></>}
                 <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'product')} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                 <SettingInput label="Package Title" value={productForm.title} onChange={v => setProductForm({ ...productForm, title: v })} placeholder="110 Diamonds" />
                 <div className="space-y-2">
                    <Label className="text-[9px] md:text-10px] font-black uppercase text-slate-400 ml-1">Parent Game</Label>
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
                 <SettingInput label="Discounted Price ($)" type="number" value={productForm.discountedPrice} onChange={v => setProductForm({ ...productForm, discountedPrice: v })} placeholder="1.99" />
              </div>
              <div className="space-y-2">
                 <Label className="text-[9px] md:text-10px] font-black uppercase text-slate-400 ml-1">Special Handling</Label>
                 <Select value={productForm.category} onValueChange={v => setProductForm({ ...productForm, category: v as any })}>
                    <SelectTrigger className="h-12 md:h-16 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-4 md:px-6 font-bold shadow-inner"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl z-[200]">
                       <SelectItem value="top-up" className="p-3 font-bold text-xs">Standard Delivery</SelectItem>
                       <SelectItem value="booyah-pass" className="p-3 font-bold text-xs">Booyah Pass (Direct WhatsApp)</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border dark:border-white/5">
                 <div className="flex items-center gap-3">
                    <ShieldAlert className="text-red-500 w-5 h-5" />
                    <div>
                       <p className="text-sm font-bold">One Time Only</p>
                       <p className="text-[10px] text-muted-foreground">Force high-visibility warning at checkout</p>
                    </div>
                 </div>
                 <Switch checked={productForm.isOneTime} onCheckedChange={v => setProductForm(f => ({ ...f, isOneTime: v }))} />
              </div>
              {productForm.category === 'booyah-pass' && <SettingInput label="Admin WhatsApp for Direct Sale" value={productForm.whatsappNumber || ""} onChange={v => setProductForm({ ...productForm, whatsappNumber: v })} placeholder="252613982172" />}
              <Button type="submit" disabled={isUploading} className="w-full h-14 md:h-20 rounded-2xl md:rounded-[2.5rem] font-black text-lg md:text-xl shadow-2xl uppercase tracking-widest active:scale-[0.98] transition-all">
                {isUploading ? <Loader2 className="animate-spin w-8 h-8" /> : "Save Package"}
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
                 <input 
                   placeholder="e.g. DEVL26%OFF" 
                   value={promoCodeForm.code} 
                   onChange={e => setPromoCodeInput({...promoCodeForm, code: e.target.value.toUpperCase().replace(/\s/g, '')})} 
                   className="h-12 md:h-16 rounded-xl md:rounded-2xl border-none bg-slate-50 dark:bg-slate-800 font-bold px-4 md:px-6 shadow-inner text-sm md:text-lg focus:ring-primary transition-all uppercase w-full" 
                 />
              </div>

              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Voucher Type</Label>
                 <div className="flex items-center space-x-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border dark:border-white/5">
                   <Checkbox 
                     id="multi-use-toggle"
                     checked={promoCodeForm.type === 'multi_use'} 
                     onCheckedChange={(checked) => setPromoCodeInput({...promoCodeForm, type: checked ? 'multi_use' : 'single_use'})}
                     className="h-5 w-5"
                   />
                   <div className="grid gap-1.5 leading-none">
                     <label
                       htmlFor="multi-use-toggle"
                       className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 uppercase"
                     >
                       dad badan
                     </label>
                     <p className="text-[10px] text-muted-foreground">
                       macamiil badan ayaa isticmaali karto. ka qaad tick ta si hal qof u isticmaalo.
                     </p>
                   </div>
                 </div>
              </div>

              <SettingInput label="Discount Percentage (%)" value={promoCodeForm.discount} type="number" onChange={v => setPromoCodeInput({...promoCodeForm, discount: v})} placeholder="e.g. 15" />
              
              <div className="grid grid-cols-2 gap-4">
                 <SettingInput label="Duration Value" value={promoCodeForm.duration} type="number" onChange={v => setPromoCodeInput({...promoCodeForm, duration: v})} placeholder="e.g. 7" />
                 <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Time Unit</Label>
                    <Select value={promoCodeForm.durationUnit} onValueChange={v => setPromoCodeInput({...promoCodeForm, durationUnit: v})}>
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

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">
                  Sababta code-ka loo sameeyay (Sababta)
                </Label>
                <Textarea 
                  placeholder="Internal note for admins..."
                  value={promoCodeForm.note}
                  onChange={e => setPromoCodeInput({...promoCodeForm, note: e.target.value})}
                  className="rounded-xl bg-slate-50 dark:bg-slate-800 border-none min-h-[80px] p-4 font-medium shadow-inner"
                />
              </div>

              <Button type="submit" disabled={isSavingStatus} className="w-full h-14 md:h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-[0.1em] shadow-xl active:scale-[0.98]">
                 {isSavingStatus ? <Loader2 className="animate-spin" /> : "Save"}
              </Button>
           </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPromoUsageOpen} onOpenChange={setIsPromoUsageOpen}>
         <DialogContent className="max-md w-[95%] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900">
            <div className="bg-primary p-6 text-white">
               <DialogTitle className="text-xl font-headline font-bold uppercase tracking-tight">Isticmaalayaasha Code ka ({selectedPromo?.code})</DialogTitle>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto scrollbar-hide space-y-3">
               {selectedPromo && (selectedPromo.type === 'multi_use' ? Object.values(selectedPromo.usedByUsers || {}) : (selectedPromo.claimed ? [{ uid: selectedPromo.usedBy, timestamp: selectedPromo.claimedAt || selectedPromo.createdAt }] : [])).length === 0 ? (
                 <div className="py-12 text-center opacity-30 italic font-bold uppercase text-xs">No users have used this code yet.</div>
               ) : (
                 (selectedPromo?.type === 'multi_use' ? Object.values(selectedPromo.usedByUsers || {}) : (selectedPromo?.claimed ? [{ uid: selectedPromo.usedBy, name: allUsers.find(u=>u.uid === selectedPromo.usedBy)?.name || 'User', whatsapp: allUsers.find(u=>u.uid === selectedPromo.usedBy)?.phoneNumber || 'N/A', timestamp: selectedPromo.claimedAt || selectedPromo.createdAt }] : [])).map((usage: any) => {
                    const profile = allUsers.find(u => u.uid === usage.uid);
                    return (
                      <div key={usage.uid} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border dark:border-white/5 flex items-center justify-between">
                         <div className="flex items-center gap-3 min-w-0">
                            <Avatar className="w-10 h-10 rounded-xl border-2 border-white shadow-sm shrink-0">
                               <AvatarImage src={profile?.photoURL} />
                               <AvatarFallback className="bg-primary/10 text-primary">
                                 <User size={20}/>
                               </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                               <div className="flex items-center gap-1 min-w-0">
                                 <p className="truncate font-semibold text-sm max-w-[120px]">{usage.name || profile?.name || 'Gamer'}</p>
                                 {profile?.isVerified && <VerifiedBadge />}
                               </div>
                               <p className="text-[10px] font-medium text-muted-foreground">{usage.whatsapp || profile?.phoneNumber || 'N/A'}</p>
                            </div>
                         </div>
                         <div className="text-right shrink-0">
                            <p className="text-[10px] font-black text-primary uppercase">{formatDistanceToNow(usage.timestamp, { addSuffix: true })}</p>
                            <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{format(usage.timestamp, 'MMM d, HH:mm')}</p>
                         </div>
                      </div>
                    );
                 })
               )}
            </div>
            <div className="p-6 pt-0">
               <Button onClick={() => setIsPromoUsageOpen(false)} className="w-full rounded-xl">Close</Button>
            </div>
         </DialogContent>
      </Dialog>

      <Dialog open={isPaymentMethodDialogOpen} onOpenChange={setIsPaymentMethodDialogOpen}>
        <DialogContent className="max-md w-[95%] rounded-[2rem] p-6 md:p-8 border-none shadow-2xl bg-white dark:bg-slate-900">
           <DialogHeader><DialogTitle className="text-xl md:text-2xl font-headline font-bold">New Payment Method</DialogTitle></DialogHeader>
           <form onSubmit={handleSavePaymentMethod} className="space-y-6 mt-6">
              <div className="flex justify-center mb-4">
                 <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden shadow-inner group">
                    {paymentMethodForm.icon ? <Image src={paymentMethodForm.icon} alt="Payment Method" fill className="object-cover" /> : <Smartphone className="text-slate-300" />}
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
              <Button type="submit" disabled={isUploading} className="w-full h-12 md:h-14 rounded-2xl font-bold uppercase tracking-widest shadow-lg bg-primary text-white">Save Method</Button>
           </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEnforceDialogOpen} onOpenChange={setIsEnforceDialogOpen}>
        <DialogContent className="max-md w-[95%] rounded-[2rem] md:rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900 animate-in zoom-in duration-300">
           <DialogHeader className="p-6 md:p-8 bg-red-600 text-white rounded-t-[2rem] md:rounded-t-[3rem]">
              <DialogTitle className="text-xl md:text-2xl font-headline font-bold uppercase tracking-tight">Security Penalty</DialogTitle>
              <DialogDescription className="text-white/60 text-[9px] md:text-[10px] font-bold uppercase mt-1">Enforcing policy for Listing #{selectedAccount?.id.toUpperCase()}</DialogDescription>
           </DialogHeader>
           <div className="p-6 md:p-8 space-y-5 md:space-y-6">
              <div className="grid grid-cols-2 gap-3">
                 {(['delete', 'holding', 'approved', 'pending'] as const).map(act => (
                   <Button key={act} variant={enforceAction === act ? 'default' : 'outline'} onClick={() => setEnforceAction(act)} className={cn("rounded-xl h-10 md:h-12 uppercase font-black text-[9px] tracking-widest", enforceAction === act && act === 'delete' ? 'bg-red-600 text-white' : '')}>{act}</Button>
                 ))}
              </div>
              <span className="text-red-500 font-bold text-[10px]">Reason:</span>
              <Textarea value={enforceMessage} onChange={e => setEnforceMessage(e.target.value)} placeholder="e.g. Account listing was flagged by security. Penalty enforcement applied." className="rounded-xl md:rounded-2xl dark:bg-slate-800 border-none min-h-[100px] md:min-h-[120px] shadow-inner font-medium p-4" />
              <Button onClick={async () => { await enforceAccountAction(selectedAccount!.id, enforceAction, enforceMessage); setIsEnforceDialogOpen(false); setSelectedAccountId(null); setEnforceMessage(""); }} disabled={isSavingStatus || !enforceMessage} className="w-full h-14 md:h-16 rounded-xl md:rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest shadow-2xl">
                 Apply Enforcement
              </Button>
           </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-sm rounded-[2rem] p-6 md:p-10 border-none shadow-2xl bg-white dark:bg-slate-900 text-center">
           <DialogHeader className="sr-only">
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>{getDeleteDescription()}</DialogDescription>
           </DialogHeader>
           <div className="w-16 h-16 md:w-20 md:h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4 md:mb-6"><AlertCircle size={32} className="md:size-10" /></div>
           <h3 className="text-xl md:text-2xl font-headline font-bold text-slate-900 dark:text-white">Are you sure?</h3>
           <p className="text-[10px] md:text-xs uppercase font-black text-slate-400 mt-1 md:mt-2">{getDeleteDescription()}</p>
           <div className="flex gap-3 mt-6 md:mt-10">
              <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1 rounded-xl h-12 md:h-14 font-bold" disabled={isDeleting}>Maya</Button>
              <Button variant="destructive" onClick={executeDelete} className="flex-1 rounded-xl h-12 md:h-14 font-black uppercase tracking-widest shadow-lg shadow-red-500/20" disabled={isDeleting}>
                {isDeleting ? <Loader2 className="animate-spin" /> : "Haa, Tirtir"}
              </Button>
           </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEndEarlyDialogOpen} onOpenChange={setIsEndEarlyDialogOpen}>
        <DialogContent className="max-sm rounded-[2rem] p-6 md:p-10 border-none shadow-2xl bg-white dark:bg-slate-900 text-center">
           <DialogHeader className="sr-only">
              <DialogTitle>Jooji event ga?</DialogTitle>
              <DialogDescription>Ma hubtaa inaad hadda joojiso?</DialogDescription>
           </DialogHeader>
           <div className="w-16 h-16 md:w-20 md:h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mx-auto mb-4 md:mb-6"><Clock size={32} className="md:size-10" /></div>
           <h3 className="text-xl md:text-2xl font-headline font-bold text-slate-900 dark:text-white">Jooji event ga?</h3>
           <p className="text-[10px] md:text-xs uppercase font-black text-slate-400 mt-1 md:mt-2">Ma hubtaa inaad hadda joojiso?</p>
           <div className="flex gap-3 mt-6 md:mt-10">
              <Button variant="ghost" onClick={() => setIsEndEarlyDialogOpen(false)} className="flex-1 rounded-xl h-12 md:h-14 font-bold" disabled={isSavingStatus}>Maya</Button>
              <Button variant="destructive" onClick={executeEndEarly} className="flex-1 rounded-xl h-12 md:h-14 font-black uppercase tracking-widest shadow-lg shadow-red-500/20" disabled={isSavingStatus}>
                {isSavingStatus ? <Loader2 className="animate-spin" /> : "Haa, Jooji"}
              </Button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RewardControl({ rank, value, onChange, onSave }: { rank: number, value: string, onChange: (v: string) => void, onSave: () => void }) {
  const icon = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
  const label = rank === 1 ? "Top 1 Reward (%)" : rank === 2 ? "Top 2 Reward (%)" : "Top 3 Reward (%)";
  const desc = rank === 1 ? "Highest tier discount" : rank === 2 ? "Mid tier discount" : "Entry tier discount";
  
  return (
    <div className="group relative bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-6 md:p-10 rounded-2xl sm:rounded-[2.5rem] border dark:border-white/5 space-y-6 md:space-y-8 transition-all hover:shadow-xl hover:bg-white dark:hover:bg-slate-800">
       <div className="flex items-center gap-4 sm:gap-5">
          <div className={cn(
            "w-10 h-10 sm:w-12 sm:h-12 md:w-16 h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl md:text-4xl shadow-sm border border-white dark:border-white/5 shrink-0",
            rank === 1 ? "bg-yellow-500/10" : rank === 2 ? "bg-slate-300/10" : "bg-amber-600/10"
          )}>
            {icon}
          </div>
          <div className="min-w-0">
            <span className="block font-headline font-bold text-sm sm:text-base md:text-xl uppercase tracking-tight text-slate-900 dark:text-white truncate">{label}</span>
            <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 mt-0.5 sm:mt-1 truncate">{desc}</p>
          </div>
       </div>
       
       <div className="flex bg-white dark:bg-slate-900 p-1.5 sm:p-2 rounded-xl sm:rounded-[1.5rem] shadow-inner border border-slate-100 dark:border-white/5">
          <Input 
            type="number" 
            value={value} 
            placeholder="0"
            onChange={(e) => onChange(e.target.value)} 
            className="flex-1 h-10 sm:h-12 md:h-16 border-none bg-transparent font-black px-3 sm:px-6 text-lg sm:text-xl md:text-3xl focus-visible:ring-0 placeholder:opacity-20" 
          />
          <Button 
            onClick={onSave} 
            className="h-10 sm:h-12 md:h-16 px-4 sm:px-6 md:px-10 rounded-lg sm:rounded-xl md:rounded-2xl font-black uppercase tracking-widest gap-2 bg-primary shadow-lg shadow-primary/20 active:scale-95 transition-transform text-[10px] sm:text-xs md:text-sm"
          >
             <Save size={16} className="sm:size-5" /> <span className="hidden lg:inline">Save</span>
          </Button>
       </div>
    </div>
  );
}

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

  const handleCopyPlayerId = () => {
    const pid = order.ffUid || order.gameDetails?.playerID;
    if (pid) {
      navigator.clipboard.writeText(pid);
      toast({ title: "Player ID Copied" });
    }
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
                <div className="flex items-center gap-2 mb-2">
                   <h2 className="text-2xl md:text-5xl font-headline font-bold uppercase tracking-tight text-slate-900 dark:text-white">
                      {item?.title?.replace("Auction Winner", "Guuleystaha") || "ACCOUNT: UNKNOWN"}
                   </h2>
                   {item?.isOneTime && <Badge className="bg-red-500 text-white border-none font-bold text-[8px] md:text-[12px] px-2 py-0.5 uppercase ml-2">ONE TIME</Badge>}
                </div>
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
             <InsightStat label="Player ID" value={order.ffUid || order.gameDetails?.playerID || "N/A"} icon={Gamepad2} isPrimary action={(order.ffUid || order.gameDetails?.playerID) ? <button onClick={handleCopyPlayerId} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"> <Copy size={14} /> </button> : null} />
             <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                   <User size={14} className="opacity-40" />
                   <p className="text-[9px] font-black uppercase tracking-[0.2em]">In-Game Name</p>
                </div>
                <div className="flex items-center gap-1 min-w-0">
                   <p className="text-sm md:text-xl font-semibold truncate text-slate-900 dark:text-white">{order.ffPlayerName || order.gameDetails?.playerName || order.gameDetails?.name || "N/A"}</p>
                   {order.ffVerified ? (
                     <VerifiedBadge />
                   ) : order.ffUid ? (
                     <Badge className="bg-amber-100 text-amber-700 border-none text-[8px] h-5 px-1.5 uppercase font-black">Manual</Badge>
                   ) : null}
                </div>
             </div>
             <InsightStat label="Sender Number" value={order.gameDetails?.senderNumber || "N/A"} icon={CreditCard} />
             <InsightStat label="WhatsApp" value={order.gameDetails?.whatsappNumber || "N/A"} icon={MessageCircle} action={order.gameDetails?.whatsappNumber ? <button onClick={handleWhatsApp} className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-all"> <MessageCircle size={14} /> </button> : null} />
             <InsightStat label="Order Date" value={format(new Date(order.createdAt), "MMM d, h:mm a")} icon={Clock} />
             <InsightStat label="Category" value={order.gameDetails?.category || "Top-Up"} icon={Layers} />
             {order.ffRegion && <InsightStat label="Region" value={order.ffRegion} icon={Globe} />}
             {order.promoCode && <InsightStat label="Promo Code" value={order.promoCode} icon={Ticket} isPrimary />}
             {order.rankDiscount > 0 && <InsightStat label="Rank Reward" value={`${order.rank === 1 ? '🥇' : order.rank === 2 ? '🥈' : '🥉'} -${order.rankDiscount}%`} icon={Trophy} isPrimary />}
          </div>
       </Card>

       <Card className="rounded-[2.5rem] md:rounded-[3rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
          <div className="p-6 md:p-10 space-y-6 md:space-y-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 md:gap-4 text-primary">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
                  <ShieldCheck size={20} className="md:size-6" />
                </div>
                <h4 className="font-headline font-bold text-base md:text-3xl uppercase tracking-tight text-slate-900 dark:text-white">Administration Log</h4>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-slate-50 dark:bg-slate-800/40 rounded-[2rem] md:rounded-[3rem] -z-10" />
              <div className="p-5 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 md:gap-8">
                <div className="flex flex-row items-center gap-4 md:gap-8 text-left w-full sm:w-auto">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 md:w-32 md:h-32 rounded-2xl md:rounded-[2.5rem] overflow-hidden relative shadow-2xl ring-4 md:ring-8 ring-white dark:ring-slate-900 bg-white">
                      {order.processedBy?.photoURL ? (
                        <Image src={order.processedBy.photoURL} alt={order.processedBy.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center font-bold text-slate-300 text-3xl md:text-5xl">O</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="min-w-0 space-y-1">
                    <p className="text-[9px] md:text-xs font-black text-primary uppercase tracking-[0.2em] mb-0.5">Handling Admin</p>
                    <h5 className="text-xl md:text-4xl font-headline font-bold text-slate-900 dark:text-white truncate max-w-[150px] md:max-w-md">
                      {order.processedBy?.name || "Wali lama furin"}
                    </h5>
                    {order.processedAt && (
                      <div className="flex items-center gap-1.5 text-muted-foreground justify-start">
                         <Clock size={12} className="opacity-40" />
                         <p className="text-[8px] md:text-xs font-bold uppercase tracking-tight">
                            {formatDistanceToNow(new Date(order.processedAt))} ago
                         </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="hidden sm:block w-px h-16 md:h-24 bg-slate-200 dark:bg-white/10" />

                <div className="text-center sm:text-right space-y-1 md:space-y-2 shrink-0 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-white/5">
                  <p className="text-[9px] md:text-xs font-black text-muted-foreground uppercase tracking-widest opacity-40">Resolved on</p>
                  <div className="space-y-0.5">
                     <p className="text-base md:text-2xl font-black text-slate-900 dark:text-white">
                        {order.completedAt ? format(new Date(order.completedAt), "MMM d, yyyy") : "---"}
                     </p>
                     <p className="text-xs md:text-lg font-bold text-primary">
                        {order.completedAt ? format(new Date(order.completedAt), "HH:mm") : "PENDING..."}
                     </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
       </Card>

       <Card className="rounded-[2.5rem] md:rounded-[3rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
          <div className="p-6 md:p-12 space-y-8">
             <div className="flex items-center gap-4 text-primary">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                   <RefreshCw size={24} className={cn(isSaving && "animate-spin")} />
                </div>
                <h4 className="font-headline font-bold text-xl md:text-3xl uppercase tracking-tight text-slate-900 dark:text-white">Status Control</h4>
             </div>

             <div className="grid grid-cols-1 gap-8">
                <div className="space-y-3">
                   <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Change Order Status</label>
                   <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="h-16 md:h-20 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-8 font-bold text-lg shadow-inner">
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
                     <label className="text-[11px] font-black text-red-500 uppercase tracking-widest ml-1">Cancellation Reason</label>
                     <Textarea 
                       value={reason} 
                       onChange={(e) => setReason(e.target.value)} 
                       placeholder="e.g. Invalid Sender Number or Wrong Player ID" 
                       className="rounded-2xl bg-slate-50 dark:bg-slate-800 border-none min-h-[150px] p-8 font-medium shadow-inner text-lg" 
                     />
                  </div>
                )}

                <Button 
                   onClick={onUpdate} 
                   disabled={isSaving} 
                   className="w-full h-16 md:h-24 rounded-[2rem] font-black text-xl md:text-2xl uppercase tracking-widest shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all"
                >
                   {isSaving ? <Loader2 className="animate-spin w-8 h-8" /> : "Save Status"}
                </Button>

                <div className="pt-6 space-y-6">
                   <p className="text-center text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Quick Actions</p>
                   <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" onClick={handleCopyId} className="h-14 rounded-2xl font-bold uppercase text-xs gap-2 border-2">
                         <Copy size={16} /> Copy ID
                      </Button>
                      <Button variant="outline" onClick={handleWhatsApp} className="h-14 rounded-2xl font-bold uppercase text-xs gap-2 border-2">
                         <MessageCircle size={16} /> WhatsApp
                      </Button>
                   </div>
                </div>
             </div>
          </div>
       </Card>
    </div>
  );
}

function AccountDetailView({ post, allUsers, onBack, onUpdate, status, setStatus, buyerId, setBuyerId, isSaving, onDelete, onEnforce, enforceAccountAction, suspendSeller, dismissAccountWarning }: any) {
  const [now, setNow] = useState(Date.now());
  
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  if (!post) return null;
  const claimants = Object.values(post.claimants || {});
  const { updateAccountPostStatus } = useApp();

  const pendingClaims = claimants.filter((c: any) => c.status === 'pending');
  const earliestClaim = pendingClaims.length > 0 ? Math.min(...pendingClaims.map((c: any) => {
    const t = Number(c.timestamp);
    return isNaN(t) ? Infinity : t;
  })) : null;
  const isStalling = earliestClaim && earliestClaim !== Infinity && (now - earliestClaim) >= 3600000 && !post.sellerReported && !post.sold && !post.warningDismissedAt;

  const isWaiting = earliestClaim && earliestClaim !== Infinity && !post.sellerReported && !post.sold;
  const waitValue = isWaiting ? formatDistanceToNow(new Date(earliestClaim!)) : "None";

  const handleForceSold = (uid: string) => {
    updateAccountPostStatus(post.id, 'sold', uid);
    toast({ title: "Account assigned to buyer!" });
  };

  const handleWhatsApp = (num: string) => {
    const formatted = formatWhatsAppNumber(num);
    window.open(`https://wa.me/${formatted}`, '_blank');
  };

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
                    <Image src={finalBuyer.photoURL} alt={finalBuyer.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/10 flex items-center justify-center"><User size={24}/></div>
                  )}
               </div>
               <div>
                  <p className="text-[10px] md:text-11px] font-black uppercase tracking-widest text-white/60 mb-0.5">Final Buyer</p>
                  <div className="flex items-center gap-1 min-w-0">
                    <p className="truncate font-semibold text-xl md:text-2xl max-w-[200px]">{finalBuyer?.name || "Market User"}</p>
                    {finalBuyer?.isVerified && <VerifiedBadge />}
                  </div>
                  <p className="text-xs text-white/40">{finalBuyer?.phoneNumber}</p>
               </div>
            </div>
         </Card>
       )}

       {isStalling && (
         <Card className="rounded-[3rem] border-none bg-red-600 text-white p-6 md:p-10 space-y-8 animate-in slide-in-from-top-4 duration-700 shadow-2xl shadow-red-500/20">
            <div className="flex items-center gap-6">
               <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shrink-0 animate-pulse">
                  <ShieldAlert size={32} className="md:size-10 text-white" />
               </div>
               <div>
                  <h2 className="text-xl md:text-3xl font-headline font-bold uppercase tracking-tight font-black leading-none">Seller Stalling</h2>
                  <p className="text-white/80 text-[10px] md:text-sm font-bold mt-1 uppercase tracking-widest">PENALTY ACTION REQUIRED</p>
               </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
               <Button 
                onClick={() => enforceAccountAction(post.id, 'approved', 'Listing reset by admin due to lack of seller response.')} 
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-black uppercase text-[10px] h-12 rounded-xl"
               >
                  Reset & Approve
               </Button>
               
               <Button 
                onClick={() => enforceAccountAction(post.id, 'delete', 'Listing deleted due to stalling and security protocol violations.')} 
                className="bg-red-800 hover:bg-red-900 text-white font-black uppercase text-[10px] h-12 rounded-xl shadow-lg"
               >
                  Delete Listing
               </Button>

               <Button 
                onClick={() => suspendSeller(post.uid, 3)} 
                className="bg-slate-900 hover:bg-black text-white font-black uppercase text-[10px] h-12 rounded-xl shadow-lg"
               >
                  Suspend Seller (3D)
               </Button>

               <Button 
                variant="ghost" 
                onClick={() => dismissAccountWarning(post.id)} 
                className="text-white/60 hover:text-white border border-white/10 font-bold uppercase text-[10px] h-12 rounded-xl"
               >
                  Dismiss Overlay
               </Button>

               <Button 
                onClick={() => handleForceSold("")} 
                variant="outline"
                className="bg-white text-red-600 hover:bg-slate-50 font-black uppercase text-[10px] h-12 rounded-xl border-none"
               >
                  Force Sold (None)
               </Button>
            </div>

            {claimants.length > 0 && (
              <div className="pt-4 border-t border-white/10 space-y-3">
                 <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Penalty: Force Sold to Claimant</p>
                 <div className="flex flex-wrap gap-2">
                    {claimants.map((c: any) => (
                      <Button 
                        key={c.uid} 
                        size="sm" 
                        onClick={() => handleForceSold(c.uid)}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold text-[9px] h-10 px-4 rounded-xl shadow-md border-none"
                      >
                         Assign to {c.name.split(' ')[0]}
                      </Button>
                    ))}
                 </div>
              </div>
            )}
         </Card>
       )}

       <Card className="rounded-[3.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
          <div className="relative aspect-video w-full p-4 sm:p-8">
             <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden shadow-inner bg-slate-100 dark:bg-slate-800">
                {post.thumbnailUrl ? (
                   <Image src={post.thumbnailUrl} alt={post.authorName} fill className="object-cover" unoptimized />
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
                <StatItem label="Level" value={post.level || "0"} icon={Star} color="text-amber-500" />
                <StatItem label="ID" value={`#${post.id.toUpperCase()}`} icon={Hash} color="text-primary" />
                <StatItem label="Wait" value={waitValue} icon={Clock} color="text-blue-500" />
                <StatItem label="Category" value={post.gameType} icon={LayoutGrid} color="text-indigo-500" />
             </div>
          </div>
       </Card>

       <Card className="rounded-[2.5rem] md:rounded-[3.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
          <div className="p-6 md:p-10 space-y-6 md:space-y-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 md:gap-4 text-primary">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
                  <ShieldCheck size={20} className="md:size-6" />
                </div>
                <h4 className="font-headline font-bold text-base md:text-3xl uppercase tracking-tight text-slate-900 dark:text-white">Administration Log</h4>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-slate-50 dark:bg-slate-800/40 rounded-[2rem] md:rounded-[3rem] -z-10" />
              <div className="p-5 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 md:gap-8">
                <div className="flex flex-row items-center gap-4 md:gap-8 text-left w-full sm:w-auto">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 md:w-32 md:h-32 rounded-2xl md:rounded-[2.5rem] overflow-hidden relative shadow-2xl ring-4 md:ring-8 ring-white dark:ring-slate-900 bg-white">
                      {order.processedBy?.photoURL ? (
                        <Image src={order.processedBy.photoURL} alt={order.processedBy.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center font-bold text-slate-300 text-3xl md:text-5xl">O</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="min-w-0 space-y-1">
                    <p className="text-[9px] md:text-xs font-black text-primary uppercase tracking-[0.2em] mb-0.5">Handling Admin</p>
                    <h5 className="text-xl md:text-4xl font-headline font-bold text-slate-900 dark:text-white truncate max-w-[150px] md:max-w-md">
                      {post.processedBy?.name || "Wali lama furin"}
                    </h5>
                    {post.processedAt && (
                      <div className="flex items-center gap-1.5 text-muted-foreground justify-start">
                         <Clock size={12} className="opacity-40" />
                         <p className="text-[8px] md:text-xs font-bold uppercase tracking-tight">
                            {formatDistanceToNow(new Date(post.processedAt))} ago
                         </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="hidden sm:block w-px h-16 md:h-24 bg-slate-200 dark:bg-white/10" />

                <div className="text-center sm:text-right space-y-1 md:space-y-2 shrink-0 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-white/5">
                  <p className="text-[9px] md:text-xs font-black text-muted-foreground uppercase tracking-widest opacity-40">Resolved on</p>
                  <div className="space-y-0.5">
                     <p className="text-base md:text-2xl font-black text-slate-900 dark:text-white">
                        {post.completedAt ? format(new Date(post.completedAt), "MMM d, yyyy") : "---"}
                     </p>
                     <p className="text-xs md:text-lg font-bold text-primary">
                        {post.completedAt ? format(new Date(post.completedAt), "HH:mm") : "PENDING..."}
                     </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
       </Card>

       <Card className="rounded-[2.5rem] md:rounded-[3rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
          <div className="p-6 md:p-12 space-y-8">
             <div className="flex items-center gap-4 text-primary">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                   <RefreshCw size={24} className={cn(isSaving && "animate-spin")} />
                </div>
                <h4 className="font-headline font-bold text-xl md:text-3xl uppercase tracking-tight text-slate-900 dark:text-white">Status Control</h4>
             </div>

             <div className="grid grid-cols-1 gap-8">
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
                                    {u.name || "Unknown User"} ({u.phoneNumber})
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
                   {isSaving ? <Loader2 className="animate-spin w-8 h-8" /> : "Save Listing"}
                </Button>
             </div>
          </div>
       </Card>
    </div>
  );
}

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

function InsightStat({ label, value, icon: Icon, isPrimary, action }: any) {
  return (
    <div className="space-y-2 group/stat">
       <div className="flex items-center gap-2 text-muted-foreground">
          <Icon size={14} className="opacity-40" />
          <p className="text-[9px] font-black uppercase tracking-[0.2em]">{label}</p>
       </div>
       <div className="flex items-center gap-2">
         <p className={cn(
           "text-sm md:text-xl font-bold truncate min-w-0 flex-1",
           isPrimary ? "text-primary" : "text-slate-900 dark:text-white"
         )} title={value}>{value}</p>
         {action && <div className="shrink-0">{action}</div>}
       </div>
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

function EventAccountAdminCard({ event, onEdit, onDelete, onViewParticipants, onEndEarly, onAssignWinner }: { event: any, onEdit: ()=>void, onDelete: ()=>void, onViewParticipants: ()=>void, onEndEarly: ()=>void, onAssignWinner: ()=>void }) {
  const { allUsers } = useApp();
  
  const statusColors: Record<string, { border: string, badge: string, dot?: boolean }> = {
    upcoming: { border: "border-blue-500", badge: "bg-blue-500 text-white" },
    active: { border: "border-green-500", badge: "bg-green-600 text-white", dot: true },
    ended: { border: "border-amber-700", badge: "bg-slate-600 text-white" },
    claimed: { border: "border-purple-600", badge: "bg-purple-600 text-white" }
  };

  const status = event.status || 'pending';
  const config = statusColors[status] || statusColors.upcoming;

  const winnerProfile = useMemo(() => {
    if (!event.winnerId) return null;
    return allUsers.find(u => u.uid === event.winnerId);
  }, [event.winnerId, allUsers]);

  return (
    <Card className={cn(
      "rounded-[3rem] md:rounded-[3.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden group border-l-[12px] transition-all hover:shadow-primary/5",
      config.border
    )}>
       <div className="aspect-[16/9] relative overflow-hidden bg-slate-100">
          {event.imageUrls?.[0] ? (
            <Image src={event.imageUrls[0]} alt={event.title} fill className="object-cover transition-transform duration-1000 group-hover:scale-105" unoptimized />
          ) : <div className="w-full h-full flex items-center justify-center text-slate-300 font-black">IMAGE</div>}
          
          <div className="absolute top-6 left-6">
             <Badge className={cn("border-none font-black uppercase text-[10px] px-4 py-2 shadow-xl tracking-widest flex items-center gap-2 rounded-xl backdrop-blur-md bg-opacity-90", config.badge)}>
                {config.dot && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                {status}
             </Badge>
          </div>
       </div>

       <div className="p-6 md:p-10 space-y-8">
          <div className="space-y-1">
             <h4 className="font-black text-2xl md:text-4xl uppercase tracking-tighter text-slate-900 dark:text-white leading-none">{event.title}</h4>
             <p className="text-sm font-bold text-[#D97706] uppercase tracking-[0.2em]">{event.gameName}</p>
          </div>

          {(status === 'ended' || status === 'claimed') && winnerProfile && (
             <div className="p-5 md:p-8 bg-primary/5 dark:bg-primary/10 rounded-[1.5rem] md:rounded-[2.5rem] border border-primary/20 space-y-4 animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2 text-primary">
                      <Trophy size={18} />
                      <span className="font-black text-[10px] uppercase tracking-widest">Guuleystaha</span>
                   </div>
                   <Badge className={cn(
                     "text-[9px] font-black uppercase px-3 py-1 rounded-full border-none shadow-sm",
                     event.winnerClaim?.status === 'accepted' ? "bg-green-50 text-white" : 
                     event.winnerClaim?.status === 'ignored' ? "bg-red-50 text-white" : "bg-amber-500 text-white"
                   )}>
                      {event.winnerClaim?.status || 'PENDING'}
                   </Badge>
                </div>
                <div className="flex items-center gap-4">
                   <Avatar className="w-12 h-12 md:w-16 md:h-16 border-4 border-white dark:border-slate-800 shadow-lg">
                      <AvatarImage src={winnerProfile.photoURL} />
                      <AvatarFallback className="bg-primary/20 text-primary font-bold">{winnerProfile.name?.[0]}</AvatarFallback>
                   </Avatar>
                   <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 min-w-0">
                        <p className="truncate font-semibold text-base md:text-xl max-w-[200px]">{winnerProfile.name}</p>
                        {winnerProfile.isVerified && <VerifiedBadge />}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground mt-0.5">
                         <Smartphone size={14} />
                         <p className="text-[11px] md:text-sm font-medium">{winnerProfile.phoneNumber}</p>
                      </div>
                   </div>
                   <div className="text-right shrink-0">
                      <p className="text-[10px] font-black text-primary uppercase leading-none mb-1">Offer</p>
                      <p className="text-2xl font-headline font-bold text-primary tracking-tighter">${event.winnerClaim?.finalPrice?.toFixed(2)}</p>
                   </div>
                </div>
             </div>
          )}

          <div className="grid grid-cols-2 gap-6 md:gap-10 py-6 border-y dark:border-white/5">
             <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Qiimaha asalka</p>
                <div className="flex items-center gap-2">
                   <span className="text-primary font-black text-2xl md:text-4xl">$</span>
                   <span className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{event.initialPrice}</span>
                </div>
             </div>
             <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Ka qeeybalayaal</p>
                <div className="flex items-center gap-3">
                   <Users className="text-slate-300 w-6 h-6 md:w-8 md:h-8" />
                   <span className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{event.participantsCount || 0}</span>
                </div>
             </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 md:gap-4 pt-2">
             <button 
               onClick={onEdit}
               className="rounded-2xl h-12 md:h-16 px-4 md:px-6 border-2 font-bold gap-2 text-xs md:text-sm active:scale-95 transition-all flex items-center justify-center bg-transparent border-slate-200 dark:border-white/10"
             >
                <Edit className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
                <span>Edit</span>
             </button>
             
             <button 
               onClick={onViewParticipants}
               className="rounded-2xl h-12 md:h-16 px-4 md:px-6 bg-slate-50 dark:bg-slate-800 border-none font-bold gap-2 text-xs md:text-sm active:scale-95 transition-all flex items-center justify-center"
             >
                <Users className="w-4 h-4 md:w-5 md:h-5 text-slate-500" />
                <span>Leaderboard</span>
             </button>

             <button 
               onClick={onAssignWinner}
               className="rounded-2xl h-12 md:h-16 px-6 md:px-10 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] md:text-xs gap-2 shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center flex-1 sm:flex-none"
             >
                <Trophy className="w-4 h-4 md:w-5 md:h-5" />
                <span>Dooro guuleystaha</span>
             </button>

             <div className="flex items-center gap-2 ml-auto w-full sm:w-auto justify-end pt-4 sm:pt-0">
                {status === 'active' && (
                  <button 
                    onClick={onEndEarly}
                    className="h-12 px-4 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 active:scale-95 transition-all shrink-0 font-bold uppercase text-[10px] gap-2 flex items-center"
                  >
                     <Clock className="w-4 h-4" />
                     <span>Jooji event ga</span>
                  </button>
                )}

                <button 
                  onClick={onDelete}
                  title="Delete Event"
                  className="h-12 w-12 md:h-14 md:w-14 p-0 rounded-2xl text-slate-300 hover:text-red-600 active:scale-95 transition-all shrink-0 flex items-center justify-center"
                >
                   <Trash2 size={16} />
                </button>
             </div>
          </div>
       </div>
    </Card>
  );
}

function EventAccountParticipantsView({ eventId, eventAccount, onBack, onAssignWinner }: { eventId: string, eventAccount: any, onBack: ()=>void, onAssignWinner: (eid: string, uid: string)=>void }) {
  const { rtdb } = useApp();
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!rtdb || !eventId) return;
    const participantsRef = ref(rtdb, `eventParticipants/${eventId}`);
    const unsub = onValue(participantsRef, (snap) => {
      const data = snap.val();
      if (data) {
        const sorted = Object.values(data).sort((a: any, b: any) => {
          if (b.taps !== a.taps) return b.taps - a.taps;
          return a.lastTapTime - b.lastTapTime;
        });
        setParticipants(sorted);
      } else {
        setParticipants([]);
      }
      setLoading(false);
    });
    return () => off(participantsRef);
  }, [rtdb, eventId]);

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4">
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ArrowLeft size={24}/></button>
             <div>
                <h3 className="font-headline font-bold text-2xl uppercase tracking-tight">{eventAccount?.title}</h3>
                <p className="text-[10px] font-black text-muted-foreground uppercase">Real-time Participants List</p>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard label="Ka qeeybalayaal" value={participants.length.toString()} icon={Users} color="text-blue-500" bgColor="bg-blue-50 dark:bg-blue-500/10" />
          <StatCard label="Total Bid" value={participants.reduce((acc, p) => acc + p.taps, 0).toString()} icon={Activity} color="text-green-500" bgColor="bg-green-50 dark:bg-green-500/10" />
          <StatCard label="Kaaalinta 1aad" value={participants[0]?.name || "None"} icon={Trophy} color="text-amber-500" bgColor="bg-amber-50 dark:bg-amber-500/10" />
          <StatCard label="Status" value={eventAccount?.status || "..."} icon={Radio} color="text-indigo-500" bgColor="bg-indigo-50 dark:bg-indigo-500/10" />
       </div>

       <Card className="rounded-[3rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                  <TableRow className="border-none h-16">
                    <TableHead className="px-6 lg:px-10 font-black text-[10px] uppercase">Rank</TableHead>
                    <TableHead className="font-black text-[10px] uppercase">User</TableHead>
                    <TableHead className="font-black text-[10px] uppercase">Bid</TableHead>
                    <TableHead className="font-black text-[10px] uppercase">Value</TableHead>
                    <TableHead className="font-black text-[10px] uppercase">Last Bid</TableHead>
                    <TableHead className="text-right px-6 lg:px-10 font-black text-[10px] uppercase">Actions</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="h-64 text-center">Loading Participants...</TableCell></TableRow>
                  ) : participants.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="h-64 text-center opacity-30 italic font-bold">No participants yet</TableCell></TableRow>
                  ) : (
                    participants.map((p, idx) => (
                      <TableRow key={p.uid} className={cn(
                        "h-24 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 border-slate-50 dark:border-white/5",
                        p.uid === eventAccount?.winnerId && "bg-primary/5"
                      )}>
                        <TableCell className="px-6 lg:px-10 font-headline font-bold text-xl">{idx + 1}</TableCell>
                        <TableCell>
                            <div className="flex items-center gap-1 min-w-0">
                              <Avatar className="w-10 h-10 border-2 border-white dark:border-slate-700 shadow-sm shrink-0">
                                  <AvatarImage src={p.avatar} />
                                  <AvatarFallback>{p.name?.[0]}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1 min-w-0">
                                    <p className="truncate font-semibold text-sm max-w-[150px]">{p.name}</p>
                                    {p.isVerified && <VerifiedBadge />}
                                  </div>
                                  <p className="text-[9px] text-muted-foreground font-black">{p.phone}</p>
                              </div>
                            </div>
                        </TableCell>
                        <TableCell className="font-bold text-lg">{p.taps}</TableCell>
                        <TableCell className="font-bold text-lg text-primary">${p.value.toFixed(2)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-medium">{formatDistanceToNow(p.lastTapTime, { addSuffix: true })}</TableCell>
                        <TableCell className="text-right px-6 lg:px-10">
                            <div className="flex justify-end items-center gap-3">
                               <button 
                                 onClick={() => {
                                   const formatted = formatWhatsAppNumber(p.phone);
                                   window.open(`https://wa.me/${formatted}`, '_blank');
                                 }}
                                 className="w-10 h-10 rounded-xl bg-green-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                               >
                                  <MessageCircle size={18} />
                               </button>
                               <button 
                                 onClick={() => onAssignWinner(eventId, p.uid)}
                                 className={cn(
                                   "rounded-xl h-10 px-4 uppercase font-black text-[9px] tracking-widest gap-2 shadow-lg flex items-center justify-center transition-all active:scale-95",
                                   p.uid === eventAccount?.winnerId ? "bg-green-600 hover:bg-green-700 text-white border-none" : "bg-primary text-white border-none"
                                 )} 
                               >
                                 {p.uid === eventAccount?.winnerId ? <><Check size={14} /> Winner</> : "Make Winner"}
                               </button>
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
  );
}

function StatBox({ icon: Icon, label, value, color, bgColor }: { icon: any, label: string, value: string, color: string, bgColor: string }) {
  return (
    <div className={cn("p-4 rounded-2xl flex items-center gap-4", bgColor)}>
       <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color, "bg-white dark:bg-slate-900 shadow-sm")}>
          <Icon size={20} />
       </div>
       <div>
          <p className="text-xl font-headline font-bold leading-none">{value}</p>
          <p className="text-[10px] font-black uppercase text-slate-400 mt-1">{label}</p>
       </div>
    </div>
  );
}

function StatusInfo({ icon: Icon, label, value, color }: { icon: any, label: string, value: any, color?: string }) {
  return (
    <div className="space-y-1 min-w-0">
      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 opacity-50">
        <Icon size={10} /> {label}
      </p>
      <p className={cn("text-xs sm:text-base font-bold truncate", color || "text-slate-900 dark:text-white")}>{value}</p>
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
