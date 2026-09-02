"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useApp } from "@/lib/context";
import { 
  Settings as SettingsIcon, 
  Plus, 
  Minus,
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
  Activity,
  Cpu,
  Unlink,
  ExternalLink as LinkExternal,
  TrendingUp,
  TrendingDown,
  PieChart as ChartIcon,
  MoreVertical,
  UserPlus,
  Truck,
  ClipboardList,
  EyeOff,
  Lock,
  Key,
  SlidersHorizontal,
  Terminal,
  CheckCheck,
  Power
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
import { Progress } from "@/components/ui/progress";
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
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { uploadToImgbb } from "@/lib/imgbb";
import { format, formatDistanceToNow, subDays, startOfDay, isSameDay, startOfMonth, endOfMonth, isWithinInterval, subMonths } from "date-fns";
import { ref, onValue, off, get, query, limitToLast, remove } from "firebase/database";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import VerifiedBadge from "@/components/VerifiedBadge";

// DND Kit Imports
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensors,
  useSensor,
  DndContext,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';

/**
 * Utility to safe-format relative dates
 */
const safeFormatDistanceToNow = (timestamp: any, options?: any) => {
  if (!timestamp) return "---";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "---";
  try {
    return formatDistanceToNow(date, options);
  } catch {
    return "---";
  }
};

function MarketplaceExpiration({ createdAt, status }: { createdAt?: number, status: string }) {
  const [age, setAge] = useState("Just now");

  useEffect(() => {
    if (!createdAt) return;
    
    const update = () => {
      setAge(safeFormatDistanceToNow(createdAt));
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
    return () => {
      if (typeof window !== 'undefined') clearInterval(interval);
    };
  }, [post]);

  return (
    <div className="flex items-center gap-2">
      <span className={cn(
        "text-[10px] font-bold", 
        elapsed === "None" ? "text-slate-200 italic" : isUrgent ? "text-red-500" : "text-slate-50"
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
            {p.autoTopupEnabled && <Badge className="bg-green-500 text-white text-[7px] uppercase font-black px-1.5 h-4">Auto</Badge>}
            {p.category === 'special_package' && <Badge className="bg-indigo-500 text-white text-[7px] uppercase font-black px-1.5 h-4">Special Pkg</Badge>}
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

// Helper formatting function for labels
const formatLabel = (name: string) => {
  let label = name.replace(/_/g, ' ');
  return label.charAt(0).toUpperCase() + label.slice(1);
};

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
    resetLeaderboard,
    setGlobalLoading,
    adminNotifications,
    rtdb
  } = useApp();

  const router = useRouter();

  const [activeView, setActiveTab] = useState<'dashboard' | 'orders' | 'inventory' | 'account-posts' | 'account-events' | 'events' | 'users' | 'settings' | 'promo-codes' | 'leaderboard'>('dashboard');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const [expandedGameId, setExpandedGameId] = useState<string | null>(null);

  const [adminSearchQuery, setAdminSearchQuery] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'processing' | 'successful' | 'cancelled'>('all');
  const [userFilterTab, setUserFilterTab] = useState<'all' | 'admins' | 'online' | 'verified'>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const adminScrollRef = useRef<HTMLDivElement>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

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

  const [gameForm, setGameForm] = useState({ title: "", icon: "", category: "top-up", autoDetectName: false, active: true });
  const [productForm, setProductForm] = useState({ 
    title: "", 
    gameId: "", 
    category: "top-up" as any, 
    description: "", 
    price: "", 
    discountedPrice: "", 
    thumbnail: "", 
    whatsappNumber: "", 
    isOneTime: false, 
    autoTopupEnabled: false, 
    fazercardsCategory_id: "", 
    fazercardsOffer_id: "", 
    fazercardsMultiQuantity: 1, 
    requiredFields: [] as any[],
    specialPackage: {
      offers: [] as any[],
      totalProviderCost: 0
    }
  });
  const [eventForm, setEventForm] = useState({ title: "", shortDescription: "", content: "", thumbnailUrl: "", type: "freefire_event" as any, active: true, duration: "", durationUnit: "days", redirectRoute: "", buttonText: "" });
  const [bannerForm, setBannerForm] = useState({ imageUrl: "", linkTo: "" });
  const [paymentMethodForm, setPaymentMethodForm] = useState({ name: "", icon: "", ussdTemplate: "", active: true });
  const [promoCodeForm, setPromoCodeInput] = useState({ code: "", discount: "", duration: "", durationUnit: "days", note: "", type: 'single_use' as any });
  
  const [brandForm, setBrandForm] = useState({ name: "Oskarshop", announcementTicker: "", announcement: "", isLive: false, logo: "" });
  const [economyForm, setEconomyForm] = useState({ paymentNumber: "" });
  const [helpLinksForm, setHelpLinksForm] = useState({ tutorialUrl: "", tutorialThumbnail: "", tutorialBannerActive: false, whatsappNumber: "", tiktokUrl: "" });
  const [appStatusForm, setAppStatusForm] = useState({ offline: false, offlineTitle: "", offlineBody: "", offlineImageUrl: "" });
  const [termsForm, setTermsForm] = useState({ en: "", so: "" });
  const [telegramForm, setTelegramForm] = useState({ telegramBotToken: "", telegramAdminChatIds: "" });

  const [leaderboardForm, setLeaderboardForm] = useState({
    rewardsActive: true,
    rewards: { rank1: "", rank2: "", rank3: "" } as any
  });

  const [emailConfigForm, setEmailConfigForm] = useState({
    verification: { serviceId: "", templateId: "", publicKey: "" },
    recovery: { serviceId: "", templateId: "", publicKey: "" }
  });

  // Auto Schedule State
  const [scheduleForm, setScheduleForm] = useState({
    enabled: false,
    openTime: "09:00",
    closeTime: "21:30",
    timezone: "Africa/Mogadishu"
  });
  const [mogadishuTime, setMogadishuTime] = useState("");
  const [isScheduleBannerDismissed, setIsScheduleBannerDismissed] = useState(false);

  // FazerCards & Automation UI States
  const [fazerCategories, setFazerCategories] = useState<any[]>([]);
  const [fazerOffers, setFazerOffers] = useState<any[]>([]);
  const [fazerRequiredFields, setFazerRequiredFields] = useState<string[]>([]);
  const [isTestingFazer, setIsTestingFazer] = useState(false);
  const [fazerApiKey, setFazerApiKey] = useState("");
  const [recentSms, setRecentSms] = useState<any[]>([]);
  const [rawSmsLogs, setRawSmsLogs] = useState<any[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [smsMatcherSecret, setSmsMatcherSecret] = useState("");

  // Package Builder Selectors
  const [isOfferSelectorOpen, setIsOfferSelectorOpen] = useState(false);
  const [packageBuilderState, setPackageBuilderState] = useState({
    category_id: "",
    categoryName: "",
    offer_id: "",
    offerName: "",
    offerPrice: "",
    quantity: 1
  });

  const [pointAdjustment, setPointAdjustment] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Settings Redesign UI States
  const [settingsActiveTab, setSettingsActiveTab] = useState<string>('branding');
  const [settingsSearchQuery, setSettingsSearchQuery] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showFazerKey, setShowFazerKey] = useState(false);
  const [settingsAutomationSubTab, setSettingsAutomationSubTab] = useState<'config' | 'webhooks' | 'sms'>('config');

  // Mobile Settings Navigation States & Unsaved tracking
  const [mobileSettingsSubView, setMobileSettingsSubView] = useState<'menu' | 'general' | 'section'>('menu');
  const [isUnsavedChangesOpen, setIsUnsavedChangesOpen] = useState(false);
  const [isSettingsDirty, setIsSettingsDirty] = useState(false);

  useEffect(() => {
    try {
      const cached = localStorage.getItem('oskarshop_settings_active_section');
      if (cached) setSettingsActiveTab(cached);
    } catch (e) {}
  }, []);

  const handleSettingsTabChange = (tab: string) => {
    setSettingsActiveTab(tab);
    try {
      localStorage.setItem('oskarshop_settings_active_section', tab);
    } catch (e) {}
  };

  const copyToClipboard = (text: string, fieldKey: string, toastMessage: string = "Copied to clipboard") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    toast({ title: toastMessage, description: text });
    setTimeout(() => setCopiedField(null), 2000);
  };

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

  // Click outside search container to collapse breathing search bar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        if (isSearchExpanded && !adminSearchQuery) {
          setIsSearchExpanded(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSearchExpanded, adminSearchQuery]);

  // Global scroll listener for Back-to-Top floating button
  useEffect(() => {
    const handleScroll = () => {
      const el = adminScrollRef.current;
      if (el) {
        setShowBackToTop(el.scrollTop > 250);
      } else {
        setShowBackToTop(window.scrollY > 250);
      }
    };

    const el = adminScrollRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll, { passive: true });
      return () => el.removeEventListener("scroll", handleScroll);
    } else {
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const scrollToTop = () => {
    const el = adminScrollRef.current;
    if (el) {
      el.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMobileSettingsBack = () => {
    if (isSettingsDirty) {
      setIsUnsavedChangesOpen(true);
    } else {
      setMobileSettingsSubView('menu');
    }
  };

  const handleDiscardSettings = () => {
    if (storeSettings) {
      setBrandForm({
        name: (storeSettings as any).platformName || "Oskarshop",
        announcementTicker: storeSettings.announcementTicker || "",
        announcement: storeSettings.announcementTicker || "",
        isLive: storeSettings.isLive || false,
        logo: storeSettings.logo || ""
      });
      setEconomyForm({
        paymentNumber: storeSettings.paymentNumber || ""
      });
      setHelpLinksForm({
        tutorialUrl: storeSettings.helpLinks?.tutorialUrl || "",
        tutorialThumbnail: storeSettings.helpLinks?.tutorialThumbnail || "",
        tutorialBannerActive: storeSettings.helpLinks?.tutorialBannerActive || false,
        whatsappNumber: storeSettings.helpLinks?.whatsappNumber || "",
        tiktokUrl: storeSettings.helpLinks?.tiktokUrl || ""
      });
      setAppStatusForm({
        offline: storeSettings.appStatus?.offline || false,
        offlineTitle: storeSettings.appStatus?.offlineTitle || "",
        offlineBody: storeSettings.appStatus?.offlineBody || "",
        offlineImageUrl: storeSettings.appStatus?.offlineImageUrl || ""
      });
      setTermsForm({
        en: storeSettings.termsAndConditions?.en || "",
        so: storeSettings.termsAndConditions?.so || ""
      });
      setTelegramForm({
        telegramBotToken: storeSettings.telegramBotToken || "",
        telegramAdminChatIds: storeSettings.telegramAdminChatIds || ""
      });
      setScheduleForm(storeSettings.schedule || {
        enabled: false,
        openTime: "09:00",
        closeTime: "21:30",
        timezone: "Africa/Mogadishu"
      });
      setEmailConfigForm({
        verification: (storeSettings as any).emailjs_verification || { serviceId: "", templateId: "", publicKey: "" },
        recovery: (storeSettings as any).emailjs || { serviceId: "", templateId: "", publicKey: "" }
      });
    }
    setIsSettingsDirty(false);
    setIsUnsavedChangesOpen(false);
    setMobileSettingsSubView('menu');
  };

  const handleSaveAndExitSettings = async () => {
    try {
      setIsSavingStatus(true);
      await updateStoreSettings({
        ...brandForm,
        helpLinks: helpLinksForm,
        appStatus: appStatusForm,
        termsAndConditions: termsForm,
        telegramBotToken: telegramForm.telegramBotToken,
        telegramAdminChatIds: telegramForm.telegramAdminChatIds,
        schedule: scheduleForm,
        emailjs_verification: emailConfigForm.verification,
        emailjs: emailConfigForm.recovery
      });
      setIsSettingsDirty(false);
      setIsUnsavedChangesOpen(false);
      setMobileSettingsSubView('menu');
      toast({ title: "Settings Saved", description: "All modifications were applied successfully." });
    } catch (e: any) {
      toast({ title: "Save Failed", description: e.message || "Could not save settings.", variant: "destructive" });
    } finally {
      setIsSavingStatus(false);
    }
  };

  // Live Mogadishu Clock (12h format)
  useEffect(() => {
    const timer = setInterval(() => {
      setMogadishuTime(new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Mogadishu',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (storeSettings && !formsInitialized.current) {
      setBrandForm({
        name: (storeSettings as any).platformName || "Oskarshop",
        announcementTicker: storeSettings.announcementTicker || "",
        announcement: storeSettings.announcementTicker || "",
        isLive: storeSettings.isLive || false,
        logo: storeSettings.logo || ""
      });
      setEconomyForm({
        paymentNumber: storeSettings.paymentNumber || ""
      });
      setHelpLinksForm({
        tutorialUrl: storeSettings.helpLinks?.tutorialUrl || "",
        tutorialThumbnail: storeSettings.helpLinks?.tutorialThumbnail || "",
        tutorialBannerActive: storeSettings.helpLinks?.tutorialBannerActive || false,
        whatsappNumber: storeSettings.helpLinks?.whatsappNumber || "",
        tiktokUrl: storeSettings.helpLinks?.tiktokUrl || ""
      });
      setAppStatusForm({
        offline: storeSettings.appStatus?.offline || false,
        offlineTitle: storeSettings.appStatus?.offlineTitle || "",
        offlineBody: storeSettings.appStatus?.offlineBody || "",
        offlineImageUrl: storeSettings.appStatus?.offlineImageUrl || ""
      });
      setTermsForm({
        en: storeSettings.termsAndConditions?.en || "",
        so: storeSettings.termsAndConditions?.so || ""
      });
      setTelegramForm({
        telegramBotToken: storeSettings.telegramBotToken || "",
        telegramAdminChatIds: storeSettings.telegramAdminChatIds || ""
      });
      
      setScheduleForm(storeSettings.schedule || {
        enabled: false,
        openTime: "09:00",
        closeTime: "21:30",
        timezone: "Africa/Mogadishu"
      });

      setEmailConfigForm({
        verification: (storeSettings as any).emailjs_verification || { serviceId: "", templateId: "", publicKey: "" },
        recovery: (storeSettings as any).emailjs || { serviceId: "", templateId: "", publicKey: "" }
      });

      setFazerApiKey(storeSettings.fazercards?.apiKey || "");
      setSmsMatcherSecret(storeSettings.sms_webhook?.secret || "oskarshop22");

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

  // Fetch SMS History, Webhook Logs, and Raw Logs
  useEffect(() => {
    if (activeView === 'settings' && rtdb) {
      const smsRef = query(ref(rtdb, 'sms_payments'), limitToLast(10));
      const smsUnsub = onValue(smsRef, (snap) => {
        const val = snap.val();
        if (val) setRecentSms(Object.entries(val).map(([id, v]: any) => ({ ...v, id })).sort((a,b) => b.receivedAt - a.receivedAt));
      });

      const rawRef = query(ref(rtdb, 'sms_raw_log'), limitToLast(10));
      const rawUnsub = onValue(rawRef, (snap) => {
        const val = snap.val();
        if (val) setRawSmsLogs(Object.entries(val).map(([id, v]: any) => ({ ...v, id })).sort((a,b) => b.receivedAt - a.receivedAt));
      });

      const webhookRef = query(ref(rtdb, 'webhook_logs/fazercards'), limitToLast(20));
      const webhookUnsub = onValue(webhookRef, (snap) => {
        const val = snap.val();
        if (val) setWebhookLogs(Object.entries(val).map(([id, v]: any) => ({ ...v, id })).sort((a,b) => b.receivedAt - a.receivedAt));
      });

      return () => { off(smsRef); off(rawRef); off(webhookRef); };
    }
  }, [activeView, rtdb]);

  const dashboardReports = useMemo(() => {
    const successfulOrders = allOrders.filter(o => o.status === 'successful');
    
    // Revenue Calcs
    const rawTotalRev = successfulOrders.reduce((acc, o) => acc + (o.total || 0), 0);
    const totalRev = rawTotalRev > 0 ? rawTotalRev : 124500; // Use actual revenue or demo default if brand new
    
    const weekStart = subDays(startOfDay(new Date()), 7).getTime();
    const prevWeekStart = subDays(startOfDay(new Date()), 14).getTime();
    const weekRev = successfulOrders
      .filter(o => o.createdAt >= weekStart)
      .reduce((acc, o) => acc + (o.total || 0), 0);
    const prevWeekRev = successfulOrders
      .filter(o => o.createdAt >= prevWeekStart && o.createdAt < weekStart)
      .reduce((acc, o) => acc + (o.total || 0), 0);
      
    let weekTrendPct = "+14.5% vs last week";
    if (prevWeekRev > 0) {
      const diff = ((weekRev - prevWeekRev) / prevWeekRev) * 100;
      weekTrendPct = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}% vs last week`;
    } else if (weekRev > 0) {
      weekTrendPct = "+100% vs last week";
    }

    const monthStart = startOfMonth(new Date()).getTime();
    const monthRev = successfulOrders
      .filter(o => o.createdAt >= monthStart)
      .reduce((acc, o) => acc + (o.total || 0), 0);
      
    const lastMonthStart = startOfMonth(subMonths(new Date(), 1)).getTime();
    const lastMonthEnd = endOfMonth(subMonths(new Date(), 1)).getTime();
    const lastMonthRev = successfulOrders
      .filter(o => o.createdAt >= lastMonthStart && o.createdAt <= lastMonthEnd)
      .reduce((acc, o) => acc + (o.total || 0), 0);

    // Pending Logic
    const rawPendingCount = allOrders.filter(o => o.status === 'pending').length;
    const pendingOrdersCount = rawPendingCount > 0 ? rawPendingCount : 342;

    // Formatted User Count
    const userCount = allUsers.length > 0 ? allUsers.length : 12400;
    const formattedUserCount = userCount >= 1000 ? `${(userCount / 1000).toFixed(1)}k` : userCount.toString();

    // Weekly Activity Calculation (M, T, W, T, F, S, S)
    const daysLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon
    const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const defaultVisualHeights = [
      { base: 40, fill: 60 },
      { base: 60, fill: 80 },
      { base: 80, fill: 40 },
      { base: 50, fill: 70 },
      { base: 100, fill: 90 },
      { base: 30, fill: 50 },
      { base: 45, fill: 60 }
    ];

    const weeklyActivity = daysLabels.map((dayLabel, index) => {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + index);
      const nextDayDate = new Date(dayDate);
      nextDayDate.setDate(dayDate.getDate() + 1);

      const dayStart = dayDate.getTime();
      const dayEnd = nextDayDate.getTime();

      const dayOrders = allOrders.filter(o => o.createdAt >= dayStart && o.createdAt < dayEnd);
      const daySuccessOrders = dayOrders.filter(o => o.status === 'successful');
      const orderCount = dayOrders.length;
      const successCount = daySuccessOrders.length;

      return {
        day: dayLabel,
        dateFormatted: format(dayDate, 'EEE, MMM d'),
        orderCount,
        successCount,
        baseHeight: defaultVisualHeights[index].base,
        fillHeight: defaultVisualHeights[index].fill,
        isToday: isSameDay(dayDate, now)
      };
    });

    const maxDayOrders = Math.max(...weeklyActivity.map(w => w.orderCount), 0);
    const normalizedWeeklyActivity = weeklyActivity.map((w, idx) => {
      if (maxDayOrders > 0 && w.orderCount > 0) {
        const baseH = Math.max(30, Math.min(100, Math.round((w.orderCount / maxDayOrders) * 100)));
        const fillH = Math.max(20, Math.min(100, Math.round((w.successCount / Math.max(w.orderCount, 1)) * 100)));
        return { ...w, baseHeight: baseH, fillHeight: fillH };
      }
      return w;
    });

    // Chart Data (Pie)
    const categoryDataMap: Record<string, number> = {};
    successfulOrders.forEach(o => {
      const cat = o.gameDetails?.category || "Top-up";
      categoryDataMap[cat] = (categoryDataMap[cat] || 0) + (o.total || 0);
    });
    const pieData = Object.entries(categoryDataMap).map(([name, value]) => ({ name, value }));

    // Recent System Updates
    const realUpdates = [
      ...allUsers.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 2).map(u => ({
        id: `usr-${u.uid}`,
        title: u.name || 'Alex R.',
        subtitle: 'New User Registration',
        time: u.createdAt || Date.now(),
        type: 'user',
        badgeColor: 'bg-[#6a1edb]',
        pulse: true,
        iconType: 'user'
      })),
      ...adminNotifications.slice(0, 2).map(n => ({
        id: `not-${n.id}`,
        title: n.title || 'Admin',
        subtitle: n.body || 'System Settings Update',
        time: n.createdAt,
        type: 'system',
        badgeColor: 'bg-[#4a626d]',
        pulse: false,
        iconType: 'settings'
      })),
      ...allOrders.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 2).map(o => ({ 
        id: `ord-${o.id}`, 
        title: `Order #${o.id.toUpperCase().slice(-4) || '4592'}`, 
        subtitle: o.status === 'successful' ? 'Payment Completed' : o.status === 'pending' ? 'Currently Processing' : 'Order Cancelled',
        time: o.createdAt, 
        type: 'order', 
        badgeColor: 'bg-[#004ac6]',
        pulse: false,
        iconType: 'shipping'
      }))
    ].sort((a, b) => b.time - a.time);

    const fallbackUpdates = [
      {
        id: 'mock-1',
        title: 'Alex R.',
        subtitle: 'New User Registration',
        time: Date.now() - 2 * 60 * 1000,
        type: 'user',
        badgeColor: 'bg-[#6a1edb]',
        pulse: true,
        iconType: 'user'
      },
      {
        id: 'mock-2',
        title: 'Admin',
        subtitle: 'System Settings Update',
        time: Date.now() - 60 * 60 * 1000,
        type: 'system',
        badgeColor: 'bg-[#4a626d]',
        pulse: false,
        iconType: 'settings'
      },
      {
        id: 'mock-3',
        title: 'Order #4592',
        subtitle: 'Currently Processing',
        time: Date.now() - 3 * 60 * 60 * 1000,
        type: 'order',
        badgeColor: 'bg-[#004ac6]',
        pulse: false,
        iconType: 'shipping'
      }
    ];

    const updates = realUpdates.length > 0 ? realUpdates.slice(0, 4) : fallbackUpdates;

    return {
      totalRev,
      weekRev,
      weekTrendPct,
      monthRev,
      lastMonthRev,
      pendingOrdersCount,
      formattedUserCount,
      weeklyActivity: normalizedWeeklyActivity,
      pieData,
      updates
    };
  }, [allOrders, allUsers, adminNotifications]);

  const scheduleAlert = useMemo(() => {
    if (!scheduleForm.enabled || !mogadishuTime) return null;
    
    // Get numeric parts from Mogadishu time for calculation
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Mogadishu',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const [h, m] = formatter.format(now).split(':').map(Number);
    const [oh, om] = scheduleForm.openTime.split(':').map(Number);
    const [ch, cm] = scheduleForm.closeTime.split(':').map(Number);
    
    const currentMins = h * 60 + m;
    const openMins = oh * 60 + om;
    const closeMins = ch * 60 + cm;

    if (closeMins - currentMins === 2) return { type: 'close', text: '⚠️ Website ka wuxuu xidhmi doonaa 2 daqiiqo gudahood' };
    if (openMins - currentMins === 2) return { type: 'open', text: '✅ Website ka wuxuu furan doonaa 2 daqiiqo gudahood' };
    return null;
  }, [scheduleForm, mogadishuTime]);

  const nextScheduleEvent = useMemo(() => {
    if (!scheduleForm.enabled || !mogadishuTime) return null;

    // Get numeric parts from Mogadishu time for calculation
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Mogadishu',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const [h, m] = formatter.format(now).split(':').map(Number);
    const [oh, om] = scheduleForm.openTime.split(':').map(Number);
    const [ch, cm] = scheduleForm.closeTime.split(':').map(Number);
    
    const currentMins = h * 60 + m;
    const openMins = oh * 60 + om;
    const closeMins = ch * 60 + cm;

    const format12h = (time24: string) => {
      const [h, m] = time24.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
    };

    if (openMins < closeMins) {
      if (currentMins < openMins) return `Furmaysa ${format12h(scheduleForm.openTime)}`;
      if (currentMins < closeMins) return `Xidhmaysa ${format12h(scheduleForm.closeTime)}`;
      return `Furmaysa ${format12h(scheduleForm.openTime)} (Berri)`;
    } else {
      if (currentMins >= openMins || currentMins < closeMins) return `Xidhmaysa ${format12h(scheduleForm.closeTime)}`;
      return `Furmaysa ${format12h(scheduleForm.openTime)}`;
    }
  }, [scheduleForm, mogadishuTime]);

  const selectedOrder = useMemo(() => allOrders.find(o => o.id === selectedOrderId), [selectedOrderId, allOrders]);
  const selectedAccount = useMemo(() => accountPosts.find(p => p.id === selectedAccountId), [selectedAccountId, accountPosts]);
  const selectedEventAccount = useMemo(() => eventAccounts.find(e => e.id === selectedEventId), [selectedEventId, eventAccounts]);

  const topUpOrders = useMemo(() => allOrders.filter(o => !o.gameDetails?.postId), [allOrders]);

  const filteredOrders = useMemo(() => {
    let list = topUpOrders;
    if (orderStatusFilter !== 'all') {
      list = list.filter(o => o.status === orderStatusFilter);
    }
    if (adminSearchQuery.trim()) {
      const q = adminSearchQuery.toLowerCase().trim();
      list = list.filter(o => {
        const idMatch = o.id?.toLowerCase().includes(q);
        const phoneMatch = o.userPhone?.toLowerCase().includes(q) || o.gameDetails?.phoneNumber?.toLowerCase().includes(q);
        const nameMatch = o.gameDetails?.playerName?.toLowerCase().includes(q) || o.gameDetails?.name?.toLowerCase().includes(q) || o.gameDetails?.eventTitle?.toLowerCase().includes(q);
        const itemMatch = o.items?.some(i => i.title?.toLowerCase().includes(q));
        const playerIDMatch = o.gameDetails?.playerID?.toString().toLowerCase().includes(q) || o.ffUid?.toLowerCase().includes(q);
        return idMatch || phoneMatch || nameMatch || itemMatch || playerIDMatch;
      });
    }
    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [topUpOrders, orderStatusFilter, adminSearchQuery]);

  const filteredUsers = useMemo(() => {
    let list = allUsers;
    if (userFilterTab === 'admins') {
      list = list.filter(u => u.role === 'admin');
    } else if (userFilterTab === 'online') {
      list = list.filter(u => {
        const lastActive = Number(u.lastActive);
        return !isNaN(lastActive) && (Date.now() - lastActive) < 300000;
      });
    } else if (userFilterTab === 'verified') {
      list = list.filter(u => !!u.isVerified);
    }

    if (adminSearchQuery.trim()) {
      const q = adminSearchQuery.toLowerCase().trim();
      list = list.filter(u => 
        u.name?.toLowerCase().includes(q) ||
        u.phoneNumber?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.uid?.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => {
      const aIsAdmin = a.role === 'admin';
      const bIsAdmin = b.role === 'admin';
      if (aIsAdmin && !bIsAdmin) return -1;
      if (!aIsAdmin && bIsAdmin) return 1;
      return 0;
    });
  }, [allUsers, userFilterTab, adminSearchQuery]);

  const filteredAccountPosts = useMemo(() => {
    if (!adminSearchQuery.trim()) return accountPosts;
    const q = adminSearchQuery.toLowerCase().trim();
    return accountPosts.filter(p => 
      p.authorName?.toLowerCase().includes(q) || 
      p.gameType?.toLowerCase().includes(q) ||
      (p as any).title?.toLowerCase().includes(q) ||
      p.id?.toLowerCase().includes(q)
    );
  }, [accountPosts, adminSearchQuery]);

  const filteredGames = useMemo(() => {
    if (!adminSearchQuery.trim()) return games;
    const q = adminSearchQuery.toLowerCase().trim();
    return games.filter(g => 
      g.title?.toLowerCase().includes(q) || 
      g.category?.toLowerCase().includes(q)
    );
  }, [games, adminSearchQuery]);

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
    setGameForm(game ? { title: game.title, icon: game.icon || "", category: game.category, autoDetectName: !!game.autoDetectName, active: game.active !== false } : { title: "", icon: "", category: "top-up", autoDetectName: false, active: true });
    setIsGameDialogOpen(true);
  };

  const handleOpenProductDialog = async (p?: any, gameId?: string) => {
    setEditingProduct(p || null);
    setProductForm(p ? { 
      ...p, 
      price: p.price.toString(), 
      discountedPrice: p.discountedPrice?.toString() || "", 
      isOneTime: !!p.isOneTime, 
      autoTopupEnabled: !!p.autoTopupEnabled, 
      fazercardsCategory_id: p.fazercardsCategory_id || "", 
      fazercardsOffer_id: p.fazercardsOffer_id || "", 
      fazercardsMultiQuantity: p.fazercardsMultiQuantity || 1, 
      requiredFields: p.requiredFields || [],
      specialPackage: p.specialPackage || { offers: [], totalProviderCost: 0 }
    } : { 
      title: "", 
      gameId: gameId || "", 
      category: "top-up", 
      description: "", 
      price: "", 
      discountedPrice: "", 
      thumbnail: "", 
      whatsappNumber: "", 
      isOneTime: false, 
      autoTopupEnabled: false, 
      fazercardsCategory_id: "", 
      fazercardsOffer_id: "", 
      fazercardsMultiQuantity: 1, 
      requiredFields: [], 
      specialPackage: { offers: [], totalProviderCost: 0 }
    });
    
    setFazerRequiredFields([]);

    // Fetch FazerCards categories
    try {
      const res = await fetch('/api/fazercards/topups?limit=500');
      const data = await res.json();
      if (data.ok) {
        const mapped = (data.items || []).map((c: any) => ({
          id: c.category_id,
          name: c.name
        }));
        setFazerCategories(mapped);
      }
      
      if (p?.fazercardsCategory_id) {
         const offRes = await fetch(`/api/fazercards/topups/offers?category_id=${p.fazercardsCategory_id}`);
         const offData = await offRes.json();
         if (offData.ok) {
           const mapped = (offData.items || offData.offers || []).map((o: any) => ({
             id: o.offer_id || o.id,
             name: o.name,
             price: o.price
           }));
           setFazerOffers(mapped);
           const required = (offData.fields || []).map((f: any) => f.name || f.key);
           setFazerRequiredFields(required);
         }
      }
    } catch (err) {
      console.error("Failed to load categories/offers", err);
    }
    
    setIsProductDialogOpen(true);
  };

  const handleFazerCategoryChange = async (cid: string) => {
    setProductForm({ ...productForm, fazercardsCategory_id: cid, fazercardsOffer_id: "", requiredFields: [] });
    setFazerOffers([]);
    setFazerRequiredFields([]);
    try {
      const res = await fetch(`/api/fazercards/topups/offers?category_id=${cid}`);
      const data = await res.json();
      if (data.ok) {
        const mapped = (data.items || data.offers || []).map((o: any) => ({
          id: o.offer_id || o.id,
          name: o.name,
          price: o.price
        }));
        setFazerOffers(mapped);
        
        // Extract raw fields to store in product doc for instant checkout
        const fieldsToStore = (data.fields || []).map((f: any) => ({ 
          key: f.key || "unknown", 
          name: f.name || f.key || "Field" 
        }));
        setProductForm(prev => ({ ...prev, fazercardsCategory_id: cid, requiredFields: fieldsToStore }));

        const requiredNames = (data.fields || []).map((f: any) => f.name || f.key);
        setFazerRequiredFields(requiredNames);
      }
    } catch (err) {
      console.error("Failed to change category", err);
    }
  };

  const handleOpenPaymentMethodDialog = (m?: any) => {
    setEditingPaymentMethod(m || null);
    setPaymentMethodForm(m ? { name: m.name, icon: m.icon || "", ussdTemplate: m.ussdTemplate || "", active: m.active } : { name: "", icon: "", ussdTemplate: "", active: true });
    setIsPaymentMethodDialogOpen(true);
  };

  const handleSaveGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try { await saveGame({ ...gameForm, category: gameForm.category as any, id: editingGame?.id }); setIsGameDialogOpen(false); toast({ title: "Game Saved" }); } finally { setIsUploading(false); }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (productForm.category === 'special_package' && productForm.specialPackage.offers.length === 0) {
      toast({ title: "Error", description: "Please add at least one offer to the package", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try { 
      await saveProduct({ 
        ...productForm, 
        price: parseFloat(productForm.price), 
        discountedPrice: productForm.discountedPrice ? parseFloat(productForm.discountedPrice) : undefined,
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
      await savePromoCode({ ...promoCodeForm, discount: parseFloat(promoCodeForm.discount) || 0 });
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

  const handleManualSuccess = async (orderId: string) => {
    setIsSavingStatus(true);
    try {
      await updateOrderStatus(orderId, 'successful');
      setSelectedOrderId(null);
      toast({ title: "Order Confirmed Successfully" });
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleManualSync = async (orderId: string) => {
    setIsSavingStatus(true);
    try {
      const res = await fetch(`/api/fazercards/sync-order?orderId=${orderId}`);
      const data = await res.json();
      if (data.success) {
        toast({ title: "Status Synced", description: `Provider Status: ${data.status}` });
        // The selecting logic will refresh via RTDB listener anyway
        setSelectedOrderId(null);
      } else {
        toast({ title: "Sync Failed", description: data.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Sync Error", variant: "destructive" });
    } finally {
      setIsSavingStatus(false);
    }
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

  const handleDragEnd = (event: any, gameId: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const gameItems = products.filter(p => p.gameId === gameId).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    const oldIndex = gameItems.slice().findIndex(p => p.id === active.id);
    const newIndex = gameItems.slice().findIndex(p => p.id === over.id);

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

  const handleSaveEmailConfig = async () => {
    setIsSavingStatus(true);
    try {
      await updateStoreSettings({
        emailjs_verification: emailConfigForm.verification,
        emailjs: emailConfigForm.recovery
      });
      toast({ title: "Email Config Synced" });
    } finally {
      setIsSavingStatus(false);
    }
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

  const handleSaveSchedule = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingStatus(true);
    try {
      await updateStoreSettings({
        schedule: scheduleForm
      });
      toast({ title: "Schedule Updated", description: "Auto open/close times synced successfully." });
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleTestFazerConnection = async () => {
    setIsTestingFazer(true);
    try {
      const res = await fetch('/api/fazercards/balance');
      const data = await res.json();
      if (data.success) {
        toast({ title: "Connection Successful!", description: `Balance: ${data.balance} ${data.currency}` });
      } else {
        toast({ title: "Connection Failed", description: data.error, variant: "destructive" });
      }
    } catch (err) {
       toast({ title: "Error", description: "Failed to reach FazerCards API.", variant: "destructive" });
    } finally {
      setIsTestingFazer(false);
    }
  };

  const handleRetryTopup = async () => {
    if (!selectedOrderId || !selectedOrder) return;
    setIsSavingStatus(true);
    try {
      const item = selectedOrder.items?.[0];
      const res = await fetch('/api/fazercards/place-topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrderId,
          category_id: item?.fazercardsCategory_id,
          offer_id: item?.fazercardsOffer_id,
          fields: selectedOrder.gameDetails?.gameFields
        })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Retry Initiated", description: "Waiting for confirmation." });
      } else {
        toast({ title: "Retry Failed", description: data.error, variant: "destructive" });
      }
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleClearWebhookLogs = async () => {
    if (!rtdb) return;
    try {
      await remove(ref(rtdb, 'webhook_logs/fazercards'));
      setWebhookLogs([]);
      toast({ title: "Logs Cleared" });
    } catch (e) {
      toast({ title: "Failed to clear logs", variant: "destructive" });
    }
  };

  const handleClearRawLogs = async () => {
    if (!rtdb) return;
    try {
      await remove(ref(rtdb, 'sms_raw_log'));
      setRawSmsLogs([]);
      toast({ title: "Raw Logs Cleared" });
    } catch (e) {
      toast({ title: "Failed to clear logs", variant: "destructive" });
    }
  };

  const handleClearSmsPayments = async () => {
    if (!rtdb) return;
    if (!confirm("Are you sure you want to clear all received SMS payments?")) return;
    try {
      await remove(ref(rtdb, 'sms_payments'));
      setRecentSms([]);
      toast({ title: "SMS Payments Cleared" });
    } catch (e) {
      toast({ title: "Failed to clear SMS payments", variant: "destructive" });
    }
  };

  // Helper functions for 12h time switching
  const getPeriod = (time24: string) => {
    const [h] = (time24 || "00:00").split(':').map(Number);
    return h >= 12 ? 'PM' : 'AM';
  };

  const setPeriod = (time24: string, newPeriod: 'AM' | 'PM') => {
    const parts = (time24 || "00:00").split(':');
    let h = parseInt(parts[0]);
    const m = parts[1];
    if (newPeriod === 'AM' && h >= 12) h -= 12;
    if (newPeriod === 'PM' && h < 12) h += 12;
    return `${h.toString().padStart(2, '0')}:${m}`;
  };

  // Package Builder Helpers
  const handlePackageCategoryChange = async (cid: string, name: string) => {
    setPackageBuilderState({ ...packageBuilderState, category_id: cid, categoryName: name, offer_id: "", offerName: "", offerPrice: "" });
    setFazerOffers([]);
    try {
      const res = await fetch(`/api/fazercards/topups/offers?category_id=${cid}`);
      const data = await res.json();
      if (data.ok) {
        const mapped = (data.items || data.offers || []).map((o: any) => ({
          id: o.offer_id || o.id,
          name: o.name,
          price: o.price
        }));
        setFazerOffers(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch package offers", err);
    }
  };

  const addToPackage = async () => {
    if (!packageBuilderState.category_id || !packageBuilderState.offer_id) return;
    
    const newOffer = {
      id: `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...packageBuilderState
    };

    const updatedOffers = [...productForm.specialPackage.offers, newOffer];

    // Fetch and merge fields to product's requiredFields
    let newRequiredFields = [...(productForm.requiredFields || [])];
    try {
      const res = await fetch(`/api/fazercards/topups/offers?category_id=${packageBuilderState.category_id}`);
      const data = await res.json();
      if (data.ok && data.fields) {
        data.fields.forEach((f: any) => {
          if (!newRequiredFields.find(rf => rf.key === f.key)) {
            newRequiredFields.push({ key: f.key, name: f.name || f.key });
          }
        });
      }
    } catch (e) {}

    setProductForm({
      ...productForm,
      requiredFields: newRequiredFields,
      specialPackage: {
        ...productForm.specialPackage,
        offers: updatedOffers,
        totalProviderCost: 0 
      }
    });

    // Reset selector
    setPackageBuilderState({
      category_id: "",
      categoryName: "",
      offer_id: "",
      offerName: "",
      offerPrice: "",
      quantity: 1
    });
    setIsOfferSelectorOpen(false);
  };

  const removeFromPackage = (id: string) => {
    const updatedOffers = productForm.specialPackage.offers.filter(o => o.id !== id);
    setProductForm({
      ...productForm,
      specialPackage: {
        ...productForm.specialPackage,
        offers: updatedOffers,
        totalProviderCost: 0
      }
    });
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
        <SideNavItem icon={LayoutDashboard} label="Dashboard" active={activeView === 'dashboard'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveTab('dashboard'); setSelectedOrderId(null); setSelectedAccountId(null); setIsMobileMenuOpen(false); }} />
        <SideNavItem icon={ShoppingBag} label="Orders" active={activeView === 'orders'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveTab('orders'); setSelectedOrderId(null); setIsMobileMenuOpen(false); }} badge={topUpOrders.filter(o => o.status === 'pending').length} />
        <SideNavItem icon={Gamepad2} label="ciwaanada" active={activeView === 'account-posts'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveTab('account-posts'); setSelectedAccountId(null); setIsMobileMenuOpen(false); }} badge={accountPosts.filter(p => p.status === 'pending').length} badgeVariant="primary" />
        <SideNavItem icon={Sparkles} label="Account Events" active={activeView === 'account-events'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveTab('account-events'); setSelectedEventId(null); setIsMobileMenuOpen(false); }} badge={eventAccounts.filter(e => e.status === 'active').length} badgeVariant="primary" />
        <SideNavItem icon={Trophy} label="Leaderboard" active={activeView === 'leaderboard'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveTab('leaderboard'); setIsMobileMenuOpen(false); }} />
        <SideNavItem icon={Box} label="Inventory" active={activeView === 'inventory'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveTab('inventory'); setIsMobileMenuOpen(false); }} />
        <SideNavItem icon={Megaphone} label="Live Events" active={activeView === 'events'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveTab('events'); setIsMobileMenuOpen(false); }} />
        <SideNavItem icon={Ticket} label="Promo Codes" active={activeView === 'promo-codes'} expanded={isSidebarExpanded || isMobile} onClick={() => { setActiveTab('promo-codes'); setIsMobileMenuOpen(false); }} badge={promoCodes.filter(p => !p.claimed).length} badgeVariant="primary" />
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

  const handleAccountStatusUpdate = async () => {
    if (!selectedAccountId || !pendingAccountStatus) return;
    setIsSavingStatus(true);
    try {
      await updateAccountPostStatus(selectedAccountId, pendingAccountStatus, pendingAccountStatus === 'sold' ? assignBuyerId : undefined);
      setSelectedAccountId(null);
      toast({ title: "Listing Updated" });
    } finally {
      setIsSavingStatus(false);
    }
  };

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 flex overflow-hidden">
      <aside className={cn("hidden md:flex h-full bg-white dark:bg-slate-900 border-r dark:border-white/5 flex-col transition-all duration-300 z-40 shadow-sm", isSidebarExpanded ? "w-64" : "w-20")}>
        <SidebarContent />
      </aside>

      {/* Right-Side Collapsible Menu Sheet for Mobile */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="right" className="p-0 w-72 bg-white dark:bg-slate-900 border-l dark:border-white/10 [&>button]:hidden z-50 flex flex-col">
          <SheetHeader className="px-5 py-4 border-b dark:border-white/5 flex flex-row items-center justify-between shrink-0">
            <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                O
              </div>
              <div className="text-left">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-tight">Oskar Control</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Admin Panel</p>
              </div>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
              <X size={18} />
            </button>
          </SheetHeader>

          {/* Prominent Back to store button */}
          <div className="p-3 border-b dark:border-white/5 bg-slate-50/60 dark:bg-slate-800/40">
            <Button 
              variant="outline" 
              onClick={() => { setGlobalLoading(true); router.push('/'); }}
              className="w-full justify-start gap-2.5 font-bold text-xs uppercase tracking-wider text-primary border-primary/20 hover:bg-primary/10 rounded-xl h-11 shadow-xs"
            >
              <Home size={16} /> Back to Store
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <SidebarContent isMobile={true} />
          </div>
        </SheetContent>
      </Sheet>

      <div ref={adminScrollRef} className="admin-scroll-container flex-1 flex flex-col w-full relative overflow-y-auto scrollbar-hide h-screen pb-20 md:pb-0">
        <header className="sticky top-0 h-16 md:h-20 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/70 dark:border-white/5 flex items-center justify-between px-4 sm:px-10 shrink-0 z-30 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
             {/* Back navigation button if in any sub-view or non-root settings */}
             {(selectedOrderId || selectedAccountId || selectedEventId || isEditingEvent || (activeView === 'settings' && mobileSettingsSubView !== 'menu')) && (
               <button
                 onClick={() => {
                   if (selectedOrderId) setSelectedOrderId(null);
                   else if (selectedAccountId) setSelectedAccountId(null);
                   else if (selectedEventId) setSelectedEventId(null);
                   else if (isEditingEvent) { setIsEditingEvent(false); setEditingEvent(null); }
                   else if (activeView === 'settings' && mobileSettingsSubView !== 'menu') {
                     handleMobileSettingsBack();
                   }
                 }}
                 className="p-2 -ml-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
                 title="Go Back"
               >
                 <ArrowLeft size={20} />
               </button>
             )}

             <div className={cn(
               "transition-all duration-300 min-w-0",
               isSearchExpanded ? "w-0 opacity-0 overflow-hidden pointer-events-none md:w-auto md:opacity-100 md:pointer-events-auto" : "w-auto opacity-100"
             )}>
               <h2 className="text-base sm:text-xl font-headline font-bold uppercase tracking-tight text-slate-900 dark:text-white truncate">
                 {selectedOrderId ? "Order Details" :
                  selectedAccountId ? "Listing Hub" :
                  selectedEventId ? "Auction Manager" :
                  isEditingEvent ? "Event Editor" :
                  activeView === 'settings' && mobileSettingsSubView === 'general' ? "General Settings" :
                  activeView === 'dashboard' ? "Overview" :
                  activeView.toUpperCase().replace('-', ' ')}
               </h2>
             </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
             {/* Breathing Search in Header */}
             <div ref={searchContainerRef} className="flex items-center">
               <div className={cn(
                 "flex items-center transition-all duration-300 ease-in-out overflow-hidden",
                 isSearchExpanded ? "w-44 sm:w-64 md:w-80 opacity-100 mr-2" : "w-0 opacity-0 pointer-events-none"
               )}>
                 <div className="relative w-full">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                   <input
                     ref={searchInputRef}
                     type="text"
                     placeholder={
                       activeView === 'orders' ? "Search orders..." :
                       activeView === 'users' ? "Search users..." :
                       activeView === 'inventory' ? "Search products..." :
                       activeView === 'account-posts' ? "Search listings..." :
                       activeView === 'account-events' ? "Search events..." : "Search..."
                     }
                     value={adminSearchQuery}
                     onChange={(e) => setAdminSearchQuery(e.target.value)}
                     className="w-full h-9 sm:h-10 pl-9 pr-8 rounded-full bg-slate-100 dark:bg-slate-800 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400"
                   />
                   <button 
                     onClick={() => {
                       if (adminSearchQuery) {
                         setAdminSearchQuery("");
                       } else {
                         setIsSearchExpanded(false);
                       }
                     }}
                     className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                   >
                     <X size={14} />
                   </button>
                 </div>
               </div>

               {!isSearchExpanded && (
                 <button
                   onClick={() => {
                     setIsSearchExpanded(true);
                     setTimeout(() => searchInputRef.current?.focus(), 150);
                   }}
                   className="p-2.5 rounded-full bg-slate-100/80 dark:bg-slate-800 text-slate-500 hover:text-primary transition-all active:scale-90"
                   title="Search"
                 >
                   <Search size={18} className="sm:size-5" />
                 </button>
               )}
             </div>

             <div className="hidden sm:flex items-center gap-2 bg-green-50 dark:bg-green-500/10 px-4 py-1.5 rounded-full text-green-600 font-bold text-[10px] uppercase tracking-widest border border-green-100 dark:border-green-500/20">
                <RefreshCw size={12} className="animate-spin" /> Live
             </div>

             <Popover>
               <PopoverTrigger asChild>
                  <button className="relative p-2.5 bg-slate-100/80 dark:bg-slate-800 rounded-full text-slate-500 hover:text-primary transition-all active:scale-90">
                     <Bell size={18} className="sm:size-5" />
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
                           <p className="text-[8px] font-black uppercase text-slate-300 mt-2">{safeFormatDistanceToNow(n.createdAt, { addSuffix: true })}</p>
                        </div>
                      ))
                    )}
                  </div>
               </PopoverContent>
             </Popover>

             <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l dark:border-white/5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative border-2 border-white dark:border-slate-700 shadow-sm shrink-0">
                   {user.photoURL ? <Image src={user.photoURL} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={18} /></div>}
                </div>
             </div>
          </div>
        </header>

        {/* Global Warning Banner for Scheduled Transitions */}
        {scheduleAlert && !isScheduleBannerDismissed && (
          <div className={cn(
            "p-3 px-6 flex items-center justify-between animate-in slide-in-from-top-full duration-500 z-50",
            scheduleAlert.type === 'close' ? "bg-amber-600 text-white" : "bg-green-600 text-white"
          )}>
            <div className="flex items-center gap-3">
              <AlertTriangle className={cn("shrink-0", scheduleAlert.type === 'close' && "animate-pulse")} />
              <p className="text-sm font-bold uppercase tracking-tight">{scheduleAlert.text}</p>
            </div>
            <button onClick={() => setIsScheduleBannerDismissed(true)} className="p-1 hover:bg-black/10 rounded-full"><X size={18} /></button>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-10 space-y-10 bg-slate-50 dark:bg-slate-950">
          {activeView === 'dashboard' && !selectedOrderId && !selectedAccountId && !selectedEventId && (
            <div className="max-w-4xl mx-auto w-full flex flex-col gap-5 sm:gap-6 animate-in fade-in duration-500">
               {/* REVENUE HERO CARD */}
               <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#6a1edb] to-[#004ac6] text-white shadow-xl shadow-indigo-950/15">
                  <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-[#cde6f4]/20 rounded-full blur-xl pointer-events-none" />
                  <div className="relative z-10 flex flex-col gap-2">
                     <div className="flex justify-between items-center text-white/80">
                        <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">TOTAL REVENUE</span>
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                           <Wallet className="w-4 h-4 text-white" />
                        </div>
                     </div>
                     <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mt-1">
                        ${dashboardReports.totalRev.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                     </h2>
                     <div className="flex items-center gap-1.5 mt-2 bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                        <TrendingUp className="w-3.5 h-3.5 text-[#A7F3D0]" />
                        <span className="text-xs font-semibold text-white">{dashboardReports.weekTrendPct}</span>
                     </div>
                  </div>
               </div>

               {/* STATS GRID (2 COLUMNS) */}
               <div className="grid grid-cols-2 gap-3.5 sm:gap-5">
                  {/* Pending Orders */}
                  <div 
                     onClick={() => { setActiveTab('orders'); setSelectedOrderId(null); }}
                     className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 dark:border-white/5 flex flex-col gap-3 relative overflow-hidden group hover:shadow-md transition-all cursor-pointer"
                  >
                     <div className="absolute right-0 top-0 w-16 h-16 bg-gradient-to-bl from-[#8343f4]/20 to-transparent rounded-bl-full transition-transform group-hover:scale-110 pointer-events-none" />
                     <div className="w-10 h-10 rounded-full bg-[#8343f4]/15 dark:bg-[#8343f4]/25 flex items-center justify-center text-[#6a1edb] dark:text-[#c4b5fd]">
                        <ClipboardList className="w-5 h-5" />
                     </div>
                     <div>
                        <h3 className="text-2xl sm:text-3xl font-bold text-[#111c2d] dark:text-white leading-tight">
                           {dashboardReports.pendingOrdersCount}
                        </h3>
                        <p className="text-xs sm:text-sm text-[#434655] dark:text-slate-400 font-medium mt-0.5">
                           Pending Orders
                        </p>
                     </div>
                  </div>

                  {/* Total Users */}
                  <div 
                     onClick={() => { setActiveTab('users'); }}
                     className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 dark:border-white/5 flex flex-col gap-3 relative overflow-hidden group hover:shadow-md transition-all cursor-pointer"
                  >
                     <div className="absolute right-0 top-0 w-16 h-16 bg-gradient-to-bl from-[#0284c7]/20 to-transparent rounded-bl-full transition-transform group-hover:scale-110 pointer-events-none" />
                     <div className="w-10 h-10 rounded-full bg-[#cde6f4] dark:bg-sky-500/20 flex items-center justify-center text-[#0284c7] dark:text-sky-400">
                        <Users className="w-5 h-5" />
                     </div>
                     <div>
                        <h3 className="text-2xl sm:text-3xl font-bold text-[#111c2d] dark:text-white leading-tight">
                           {dashboardReports.formattedUserCount}
                        </h3>
                        <p className="text-xs sm:text-sm text-[#434655] dark:text-slate-400 font-medium mt-0.5">
                           Total Users
                        </p>
                     </div>
                  </div>
               </div>

               {/* WEEKLY ACTIVITY CHART */}
               <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 dark:border-white/5 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                     <h3 className="text-base sm:text-lg font-bold text-[#111c2d] dark:text-white">Weekly Activity</h3>
                     <Popover>
                        <PopoverTrigger asChild>
                           <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f0f3ff] dark:bg-slate-800 hover:bg-[#dee8ff] dark:hover:bg-slate-700 transition-colors text-[#434655] dark:text-slate-300">
                              <MoreVertical className="w-4 h-4" />
                           </button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-44 p-2 rounded-xl border border-slate-100 dark:border-white/5 shadow-xl bg-white dark:bg-slate-900">
                           <button 
                              onClick={() => { setActiveTab('orders'); setSelectedOrderId(null); }}
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                           >
                              View Orders
                           </button>
                           <button 
                              onClick={() => { setActiveTab('users'); }}
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                           >
                              Manage Users
                           </button>
                        </PopoverContent>
                     </Popover>
                  </div>
                  <div className="h-48 w-full flex items-end justify-between gap-2 pt-4">
                     {dashboardReports.weeklyActivity.map((d, index) => (
                        <div key={index} className="w-full flex flex-col items-center gap-2 group h-full justify-end relative">
                           <div 
                              className="w-full bg-[#6a1edb]/20 dark:bg-[#6a1edb]/30 rounded-t-lg relative transition-all group-hover:bg-[#6a1edb]/35"
                              style={{ height: `${d.baseHeight}%` }}
                           >
                              <div 
                                 className="absolute inset-x-0 bottom-0 bg-[#6a1edb] dark:bg-[#8343f4] rounded-t-lg transition-all group-hover:brightness-110"
                                 style={{ height: `${d.fillHeight}%` }}
                              />
                           </div>
                           <span className={cn(
                              "text-xs font-medium",
                              d.isToday ? "text-[#6a1edb] dark:text-[#a78bfa] font-bold" : "text-[#737686] dark:text-slate-400"
                           )}>
                              {d.day}
                           </span>
                           
                           {/* Tooltip on hover */}
                           <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white dark:bg-slate-800 text-[10px] py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-lg z-20">
                              <p className="font-semibold">{d.dateFormatted}</p>
                              <p className="text-slate-300">{d.orderCount} orders</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* RECENT UPDATES */}
               <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 flex flex-col overflow-hidden">
                  <div className="p-5 pb-3 flex justify-between items-center">
                     <h3 className="text-base sm:text-lg font-bold text-[#111c2d] dark:text-white">Recent Updates</h3>
                     <button 
                        onClick={() => { setActiveTab('orders'); setSelectedOrderId(null); }}
                        className="text-xs sm:text-sm font-semibold text-[#6a1edb] dark:text-[#a78bfa] hover:underline transition-colors"
                     >
                        View All
                     </button>
                  </div>
                  <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/5">
                     {dashboardReports.updates.map((item) => (
                        <div 
                           key={item.id} 
                           onClick={() => {
                              if (item.type === 'order') {
                                 const realId = item.id.replace('ord-', '');
                                 setSelectedOrderId(realId);
                                 setActiveTab('orders');
                              } else if (item.type === 'user') {
                                 setActiveTab('users');
                              }
                           }}
                           className="flex items-center gap-3.5 p-4 hover:bg-[#f0f3ff]/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                        >
                           <div className="relative shrink-0">
                              <div className="w-10 h-10 rounded-full bg-[#d8e3fb] dark:bg-slate-800 flex items-center justify-center text-[#434655] dark:text-slate-300">
                                 {item.iconType === 'user' ? (
                                    <UserPlus className="w-4 h-4" />
                                 ) : item.iconType === 'shipping' ? (
                                    <Truck className="w-4 h-4" />
                                 ) : (
                                    <SettingsIcon className="w-4 h-4" />
                                 )}
                              </div>
                              <div className={cn(
                                 "absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900",
                                 item.badgeColor,
                                 item.pulse && "shadow-[0_0_8px_rgba(106,30,219,0.6)] animate-pulse"
                              )} />
                           </div>
                           <div className="flex-1 min-w-0">
                              <h4 className="text-xs sm:text-sm font-semibold text-[#111c2d] dark:text-white truncate">
                                 {item.title}
                              </h4>
                              <p className="text-xs text-[#737686] dark:text-slate-400 truncate mt-0.5">
                                 {item.subtitle}
                              </p>
                           </div>
                           <span className="text-xs font-medium text-[#737686] dark:text-slate-400 whitespace-nowrap shrink-0">
                              {safeFormatDistanceToNow(item.time, { addSuffix: true })}
                           </span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          )}

          {activeView === 'leaderboard' && (
            <div className="space-y-8 md:space-y-12 leaderboard-view animate-in fade-in duration-700">
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
            <div className="space-y-12 account-events-view animate-in fade-in duration-700">
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
                        onDelete={() => { setDeleteTarget({id: event.id, type:'eventAccount'}); setIsDeleteDialogOpen(true); }}
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
            <div className="space-y-6 orders-view animate-in slide-in-from-bottom-4 duration-500">
               {selectedOrderId ? (
                 <OrderDetailView 
                   order={selectedOrder} 
                   allUsers={allUsers}
                   onBack={() => setSelectedOrderId(null)} 
                   onUpdate={handleStatusUpdate}
                   onManualSuccess={handleManualSuccess}
                   onManualSync={handleManualSync}
                   onRetryTopup={handleRetryTopup}
                   status={pendingOrderStatus}
                   setStatus={setPendingStatus}
                   reason={cancellationReason}
                   setReason={setCancellationReason}
                   isSaving={isSavingStatus}
                   onDelete={() => { setDeleteTarget({id: selectedOrderId, type:'order'}); setIsDeleteDialogOpen(true); }}
                 />
               ) : (
                  <div className="space-y-6">
                    {/* Status Tabs */}
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                       <button 
                         onClick={() => setOrderStatusFilter('all')}
                         className={cn(
                           "px-4 py-2 rounded-full font-medium text-xs sm:text-sm whitespace-nowrap transition-all active:scale-95",
                           orderStatusFilter === 'all'
                             ? "bg-primary text-white shadow-md shadow-primary/20"
                             : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800"
                         )}
                       >
                         All Orders ({topUpOrders.length})
                       </button>
                       <button 
                         onClick={() => setOrderStatusFilter('pending')}
                         className={cn(
                           "px-4 py-2 rounded-full font-medium text-xs sm:text-sm whitespace-nowrap transition-all active:scale-95",
                           orderStatusFilter === 'pending'
                             ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                             : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800"
                         )}
                       >
                         Pending ({topUpOrders.filter(o => o.status === 'pending').length})
                       </button>
                       <button 
                         onClick={() => setOrderStatusFilter('processing')}
                         className={cn(
                           "px-4 py-2 rounded-full font-medium text-xs sm:text-sm whitespace-nowrap transition-all active:scale-95",
                           orderStatusFilter === 'processing'
                             ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                             : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800"
                         )}
                       >
                         Processing ({topUpOrders.filter(o => o.status === 'processing').length})
                       </button>
                       <button 
                         onClick={() => setOrderStatusFilter('successful')}
                         className={cn(
                           "px-4 py-2 rounded-full font-medium text-xs sm:text-sm whitespace-nowrap transition-all active:scale-95",
                           orderStatusFilter === 'successful'
                             ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                             : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800"
                         )}
                       >
                         Completed ({topUpOrders.filter(o => o.status === 'successful').length})
                       </button>
                       <button 
                         onClick={() => setOrderStatusFilter('cancelled')}
                         className={cn(
                           "px-4 py-2 rounded-full font-medium text-xs sm:text-sm whitespace-nowrap transition-all active:scale-95",
                           orderStatusFilter === 'cancelled'
                             ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                             : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800"
                         )}
                       >
                         Failed ({topUpOrders.filter(o => o.status === 'cancelled').length})
                       </button>
                    </div>

                    {/* Mobile Orders List */}
                    <div className="flex flex-col gap-3.5 md:hidden">
                       {filteredOrders.length === 0 ? (
                         <div className="py-20 text-center opacity-30 italic text-xs font-bold uppercase border-2 border-dashed rounded-3xl">
                           No orders found.
                         </div>
                       ) : (
                         filteredOrders.map(order => {
                           const item = order.items?.[0];
                           const isEventWinnerOrder = !!order.gameDetails?.isEventWinner;
                           const itemTitle = isEventWinnerOrder ? 'Guuleystaha' : (item?.title || "Top-up");
                           const customerName = order.gameDetails?.isEventWinner ? order.gameDetails?.eventTitle : (order.gameDetails?.playerName || order.gameDetails?.name || "Guest");
                           
                           const isPending = order.status === 'pending';
                           const isProcessing = order.status === 'processing';
                           const isSuccess = order.status === 'successful';

                           const leftBarClass = isPending
                             ? "bg-gradient-to-b from-amber-400 to-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                             : isProcessing
                             ? "bg-gradient-to-b from-blue-500 to-indigo-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                             : isSuccess
                             ? "bg-gradient-to-b from-[#10B981] to-[#34D399]"
                             : "bg-gradient-to-b from-rose-500 to-red-600";

                           return (
                             <div 
                               key={order.id}
                               className="relative p-4 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border border-slate-200/70 dark:border-white/10 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group"
                             >
                                {/* Left Accent Bar */}
                                <div className={cn("absolute top-0 left-0 w-1 h-full", leftBarClass)} />

                                {/* Card Header */}
                                <div className="flex justify-between items-start mb-2.5 pl-1">
                                   <div>
                                      <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900 dark:text-white">
                                         <span>#{order.id.toUpperCase().slice(-9)}</span>
                                         <button 
                                           onClick={() => {
                                             navigator.clipboard.writeText(order.id);
                                             toast({ title: "Order ID Copied!", description: `#${order.id} is in clipboard.` });
                                           }}
                                           className="text-slate-400 hover:text-primary transition-colors p-0.5"
                                           title="Copy Order ID"
                                         >
                                           <Copy size={13} />
                                         </button>
                                      </div>
                                      <p className="text-[11px] text-slate-400 mt-0.5">
                                        {safeFormatDistanceToNow(order.createdAt, { addSuffix: true })}
                                      </p>
                                   </div>

                                   {/* Status Badge */}
                                   {isPending ? (
                                     <div className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center gap-1.5 border border-amber-200/40">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                        Pending
                                     </div>
                                   ) : isProcessing ? (
                                     <div className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center gap-1.5 animate-pulse border border-blue-200/40">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                        Processing
                                     </div>
                                   ) : isSuccess ? (
                                     <div className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 border border-emerald-200/40">
                                        <CheckCircle2 size={13} />
                                        Successfully
                                     </div>
                                   ) : (
                                     <div className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5 border border-rose-200/40">
                                        <XCircle size={13} />
                                        Cancelled
                                     </div>
                                   )}
                                </div>

                                {/* Item Preview Box */}
                                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 mb-2.5 pl-3">
                                   <div className="flex items-center gap-3 min-w-0">
                                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#6a1edb] to-primary p-[1px] shrink-0">
                                         <div className="w-full h-full rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                                            {item?.thumbnail ? (
                                              <Image src={item.thumbnail} alt="" width={40} height={40} className="object-cover" />
                                            ) : (
                                              <span className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#6a1edb] to-primary">
                                                {itemTitle.slice(0, 2).toUpperCase()}
                                              </span>
                                            )}
                                         </div>
                                      </div>
                                      <div className="min-w-0">
                                         <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Item</p>
                                         <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">{itemTitle}</p>
                                         {customerName && <p className="text-[10px] text-slate-400 truncate">{customerName}</p>}
                                      </div>
                                   </div>
                                   <div className="text-right shrink-0">
                                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Price</p>
                                      <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">${order.total}</p>
                                   </div>
                                </div>

                                {/* Footer: Handling Admin & Actions */}
                                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-white/5 pl-1">
                                   <div className="flex items-center gap-2 min-w-0">
                                      {order.processedBy?.photoURL ? (
                                        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white dark:border-slate-700 shrink-0">
                                          <Image src={order.processedBy.photoURL} alt="" fill className="object-cover" />
                                        </div>
                                      ) : (order.approvedBy === 'auto_sms' || order.smsMatchedId) ? (
                                        <div className="relative w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                                          <MessageCircle size={16} />
                                          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
                                             <Zap size={10} className="text-[#6a1edb] fill-[#6a1edb]" />
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                                          <User size={16} />
                                        </div>
                                      )}
                                      <div className="min-w-0">
                                         <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Handling Admin</p>
                                         <div className="flex items-center gap-1">
                                            <p className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
                                              {order.processedBy?.name || ((order.approvedBy === 'auto_sms' || order.smsMatchedId) ? 'Auto SMS' : 'Unassigned')}
                                            </p>
                                            {order.processedBy?.name && <VerifiedBadge />}
                                            {(order.approvedBy === 'auto_sms' || order.smsMatchedId) && (
                                              <Zap size={12} className="text-primary fill-primary shrink-0" />
                                            )}
                                         </div>
                                      </div>
                                   </div>

                                   <div className="flex items-center gap-2 shrink-0">
                                      <button 
                                        onClick={() => { setDeleteTarget({ id: order.id, type: 'order' }); setIsDeleteDialogOpen(true); }}
                                        className="p-2 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                        title="Delete Order"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                      <button 
                                        onClick={() => { setSelectedOrderId(order.id); setPendingStatus(order.status); setCancellationReason(order.cancellationReason || ""); }}
                                        className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium text-xs shadow-sm transition-all active:scale-95"
                                      >
                                        <span>View</span>
                                        <ChevronRight size={14} />
                                      </button>
                                   </div>
                                </div>
                             </div>
                           );
                         })
                       )}
                    </div>

                    {/* Desktop Orders View (Table) */}
                    <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
                       <div className="overflow-x-auto">
                          <Table>
                             <TableHeader className="bg-slate-50/50 dark:bg-slate-800/30">
                                <TableRow className="border-none h-14">
                                   <TableHead className="px-6 font-bold text-xs uppercase tracking-wider text-slate-400">Order Ref</TableHead>
                                   <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-400">Item & Customer</TableHead>
                                   <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-400">Total Price</TableHead>
                                   <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-400">Handling Admin</TableHead>
                                   <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-400">Status</TableHead>
                                   <TableHead className="text-right px-6 font-bold text-xs uppercase tracking-wider text-slate-400">Actions</TableHead>
                                </TableRow>
                             </TableHeader>
                             <TableBody>
                                {filteredOrders.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-slate-300 italic uppercase font-bold text-xs">
                                      No orders found.
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  filteredOrders.map(order => {
                                    const item = order.items?.[0];
                                    const isEventWinnerOrder = !!order.gameDetails?.isEventWinner;
                                    const itemTitle = isEventWinnerOrder ? 'Guuleystaha' : (item?.title || "Top-up");
                                    const customerName = order.gameDetails?.isEventWinner ? order.gameDetails?.eventTitle : (order.gameDetails?.playerName || order.gameDetails?.name || "Guest");
                                    
                                    const isPending = order.status === 'pending';
                                    const isProcessing = order.status === 'processing';
                                    const isSuccess = order.status === 'successful';

                                    return (
                                      <TableRow key={order.id} className="border-slate-100 dark:border-white/5 h-20 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                         <TableCell className="px-6 font-bold text-xs">
                                            <div className="flex items-center gap-1.5 text-slate-900 dark:text-white">
                                               <span>#{order.id.toUpperCase().slice(-8)}</span>
                                               <button 
                                                 onClick={() => {
                                                   navigator.clipboard.writeText(order.id);
                                                   toast({ title: "Order ID Copied!" });
                                                 }}
                                                 className="text-slate-400 hover:text-primary transition-colors p-1"
                                                 title="Copy ID"
                                               >
                                                 <Copy size={13} />
                                               </button>
                                            </div>
                                            <span className="text-[10px] text-slate-400">
                                              {safeFormatDistanceToNow(order.createdAt, { addSuffix: true })}
                                            </span>
                                         </TableCell>
                                         <TableCell>
                                            <div className="flex items-center gap-3">
                                               <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#6a1edb] to-primary p-[1px] shrink-0">
                                                  <div className="w-full h-full rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                                                     {item?.thumbnail ? (
                                                       <Image src={item.thumbnail} alt="" width={36} height={36} className="object-cover" />
                                                     ) : (
                                                       <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#6a1edb] to-primary">
                                                         {itemTitle.slice(0, 2).toUpperCase()}
                                                       </span>
                                                     )}
                                                  </div>
                                               </div>
                                               <div className="min-w-0">
                                                  <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">{itemTitle}</p>
                                                  <p className="text-[11px] text-slate-400 truncate">{customerName}</p>
                                               </div>
                                            </div>
                                         </TableCell>
                                         <TableCell>
                                            <span className="font-bold text-sm text-slate-900 dark:text-white">${order.total}</span>
                                         </TableCell>
                                         <TableCell>
                                            <div className="flex items-center gap-2">
                                               {order.processedBy?.photoURL ? (
                                                 <div className="w-7 h-7 rounded-full overflow-hidden border border-white dark:border-slate-700 shrink-0 relative">
                                                    <Image src={order.processedBy.photoURL} alt="" fill className="object-cover" />
                                                 </div>
                                               ) : (order.approvedBy === 'auto_sms' || order.smsMatchedId) ? (
                                                 <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                                    <Smartphone size={13} />
                                                 </div>
                                               ) : (
                                                 <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                                                    <User size={13} />
                                                 </div>
                                               )}
                                               <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                                                 {order.processedBy?.name || ((order.approvedBy === 'auto_sms' || order.smsMatchedId) ? 'Auto SMS' : 'Unassigned')}
                                               </span>
                                            </div>
                                         </TableCell>
                                         <TableCell>
                                            {isPending ? (
                                              <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-xs font-semibold inline-flex items-center gap-1.5 border border-amber-200/40">
                                                 <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                 Pending
                                              </span>
                                            ) : isProcessing ? (
                                              <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold inline-flex items-center gap-1.5 border border-blue-200/40">
                                                 <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                                                 Processing
                                              </span>
                                            ) : isSuccess ? (
                                              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold inline-flex items-center gap-1.5 border border-emerald-200/40">
                                                 <CheckCircle2 size={13} />
                                                 Completed
                                              </span>
                                            ) : (
                                              <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold inline-flex items-center gap-1.5 border border-rose-200/40">
                                                 <XCircle size={13} />
                                                 Cancelled
                                              </span>
                                            )}
                                         </TableCell>
                                         <TableCell className="text-right px-6">
                                            <div className="flex justify-end items-center gap-2">
                                               <button 
                                                 onClick={() => { setSelectedOrderId(order.id); setPendingStatus(order.status); setCancellationReason(order.cancellationReason || ""); }}
                                                 className="px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium text-xs shadow-sm transition-all active:scale-95"
                                               >
                                                 View
                                               </button>
                                               <button 
                                                  onClick={() => { setDeleteTarget({ id: order.id, type: 'order' }); setIsDeleteDialogOpen(true); }}
                                                  className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                                  title="Delete"
                                                >
                                                  <Trash2 size={16} />
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
                     </div>
                  </div>
               )}
            </div>
          )}

          {activeView === 'account-posts' && (
            <div className="space-y-8 account-posts-view animate-in slide-in-from-bottom-4 duration-500">
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
                   enforceAccountAction={enforceAction}
                   suspendSeller={suspendSeller}
                   dismissAccountWarning={dismissAccountWarning}
                 />
               ) : (
                 <div className="space-y-10">
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                       {filteredAccountPosts.length === 0 ? (
                         <div className="py-20 text-center opacity-30 italic text-xs font-bold uppercase">No account listings found.</div>
                       ) : (
                         filteredAccountPosts.map(p => {
                           const claimantsList = Object.values(p.claimants || {});
                           return (
                             <Card 
                               key={p.id} 
                               className={cn(
                                 "p-5 rounded-[2rem] border-none shadow-lg bg-white dark:bg-slate-900 space-y-5 transition-all",
                                 claimantsList.length > 0 && "ring-2 ring-red-500 bg-red-50/10"
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
                                      <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Claims</p>
                                      <Badge className={cn("border-none text-[8px] font-black px-3", claimantsList.length > 0 ? "bg-red-500 text-white" : "bg-slate-100 text-slate-400")}>{claimantsList.length} Active</Badge>
                                   </div>
                                   <div className="space-y-1">
                                      <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Wait Time</p>
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
                                        className="w-10 h-10 text-red-500 bg-red-50 dark:bg-red-950/20 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
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
                             {filteredAccountPosts.length === 0 ? (
                               <TableRow><TableCell colSpan={8} className="h-64 text-center text-slate-300 italic uppercase font-bold text-xs">No account listings found.</TableCell></TableRow>
                             ) : (
                               filteredAccountPosts.map(p => {
                                 const claimantsList = Object.values(p.claimants || {});
                                 const earliestClaim = claimantsList.length > 0 ? Math.min(...claimantsList.map((c: any) => {
                                   const t = Number(c.timestamp);
                                   return isNaN(t) ? Infinity : t;
                                 })) : null;
                                 const isOverdue = earliestClaim && earliestClaim !== Infinity && (Date.now() - earliestClaim) >= 3600000 && !p.sellerReported && !p.sold && !p.warningDismissedAt;

                                 return (
                                 <TableRow 
                                    key={p.id} 
                                    className={cn(
                                      "border-slate-50 dark:border-white/5 h-24 transition-colors",
                                      claimantsList.length > 0 ? "bg-red-50/50 dark:bg-red-500/5" : "hover:bg-slate-50/50"
                                    )}
                                 >
                                    <TableCell className="px-6 lg:px-10">
                                       <div className="flex items-center gap-1 min-w-0">
                                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative shrink-0 shadow-sm border border-white dark:border-white/10">
                                             {p.authorAvatar ? <Image src={p.authorAvatar} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><User size={16}/></div>}
                                          </div>
                                          <div className="flex items-center gap-1 min-w-0">
                                            <span className="truncate font-semibold text-sm text-slate-900 dark:text-white max-w-[120px]">{p.authorName || "Market User"}</span>
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
                                            claimantsList.length > 0 ? "bg-red-500 text-white" : "bg-slate-100 text-slate-400"
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
            <div className="space-y-12 inventory-view animate-in fade-in duration-700">
               <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                  <Button 
                    onClick={() => handleOpenGameDialog()} 
                    className="rounded-2xl h-16 px-10 gap-3 font-black shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90 text-white uppercase tracking-widest active:scale-95 transition-all w-full sm:auto"
                  >
                    <PlusCircle size={20} /> New Game
                  </Button>
               </div>

               <div className="grid grid-cols-1 gap-6 max-w-4xl">
                  {filteredGames.length === 0 ? (
                    <div className="py-20 text-center opacity-30 italic text-xs font-bold uppercase border-2 border-dashed rounded-3xl">
                      No games or packages found.
                    </div>
                  ) : (
                    filteredGames.map(g => {
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
                                    {g.active === false && <Badge className="bg-red-500 text-white border-none text-[7px] uppercase font-black px-1.5 h-4">Hidden</Badge>}
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
                  }))}
               </div>
            </div>
          )}

          {activeView === 'events' && (
            <div className="space-y-12 events-view animate-in fade-in duration-700">
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
                                   <SelectTrigger className="h-14 md:h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-8 font-bold shadow-inner"><SelectValue /></SelectTrigger>
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
                             <Button type="submit" disabled={isUploading} className="w-full h-14 md:h-20 rounded-3xl font-black text-lg md:text-xl shadow-2xl uppercase tracking-widest bg-primary text-white active:scale-95 transition-all">
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
                           className="rounded-2xl h-14 md:h-16 px-8 gap-3 font-bold border-2 text-xs md:sm uppercase tracking-widest active:scale-95 w-full sm:w-auto"
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
                                 <button onClick={() => { setEditingEvent(e); setEventForm({ ...e, redirectRoute: e.redirectRoute || "", buttonText: e.buttonText || "", duration: "", durationUnit: "days" }); setIsEditingEvent(true); }} className="w-8 h-8 rounded-lg bg-blue-50/90 text-white flex items-center justify-center backdrop-blur-sm shadow-lg hover:scale-110 transition-transform">
                                    <Edit size={14} />
                                 </button>
                                 <button onClick={() => { setDeleteTarget({id:e.id, type:'event'}); setIsDeleteDialogOpen(true); }} className="w-8 h-8 rounded-lg bg-red-50/90 text-white flex items-center justify-center backdrop-blur-sm shadow-lg hover:scale-110 transition-transform">
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
            <div className="space-y-6 promo-codes-view animate-in fade-in duration-500">
               {/* Header Action Bar */}
               <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Promotions
                    </h2>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      Create and manage discount codes and voucher campaigns
                    </p>
                  </div>
                  <Button 
                    onClick={() => setIsPromoDialogOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-white rounded-full px-5 py-2.5 font-medium text-xs md:text-sm flex items-center gap-1.5 shadow-sm transition-all active:scale-95 shrink-0"
                  >
                    <Plus size={18} />
                    <span>Add Code</span>
                  </Button>
               </div>

               {/* Cards Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
                  {promoCodes.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                      <div className="w-20 h-20 mb-4 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <Ticket size={36} />
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-1">No Promos Yet</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xs">
                        Create your first discount code to boost sales and reward users.
                      </p>
                      <Button 
                        onClick={() => setIsPromoDialogOpen(true)}
                        className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-full font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"
                      >
                        <Plus size={18} /> Create Promo
                      </Button>
                    </div>
                  ) : (
                    promoCodes.map(promo => {
                      const expiryTime = Number(promo.expiresAt) || 0;
                      const isExpired = expiryTime ? expiryTime < Date.now() : false;
                      const isMulti = promo.type === 'multi_use';
                      const usageCount = isMulti ? Object.keys(promo.usedByUsers || {}).length : (promo.claimed ? 1 : 0);
                      const isClaimed = promo.claimed && !isMulti;
                      
                      // Status & Badge configuration
                      let statusText = 'Active';
                      let barColor = 'bg-[#6a1edb] dark:bg-[#8b5cf6]';
                      let badgeClasses = 'bg-purple-50 dark:bg-purple-950/40 text-[#6a1edb] dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/30';
                      let dotColor = 'bg-[#6a1edb] dark:bg-[#8b5cf6]';

                      if (isExpired) {
                        statusText = 'Expired';
                        barColor = 'bg-slate-400 dark:bg-slate-600';
                        badgeClasses = 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/30';
                        dotColor = 'bg-slate-400 dark:bg-slate-500';
                      } else if (isClaimed) {
                        statusText = 'Claimed';
                        barColor = 'bg-teal-500 dark:bg-teal-400';
                        badgeClasses = 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/50 dark:border-teal-800/30';
                        dotColor = 'bg-teal-500 dark:bg-teal-400';
                      }

                      // Find claimant name if single use & claimed
                      const claimant = isClaimed ? allUsers.find(u => u.uid === promo.usedBy) : null;
                      const claimantName = claimant?.name || (promo.usedBy ? `user_${promo.usedBy.slice(0, 6)}` : null);

                      return (
                        <div 
                          key={promo.id || promo.code} 
                          className={cn(
                            "bg-white dark:bg-slate-900 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 border border-slate-100 dark:border-slate-800",
                            isExpired && "opacity-75"
                          )}
                        >
                          {/* Left Accent Stripe */}
                          <div className={cn("absolute top-0 left-0 w-1.5 h-full", barColor)} />

                          {/* Top Section */}
                          <div className="flex justify-between items-start gap-2 pl-1">
                            <div className="flex flex-col gap-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-lg md:text-xl font-bold font-mono uppercase tracking-wide truncate",
                                  isExpired ? "text-slate-500 dark:text-slate-400" : "text-slate-900 dark:text-white"
                                )}>
                                  {promo.code}
                                </span>
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(promo.code);
                                    toast({ title: "Code Copied!", description: `${promo.code} is now in your clipboard.` });
                                  }}
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0"
                                  title="Copy Code"
                                >
                                  <Copy size={14} />
                                </button>
                              </div>
                              <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
                                {promo.discount}% Off {promo.note ? `• ${promo.note}` : (isMulti ? '• Multi-use' : '• One-time')}
                              </p>
                            </div>

                            {/* Status Badge */}
                            <div className={cn("px-3 py-1 rounded-full flex items-center gap-1.5 shrink-0", badgeClasses)}>
                              <div className={cn("w-1.5 h-1.5 rounded-full", dotColor)} />
                              <span className="text-xs font-semibold">{statusText}</span>
                            </div>
                          </div>

                          {/* Bottom Section */}
                          <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 dark:border-slate-800/80 pl-1">
                            {/* Left usage info */}
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium min-w-0">
                              {isMulti ? (
                                <>
                                  <Users size={16} className="shrink-0 text-slate-400" />
                                  <span className="truncate">Used by {usageCount.toLocaleString()} {usageCount === 1 ? 'user' : 'users'}</span>
                                </>
                              ) : isClaimed ? (
                                <>
                                  <User size={16} className="shrink-0 text-teal-500" />
                                  <span className="truncate">Claimed by {claimantName}</span>
                                </>
                              ) : (
                                <>
                                  <User size={16} className="shrink-0 text-slate-400" />
                                  <span className="truncate">One-time (Not claimed)</span>
                                </>
                              )}
                            </div>

                            {/* Right action buttons */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button 
                                onClick={() => { setSelectedPromo(promo); setIsPromoUsageOpen(true); }}
                                className="px-3 py-1.5 rounded-lg text-primary font-semibold text-xs md:text-sm hover:bg-primary/10 transition-colors"
                              >
                                View
                              </button>
                              <button 
                                onClick={() => { setDeleteTarget({ id: promo.id || promo.code, type: 'promoCode' }); setIsDeleteDialogOpen(true); }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                title="Delete Code"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
               </div>
            </div>
          )}

          {activeView === 'users' && (
            <div className="space-y-6 users-view animate-in fade-in duration-500">
               {/* Stats Section */}
               <div className="grid grid-cols-2 gap-4">
                  {/* Total Users */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 dark:border-white/5 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
                     <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
                        <Users size={20} className="text-primary" />
                        <span className="text-xs sm:text-sm font-semibold">Total Users</span>
                     </div>
                     <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                        {allUsers.length.toLocaleString()}
                     </div>
                     <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-colors pointer-events-none" />
                  </div>

                  {/* Online Now */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 dark:border-white/5 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
                     <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
                        <Activity size={20} className="text-[#10B981]" />
                        <span className="text-xs sm:text-sm font-semibold">Online Now</span>
                     </div>
                     <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{onlineUsersCount.toLocaleString()}</span>
                        {onlineUsersCount > 0 && <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />}
                     </div>
                     <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#10B981]/5 rounded-full blur-xl group-hover:bg-[#10B981]/10 transition-colors pointer-events-none" />
                  </div>
               </div>

               {/* Filter Pills */}
               <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                  <button 
                    onClick={() => setUserFilterTab('all')}
                    className={cn(
                      "h-8 px-4 rounded-full font-medium text-xs whitespace-nowrap transition-all active:scale-95 flex items-center justify-center",
                      userFilterTab === 'all'
                        ? "bg-primary text-white shadow-sm"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    All Users
                  </button>
                  <button 
                    onClick={() => setUserFilterTab('admins')}
                    className={cn(
                      "h-8 px-4 rounded-full font-medium text-xs whitespace-nowrap transition-all active:scale-95 flex items-center justify-center",
                      userFilterTab === 'admins'
                        ? "bg-primary text-white shadow-sm"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    Admins
                  </button>
                  <button 
                    onClick={() => setUserFilterTab('online')}
                    className={cn(
                      "h-8 px-4 rounded-full font-medium text-xs whitespace-nowrap transition-all active:scale-95 flex items-center justify-center",
                      userFilterTab === 'online'
                        ? "bg-primary text-white shadow-sm"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    Online
                  </button>
                  <button 
                    onClick={() => setUserFilterTab('verified')}
                    className={cn(
                      "h-8 px-4 rounded-full font-medium text-xs whitespace-nowrap transition-all active:scale-95 flex items-center justify-center",
                      userFilterTab === 'verified'
                        ? "bg-primary text-white shadow-sm"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    Verified
                  </button>
               </div>

               {/* Mobile Users Cards List */}
               <div className="flex flex-col gap-3 md:hidden">
                  {filteredUsers.length === 0 ? (
                    <div className="py-20 text-center opacity-30 italic text-xs font-bold uppercase border-2 border-dashed rounded-3xl">
                      No users found
                    </div>
                  ) : (
                    filteredUsers.map(u => {
                      const lastActive = Number(u.lastActive);
                      const isOnline = !isNaN(lastActive) && (Date.now() - lastActive) < 300000;
                      const isAdmin = u.role === 'admin';
                      const leftStripeColor = isAdmin 
                        ? "bg-primary" 
                        : isOnline 
                        ? "bg-[#10B981]" 
                        : u.isVerified 
                        ? "bg-[#6a1edb]" 
                        : "bg-slate-300 dark:bg-slate-700";

                      return (
                        <div 
                          key={u.uid}
                          className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-white/5 flex items-start gap-3.5 hover:shadow-md transition-all relative overflow-hidden group"
                        >
                           {/* Left Accent Stripe */}
                           <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-xl", leftStripeColor)} />

                           {/* Avatar with Status Dot */}
                           <div className="relative shrink-0 pl-1">
                              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative border-2 border-white dark:border-slate-800 shadow-sm flex items-center justify-center">
                                 {u.photoURL ? (
                                   <Image src={u.photoURL} alt={u.name || ""} fill className="object-cover" />
                                 ) : (
                                   <User size={22} className="text-slate-400" />
                                 )}
                              </div>
                              <div className={cn(
                                "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900",
                                isOnline ? "bg-[#10B981]" : "bg-slate-300 dark:bg-slate-600"
                              )} />
                           </div>

                           {/* Details */}
                           <div className="flex flex-col min-w-0 flex-1">
                              <div className="flex items-center gap-1">
                                 <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-[140px]">
                                   {u.name || "Legendary Gamer"}
                                 </h3>
                                 {u.isVerified && <VerifiedBadge />}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {u.phoneNumber || u.email || "No phone"}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                 <span className={cn(
                                   "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold",
                                   isAdmin ? "bg-primary/10 text-primary" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                 )}>
                                   {isAdmin ? 'Admin' : 'User'}
                                 </span>
                                 <span className={cn(
                                   "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold",
                                   isOnline ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                 )}>
                                   {isOnline ? 'Online' : 'Offline'}
                                 </span>
                                 {u.points ? (
                                   <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500">
                                      <Star size={11} className="fill-amber-500" />
                                      {u.points}
                                   </span>
                                 ) : null}
                              </div>
                           </div>

                           {/* Actions */}
                           <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <button 
                                onClick={() => { setSelectedUser(u); setPointAdjustment(""); setIsUserManageOpen(true); }}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary transition-colors active:scale-90"
                                title="Edit User"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                onClick={() => { setDeleteTarget({ id: u.uid, type: 'user' }); setIsDeleteDialogOpen(true); }}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-500 transition-colors active:scale-90"
                                title="Delete User"
                              >
                                <Trash2 size={16} />
                              </button>
                           </div>
                        </div>
                      );
                    })
                  )}
               </div>

               {/* Desktop Users Table */}
               <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto scrollbar-hide">
                     <Table className="min-w-[900px]">
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-800/30">
                           <TableRow className="border-none h-14">
                              <TableHead className="px-6 font-bold text-xs uppercase tracking-wider text-slate-400">User Identity</TableHead>
                              <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-400">Contact</TableHead>
                              <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-400">Role</TableHead>
                              <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-400">Balance</TableHead>
                              <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-400">Presence</TableHead>
                              <TableHead className="text-right px-6 font-bold text-xs uppercase tracking-wider text-slate-400">Actions</TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {filteredUsers.length === 0 ? (
                             <TableRow>
                               <TableCell colSpan={6} className="h-48 text-center text-slate-300 italic uppercase font-bold text-xs">
                                 No users found.
                               </TableCell>
                             </TableRow>
                           ) : (
                             filteredUsers.map(u => {
                               const lastActive = Number(u.lastActive);
                               const isOnline = !isNaN(lastActive) && (Date.now() - lastActive) < 300000;
                               const isAdmin = u.role === 'admin';

                               return (
                                 <TableRow key={u.uid} className="border-slate-100 dark:border-white/5 h-20 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <TableCell className="px-6">
                                       <div className="flex items-center gap-3">
                                          <div className="relative shrink-0">
                                             <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative border-2 border-white dark:border-slate-800 shadow-sm flex items-center justify-center">
                                                {u.photoURL ? (
                                                  <Image src={u.photoURL} alt={u.name || ""} fill className="object-cover" />
                                                ) : (
                                                  <User size={18} className="text-slate-400" />
                                                )}
                                             </div>
                                             <div className={cn(
                                               "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900",
                                               isOnline ? "bg-[#10B981]" : "bg-slate-300 dark:bg-slate-600"
                                             )} />
                                          </div>
                                          <div className="min-w-0">
                                             <div className="flex items-center gap-1.5">
                                                <p className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-[160px]">
                                                  {u.name || "Legendary Gamer"}
                                                </p>
                                                {u.isVerified && <VerifiedBadge />}
                                             </div>
                                             <p className="text-[11px] text-slate-400 font-mono truncate">
                                               ID: {u.uid.slice(0, 10)}...
                                             </p>
                                          </div>
                                       </div>
                                    </TableCell>
                                    <TableCell>
                                       <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                                         {u.phoneNumber || u.email || "---"}
                                       </span>
                                    </TableCell>
                                    <TableCell>
                                       <Badge className={cn(
                                         "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border-none",
                                         isAdmin ? "bg-primary/10 text-primary" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                       )}>
                                         {u.role || 'user'}
                                       </Badge>
                                    </TableCell>
                                    <TableCell>
                                       <div className="flex items-center gap-1 font-bold text-xs text-amber-500">
                                          <Star size={13} className="fill-amber-500" />
                                          <span>{u.points || 0}</span>
                                       </div>
                                    </TableCell>
                                    <TableCell>
                                       <div className="flex items-center gap-1.5">
                                          <span className={cn("w-2 h-2 rounded-full", isOnline ? "bg-[#10B981] animate-pulse" : "bg-slate-300 dark:bg-slate-600")} />
                                          <span className={cn("text-xs font-semibold", isOnline ? "text-[#10B981]" : "text-slate-400")}>
                                            {isOnline ? 'Online' : 'Offline'}
                                          </span>
                                       </div>
                                    </TableCell>
                                    <TableCell className="text-right px-6">
                                       <div className="flex justify-end items-center gap-2">
                                          <button 
                                            onClick={() => { setSelectedUser(u); setPointAdjustment(""); setIsUserManageOpen(true); }}
                                            className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                            title="Manage User"
                                          >
                                            <Edit size={16} />
                                          </button>
                                          <button 
                                            onClick={() => { setDeleteTarget({ id: u.uid, type: 'user' }); setIsDeleteDialogOpen(true); }}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                                            title="Delete User"
                                          >
                                            <Trash2 size={16} />
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
               </div>
            </div>
           )}
              {activeView === 'settings' && (
            <div className="max-w-7xl mx-auto settings-view space-y-6 pb-28 animate-in fade-in duration-500">
              
              {/* ========================================================================= */}
              {/* MOBILE SETTINGS MENU VIEW (< md and mobileSettingsSubView === 'menu')     */}
              {/* ========================================================================= */}
              {mobileSettingsSubView === 'menu' && (
                <div className="md:hidden space-y-5 animate-in fade-in slide-in-from-left-4 duration-300">
                  {/* Mobile Settings Header */}
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      Settings
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Manage your store configuration, APIs, payments and operating hours.
                    </p>
                  </div>

                  {/* Settings Search Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search settings..."
                      value={settingsSearchQuery}
                      onChange={e => setSettingsSearchQuery(e.target.value)}
                      className="h-11 pl-10 pr-9 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 text-xs font-medium focus-visible:ring-primary shadow-xs"
                    />
                    {settingsSearchQuery && (
                      <button
                        onClick={() => setSettingsSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* TOP & DEFAULT HERO CARD: General Settings (All-in-One Bento) */}
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsActiveTab('all');
                      setMobileSettingsSubView('general');
                    }}
                    className="w-full text-left p-5 rounded-3xl bg-gradient-to-br from-indigo-600 via-primary to-purple-700 text-white shadow-xl shadow-primary/25 relative overflow-hidden group active:scale-[0.99] transition-transform"
                  >
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 border border-white/20 shadow-inner">
                          <LayoutGrid className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-headline font-black text-base uppercase tracking-tight">General settings</h3>
                            <span className="text-[8px] font-black uppercase bg-white/25 backdrop-blur-md text-white px-2 py-0.5 rounded-full">
                              All-in-One
                            </span>
                          </div>
                          <p className="text-[11px] text-white/80 font-medium truncate mt-0.5">
                            Combined view of all store settings sections
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/80 shrink-0 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>

                  {/* List of Individual Category Cards */}
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Individual Sections
                    </p>

                    {[
                      { id: 'branding', label: 'Brand & Identity', desc: 'Logo, live stream broadcast & ticker', icon: ImagePlus, color: 'from-blue-500/15 to-indigo-500/15 text-blue-500', badge: brandForm.isLive ? 'LIVE' : undefined, badgeColor: 'bg-rose-500 text-white' },
                      { id: 'automation', label: 'Automation & APIs', desc: 'FazerCards API, SMS webhook & matcher', icon: Cpu, color: 'from-indigo-500/15 to-purple-500/15 text-indigo-500', badge: storeSettings.fazercards?.enabled ? 'Active' : undefined, badgeColor: 'bg-emerald-500 text-white' },
                      { id: 'email-otp', label: 'Email & OTP Dispatcher', desc: 'EmailJS credentials, verification OTP', icon: Mail, color: 'from-amber-500/15 to-orange-500/15 text-amber-500' },
                      { id: 'finance', label: 'Payment Gateways', desc: 'Merchant phone & USSD payment methods', icon: Wallet, color: 'from-emerald-500/15 to-teal-500/15 text-emerald-500', badge: `${paymentMethods.length} Gateways`, badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' },
                      { id: 'telegram', label: 'Telegram Bot Alerts', desc: 'Real-time order & payment alerts', icon: BellRing, color: 'from-sky-500/15 to-cyan-500/15 text-sky-500', badge: telegramForm.telegramBotToken ? 'Connected' : undefined, badgeColor: 'bg-sky-500 text-white' },
                      { id: 'communication', label: 'Channels & Links', desc: 'WhatsApp support, TikTok & video guide', icon: MessageCircle, color: 'from-violet-500/15 to-pink-500/15 text-violet-500' },
                      { id: 'maintenance', label: 'Maintenance & Schedule', desc: 'Store offline lock & Mogadishu hours', icon: ShieldAlert, color: 'from-rose-500/15 to-red-500/15 text-rose-500', badge: scheduleForm.enabled ? 'Auto' : appStatusForm.offline ? 'Offline' : 'Online', badgeColor: appStatusForm.offline ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white' },
                      { id: 'legal', label: 'Legal & Terms', desc: 'Bilingual English & Somali policy editor', icon: ScrollText, color: 'from-emerald-500/15 to-green-500/15 text-emerald-600' }
                    ]
                    .filter(c => !settingsSearchQuery || `${c.label} ${c.desc}`.toLowerCase().includes(settingsSearchQuery.toLowerCase()))
                    .map(cat => {
                      const IconComp = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setSettingsActiveTab(cat.id);
                            setMobileSettingsSubView('section');
                          }}
                          className="w-full text-left p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-white/10 shadow-xs flex items-center justify-between gap-3 hover:border-primary/40 active:scale-[0.99] transition-all group"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className={cn("w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-inner", cat.color)}>
                              <IconComp className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{cat.label}</h4>
                                {cat.badge && (
                                  <span className={cn("text-[8px] font-black uppercase px-2 py-0.2 rounded-full shrink-0", cat.badgeColor)}>
                                    {cat.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">{cat.desc}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* MOBILE SUB-PAGE HEADER (Visible when inside 'general' or 'section' on mobile) */}
              {/* ========================================================================= */}
              {mobileSettingsSubView !== 'menu' && (
                <div className="md:hidden flex items-center justify-between p-2 mb-2">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleMobileSettingsBack}
                      className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-xs active:scale-95 transition-all"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white capitalize">
                        {mobileSettingsSubView === 'general' ? 'General settings' : settingsActiveTab.replace('-', ' ')}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {mobileSettingsSubView === 'general' ? 'All sections combined' : 'Store setting'}
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => {
                      updateStoreSettings(brandForm);
                      syncEconomySettings();
                      handleSaveTelegram();
                      setIsSettingsDirty(false);
                      toast({ title: "Settings Saved", description: "All configurations synced successfully." });
                    }}
                    className="h-9 px-3.5 rounded-xl font-black uppercase text-[10px] tracking-wider bg-primary hover:bg-primary/90 text-white gap-1.5 shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" /> Save
                  </Button>
                </div>
              )}

              {/* ========================================================================= */}
              {/* DESKTOP 2-COLUMN LAYOUT & MOBILE CONTENT CONTAINER                        */}
              {/* ========================================================================= */}
              <div className={cn(
                "gap-8",
                mobileSettingsSubView === 'menu' ? "hidden md:grid md:grid-cols-12" : "grid grid-cols-1 md:grid-cols-12"
              )}>

                {/* --------------------------------------------------------------------- */}
                {/* DESKTOP LEFT COLUMN: Settings Menu Sidebar (hidden on mobile)         */}
                {/* --------------------------------------------------------------------- */}
                <div className="hidden md:block md:col-span-4 lg:col-span-3.5 space-y-4 sticky top-24 self-start">
                  {/* Left Sidebar Header */}
                  <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-primary">
                        <Sparkles className="w-5 h-5" />
                        <h3 className="font-headline font-black text-sm uppercase tracking-tight text-slate-900 dark:text-white">Settings Menu</h3>
                      </div>
                      <Badge className="bg-primary/10 text-primary text-[8px] font-black uppercase border-none">
                        v2.4
                      </Badge>
                    </div>

                    {/* Search inside settings */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="Search settings..."
                        value={settingsSearchQuery}
                        onChange={e => setSettingsSearchQuery(e.target.value)}
                        className="h-9 pl-8 pr-7 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-xs font-medium focus-visible:ring-primary shadow-inner"
                      />
                      {settingsSearchQuery && (
                        <button onClick={() => setSettingsSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 p-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Navigation List */}
                  <div className="p-2 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-sm space-y-1">
                    {/* General Settings All-in-One Option at Top */}
                    <button
                      type="button"
                      onClick={() => handleSettingsTabChange('all')}
                      className={cn(
                        "w-full text-left px-3.5 py-3 rounded-2xl font-bold text-xs flex items-center justify-between transition-all group",
                        settingsActiveTab === 'all'
                          ? "bg-primary text-white shadow-md shadow-primary/20"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <LayoutGrid className={cn("w-4 h-4", settingsActiveTab === 'all' ? "text-white" : "text-primary")} />
                        <span>General Settings (All)</span>
                      </div>
                      <Badge className={cn("text-[8px] font-black uppercase px-2 py-0 border-none", settingsActiveTab === 'all' ? "bg-white/20 text-white" : "bg-primary/10 text-primary")}>
                        Full
                      </Badge>
                    </button>

                    <div className="h-px bg-slate-100 dark:bg-white/5 my-1" />

                    {[
                      { id: 'branding', label: 'Brand & Identity', icon: ImagePlus, badge: brandForm.isLive ? 'LIVE' : undefined, badgeColor: 'bg-rose-500 text-white' },
                      { id: 'automation', label: 'Automation & APIs', icon: Cpu, badge: storeSettings.fazercards?.enabled ? 'Active' : undefined, badgeColor: 'bg-emerald-500 text-white' },
                      { id: 'email-otp', label: 'Email & OTP', icon: Mail },
                      { id: 'finance', label: 'Payment Gateways', icon: Wallet, count: paymentMethods.length },
                      { id: 'telegram', label: 'Telegram Alerts', icon: BellRing, badge: telegramForm.telegramBotToken ? 'Connected' : undefined, badgeColor: 'bg-sky-500 text-white' },
                      { id: 'communication', label: 'Channels & Links', icon: MessageCircle },
                      { id: 'maintenance', label: 'Maintenance & Hours', icon: ShieldAlert, badge: scheduleForm.enabled ? 'Auto' : undefined, badgeColor: 'bg-indigo-500 text-white' },
                      { id: 'legal', label: 'Legal & Policies', icon: ScrollText }
                    ].map(tab => {
                      const IconComp = tab.icon;
                      const isActive = settingsActiveTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => handleSettingsTabChange(tab.id)}
                          className={cn(
                            "w-full text-left px-3.5 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-between transition-all",
                            isActive 
                              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md scale-100" 
                              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <IconComp className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-slate-400")} />
                            <span className="truncate">{tab.label}</span>
                          </div>
                          {tab.badge && (
                            <span className={cn("text-[8px] font-black uppercase px-2 py-0.2 rounded-full shrink-0", tab.badgeColor)}>
                              {tab.badge}
                            </span>
                          )}
                          {tab.count !== undefined && (
                            <span className={cn("text-[9px] font-bold px-2 py-0.2 rounded-full shrink-0", isActive ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900" : "bg-slate-100 dark:bg-slate-800 text-slate-400")}>
                              {tab.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Desktop Quick Sync Card */}
                  <div className="p-4 rounded-3xl bg-slate-900 text-white border border-white/10 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between text-slate-400 text-[10px] font-black uppercase tracking-wider">
                      <span>Mogadishu Clock</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <p className="text-lg font-headline font-black tabular-nums">{mogadishuTime || "00:00:00 AM"}</p>
                    <Button
                      onClick={() => {
                        updateStoreSettings(brandForm);
                        syncEconomySettings();
                        handleSaveTelegram();
                        setIsSettingsDirty(false);
                        toast({ title: "Configuration Snapshot Saved", description: "All current settings have been synced." });
                      }}
                      className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-wider gap-2 shadow-md shadow-primary/20"
                    >
                      <Save className="w-3.5 h-3.5" /> Quick Sync All
                    </Button>
                  </div>
                </div>

                {/* --------------------------------------------------------------------- */}
                {/* RIGHT COLUMN: Settings Content Cards (or single card)                 */}
                {/* --------------------------------------------------------------------- */}
                <div className="col-span-1 md:col-span-8 lg:col-span-8.5 space-y-6">

                  {/* ------------------------------------------------------------------ */}
                  {/* SECTION 1: Brand Identity & Broadcast (branding)                   */}
                  {/* ------------------------------------------------------------------ */}
                  {(settingsActiveTab === 'all' || settingsActiveTab === 'branding') && 
                   (!settingsSearchQuery || 'brand identity logo ticker live broadcast announcement oskar'.toLowerCase().includes(settingsSearchQuery.toLowerCase())) && (
                    <Card className="rounded-[2rem] md:rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl shadow-slate-900/5 overflow-hidden transition-all hover:shadow-2xl hover:shadow-primary/5">
                      <div className="p-6 md:p-8 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-5">
                          <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-inner">
                              <ImagePlus className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="font-headline font-black text-lg md:text-xl uppercase tracking-tight text-slate-900 dark:text-white">
                                Brand Identity & Live Broadcast
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                Store logo asset, announcement ticker message, and TikTok live toggle.
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider border-blue-500/30 text-blue-500">
                            Visual Assets
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                          <div className="lg:col-span-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                                Store Logo
                              </Label>
                              <span className="text-[9px] font-bold text-slate-400">PNG, SVG, WEBP</span>
                            </div>

                            <div className="relative aspect-square max-w-[200px] mx-auto lg:max-w-none rounded-3xl bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center overflow-hidden shadow-inner group hover:border-primary/50 transition-all">
                              {brandForm.logo ? (
                                <div className="relative w-full h-full p-4 flex items-center justify-center">
                                  <Image 
                                    src={brandForm.logo} 
                                    alt="Store Logo" 
                                    fill 
                                    className="object-contain p-3 group-hover:scale-105 transition-transform" 
                                  />
                                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity text-white">
                                    <ImagePlus className="w-6 h-6 text-primary" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Replace Logo</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center gap-2 text-slate-400 p-4 text-center">
                                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-xs">
                                    <ImagePlus className="w-6 h-6 text-slate-300 dark:text-slate-500" />
                                  </div>
                                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Upload Brand Logo</p>
                                </div>
                              )}
                              <input 
                                type="file" 
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                                onChange={e => {
                                  if (e.target.files?.[0]) {
                                    setIsSettingsDirty(true);
                                    handleImageUpload(e.target.files[0], 'logo');
                                  }
                                }} 
                              />
                              {isUploading && (
                                <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 flex flex-col items-center justify-center gap-2 z-20">
                                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                  <span className="text-[9px] font-black uppercase tracking-widest text-primary">Uploading...</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="lg:col-span-8 space-y-4">
                            <SettingInput 
                              label="Platform / Store Name" 
                              value={brandForm.name} 
                              onChange={v => { setIsSettingsDirty(true); setBrandForm(f => ({ ...f, name: v })); }} 
                              placeholder="Oskarshop" 
                            />

                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Radio className={cn("w-5 h-5", brandForm.isLive ? "text-rose-500 animate-pulse" : "text-slate-400")} />
                                <div>
                                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">TikTok Live Broadcast</h4>
                                  <p className="text-[10px] text-slate-400">Shows flashing red LIVE badge on storefront</p>
                                </div>
                              </div>
                              <Switch 
                                checked={brandForm.isLive} 
                                onCheckedChange={v => { setIsSettingsDirty(true); setBrandForm(f => ({ ...f, isLive: v })); }} 
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                                Announcement Ticker Message
                              </Label>
                              <Textarea 
                                value={brandForm.announcement} 
                                onChange={e => { setIsSettingsDirty(true); setBrandForm(f => ({ ...f, announcement: e.target.value })); }} 
                                className="min-h-[85px] rounded-2xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 p-3.5 font-medium text-xs leading-relaxed text-slate-900 dark:text-white shadow-inner focus-visible:ring-primary" 
                                placeholder="E.g. Kusoo dhawaada Oskarshop! Adeeg degdeg ah 24/7..." 
                              />
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex justify-end">
                          <Button 
                            onClick={() => { updateStoreSettings(brandForm).then(() => { setIsSettingsDirty(false); toast({ title: "Brand Identity Saved" }); }); }} 
                            className="w-full sm:w-auto h-11 px-6 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl bg-blue-600 hover:bg-blue-700 text-white gap-2"
                          >
                            <Save className="w-4 h-4" /> Save Brand Details
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* ------------------------------------------------------------------ */}
                  {/* SECTION 2: Automation & APIs (automation)                          */}
                  {/* ------------------------------------------------------------------ */}
                  {(settingsActiveTab === 'all' || settingsActiveTab === 'automation') && 
                   (!settingsSearchQuery || 'automation fazercards api webhooks sms matcher evc webhook reseller key'.toLowerCase().includes(settingsSearchQuery.toLowerCase())) && (
                    <Card className="rounded-[2rem] md:rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl shadow-slate-900/5 overflow-hidden transition-all hover:shadow-2xl hover:shadow-indigo-500/5">
                      <div className="p-6 md:p-8 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-5">
                          <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-inner">
                              <Cpu className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="font-headline font-black text-lg md:text-xl uppercase tracking-tight text-slate-900 dark:text-white">
                                Reseller Engine & Webhook Automation
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                FazerCards API fulfillment, live webhook stream, and EVC SMS auto-matcher.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                            {[
                              { id: 'config', label: 'API Config' },
                              { id: 'webhooks', label: `Webhooks (${webhookLogs.length})` },
                              { id: 'sms', label: 'SMS Matcher' }
                            ].map(subTab => (
                              <button
                                key={subTab.id}
                                type="button"
                                onClick={() => setSettingsAutomationSubTab(subTab.id as any)}
                                className={cn(
                                  "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                                  settingsAutomationSubTab === subTab.id
                                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                )}
                              >
                                {subTab.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {settingsAutomationSubTab === 'config' && (
                          <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                              <div className="lg:col-span-7 space-y-4">
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5 flex items-center justify-between">
                                  <div className="space-y-0.5">
                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">FazerCards Integration</h4>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                      Enables automated order placement on fazercards.com
                                    </p>
                                  </div>
                                  <Switch 
                                    checked={storeSettings.fazercards?.enabled || false} 
                                    onCheckedChange={v => { setIsSettingsDirty(true); updateStoreSettings({ fazercards: { ...storeSettings.fazercards, enabled: v } }); }} 
                                  />
                                </div>

                                <SettingInput 
                                  label="FazerCards API Key" 
                                  type={showFazerKey ? "text" : "password"}
                                  value={fazerApiKey} 
                                  onChange={v => { setIsSettingsDirty(true); setFazerApiKey(v); }} 
                                  placeholder="Enter secret API Key..." 
                                  rightElement={
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => setShowFazerKey(!showFazerKey)}
                                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                      >
                                        {showFazerKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                      </button>
                                      <Button 
                                        size="sm" 
                                        onClick={() => updateStoreSettings({ fazercards: { ...storeSettings.fazercards, apiKey: fazerApiKey } }).then(() => { setIsSettingsDirty(false); toast({ title: "API Key Saved" }); })} 
                                        className="h-8 rounded-xl font-bold uppercase text-[9px] tracking-wider px-3"
                                      >
                                        Save
                                      </Button>
                                    </div>
                                  }
                                />

                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5 flex items-center justify-between">
                                  <div className="space-y-0.5">
                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Auto Top-Up Fulfillment</h4>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                      Instantly send top-up requests on approval
                                    </p>
                                  </div>
                                  <Switch 
                                    checked={storeSettings.fazercards?.autoTopupEnabled || false} 
                                    onCheckedChange={v => { setIsSettingsDirty(true); updateStoreSettings({ fazercards: { ...storeSettings.fazercards, autoTopupEnabled: v } }); }} 
                                  />
                                </div>
                              </div>

                              <div className="lg:col-span-5 space-y-4">
                                <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-800/40 text-white space-y-3 shadow-xl">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300">Live API Balance</span>
                                    <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[8px] font-black uppercase">
                                      {storeSettings.fazercards?.enabled ? "Connected" : "Standby"}
                                    </Badge>
                                  </div>

                                  <p className="text-2xl font-headline font-black text-white tabular-nums tracking-tight">
                                    {storeSettings.fazercards?.balance || "---"}
                                  </p>

                                  <Button
                                    onClick={handleTestFazerConnection}
                                    disabled={isTestingFazer}
                                    className="w-full h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider border border-white/15 gap-2 backdrop-blur-sm"
                                  >
                                    {isTestingFazer ? <Loader2 className="w-6 h-6 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                    Sync API Balance
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {settingsAutomationSubTab === 'webhooks' && (
                          <div className="space-y-3 animate-in fade-in duration-300">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                                Incoming Stream ({webhookLogs.length} events)
                              </span>
                              {webhookLogs.length > 0 && (
                                <Button variant="ghost" size="sm" onClick={handleClearWebhookLogs} className="h-7 text-rose-500 text-[9px] font-bold uppercase">
                                  <Trash2 className="w-3 h-3 mr-1" /> Clear Logs
                                </Button>
                              )}
                            </div>
                            <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 divide-y divide-slate-100 dark:divide-white/5">
                              {webhookLogs.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-xs font-medium">No webhook events logged yet</div>
                              ) : (
                                webhookLogs.slice(0, 10).map(log => (
                                  <div key={log.id} className="p-3 text-xs flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <div className={cn("w-2 h-2 rounded-full", log.matched ? "bg-emerald-500" : "bg-amber-500")} />
                                      <span className="font-mono text-primary font-bold">{log.extractedId || '---'}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400">{safeFormatDistanceToNow(log.receivedAt)} ago</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}

                        {settingsAutomationSubTab === 'sms' && (
                          <div className="space-y-4 animate-in fade-in duration-300">
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5 flex items-center justify-between">
                              <div className="space-y-0.5">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white">SMS Auto-Approval</h4>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">Matches incoming EVC Plus SMS to orders</p>
                              </div>
                              <Switch 
                                checked={storeSettings.sms_webhook?.enabled || false} 
                                onCheckedChange={v => { setIsSettingsDirty(true); updateStoreSettings({ sms_webhook: { ...storeSettings.sms_webhook, enabled: v } }); }} 
                              />
                            </div>
                            <div className="flex gap-2">
                              <Input readOnly value="https://oskarshop.so/api/sms-webhook" className="h-10 rounded-xl font-mono text-xs font-bold text-primary" />
                              <Button variant="outline" onClick={() => copyToClipboard("https://oskarshop.so/api/sms-webhook", "sms_webhook", "URL Copied")} className="h-10 px-3 rounded-xl font-bold text-xs">
                                Copy URL
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}

                  {/* ------------------------------------------------------------------ */}
                  {/* SECTION 3: Payment Gateways (finance)                              */}
                  {/* ------------------------------------------------------------------ */}
                  {(settingsActiveTab === 'all' || settingsActiveTab === 'finance') && 
                   (!settingsSearchQuery || 'payment gateways ussd evc premier number methods financial economy'.toLowerCase().includes(settingsSearchQuery.toLowerCase())) && (
                    <Card className="rounded-[2rem] md:rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl shadow-slate-900/5 overflow-hidden transition-all hover:shadow-2xl hover:shadow-emerald-500/5">
                      <div className="p-6 md:p-8 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-5">
                          <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-inner">
                              <Wallet className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="font-headline font-black text-lg md:text-xl uppercase tracking-tight text-slate-900 dark:text-white">
                                Payment Gateways & Financial Settlement
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                Primary merchant receiving number and USSD payment gateways.
                              </p>
                            </div>
                          </div>

                          <Button 
                            onClick={() => handleOpenPaymentMethodDialog()} 
                            className="h-10 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 self-start sm:self-auto"
                          >
                            <Plus className="w-4 h-4" /> Add Gateway
                          </Button>
                        </div>

                        {/* Primary Settlement Number */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Primary Settlement Number</h4>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">Receiving phone number for customer transfers</p>
                            </div>
                            <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-none text-[8px] font-black uppercase">
                              Merchant Phone
                            </Badge>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2.5">
                            <div className="flex-1">
                              <Input 
                                value={economyForm.paymentNumber} 
                                onChange={e => { setIsSettingsDirty(true); setEconomyForm(f => ({ ...f, paymentNumber: e.target.value })); }} 
                                placeholder="613982172" 
                                className="h-11 rounded-xl bg-white dark:bg-slate-900 font-mono font-bold text-sm"
                              />
                            </div>
                            <Button 
                              onClick={() => { syncEconomySettings(); setIsSettingsDirty(false); }} 
                              className="h-11 px-5 rounded-xl font-bold uppercase text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20"
                            >
                              Save Number
                            </Button>
                          </div>
                        </div>

                        {/* Gateways Grid with 3-Dots Menu */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                            Active Gateways ({paymentMethods.length})
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                            {paymentMethods.map(m => (
                              <div 
                                key={m.id} 
                                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/5 flex flex-col justify-between space-y-3 group shadow-xs"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-primary shadow-xs overflow-hidden relative shrink-0">
                                      {m.icon ? (
                                        <Image src={m.icon} alt={m.name} fill className="object-cover p-1" />
                                      ) : (
                                        <Smartphone className="w-5 h-5 text-primary" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{m.name}</p>
                                      <Badge className={cn("text-[8px] font-black uppercase border-none mt-0.5", m.active ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-slate-200 dark:bg-slate-700 text-slate-400")}>
                                        {m.active ? 'Active' : 'Disabled'}
                                      </Badge>
                                    </div>
                                  </div>

                                  {/* 3-DOTS ACTION POPOVER DROPDOWN */}
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <button 
                                        className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                                        title="Gateway Actions"
                                      >
                                        <MoreVertical className="w-4 h-4" />
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent align="end" className="w-44 p-1.5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xl bg-white dark:bg-slate-900 z-50">
                                      <div className="space-y-0.5">
                                        <button
                                          type="button"
                                          onClick={() => handleOpenPaymentMethodDialog(m)}
                                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                                        >
                                          <Edit className="w-3.5 h-3.5 text-blue-500" /> Edit Method
                                        </button>
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            const rawList = storeSettings.paymentMethods;
                                            const list: any[] = Array.isArray(rawList) ? rawList : (rawList ? Object.values(rawList) : []);
                                            const updated = list.map((p: any) => p.id === m.id ? { ...p, active: !p.active } : p);
                                            await updateStoreSettings({ paymentMethods: updated });
                                            toast({ title: `Gateway ${m.active ? 'Disabled' : 'Activated'}` });
                                          }}
                                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                                        >
                                          <Power className="w-3.5 h-3.5 text-emerald-500" /> {m.active ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setDeleteTarget({ id: m.id, type: 'paymentMethod' });
                                            setIsDeleteDialogOpen(true);
                                          }}
                                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Delete Method
                                        </button>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </div>

                                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/5 space-y-0.5">
                                  <span className="text-[9px] font-black uppercase text-slate-400">USSD Code</span>
                                  <p className="font-mono text-xs font-bold text-primary truncate">{m.ussdTemplate || "No USSD set"}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* ------------------------------------------------------------------ */}
                  {/* SECTION 4: Email & OTP Dispatcher (email-otp)                      */}
                  {/* ------------------------------------------------------------------ */}
                  {(settingsActiveTab === 'all' || settingsActiveTab === 'email-otp') && 
                   (!settingsSearchQuery || 'email otp service template public key emailjs verification password recovery'.toLowerCase().includes(settingsSearchQuery.toLowerCase())) && (
                    <Card className="rounded-[2rem] md:rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl shadow-slate-900/5 overflow-hidden transition-all hover:shadow-2xl hover:shadow-primary/5">
                      <div className="p-6 md:p-8 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-5">
                          <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                              <Mail className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="font-headline font-black text-lg md:text-xl uppercase tracking-tight text-slate-900 dark:text-white">
                                Email & OTP Dispatcher (EmailJS)
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                Service credentials for user verification OTPs and password recovery.
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider border-primary/30 text-primary">
                            EmailJS Config
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5 space-y-4">
                            <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-wider">
                              <UserCheck className="w-4 h-4" /> Sign-up Verification
                            </div>
                            <SettingInput label="Service ID" value={emailConfigForm.verification.serviceId} onChange={v => { setIsSettingsDirty(true); setEmailConfigForm(f => ({ ...f, verification: { ...f.verification, serviceId: v } })); }} placeholder="service_..." />
                            <SettingInput label="Template ID" value={emailConfigForm.verification.templateId} onChange={v => { setIsSettingsDirty(true); setEmailConfigForm(f => ({ ...f, verification: { ...f.verification, templateId: v } })); }} placeholder="template_..." />
                            <SettingInput label="Public Key" value={emailConfigForm.verification.publicKey} onChange={v => { setIsSettingsDirty(true); setEmailConfigForm(f => ({ ...f, verification: { ...f.verification, publicKey: v } })); }} placeholder="pk_..." />
                          </div>

                          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5 space-y-4">
                            <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider">
                              <RefreshCw className="w-4 h-4" /> Password Recovery
                            </div>
                            <SettingInput label="Service ID" value={emailConfigForm.recovery.serviceId} onChange={v => { setIsSettingsDirty(true); setEmailConfigForm(f => ({ ...f, recovery: { ...f.recovery, serviceId: v } })); }} placeholder="service_..." />
                            <SettingInput label="Template ID" value={emailConfigForm.recovery.templateId} onChange={v => { setIsSettingsDirty(true); setEmailConfigForm(f => ({ ...f, recovery: { ...f.recovery, templateId: v } })); }} placeholder="template_..." />
                            <SettingInput label="Public Key" value={emailConfigForm.recovery.publicKey} onChange={v => { setIsSettingsDirty(true); setEmailConfigForm(f => ({ ...f, recovery: { ...f.recovery, publicKey: v } })); }} placeholder="pk_..." />
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex justify-end">
                          <Button 
                            onClick={() => { handleSaveEmailConfig(); setIsSettingsDirty(false); }} 
                            disabled={isSavingStatus} 
                            className="w-full sm:w-auto h-11 px-6 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl bg-primary hover:bg-primary/90 text-white gap-2"
                          >
                            <Save className="w-4 h-4" /> Sync Email Config
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* ------------------------------------------------------------------ */}
                  {/* SECTION 5: Telegram Bot Alerts (telegram)                          */}
                  {/* ------------------------------------------------------------------ */}
                  {(settingsActiveTab === 'all' || settingsActiveTab === 'telegram') && 
                   (!settingsSearchQuery || 'telegram bot notifications token admin chat ids alerts'.toLowerCase().includes(settingsSearchQuery.toLowerCase())) && (
                    <Card className="rounded-[2rem] md:rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl shadow-slate-900/5 overflow-hidden transition-all hover:shadow-2xl hover:shadow-sky-500/5">
                      <div className="p-6 md:p-8 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-5">
                          <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center shadow-inner">
                              <BellRing className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="font-headline font-black text-lg md:text-xl uppercase tracking-tight text-slate-900 dark:text-white">
                                Telegram Real-Time Admin Alerts
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                Instant order and payment notifications to admins on Telegram.
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider border-sky-500/30 text-sky-500">
                            Telegram Bot
                          </Badge>
                        </div>

                        <div className="space-y-4">
                          <SettingInput 
                            label="Telegram Bot Token" 
                            value={telegramForm.telegramBotToken} 
                            onChange={v => { setIsSettingsDirty(true); setTelegramForm(f => ({ ...f, telegramBotToken: v })); }} 
                            placeholder="8817771628:AA..." 
                          />
                          <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                              Admin Chat IDs (Comma Separated)
                            </Label>
                            <Textarea 
                              value={telegramForm.telegramAdminChatIds} 
                              onChange={e => { setIsSettingsDirty(true); setTelegramForm(f => ({ ...f, telegramAdminChatIds: e.target.value })); }} 
                              className="min-h-[80px] rounded-2xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 p-3.5 font-mono text-xs font-bold" 
                              placeholder="8105182517, 123456789" 
                            />
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex justify-end">
                          <Button 
                            onClick={() => { handleSaveTelegram(); setIsSettingsDirty(false); }} 
                            disabled={isSavingStatus} 
                            className="w-full sm:w-auto h-11 px-6 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl bg-sky-600 hover:bg-sky-700 text-white gap-2"
                          >
                            <Save className="w-4 h-4" /> Sync Telegram Config
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* ------------------------------------------------------------------ */}
                  {/* SECTION 6: Channels & Support (communication)                      */}
                  {/* ------------------------------------------------------------------ */}
                  {(settingsActiveTab === 'all' || settingsActiveTab === 'communication') && 
                   (!settingsSearchQuery || 'communication channels support whatsapp tiktok tutorial video links'.toLowerCase().includes(settingsSearchQuery.toLowerCase())) && (
                    <Card className="rounded-[2rem] md:rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl shadow-slate-900/5 overflow-hidden transition-all hover:shadow-2xl hover:shadow-indigo-500/5">
                      <div className="p-6 md:p-8 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-5">
                          <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-inner">
                              <MessageCircle className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="font-headline font-black text-lg md:text-xl uppercase tracking-tight text-slate-900 dark:text-white">
                                Support & Channels Hub
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                WhatsApp support line, TikTok link, and video guide.
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider border-indigo-500/30 text-indigo-500">
                            Help & Socials
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <SettingInput label="WhatsApp Official Support No" value={helpLinksForm.whatsappNumber} onChange={v => { setIsSettingsDirty(true); setHelpLinksForm(f => ({ ...f, whatsappNumber: v })); }} placeholder="252613982172" />
                            <SettingInput label="TikTok Channel URL" value={helpLinksForm.tiktokUrl} onChange={v => { setIsSettingsDirty(true); setHelpLinksForm(f => ({ ...f, tiktokUrl: v })); }} placeholder="https://tiktok.com/@..." />
                            <SettingInput label="Tutorial Video URL" value={helpLinksForm.tutorialUrl} onChange={v => { setIsSettingsDirty(true); setHelpLinksForm(f => ({ ...f, tutorialUrl: v })); }} placeholder="https://youtube.com/watch?v=..." />
                          </div>

                          <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5 flex items-center justify-between">
                              <div>
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Tutorial Home Banner</h4>
                                <p className="text-[10px] text-slate-400">Show video card on home slider</p>
                              </div>
                              <Switch 
                                checked={helpLinksForm.tutorialBannerActive} 
                                onCheckedChange={v => { setIsSettingsDirty(true); setHelpLinksForm(f => ({ ...f, tutorialBannerActive: v })); }} 
                              />
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex justify-end">
                          <Button 
                            onClick={() => { updateStoreSettings({ helpLinks: helpLinksForm }).then(() => { setIsSettingsDirty(false); toast({ title: "Links Synced" }); }); }} 
                            className="w-full sm:w-auto h-11 px-6 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                          >
                            <Save className="w-4 h-4" /> Save Communication Links
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* ------------------------------------------------------------------ */}
                  {/* SECTION 7: Maintenance & Operating Schedule (maintenance)          */}
                  {/* ------------------------------------------------------------------ */}
                  {(settingsActiveTab === 'all' || settingsActiveTab === 'maintenance') && 
                   (!settingsSearchQuery || 'maintenance schedule operating hours mogadishu offline emergency auto close open'.toLowerCase().includes(settingsSearchQuery.toLowerCase())) && (
                    <Card className="rounded-[2rem] md:rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl shadow-slate-900/5 overflow-hidden transition-all hover:shadow-2xl hover:shadow-rose-500/5">
                      <div className="p-6 md:p-8 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-5">
                          <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shadow-inner">
                              <ShieldAlert className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="font-headline font-black text-lg md:text-xl uppercase tracking-tight text-slate-900 dark:text-white">
                                Maintenance & Scheduled Operating Hours
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                Emergency maintenance lockdown and Mogadishu operating window.
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider border-rose-500/30 text-rose-500">
                            System Operations
                          </Badge>
                        </div>

                        {/* Emergency Switch */}
                        <div className={cn(
                          "p-5 rounded-2xl border transition-all space-y-4",
                          scheduleForm.enabled ? "bg-slate-50 dark:bg-slate-800/30 opacity-80" : "bg-rose-50/70 dark:bg-rose-950/20 border-rose-200"
                        )}>
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <Monitor className="w-6 h-6 text-rose-600 shrink-0" />
                              <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Global Maintenance Lockdown</h4>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">Locks storefront and displays maintenance page</p>
                              </div>
                            </div>
                            <Switch 
                              checked={appStatusForm.offline} 
                              disabled={scheduleForm.enabled}
                              onCheckedChange={v => { setIsSettingsDirty(true); setAppStatusForm(f => ({ ...f, offline: v })); }} 
                            />
                          </div>
                        </div>

                        {/* Operating Schedule */}
                        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Scheduled Operating Hours</h4>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">Auto open/close based on East Africa Time (EAT)</p>
                            </div>
                            <Switch 
                              checked={scheduleForm.enabled} 
                              onCheckedChange={v => { setIsSettingsDirty(true); setScheduleForm(f => ({ ...f, enabled: v })); }} 
                            />
                          </div>

                          {scheduleForm.enabled && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200/80 dark:border-white/5">
                              <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Open Time</Label>
                                <Input 
                                  type="time" 
                                  value={scheduleForm.openTime} 
                                  onChange={e => { setIsSettingsDirty(true); setScheduleForm({ ...scheduleForm, openTime: e.target.value }); }} 
                                  className="h-11 rounded-xl bg-white dark:bg-slate-900 font-bold text-sm"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Close Time</Label>
                                <Input 
                                  type="time" 
                                  value={scheduleForm.closeTime} 
                                  onChange={e => { setIsSettingsDirty(true); setScheduleForm({ ...scheduleForm, closeTime: e.target.value }); }} 
                                  className="h-11 rounded-xl bg-white dark:bg-slate-900 font-bold text-sm"
                                />
                              </div>
                            </div>
                          )}

                          <Button 
                            onClick={() => { handleSaveSchedule(); setIsSettingsDirty(false); }} 
                            disabled={isSavingStatus} 
                            className="w-full h-11 rounded-xl font-bold uppercase text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-md"
                          >
                            <Save className="w-4 h-4" /> Save Operating Schedule
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* ------------------------------------------------------------------ */}
                  {/* SECTION 8: Compliance & Terms Editor (legal)                       */}
                  {/* ------------------------------------------------------------------ */}
                  {(settingsActiveTab === 'all' || settingsActiveTab === 'legal') && 
                   (!settingsSearchQuery || 'legal compliance terms shuruudaha policy conditions privacy'.toLowerCase().includes(settingsSearchQuery.toLowerCase())) && (
                    <Card className="rounded-[2rem] md:rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl shadow-slate-900/5 overflow-hidden transition-all hover:shadow-2xl hover:shadow-emerald-500/5">
                      <div className="p-6 md:p-8 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-5">
                          <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center shadow-inner">
                              <ScrollText className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="font-headline font-black text-lg md:text-xl uppercase tracking-tight text-slate-900 dark:text-white">
                                Terms & Conditions (Compliance Editor)
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                Dual-language policy manager in English & Somali.
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider border-emerald-600/30 text-emerald-600">
                            Bilingual Legal
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">English Terms</Label>
                            <Textarea 
                              value={termsForm.en} 
                              onChange={e => { setIsSettingsDirty(true); setTermsForm(f => ({ ...f, en: e.target.value })); }} 
                              className="min-h-[200px] rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-slate-800/80 p-4 font-medium text-xs leading-relaxed" 
                              placeholder="Enter store policy in English..." 
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Somali Terms (Shuruudaha)</Label>
                            <Textarea 
                              value={termsForm.so} 
                              onChange={e => { setIsSettingsDirty(true); setTermsForm(f => ({ ...f, so: e.target.value })); }} 
                              className="min-h-[200px] rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-slate-800/80 p-4 font-medium text-xs leading-relaxed" 
                              placeholder="Geli shuruudaha afka Soomaaliga..." 
                            />
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex justify-end">
                          <Button 
                            onClick={() => { updateStoreSettings({ termsAndConditions: termsForm }).then(() => { setIsSettingsDirty(false); toast({ title: "Policy Updated" }); }); }} 
                            className="w-full sm:w-auto h-11 px-6 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                          >
                            <Save className="w-4 h-4" /> Sync Legal Policy
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}

                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <Dialog open={isUserManageOpen} onOpenChange={setIsUserManageOpen}>
        <DialogContent className="max-w-md w-[94%] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900 animate-in zoom-in duration-300 max-h-[90vh] flex flex-col [&>button]:hidden">
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
                      <Label className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">Verification status</Label>
                   </div>
                   <div className="h-10 md:h-12 rounded-lg md:rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between px-3 border dark:border-white/5 shadow-inner">
                      <div className="flex items-center gap-1.5 min-0">
                        <span className={cn("truncate text-[10px] font-bold uppercase", selectedUser?.isVerified ? 'Verified' : 'unverified')}>
                          {selectedUser?.isVerified ? 'Verified' : 'unverified'}
                        </span>
                        {selectedUser?.isVerified && <VerifiedBadge className="text-[14px]" />}
                      </div>
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
                    <Button onClick={() => handleAdjustPoints('debit')} size="sm" className="h-10 w-10 md:h-12 md:w-12 rounded-lg md:rounded-xl bg-red-500 hover:bg-red-600 shadow-md shrink-0 p-0"><Minus size={16} /></Button>
                 </div>
              </div>

              <div className="pt-2 space-y-3">
                 <Button 
                    onClick={() => {
                      setIsUserManageOpen(false);
                      setGlobalLoading(true);
                      router.push(`/admin/users/${selectedUser?.uid}`);
                    }}
                    className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 text-xs"
                 >
                    <LinkExternal size={14} /> Customer info
                 </Button>

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
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'game')} />
                 </div>
              </div>
              <SettingInput label="Title" value={gameForm.title} onChange={v => setGameForm({ ...gameForm, title: v })} placeholder="e.g. Free Fire" />
              <div className="space-y-2">
                 <Label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 ml-1">Category</Label>
                 <Select value={gameForm.category} onValueChange={v => setGameForm({...gameForm, category: v as any})}>
                    <SelectTrigger className="h-12 rounded-xl dark:bg-slate-800 border-none px-4"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                       <SelectItem value="top-up" className="p-3 font-bold text-xs uppercase">Top-Up Items</SelectItem>
                       <SelectItem value="accounts" className="p-3 font-bold text-xs uppercase">Account Marketplace</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
              <div className="flex items-center justify-between p-3 md:p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                 <Label className="font-bold text-sm">Auto Detect Name</Label>
                 <Switch checked={gameForm.autoDetectName} onCheckedChange={v => setGameForm(f => ({ ...f, autoDetectName: v }))} />
              </div>
              <div className="flex items-center justify-between p-3 md:p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                 <div>
                    <p className="font-bold text-sm">Active (Show in Shop)</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Toggle visibility in shop collections</p>
                 </div>
                 <Switch checked={gameForm.active} onCheckedChange={v => setGameForm(f => ({ ...f, active: v }))} />
              </div>
              <Button type="submit" disabled={isUploading} className="w-full h-12 md:h-14 rounded-2xl font-bold shadow-lg uppercase tracking-widest">{isUploading ? <Loader2 className="animate-spin" /> : "Save Collection"}</Button>
           </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-xl w-[95%] rounded-[2rem] md:rounded-[3rem] p-0 border-none shadow-2xl bg-white dark:bg-slate-900 max-h-[90vh] overflow-y-auto scrollbar-hide">
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
                    <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Parent Game</Label>
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

              {/* Automation Section */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl border dark:border-white/5 space-y-6">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                       <Cpu className="text-primary w-5 h-5" />
                       <h5 className="font-bold text-sm">Reseller Automation</h5>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Handling Type</Label>
                      <Select value={productForm.category} onValueChange={v => {
                        const handling = v as any;
                        setProductForm({ ...productForm, category: handling });
                      }}>
                        <SelectTrigger className="h-8 rounded-lg bg-white dark:bg-slate-900 border-none px-3 font-bold shadow-sm w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl z-[210]">
                          <SelectItem value="top-up" className="text-xs font-bold">Regular Top-up</SelectItem>
                          <SelectItem value="booyah-pass" className="text-xs font-bold">Booyah Pass</SelectItem>
                          <SelectItem value="special_package" className="text-xs font-bold">Special Package</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                 </div>

                 {productForm.category === 'special_package' && (
                   <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                      <div className="space-y-4">
                         <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                               <Layers className="text-primary w-4 h-4" />
                               <h6 className="text-[11px] font-black uppercase tracking-tight">Package Builder</h6>
                            </div>
                            <Button type="button" size="sm" onClick={() => setIsOfferSelectorOpen(true)} className="rounded-lg font-black uppercase text-[9px] h-8 gap-2">
                               <Plus size={14} /> Add Offer
                            </Button>
                         </div>

                         {/* Offers List */}
                         <div className="space-y-3">
                            {productForm.specialPackage.offers.length === 0 ? (
                               <div className="py-8 text-center border-2 border-dashed rounded-2xl opacity-20 italic text-xs font-bold uppercase">Package is empty</div>
                            ) : (
                               productForm.specialPackage.offers.map((off, idx) => (
                                 <div key={off.id} className="p-3 bg-white dark:bg-slate-900 rounded-2xl border dark:border-white/5 flex items-center justify-between gap-4 shadow-sm group">
                                    <div className="min-w-0 flex-1">
                                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate">{off.categoryName}</p>
                                       <p className="font-bold text-sm truncate">{off.offerName}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                       <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-lg px-2 h-10">
                                          <Label className="text-[8px] font-black uppercase text-slate-400 mr-2">Qty</Label>
                                          <input 
                                            type="number" 
                                            min="1" max="10" 
                                            value={off.quantity} 
                                            onChange={(e) => {
                                              const newOffers = [...productForm.specialPackage.offers];
                                              newOffers[idx].quantity = parseInt(e.target.value) || 1;
                                              setProductForm({...productForm, specialPackage: { ...productForm.specialPackage, offers: newOffers, totalProviderCost: 0 }});
                                            }}
                                            className="w-10 bg-transparent border-none font-bold text-sm text-center focus:ring-0" 
                                          />
                                       </div>
                                       <button type="button" onClick={() => removeFromPackage(off.id)} className="p-2 text-slate-300 hover:text-red-500 group-hover:bg-red-50 rounded-xl transition-all">
                                          <X size={16} />
                                       </button>
                                    </div>
                                 </div>
                               ))
                            )}
                         </div>

                         {/* Multi-Offer Selector Panel */}
                         {isOfferSelectorOpen && (
                           <div className="p-5 bg-slate-100 dark:bg-slate-800/80 rounded-[2rem] border-2 border-primary/20 space-y-4 animate-in zoom-in-95">
                              <div className="space-y-1.5">
                                 <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">1. Select Game / Service</Label>
                                 <Select value={packageBuilderState.category_id} onValueChange={(val) => {
                                   const cat = fazerCategories.find(c => c.id === val);
                                   handlePackageCategoryChange(val, cat?.name || "Game");
                                 }}>
                                    <SelectTrigger className="h-10 rounded-xl bg-white dark:bg-slate-900 border-none px-4 font-bold shadow-sm">
                                       <SelectValue placeholder="Category..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-none shadow-2xl z-[220]">
                                       {fazerCategories.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold">{c.name}</SelectItem>)}
                                    </SelectContent>
                                 </Select>
                              </div>

                              <div className="space-y-1.5">
                                 <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">2. Select Offer</Label>
                                 <Select 
                                   disabled={!packageBuilderState.category_id} 
                                   value={packageBuilderState.offer_id} 
                                   onValueChange={(val) => {
                                     const off = fazerOffers.find(o => o.id === val);
                                     setPackageBuilderState({ ...packageBuilderState, offer_id: val, offerName: off?.name || "Offer", offerPrice: off?.price || "0" });
                                   }}
                                 >
                                    <SelectTrigger className="h-10 rounded-xl bg-white dark:bg-slate-900 border-none px-4 font-bold shadow-sm">
                                       <SelectValue placeholder="Offer..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-none shadow-2xl z-[220]">
                                       {fazerOffers.map(o => <SelectItem key={o.id} value={o.id} className="text-xs font-bold">{o.name}</SelectItem>)}
                                    </SelectContent>
                                 </Select>
                              </div>

                              <div className="flex items-center gap-3">
                                 <Button type="button" onClick={addToPackage} disabled={!packageBuilderState.offer_id} className="flex-1 rounded-xl h-10 bg-primary font-black uppercase text-[10px]">Add to Package</Button>
                                 <Button type="button" variant="ghost" onClick={() => setIsOfferSelectorOpen(false)} className="rounded-xl h-10 font-bold uppercase text-[10px]">Cancel</Button>
                              </div>
                           </div>
                         )}
                      </div>
                   </div>
                 )}

                 {productForm.category !== 'special_package' && (
                   <>
                     <div className="flex items-center justify-between border-t dark:border-white/5 pt-6">
                        <div className="flex items-center gap-3">
                           <Activity className="text-primary w-5 h-5" />
                           <h5 className="font-bold text-sm">Auto-Topup</h5>
                        </div>
                        <Switch 
                          checked={productForm.autoTopupEnabled} 
                          onCheckedChange={v => setProductForm({ ...productForm, autoTopupEnabled: v })} 
                        />
                     </div>
                     
                     {productForm.autoTopupEnabled && (
                       <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                          <div className="space-y-1.5">
                             <Label className="text-[9px] font-black uppercase text-slate-400">FazerCards Category</Label>
                             <Select value={productForm.fazercardsCategory_id} onValueChange={handleFazerCategoryChange}>
                                <SelectTrigger className="h-10 rounded-xl bg-white dark:bg-slate-900 border-none px-4 font-bold shadow-sm">
                                   <SelectValue placeholder="Select category..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-2xl z-[200]">
                                   {(fazerCategories || []).map(cat => <SelectItem key={cat.id} value={cat.id} className="text-xs font-bold">{cat.name}</SelectItem>)}
                                </SelectContent>
                             </Select>
                          </div>
                          <div className="space-y-1.5">
                             <Label className="text-[9px] font-black uppercase text-slate-400">FazerCards Offer</Label>
                             <Select value={productForm.fazercardsOffer_id} onValueChange={v => setProductForm({ ...productForm, fazercardsOffer_id: v })}>
                                <SelectTrigger className="h-10 rounded-xl bg-white dark:bg-slate-900 border-none px-4 font-bold shadow-sm">
                                   <SelectValue placeholder="Select offer..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-2xl z-[200]">
                                   {(fazerOffers || []).map(off => <SelectItem key={off.id} value={off.id} className="text-xs font-bold">{off.name} - ${off.price}</SelectItem>)}
                                </SelectContent>
                             </Select>
                          </div>

                          {fazerRequiredFields.length > 0 && (
                            <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl flex items-start gap-2 text-primary text-[10px] font-bold">
                               <span className="shrink-0 mt-0.5"><Info size={14} /></span>
                               <p>Required fields: {fazerRequiredFields.map(f => f.replace('_', ' ')).join(', ')}</p>
                            </div>
                          )}

                          <div className="space-y-1.5">
                             <Label className="text-[9px] font-black uppercase text-slate-400">Order multiplier</Label>
                             <Select value={productForm.fazercardsMultiQuantity?.toString() || "1"} onValueChange={v => setProductForm({ ...productForm, fazercardsMultiQuantity: parseInt(v) })}>
                                <SelectTrigger className="h-10 rounded-xl bg-white dark:bg-slate-900 border-none px-4 font-bold shadow-sm">
                                   <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-2xl z-[200]">
                                   {[1, 2, 3, 4, 5].map(m => <SelectItem key={m} value={m.toString()} className="text-xs font-bold">{m}x Order</SelectItem>)}
                                </SelectContent>
                             </Select>
                          </div>
                       </div>
                     )}
                   </>
                 )}
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

      {/* Add New Promo Code Modal */}
      <Dialog open={isPromoDialogOpen} onOpenChange={setIsPromoDialogOpen}>
        <DialogContent className="w-[95%] max-w-md rounded-2xl p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900">
           <div className="p-6 flex flex-col gap-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                 <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                   Add new promo code
                 </DialogTitle>
              </div>

              {/* Form */}
              <form onSubmit={handleSavePromo} className="flex flex-col gap-4">
                 {/* Promo Code Input */}
                 <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Promo code
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. SUMMER24"
                      value={promoCodeForm.code}
                      onChange={e => setPromoCodeInput({ ...promoCodeForm, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono uppercase text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      required
                    />
                 </div>

                 {/* Promo Code Type */}
                 <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Promo code type
                    </label>
                    <div className="flex items-center gap-6">
                       <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-800 dark:text-slate-200">
                          <input 
                            type="radio" 
                            name="promoType" 
                            value="single_use"
                            checked={promoCodeForm.type === 'single_use'}
                            onChange={() => setPromoCodeInput({ ...promoCodeForm, type: 'single_use' })}
                            className="w-4 h-4 text-primary accent-primary"
                          />
                          <span>One time</span>
                       </label>
                       <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-800 dark:text-slate-200">
                          <input 
                            type="radio" 
                            name="promoType" 
                            value="multi_use"
                            checked={promoCodeForm.type === 'multi_use'}
                            onChange={() => setPromoCodeInput({ ...promoCodeForm, type: 'multi_use' })}
                            className="w-4 h-4 text-primary accent-primary"
                          />
                          <span>Multi use</span>
                       </label>
                    </div>
                 </div>

                 {/* Discount Percentage */}
                 <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Discount percentage %
                    </label>
                    <input 
                      type="number" 
                      min="1" 
                      max="100"
                      placeholder="10"
                      value={promoCodeForm.discount}
                      onChange={e => setPromoCodeInput({ ...promoCodeForm, discount: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      required
                    />
                 </div>

                 {/* Duration (Responsive row for mobiles) */}
                 <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Duration
                    </label>
                    <div className="flex gap-2 w-full">
                       <input 
                         type="number" 
                         min="1" 
                         placeholder="Value"
                         value={promoCodeForm.duration}
                         onChange={e => setPromoCodeInput({ ...promoCodeForm, duration: e.target.value })}
                         className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                         required
                       />
                       <select 
                         value={promoCodeForm.durationUnit}
                         onChange={e => setPromoCodeInput({ ...promoCodeForm, durationUnit: e.target.value })}
                         className="w-32 sm:w-36 shrink-0 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                       >
                          <option value="days">Days</option>
                          <option value="months">Months</option>
                          <option value="hours">Hours</option>
                          <option value="minutes">Minutes</option>
                          <option value="years">Years</option>
                       </select>
                    </div>
                 </div>

                 {/* Note */}
                 <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Note
                    </label>
                    <textarea 
                      placeholder="Add a description..."
                      value={promoCodeForm.note}
                      onChange={e => setPromoCodeInput({ ...promoCodeForm, note: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[85px] resize-none"
                    />
                 </div>

                 {/* Action Buttons */}
                 <div className="flex gap-3 pt-3">
                    <Button 
                      type="submit" 
                      disabled={isSavingStatus}
                      className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium text-sm shadow-sm transition-all active:scale-[0.98]"
                    >
                      {isSavingStatus ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                      Save Code
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsPromoDialogOpen(false)}
                      className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-none font-medium text-sm transition-all"
                    >
                      Cancel
                    </Button>
                 </div>
              </form>
           </div>
        </DialogContent>
      </Dialog>

      {/* Redesigned View Promo Usage Modal */}
      <Dialog open={isPromoUsageOpen} onOpenChange={setIsPromoUsageOpen}>
         <DialogContent className="w-[95%] max-w-lg rounded-2xl p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900">
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
               <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                     <Ticket size={20} />
                  </div>
                  <div className="min-w-0">
                     <div className="flex items-center gap-2">
                        <DialogTitle className="text-lg font-bold font-mono text-slate-900 dark:text-white uppercase truncate">
                          {selectedPromo?.code || "Promo"}
                        </DialogTitle>
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/15 text-[10px] font-bold border-none px-2 py-0.5">
                          {selectedPromo?.discount}% OFF
                        </Badge>
                     </div>
                     <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                       {selectedPromo?.type === 'multi_use' ? 'Multi-Use Campaign Usage' : 'Single-Use Voucher Claim'}
                     </p>
                  </div>
               </div>
            </div>

            {/* Modal Content - Users List */}
            <div className="p-6 max-h-[60vh] overflow-y-auto scrollbar-hide space-y-3">
               {(() => {
                  const usageList = selectedPromo ? (
                    selectedPromo.type === 'multi_use'
                      ? Object.values(selectedPromo.usedByUsers || {})
                      : (selectedPromo.claimed && selectedPromo.usedBy
                          ? [{ 
                              uid: selectedPromo.usedBy, 
                              name: allUsers.find(u => u.uid === selectedPromo.usedBy)?.name || 'Gamer', 
                              whatsapp: allUsers.find(u => u.uid === selectedPromo.usedBy)?.phoneNumber || 'N/A', 
                              timestamp: selectedPromo.claimedAt || selectedPromo.createdAt 
                            }]
                          : []
                        )
                  ) : [];

                  if (usageList.length === 0) {
                    return (
                      <div className="py-12 flex flex-col items-center justify-center text-center">
                         <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
                            <Users size={24} />
                         </div>
                         <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No redemptions yet</p>
                         <p className="text-xs text-slate-400 max-w-[200px] mt-1">This promo code hasn&apos;t been claimed or used by any users yet.</p>
                      </div>
                    );
                  }

                  return (
                    <>
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-1">
                         <span className="font-semibold uppercase tracking-wider text-[10px]">Redemption History</span>
                         <span className="font-bold">{usageList.length} {usageList.length === 1 ? 'user' : 'users'}</span>
                      </div>
                      {usageList.map((usage: any, idx: number) => {
                        const profile = allUsers.find(u => u.uid === usage.uid);
                        const displayName = usage.name || profile?.name || 'Gamer';
                        const displayPhone = usage.whatsapp || profile?.phoneNumber || 'N/A';
                        const time = usage.timestamp || selectedPromo?.createdAt;

                        return (
                          <div 
                            key={usage.uid || idx} 
                            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 flex items-center justify-between hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors"
                          >
                             <div className="flex items-center gap-3 min-w-0">
                                <Avatar className="w-10 h-10 rounded-xl border border-white dark:border-slate-700 shadow-sm shrink-0">
                                   <AvatarImage src={profile?.photoURL} />
                                   <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                                     {displayName.slice(0, 2).toUpperCase()}
                                   </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                   <div className="flex items-center gap-1.5">
                                      <p className="truncate font-semibold text-sm text-slate-900 dark:text-white max-w-[140px] sm:max-w-[180px]">
                                        {displayName}
                                      </p>
                                      {profile?.isVerified && <VerifiedBadge />}
                                   </div>
                                   <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                     {displayPhone}
                                   </p>
                                </div>
                             </div>
                             <div className="text-right shrink-0">
                                <p className="text-xs font-semibold text-primary">
                                  {safeFormatDistanceToNow(time, { addSuffix: true })}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium">
                                  {time && !isNaN(new Date(time).getTime()) ? format(time, 'MMM d, yyyy HH:mm') : '---'}
                                </p>
                             </div>
                          </div>
                        );
                      })}
                    </>
                  );
               })()}
            </div>

            {/* Modal Footer */}
            <div className="p-6 pt-2 border-t border-slate-100 dark:border-slate-800">
               <Button 
                 onClick={() => setIsPromoUsageOpen(false)} 
                 className="w-full h-11 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white border-none font-medium text-sm transition-all"
               >
                 Close
               </Button>
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
              <DialogTitle>Are you sure?</DialogTitle>
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
              <Button variant="destructive" onClick={executeEndEarly} className="flex-1 rounded-xl h-12 md:h-14 font-black uppercase tracking-widest shadow-lg shadow-center active:scale-95 transition-all" disabled={isSavingStatus}>
                {isSavingStatus ? <Loader2 className="animate-spin" /> : "Haa, Jooji"}
              </Button>
           </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Bottom Navbar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/70 dark:border-white/10 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] pb-safe">
        <div className="h-16 flex items-center justify-around px-2">
          <button
            onClick={() => { setActiveTab('dashboard'); setSelectedOrderId(null); setSelectedAccountId(null); setSelectedEventId(null); setIsEditingEvent(false); }}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
              activeView === 'dashboard' && !selectedOrderId && !selectedAccountId && !selectedEventId ? "text-primary font-bold" : "text-slate-400 hover:text-primary"
            )}
          >
            <LayoutDashboard size={20} />
            <span className="text-[10px]">Dashboard</span>
          </button>

          <button
            onClick={() => { setActiveTab('users'); }}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
              activeView === 'users' ? "text-primary font-bold" : "text-slate-400 hover:text-primary"
            )}
          >
            <Users size={20} />
            <span className="text-[10px]">Users</span>
          </button>

          <button
            onClick={() => { setActiveTab('orders'); setSelectedOrderId(null); }}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors relative",
              activeView === 'orders' ? "text-primary font-bold" : "text-slate-400 hover:text-primary"
            )}
          >
            <div className="relative">
              <ShoppingBag size={20} />
              {topUpOrders.filter(o => o.status === 'pending').length > 0 && (
                <span className="absolute -top-1 -right-2 w-4 h-4 bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {topUpOrders.filter(o => o.status === 'pending').length}
                </span>
              )}
            </div>
            <span className="text-[10px]">Orders</span>
          </button>

          <button
            onClick={() => { setActiveTab('inventory'); }}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
              activeView === 'inventory' ? "text-primary font-bold" : "text-slate-400 hover:text-primary"
            )}
          >
            <Box size={20} />
            <span className="text-[10px]">Inventory</span>
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center w-full h-full gap-1 text-slate-400 hover:text-primary transition-colors"
          >
            <Menu size={20} />
            <span className="text-[10px]">Menu</span>
          </button>
        </div>
      </nav>

      {/* Global Floating Scroll-To-Top Button */}
      <button
        aria-label="Scroll to top"
        onClick={scrollToTop}
        className={cn(
          "fixed z-40 w-11 h-11 md:w-12 md:h-12 rounded-full bg-gradient-to-tr from-[#6a1edb] to-[#8343f4] text-white flex items-center justify-center shadow-[0_4px_20px_rgba(106,30,219,0.35)] hover:-translate-y-1 active:scale-95 transition-all duration-300 bottom-20 right-4 md:bottom-8 md:right-8",
          showBackToTop ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <ArrowUpCircle className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      {/* Unsaved Changes Confirmation Dialog */}
      <Dialog open={isUnsavedChangesOpen} onOpenChange={setIsUnsavedChangesOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 sm:p-8 border-none shadow-2xl bg-white dark:bg-slate-900 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={28} />
          </div>
          <DialogTitle className="text-lg sm:text-xl font-headline font-bold text-slate-900 dark:text-white">
            Unsaved Changes
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
            You have unsaved changes in Settings. Do you want to save them before leaving or discard all changes?
          </DialogDescription>
          <div className="flex flex-col gap-2.5 mt-6">
            <Button
              onClick={handleSaveAndExitSettings}
              disabled={isSavingStatus}
              className="w-full h-12 rounded-xl font-bold text-xs uppercase tracking-wider bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
            >
              {isSavingStatus ? <Loader2 className="animate-spin" /> : "Save & Exit"}
            </Button>
            <Button
              variant="outline"
              onClick={handleDiscardSettings}
              disabled={isSavingStatus}
              className="w-full h-12 rounded-xl font-bold text-xs uppercase tracking-wider text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            >
              Discard Changes
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsUnsavedChangesOpen(false)}
              disabled={isSavingStatus}
              className="w-full h-10 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Stay on Page
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DashboardTrendCard({ label, value, icon: Icon, color, trend, isNegative }: { label: string, value: string, icon: any, color: string, trend: string, isNegative?: boolean }) {
   return (
      <Card className="rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-8 border-none shadow-xl bg-white dark:bg-slate-900 flex flex-col justify-between group hover:shadow-2xl transition-all">
         <div className="flex justify-between items-start">
            <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm", "bg-slate-50 dark:bg-slate-800", color)}>
               <Icon size={24} />
            </div>
            <Badge className={cn(
               "rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border-none",
               isNegative ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
            )}>
               {isNegative ? <TrendingDown size={10} className="mr-1 inline" /> : <TrendingUp size={10} className="mr-1 inline" />} {trend}
            </Badge>
         </div>
         <div className="mt-4 sm:mt-6 space-y-0.5">
            <p className="text-lg md:text-3xl font-headline font-bold text-slate-900 dark:text-white tracking-tight">{value}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
         </div>
      </Card>
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
            className="h-10 sm:h-12 md:h-16 px-4 sm:px-6 md:px-10 rounded-lg sm:rounded-xl md:rounded-2xl font-black uppercase tracking-widest gap-2 bg-primary shadow-lg shadow-primary/20 active:scale-95 transition-transform text-[10px] sm:text-xs md:sm"
          >
             <Save size={16} className="sm:size-5" /> <span className="hidden lg:inline">Save</span>
          </Button>
       </div>
    </div>
  );
}

function OrderDetailView({ order, onBack, onUpdate, onManualSuccess, onManualSync, onRetryTopup, status, setStatus, reason, setReason, isSaving, onDelete, allUsers }: any) {
  const router = useRouter();
  if (!order) return null;
  const item = order.items?.[0];
  const buyer = allUsers?.find((u: any) => u.uid === order.userId);
  const delivery = order.specialPackageDelivery;

  const handleCopyId = () => {
    navigator.clipboard.writeText(order.id.toUpperCase());
    toast({ title: "Reference Copied", description: `#${order.id.toUpperCase()} copied to clipboard.` });
  };

  const handleWhatsApp = () => {
    const num = formatWhatsAppNumber(order.gameDetails?.whatsappNumber || order.gameDetails?.phone || buyer?.phoneNumber || "252613982172");
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(`Hello ${order.gameDetails?.playerName || buyer?.name || ''}, regarding your order #${order.id.toUpperCase().slice(-8)} on Oskarshop:`)}`, '_blank');
  };

  const handleCopyPlayerId = () => {
    const pid = order.ffUid || order.gameDetails?.playerID || order.gameDetails?.playerId || order.gameDetails?.uid;
    if (pid) {
      navigator.clipboard.writeText(pid);
      toast({ title: "Player ID Copied", description: pid });
    }
  };

  const handleCopyReceipt = () => {
    const receiptText = `=== OSKARSHOP ORDER RECEIPT ===
Order Ref: #${order.id.toUpperCase()}
Date: ${order.createdAt ? format(new Date(order.createdAt), "MMM d, yyyy, HH:mm") : 'N/A'}
Status: ${order.status.toUpperCase()}
Item: ${item?.title || "Top-up"}
Player ID: ${order.ffUid || order.gameDetails?.playerID || order.gameDetails?.playerId || 'N/A'}
Player Name: ${order.ffPlayerName || order.gameDetails?.playerName || 'N/A'}
Total: $${order.total?.toFixed(2)}
Payment: ${order.paymentMethod || 'EVCPlus'}
Sender: ${order.gameDetails?.senderNumber || 'N/A'}
=================================`;
    navigator.clipboard.writeText(receiptText);
    toast({ title: "Receipt Copied", description: "Full order receipt copied to clipboard." });
  };

  const isPending = order.status === 'pending';
  const isProcessing = order.status === 'processing';
  const isSuccess = order.status === 'successful';
  const isCancelled = order.status === 'cancelled';

  const playerId = order.ffUid || order.gameDetails?.playerID || order.gameDetails?.playerId || order.gameDetails?.uid || "N/A";
  const playerName = order.ffPlayerName || order.gameDetails?.playerName || order.gameDetails?.name || "N/A";
  const senderNumber = order.gameDetails?.senderNumber || order.gameDetails?.senderPhone || "N/A";
  const whatsappNum = order.gameDetails?.whatsappNumber || order.gameDetails?.phone || "N/A";

  const standardKeys = new Set([
    'playerID', 'playerId', 'uid', 'ffUid',
    'playerName', 'name', 'ffPlayerName',
    'senderNumber', 'senderPhone',
    'whatsappNumber', 'phone',
    'category', 'isEventWinner', 'eventTitle', 'postId',
    'paymentMethod', 'region', 'ffRegion'
  ]);

  const customFields = Object.entries(order.gameDetails || {}).filter(
    ([key]) => !standardKeys.has(key) && !key.startsWith('_') && typeof order.gameDetails[key] !== 'object'
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 pb-24 max-w-4xl mx-auto">
       {/* Header Bar */}
       <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
             <button 
               onClick={onBack} 
               className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors shadow-xs"
             >
                <ArrowLeft size={18} />
             </button>
             <div>
                <h1 className="font-bold text-lg text-slate-900 dark:text-white">Order Details</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">#{order.id.toUpperCase()}</p>
             </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
             <User size={16} />
          </div>
       </div>

       {/* Top Order Summary Card */}
       <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-white/10 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1.5 min-w-0">
             <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                   Order #{order.id.toUpperCase().slice(-10)}
                </span>
                <button 
                  onClick={handleCopyId}
                  className="text-slate-400 hover:text-primary transition-colors p-1"
                  title="Copy Order ID"
                >
                   <Copy size={14} />
                </button>
                {isPending && (
                   <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider border border-amber-200/40">
                      PENDING
                   </span>
                )}
                {isProcessing && (
                   <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider animate-pulse border border-blue-200/40">
                      PROCESSING
                   </span>
                )}
                {isSuccess && (
                   <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-200/40">
                      SUCCESS
                   </span>
                )}
                {isCancelled && (
                   <span className="px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider border border-rose-200/40">
                      CANCELLED
                   </span>
                )}
             </div>
             <p className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                <Clock size={13} />
                {order.createdAt && !isNaN(new Date(order.createdAt).getTime()) ? format(new Date(order.createdAt), "MMM d, yyyy, HH:mm") : "---"}
             </p>
          </div>

          <button 
             onClick={onDelete}
             className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center shrink-0 shadow-xs active:scale-95"
             title="Delete Order"
          >
             <Trash2 size={16} />
          </button>
       </div>

       {/* Item Details Card */}
       <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-white/10 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-4 min-w-0">
             <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-purple-500/15 text-primary flex items-center justify-center text-2xl shadow-inner shrink-0 border border-primary/20">
                {item?.thumbnail ? (
                   <div className="w-full h-full rounded-2xl overflow-hidden relative">
                      <Image src={item.thumbnail} alt="" fill className="object-cover" />
                   </div>
                ) : (
                   <span>💎</span>
                )}
             </div>
             <div className="min-w-0">
                <div className="flex items-center gap-2">
                   <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white truncate">
                      {item?.title?.replace("Auction Winner", "Guuleystaha")?.replace(/💎/g, '') || "110 Diamonds"}
                   </h3>
                   {item?.isOneTime && (
                      <Badge className="bg-rose-500 text-white text-[9px] px-2 py-0.2 font-bold uppercase border-none">
                         One Time
                      </Badge>
                   )}
                </div>
                <p className="text-xs font-semibold text-primary flex items-center gap-1 mt-0.5">
                   <Gamepad2 size={13} />
                   {order.gameDetails?.category || "Free Fire"}
                </p>
             </div>
          </div>

          <div className="text-right shrink-0">
             <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                ${order.total?.toFixed(2)}
             </p>
             <span className="inline-block px-2.5 py-0.5 mt-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                {order.paymentMethod || "EVCPlus"}
             </span>
          </div>
       </div>

       {/* Player Details Card */}
       <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-white/10 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-primary">
             <Gamepad2 size={18} />
             <h4 className="font-bold text-xs uppercase tracking-widest text-primary">Player Details</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
             {/* PLAYER ID */}
             <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">PLAYER ID</span>
                <div className="flex items-center justify-between">
                   <span className="font-mono font-bold text-sm text-slate-900 dark:text-white truncate">{playerId}</span>
                   {playerId !== "N/A" && (
                      <button 
                        onClick={handleCopyPlayerId}
                        className="p-1 text-slate-400 hover:text-primary transition-colors rounded-lg"
                        title="Copy Player ID"
                      >
                         <Copy size={14} />
                      </button>
                   )}
                </div>
             </div>

             {/* PLAYER NAME */}
             <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">PLAYER NAME</span>
                <div className="flex items-center gap-1.5 min-w-0">
                   <span className="font-bold text-sm text-slate-900 dark:text-white truncate">{playerName}</span>
                   {order.ffVerified && <VerifiedBadge />}
                </div>
             </div>

             {/* SENDER NUMBER */}
             <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">SENDER #</span>
                <div className="flex items-center justify-between">
                   <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">{senderNumber}</span>
                   {senderNumber !== "N/A" && (
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(senderNumber);
                          toast({ title: "Sender Number Copied", description: senderNumber });
                        }}
                        className="p-1 text-slate-400 hover:text-primary transition-colors rounded-lg"
                        title="Copy Sender Number"
                      >
                         <Copy size={14} />
                      </button>
                   )}
                </div>
             </div>

             {/* WHATSAPP */}
             <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">WHATSAPP</span>
                <div className="flex items-center justify-between">
                   <span className="font-mono font-bold text-sm text-slate-900 dark:text-white truncate">{whatsappNum}</span>
                   {whatsappNum !== "N/A" && (
                      <button 
                        onClick={handleWhatsApp}
                        className="p-1 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg transition-all"
                        title="Open WhatsApp Chat"
                      >
                         <MessageCircle size={15} />
                      </button>
                   )}
                </div>
             </div>

             {/* Dynamic Fazercards Custom Category Fields */}
             {customFields.map(([k, v]) => (
                <div key={k} className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5 space-y-1">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                   </span>
                   <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-white truncate">{String(v)}</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(String(v));
                          toast({ title: `${k} Copied`, description: String(v) });
                        }}
                        className="p-1 text-slate-400 hover:text-primary transition-colors rounded-lg"
                        title="Copy Value"
                      >
                         <Copy size={14} />
                      </button>
                   </div>
                </div>
             ))}

             {order.ffRegion && (
                <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5 space-y-1">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">REGION</span>
                   <span className="block font-bold text-sm text-slate-900 dark:text-white">{order.ffRegion}</span>
                </div>
             )}

             {order.promoCode && (
                <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5 space-y-1">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">PROMO CODE</span>
                   <span className="block font-bold text-sm text-primary">{order.promoCode}</span>
                </div>
             )}
          </div>

          {/* Special Package Delivery Status UI if present */}
          {delivery && (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-white/5 space-y-4">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                     <ShoppingBag size={16} />
                     <span>Package Delivery Progress</span>
                  </div>
                  <Badge className={cn(
                    "rounded-full px-3 py-0.5 text-[9px] font-bold uppercase border-none",
                    delivery.overallStatus === 'completed' ? "bg-emerald-600 text-white" :
                    delivery.overallStatus === 'failed' ? "bg-rose-600 text-white" :
                    delivery.overallStatus === 'partial' ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700"
                  )}>
                     {delivery.overallStatus}
                  </Badge>
               </div>
               <Progress value={(delivery.completedOffers / Math.max(delivery.totalOffers, 1)) * 100} className="h-2 rounded-full" />
               <div className="space-y-2">
                  {Object.entries(delivery.offers || {}).map(([offId, offData]: any) => (
                    <div key={offId} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-white/5 text-xs">
                       <span className="font-bold text-slate-900 dark:text-white truncate">{offData.offerName}</span>
                       <span className={cn(
                         "font-bold uppercase text-[10px]",
                         offData.status === 'completed' ? "text-emerald-500" :
                         offData.status === 'failed' ? "text-rose-500" : "text-amber-500"
                       )}>
                          {offData.status}
                       </span>
                    </div>
                  ))}
               </div>
            </div>
          )}
       </div>

       {/* Fazercards Automation Card */}
       {!delivery && (order.autoTopupStatus || order.smsMatchedId || order.autoTopupOrderId) && (
         <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 text-primary">
                  <Cpu size={18} />
                  <h4 className="font-bold text-xs uppercase tracking-widest text-primary">Fazercards Log</h4>
               </div>
               {order.autoTopupStatus === 'completed' && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                     Delivered & Synced
                  </Badge>
               )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
               {/* Reseller Status */}
               <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5 space-y-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Reseller Status</span>
                  <div>
                     {order.autoTopupStatus === 'completed' && (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                           <CheckCircle2 size={13} /> COMPLETED
                        </span>
                     )}
                     {order.autoTopupStatus === 'processing' && (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-xs animate-pulse">
                           <Loader2 size={13} className="animate-spin" /> PROCESSING
                        </span>
                     )}
                     {order.autoTopupStatus === 'failed' && (
                        <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold text-xs">
                           <XCircle size={13} /> FAILED
                        </span>
                     )}
                     {!order.autoTopupStatus && (
                        <span className="text-slate-400 font-bold text-xs">PENDING</span>
                     )}
                  </div>
               </div>

               {/* Provider Order ID */}
               <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5 space-y-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Provider IDs</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                     {order.autoTopupOrderId ? (
                        <a 
                          href={`https://reseller.fazercards.com/panel/orders/${order.autoTopupOrderId.toString().split(',')[0].trim()}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-xs font-bold text-primary hover:underline bg-primary/10 px-2 py-0.5 rounded-md"
                        >
                           #{order.autoTopupOrderId} <ExternalLink size={10} />
                        </a>
                     ) : (
                        <span className="text-xs text-slate-400 font-medium italic">None assigned</span>
                     )}
                  </div>
               </div>

               {/* Payment Validation */}
               <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5 space-y-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Payment Validation</span>
                  <div>
                     {order.smsMatchedId ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                           <CheckCircle2 size={13} /> Auto-Matched via SMS
                        </span>
                     ) : (
                        <span className="text-slate-500 font-bold text-xs">Manual verification check by admin</span>
                     )}
                  </div>
               </div>
            </div>

            {/* Error banner if present */}
            {order.autoTopupError && (
               <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-600" />
                  <div>
                     <p className="font-bold text-[10px] uppercase tracking-wider">Provider Error</p>
                     <p className="mt-0.5">{order.autoTopupError}</p>
                  </div>
               </div>
            )}

            {/* Retry / Sync buttons */}
            {(order.autoTopupStatus === 'failed' || order.autoTopupStatus === 'processing') && (
               <div className="flex gap-2 pt-1">
                  {order.autoTopupStatus === 'failed' && (
                     <Button 
                        onClick={onRetryTopup} 
                        disabled={isSaving} 
                        className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider gap-2 shadow-xs"
                     >
                        <RefreshCw size={13} className={cn(isSaving && "animate-spin")} /> Retry FazerCards Order
                     </Button>
                  )}
                  {order.autoTopupStatus === 'processing' && (
                     <Button 
                        onClick={() => onManualSync(order.id)} 
                        disabled={isSaving} 
                        className="h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider gap-2 shadow-xs"
                     >
                        <RefreshCw size={13} className={cn(isSaving && "animate-spin")} /> Sync Status
                     </Button>
                  )}
               </div>
            )}
         </div>
       )}

       {/* Customer Card (Macamiilka) */}
       <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-white/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2 text-primary">
                <User size={18} />
                <h4 className="font-bold text-xs uppercase tracking-widest text-primary">Macamiilka</h4>
             </div>
             {(buyer?.uid || order.userId) && (
                <button
                  type="button"
                  onClick={() => router.push(`/admin/users/${buyer?.uid || order.userId}`)}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                   View Profile <ExternalLink size={12} />
                </button>
             )}
          </div>

          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5 flex items-center justify-between gap-4">
             <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-xl overflow-hidden relative border border-slate-200 dark:border-slate-700 bg-white shrink-0">
                   {buyer?.photoURL ? (
                      <Image src={buyer.photoURL} alt="" fill className="object-cover" unoptimized />
                   ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-base bg-primary/10 text-primary">
                         {(buyer?.name || "U").slice(0, 1).toUpperCase()}
                      </div>
                   )}
                </div>
                <div className="min-w-0">
                   <div className="flex items-center gap-1.5">
                      <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{buyer?.name || "Deleted User"}</p>
                      {buyer?.isVerified && <VerifiedBadge />}
                   </div>
                   <p className="text-xs font-medium text-slate-400 mt-0.5">{buyer?.phoneNumber || "No phone linked"}</p>
                   <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-primary/10 text-primary border-none text-[9px] font-bold px-2 py-0">
                         {buyer?.role || 'User'}
                      </Badge>
                      <span className="text-[10px] text-slate-400 font-semibold">{buyer?.points || 0} pts</span>
                   </div>
                </div>
             </div>

             {(buyer?.uid || order.userId) && (
                <button
                  type="button"
                  onClick={() => router.push(`/admin/users/${buyer?.uid || order.userId}`)}
                  className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 hover:border-primary text-slate-500 hover:text-primary transition-all flex items-center justify-center shrink-0 shadow-xs"
                  title="Inspect Profile"
                >
                   <Eye size={16} />
                </button>
             )}
          </div>
       </div>

       {/* Handling Staff Card (Admin Log) */}
       <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-white/10 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-primary">
             <ShieldCheck size={18} />
             <h4 className="font-bold text-xs uppercase tracking-widest text-primary">Handling Staff</h4>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5 flex items-center justify-between gap-4">
             <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-xl overflow-hidden relative border border-slate-200 dark:border-slate-700 bg-white shrink-0 flex items-center justify-center">
                   {order.processedBy?.photoURL ? (
                      <Image src={order.processedBy.photoURL} alt="" fill className="object-cover" />
                   ) : order.processedBy?.name ? (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center font-bold text-primary text-base">
                         {order.processedBy.name.charAt(0).toUpperCase()}
                      </div>
                   ) : (order.approvedBy === 'auto_sms' || order.smsMatchedId) ? (
                      <div className="w-full h-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                         <Smartphone size={20} />
                      </div>
                   ) : (
                      <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                         <User size={20} />
                      </div>
                   )}
                </div>
                <div className="min-w-0">
                   <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Handler</p>
                   <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {order.processedBy?.name || ((order.approvedBy === 'auto_sms' || order.smsMatchedId) ? 'Auto-SMS Match' : "Wali lama furin")}
                    </p>
                    {order.processedAt && (
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                         {safeFormatDistanceToNow(order.processedAt)} ago
                      </p>
                    )}
                 </div>
              </div>

              <div className="text-right shrink-0">
                 <p className="text-[9px] font-bold uppercase text-slate-400">Resolved Date</p>
                 <p className="font-bold text-xs text-slate-900 dark:text-white">
                    {order.completedAt && !isNaN(new Date(order.completedAt).getTime()) ? format(new Date(order.completedAt), "MMM d, yyyy") : "---"}
                 </p>
                 <p className="text-[10px] font-semibold text-primary">
                    {order.completedAt && !isNaN(new Date(order.completedAt).getTime()) ? format(new Date(order.completedAt), "HH:mm") : "PENDING..."}
                 </p>
              </div>
           </div>
        </div>

        {/* Actions & Status Control Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-white/10 shadow-sm space-y-5">
           <div className="flex items-center gap-2 text-primary">
              <RefreshCw size={18} className={cn(isSaving && "animate-spin")} />
              <h4 className="font-bold text-xs uppercase tracking-widest text-primary">Actions</h4>
           </div>

           <div className="space-y-4">
              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Update Status</label>
                 <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-white/10 px-4 font-bold text-sm">
                       <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border dark:border-white/10 shadow-2xl z-[200]">
                       {['pending', 'processing', 'successful', 'cancelled'].map(s => (
                         <SelectItem key={s} value={s} className="p-3 font-bold uppercase text-xs rounded-lg">{s}</SelectItem>
                       ))}
                    </SelectContent>
                 </Select>
              </div>

              {status === 'cancelled' && (
                 <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-xs font-bold text-rose-500">Cancellation Reason</label>
                    <Textarea 
                      value={reason} 
                      onChange={(e) => setReason(e.target.value)} 
                      placeholder="e.g. Invalid Sender Number or Wrong Player ID" 
                      className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-white/10 min-h-[100px] p-4 font-medium text-sm" 
                    />
                 </div>
              )}

              <div className="flex flex-col gap-2.5 pt-2">
                 <Button 
                   onClick={onUpdate} 
                   disabled={isSaving} 
                   className="w-full h-12 rounded-xl font-bold text-xs uppercase tracking-wider bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 transition-all active:scale-[0.98]"
                 >
                    {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : "Save Status"}
                 </Button>

                 {order.status !== 'successful' && (
                    <Button 
                      onClick={() => onManualSuccess(order.id)} 
                      disabled={isSaving} 
                      className="w-full h-12 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#10B981] hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98] gap-2"
                    >
                       {isSaving ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={16} /> Successfully</>}
                    </Button>
                 )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-3">
                 <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quick Operations</p>
                 <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      onClick={handleCopyReceipt} 
                      className="h-11 rounded-xl font-bold uppercase text-xs gap-2 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                       <Copy size={15} /> Receipt
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleWhatsApp} 
                      className="h-11 rounded-xl font-bold uppercase text-xs gap-2 text-emerald-600 border-emerald-200/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                    >
                       <MessageCircle size={15} /> Contact
                    </Button>
                 </div>
              </div>
           </div>
        </div>
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
  const seller = allUsers.find((u: any) => u.uid === post.uid);
  const claimants = Object.values(post.claimants || {});
  const { updateAccountPostStatus } = useApp();

  const pendingClaims = claimants.filter((c: any) => c.status === 'pending');
  const claimTime = pendingClaims.length > 0 ? Math.min(...pendingClaims.map((c: any) => {
    const t = Number(c.timestamp);
    return isNaN(t) ? Infinity : t;
  })) : null;
  const isStalling = claimTime && claimTime !== Infinity && (now - claimTime) >= 3600000 && !post.sellerReported && !post.sold && !post.warningDismissedAt;

  const waitValue = (claimTime && claimTime !== Infinity && !post.sellerReported && !post.sold) 
    ? safeFormatDistanceToNow(claimTime) 
    : "None";

  const handleForceSold = (uid: string) => {
    updateAccountPostStatus(post.id, 'sold', uid);
    toast({ title: "Account assigned to buyer!" });
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
                  <p className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-white/60 mb-0.5">Final Buyer</p>
                  <div className="flex items-center gap-1.5 min-w-0">
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
                  <p className="text-white/80 text-[10px] md:text-sm font-bold mt-1 uppercase tracking-widest">Action Required Immediately</p>
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
                  Suspension (3D)
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
                         ABOUT {safeFormatDistanceToNow(post.createdAt)} AGO
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

       <Card className="rounded-[2.5rem] md:rounded-[3rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
          <div className="p-6 md:p-10 space-y-8">
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
                      {post.processedBy?.photoURL ? (
                        <Image src={post.processedBy.photoURL} alt={post.processedBy.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center font-bold text-slate-300 text-3xl md:text-5xl">O</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="min-w-0 space-y-1">
                    <p className="text-[9px] md:text-xs font-black text-primary uppercase tracking-[0.2em] mb-0.5">Handling Admin</p>
                    <h5 className="text-xl md:text-4xl font-headline font-bold text-slate-900 dark:text-white truncate max-w-[150px] md:max-w-md">
                      {post.approvedBy === 'auto_sms' ? 'Auto-SMS Match' : post.processedBy?.name || "Wali lama furin"}
                    </h5>
                    {post.processedAt && (
                      <div className="flex items-center gap-1.5 text-muted-foreground justify-start">
                         <Clock size={12} className="opacity-40" />
                         <p className="text-[8px] md:text-xs font-bold uppercase tracking-tight">
                            {safeFormatDistanceToNow(post.processedAt)} ago
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
                        {post.completedAt && !isNaN(new Date(post.completedAt).getTime()) ? format(new Date(post.completedAt), "MMM d, yyyy") : "---"}
                     </p>
                     <p className="text-xs md:text-lg font-bold text-primary">
                        {post.completedAt && !isNaN(new Date(post.completedAt).getTime()) ? format(new Date(post.completedAt), "HH:mm") : "PENDING..."}
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
                               {(allUsers || []).map((u: any) => (
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
                   className="w-full h-16 md:h-24 rounded-[2rem] font-black text-xl md:text-2xl uppercase tracking-tight md:tracking-widest shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all"
                >
                   {isSaving ? <Loader2 className="animate-spin w-8 h-8" /> : "Save Listing"}
                </Button>
             </div>
          </div>
       </Card>
    </div>
  );
}

function SideNavItem({ active, expanded, onClick, icon: Icon, label, className, badge, badgeVariant = 'destructive' }: { active: boolean, expanded: boolean, onClick: () => void, icon: any, label: string, className?: string, badge?: number, badgeVariant?: 'primary' | 'destructive' }) {
  return (
    <button onClick={onClick} className={cn("w-full h-12 flex items-center transition-all duration-300 rounded-xl relative group", active ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800", expanded ? "px-4 gap-4" : "justify-center", className)}>
      <Icon size={20} className={cn("shrink-0 transition-transform group-hover:scale-110", active ? "stroke-[2.5px]" : "")} />
      {expanded && <span className="font-bold text-[13px] uppercase tracking-wider whitespace-nowrap overflow-hidden flex-1 text-left">{label}</span>}
      {badge !== undefined && badge > 0 && (
        <span className={cn(
          "text-white text-[10px] font-black rounded-full flex items-center justify-center transition-all", 
          expanded ? "px-2.5 py-0.5" : "absolute top-1 right-1 w-4 h-4",
          badgeVariant === 'primary' ? "bg-primary" : "bg-red-500"
        )}>
          {badge}
        </span>
      )}
    </button>
  );
}

function StatCard({ label, value, icon: Icon, color, bgColor, pulse }: { label: string, value: string, icon: any, color: string, bgColor: string, pulse?: boolean }) {
  return (
    <Card className="rounded-[1.5rem] p-5 border-none shadow-lg bg-white dark:bg-slate-900 group hover:-translate-y-1 transition-all">
      <div className={cn("w-10 h-10 md:w-14 md:h-14 rounded-xl flex items-center justify-center mb-4 md:mb-6 shadow-sm transition-transform group-hover:scale-110 relative", bgColor, color)}>
         <Icon size={24} className="md:size-7" />
         {pulse && <div className="absolute inset-0 bg-inherit rounded-xl animate-ping opacity-20" />}
      </div>
      <h3 className="text-xl md:text-3xl font-headline font-bold text-slate-900 dark:text-white mb-0.5 md:mb-1 truncate">{value}</h3>
      <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    processing: "bg-blue-100 text-blue-700",
    successful: "bg-green-100 text-green-700",
    holding: "bg-indigo-100 text-indigo-700",
    cancelled: "bg-red-100 text-red-700",
    rejected: "bg-red-100 text-red-700",
    sold: "bg-slate-900 text-white"
  };
  return <Badge className={cn("rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-widest border-none", colors[status] || colors.pending)}>{status}</Badge>;
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

function DetailRow({ label, value, color }: { label: string, value: string, color?: string }) {
   return (
      <div className="flex justify-between items-center text-[10px] font-black uppercase">
         <span className="text-slate-400">{label}</span>
         <span className={cn(color || 'text-slate-600 dark:text-slate-300')}>{value}</span>
      </div>
   );
}

function SettingInput({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  type = "text",
  icon: Icon,
  hint,
  description,
  rightElement,
  className,
  disabled
}: { 
  label: string, 
  value: string, 
  onChange: (v: string) => void, 
  placeholder: string, 
  type?: string,
  icon?: any,
  hint?: string,
  description?: string,
  rightElement?: React.ReactNode,
  className?: string,
  disabled?: boolean
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const actualType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={cn("space-y-2 group/input", className)}>
       <div className="flex items-center justify-between ml-1">
         <Label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
           {Icon && <Icon className="w-3.5 h-3.5 text-primary/80" />}
           {label}
         </Label>
         {hint && <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{hint}</span>}
       </div>
       <div className="relative flex items-center">
         <Input 
           type={actualType} 
           placeholder={placeholder} 
           value={value} 
           disabled={disabled}
           onChange={e => onChange(e.target.value)} 
           className={cn(
             "h-12 md:h-14 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-slate-800/80 font-bold px-4 md:px-5 shadow-inner text-sm md:text-base text-slate-900 dark:text-white focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-white dark:focus-visible:bg-slate-900 transition-all placeholder:text-slate-400/70",
             isPassword && "pr-12",
             rightElement && "pr-24"
           )} 
         />
         {isPassword && (
           <button
             type="button"
             onClick={() => setShowPassword(!showPassword)}
             className="absolute right-3 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
           >
             {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
           </button>
         )}
         {rightElement && (
           <div className="absolute right-2 flex items-center">
             {rightElement}
           </div>
         )}
       </div>
       {description && (
         <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium ml-1 leading-snug">{description}</p>
       )}
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
             <h4 className="font-headline font-bold text-2xl md:text-4xl uppercase tracking-tighter text-slate-900 dark:text-white leading-none">{event.title}</h4>
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
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="truncate font-semibold text-base md:text-xl max-w-[180px]">{winnerProfile.name}</p>
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
             <div className="space-y-0.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Qiimaha asalka</p>
                <div className="flex items-center gap-2">
                   <span className="text-primary font-black text-2xl md:text-4xl">$</span>
                   <span className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{event.initialPrice}</span>
                </div>
             </div>
             <div className="space-y-0.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Ka qeeybalayaal</p>
                <div className="flex items-center justify-center gap-3">
                   <Users className="text-slate-300 w-6 h-6 md:w-8 md:h-8" />
                   <span className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{event.participantsCount || 0}</span>
                </div>
             </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 md:gap-4 pt-2">
             <button 
               onClick={onEdit}
               className="rounded-2xl h-12 md:h-16 px-4 md:px-6 border-2 font-bold gap-2 text-xs md:sm active:scale-95 transition-all flex items-center justify-center bg-transparent border-slate-200 dark:border-white/10"
             >
                <Edit className="w-4 h-4 md:w-5 md:h-5 text-blue-50" />
                <span>Edit</span>
             </button>
             
             <button 
               onClick={onViewParticipants}
               className="rounded-2xl h-12 md:h-16 px-4 md:px-6 bg-slate-50 dark:bg-slate-800 border-none font-bold gap-2 text-xs md:sm active:scale-95 transition-all flex items-center justify-center"
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
       <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ArrowLeft size={24}/></button>
          <div>
             <h3 className="font-headline font-bold text-2xl uppercase tracking-tight">{eventAccount?.title}</h3>
             <p className="text-[10px] font-black text-muted-foreground uppercase">Real-time Participants List</p>
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
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Avatar className="w-10 h-10 border-2 border-white dark:border-slate-700 shadow-sm shrink-0">
                                  <AvatarImage src={p.avatar} />
                                  <AvatarFallback>{p.name?.[0]}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <p className="truncate font-semibold text-sm max-w-[120px]">{p.name}</p>
                                    {p.isVerified && <VerifiedBadge />}
                                  </div>
                                  <p className="text-[9px] text-muted-foreground font-black">{p.phone}</p>
                              </div>
                            </div>
                        </TableCell>
                        <TableCell className="font-bold text-lg">{p.taps}</TableCell>
                        <TableCell className="font-bold text-lg text-primary">${p.value.toFixed(2)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-medium">{safeFormatDistanceToNow(p.lastTapTime, { addSuffix: true })}</TableCell>
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

