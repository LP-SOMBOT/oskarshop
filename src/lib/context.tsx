"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  useUser, 
  useAuth, 
  useDatabase
} from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { 
  ref, 
  onValue, 
  push, 
  set, 
  query, 
  orderByChild, 
  equalTo,
  update,
  remove,
  limitToLast,
  increment,
  off,
  get,
  runTransaction
} from 'firebase/database';
import { toast } from '@/hooks/use-toast';
import { type GamePackage } from './games-data';

export const safeGet = (obj: any, path: string, fallback: any = "") => {
  return path.split('.').reduce((acc, key) => acc?.[key] ?? fallback, obj);
};

type Game = {
  id: string;
  title: string;
  icon: string;
  category: 'top-up' | 'accounts';
  createdAt: number;
};

type CartItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
  gameId: string;
  thumbnail?: string;
  details?: Record<string, string>;
};

type Order = {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'successful' | 'cancelled';
  cancellationReason?: string;
  createdAt: number;
  processedAt?: number;
  completedAt?: number;
  paymentMethod: string;
  gameDetails?: any;
  buyerOutcome?: 'bought' | 'not_bought';
  processedBy?: {
    uid: string;
    name: string;
    photoURL?: string;
  };
};

type AccountPost = {
  id: string;
  uid: string;
  authorName: string;
  authorAvatar?: string;
  gameType: 'freefire' | 'bloodstrike';
  platform: string;
  level: number;
  accountId?: string;
  accountName?: string;
  age?: string;
  primeLevel?: number;
  items?: string[];
  evoWeapons?: number;
  totalWeapons?: number;
  emotes?: number;
  executionEmotes?: number;
  arrivalEmotes?: number;
  dharka?: number;
  price: number;
  fee: number;
  totalCharge: number;
  thumbnailUrl: string;
  imageUrls: string[];
  phone: string;
  senderNumber?: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'holding' | 'sold';
  holdingBy?: string;
  boughtBy?: string;
  buyerReported?: boolean;
  buyerReportedAt?: number;
  sellerReported?: boolean;
  sellerReportedAt?: number;
  conflict?: boolean;
  createdAt: number;
  processedAt?: number;
  completedAt?: number;
  expiresAt?: number;
  term?: 'weekly' | 'monthly';
  views: number;
  sold: boolean;
  adminMessage?: string;
  hiddenFromMarket?: boolean;
  sellerSeenDeletionAt?: number;
  claimants?: Record<string, {
    uid: string;
    name: string;
    whatsapp: string;
    photo?: string;
    timestamp: number;
    status?: 'pending' | 'accepted' | 'rejected';
  }>;
  processedBy?: {
    uid: string;
    name: string;
    photoURL?: string;
  };
};

type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: number;
  linkTo: string;
  icon?: string;
  isAdminOnly?: boolean;
  readBy?: Record<string, boolean>;
};

type GameEvent = {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  thumbnailUrl: string;
  type: 'freefire_event' | 'general';
  active: boolean;
  expiresAt?: number;
  createdAt: number;
};

type Banner = {
  id: string;
  imageUrl: string;
  linkTo?: string;
  active: boolean;
  createdAt: number;
};

type PaymentMethod = {
  id: string;
  name: string;
  icon: string;
  ussdTemplate: string;
  active: boolean;
};

type StoreSettings = {
  isLive: boolean;
  announcementTicker?: string;
  logo?: string;
  paymentNumber?: string;
  onboardingImages?: string[];
  sliderImages?: string[]; 
  paymentMethods?: Record<string, PaymentMethod>;
  termsAndConditions?: {
    en?: string;
    so?: string;
  };
  appStatus?: {
    offline: boolean;
    offlineTitle?: string;
    offlineBody?: string;
    offlineImageUrl?: string;
  };
  helpLinks?: {
    tutorialUrl?: string;
    whatsappNumber?: string;
    tiktokUrl?: string;
  };
  config?: {
    shop?: {
      feeType: 'percentage' | 'fixed';
      feeValue: number;
      listingFee?: number;
      listingFeeFreeFire?: number;
      listingFeeBloodStrike?: number;
      listingFeeWeekly?: number;
      listingFeeMonthly?: number;
    };
    adminSettings?: {
      pin: string;
    };
  };
};

type UserProfile = {
  uid: string;
  email: string;
  name: string;
  role: 'user' | 'staff' | 'admin' | 'super_admin';
  points: number;
  createdAt: number;
  lastActive?: number;
  photoURL?: string;
  gameName?: string;
  gameUid?: string;
  phoneNumber?: string;
  banned?: boolean;
  termsAccepted?: boolean;
};

type BannedInfo = {
  name: string;
  uid: string;
  phone: string;
};

type Language = 'so' | 'en';

type AppContextType = {
  user: any;
  loading: boolean;
  isGlobalLoading: boolean;
  isInitialLoading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setGlobalLoading: (loading: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, phone: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  handleForgotPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  buyNow: (item: Omit<CartItem, 'quantity'>) => void;
  orders: Order[];
  allOrders: Order[];
  games: Game[];
  products: GamePackage[];
  allUsers: UserProfile[];
  accountPosts: AccountPost[];
  notifications: AppNotification[];
  adminNotifications: AppNotification[];
  events: GameEvent[];
  banners: Banner[];
  createOrder: (paymentMethod: string, gameDetails: any, directItem: CartItem) => Promise<void>;
  postAccount: (data: Partial<AccountPost>) => Promise<void>;
  updateAccountPost: (postId: string, data: Partial<AccountPost>) => Promise<void>;
  renewAccountPost: (postId: string, term: 'weekly' | 'monthly') => Promise<void>;
  deleteAccountPost: (postId: string) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  buyAccountPost: (post: AccountPost) => void;
  markNotificationsAsRead: (notifId?: string) => Promise<void>;
  markAdminNotificationsAsRead: (notifId?: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: string, cancellationReason?: string) => Promise<void>;
  updateAccountPostStatus: (postId: string, status: string, boughtBy?: string) => Promise<void>;
  reportAccountOutcome: (postId: string, outcome: 'bought' | 'not_bought') => Promise<void>;
  respondToSaleReport: (postId: string, confirmed: boolean, buyerId?: string) => Promise<void>;
  enforceAccountAction: (postId: string, action: 'delete' | 'holding' | 'approved' | 'pending', message: string) => Promise<void>;
  markDeletionAsSeen: (postId: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  manageUser: (uid: string, updates: Partial<UserProfile>) => Promise<void>;
  deleteUser: (uid: string) => Promise<void>;
  saveGame: (game: Partial<Game>) => Promise<void>;
  deleteGame: (id: string) => Promise<void>;
  saveProduct: (product: Partial<GamePackage>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  saveEvent: (event: Partial<GameEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  saveBanner: (banner: Partial<Banner>) => Promise<void>;
  deleteBanner: (id: string) => Promise<void>;
  savePaymentMethod: (method: Partial<PaymentMethod>) => Promise<void>;
  deletePaymentMethod: (id: string) => Promise<void>;
  storeSettings: StoreSettings;
  updateStoreSettings: (settings: any) => Promise<void>;
  broadcastNotification: (title: string, body: string, target?: string) => Promise<void>;
  broadcastAdminNotification: (title: string, body: string, skipPush?: boolean) => Promise<void>;
  messages: any[];
  allChatSessions: any[];
  chatTargetId: string | null;
  setChatTargetId: (uid: string | null) => void;
  sendMessage: (text?: string, imageUrl?: string, targetUserId?: string) => Promise<void>;
  markMessagesAsRead: (targetUserId?: string) => Promise<void>;
  refreshAdminData: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isBannedModalOpen: boolean;
  setIsBannedModalOpen: (open: boolean) => void;
  bannedInfo: BannedInfo | null;
  isPostingAccount: boolean;
  setIsPostingAccount: (isPosting: boolean) => void;
  acceptTerms: () => Promise<void>;
  language: Language;
  setLanguage: (lang: Language) => void;
  userProfile: UserProfile | null;
  t: (key: string) => string;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const USER_CACHE_KEY = 'oskar_user_cache';
const SETTINGS_CACHE_KEY = 'oskar_settings_cache';
const PRODUCTS_CACHE_KEY = 'oskar_products_cache';
const GAMES_CACHE_KEY = 'oskar_games_cache';
const EVENTS_CACHE_KEY = 'oskar_events_cache';
const BANNERS_CACHE_KEY = 'oskar_banners_cache';
const THEME_CACHE_KEY = 'oskar_theme_cache';
const LANG_CACHE_KEY = 'oskar_lang_cache';

const translations: Record<Language, Record<string, string>> = {
  en: {
    home: "Home",
    games: "Games",
    accounts: "Accounts",
    orders: "Orders",
    profile: "Profile",
    chat: "Chat",
    notifications: "Alerts",
    ranking: "Ranking",
    my_accounts: "My accounts",
    sell_account: "Sell/buy an account",
    leaderboard: "Leaderboard",
    logout: "Log Out",
    language: "Language",
    dark_mode: "Dark Mode",
    light_mode: "Light Mode",
    update_profile: "Update Profile",
    store_marketplace: "Store & Marketplace",
    support_center: "Support Center",
    global_settings: "Global Settings",
    app_tutorial: "App Tutorial",
    whatsapp_support: "WhatsApp Support",
    tiktok: "Oskar TikTok",
    points: "POINTS",
    rank: "RANK",
    admin_hub: "Oskar Admin Hub",
    restricted_access: "Restricted Access",
    manage_orders: "Manage orders, listings, and users.",
    no_orders: "No orders found",
    no_orders_desc: "Your top-up and account purchases will appear here once you place them.",
    continue_shopping: "Continue Shopping",
    player_id: "Player ID",
    game_name: "Game Name",
    sender_no: "Sender No",
    whatsapp: "WhatsApp",
    seller: "Seller",
    platform: "Platform",
    final_amount: "Final Amount",
    verifying_payment: "Verifying Payment...",
    delivering_diamonds: "Delivering Diamonds...",
    delivered_success: "Successfully Delivered!",
    order_cancelled: "Order Cancelled",
    admin_message: "Admin Message",
    buy_now: "Buy Now",
    login_to_buy: "Login to Buy",
    select_game: "Select Game",
    active_events: "Active Events 🔥",
    take_advantage: "Take advantage before it ends!",
    ranking_desc: "Make purchases to enter the top ranks and get discounts up to 3%. Each top-up purchase earns you 1 point (pts). More gifts coming soon I.a.",
    view: "View",
    time_left: "Time Left",
    buy_button: "BUY",
    terms_of_service: "Terms & Conditions",
    read_terms: "Read Terms",
    photo_updated: "Profile photo updated!",
    terms_welcome: "Welcome to Oskar Shop. To ensure a safe and secure environment for all gamers, please review our Terms and Conditions before proceeding.",
    compliance_protocol: "Compliance protocol",
    forgot_password: "Forgot Password?",
    reset_password: "Reset Password",
    reset_email_sent: "Check your email for the reset link.",
    enter_reset_email: "Enter your email to receive a password reset link."
  },
  so: {
    home: "Hoyga",
    games: "Ciyaaraha",
    accounts: "Suuqa",
    orders: "Dalabaadka",
    profile: "Profile",
    chat: "Sheeko",
    notifications: "Ogeysiis",
    ranking: "Darajo",
    my_accounts: "Account-yadayda",
    sell_account: "iibi/iibso account",
    leaderboard: "Kala horeynta",
    logout: "Ka Bax",
    language: "Luqadda",
    dark_mode: "Habka Mugdiga",
    light_mode: "Habka Iftiinka",
    update_profile: "Cusbooneysii Profile",
    store_marketplace: "Bakhaarka & Suuqa",
    support_center: "Xarunta Caawinta",
    global_settings: "Settings-ka Guud",
    app_tutorial: "Barashada App-ka",
    whatsapp_support: "WhatsApp Caawinaad",
    tiktok: "Oskar TikTok",
    points: "PTS",
    rank: "KAALINTA",
    admin_hub: "Maamulka Oskar",
    restricted_access: "Galan gaar ah",
    manage_orders: "Maamul dalabaadka iyo suuqa.",
    no_orders: "Dalabaad ma jiraan",
    no_orders_desc: "Dalabaadkaaga halkaan ayay ka muuqan doonaan markaad dalab sameyso.",
    continue_shopping: "Sii wad adeegashada",
    player_id: "Game ID-ga",
    game_name: "Magaca Game-ka",
    sender_no: "Lacag Diraha",
    whatsapp: "WhatsApp",
    seller: "Iibiyaha",
    platform: "Platform",
    final_amount: "Wadarta Guud",
    verifying_payment: "Lacagta ayaa la hubinayaa...",
    delivering_diamonds: "Dheemanka ayaa laguu soo dirayaa...",
    delivered_success: "Si guul ah ayaa loo gudbiyey!",
    order_cancelled: "Dalabka waa la kansalay",
    admin_message: "Fariinta Admin-ka",
    buy_now: "IIBSO",
    login_to_buy: "Galan si aad u iibsato",
    select_game: "Dooro Game ka",
    active_events: "Active Events 🔥",
    take_advantage: "Ka faa'ideeyso intuusan dhamaan!",
    ranking_desc: "iib sameey Si aad u gasho kaalmaha hore una heshid discount gaaraya ilaa %3, halkii iibin top up waxaad Ku heleesaa 1 points (pts). Hadiyado kalena coming soon I.a.",
    view: "Eeg",
    time_left: "Waqtiga haray",
    buy_button: "iibso",
    terms_of_service: "Sharuudaha Iyo qawaaniinta",
    read_terms: "Akhri Shuruudaha",
    photo_updated: "Sawirka waa la soo geliyey!",
    terms_welcome: "Ku soo dhawaada Oskar Shop. Si loo damaanad qaado deegaan ammaan ah dhammaan ciyaartoyda, fadlan dib u eeg Shuruudaha iyo Qawaaniinta ka hor intaadan sii socon.",
    compliance_protocol: "Hab-maamuuska u hoggaansanaanta",
    forgot_password: "Ma ilaawday password-ka?",
    reset_password: "Bedel Password-ka",
    reset_email_sent: "Ka hubi email-kaaga linkiga bedelaada.",
    enter_reset_email: "Geli email-kaaga si lagugu soo diro linkiga bedelaada."
  }
};

const getCache = (key: string, fallback: any = null) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
};

const setCache = (key: string, data: any) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        localStorage.removeItem(PRODUCTS_CACHE_KEY);
        localStorage.removeItem(EVENTS_CACHE_KEY);
        localStorage.removeItem(BANNERS_CACHE_KEY);
        try {
          if (key === SETTINGS_CACHE_KEY || key === USER_CACHE_KEY || key === THEME_CACHE_KEY || key === LANG_CACHE_KEY) {
            localStorage.setItem(key, JSON.stringify(data));
          }
        } catch {}
      }
    }
  }
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const auth = useAuth();
  const rtdb = useDatabase();
  const router = useRouter();
  const pathname = usePathname();
  
  const [activeTab, setActiveTabState] = useState('home');
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => getCache(THEME_CACHE_KEY, 'light'));
  const [language, setLanguageState] = useState<Language>(() => getCache(LANG_CACHE_KEY, 'so'));
  
  const [isBannedModalOpen, setIsBannedModalOpen] = useState(false);
  const [bannedInfo, setBannedInfo] = useState<BannedInfo | null>(null);
  const [isPostingAccount, setIsPostingAccount] = useState(false);

  const [syncStatus, setSyncStatus] = useState({
    settings: false,
    products: false,
    accPosts: false,
    events: false,
    banners: false,
    allUsers: false,
    games: false
  });

  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => getCache(SETTINGS_CACHE_KEY, {}));
  const [games, setGames] = useState<Game[]>(() => getCache(GAMES_CACHE_KEY, []));
  const [products, setProducts] = useState<GamePackage[]>(() => getCache(PRODUCTS_CACHE_KEY, []));
  const [accountPosts, setAccountPosts] = useState<AccountPost[]>([]);
  const [events, setEvents] = useState<GameEvent[]>(() => getCache(EVENTS_CACHE_KEY, []));
  const [banners, setBanners] = useState<Banner[]>(() => getCache(BANNERS_CACHE_KEY, []));
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => getCache(USER_CACHE_KEY));
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<AppNotification[]>([]);
  const [chatTargetId, setChatTargetId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [allChatSessions, setAllChatSessions] = useState<any[]>([]);

  const sessionStartTime = useRef(Date.now());
  const lastNotifiedRef = useRef<Set<string>>(new Set());

  // Handle Auth Redirect Result immediately after return
  useEffect(() => {
    if (!auth || !rtdb) return;

    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          setIsGlobalLoading(true);
          const googleUser = result.user;
          const userRef = ref(rtdb, `users/${googleUser.uid}`);
          const snapshot = await get(userRef);
          
          if (!snapshot.exists()) {
            const localAccepted = typeof window !== 'undefined' && localStorage.getItem('oskar_terms_accepted') === 'true';
            const profile: UserProfile = { 
              uid: googleUser.uid, 
              email: googleUser.email || "", 
              name: googleUser.displayName || "Gamer", 
              role: 'user', 
              points: 0, 
              createdAt: Date.now(),
              termsAccepted: localAccepted,
              photoURL: googleUser.photoURL || ""
            };
            await set(userRef, profile);
            setUserProfile(profile);
            setCache(USER_CACHE_KEY, profile);
          }
          toast({ title: "Authorized!", description: "Welcome to Oskar Shop." });
          setIsGlobalLoading(false);
          router.push('/');
        }
      })
      .catch((error) => {
        if (error.code !== 'auth/no-auth-event') {
          console.error("Auth redirect error:", error);
          toast({ variant: "destructive", title: "Authorization Failed", description: error.message });
          setIsGlobalLoading(false);
        }
      });
  }, [auth, rtdb, router]);

  // Heartbeat to track presence
  useEffect(() => {
    if (!rtdb || !user) return;
    const userRef = ref(rtdb, `users/${user.uid}`);
    const updatePresence = () => {
      update(userRef, { lastActive: Date.now() });
    };
    updatePresence();
    const interval = setInterval(updatePresence, 300000); // Every 5 minutes
    return () => clearInterval(interval);
  }, [rtdb, user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    setCache(THEME_CACHE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setCache(LANG_CACHE_KEY, lang);
    toast({ title: lang === 'en' ? "Language changed to English" : "Luqadda waxaa loo baddalay Somali" });
  };

  const t = useCallback((key: string) => {
    return translations[language][key] || key;
  }, [language]);

  const isInitialLoading = useMemo(() => {
    return !syncStatus.settings || !syncStatus.products || !syncStatus.banners || !syncStatus.events || !syncStatus.games;
  }, [syncStatus]);

  const showPushNotification = useCallback((title: string, body: string, id: string) => {
    if (typeof window === 'undefined') return;
    if (lastNotifiedRef.current.has(id)) return;
    lastNotifiedRef.current.add(id);
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    const logo = storeSettings.logo || "https://placehold.co/192x192/0EA5E9/FFFFFF/png?text=O";
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon: logo,
          badge: logo,
          tag: id,
          vibrate: [200, 100, 200],
          requireInteraction: true
        });
      }).catch(() => {
        new Notification(title, { body, icon: logo });
      });
    } else {
      new Notification(title, { body, icon: logo });
    }
  }, [storeSettings.logo]);

  useEffect(() => {
    const handleHash = () => {
      const rawHash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
      const tabName = rawHash.split('-')[0];
      const validTabs = ['home', 'games', 'accounts', 'ranking', 'profile', 'chat', 'notifications', 'orders', 'my-accounts'];
      if (validTabs.includes(tabName)) setActiveTabState(tabName);
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      const isSpecialFlow = pathname === "/checkout" || pathname === "/checkout-account" || pathname.startsWith("/accounts/") || pathname.startsWith("/events/") || pathname === "/terms";
      if (isSpecialFlow || pathname !== '/') {
        router.push(tab === 'home' ? '/' : `/#${tab}`);
      } else {
        window.location.hash = tab === 'home' ? '' : tab;
      }
    }
  }, [pathname, router]);

  useEffect(() => {
    if (!rtdb) return;
    
    const settingsRef = ref(rtdb, 'settings');
    const gamesRef = ref(rtdb, 'games');
    const productsRef = ref(rtdb, 'products');
    const accPostsRef = ref(rtdb, 'accountPosts');
    const eventsRef = ref(rtdb, 'events');
    const bannersRef = ref(rtdb, 'banners');
    const usersRef = ref(rtdb, 'users');

    onValue(settingsRef, (s) => {
      const data = s.val() || {};
      if (syncStatus.settings) {
        if (data.isLive && !storeSettings.isLive) showPushNotification("Oskar is LIVE Now! 🔴", "Join us on TikTok for exclusive rewards and diamonds!", "live-ticker-" + Date.now());
        if (data.appStatus?.offline === false && storeSettings.appStatus?.offline === true) showPushNotification("Oskar Shop is Online! ✅", "We are back! You can now resume your top-ups and purchases.", "online-alert-" + Date.now());
      }
      setStoreSettings(data);
      setCache(SETTINGS_CACHE_KEY, data);
      setSyncStatus(prev => ({ ...prev, settings: true }));
    });

    onValue(gamesRef, (s) => {
      const data = s.val() ? Object.entries(s.val()).map(([id, v]: any) => ({ ...v, id })) : [];
      setGames(data);
      setCache(GAMES_CACHE_KEY, data);
      setSyncStatus(prev => ({ ...prev, games: true }));
    });

    onValue(productsRef, (s) => {
      const data = s.val() ? Object.entries(s.val()).map(([id, v]: any) => ({ ...v, id })) : [];
      setProducts(data);
      setCache(PRODUCTS_CACHE_KEY, data);
      setSyncStatus(prev => ({ ...prev, products: true }));
    });

    onValue(accPostsRef, (s) => {
      const data = s.val() ? Object.entries(s.val()).map(([id, v]: any) => ({ ...v, id })) : [];
      setAccountPosts(data);
      setSyncStatus(prev => ({ ...prev, accPosts: true }));
    });

    onValue(eventsRef, (s) => {
      const data = s.val() ? Object.entries(s.val()).map(([id, v]: any) => ({ ...v, id })).sort((a, b) => b.createdAt - a.createdAt) : [];
      setEvents(data);
      setCache(EVENTS_CACHE_KEY, data);
      setSyncStatus(prev => ({ ...prev, events: true }));
    });

    onValue(bannersRef, (s) => {
      const data = s.val() ? Object.entries(s.val()).map(([id, v]: any) => ({ ...v, id })) : [];
      setBanners(data);
      setCache(BANNERS_CACHE_KEY, data);
      setSyncStatus(prev => ({ ...prev, banners: true }));
    });

    onValue(usersRef, (s) => {
      if (s.val()) {
        const users = Object.entries(s.val()).map(([uid, v]: any) => ({ ...v, uid: v.uid || uid }));
        setAllUsers(users);
      } else setAllUsers([]);
      setSyncStatus(prev => ({ ...prev, allUsers: true }));
    });

    return () => {
      off(settingsRef); off(gamesRef); off(productsRef); off(accPostsRef); off(eventsRef); off(bannersRef); off(usersRef);
    };
  }, [rtdb, syncStatus.settings, storeSettings.isLive, storeSettings.appStatus?.offline, showPushNotification]);

  useEffect(() => {
    if (!rtdb || !user) {
      setUserProfile(null); setNotifications([]); setOrders([]);
      return;
    }
    const profileRef = ref(rtdb, `users/${user.uid}`);
    const notifsRef = query(ref(rtdb, `notifications/${user.uid}`), limitToLast(20));
    const userOrdersRef = query(ref(rtdb, 'orders'), orderByChild('userId'), equalTo(user.uid));

    onValue(profileRef, (s) => {
      const data = s.val();
      setUserProfile(data);
      if (data) {
        setCache(USER_CACHE_KEY, data);
        const isComplete = data.phoneNumber && data.gameUid && data.name;
        if (isComplete) {
          localStorage.setItem(`oskar_profile_complete_${user.uid}`, 'true');
        }
      }
      if (data?.banned) {
        setBannedInfo({
          name: data.name || "N/A",
          uid: data.uid || user.uid,
          phone: data.phoneNumber || "N/A"
        });
        setIsBannedModalOpen(true);
        logout();
      }
    });

    onValue(notifsRef, (s) => {
      const data = s.val() ? Object.entries(s.val()).map(([id, v]: any) => ({ ...v, id })).sort((a,b) => b.createdAt - a.createdAt) : [];
      if (data.length > 0) {
        const latest = data[0];
        if (!latest.read && latest.createdAt > sessionStartTime.current) showPushNotification(latest.title, latest.body, "oskar-notif-" + latest.id);
      }
      setNotifications(data);
    });

    onValue(userOrdersRef, (s) => {
      const data = s.val() ? Object.entries(s.val()).map(([id, v]: any) => ({ ...v, id })).sort((a,b) => b.createdAt - a.createdAt) : [];
      setOrders(data);
    });

    return () => {
      off(profileRef); off(notifsRef); off(userOrdersRef);
    };
  }, [rtdb, user, showPushNotification]);

  const enhancedUser = useMemo(() => {
    if (!user) return null;
    const role = userProfile?.role || 'user';
    return { ...user, ...userProfile, isAdmin: role === 'admin' || role === 'super_admin' || role === 'staff' };
  }, [user, userProfile]);

  useEffect(() => {
    if (!rtdb || !enhancedUser?.isAdmin) {
      if (allOrders.length > 0) setAllOrders([]);
      setAdminNotifications([]);
      return;
    }
    const allOrdersRef = ref(rtdb, 'orders');
    const chatIndexRef = ref(rtdb, 'chatIndex');
    const adminNotifsRef = query(ref(rtdb, 'adminNotifications'), limitToLast(30));

    onValue(allOrdersRef, (snapshot) => {
      const val = snapshot.val();
      if (val) setAllOrders(Object.entries(val).map(([id, v]: any) => ({ ...v, id })).sort((a, b) => b.createdAt - a.createdAt));
      else setAllOrders([]);
    });

    onValue(chatIndexRef, (snapshot) => {
      const val = snapshot.val();
      setAllChatSessions(val ? Object.entries(val).map(([userId, v]: any) => ({ userId, ...v })).sort((a,b) => b.lastTimestamp - a.lastTimestamp) : []);
    });

    onValue(adminNotifsRef, (snapshot) => {
      const data = snapshot.val() ? Object.entries(snapshot.val()).map(([id, v]: any) => ({ ...v, id })).sort((a,b) => b.createdAt - a.createdAt) : [];
      if (data.length > 0) {
        const latest = data[0];
        if (!latest.readBy?.[enhancedUser.uid] && latest.createdAt > sessionStartTime.current) {
          if (latest.type !== 'assignment_update') showPushNotification(latest.title, latest.body, "admin-push-" + latest.id);
        }
      }
      setAdminNotifications(data);
    });

    return () => {
      off(allOrdersRef); off(chatIndexRef); off(adminNotifsRef);
    };
  }, [rtdb, enhancedUser, showPushNotification]);

  const broadcastNotification = async (title: string, body: string, targetUid?: string) => {
    if (!rtdb) return;
    const uid = targetUid || user?.uid;
    if (!uid) return;
    const notifRef = push(ref(rtdb, `notifications/${uid}`));
    await set(notifRef, {
      title,
      body,
      type: 'broadcast',
      createdAt: Date.now(),
      read: false,
      linkTo: '#notifications'
    });
  };

  const broadcastAdminNotification = async (title: string, body: string, skipPush?: boolean) => {
    if (!rtdb) return;
    const adminNotifRef = push(ref(rtdb, 'adminNotifications'));
    await set(adminNotifRef, {
      title,
      body,
      type: 'broadcast',
      createdAt: Date.now(),
      readBy: {}
    });
  };

  const refreshAdminData = () => {
    if (!rtdb) return;
    get(ref(rtdb, 'orders')).then(s => {
      const val = s.val();
      if (val) setAllOrders(Object.entries(val).map(([id, v]: any) => ({ ...v, id })).sort((a,b) => b.createdAt - a.createdAt));
    });
  };

  const login = async (e: string, p: string) => {
    setIsGlobalLoading(true);
    try { await signInWithEmailAndPassword(auth, e, p); } finally { setIsGlobalLoading(false); }
  };

  const signup = async (e: string, p: string, n: string, ph: string) => {
    setIsGlobalLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, e, p);
      await updateProfile(cred.user, { displayName: n });
      
      const localAccepted = typeof window !== 'undefined' && localStorage.getItem('oskar_terms_accepted') === 'true';
      
      const profile: UserProfile = { 
        uid: cred.user.uid, 
        email: e, 
        name: n, 
        phoneNumber: ph, 
        role: 'user', 
        points: 0, 
        createdAt: Date.now(),
        termsAccepted: localAccepted 
      };
      await set(ref(rtdb, `users/${cred.user.uid}`), profile);
      setUserProfile(profile);
      setCache(USER_CACHE_KEY, profile);
    } finally { setIsGlobalLoading(false); }
  };

  const loginWithGoogle = async () => {
    setIsGlobalLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const standalone = typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;
      const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (standalone || isMobile) {
        await signInWithRedirect(auth, provider);
      } else {
        const result = await signInWithPopup(auth, provider);
        const googleUser = result.user;
        const userRef = ref(rtdb, `users/${googleUser.uid}`);
        const snapshot = await get(userRef);
        
        if (!snapshot.exists()) {
          const localAccepted = typeof window !== 'undefined' && localStorage.getItem('oskar_terms_accepted') === 'true';
          const profile: UserProfile = { 
            uid: googleUser.uid, 
            email: googleUser.email || "", 
            name: googleUser.displayName || "Gamer", 
            role: 'user', 
            points: 0, 
            createdAt: Date.now(),
            termsAccepted: localAccepted,
            photoURL: googleUser.photoURL || ""
          };
          await set(userRef, profile);
          setUserProfile(profile);
          setCache(USER_CACHE_KEY, profile);
        }
        toast({ title: "Welcome!", description: "Logged in with Google." });
        router.push('/');
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Login Failed", description: error.message });
      setIsGlobalLoading(false);
    }
  };

  const handleForgotPassword = async (email: string) => {
    if (!email) {
      toast({ variant: "destructive", title: "Required", description: "Please enter your email address." });
      return;
    }
    setIsGlobalLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: t('reset_password') || "Reset link sent!", description: t('reset_email_sent') || "Check your inbox for instructions." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsGlobalLoading(false);
    }
  };

  const logout = async () => {
    setIsGlobalLoading(true);
    try { 
      if (user) localStorage.removeItem(`oskar_profile_complete_${user.uid}`);
      localStorage.removeItem(USER_CACHE_KEY); 
      await signOut(auth); 
      router.push('/login'); 
    } finally { setIsGlobalLoading(false); }
  };

  const buyNow = (item: any) => {
    if (!user) {
      toast({ title: "Fadlan soo gal", description: "Waa inaad soo gashaa si aad wax u iibsato.", variant: "destructive" });
      router.push('/login');
      return;
    }
    router.push(`/checkout?id=${item.id}`);
  };

  const createOrder = async (paymentMethod: string, gameDetails: any, directItem: CartItem) => {
    if (!rtdb || !user) return;
    const counterRef = ref(rtdb, 'settings/orderCounter');
    let sequenceId = 10;
    try {
      const result = await runTransaction(counterRef, (currentValue) => {
        if (currentValue === null || typeof currentValue !== 'number' || currentValue < 10) return 10;
        return currentValue + 1;
      });
      if (result.committed) sequenceId = result.snapshot.val();
    } catch (e) { sequenceId = Date.now(); }
    const orderId = `iibinta${sequenceId}`;
    const newOrder: Order = { id: orderId, userId: user.uid, items: [directItem], total: directItem.price, status: 'pending', createdAt: Date.now(), paymentMethod, gameDetails };
    
    await set(ref(rtdb, `orders/${orderId}`), newOrder);
    await broadcastAdminNotification("New Order Received! 🛍️", `Order #${orderId.toUpperCase()} for ${directItem.title} is pending verification.`);
  };

  const postAccount = async (data: any) => {
    if (!rtdb || !user) return;
    const postRef = push(ref(rtdb, 'accountPosts'));
    await set(postRef, { ...data, uid: user.uid, authorName: enhancedUser?.name, authorAvatar: enhancedUser?.photoURL, status: 'pending', createdAt: Date.now(), expiresAt: null, views: 0, sold: false });
    toast({ title: "Successfully posted!", description: "Waiting for admin approval of listing fee payment." });
    await broadcastAdminNotification("New Account Post! 🎮", `${enhancedUser?.name} listed a ${data.gameType} account.`);
  };

  const updateAccountPost = async (postId: string, data: any) => {
    if (!rtdb) return;
    const { price, totalCharge, fee, ...editableData } = data;
    await update(ref(rtdb, `accountPosts/${postId}`), editableData);
    toast({ title: "Post Updated!" });
  };

  const renewAccountPost = async (postId: string, term: 'weekly' | 'monthly') => {
    if (!rtdb) return;
    await update(ref(rtdb, `accountPosts/${postId}`), { term, expiresAt: null, status: 'pending', sold: false, holdingBy: null, boughtBy: null, buyerReported: false, buyerReportedAt: null, sellerReported: false, sellerReportedAt: null, conflict: false, adminMessage: null, hiddenFromMarket: false, sellerSeenDeletionAt: null, claimants: null });
    toast({ title: "Renewal Initiated!", description: "Waiting for admin to verify renewal payment." });
  };

  const deleteAccountPost = async (pid: string) => { if (!rtdb) return; await remove(ref(rtdb, `accountPosts/${pid}`)); toast({ title: "Post Deleted" }); };
  const deleteOrder = async (oid: string) => { if (!rtdb) return; await remove(ref(rtdb, `orders/${oid}`)); toast({ title: "Order Deleted" }); };

  const buyAccountPost = (post: AccountPost) => {
    if (!user) {
      toast({ title: "Fadlan soo gal", description: "Waa inaad soo gashaa si aad u iibsato account-kan.", variant: "destructive" });
      router.push('/login');
      return;
    }
    router.push(`/checkout-account?id=${post.id}`);
  };

  const markNotificationsAsRead = async (nid?: string) => {
    if (!rtdb || !user) return;
    if (nid) await update(ref(rtdb, `notifications/${user.uid}/${nid}`), { read: true });
    else {
      const updates: any = {};
      notifications.forEach(n => updates[`notifications/${user.uid}/${n.id}/read`] = true);
      await update(ref(rtdb), updates);
    }
  };

  const markAdminNotificationsAsRead = async (nid?: string) => {
    if (!rtdb || !enhancedUser?.isAdmin) return;
    if (nid) await update(ref(rtdb, `adminNotifications/${nid}/readBy/${enhancedUser.uid}`), true);
    else {
      const updates: any = {};
      adminNotifications.forEach(n => updates[`adminNotifications/${n.id}/readBy/${enhancedUser.uid}`] = true);
      await update(ref(rtdb), updates);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string, cancellationReason?: string) => {
    if (!rtdb || !enhancedUser?.isAdmin) return;
    const updates: any = { status, processedBy: { uid: enhancedUser.uid, name: enhancedUser.name || "Admin", photoURL: enhancedUser.photoURL || "" }, processedAt: Date.now() };
    if (status === 'cancelled' && cancellationReason) updates.cancellationReason = cancellationReason;
    if (status === 'successful') {
      updates.completedAt = Date.now();
      const orderSnap = await get(ref(rtdb, `orders/${orderId}`));
      const orderData = orderSnap.val();
      if (orderData && orderData.userId) await update(ref(rtdb, `users/${orderData.userId}`), { points: increment(1) });
    }
    await update(ref(rtdb, `orders/${orderId}`), updates);
    const orderSnap = await get(ref(rtdb, `orders/${orderId}`));
    const orderData = orderSnap.val();
    if (orderData && orderData.userId) {
      const title = status === 'successful' ? "Diamonds Delivered! ✅" : status === 'cancelled' ? "Order Cancelled ❌" : "Order Update 📦";
      const body = status === 'successful' ? `Your order #${orderId.toUpperCase()} is complete!` : status === 'cancelled' ? `Order #${orderId.toUpperCase()} was cancelled: ${cancellationReason || 'Contact support'}` : `Order #${orderId.toUpperCase()} status is now: ${status}`;
      broadcastNotification(title, body, orderData.userId);
    }
  };

  const updateAccountPostStatus = async (postId: string, status: string, boughtBy?: string) => {
    if (!rtdb || !enhancedUser?.isAdmin) return;
    const updates: any = { status, processedBy: { uid: enhancedUser.uid, name: enhancedUser.name || "Admin", photoURL: enhancedUser.photoURL || "" }, processedAt: Date.now() };
    if (boughtBy) updates.boughtBy = boughtBy;
    if (status === 'sold') { updates.sold = true; updates.completedAt = Date.now(); }
    if (status === 'approved') {
      const postSnap = await get(ref(rtdb, `accountPosts/${postId}`));
      const postData = postSnap.val();
      const now = Date.now();
      const duration = postData?.term === 'monthly' ? (30 * 24 * 60 * 60 * 1000) : (7 * 24 * 60 * 60 * 1000);
      updates.expiresAt = now + duration;
      updates.createdAt = now;
    }
    await update(ref(rtdb, `accountPosts/${postId}`), updates);
    const postSnap = await get(ref(rtdb, `accountPosts/${postId}`));
    const postData = postSnap.val();
    if (postData && postData.uid) {
       const title = status === 'approved' ? "Post Approved! ✅" : status === 'rejected' ? "Post Rejected ❌" : "Listing Update 🎮";
       broadcastNotification(title, `Your account listing #${postId.toUpperCase()} is now ${status}.`, postData.uid);
    }
  };

  const reportAccountOutcome = async (postId: string, outcome: 'bought' | 'not_bought') => {
    if (!rtdb || !user || !enhancedUser) return;
    const postRef = ref(rtdb, `accountPosts/${postId}`);
    const postSnap = await get(postRef);
    const postData = postSnap.val();
    if (!postData) return;
    const targetOrder = orders.find(o => o.gameDetails?.postId === postId && o.userId === user.uid);
    if (outcome === 'not_bought') {
      const updates: any = {};
      if (postData.claimants?.[user.uid]) updates[`accountPosts/${postId}/claimants/${user.uid}`] = null;
      if (targetOrder) { updates[`orders/${targetOrder.id}/buyerOutcome`] = outcome; updates[`orders/${targetOrder.id}/status`] = 'cancelled'; }
      if (Object.keys(updates).length > 0) await update(ref(rtdb), updates);
    } else {
      const reportTime = Date.now();
      const claimantInfo = { uid: user.uid, name: enhancedUser.name || "Buyer", whatsapp: targetOrder?.gameDetails?.whatsappNumber || enhancedUser.phoneNumber || "N/A", photo: enhancedUser.photoURL || "", timestamp: reportTime, status: 'pending' };
      await update(ref(rtdb, `accountPosts/${postId}/claimants/${user.uid}`), claimantInfo);
      await update(postRef, { buyerReported: true, buyerReportedAt: reportTime });
      if (targetOrder) await update(ref(rtdb, `orders/${targetOrder.id}`), { buyerOutcome: outcome, gameDetails: { ...targetOrder.gameDetails, buyerReportedAt: reportTime } });
      toast({ title: "Report Sent!", description: "Seller has been notified to verify the sale." });
      if (postData.uid) broadcastNotification("New Purchase Claim! 💰", `A buyer reported they bought your ${postData.gameType} account. Please verify in My Accounts!`, postData.uid);
      await broadcastAdminNotification("Buyer Report!", `Buyer reported purchase for account #${postId.toUpperCase()}.`);
    }
  };

  const respondToSaleReport = async (postId: string, confirmed: boolean, buyerId?: string) => {
    if (!rtdb || !user) return;
    const postRef = ref(rtdb, `accountPosts/${postId}`);
    const postSnap = await get(postRef);
    const postData = postSnap.val();
    if (!postData || !buyerId) return;
    const updates: any = {};
    const reportTime = Date.now();
    updates[`accountPosts/${postId}/claimants/${buyerId}/status`] = confirmed ? 'accepted' : 'rejected';
    updates[`accountPosts/${postId}/sellerReported`] = true;
    updates[`accountPosts/${postId}/sellerReportedAt`] = reportTime;
    if (confirmed) {
      const hasPreviousRejections = Object.values(postData.claimants || {}).some(c => (c as any).status === 'rejected');
      const otherClaimantsCount = Object.keys(postData.claimants || {}).length - 1;
      if (hasPreviousRejections || otherClaimantsCount > 0) {
        updates[`accountPosts/${postId}/status`] = 'holding';
        updates[`accountPosts/${postId}/conflict`] = true;
        updates[`accountPosts/${postId}/boughtBy`] = buyerId;
        updates[`accountPosts/${postId}/holdingBy`] = buyerId;
      } else {
        updates[`accountPosts/${postId}/status`] = 'sold';
        updates[`accountPosts/${postId}/sold`] = true;
        updates[`accountPosts/${postId}/boughtBy`] = buyerId;
        updates[`accountPosts/${postId}/holdingBy`] = buyerId;
        updates[`accountPosts/${postId}/completedAt`] = reportTime;
        updates[`accountPosts/${postId}/claimants`] = null; 
      }
      toast({ title: "Response Recorded!", description: confirmed ? "Sale confirmed. Waiting for finalization." : "Claim rejected." });
      broadcastNotification("Purchase Update! 🤑", confirmed ? "Seller has accepted your purchase claim!" : "Seller rejected your purchase claim.", buyerId);
    } else {
      updates[`accountPosts/${postId}/status`] = 'holding';
      updates[`accountPosts/${postId}/conflict`] = true;
      toast({ title: "Claim Rejected", description: "This will be reviewed by an admin." });
      await broadcastAdminNotification("Conflict Detected! ⚠️", `Seller rejected buyer claim for account #${postId.toUpperCase()}.`);
    }
    await update(ref(rtdb), updates);
  };

  const enforceAccountAction = async (postId: string, action: 'delete' | 'holding' | 'approved' | 'pending', message: string) => {
    if (!rtdb || !enhancedUser?.isAdmin) return;
    const postRef = ref(rtdb, `accountPosts/${postId}`);
    const postSnap = await get(postRef);
    const postData = postSnap.val();
    if (!postData) return;
    const updates: any = { adminMessage: message, sellerReported: true, conflict: false, buyerReported: false, buyerReportedAt: null, claimants: null };
    if (action === 'delete') { updates.status = 'rejected'; updates.hiddenFromMarket = true; updates.sold = false; }
    else { updates.status = action; updates.hiddenFromMarket = false; }
    await update(postRef, updates);
    broadcastNotification("Admin Action Taken 👮", message, postData.uid);
    toast({ title: `Action "${action}" Applied` });
  };

  const markDeletionAsSeen = async (postId: string) => { if (!rtdb) return; await update(ref(rtdb, `accountPosts/${postId}`), { sellerSeenDeletionAt: Date.now() }); };

  const updateUserProfile = async (updates: any) => { 
    if (!rtdb || !user) return; 
    await update(ref(rtdb, `users/${user.uid}`), updates); 
    const isComplete = updates.phoneNumber && updates.gameUid && updates.name;
    if (isComplete) localStorage.setItem(`oskar_profile_complete_${user.uid}`, 'true');
    toast({ title: "Profile updated!" }); 
  };
  const manageUser = async (uid: string, updates: Partial<UserProfile>) => { if (!rtdb) return; await update(ref(rtdb, `users/${uid}`), updates); toast({ title: "User updated!" }); };
  const deleteUser = async (uid: string) => { if (!rtdb) return; await remove(ref(rtdb, `users/${uid}`)); toast({ title: "User account deleted." }); };

  const sendMessage = async (text?: string, imageUrl?: string, targetId?: string) => {
    if (!rtdb || !user) return;
    const tid = targetId || (enhancedUser?.isAdmin ? chatTargetId : user.uid);
    if (!tid) return;
    const msg: any = { senderId: user.uid, timestamp: Date.now(), isRead: false };
    if (text) msg.text = text; if (imageUrl) msg.imageUrl = imageUrl;
    await push(ref(rtdb, `chats/${tid}`), msg);
    await update(ref(rtdb, `chatIndex/${tid}`), {
      lastMessage: text || "📷 Screenshot",
      lastTimestamp: Date.now(),
      unreadCount: increment(1),
      userName: enhancedUser?.isAdmin ? (allChatSessions.find(s => s.userId === tid)?.userName || "User") : enhancedUser?.name,
      userPhoto: enhancedUser?.isAdmin ? (allChatSessions.find(s => s.userId === tid)?.userPhoto || "") : enhancedUser?.photoURL
    });
  };

  const markMessagesAsRead = async (tid?: string) => { if (!rtdb || !user) return; const id = tid || user.uid; await update(ref(rtdb, `chatIndex/${id}`), { unreadCount: 0 }); };

  const saveGame = async (g: any) => {
    if (!rtdb) return;
    const { id, ...data } = g;
    if (id) await update(ref(rtdb, `games/${id}`), data);
    else await push(ref(rtdb, 'games'), { ...data, createdAt: Date.now() });
  };

  const deleteGame = async (id: string) => {
    if (!rtdb) return;
    await remove(ref(rtdb, `games/${id}`));
    const associatedProducts = products.filter(p => p.gameId === id);
    const updates: any = {};
    associatedProducts.forEach(p => updates[`products/${p.id}`] = null);
    await update(ref(rtdb), updates);
  };

  const saveProduct = async (p: any) => {
    if (!rtdb) return;
    const { id, ...data } = p;
    const cleanData: any = {};
    Object.keys(data).forEach(key => {
      const val = data[key];
      if (val !== undefined && val !== null && val !== "" && !Number.isNaN(val)) cleanData[key] = val;
    });
    if (id) await update(ref(rtdb, `products/${id}`), cleanData);
    else await push(ref(rtdb, 'products'), cleanData);
  };

  const deleteProduct = async (id: string) => remove(ref(rtdb, `products/${id}`));
  
  const saveEvent = async (e: any) => { 
    if (!rtdb) return; 
    const { id, duration, durationUnit, ...data } = e;
    let expiresAt = data.expiresAt || null;
    if (duration && durationUnit) {
      const now = Date.now();
      const val = parseInt(duration);
      if (durationUnit === 'days') expiresAt = now + (val * 24 * 60 * 60 * 1000);
      else if (durationUnit === 'hours') expiresAt = now + (val * 60 * 60 * 1000);
      else if (durationUnit === 'minutes') expiresAt = now + (val * 60 * 1000);
    }
    const eventToSave = { ...data, expiresAt, createdAt: Date.now() };
    if (id) await update(ref(rtdb, `events/${id}`), eventToSave); 
    else await push(ref(rtdb, 'events'), eventToSave); 
  };

  const deleteEvent = async (id: string) => remove(ref(rtdb, `events/${id}`));

  const saveBanner = async (b: any) => { if (!rtdb) return; const { id, ...data } = b; if (id) await update(ref(rtdb, `banners/${id}`), data); else await push(ref(rtdb, 'banners'), { ...data, createdAt: Date.now(), active: true }); };
  const deleteBanner = async (id: string) => remove(ref(rtdb, `banners/${id}`));

  const savePaymentMethod = async (m: any) => {
    if (!rtdb) return;
    const { id, ...data } = m;
    if (id) await update(ref(rtdb, `settings/paymentMethods/${id}`), data);
    else { const newRef = push(ref(rtdb, 'settings/paymentMethods')); await set(newRef, { ...data, active: true }); }
    toast({ title: "Payment Method Saved" });
  };

  const deletePaymentMethod = async (id: string) => { if (!rtdb) return; await remove(ref(rtdb, `settings/paymentMethods/${id}`)); toast({ title: "Payment Method Removed" }); };
  const updateStoreSettings = async (s: any) => update(ref(rtdb, 'settings'), s);

  const acceptTerms = async () => {
    if (typeof window !== 'undefined') localStorage.setItem('oskar_terms_accepted', 'true');
    if (user && rtdb) try { await update(ref(rtdb, `users/${user.uid}`), { termsAccepted: true }); } catch (e) {}
  };

  return (
    <AppContext.Provider value={{ 
      user: enhancedUser, loading, isGlobalLoading, isInitialLoading, activeTab, setActiveTab, setGlobalLoading: setIsGlobalLoading,
      login, signup, loginWithGoogle, handleForgotPassword, logout, buyNow, orders, allOrders, games, products, allUsers, accountPosts, notifications, adminNotifications, events, banners,
      createOrder, postAccount, updateAccountPost, renewAccountPost, deleteAccountPost, deleteOrder, buyAccountPost, markNotificationsAsRead, markAdminNotificationsAsRead, updateOrderStatus, updateAccountPostStatus, reportAccountOutcome, respondToSaleReport, enforceAccountAction, markDeletionAsSeen,
      updateUserProfile, manageUser, deleteUser, saveGame, deleteGame, saveProduct, deleteProduct, saveEvent, deleteEvent, saveBanner, deleteBanner, savePaymentMethod, deletePaymentMethod, storeSettings, updateStoreSettings, 
      broadcastNotification, broadcastAdminNotification, messages, allChatSessions, chatTargetId, setChatTargetId, sendMessage, markMessagesAsRead, refreshAdminData,
      theme, toggleTheme, isBannedModalOpen, setIsBannedModalOpen, bannedInfo, isPostingAccount, setIsPostingAccount,
      acceptTerms, language, setLanguage, userProfile, t
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
