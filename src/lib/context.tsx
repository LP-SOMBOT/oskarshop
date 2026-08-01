"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  useUser, 
  useAuth, 
  useDatabase,
  useMessaging
} from '@/firebase';
import { 
  update,
  ref,
  onValue,
  push,
  set,
  query,
  orderByChild,
  equalTo,
  limitToLast,
  increment,
  off,
  get,
  runTransaction,
  remove
} from 'firebase/database';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { getToken, onMessage } from 'firebase/messaging';
import { toast } from '@/hooks/use-toast';
import { type GamePackage } from './games-data';
import { format } from 'date-fns';

export const safeGet = (obj: any, path: string, fallback: any = "") => {
  return path.split('.').reduce((acc, key) => acc?.[key] ?? fallback, obj);
};

type Game = {
  id: string;
  title: string;
  icon: string;
  category: 'top-up' | 'accounts';
  createdAt: number;
  autoDetectName?: boolean;
};

type CartItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
  gameId: string;
  thumbnail?: string;
  details?: Record<string, string>;
  isOneTime?: boolean;
};

type Order = {
  id: string;
  userId: string;
  userPhone?: string;
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
  promoCode?: string;
  rank?: number;
  rankDiscount?: number;
  ffUid?: string;
  ffPlayerName?: string;
  ffVerified?: boolean;
  ffRegion?: string;
};

type AccountPost = {
  id: string;
  uid: string;
  authorName: string;
  authorPhone?: string;
  authorAvatar?: string;
  authorIsVerified?: boolean;
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
  warningDismissedAt?: number;
  claimants?: Record<string, {
    uid: string;
    name: string;
    whatsapp: string;
    photo?: string;
    timestamp: number;
    status?: 'pending' | 'accepted' | 'rejected';
    isVerified?: boolean;
  }>;
  processedBy?: {
    uid: string;
    name: string;
    photoURL?: string;
  };
};

type EventAccount = {
  id: string;
  title: string;
  gameName: string;
  description?: string;
  details?: string;
  initialPrice: number;
  tapPrice: number;
  startTime: number;
  endTime: number;
  status: 'upcoming' | 'active' | 'ended' | 'claimed';
  imageUrls: string[];
  winnerId?: string;
  winnerClaim?: {
    status: 'pending' | 'accepted' | 'ignored';
    finalPrice?: number;
    modalId?: string;
  };
  participantsCount?: number;
  topBidderName?: string;
  topTapperId?: string;
  topTapsCount?: number;
  topParticipants?: {
    uid: string;
    avatar: string;
    isVerified?: boolean;
  }[];
};

type EventParticipant = {
  uid: string;
  name: string;
  phone: string;
  avatar: string;
  taps: number;
  value: number;
  lastTapTime: number;
  status: 'active' | 'banned';
  isVerified?: boolean;
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
  redirectRoute?: string;
  buttonText?: string;
};

type Banner = {
  id: string;
  imageUrl: string;
  linkTo?: string;
  active: boolean;
  createdAt: number;
  title?: string;
  description?: string;
};

type PaymentMethod = {
  id: string;
  name: string;
  icon: string;
  ussdTemplate: string;
  active: boolean;
};

type PromoCodeUsage = {
  uid: string;
  name: string;
  whatsapp: string;
  timestamp: number;
};

type PromoCode = {
  id: string;
  code: string;
  discount: number; // percentage
  createdAt: number;
  expiresAt: number;
  type: 'single_use' | 'multi_use';
  usedBy: string | null; // For single_use
  usedByUsers?: Record<string, PromoCodeUsage>; // For tracking multi_use
  claimed: boolean; // For single_use
  expired: boolean;
  note?: string;
};

type StoreSettings = {
  isLive: boolean;
  announcementTicker?: string;
  logo?: string;
  paymentNumber?: string;
  onboardingImages?: string[];
  sliderImages?: string[]; 
  paymentMethods?: Record<string, PaymentMethod>;
  telegramBotToken?: string;
  telegramAdminChatIds?: string;
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
    tutorialThumbnail?: string;
    tutorialBannerActive?: boolean;
    whatsappNumber?: string;
    tiktokUrl?: string;
  };
  lastResetMonth?: string; // Format: YYYY-MM
  leaderboard?: {
    rewardsActive: boolean;
    rewards: {
      rank1: number;
      rank2: number;
      rank3: number;
    };
  };
  config?: {
    shop?: {
      feeType: 'percentage' | 'fixed';
      feeValue: number;
      listingFee?: number;
      listingFeeFreefire?: number;
      listingFeeBloodStrike?: number;
      listingFeeWeekly?: number;
      listingFeeMonthly?: number;
    };
    adminSettings?: {
      pin: string;
    };
  };
};

type UserWarning = {
  id: string;
  postId: string;
  message: string;
  timestamp: number;
};

type UserProfile = {
  uid: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  points: number;
  createdAt: number;
  lastActive?: number;
  photoURL?: string;
  gameName?: string;
  gameUid?: string;
  phoneNumber?: string;
  banned?: boolean;
  termsAccepted?: boolean;
  suspendedUntil?: number;
  warnings?: Record<string, UserWarning>;
  leaderboardRank?: number | null;
  leaderboardDiscount?: number;
  fcmToken?: string;
  isVerified?: boolean;
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
  authError: string | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setGlobalLoading: (loading: boolean) => void;
  login: (phone: string, password: string) => Promise<void>;
  signup: (phone: string, password: string, name: string, realEmail: string) => Promise<void>;
  logout: () => Promise<void>;
  buyNow: (item: Omit<CartItem, 'quantity'>) => void;
  orders: Order[];
  allOrders: Order[];
  games: Game[];
  products: GamePackage[];
  allUsers: UserProfile[];
  accountPosts: AccountPost[];
  eventAccounts: EventAccount[];
  promoCodes: PromoCode[];
  notifications: AppNotification[];
  adminNotifications: AppNotification[];
  events: GameEvent[];
  banners: Banner[];
  createOrder: (paymentMethod: string, gameDetails: any, directItem: CartItem, promoCode?: string) => Promise<void>;
  postAccount: (data: Partial<AccountPost>) => Promise<void>;
  updateAccountPost: (postId: string, data: Partial<AccountPost>) => Promise<void>;
  renewAccountPost: (postId: string, term: 'weekly' | 'monthly') => Promise<void>;
  deleteAccountPost: (postId: string) => Promise<void>;
  markAccountAsSold: (postId: string) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  buyAccountPost: (post: AccountPost) => void;
  markNotificationsAsRead: (notifId?: string) => Promise<void>;
  markAdminNotificationsAsRead: (notifId?: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: string, cancellationReason?: string) => Promise<void>;
  updateAccountPostStatus: (postId: string, status: string, boughtBy?: string) => Promise<void>;
  reportAccountOutcome: (postId: string, outcome: 'bought' | 'not_bought') => Promise<void>;
  respondToSaleReport: (postId: string, confirmed: boolean, buyerId?: string) => Promise<void>;
  enforceAccountAction: (postId: string, action: 'delete' | 'holding' | 'approved' | 'pending', message: string) => Promise<void>;
  issueSellerWarning: (uid: string, postId: string, message: string) => Promise<void>;
  suspendSeller: (uid: string, days: number) => Promise<void>;
  dismissAccountWarning: (postId: string) => Promise<void>;
  markDeletionAsSeen: (postId: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  manageUser: (uid: string, updates: Partial<UserProfile>) => Promise<void>;
  deleteUser: (uid: string) => Promise<void>;
  saveGame: (game: Partial<Game>) => Promise<void>;
  deleteGame: (id: string) => Promise<void>;
  saveProduct: (product: Partial<GamePackage>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateProductsOrder: (updates: {id: string, orderIndex: number}[]) => Promise<void>;
  saveEvent: (event: Partial<GameEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  saveBanner: (banner: Partial<Banner>) => Promise<void>;
  deleteBanner: (id: string) => Promise<void>;
  savePaymentMethod: (method: Partial<PaymentMethod>) => Promise<void>;
  deletePaymentMethod: (id: string) => Promise<void>;
  savePromoCode: (promo: Partial<PromoCode>) => Promise<void>;
  deletePromoCode: (id: string) => Promise<void>;
  checkPromoCode: (code: string) => Promise<number>;
  storeSettings: StoreSettings;
  updateStoreSettings: (settings: any) => Promise<void>;
  updateAdminSettings: (settings: any) => Promise<void>;
  broadcastNotification: (title: string, body: string, target?: string) => Promise<void>;
  broadcastAdminNotification: (title: string, body: string, skipPush?: boolean) => Promise<void>;
  messages: any[];
  allChatSessions: any[];
  chatTargetId: string | null;
  setChatTargetId: (uid: string | null) => void;
  sendMessage: (text?: string, imageUrl?: string, targetUserId?: string) => Promise<void>;
  markMessagesAsRead: (targetUserId?: string) => Promise<void>;
  refreshAdminData: () => void;
  refreshFcmToken: () => Promise<void>;
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
  resetLeaderboard: () => Promise<void>;
  rtdb: any;
  
  // Event Account Functions
  saveEventAccount: (event: Partial<EventAccount>) => Promise<void>;
  deleteEventAccount: (id: string) => Promise<void>;
  tapEventAccount: (eventId: string, phone: string) => Promise<void>;
  assignEventWinner: (eventId: string, winnerId: string) => Promise<void>;
  updateEventStatus: (eventId: string, status: string) => Promise<void>;
  respondToEventClaim: (eventId: string, outcome: 'accepted' | 'ignored', targetUid?: string) => Promise<void>;
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

const VAPID_KEY = 'BFqhWz7U7MFslT9zROix7BPbhIMZkCCytnB5dc8xd3cfWKZMdT0fKjUghbtZpFgpZEiWOjKez11FIiEoWfG-Ovc';

const translations: Record<Language, Record<string, string>> = {
  en: {
    home: "HOME",
    games: "Shop",
    accounts: "ciwaanada",
    orders: "Orders",
    profile: "Profile",
    chat: "Chat",
    notifications: "Alerts",
    ranking: "Leaderboard",
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
    app_tutorial: "How to use",
    whatsapp_support: "WhatsApp Support",
    tiktok: "Oskar TikTok",
    points: "POINTS",
    rank: "RANK",
    admin_hub: "Admin panel",
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
    delivering_diamonds: "Diamonds are being processed...",
    delivered_success: "Successfully Delivered!",
    order_cancelled: "Order Cancelled",
    admin_message: "Admin Message",
    buy_now: "Buy Now",
    login_to_buy: "Login",
    select_game: "Select Game",
    active_events: "Active events",
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
    enter_reset_email: "Enter your email to receive a password reset link.",
    account_gallery: "Account Gallery (First image is thumbnail)",
    upload_photos_prompt: "Add Account Photos",
    game_identity: "Game Identity",
    marketplace: "ciwaanada",
    game_type: "Game Type",
    login_method: "Login Method",
    account_age: "Account Age",
    selling_price: "Selling Price ($)",
    listing_duration: "Listing Duration",
    whatsapp_number_support: "WhatsApp for Support",
    sender_number_label: "Enter sender's number",
    pay_listing_fee_title: "Free Listing",
    pay_listing_fee_desc: "Your account will be listed for free after admin approval.",
    premium_assets: "Premium Assets",
    verify_assets_desc: "Confirm the account features",
    contact_number: "Contact Number",
    phone_digits_error: "Contact number must be at least 9 digits.",
    save: "Save",
    rank_reward: "Discount",
    current_month: "Month",
    next_reset: "Reset-ka Xiga",
    reward_tiers: "Reward Tiers",
    no_participants: "No other participants found.",
    manage_accounts_title: "Manage your accounts",
    active_stat: "Active",
    claims_stat: "Claims",
    sold_stat: "Sold",
    no_listings_title: "No Listings Found",
    no_listings_desc: "You haven't posted any accounts in the Marketplace yet.",
    start_selling: "Start Selling",
    respond_accounts_warning_title: "Respond to your accounts",
    respond_accounts_warning_desc: "Check your listings and respond to potential buyers.",
    reference_label: "Reference",
    posted_label: "Posted",
    level_label: "Level",
    expires_label: "Expires",
    price_label: "Price",
    sold_confirmation_prompt: "If this account was sold, please mark it accordingly",
    mark_as_sold_btn: "Sold",
    delete_record_btn: "Delete this account",
    renew_listing_btn: "Renew Listing",
    renew_listing_desc: "Renew your account to return to the marketplace.",
    choose_term_label: "Choose Term",
    weekly_term: "Standard Listing",
    monthly_term: "Extended Listing",
    pay_renewal_btn: "REACTIVATE",
    confirm_reactivate_btn: "CONFIRM & REACTIVATE",
    finalized_sale_title: "Finalized Sale",
    final_buyer_label: "Final Buyer",
    sold_at_label: "Sold at",
    admin_response_title: "Admin Response",
    urgent_notice_label: "Urgent Notice",
    read_decision_btn: "I have read the decision",
    auto_delete_prefix: "Auto-Deleting record in:",
    purchase_claims_title: "Purchase Claims",
    verify_buyer_desc: "Verify the person who contacted you",
    requests_count_label: "Requests",
    final_decision_recorded: "Final Decision Recorded",
    delete_confirm_title: "Are you sure?",
    delete_confirm_desc: "This post cannot be recovered later.",
    yes_delete: "Yes, Delete",
    no_cancel: "No",
    session_label: "Session #",
    final_total: "Final Total:",
    promo_code_prompt: "Enter Promo Code (If you have one)",
    approved: "Approved",
    pending: "Pending",
    holding: "Holding",
    rejected: "Rejected",
    sold: "Sold",
    listing_flagged_fallback: "account listing kaan waala kansalay fadlan la xariir OskarShop waxii fahfahin ah",
    login_to_view_orders: "Login to view your orders",
    login_required_desc: "Sign in to access your purchase history and tracking details.",
    login_button: "Login",
    ka_qeeb_gal: "Join",
    dhammaatay: "Ended",
    upcoming: "Upcoming",
    active: "Active",
    ended: "Ended",
    claimed: "Claimed",
    event: "EVENT",
    kaalmaha: "Ranking",
    Qiimaha_Asalka: "Initial Price",
    Qiimaha_Hadda: "Highest Bid"
  },
  so: {
    home: "HOME",
    games: "top up",
    accounts: "ciwaanada",
    orders: "dalabyada",
    profile: "Profile",
    chat: "Sheeko",
    notifications: "Ogeysiis",
    ranking: "kaalmaha",
    my_accounts: "My accounts",
    sell_account: "iibi/iibso account",
    leaderboard: "Leaderboard",
    logout: "Ka Bax",
    language: "Luqadda",
    dark_mode: "U bedel madoow",
    light_mode: "U bedel cadaan",
    update_profile: "Bedel profile ka",
    store_marketplace: "",
    support_center: "Caawinaad",
    global_settings: "Settings-ka Guud",
    app_tutorial: "Sida loo isticmaalo app-ka",
    whatsapp_support: "WhatsApp Caawinaad",
    tiktok: "Oskar TikTok",
    points: "PTS",
    rank: "KAALINTA",
    admin_hub: "Admin panel",
    restricted_access: "U gaar ah admin ka",
    manage_orders: "Maamul dalabaadka iyo suuqa.",
    no_orders: "Wax dalab ah masameeynin.",
    no_orders_desc: "Dalabaadyadada halkaan ayeey kala socon kartaa.",
    continue_shopping: "Dalab sameey.",
    player_id: "Game ID-ga",
    game_name: "Magaca Game-ka",
    sender_no: "Lacag Diraha",
    whatsapp: "WhatsApp",
    seller: "Iibiyaha",
    platform: "Platform",
    final_amount: "Wadarta Guud",
    verifying_payment: "Dalabkaaga waa la diray, mahadsanid!.",
    delivering_diamonds: "Xogta ayaa la xaqiijinooyaa fadlan dulqaadka badi.",
    delivered_success: "Dalabkaaga waa Laguu Soo diray, Mahadsanid!.",
    order_cancelled: "Dalabka waa la kansalay sababta:",
    admin_message: "Fariinta Admin-ka",
    buy_now: "IIBSO",
    login_to_buy: "Login",
    select_game: "Select Game",
    active_events: "Event yada",
    take_advantage: "Ka faa'ideeyso intuusan dhamaan!",
    ranking_desc: "iib sameey Si aad u gasho kaalmaha hore una heshid discount gaaraya ilaa %3, halkii iibin top up waxaad Ku heleesaa 1 points (pts). Hadiyado kalena coming soon I.a.",
    view: "Eeg",
    time_left: "Waqtiga haray",
    buy_button: "iibso",
    terms_of_service: "Shuruucda/xeerarka website ka",
    read_terms: "Aqri sharuucda",
    photo_updated: "Sawirka waa la soo geliyey!",
    terms_welcome: "Ku soo dhawoow OskarShop, fadlan aqri shuruucda website ka inta aadan isticmaalin, MAHADSANID!.",
    compliance_protocol: "Hab-maamuuska u hoggaansanaanta",
    forgot_password: "Ma ilaawday password-ka?",
    reset_password: "Bedel Password-ka",
    reset_email_sent: "Ka hubi email-kaaga linkiga bedelaada.",
    enter_reset_email: "Enter email-kaaga si lagugu soo diro linkiga bedelaada.",
    account_gallery: "Soo Geli dhamaan Sawirada accounti-ga",
    upload_photos_prompt: "Riix halkaan Si aad sawir usoo gelisid",
    game_identity: "Xogta Game ka",
    marketplace: "ciwaanada",
    game_type: "Dooro nooca Game ka",
    login_method: "Qaabka lagu Soo galo",
    account_age: "Geli da' da account tiga",
    selling_price: "Qiimaha aad Ku rabtid ( $ )",
    listing_duration: "Dooro Muda",
    whatsapp_number_support: "Geli WhatsApp kaga",
    sender_number_label: "Geli number ka xogta",
    pay_listing_fee_title: "Soo geli Bilaash",
    pay_listing_fee_desc: "Account-kaaga si bilaash ah ayaa loo soo gelinayaa ka dib markii la xaqiijiyo.",
    premium_assets: "Waxyabaha account tiga yaalo",
    verify_assets_desc: "Si fiican u xaqiiji xogta",
    contact_number: "Whatsapp number kaaga",
    phone_digits_error: "Lambarka waa inuu ka koobnaadaa ugu yaraan 9 nambar.",
    save: "Keydi",
    rank_reward: "Diskoonti",
    current_month: "Bisha",
    next_reset: "Reset-ka Xiga",
    reward_tiers: "Abaalmarinta",
    no_participants: "Ciyaartoy kale lama helin.",
    manage_accounts_title: "Maamul account kaga",
    active_stat: "Active",
    claims_stat: "Claims",
    sold_stat: "Sold",
    no_listings_title: "No Listings Found",
    no_listings_desc: "Wali wax account ah maadan soo dhigin Marketplace-ka.",
    start_selling: "Start Selling",
    respond_accounts_warning_title: "Ka jawaab account yadaada",
    respond_accounts_warning_desc: "Hubi account yadaada oo ka jawaab hadii lala soo xiriiray.",
    reference_label: "Reference",
    posted_label: "Posted",
    level_label: "Level",
    expires_label: "Expires",
    price_label: "Qiimaha",
    sold_confirmation_prompt: "Hadii account-ka la iibiyay, fadlan calaamadee",
    mark_as_sold_btn: "Wuu gatay",
    delete_record_btn: "Delete account kaan",
    renew_listing_btn: "Renew Listing",
    renew_listing_desc: "Account-kaaga dib ugu soo celi suuqa.",
    choose_term_label: "Dooro Muda",
    weekly_term: "Soo geli",
    monthly_term: "Muda dheer",
    pay_renewal_btn: "DIB U FUR",
    confirm_reactivate_btn: "XAQUIIJI",
    finalized_sale_title: "Finalized Sale",
    final_buyer_label: "Final Buyer",
    sold_at_label: "Sold at",
    admin_response_title: "Jawaabta Maamulka",
    urgent_notice_label: "Ogeysiis Degdeg ah",
    read_decision_btn: "Waan akhriyay go'aanka",
    auto_delete_prefix: "Record-ka waxaa si toos ah loo tirtiri doonaa:",
    purchase_claims_title: "Purchase Claims",
    verify_buyer_desc: "Xaqiiji qofka kula soo xiriiray",
    requests_count_label: "Requests",
    final_decision_recorded: "Final Decision Recorded",
    delete_confirm_title: "Ma hubtaa?",
    delete_confirm_desc: "Post-kan dibna looma heli karo.",
    yes_delete: "Haa, Tirtir",
    no_cancel: "Maya",
    session_label: "Siisoon #",
    final_total: "Wadarta:",
    promo_code_prompt: "Geli Promo Code (Hadaad haysato)",
    approved: "La aqbalay",
    pending: "Wali",
    holding: "Hada lama heli karo",
    rejected: "Lama aqbalin",
    sold: "Waa la iibiyay",
    listing_flagged_fallback: "account listing kaan waala kansalay fadlan la xariir OskarShop waxii fahfahin ah",
    login_to_view_orders: "Login si aad dalabaadkaaga u arakto",
    login_required_desc: "Soo gal si aad u aragtid dalabaadkaagii ugu danbeeyay, ama ula socotid dalabaadyadada.",
    login_button: "Login",
    ka_qeeb_gal: "Ka Qeeb Gal",
    dhammaatay: "Dhammaatay",
    upcoming: "Upcoming",
    active: "Active",
    ended: "Ended",
    claimed: "Claimed",
    event: "EVENT",
    kaalmaha: "kaalmaha",
    Qiimaha_Asalka: "Qiimaha Asalka",
    Qiimaha_Hadda: "Qiimaha Hadda"
  }
};

const getFriendlyAuthError = (err: any, lang: Language): string => {
  const code = err.code || "";
  const isSo = lang === 'so';

  switch (code) {
    case 'auth/invalid-email':
      return isSo ? "Numbarka aad gelisay ma saxna." : "The phone number you entered is invalid.";
    case 'auth/user-not-found':
    case 'auth/user-disabled':
      return isSo ? "Account-ken ma jiro ama waa la xiray." : "Account not found or has been disabled.";
    case 'auth/wrong-password':
      return isSo ? "Password-ka aad gelisay waa khalad." : "Incorrect password. Please try again.";
    case 'auth/email-already-in-use':
      return isSo ? "Numbarkan horay ayaa loo isticmaalay." : "This number is already in use.";
    case 'auth/weak-password':
      return isSo ? "Password-ku waa inuu ka koobnaadaa ugu yaraan 8 xaraf." : "Password should be at least 8 characters.";
    case 'auth/network-request-failed':
      return isSo ? "Khalad dhinaca internet-ka ah. Hubi khadkaaga." : "Network error. Please check your connection.";
    case 'auth/too-many-requests':
      return isSo ? "Isku dayo badan ayaa dhacay. Fadlan sug waxyar." : "Too many attempts. Please try again later.";
    case 'auth/invalid-credential':
      return isSo ? "Numbarka ama Password-ka waa khalad." : "Invalid phone number or password.";
    case 'auth/operation-not-allowed':
      return isSo ? "Adeeggan hadda lama oggola." : "Operation not allowed.";
    default:
      return isSo ? "Khalad aan la aqoon ayaa dhacay. Fadlan mar kale isku day." : "An unexpected error occurred. Please try again.";
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

const formatToSyntheticEmail = (phone: string) => {
  const clean = phone.replace(/\D/g, "");
  return `${clean}@oskarshop.app`;
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser, loading } = useUser();
  const auth = useAuth();
  const rtdb = useDatabase();
  const messaging = useMessaging();
  const router = useRouter();
  const pathname = usePathname();
  
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTabState] = useState('home');
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
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
    games: false,
    promoCodes: false,
    eventAccounts: false
  });

  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => getCache(SETTINGS_CACHE_KEY, {}));
  const [games, setGames] = useState<Game[]>(() => getCache(GAMES_CACHE_KEY, []));
  const [products, setProducts] = useState<GamePackage[]>(() => getCache(PRODUCTS_CACHE_KEY, []));
  const [accountPosts, setAccountPosts] = useState<AccountPost[]>([]);
  const [eventAccounts, setEventAccounts] = useState<EventAccount[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [events, setEvents] = useState<GameEvent[]>(() => getCache(EVENTS_CACHE_KEY, []));
  const [banners, setBanners] = useState<Banner[]>(() => getCache(BANNERS_CACHE_KEY, []));
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => getCache(USER_CACHE_KEY));
  
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<AppNotification[]>([]);
  const [chatTargetId, setChatTargetId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [allChatSessions, setAllChatSessions] = useState<any[]>([]);

  const sessionStartTime = useRef(Date.now());
  const lastNotifiedRef = useRef<Set<string>>(new Set());

  const broadcastNotification = useCallback(async (title: string, body: string, targetUid?: string) => {
    if (!rtdb) return;
    const uid = targetUid || authUser?.uid;
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

    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUids: [uid], title, message: body })
    }).catch(err => console.error("OneSignal broadcast failed", err));
  }, [rtdb, authUser]);

  const broadcastAdminNotification = useCallback(async (title: string, body: string, skipPush?: boolean) => {
    if (!rtdb) return;
    const adminNotifRef = push(ref(rtdb, 'adminNotifications'));
    await set(adminNotifRef, {
      title,
      body,
      type: 'broadcast',
      createdAt: Date.now(),
      readBy: {}
    });

    if (!skipPush) {
      fetch('/api/notify-new-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message: body })
      }).catch(err => console.error("OneSignal admin broadcast failed", err));
    }
  }, [rtdb]);

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

  const refreshFcmToken = useCallback(async () => {
    if (!messaging || !authUser || !rtdb) return;
    try {
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (token) {
        await update(ref(rtdb, `users/${authUser.uid}`), { fcmToken: token });
      }
    } catch (err) {
      console.error("Failed to refresh FCM token:", err);
    }
  }, [messaging, authUser, rtdb]);

  const login = useCallback(async (ph: string, p: string) => {
    setIsGlobalLoading(true);
    setAuthError(null);
    try { 
      const email = formatToSyntheticEmail(ph);
      await signInWithEmailAndPassword(auth, email, p); 
    } catch (err: any) {
      const friendly = getFriendlyAuthError(err, language);
      setAuthError(friendly);
      throw err;
    } finally { setIsGlobalLoading(false); }
  }, [auth, language]);

  const logout = useCallback(async () => {
    setIsGlobalLoading(true);
    try { 
      if (authUser) localStorage.removeItem(`oskar_profile_complete_${authUser.uid}`);
      localStorage.removeItem(USER_CACHE_KEY); 
      await signOut(auth); 
      router.push('/login'); 
    } finally { setIsGlobalLoading(false); }
  }, [auth, authUser, router]);

  const signup = useCallback(async (ph: string, p: string, n: string, realEmail: string) => {
    setIsGlobalLoading(true);
    setAuthError(null);
    try {
      const normalizedPhone = ph.replace(/\D/g, "");
      const usersRef = ref(rtdb, 'users');
      const usersSnap = await get(usersRef);
      const allUsersData = usersSnap.val() || {};
      
      const exists = Object.values(allUsersData).some((u: any) => {
        const uPhone = (u.phoneNumber || "").replace(/\D/g, "");
        return uPhone === normalizedPhone || u.email === realEmail;
      });

      if (exists) {
        throw { code: 'auth/email-already-in-use', message: language === 'so' ? "Numbarkan ama email-kan horay ayaa loo diiwaan geliyay" : "This number or email is already registered" };
      }

      const syntheticEmail = formatToSyntheticEmail(ph);
      const cred = await createUserWithEmailAndPassword(auth, syntheticEmail, p);
      await updateProfile(cred.user, { displayName: n });
      
      const localAccepted = typeof window !== 'undefined' && localStorage.getItem('oskar_terms_accepted') === 'true';
      const isAdminNumber = normalizedPhone.endsWith("613982172");

      const profile: UserProfile = { 
        uid: cred.user.uid, 
        email: realEmail, 
        name: n, 
        phoneNumber: ph, 
        role: isAdminNumber ? 'admin' : 'user', 
        points: 0, 
        createdAt: Date.now(),
        termsAccepted: localAccepted,
        leaderboardRank: null,
        leaderboardDiscount: 0,
        isVerified: false
      };
      await set(ref(rtdb, `users/${cred.user.uid}`), profile);
      setUserProfile(profile);
      setCache(USER_CACHE_KEY, profile);
    } catch (err: any) {
      const friendly = err.code ? getFriendlyAuthError(err, language) : (err.message || "Signup failed");
      setAuthError(friendly);
      throw err;
    } finally { setIsGlobalLoading(false); }
  }, [auth, rtdb, language]);

  const ensureUserProfile = useCallback(async (firebaseUser: any) => {
    if (!rtdb || !firebaseUser) return;
    try {
      const userRef = ref(rtdb, `users/${firebaseUser.uid}`);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        const localAccepted = typeof window !== 'undefined' && localStorage.getItem('oskar_terms_accepted') === 'true';
        const profile: UserProfile = { 
          uid: firebaseUser.uid, 
          email: firebaseUser.email || "", 
          name: firebaseUser.displayName || "Gamer", 
          role: 'user', 
          points: 0, 
          createdAt: Date.now(),
          termsAccepted: localAccepted,
          photoURL: firebaseUser.photoURL || "",
          phoneNumber: firebaseUser.email ? firebaseUser.email.split('@')[0] : "",
          leaderboardRank: null,
          leaderboardDiscount: 0,
          isVerified: false
        };
        await set(userRef, profile);
        setUserProfile(profile);
        setCache(USER_CACHE_KEY, profile);
      } else {
        const existingData = snapshot.val();
        const updates: any = {
           lastActive: Date.now()
        };
        if (!existingData.photoURL && firebaseUser.photoURL) updates.photoURL = firebaseUser.photoURL;
        if (!existingData.email && firebaseUser.email) updates.email = firebaseUser.email;
        if (!existingData.phoneNumber && firebaseUser.email) updates.phoneNumber = firebaseUser.email.split('@')[0];
        
        await update(userRef, updates);
        
        const finalProfile = { ...existingData, ...updates };
        setUserProfile(finalProfile);
        setCache(USER_CACHE_KEY, finalProfile);
      }
    } catch (err: any) {
      console.error("Profile sync failed:", err);
    }
  }, [rtdb]);

  const setActiveTab = useCallback((tab: string) => {
    setIsGlobalLoading(true);
    setTimeout(() => {
      setActiveTabState(tab);
      if (typeof window !== 'undefined') {
        const isSpecialFlow = pathname === "/checkout" || pathname === "/checkout-account" || pathname.startsWith("/accounts/") || pathname.startsWith("/events/") || pathname === "/terms";
        if (isSpecialFlow || pathname !== '/') {
          router.push(tab === 'home' ? '/' : `/#tab`);
        } else {
          window.location.hash = tab === 'home' ? '' : tab;
        }
      }
      setIsGlobalLoading(false);
    }, 150);
  }, [pathname, router]);

  const buyNow = useCallback((item: any) => {
    if (!authUser) {
      toast({ title: "Fadlan soo gal", description: "Waa inaad soo gashaa si aad wax u iibsato.", variant: "destructive" });
      router.push('/login');
      return;
    }
    setIsGlobalLoading(true);
    router.push(`/checkout?id=${item.id}`);
    setTimeout(() => setIsGlobalLoading(false), 2000);
  }, [authUser, router]);

  const createOrder = useCallback(async (paymentMethod: string, gameDetails: any, directItem: CartItem, promoCode?: string) => {
    if (!rtdb || !authUser) return;
    setIsGlobalLoading(true);
    const counterRef = ref(rtdb, 'settings/orderCounter');
    let sequenceId = 10;
    try {
      const result = await runTransaction(counterRef, (currentValue) => {
        if (currentValue === null || currentValue < 10) return 10;
        return currentValue + 1;
      });
      if (result.committed) sequenceId = result.snapshot.val();
    } catch (e) { sequenceId = Date.now(); }
    const orderId = `iibinta${sequenceId}`;
    
    const newOrder: any = { 
      id: orderId, 
      userId: authUser.uid, 
      userPhone: userProfile?.phoneNumber || "",
      items: [directItem], 
      total: directItem.price, 
      status: 'pending', 
      createdAt: Date.now(), 
      paymentMethod, 
      gameDetails 
    };

    if (userProfile?.leaderboardRank && userProfile?.leaderboardDiscount) {
      newOrder.rank = userProfile.leaderboardRank;
      newOrder.rankDiscount = userProfile.leaderboardDiscount;
    }
    
    if (promoCode) newOrder.promoCode = promoCode;
    
    if (gameDetails.ffUid) {
      newOrder.ffUid = gameDetails.ffUid;
      newOrder.ffPlayerName = gameDetails.ffPlayerName;
      newOrder.ffVerified = gameDetails.ffVerified;
      newOrder.ffRegion = gameDetails.ffRegion;
    }
    
    await set(ref(rtdb, `orders/${orderId}`), newOrder);

    if (promoCode) {
      const standardizedCode = promoCode.trim().toUpperCase();
      const promoRef = ref(rtdb, `promo_codes/${standardizedCode}`);
      const promoSnap = await get(promoRef);
      const promoData = promoSnap.val();
      
      if (promoData) {
        if (promoData.type === 'single_use' || !promoData.type) {
          await update(promoRef, { claimed: true, usedBy: authUser.uid });
        } else {
          await update(ref(rtdb, `promo_codes/${standardizedCode}/usedByUsers/${authUser.uid}`), {
            uid: authUser.uid,
            name: userProfile?.name || 'Guest',
            whatsapp: userProfile?.phoneNumber || 'N/A',
            timestamp: Date.now()
          });
        }
      }
    }

    fetch('/api/notify-telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: orderId,
        customerName: gameDetails.playerName || userProfile?.name || 'Guest',
        customerPhone: gameDetails.whatsappNumber || userProfile?.phoneNumber || 'N/A',
        itemName: directItem.title,
        amount: directItem.price,
        ffUid: gameDetails.ffUid || null,
        ffPlayerName: gameDetails.ffPlayerName || null,
        promoCode: promoCode || null,
        discount: userProfile?.leaderboardDiscount || null,
      }),
    }).catch(() => {});

    fetch('/api/notify-new-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, itemTitle: directItem.title })
    }).catch(err => console.error("OneSignal admin broadcast failed", err));

    await broadcastAdminNotification("New Order Received! 🛍️", `Order #${orderId.toUpperCase()} for ${directItem.title} is pending verification.`, true);
    setIsGlobalLoading(false);
  }, [rtdb, authUser, userProfile, broadcastAdminNotification]);

  const orders = useMemo(() => {
    if (!authUser) return [];
    return allOrders.filter(o => o.userId === authUser.uid).sort((a,b) => b.createdAt - a.createdAt);
  }, [allOrders, authUser]);

  const userRankData = useMemo(() => {
    if (!authUser || !allUsers.length || !syncStatus.settings) return { rank: null, discount: 0 };
    const settings = storeSettings.leaderboard || { rewardsActive: false, rewards: { rank1: 0, rank2: 0, rank3: 0 } };
    if (!settings.rewardsActive) return { rank: null, discount: 0 };
    const sorted = [...allUsers].sort((a, b) => (b.points || 0) - (a.points || 0) || (a.createdAt || 0) - (b.createdAt || 0));
    const top50 = sorted.slice(0, 50);
    const rankIndex = top50.findIndex(u => u.uid === authUser.uid);
    const rank = rankIndex !== -1 ? rankIndex + 1 : null;
    let discount = 0;
    if (rank === 1) discount = Number(settings.rewards?.rank1) || 0;
    else if (rank === 2) discount = Number(settings.rewards?.rank2) || 0;
    else if (rank === 3) discount = Number(settings.rewards?.rank3) || 0;
    return { rank, discount };
  }, [authUser, allUsers, storeSettings.leaderboard, syncStatus.settings]);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) { ensureUserProfile(u); refreshFcmToken(); }
      else { setUserProfile(null); localStorage.removeItem(USER_CACHE_KEY); }
    });
    return () => unsubscribe();
  }, [auth, ensureUserProfile, refreshFcmToken]);

  useEffect(() => {
    if (!rtdb || !authUser) return;
    const updatePresence = () => { update(ref(rtdb, `users/${authUser.uid}`), { lastActive: Date.now() }); };
    updatePresence();
    const interval = setInterval(updatePresence, 300000); 
    return () => clearInterval(interval);
  }, [rtdb, authUser]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    setCache(THEME_CACHE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme(prev => prev === 'light' ? 'dark' : 'light'), []);

  const setLanguage = useCallback((lang: Language) => {
    setIsGlobalLoading(true);
    setTimeout(() => {
      setLanguageState(lang);
      setCache(LANG_CACHE_KEY, lang);
      toast({ title: lang === 'en' ? "Language changed to English" : "Luqadda waxaa loo baddalay Somali" });
      setIsGlobalLoading(false);
    }, 300);
  }, []);

  const t = useCallback((key: string) => translations[language][key] || key, [language]);

  const isInitialLoading = useMemo(() => !syncStatus.settings || !syncStatus.products || !syncStatus.banners || !syncStatus.events || !syncStatus.games, [syncStatus]);

  useEffect(() => {
    if (!rtdb) return;
    const settingsRef = ref(rtdb, 'settings');
    const gamesRef = ref(rtdb, 'games');
    const productsRef = ref(rtdb, 'products');
    const accPostsRef = ref(rtdb, 'accountPosts');
    const eventAccountsRef = ref(rtdb, 'eventAccounts');
    const promoCodesRef = ref(rtdb, 'promo_codes');
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
      const sortedData = data.sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0));
      setProducts(sortedData);
      setCache(PRODUCTS_CACHE_KEY, sortedData);
      setSyncStatus(prev => ({ ...prev, products: true }));
    });

    onValue(accPostsRef, (s) => {
      const data = s.val() ? Object.entries(s.val()).map(([id, v]: any) => ({ ...v, id })) : [];
      setAccountPosts(data);
      setSyncStatus(prev => ({ ...prev, accPosts: true }));
    });

    onValue(eventAccountsRef, (s) => {
      const data = s.val() ? Object.entries(s.val()).map(([id, v]: any) => ({ ...v, id })) : [];
      setEventAccounts(data);
      setSyncStatus(prev => ({ ...prev, eventAccounts: true }));
    });

    onValue(promoCodesRef, (s) => {
      const data = s.val() ? Object.entries(s.val()).map(([id, v]: any) => ({ ...v, id })) : [];
      setPromoCodes(data);
      setSyncStatus(prev => ({ ...prev, promoCodes: true }));
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
      off(settingsRef); off(gamesRef); off(productsRef); off(accPostsRef); off(eventAccountsRef); off(promoCodesRef); off(eventsRef); off(bannersRef); off(usersRef);
    };
  }, [rtdb, syncStatus.settings, storeSettings.isLive, storeSettings.appStatus?.offline, showPushNotification]);

  useEffect(() => {
    if (!rtdb || !authUser) { setNotifications([]); return; }
    const profileRef = ref(rtdb, `users/${authUser.uid}`);
    const notifsRef = query(ref(rtdb, `notifications/${authUser.uid}`), limitToLast(20));

    onValue(profileRef, (s) => {
      const data = s.val();
      setUserProfile(data);
      if (data) {
        setCache(USER_CACHE_KEY, data);
        if (data.phoneNumber && data.name) localStorage.setItem(`oskar_profile_complete_${authUser.uid}`, 'true');
      }
      if (data?.banned) {
        setBannedInfo({ name: data.name || "N/A", uid: data.uid || authUser.uid, phone: data.phoneNumber || "N/A" });
        setIsBannedModalOpen(true); logout();
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

    return () => { off(profileRef); off(notifsRef); };
  }, [rtdb, authUser, showPushNotification, logout]);

  useEffect(() => {
    if (!messaging) return;
    const unsubscribe = onMessage(messaging, (payload) => {
      const title = payload.notification?.title || 'Notification';
      const body = payload.notification?.body || '';
      if (title && body) {
        toast({ title, description: body });
        if (Notification.permission === 'granted') new Notification(title, { body, icon: storeSettings.logo });
      }
    });
    return () => unsubscribe();
  }, [messaging, storeSettings.logo]);

  const enhancedUser = useMemo(() => {
    if (!authUser) return null;
    const role = userProfile?.role || 'user';
    return { ...authUser, ...userProfile, isAdmin: role === 'admin', leaderboardRank: userRankData.rank, leaderboardDiscount: userRankData.discount };
  }, [authUser, userProfile, userRankData]);

  useEffect(() => {
    if (!rtdb || !authUser) { setAllOrders([]); setAdminNotifications([]); setAllChatSessions([]); return; }
    let ordersRef = enhancedUser?.isAdmin ? ref(rtdb, 'orders') : query(ref(rtdb, 'orders'), orderByChild('userId'), equalTo(authUser.uid));
    const ordersUnsubscribe = onValue(ordersRef, (snapshot) => {
      const val = snapshot.val();
      setAllOrders(val ? Object.entries(val).map(([id, v]: any) => ({ ...v, id })).sort((a, b) => b.createdAt - a.createdAt) : []);
    });
    let adminNotifUnsubscribe = () => {};
    let chatIndexUnsubscribe = () => {};
    if (enhancedUser?.isAdmin) {
      chatIndexUnsubscribe = onValue(ref(rtdb, 'chatIndex'), (snapshot) => {
        const val = snapshot.val();
        setAllChatSessions(val ? Object.entries(val).map(([userId, v]: any) => ({ userId, ...v })).sort((a,b) => b.lastTimestamp - a.lastTimestamp) : []);
      });
      adminNotifUnsubscribe = onValue(query(ref(rtdb, 'adminNotifications'), limitToLast(30)), (snapshot) => {
        const data = snapshot.val() ? Object.entries(snapshot.val()).map(([id, v]: any) => ({ ...v, id })).sort((a,b) => b.createdAt - a.createdAt) : [];
        if (data.length > 0) {
          const latest = data[0];
          if (!latest.readBy?.[enhancedUser.uid] && latest.createdAt > sessionStartTime.current && latest.type !== 'assignment_update') showPushNotification(latest.title, latest.body, "admin-push-" + latest.id);
        }
        setAdminNotifications(data);
      });
    }
    return () => { ordersUnsubscribe(); chatIndexUnsubscribe(); adminNotifUnsubscribe(); };
  }, [rtdb, authUser, enhancedUser?.isAdmin, enhancedUser?.uid, showPushNotification]);

  const refreshAdminData = useCallback(() => {
    if (!rtdb) return;
    setIsGlobalLoading(true);
    get(ref(rtdb, 'orders')).then(s => {
      const val = s.val();
      if (val) setAllOrders(Object.entries(val).map(([id, v]: any) => ({ ...v, id })).sort((a,b) => b.createdAt - a.createdAt));
      setIsGlobalLoading(false);
    });
  }, [rtdb]);

  const resetLeaderboard = useCallback(async () => {
    if (!rtdb || !enhancedUser?.isAdmin) return;
    setIsGlobalLoading(true);
    const currentMonth = format(new Date(), 'yyyy-MM');
    const updates: any = {};
    allUsers.forEach(u => {
      updates[`users/${u.uid}/points`] = 0;
      updates[`users/${u.uid}/leaderboardRank`] = null;
      updates[`users/${u.uid}/leaderboardDiscount`] = 0;
    });
    updates[`settings/lastResetMonth`] = currentMonth;
    try {
      await update(ref(rtdb), updates);
      await broadcastAdminNotification("Leaderboard Reset! 🏆", `System points have been reset for the new month (${currentMonth}) by ${enhancedUser.name}.`, true);
      toast({ title: "Reset Complete" });
    } catch (error) { toast({ title: "Reset Failed", variant: "destructive" }); } finally { setIsGlobalLoading(false); }
  }, [rtdb, enhancedUser, allUsers, broadcastAdminNotification]);

  const postAccount = useCallback(async (data: any) => {
    if (!rtdb || !authUser) return;
    setIsGlobalLoading(true);
    const postRef = push(ref(rtdb, 'accountPosts'));
    await set(postRef, { ...data, uid: authUser.uid, authorName: enhancedUser?.name, authorPhone: enhancedUser?.phoneNumber, authorAvatar: enhancedUser?.photoURL, authorIsVerified: enhancedUser?.isVerified || false, status: 'pending', createdAt: Date.now(), views: 0, sold: false });
    fetch('/api/notify-telegram', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: postRef.key, customerName: enhancedUser?.name, customerPhone: enhancedUser?.phoneNumber, itemName: `${data.gameType} Account Listing`, amount: 0 }) }).catch(() => {});
    fetch('/api/notify-new-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: postRef.key, itemTitle: `${data.gameType} Account` }) }).catch(() => {});
    await broadcastAdminNotification("New Account Post! 🎮", `${enhancedUser?.name} listed a ${data.gameType} account.`, true);
    setIsGlobalLoading(false);
  }, [rtdb, authUser, enhancedUser, broadcastAdminNotification]);

  const updateAccountPost = useCallback(async (postId: string, data: any) => {
    if (!rtdb) return;
    setIsGlobalLoading(true);
    const { price, totalCharge, fee, ...editableData } = data;
    await update(ref(rtdb, `accountPosts/${postId}`), editableData);
    setIsGlobalLoading(false);
  }, [rtdb]);

  const renewAccountPost = useCallback(async (postId: string, term: 'weekly' | 'monthly') => {
    if (!rtdb) return;
    setIsGlobalLoading(true);
    await update(ref(rtdb, `accountPosts/${postId}`), { term, status: 'pending', sold: false, holdingBy: null, boughtBy: null, buyerReported: false, sellerReported: false, conflict: false, adminMessage: null, hiddenFromMarket: false, sellerSeenDeletionAt: null, claimants: null, warningDismissedAt: null });
    setIsGlobalLoading(false);
  }, [rtdb]);

  const deleteAccountPost = useCallback(async (pid: string) => { if (!rtdb) return; setIsGlobalLoading(true); await remove(ref(rtdb, `accountPosts/${pid}`)); setIsGlobalLoading(false); }, [rtdb]);
  const markAccountAsSold = useCallback(async (postId: string) => { if (!rtdb || !authUser) return; setIsGlobalLoading(true); await update(ref(rtdb, `accountPosts/${postId}`), { sold: true, status: 'sold', completedAt: Date.now() }); setIsGlobalLoading(false); }, [rtdb, authUser]);
  const deleteOrder = useCallback(async (oid: string) => { if (!rtdb) return; setIsGlobalLoading(true); await remove(ref(rtdb, `orders/${oid}`)); setIsGlobalLoading(false); }, [rtdb]);

  const buyAccountPost = useCallback((post: AccountPost) => {
    if (!authUser) { router.push('/login'); return; }
    setIsGlobalLoading(true); router.push(`/checkout-account?id=${post.id}`);
    setTimeout(() => setIsGlobalLoading(false), 2000);
  }, [authUser, router]);

  const markNotificationsAsRead = useCallback(async (nid?: string) => {
    if (!rtdb || !authUser) return;
    if (nid) await update(ref(rtdb, `notifications/${authUser.uid}/${nid}`), { read: true });
    else { const updates: any = {}; notifications.forEach(n => updates[`notifications/${authUser.uid}/${n.id}/read`] = true); await update(ref(rtdb), updates); }
  }, [rtdb, authUser, notifications]);

  const markAdminNotificationsAsRead = useCallback(async (nid?: string) => {
    if (!rtdb || !enhancedUser?.isAdmin) return;
    if (nid) await update(ref(rtdb, `adminNotifications/${nid}/readBy/${enhancedUser.uid}`), true);
    else { const updates: any = {}; adminNotifications.forEach(n => updates[`adminNotifications/${n.id}/readBy/${enhancedUser.uid}`] = true); await update(ref(rtdb), updates); }
  }, [rtdb, enhancedUser, adminNotifications]);

  const respondToEventClaim = useCallback(async (eventId: string, outcome: 'accepted' | 'ignored', targetUid?: string) => {
    if (!rtdb || (!authUser && !targetUid)) return;
    const uid = targetUid || authUser?.uid; if (!uid) return;
    setIsGlobalLoading(true);
    try {
      const currentEventSnap = await get(ref(rtdb, `eventAccounts/${eventId}`));
      const eventData = currentEventSnap.val();
      const currentModalId = eventData?.winnerClaim?.modalId;
      if (outcome === 'accepted') {
        await update(ref(rtdb, `eventAccounts/${eventId}/winnerClaim`), { status: 'accepted' });
        if (currentModalId) localStorage.setItem(`oskar_claim_responded_${eventId}_${currentModalId}`, 'accepted');
      } else {
        const partSnap = await get(ref(rtdb, `eventParticipants/${eventId}`));
        const sorted = Object.values(partSnap.val() || {}).sort((a: any, b: any) => b.taps - a.taps || a.lastTapTime - b.lastTapTime);
        const currentIndex = sorted.findIndex((p: any) => p.uid === uid);
        const nextWinner = sorted[currentIndex + 1] as any;
        if (currentModalId) localStorage.setItem(`oskar_claim_responded_${eventId}_${currentModalId}`, 'ignored');
        if (nextWinner) {
          await update(ref(rtdb, `eventAccounts/${eventId}`), { winnerId: nextWinner.uid, winnerClaim: { status: 'pending', finalPrice: nextWinner.value, modalId: Date.now().toString() } });
          broadcastNotification("Hampalyo! 🏆", "Waad ku guulaysatay auction-ka!", nextWinner.uid);
        } else { await update(ref(rtdb, `eventAccounts/${eventId}/winnerClaim`), { status: 'ignored' }); }
      }
    } finally { setIsGlobalLoading(false); }
  }, [rtdb, authUser, broadcastNotification]);

  const updateOrderStatus = useCallback(async (orderId: string, status: string, cancellationReason?: string) => {
    if (!rtdb || !enhancedUser?.isAdmin) return;
    setIsGlobalLoading(true);
    const updates: any = { status, processedBy: { uid: enhancedUser.uid, name: enhancedUser.name || "Admin", photoURL: enhancedUser.photoURL || "" }, processedAt: Date.now() };
    if (status === 'cancelled' && cancellationReason) updates.cancellationReason = cancellationReason;
    if (status === 'successful') {
      updates.completedAt = Date.now();
      const orderSnap = await get(ref(rtdb, `orders/${orderId}`));
      const orderData = orderSnap.val();
      if (orderData?.userId && !(orderData.gameId === 'accounts' || orderData.items?.[0]?.gameId === 'accounts')) {
        await update(ref(rtdb, `users/${orderData.userId}`), { points: increment(1) });
      }
    }
    if (status === 'cancelled') {
      const orderSnap = await get(ref(rtdb, `orders/${orderId}`));
      const orderData = orderSnap.val();
      if (orderData?.gameDetails?.isEventWinner && orderData?.gameDetails?.eventId) await respondToEventClaim(orderData.gameDetails.eventId, 'ignored', orderData.userId);
    }
    await update(ref(rtdb, `orders/${orderId}`), updates);
    const orderSnap = await get(ref(rtdb, `orders/${orderId}`));
    const orderData = orderSnap.val();
    if (orderData?.userId) {
      fetch('/api/notify-order-complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, userId: orderData.userId, status }) }).catch(() => {});
      broadcastNotification(status === 'successful' ? "Diamonds Delivered! ✅" : "Order Update 📦", `Order #${orderId.toUpperCase()} status: ${status}`, orderData.userId);
    }
    setIsGlobalLoading(false);
  }, [rtdb, enhancedUser, broadcastNotification, respondToEventClaim]);

  const updateAccountPostStatus = useCallback(async (postId: string, status: string, boughtBy?: string) => {
    if (!rtdb || !enhancedUser?.isAdmin) return;
    setIsGlobalLoading(true);
    const updates: any = { status, processedBy: { uid: enhancedUser.uid, name: enhancedUser.name || "Admin", photoURL: enhancedUser.photoURL || "" }, processedAt: Date.now() };
    if (boughtBy) updates.boughtBy = boughtBy;
    if (status === 'sold') { updates.sold = true; updates.completedAt = Date.now(); }
    if (status === 'approved') {
      const now = Date.now();
      Object.assign(updates, { expiresAt: now + (30 * 24 * 60 * 60 * 1000), createdAt: now, warningDismissedAt: null, holdingBy: null, boughtBy: null, buyerReported: false, sellerReported: false, conflict: false, claimants: null, adminMessage: null, hiddenFromMarket: false, sellerSeenDeletionAt: null, sold: false });
    }
    await update(ref(rtdb, `accountPosts/${postId}`), updates);
    const postSnap = await get(ref(rtdb, `accountPosts/${postId}`));
    const postData = postSnap.val();
    if (postData?.uid) broadcastNotification(status === 'approved' ? "Post Approved! ✅" : "Listing Update 🎮", `Post #${postId.toUpperCase()} is now ${status}.`, postData.uid);
    setIsGlobalLoading(false);
  }, [rtdb, enhancedUser, broadcastNotification]);

  const enforceAccountAction = useCallback(async (postId: string, action: string, message: string) => {
    if (!rtdb || !enhancedUser?.isAdmin) return;
    setIsGlobalLoading(true);
    if (action === 'delete') { await update(ref(rtdb, `accountPosts/${postId}`), { adminMessage: message, sellerSeenDeletionAt: Date.now(), hiddenFromMarket: true, status: 'rejected' }); }
    else { await update(ref(rtdb, `accountPosts/${postId}`), { status: action, adminMessage: message }); }
    toast({ title: "Enforcement Applied" });
    setIsGlobalLoading(false);
  }, [rtdb, enhancedUser]);

  const issueSellerWarning = useCallback(async (uid: string, postId: string, message: string) => {
    if (!rtdb || !enhancedUser?.isAdmin) return;
    setIsGlobalLoading(true);
    const refW = push(ref(rtdb, `users/${uid}/warnings`));
    await set(refW, { id: refW.key, postId, message, timestamp: Date.now() });
    broadcastNotification("Formal Warning Issued! ⚠️", `Security alert: ${message}`, uid);
    setIsGlobalLoading(false);
  }, [rtdb, enhancedUser, broadcastNotification]);

  const suspendSeller = useCallback(async (uid: string, days: number) => {
    if (!rtdb || !enhancedUser?.isAdmin) return;
    setIsGlobalLoading(true);
    await update(ref(rtdb, `users/${uid}`), { suspendedUntil: Date.now() + (days * 24 * 60 * 60 * 1000) });
    broadcastNotification("Account Suspended! 🚫", `Suspended for ${days} days.`, uid);
    setIsGlobalLoading(false);
  }, [rtdb, enhancedUser, broadcastNotification]);

  const dismissAccountWarning = useCallback(async (postId: string) => {
    if (!rtdb || !enhancedUser?.isAdmin) return;
    setIsGlobalLoading(true);
    await update(ref(rtdb, `accountPosts/${postId}`), { warningDismissedAt: Date.now() });
    setIsGlobalLoading(false);
  }, [rtdb, enhancedUser]);

  const markDeletionAsSeen = useCallback(async (postId: string) => { if (!rtdb) return; await update(ref(rtdb, `accountPosts/${postId}`), { sellerSeenDeletionAt: Date.now() }); }, [rtdb]);

  const reportAccountOutcome = useCallback(async (postId: string, outcome: 'bought' | 'not_bought') => {
    if (!rtdb || !authUser || !enhancedUser) return;
    setIsGlobalLoading(true);
    const postRef = ref(rtdb, `accountPosts/${postId}`);
    const postSnap = await get(postRef);
    const postData = postSnap.val();
    if (!postData) { setIsGlobalLoading(false); return; }
    const targetOrder = orders.find(o => o.gameDetails?.postId === postId && o.userId === authUser.uid);
    if (outcome === 'not_bought') {
      const updates: any = {};
      if (postData.claimants?.[authUser.uid]) updates[`accountPosts/${postId}/claimants/${authUser.uid}`] = null;
      if (targetOrder) updates[`orders/${targetOrder.id}`] = null;
      if (Object.keys(updates).length > 0) await update(ref(rtdb), updates);
    } else {
      const reportTime = Date.now();
      const info = { uid: authUser.uid, name: enhancedUser.name || "Buyer", whatsapp: targetOrder?.gameDetails?.whatsappNumber || enhancedUser.phoneNumber || "N/A", photo: enhancedUser.photoURL || "", timestamp: reportTime, status: 'pending', isVerified: enhancedUser.isVerified || false };
      await update(ref(rtdb, `accountPosts/${postId}/claimants/${authUser.uid}`), info);
      await update(postRef, { buyerReported: true, buyerReportedAt: reportTime });
      if (targetOrder) await update(ref(rtdb, `orders/${targetOrder.id}`), { buyerOutcome: outcome });
      if (postData.uid) broadcastNotification("New Contact! 💰", `Interest in your account.`, postData.uid);
      await broadcastAdminNotification("Buyer Report!", `Buyer interest for account #${postId.toUpperCase()}.`);
    }
    setIsGlobalLoading(false);
  }, [rtdb, authUser, enhancedUser, orders, broadcastNotification, broadcastAdminNotification]);

  const respondToSaleReport = useCallback(async (postId: string, confirmed: boolean, buyerId?: string) => {
    if (!rtdb || !authUser || !buyerId) return;
    setIsGlobalLoading(true);
    const postSnap = await get(ref(rtdb, `accountPosts/${postId}`));
    const postData = postSnap.val();
    const updates: any = {};
    const reportTime = Date.now();
    updates[`accountPosts/${postId}/sellerReported`] = true;
    if (confirmed) {
      updates[`accountPosts/${postId}/status`] = 'sold';
      updates[`accountPosts/${postId}/sold`] = true;
      updates[`accountPosts/${postId}/boughtBy`] = buyerId;
      updates[`accountPosts/${postId}/completedAt`] = reportTime;
      broadcastNotification("Purchase Update! 🤑", "Seller has confirmed!", buyerId);
    } else {
      updates[`accountPosts/${postId}/claimants/${buyerId}/status`] = 'rejected';
      updates[`accountPosts/${postId}/status`] = 'holding';
      await broadcastAdminNotification("Conflict!", `Seller rejected buyer claim for #${postId.toUpperCase()}.`);
    }
    await update(ref(rtdb), updates);
    setIsGlobalLoading(false);
  }, [rtdb, authUser, broadcastNotification, broadcastAdminNotification]);

  const updateUserProfile = useCallback(async (updates: any) => { 
    if (!rtdb || !authUser) return; 
    setIsGlobalLoading(true);
    await update(ref(rtdb, `users/${authUser.uid}`), updates); 
    if (updates.phoneNumber && updates.name) localStorage.setItem(`oskar_profile_complete_${authUser.uid}`, 'true');
    setIsGlobalLoading(false);
  }, [rtdb, authUser]);

  const manageUser = useCallback(async (uid: string, updates: Partial<UserProfile>) => { if (!rtdb) return; setIsGlobalLoading(true); await update(ref(rtdb, `users/${uid}`), updates); setIsGlobalLoading(false); }, [rtdb]);
  
  const deleteUser = useCallback(async (uid: string) => { 
    if (!rtdb || !enhancedUser?.isAdmin) return; 
    setIsGlobalLoading(true);
    try {
      const res = await fetch('/api/delete-user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ uid }) });
      if ((await res.json()).success) await remove(ref(rtdb, `users/${uid}`)); 
    } catch (err) { toast({ title: "Deletion Failed", variant: "destructive" }); } finally { setIsGlobalLoading(false); }
  }, [rtdb, enhancedUser]);

  const sendMessage = useCallback(async (text?: string, imageUrl?: string, targetId?: string) => {
    if (!rtdb || !authUser) return;
    const tid = targetId || (enhancedUser?.isAdmin ? chatTargetId : authUser.uid);
    if (!tid) return;
    const msg: any = { senderId: authUser.uid, timestamp: Date.now(), isRead: false };
    if (text) msg.text = text; if (imageUrl) msg.imageUrl = imageUrl;
    await push(ref(rtdb, `chats/${tid}`), msg);
    await update(ref(rtdb, `chatIndex/${tid}`), { lastMessage: text || "📷 Screenshot", lastTimestamp: Date.now(), unreadCount: increment(1), userName: enhancedUser?.isAdmin ? (allChatSessions.find(s => s.userId === tid)?.userName || "User") : enhancedUser?.name, userPhoto: enhancedUser?.isAdmin ? (allChatSessions.find(s => s.userId === tid)?.userPhoto || "") : enhancedUser?.photoURL });
  }, [rtdb, authUser, enhancedUser, chatTargetId, allChatSessions]);

  const markMessagesAsRead = useCallback(async (tid?: string) => { if (!rtdb || !authUser) return; await update(ref(rtdb, `chatIndex/${tid || authUser.uid}`), { unreadCount: 0 }); }, [rtdb, authUser]);

  const saveGame = useCallback(async (g: any) => { if (!rtdb) return; setIsGlobalLoading(true); const { id, ...data } = g; if (id) await update(ref(rtdb, `games/${id}`), data); else await push(ref(rtdb, 'games'), { ...data, createdAt: Date.now() }); setIsGlobalLoading(false); }, [rtdb]);
  const deleteGame = useCallback(async (id: string) => { if (!rtdb) return; setIsGlobalLoading(true); await remove(ref(rtdb, `games/${id}`)); const dbUpdates: any = {}; products.filter(p => p.gameId === id).forEach(p => dbUpdates[`products/${p.id}`] = null); await update(ref(rtdb), dbUpdates); setIsGlobalLoading(false); }, [rtdb, products]);
  const saveProduct = useCallback(async (p: any) => { if (!rtdb) return; setIsGlobalLoading(true); const { id, ...data } = p; if (id) await update(ref(rtdb, `products/${id}`), data); else await push(ref(rtdb, 'products'), data); setIsGlobalLoading(false); }, [rtdb]);
  const deleteProduct = useCallback(async (id: string) => { setIsGlobalLoading(true); await remove(ref(rtdb, `products/${id}`)); setIsGlobalLoading(false); }, [rtdb]);
  const updateProductsOrder = useCallback(async (updates: any[]) => { if (!rtdb) return; setIsGlobalLoading(true); const dbUpdates: any = {}; updates.forEach(u => dbUpdates[`products/${u.id}/orderIndex`] = u.orderIndex); await update(ref(rtdb), dbUpdates); setIsGlobalLoading(false); }, [rtdb]);
  const saveEvent = useCallback(async (e: any) => { 
    if (!rtdb) return; setIsGlobalLoading(true); const { id, duration, durationUnit, ...data } = e; let expiresAt = data.expiresAt || null;
    if (duration && durationUnit) {
      const now = Date.now(); const val = parseInt(duration);
      if (durationUnit === 'days') expiresAt = now + (val * 24 * 60 * 60 * 1000);
      else if (durationUnit === 'hours') expiresAt = now + (val * 60 * 60 * 1000);
      else if (durationUnit === 'minutes') expiresAt = now + (val * 1000 * 60);
    }
    const eventToSave = { ...data, expiresAt, createdAt: Date.now() };
    if (id) await update(ref(rtdb, `events/${id}`), eventToSave); else await push(ref(rtdb, 'events'), eventToSave);
    setIsGlobalLoading(false);
  }, [rtdb]);
  const deleteEvent = useCallback(async (id: string) => { setIsGlobalLoading(true); await remove(ref(rtdb, `events/${id}`)); setIsGlobalLoading(false); }, [rtdb]);
  const saveBanner = useCallback(async (b: any) => { if (!rtdb) return; setIsGlobalLoading(true); const { id, ...data } = b; if (id) await update(ref(rtdb, `banners/${id}`), data); else await push(ref(rtdb, 'banners'), { ...data, createdAt: Date.now(), active: true }); setIsGlobalLoading(false); }, [rtdb]);
  const deleteBanner = useCallback(async (id: string) => { if (!rtdb) return; setIsGlobalLoading(true); await remove(ref(rtdb, `banners/${id}`)); setIsGlobalLoading(false); }, [rtdb]);
  const savePaymentMethod = useCallback(async (m: any) => { if (!rtdb) return; setIsGlobalLoading(true); const { id, ...data } = m; if (id) await update(ref(rtdb, `settings/paymentMethods/${id}`), data); else await push(ref(rtdb, 'settings/paymentMethods'), { ...data, active: true }); setIsGlobalLoading(false); }, [rtdb]);
  const deletePaymentMethod = useCallback(async (id: string) => { if (!rtdb) return; setIsGlobalLoading(true); await remove(ref(rtdb, `settings/paymentMethods/${id}`)); setIsGlobalLoading(false); }, [rtdb]);
  const savePromoCode = useCallback(async (promo: any) => {
    if (!rtdb || !promo.code) return; setIsGlobalLoading(true);
    const { duration, durationUnit, discount, ...rest } = promo;
    let exp = Date.now() + (30 * 24 * 60 * 60 * 1000);
    if (duration && durationUnit) {
      const val = parseInt(duration);
      if (durationUnit === 'minutes') exp = Date.now() + (val * 60 * 1000);
      else if (durationUnit === 'hours') exp = Date.now() + (val * 60 * 60 * 1000);
      else if (durationUnit === 'days') exp = Date.now() + (val * 24 * 60 * 60 * 1000);
    }
    await set(ref(rtdb, `promo_codes/${promo.code.trim().toUpperCase()}`), { ...rest, code: promo.code.trim().toUpperCase(), discount: parseFloat(discount) || 0, expiresAt: exp, createdAt: Date.now(), claimed: false, usedBy: null, expired: false });
    setIsGlobalLoading(false);
  }, [rtdb]);
  const deletePromoCode = useCallback(async (id: string) => { if (!rtdb) return; setIsGlobalLoading(true); await remove(ref(rtdb, `promo_codes/${id}`)); setIsGlobalLoading(false); }, [rtdb]);
  const checkPromoCode = useCallback(async (code: string): Promise<number> => {
    if (!rtdb || !authUser) throw new Error("Connection error");
    setIsGlobalLoading(true);
    try {
      const snap = await get(ref(rtdb, `promo_codes/${code.trim().toUpperCase()}`));
      if (!snap.exists()) throw new Error("Invalid code");
      const d = snap.val(); if (d.expiresAt < Date.now()) throw new Error("Code expired");
      if ((d.type === 'single_use' || !d.type) && d.claimed) throw new Error("Already claimed");
      if (d.type === 'multi_use' && d.usedByUsers?.[authUser.uid]) throw new Error("Already used");
      return Number(d.discount) || 0;
    } finally { setIsGlobalLoading(false); }
  }, [rtdb, authUser]);

  const updateStoreSettings = useCallback(async (s: any) => { if (!rtdb) return; setIsGlobalLoading(true); await update(ref(rtdb, 'settings'), s); await broadcastAdminNotification("Store Settings Updated ⚙️", "Global configuration was updated."); setIsGlobalLoading(false); }, [rtdb, broadcastAdminNotification]);
  const updateAdminSettings = useCallback(async (s: any) => { if (!rtdb) return; setIsGlobalLoading(true); await update(ref(rtdb, 'admin_settings'), s); setIsGlobalLoading(false); }, [rtdb]);
  const acceptTerms = useCallback(async () => { if (typeof window !== 'undefined') localStorage.setItem('oskar_terms_accepted', 'true'); if (authUser && rtdb) await update(ref(rtdb, `users/${authUser.uid}`), { termsAccepted: true }); }, [authUser, rtdb]);

  const saveEventAccount = useCallback(async (e: Partial<EventAccount>) => {
    if (!rtdb) return; setIsGlobalLoading(true);
    const { id, ...data } = e; const startTime = Number(data.startTime) || Date.now();
    const eventToSave = { ...data, status: Date.now() < startTime ? 'upcoming' : 'active', createdAt: Date.now(), participantsCount: 0 };
    if (id) await update(ref(rtdb, `eventAccounts/${id}`), data); else await set(push(ref(rtdb, 'eventAccounts')), eventToSave);
    setIsGlobalLoading(false);
  }, [rtdb]);
  const deleteEventAccount = useCallback(async (id: string) => { if (!rtdb) return; setIsGlobalLoading(true); await remove(ref(rtdb, `eventAccounts/${id}`)); await remove(ref(rtdb, `eventParticipants/${id}`)); await remove(ref(rtdb, `eventTaps/${id}`)); setIsGlobalLoading(false); }, [rtdb]);
  const tapEventAccount = useCallback(async (eventId: string, phone: string) => {
    if (!rtdb || !authUser || !enhancedUser) return;
    const snap = await get(ref(rtdb, `eventParticipants/${eventId}/${authUser.uid}`));
    const pData = snap.val(); if (pData?.status === 'banned') return;
    const now = Date.now(); if (now - (pData?.lastTapTime || 0) < 120000) return;
    const eSnap = await get(ref(rtdb, `eventAccounts/${eventId}`));
    const eData = eSnap.val(); if (eData.status !== 'active' || now > eData.endTime) return;
    const newTaps = (pData?.taps || 0) + 1; const newVal = eData.initialPrice + (newTaps * eData.tapPrice);
    const updates: any = {};
    updates[`eventParticipants/${eventId}/${authUser.uid}`] = { uid: authUser.uid, name: enhancedUser.name || "Gamer", phone, avatar: enhancedUser.photoURL || "", taps: newTaps, value: newVal, lastTapTime: now, status: 'active', isVerified: enhancedUser.isVerified || false };
    let top = (eData.topParticipants || []).filter((p: any) => p.uid !== authUser.uid);
    top.unshift({ uid: authUser.uid, avatar: enhancedUser.photoURL || "", isVerified: enhancedUser.isVerified || false });
    updates[`eventAccounts/${eventId}/topParticipants`] = top.slice(0, 3);
    const feedRef = push(ref(rtdb, `eventTaps/${eventId}`));
    updates[`eventTaps/${eventId}/${feedRef.key}`] = { name: enhancedUser.name, avatar: enhancedUser.photoURL, timestamp: now, taps: newTaps, value: newVal, isVerified: enhancedUser.isVerified };
    if (newTaps >= (eData.topTapsCount || 0)) { updates[`eventAccounts/${eventId}/topTapperId`] = authUser.uid; updates[`eventAccounts/${eventId}/topTapsCount`] = newTaps; updates[`eventAccounts/${eventId}/topBidderName`] = enhancedUser.name; }
    if (!pData) updates[`eventAccounts/${eventId}/participantsCount`] = increment(1);
    if (eData.endTime && now > (eData.endTime - 2000)) updates[`eventAccounts/${eventId}/endTime`] = now + 2000;
    await update(ref(rtdb), updates);
  }, [rtdb, authUser, enhancedUser]);

  const updateEventStatus = useCallback(async (eventId: string, status: string) => {
    if (!rtdb) return; const eRef = ref(rtdb, `eventAccounts/${eventId}`);
    const eSnap = await get(eRef); const eData = eSnap.val(); if (!eData || eData.status === status) return;
    const updates: any = { status };
    if (status === 'ended') {
      const pSnap = await get(ref(rtdb, `eventParticipants/${eventId}`)); const pVal = pSnap.val();
      if (pVal) {
        const sorted = Object.values(pVal).sort((a: any, b: any) => b.taps - a.taps || a.lastTapTime - b.lastTapTime);
        const top1 = sorted[0] as any;
        if (top1) { updates.winnerId = top1.uid; updates.winnerClaim = { status: 'pending', finalPrice: top1.value, modalId: Date.now().toString() }; broadcastNotification("Hampalyo! 🏆", `Auction Win: ${eData.title}`, top1.uid); }
      }
    }
    await update(eRef, updates);
  }, [rtdb, broadcastNotification]);

  const assignEventWinner = useCallback(async (eventId: string, winnerId: string) => {
    if (!rtdb || !enhancedUser?.isAdmin) return; setIsGlobalLoading(true);
    const wSnap = await get(ref(rtdb, `eventParticipants/${eventId}/${winnerId}`));
    if (wSnap.exists()) { await update(ref(rtdb, `eventAccounts/${eventId}`), { winnerId, status: 'ended', winnerClaim: { status: 'pending', finalPrice: wSnap.val().value, modalId: Date.now().toString() } }); }
    setIsGlobalLoading(false);
  }, [rtdb, enhancedUser]);

  return (
    <AppContext.Provider value={{ 
      user: enhancedUser, loading, isGlobalLoading, isInitialLoading, authError, activeTab, setActiveTab, setGlobalLoading: setIsGlobalLoading,
      login, signup, logout, buyNow, orders, allOrders, games, products, allUsers, accountPosts, eventAccounts, promoCodes, notifications, adminNotifications, events, banners,
      createOrder, postAccount, updateAccountPost, renewAccountPost, deleteAccountPost, markAccountAsSold, deleteOrder, buyAccountPost, markNotificationsAsRead, markAdminNotificationsAsRead, updateOrderStatus, updateAccountPostStatus, reportAccountOutcome, respondToSaleReport, enforceAccountAction, issueSellerWarning, suspendSeller, dismissAccountWarning, markDeletionAsSeen,
      updateUserProfile, manageUser, deleteUser, saveGame, deleteGame, saveProduct, deleteProduct, updateProductsOrder, saveEvent, deleteEvent, saveBanner, deleteBanner, savePaymentMethod, deletePaymentMethod, savePromoCode, deletePromoCode, checkPromoCode, storeSettings, updateStoreSettings, updateAdminSettings,
      broadcastNotification, broadcastAdminNotification, messages, allChatSessions, chatTargetId, setChatTargetId, sendMessage, markMessagesAsRead, refreshAdminData, refreshFcmToken,
      theme, toggleTheme, isBannedModalOpen, setIsBannedModalOpen, bannedInfo, isPostingAccount, setIsPostingAccount,
      acceptTerms, language, setLanguage, userProfile, t, resetLeaderboard, rtdb,
      saveEventAccount, deleteEventAccount, tapEventAccount, assignEventWinner, updateEventStatus, respondToEventClaim
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
