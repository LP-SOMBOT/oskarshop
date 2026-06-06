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

type PromoCode = {
  id: string;
  code: string;
  discount: number; // percentage
  createdAt: number;
  expiresAt: number;
  usedBy: string | null;
  claimed: boolean;
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
  suspendedUntil?: number;
  warnings?: Record<string, UserWarning>;
  leaderboardRank?: number | null;
  leaderboardDiscount?: number;
  fcmToken?: string;
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
    accounts: "Accounts",
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
    delivering_diamonds: "Delivering Diamonds...",
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
    marketplace: "Marketplace",
    game_type: "Game Type",
    login_method: "Login Method",
    account_age: "Account Age",
    selling_price: "Selling Price ($)",
    listing_duration: "Listing Duration",
    whatsapp_number_support: "WhatsApp for Support",
    sender_number_label: "Enter sender's number",
    pay_listing_fee_title: "Pay Listing Fee",
    pay_listing_fee_desc: "Please pay the account listing fee to proceed.",
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
    respond_accounts_warning_desc: "Someone said \"I bought it\" for your account, and the admin will contact you via WhatsApp. Please respond to the verification quickly. If you don't respond within 24 hours, the account will be removed from the listing.",
    reference_label: "Reference",
    posted_label: "Posted",
    level_label: "Level",
    expires_label: "Expires",
    price_label: "Price",
    sold_confirmation_prompt: "If this account was bought, please click below",
    mark_as_sold_btn: "Sold",
    delete_record_btn: "Delete this account",
    renew_listing_btn: "Renew Listing",
    renew_listing_desc: "Choose a new term for your account to return to the marketplace.",
    choose_term_label: "Choose New Term",
    weekly_term: "Weekly (7 Days)",
    monthly_term: "Monthly (30 Days)",
    pay_renewal_btn: "PAY FOR RENEWAL",
    confirm_reactivate_btn: "CONFIRM & REACTIVATE",
    finalized_sale_title: "Finalized Sale",
    final_buyer_label: "Final Buyer",
    sold_at_label: "Sold at",
    admin_response_title: "Admin Response",
    urgent_notice_label: "Urgent Notice",
    read_decision_btn: "I have read the decision",
    auto_delete_prefix: "Auto-Deleting record in:",
    purchase_claims_title: "Purchase Claims",
    verify_buyer_desc: "Verify the person who bought your account",
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
    listing_flagged_fallback: "This account listing has been cancelled. Please contact OskarShop for more information.",
    login_to_view_orders: "Login to view your orders",
    login_required_desc: "Sign in to access your purchase history and tracking details.",
    login_button: "Login"
  },
  so: {
    home: "HOME",
    games: "Adeego",
    accounts: "Suuqa",
    orders: "Dalabaadka",
    profile: "Profile",
    chat: "Sheeko",
    notifications: "Ogeysiis",
    ranking: "Leaderboard",
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
    verifying_payment: "Dalabkaka waa la diray, Mahadsanid!.",
    delivering_diamonds: "Xogta ayaa la xaqiijinooyaa fadlan dulqaadka badi.",
    delivered_success: "Dalabkaaga waa Laguu Soo diray, Mahadsanid!.",
    order_cancelled: "Dalabka waa la kansalay sababta:",
    admin_message: "Fariinta Admin-ka",
    buy_now: "IIBSO",
    login_to_buy: "Login",
    select_game: "Dooro Game ka",
    active_events: "Event yada",
    take_advantage: "Ka faa'ideeyso intuusan dhamaan!",
    ranking_desc: "iib sameey Si aad u gasho kaalmaha hore una heshid discount gaaraya ilaa %3, halkii iibin top up waxaad Ku heleesaa 1 points (pts). Hadiyado kalena coming soon I.a.",
    view: "Eeg",
    time_left: "Waqtiga haray",
    buy_button: "iibso",
    terms_of_service: "Sharuudaha/xeerarka website ka",
    read_terms: "Akhri Shuruudaha",
    photo_updated: "Sawirka waa la soo geliyey!",
    terms_welcome: "Ku soo dhawaada Oskar Shop. Si loo damaanad qaado deegaan ammaan ah dhammaan ciyaartoyda, fadlan dib u eeg Shuruudaha iyo Qawaaniinta ka hor intaadan sii socon.",
    compliance_protocol: "Hab-maamuuska u hoggaansanaanta",
    forgot_password: "Ma ilaawday password-ka?",
    reset_password: "Bedel Password-ka",
    reset_email_sent: "Ka hubi email-kaaga linkiga bedelaada.",
    enter_reset_email: "Geli email-kaaga si lagugu soo diro linkiga bedelaada.",
    account_gallery: "Soo Geli dhamaan Sawirada accounti-ga",
    upload_photos_prompt: "Riix halkaan Si aad sawir usoo gelisid",
    game_identity: "Xogta Game ka",
    marketplace: "Suuqa account yada",
    game_type: "Dooro nooca Game ka",
    login_method: "Qaabka lagu Soo galo",
    account_age: "Geli da' da account tiga",
    selling_price: "Qiimaha aad Ku rabtid ( $ )",
    listing_duration: "Dooro Term ka",
    whatsapp_number_support: "Geli WhatsApp kaga",
    sender_number_label: "Geli number ka lacagta kasoo direesid",
    pay_listing_fee_title: "Bixi Qarashka",
    pay_listing_fee_desc: "Fadlan bixi qarashka Soo gelinta account-ka (listing fee), qiimuhu waa",
    premium_assets: "Waxyabaha account tiga yaalo",
    verify_assets_desc: "Confirm correctly and check carefully",
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
    respond_accounts_warning_title: "Kaja Waab Account-yadaada",
    respond_accounts_warning_desc: "Someone said \"I bought it\" for your account, and the admin will contact you via WhatsApp. Please respond to the verification quickly. If you don't respond within 24 hours, the account will be removed from the listing.",
    reference_label: "Reference",
    posted_label: "Posted",
    level_label: "Level",
    expires_label: "Expires",
    price_label: "Qiimaha",
    sold_confirmation_prompt: "Hadii la iibsatay account kaan fadlan Riix halkaan hoose",
    mark_as_sold_btn: "Wuu gatay",
    delete_record_btn: "Delete account kaan",
    renew_listing_btn: "Renew Listing",
    renew_listing_desc: "Muda cusub u door account-kaaga si uu marketplace-ka ugu soo laabto.",
    choose_term_label: "Dooro Muda Cusub",
    weekly_term: "Weekly (Isbuucle)",
    monthly_term: "Monthly (Bile)",
    pay_renewal_btn: "PAY FOR RENEWAL",
    confirm_reactivate_btn: "CONFIRM & REACTIVATE",
    finalized_sale_title: "Finalized Sale",
    final_buyer_label: "Final Buyer",
    sold_at_label: "Sold at",
    admin_response_title: "Jawaabta Maamulka",
    urgent_notice_label: "Ogeysiis Degdeg ah",
    read_decision_btn: "Waan akhriyay go'aanka",
    auto_delete_prefix: "Record-ka waxaa si toos ah loo tirtiri doonaa:",
    purchase_claims_title: "Purchase Claims",
    verify_buyer_desc: "Xaqiiji qofka kaa iibsaday account-ka",
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
    login_button: "Login"
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
    promoCodes: false
  });

  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => getCache(SETTINGS_CACHE_KEY, {}));
  const [games, setGames] = useState<Game[]>(() => getCache(GAMES_CACHE_KEY, []));
  const [products, setProducts] = useState<GamePackage[]>(() => getCache(PRODUCTS_CACHE_KEY, []));
  const [accountPosts, setAccountPosts] = useState<AccountPost[]>([]);
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

    // Trigger OneSignal push via SERVER-SIDE API route
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
      // Trigger OneSignal push to all admins via SERVER-SIDE API route
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
        leaderboardDiscount: 0
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
          leaderboardDiscount: 0
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
          router.push(tab === 'home' ? '/' : `/#${tab}`);
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
    // Safety timeout to prevent stuck loader
    setTimeout(() => setIsGlobalLoading(false), 2000);
  }, [authUser, router]);

  const createOrder = useCallback(async (paymentMethod: string, gameDetails: any, directItem: CartItem, promoCode?: string) => {
    if (!rtdb || !authUser) return;
    setIsGlobalLoading(true);
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
    
    // Add verification details if present in gameDetails
    if (gameDetails.ffUid) {
      newOrder.ffUid = gameDetails.ffUid;
      newOrder.ffPlayerName = gameDetails.ffPlayerName;
      newOrder.ffVerified = gameDetails.ffVerified;
      newOrder.ffRegion = gameDetails.ffRegion;
    }
    
    await set(ref(rtdb, `orders/${orderId}`), newOrder);

    if (promoCode) {
      const standardizedCode = promoCode.trim().toUpperCase();
      await update(ref(rtdb, `promo_codes/${standardizedCode}`), {
        claimed: true,
        usedBy: authUser.uid
      });
    }

    // --- TELEGRAM NOTIFICATION (Instant & Fire-and-forget) ---
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

    // Trigger SERVER-SIDE admin notification
    fetch('/api/notify-new-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, itemTitle: directItem.title })
    }).catch(err => console.error("OneSignal admin notify failed", err));

    await broadcastAdminNotification("New Order Received! 🛍️", `Order #${orderId.toUpperCase()} for ${directItem.title} is pending verification.`, true);
    setIsGlobalLoading(false);
  }, [rtdb, authUser, userProfile, broadcastAdminNotification]);

  const orders = useMemo(() => {
    if (!authUser) return [];
    return allOrders.filter(o => o.userId === authUser.uid).sort((a,b)=>b.createdAt - a.createdAt);
  }, [allOrders, authUser]);

  const userRankData = useMemo(() => {
    if (!authUser || !allUsers.length || !syncStatus.settings) return { rank: null, discount: 0 };
    
    const settings = storeSettings.leaderboard || {
      rewardsActive: false,
      rewards: { rank1: 0, rank2: 0, rank3: 0 }
    };

    if (!settings.rewardsActive) return { rank: null, discount: 0 };

    const sorted = [...allUsers].sort((a, b) => (b.points || 0) - (a.points || 0));
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
      if (u) {
        ensureUserProfile(u);
        refreshFcmToken();
      } else {
        setUserProfile(null);
        localStorage.removeItem(USER_CACHE_KEY);
      }
    });
    return () => unsubscribe();
  }, [auth, ensureUserProfile, refreshFcmToken]);

  useEffect(() => {
    if (!rtdb || !authUser) return;
    const userRef = ref(rtdb, `users/${authUser.uid}`);
    const updatePresence = () => {
      update(userRef, { lastActive: Date.now() });
    };
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

  const t = useCallback((key: string) => {
    return translations[language][key] || key;
  }, [language]);

  const isInitialLoading = useMemo(() => {
    return !syncStatus.settings || !syncStatus.products || !syncStatus.banners || !syncStatus.events || !syncStatus.games;
  }, [syncStatus]);

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

  useEffect(() => {
    if (!rtdb) return;
    
    const settingsRef = ref(rtdb, 'settings');
    const gamesRef = ref(rtdb, 'games');
    const productsRef = ref(rtdb, 'products');
    const accPostsRef = ref(rtdb, 'accountPosts');
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
      off(settingsRef); off(gamesRef); off(productsRef); off(accPostsRef); off(promoCodesRef); off(eventsRef); off(bannersRef); off(usersRef);
    };
  }, [rtdb, syncStatus.settings, storeSettings.isLive, storeSettings.appStatus?.offline, showPushNotification]);

  useEffect(() => {
    if (!rtdb || !authUser) {
      setNotifications(prev => prev.length > 0 ? [] : prev);
      return;
    }
    const profileRef = ref(rtdb, `users/${authUser.uid}`);
    const notifsRef = query(ref(rtdb, `notifications/${authUser.uid}`), limitToLast(20));

    onValue(profileRef, (s) => {
      const data = s.val();
      setUserProfile(data);
      if (data) {
        setCache(USER_CACHE_KEY, data);
        const isComplete = data.phoneNumber && data.name;
        if (isComplete) {
          localStorage.setItem(`oskar_profile_complete_${authUser.uid}`, 'true');
        }
      }
      if (data?.banned) {
        setBannedInfo({
          name: data.name || "N/A",
          uid: data.uid || authUser.uid,
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

    return () => {
      off(profileRef); off(notifsRef);
    };
  }, [rtdb, authUser, showPushNotification, logout]);

  // Foreground messaging listener
  useEffect(() => {
    if (!messaging) return;
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      const title = payload.notification?.title || 'Notification';
      const body = payload.notification?.body || '';
      if (title && body) {
        toast({ title, description: body });
        if (Notification.permission === 'granted') {
          new Notification(title, { body, icon: storeSettings.logo });
        }
      }
    });
    return () => unsubscribe();
  }, [messaging, storeSettings.logo]);

  const enhancedUser = useMemo(() => {
    if (!authUser) return null;
    const role = userProfile?.role || 'user';
    return { 
      ...authUser, 
      ...userProfile, 
      isAdmin: role === 'admin' || role === 'super_admin' || role === 'staff',
      leaderboardRank: userRankData.rank,
      leaderboardDiscount: userRankData.discount
    };
  }, [authUser, userProfile, userRankData]);

  useEffect(() => {
    if (!rtdb || !authUser) {
      setAllOrders([]);
      setAdminNotifications([]);
      setAllChatSessions([]);
      return;
    }

    let ordersRef;
    if (enhancedUser?.isAdmin) {
      ordersRef = ref(rtdb, 'orders');
    } else {
      ordersRef = query(ref(rtdb, 'orders'), orderByChild('userId'), equalTo(authUser.uid));
    }

    const ordersUnsubscribe = onValue(ordersRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setAllOrders(Object.entries(val).map(([id, v]: any) => ({ ...v, id })).sort((a, b) => b.createdAt - a.createdAt));
      } else {
        setAllOrders([]);
      }
    });

    let adminNotifUnsubscribe = () => {};
    let chatIndexUnsubscribe = () => {};

    if (enhancedUser?.isAdmin) {
      const chatIndexRef = ref(rtdb, 'chatIndex');
      const adminNotifsRef = query(ref(rtdb, 'adminNotifications'), limitToLast(30));

      chatIndexUnsubscribe = onValue(chatIndexRef, (snapshot) => {
        const val = snapshot.val();
        setAllChatSessions(val ? Object.entries(val).map(([userId, v]: any) => ({ userId, ...v })).sort((a,b) => b.lastTimestamp - a.lastTimestamp) : []);
      });

      adminNotifUnsubscribe = onValue(adminNotifsRef, (snapshot) => {
        const data = snapshot.val() ? Object.entries(snapshot.val()).map(([id, v]: any) => ({ ...v, id })).sort((a,b) => b.createdAt - a.createdAt) : [];
        if (data.length > 0) {
          const latest = data[0];
          if (!latest.readBy?.[enhancedUser.uid] && latest.createdAt > sessionStartTime.current) {
            if (latest.type !== 'assignment_update') showPushNotification(latest.title, latest.body, "admin-push-" + latest.id);
          }
        }
        setAdminNotifications(data);
      });
    }

    return () => {
      ordersUnsubscribe();
      chatIndexUnsubscribe();
      adminNotifUnsubscribe();
    };
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
      await broadcastAdminNotification(
        "Leaderboard Reset! 🏆", 
        `System points have been reset for the new month (${currentMonth}) by ${enhancedUser.name}.`,
        true
      );
      toast({ title: "Reset Complete", description: "All points set to 0 for the new session." });
    } catch (error) {
      console.error("Reset failed:", error);
      toast({ title: "Reset Failed", variant: "destructive" });
    } finally {
      setIsGlobalLoading(false);
    }
  }, [rtdb, enhancedUser, allUsers, broadcastAdminNotification]);

  // Automated Monthly Leaderboard Reset logic
  useEffect(() => {
    if (!rtdb || !enhancedUser?.isAdmin || !syncStatus.settings || !syncStatus.allUsers || allUsers.length === 0) return;

    const currentMonth = format(new Date(), 'yyyy-MM');
    const lastReset = storeSettings?.lastResetMonth;

    if (lastReset !== currentMonth) {
       // A new month has started and no reset has happened yet.
       console.log(`[Leaderboard] Automated reset triggered for ${currentMonth}`);
       resetLeaderboard();
    }
  }, [rtdb, enhancedUser?.isAdmin, syncStatus.settings, syncStatus.allUsers, storeSettings?.lastResetMonth, allUsers, resetLeaderboard]);

  const postAccount = useCallback(async (data: any) => {
    if (!rtdb || !authUser) return;
    setIsGlobalLoading(true);
    const postRef = push(ref(rtdb, 'accountPosts'));
    await set(postRef, { ...data, uid: authUser.uid, authorName: enhancedUser?.name, authorPhone: enhancedUser?.phoneNumber, authorAvatar: enhancedUser?.photoURL, status: 'pending', createdAt: Date.now(), expiresAt: null, views: 0, sold: false });
    toast({ title: "Successfully posted!", description: "Waiting for admin approval of listing fee payment." });
    
    // --- TELEGRAM NOTIFICATION (Instant & Fire-and-forget) ---
    const listingFee = data.fee || 0;
    fetch('/api/notify-telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: postRef.key,
        customerName: enhancedUser?.name || 'Seller',
        customerPhone: enhancedUser?.phoneNumber || 'N/A',
        itemName: `${data.gameType} Account Listing`,
        amount: listingFee,
        ffUid: null,
        ffPlayerName: null,
      }),
    }).catch(() => {});

    // Server-side notify admins
    fetch('/api/notify-new-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: postRef.key, itemTitle: `${data.gameType} Account` })
    }).catch(err => console.error("Admin notify error", err));

    await broadcastAdminNotification("New Account Post! 🎮", `${enhancedUser?.name} listed a ${data.gameType} account.`, true);
    setIsGlobalLoading(false);
  }, [rtdb, authUser, enhancedUser, broadcastAdminNotification]);

  const updateAccountPost = useCallback(async (postId: string, data: any) => {
    if (!rtdb) return;
    setIsGlobalLoading(true);
    const { price, totalCharge, fee, ...editableData } = data;
    await update(ref(rtdb, `accountPosts/${postId}`), editableData);
    toast({ title: "Post Updated!" });
    setIsGlobalLoading(false);
  }, [rtdb]);

  const renewAccountPost = useCallback(async (postId: string, term: 'weekly' | 'monthly') => {
    if (!rtdb) return;
    setIsGlobalLoading(true);
    await update(ref(rtdb, `accountPosts/${postId}`), { term, expiresAt: null, status: 'pending', sold: false, holdingBy: null, boughtBy: null, buyerReported: false, buyerReportedAt: null, sellerReported: false, sellerReportedAt: null, conflict: false, adminMessage: null, hiddenFromMarket: false, sellerSeenDeletionAt: null, claimants: null, warningDismissedAt: null });
    toast({ title: "Renewal Initiated!", description: "Waiting for admin to verify renewal payment." });
    setIsGlobalLoading(false);
  }, [rtdb]);

  const deleteAccountPost = useCallback(async (pid: string) => { 
    if (!rtdb) return; 
    setIsGlobalLoading(true);
    await remove(ref(rtdb, `accountPosts/${pid}`)); 
    toast({ title: "Post Deleted" }); 
    setIsGlobalLoading(false);
  }, [rtdb]);
  
  const markAccountAsSold = useCallback(async (postId: string) => {
    if (!rtdb || !authUser) return;
    setIsGlobalLoading(true);
    await update(ref(rtdb, `accountPosts/${postId}`), {
      sold: true,
      status: 'sold',
      completedAt: Date.now()
    });
    toast({ title: "Account marked as sold!" });
    setIsGlobalLoading(false);
  }, [rtdb, authUser]);

  const deleteOrder = useCallback(async (oid: string) => { 
    if (!rtdb) return; 
    setIsGlobalLoading(true);
    await remove(ref(rtdb, `orders/${oid}`)); 
    toast({ title: "Order Deleted" }); 
    setIsGlobalLoading(false);
  }, [rtdb]);

  const buyAccountPost = useCallback((post: AccountPost) => {
    if (!authUser) {
      toast({ title: "Fadlan soo gal", description: "Waa inaad soo gashaa si aad u iibsato account-kan.", variant: "destructive" });
      router.push('/login');
      return;
    }
    setIsGlobalLoading(true);
    router.push(`/checkout-account?id=${post.id}`);
    // Safety timeout to prevent stuck loader
    setTimeout(() => setIsGlobalLoading(false), 2000);
  }, [authUser, router]);

  const markNotificationsAsRead = useCallback(async (nid?: string) => {
    if (!rtdb || !authUser) return;
    if (nid) await update(ref(rtdb, `notifications/${authUser.uid}/${nid}`), { read: true });
    else {
      const updates: any = {};
      notifications.forEach(n => updates[`notifications/${authUser.uid}/${n.id}/read`] = true);
      await update(ref(rtdb), updates);
    }
  }, [rtdb, authUser, notifications]);

  const markAdminNotificationsAsRead = useCallback(async (nid?: string) => {
    if (!rtdb || !enhancedUser?.isAdmin) return;
    if (nid) await update(ref(rtdb, `adminNotifications/${nid}/readBy/${enhancedUser.uid}`), true);
    else {
      const updates: any = {};
      adminNotifications.forEach(n => updates[`adminNotifications/${n.id}/readBy/${enhancedUser.uid}`] = true);
      await update(ref(rtdb), updates);
    }
  }, [rtdb, enhancedUser, adminNotifications]);

  const updateOrderStatus = useCallback(async (orderId: string, status: string, cancellationReason?: string) => {
    if (!rtdb || !enhancedUser?.isAdmin) return;
    setIsGlobalLoading(true);
    const updates: any = { status, processedBy: { uid: enhancedUser.uid, name: enhancedUser.name || "Admin", photoURL: enhancedUser.photoURL || "" }, processedAt: Date.now() };
    if (status === 'cancelled' && cancellationReason) updates.cancellationReason = cancellationReason;
    
    if (status === 'successful') {
      updates.completedAt = Date.now();
      const orderSnap = await get(ref(rtdb, `orders/${orderId}`));
      const orderData = orderSnap.val();
      
      if (orderData && orderData.userId) {
        const isAccount = orderData.gameId === 'accounts' || orderData.items?.[0]?.gameId === 'accounts';
        if (!isAccount) {
          await update(ref(rtdb, `users/${orderData.userId}`), { points: increment(1) });
        }
      }
    }
    await update(ref(rtdb), { [`orders/${orderId}`]: { ...allOrders.find(o => o.id === orderId), ...updates } });
    const orderSnap = await get(ref(rtdb, `orders/${orderId}`));
    const orderData = orderSnap.val();
    if (orderData && orderData.userId) {
      // SERVER-SIDE notify user via API route
      fetch('/api/notify-order-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, userId: orderData.userId, status })
      }).catch(err => console.error("OneSignal order notify failed", err));

      const title = status === 'successful' ? "Diamonds Delivered! ✅" : status === 'cancelled' ? "Order Cancelled ❌" : "Order Update 📦";
      const body = status === 'successful' ? `Your order #${orderId.toUpperCase()} is complete!` : status === 'cancelled' ? `Order #${orderId.toUpperCase()} was cancelled: ${cancellationReason || 'Contact support'}` : `Order #${orderId.toUpperCase()} status is now: ${status}`;
      broadcastNotification(title, body, orderData.userId);
    }
    setIsGlobalLoading(false);
  }, [rtdb, enhancedUser, allOrders, broadcastNotification]);

  const updateAccountPostStatus = useCallback(async (postId: string, status: string, boughtBy?: string) => {
    if (!rtdb || !enhancedUser?.isAdmin) return;
    setIsGlobalLoading(true);
    const updates: any = { 
      status, 
      processedBy: { 
        uid: enhancedUser.uid, 
        name: enhancedUser.name || "Admin", 
        photoURL: enhancedUser.photoURL || "" 
      }, 
      processedAt: Date.now() 
    };
    
    if (boughtBy) updates.boughtBy = boughtBy;
    if (status === 'sold') { 
      updates.sold = true; 
      updates.completedAt = Date.now(); 
    }
    
    if (status === 'approved') {
      const postSnap = await get(ref(rtdb, `accountPosts/${postId}`));
      const postData = postSnap.val();
      const now = Date.now();
      const duration = postData?.term === 'monthly' ? (30 * 24 * 60 * 60 * 1000) : (7 * 24 * 60 * 60 * 1000);
      
      updates.expiresAt = now + duration;
      updates.createdAt = now;
      updates.warningDismissedAt = null;
      updates.holdingBy = null;
      updates.boughtBy = null;
      updates.buyerReported = false;
      updates.buyerReportedAt = null;
      updates.sellerReported = false;
      updates.sellerReportedAt = null;
      updates.conflict = false;
      updates.claimants = null;
      updates.adminMessage = null;
      updates.hiddenFromMarket = false;
      updates.sellerSeenDeletionAt = null;
      updates.sold = false;
    }
    
    await update(ref(rtdb, `accountPosts/${postId}`), updates);
    const postSnap = await get(ref(rtdb, `accountPosts/${postId}`));
    const postData = postSnap.val();
    if (postData && postData.uid) {
       // SERVER-SIDE notify seller
       fetch('/api/notify-order-complete', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ orderId: postId, userId: postData.uid, status })
       }).catch(err => console.error("Seller notify failed", err));

       const title = status === 'approved' ? "Post Approved! ✅" : status === 'rejected' ? "Post Rejected ❌" : "Listing Update 🎮";
       broadcastNotification(title, `Your account listing #${postId.toUpperCase()} is now ${status}.`, postData.uid);
    }
    setIsGlobalLoading(false);
  }, [rtdb, enhancedUser, broadcastNotification]);

  const issueSellerWarning = useCallback(async (uid: string, postId: string, message: string) => {
    if (!rtdb || !enhancedUser?.isAdmin) return;
    setIsGlobalLoading(true);
    const warningRef = push(ref(rtdb, `users/${uid}/warnings`));
    await set(warningRef, {
      id: warningRef.key,
      postId,
      message,
      timestamp: Date.now()
    });
    
    // Notify via server-side
    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUids: [uid], title: " Formal Warning Issued! ⚠️", message: `Security alert for Listing #${postId.toUpperCase()}: ${message}` })
    }).catch(e => console.error(e));

    await broadcastNotification("Formal Warning Issued! ⚠️", `Security alert for Listing #${postId.toUpperCase()}: ${message}`, uid);
    toast({ title: "Warning Issued" });
    setIsGlobalLoading(false);
  }, [rtdb, enhancedUser, broadcastNotification]);

  const suspendSeller = useCallback(async (uid: string, days: number) => {
    if (!rtdb || !enhancedUser?.isAdmin) return;
    setIsGlobalLoading(true);
    const suspensionEnd = Date.now() + (days * 24 * 60 * 60 * 1000);
    await update(ref(rtdb, `users/${uid}`), { suspendedUntil: suspensionEnd });
    
    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUids: [uid], title: "Account Suspended! 🚫", message: `Your selling privileges are blocked for ${days} days.` })
    }).catch(e => console.error(e));

    await broadcastNotification("Account Suspended! 🚫", `Your selling privileges are blocked for ${days} days due to security violations.`, uid);
    toast({ title: `Seller suspended for ${days} days` });
    setIsGlobalLoading(false);
  }, [rtdb, enhancedUser, broadcastNotification]);

  const dismissAccountWarning = useCallback(async (postId: string) => {
    if (!rtdb || !enhancedUser?.isAdmin) return;
    setIsGlobalLoading(true);
    await update(ref(rtdb, `accountPosts/${postId}`), { warningDismissedAt: Date.now() });
    const postSnap = await get(ref(rtdb, `accountPosts/${postId}`));
    const postData = postSnap.val();
    if (postData?.uid) {
      await broadcastNotification("Warning Dismissed! ✅", `Responsive guard for Listing #${postId.toUpperCase()} has been cleared.`, postData.uid);
    }
    toast({ title: "Warning Dismissed" });
    setIsGlobalLoading(false);
  }, [rtdb, enhancedUser, broadcastNotification]);

  const reportAccountOutcome = useCallback(async (postId: string, outcome: 'bought' | 'not_bought') => {
    if (!rtdb || !authUser || !enhancedUser) return;
    setIsGlobalLoading(true);
    const postRef = ref(rtdb, `accountPosts/${postId}`);
    const postSnap = await get(postRef);
    const postData = postSnap.val();
    if (!postData) return;
    const targetOrder = orders.find(o => o.gameDetails?.postId === postId && o.userId === authUser.uid);

    if (outcome === 'not_bought') {
      const updates: any = {};
      if (postData.claimants?.[authUser.uid]) {
        updates[`accountPosts/${postId}/claimants/${authUser.uid}`] = null;
      }
      if (targetOrder) {
        updates[`orders/${targetOrder.id}`] = null;
      }
      const otherClaimants = Object.keys(postData.claimants || {}).filter(uid => uid !== authUser.uid);
      if (otherClaimants.length === 0) {
        updates[`accountPosts/${postId}/buyerReported`] = false;
        updates[`accountPosts/${postId}/buyerReportedAt`] = null;
      }
      
      if (Object.keys(updates).length > 0) await update(ref(rtdb), updates);
      toast({ title: "Deal Cancelled", description: "Listing reset successfully." });
    } else {
      const reportTime = Date.now();
      const claimantInfo = { uid: authUser.uid, name: enhancedUser.name || "Buyer", whatsapp: targetOrder?.gameDetails?.whatsappNumber || enhancedUser.phoneNumber || "N/A", photo: enhancedUser.photoURL || "", timestamp: reportTime, status: 'pending' };
      await update(ref(rtdb, `accountPosts/${postId}/claimants/${authUser.uid}`), claimantInfo);
      await update(postRef, { buyerReported: true, buyerReportedAt: reportTime });
      if (targetOrder) await update(ref(rtdb, `orders/${targetOrder.id}`), { buyerOutcome: outcome, gameDetails: { ...targetOrder.gameDetails, buyerReportedAt: reportTime } });
      toast({ title: "Report Sent!", description: "Seller has been notified to verify the sale." });

      // Notify seller via server-side
      if (postData.uid) {
        fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUids: [postData.uid], title: "New Purchase Claim! 💰", message: `A buyer reported they bought your ${postData.gameType} account.` })
        }).catch(e => console.error(e));
        broadcastNotification("New Purchase Claim! 💰", `A buyer reported they bought your ${postData.gameType} account. Please verify in My Accounts!`, postData.uid);
      }

      fetch('/api/notify-new-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: postId, itemTitle: 'Marketplace Claim' })
      }).catch(e => console.error(e));

      await broadcastAdminNotification("Buyer Report!", `Buyer reported purchase for account #${postId.toUpperCase()}.`);
    }
    setIsGlobalLoading(false);
  }, [rtdb, authUser, enhancedUser, orders, broadcastNotification, broadcastAdminNotification]);

  const respondToSaleReport = useCallback(async (postId: string, confirmed: boolean, buyerId?: string) => {
    if (!rtdb || !authUser) return;
    setIsGlobalLoading(true);
    const postRef = ref(rtdb, `accountPosts/${postId}`);
    const postSnap = await get(postRef);
    const postData = postSnap.val();
    if (!postData || !buyerId) return;
    const updates: any = {};
    const reportTime = Date.now();
    
    updates[`accountPosts/${postId}/sellerReported`] = true;
    updates[`accountPosts/${postId}/sellerReportedAt`] = reportTime;

    if (confirmed) {
      const otherClaimantsCount = Object.keys(postData.claimants || {}).length - 1;
      const hasPreviousRejections = Object.values(postData.claimants || {}).some(c => (c as any).status === 'rejected');

      if (hasPreviousRejections || otherClaimantsCount > 0) {
        updates[`accountPosts/${postId}/claimants/${buyerId}/status`] = 'accepted';
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
      toast({ title: "Response Recorded!", description: "Sale confirmed. Waiting for finalization." });
      
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUids: [buyerId], title: "Purchase Update! 🤑", message: "Seller has accepted your purchase claim!" })
      }).catch(e => console.error(e));

      broadcastNotification("Purchase Update! 🤑", "Seller has accepted your purchase claim!", buyerId);
    } else {
      updates[`accountPosts/${postId}/claimants/${buyerId}/status`] = 'rejected';
      updates[`accountPosts/${postId}/status`] = 'holding';
      updates[`accountPosts/${postId}/conflict`] = true;
      toast({ title: "Claim Rejected", description: "This will be reviewed by an admin." });
      
      fetch('/api/notify-new-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: postId, itemTitle: 'Seller Disputed Claim' })
      }).catch(e => console.error(e));

      await broadcastAdminNotification("Conflict Detected! ⚠️", `Seller rejected buyer claim for account #${postId.toUpperCase()}.`);
    }
    await update(ref(rtdb), updates);
    setIsGlobalLoading(false);
  }, [rtdb, authUser, broadcastNotification, broadcastAdminNotification]);

  const enforceAccountAction = useCallback(async (postId: string, action: 'delete' | 'holding' | 'approved' | 'pending', message: string) => {
    if (!rtdb || !enhancedUser?.isAdmin) return;
    setIsGlobalLoading(true);
    const postRef = ref(rtdb, `accountPosts/${postId}`);
    const postSnap = await get(postRef);
    const postData = postSnap.val();
    if (!postData) return;
    
    const updates: any = { 
      adminMessage: message, 
      sellerReported: true, 
      conflict: false, 
      buyerReported: false, 
      buyerReportedAt: null, 
      claimants: null,
      warningDismissedAt: Date.now()
    };

    if (action === 'delete') { 
      updates.status = 'rejected'; 
      updates.hiddenFromMarket = true; 
      updates.sold = false; 
    } else { 
      updates.status = action; 
      updates.hiddenFromMarket = false; 
    }

    if (action === 'approved') {
       const now = Date.now();
       const duration = postData?.term === 'monthly' ? (30 * 24 * 60 * 60 * 1000) : (7 * 24 * 60 * 60 * 1000);
       
       updates.expiresAt = now + duration;
       updates.createdAt = now;
       updates.sellerReported = false; 
       updates.sold = false;
       updates.holdingBy = null;
       updates.boughtBy = null;
       updates.claimants = null;
       updates.adminMessage = null;
       updates.sellerSeenDeletionAt = null;
    }

    await update(postRef, updates);

    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUids: [postData.uid], title: "Security Penalty Enforcement 👮", message })
    }).catch(e => console.error(e));

    broadcastNotification("Security Penalty Enforcement 👮", message, postData.uid);
    toast({ title: `Action "${action}" Applied` });
    setIsGlobalLoading(false);
  }, [rtdb, enhancedUser, broadcastNotification]);

  const markDeletionAsSeen = useCallback(async (postId: string) => { 
    if (!rtdb) return; 
    setIsGlobalLoading(true);
    await update(ref(rtdb, `accountPosts/${postId}`), { sellerSeenDeletionAt: Date.now() }); 
    setIsGlobalLoading(false);
  }, [rtdb]);

  const updateUserProfile = useCallback(async (updates: any) => { 
    if (!rtdb || !authUser) return; 
    setIsGlobalLoading(true);
    await update(ref(rtdb, `users/${authUser.uid}`), updates); 
    const isComplete = updates.phoneNumber && updates.name;
    if (isComplete) localStorage.setItem(`oskar_profile_complete_${authUser.uid}`, 'true');
    toast({ title: "Profile updated!" }); 
    setIsGlobalLoading(false);
  }, [rtdb, authUser]);

  const manageUser = useCallback(async (uid: string, updates: Partial<UserProfile>) => { 
    if (!rtdb) return; 
    setIsGlobalLoading(true);
    await update(ref(rtdb, `users/${uid}`), updates); 
    toast({ title: "User updated!" }); 
    setIsGlobalLoading(false);
  }, [rtdb]);
  
  const deleteUser = useCallback(async (uid: string) => { 
    if (!rtdb || !enhancedUser?.isAdmin) return; 
    setIsGlobalLoading(true);
    try {
      const res = await fetch('/api/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      await remove(ref(rtdb, `users/${uid}`)); 
      toast({ title: "User permanently deleted." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Deletion Failed", description: err.message });
    } finally {
      setIsGlobalLoading(false);
    }
  }, [rtdb, enhancedUser]);

  const sendMessage = useCallback(async (text?: string, imageUrl?: string, targetId?: string) => {
    if (!rtdb || !authUser) return;
    const tid = targetId || (enhancedUser?.isAdmin ? chatTargetId : authUser.uid);
    if (!tid) return;
    const msg: any = { senderId: authUser.uid, timestamp: Date.now(), isRead: false };
    if (text) msg.text = text; if (imageUrl) msg.imageUrl = imageUrl;
    await push(ref(rtdb, `chats/${tid}`), msg);
    await update(ref(rtdb, `chatIndex/${tid}`), {
      lastMessage: text || "📷 Screenshot",
      lastTimestamp: Date.now(),
      unreadCount: increment(1),
      userName: enhancedUser?.isAdmin ? (allChatSessions.find(s => s.userId === tid)?.userName || "User") : enhancedUser?.name,
      userPhoto: enhancedUser?.isAdmin ? (allChatSessions.find(s => s.userId === tid)?.userPhoto || "") : enhancedUser?.photoURL
    });
  }, [rtdb, authUser, enhancedUser, chatTargetId, allChatSessions]);

  const markMessagesAsRead = useCallback(async (tid?: string) => { if (!rtdb || !authUser) return; const id = tid || authUser.uid; await update(ref(rtdb, `chatIndex/${id}`), { unreadCount: 0 }); }, [rtdb, authUser]);

  const saveGame = useCallback(async (g: any) => {
    if (!rtdb) return;
    setIsGlobalLoading(true);
    const { id, ...data } = g;
    if (id) await update(ref(rtdb, `games/${id}`), data);
    else await push(ref(rtdb, 'games'), { ...data, createdAt: Date.now() });
    setIsGlobalLoading(false);
  }, [rtdb]);

  const deleteGame = useCallback(async (id: string) => {
    if (!rtdb) return;
    setIsGlobalLoading(true);
    await remove(ref(rtdb, `games/${id}`));
    const associatedProducts = products.filter(p => p.gameId === id);
    const dbUpdates: any = {};
    associatedProducts.forEach(p => dbUpdates[`products/${p.id}`] = null);
    await update(ref(rtdb), dbUpdates);
    setIsGlobalLoading(false);
  }, [rtdb, products]);

  const saveProduct = useCallback(async (p: any) => {
    if (!rtdb) return;
    setIsGlobalLoading(true);
    const { id, ...data } = p;
    const cleanData: any = {};
    Object.keys(data).forEach(key => {
      const val = data[key];
      if (val !== undefined && val !== null && val !== "" && !Number.isNaN(val)) cleanData[key] = val;
    });
    if (id) await update(ref(rtdb, `products/${id}`), cleanData);
    else await push(ref(rtdb, 'products'), cleanData);
    setIsGlobalLoading(false);
  }, [rtdb]);

  const deleteProduct = useCallback(async (id: string) => {
    setIsGlobalLoading(true);
    await remove(ref(rtdb, `products/${id}`));
    setIsGlobalLoading(false);
  }, [rtdb]);

  const updateProductsOrder = useCallback(async (updates: {id: string, orderIndex: number}[]) => {
    if (!rtdb) return;
    setIsGlobalLoading(true);
    const dbUpdates: any = {};
    updates.forEach(u => {
      dbUpdates[`products/${u.id}/orderIndex`] = u.orderIndex;
    });
    await update(ref(rtdb), dbUpdates);
    toast({ title: "Order saved" });
    setIsGlobalLoading(false);
  }, [rtdb]);
  
  const saveEvent = useCallback(async (e: any) => { 
    if (!rtdb) return; 
    setIsGlobalLoading(true);
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
    setIsGlobalLoading(false);
  }, [rtdb]);

  const deleteEvent = useCallback(async (id: string) => {
    setIsGlobalLoading(true);
    await remove(ref(rtdb, `events/${id}`));
    setIsGlobalLoading(false);
  }, [rtdb]);

  const saveBanner = useCallback(async (b: any) => { 
    if (!rtdb) return; 
    setIsGlobalLoading(true);
    const { id, ...data } = b; 
    if (id) await update(ref(rtdb, `banners/${id}`), data); 
    else await push(ref(rtdb, 'banners'), { ...data, createdAt: Date.now(), active: true }); 
    setIsGlobalLoading(false);
  }, [rtdb]);

  const deleteBanner = useCallback(async (id: string) => {
    setIsGlobalLoading(true);
    await remove(ref(rtdb, `banners/${id}`));
    setIsGlobalLoading(false);
  }, [rtdb]);

  const savePaymentMethod = useCallback(async (m: any) => {
    if (!rtdb) return;
    setIsGlobalLoading(true);
    const { id, ...data } = m;
    if (id) await update(ref(rtdb, `settings/paymentMethods/${id}`), data);
    else { const newRef = push(ref(rtdb, 'settings/paymentMethods')); await set(newRef, { ...data, active: true }); }
    toast({ title: "Payment Method Saved" });
    setIsGlobalLoading(false);
  }, [rtdb]);

  const deletePaymentMethod = useCallback(async (id: string) => { 
    if (!rtdb) return; 
    setIsGlobalLoading(true);
    await remove(ref(rtdb, `settings/paymentMethods/${id}`)); 
    toast({ title: "Payment Method Removed" }); 
    setIsGlobalLoading(false);
  }, [rtdb]);
  
  const savePromoCode = useCallback(async (promo: any) => {
    if (!rtdb || !promo.code) return;
    setIsGlobalLoading(true);
    const { duration, durationUnit, discount, ...rest } = promo;
    let expiresAt = 0;
    
    if (duration && durationUnit) {
      const now = Date.now();
      const val = parseInt(duration);
      if (!isNaN(val)) {
        if (durationUnit === 'minutes') expiresAt = now + (val * 60 * 1000);
        else if (durationUnit === 'hours') expiresAt = now + (val * 60 * 60 * 1000);
        else if (durationUnit === 'days') expiresAt = now + (val * 24 * 60 * 60 * 1000);
        else if (durationUnit === 'months') expiresAt = now + (val * 30 * 24 * 60 * 60 * 1000);
        else if (durationUnit === 'years') expiresAt = now + (val * 365 * 24 * 60 * 60 * 1000);
      }
    }
    
    if (!expiresAt) {
      expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); 
    }

    const standardizedCode = promo.code.trim().toUpperCase();
    await set(ref(rtdb, `promo_codes/${standardizedCode}`), {
      ...rest,
      code: standardizedCode,
      discount: parseFloat(discount) || 0,
      expiresAt,
      createdAt: Date.now(),
      claimed: false,
      usedBy: null,
      expired: false
    });
    toast({ title: "Promo Code Created!" });
    setIsGlobalLoading(false);
  }, [rtdb]);

  const deletePromoCode = useCallback(async (id: string) => {
    if (!rtdb) return;
    setIsGlobalLoading(true);
    await remove(ref(rtdb, `promo_codes/${id}`));
    toast({ title: "Promo Code Deleted" });
    setIsGlobalLoading(false);
  }, [rtdb]);

  const checkPromoCode = useCallback(async (code: string): Promise<number> => {
    if (!rtdb || !authUser) throw new Error("Connection error");
    setIsGlobalLoading(true);
    try {
      const standardizedCode = code.trim().toUpperCase();
      const promoSnap = await get(ref(rtdb, `promo_codes/${standardizedCode}`));
      if (!promoSnap.exists()) throw new Error("Invalid code");
      
      const data = promoSnap.val() as PromoCode;
      if (data.claimed) throw new Error("Code already claimed");
      
      const expiryTime = Number(data.expiresAt) || 0;
      if (expiryTime && expiryTime < Date.now()) throw new Error("Code expired");
      
      if (data.usedBy === authUser.uid) throw new Error("You have already used this code");
      
      return Number(data.discount) || 0;
    } finally {
      setIsGlobalLoading(false);
    }
  }, [rtdb, authUser]);

  const updateStoreSettings = useCallback(async (s: any) => {
    if (!rtdb) return;
    setIsGlobalLoading(true);
    await update(ref(rtdb, 'settings'), s);
    await broadcastAdminNotification("Store Settings Updated ⚙️", `Global configuration was updated by ${enhancedUser?.name || 'an admin'}.`);
    setIsGlobalLoading(false);
  }, [rtdb, enhancedUser, broadcastAdminNotification]);
  
  const updateAdminSettings = useCallback(async (s: any) => {
    if (!rtdb) return;
    setIsGlobalLoading(true);
    await update(ref(rtdb, 'admin_settings'), s);
    await broadcastAdminNotification("Admin Settings Updated 🔒", `Security parameters were updated.`);
    setIsGlobalLoading(false);
  }, [rtdb, broadcastAdminNotification]);

  const acceptTerms = useCallback(async () => {
    if (typeof window !== 'undefined') localStorage.setItem('oskar_terms_accepted', 'true');
    if (authUser && rtdb) try { await update(ref(rtdb, `users/${authUser.uid}`), { termsAccepted: true }); } catch (e) {}
  }, [authUser, rtdb]);

  return (
    <AppContext.Provider value={{ 
      user: enhancedUser, loading, isGlobalLoading, isInitialLoading, authError, activeTab, setActiveTab, setGlobalLoading: setIsGlobalLoading,
      login, signup, logout, buyNow, orders, allOrders, games, products, allUsers, accountPosts, promoCodes, notifications, adminNotifications, events, banners,
      createOrder, postAccount, updateAccountPost, renewAccountPost, deleteAccountPost, markAccountAsSold, deleteOrder, buyAccountPost, markNotificationsAsRead, markAdminNotificationsAsRead, updateOrderStatus, updateAccountPostStatus, reportAccountOutcome, respondToSaleReport, enforceAccountAction, issueSellerWarning, suspendSeller, dismissAccountWarning, markDeletionAsSeen,
      updateUserProfile, manageUser, deleteUser, saveGame, deleteGame, saveProduct, deleteProduct, updateProductsOrder, saveEvent, deleteEvent, saveBanner, deleteBanner, savePaymentMethod, deletePaymentMethod, savePromoCode, deletePromoCode, checkPromoCode, storeSettings, updateStoreSettings, updateAdminSettings,
      broadcastNotification, broadcastAdminNotification, messages, allChatSessions, chatTargetId, setChatTargetId, sendMessage, markMessagesAsRead, refreshAdminData, refreshFcmToken,
      theme, toggleTheme, isBannedModalOpen, setIsBannedModalOpen, bannedInfo, isPostingAccount, setIsPostingAccount,
      acceptTerms, language, setLanguage, userProfile, t, resetLeaderboard
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
