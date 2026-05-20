
"use client";

import { useApp } from "@/lib/context";
import { cn } from "@/lib/utils";
import { House, Gamepad2, CircleUser, ShoppingBag, ShieldCheck, LogOut, Star, Trophy, Bell, Settings } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

/**
 * DesktopSidebar Component
 * 
 * Exclusively visible on desktop (md and above).
 * Replaces Header and BottomNav for a more professional desktop experience.
 */
export default function DesktopSidebar() {
  const { activeTab, setActiveTab, user, storeSettings, notifications, orders, logout, t } = useApp();

  const unreadNotifs = (notifications || []).filter(n => !n.read).length;
  const activeOrdersCount = (orders || []).filter(o => o.status === 'pending' || o.status === 'processing').length;

  const navItems = [
    { id: "home", label: t('home'), icon: House },
    { id: "games", label: t('games'), icon: Gamepad2 },
    { id: "accounts", label: t('accounts'), icon: ShieldCheck },
    { id: "orders", label: t('orders'), icon: ShoppingBag, badge: activeOrdersCount },
    { id: "notifications", label: t('notifications'), icon: Bell, badge: unreadNotifs },
    { id: "profile", label: t('profile'), icon: CircleUser },
  ];

  return (
    <aside className="hidden md:flex w-72 lg:w-80 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-white/5 flex-col h-screen sticky top-0 shrink-0 z-50">
      {/* Sidebar Header / Logo */}
      <div className="p-8 lg:p-10 flex items-center gap-3 relative">
        <div 
          onClick={() => setActiveTab('home')}
          className="relative w-12 h-12 overflow-hidden rounded-2xl shadow-xl shadow-primary/20 cursor-pointer active:scale-95 transition-transform"
        >
          {storeSettings?.logo ? (
            <Image src={storeSettings.logo} alt="Logo" fill className="object-cover" unoptimized />
          ) : (
            <div className="w-full h-full bg-primary flex items-center justify-center text-white font-headline font-bold text-2xl">O</div>
          )}
        </div>
        <div className="flex flex-col cursor-pointer" onClick={() => setActiveTab('home')}>
          <span className="font-headline font-bold text-2xl tracking-tight leading-none text-slate-900 dark:text-white">
            <span className="text-red-600">Oskar</span><span className="text-primary">Shop</span>
          </span>
          <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em] mt-1.5">Premium Top-Up</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-6 lg:px-8 space-y-2 mt-4 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all duration-300 relative group",
                isActive 
                  ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]" 
                  : "text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <Icon size={22} className={cn("transition-all duration-300", isActive ? "stroke-[2.5px]" : "group-hover:scale-110")} />
              <span className="text-[13px] uppercase tracking-widest">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={cn(
                  "ml-auto px-2 py-0.5 rounded-full text-[10px] font-black min-w-[20px] text-center shadow-sm",
                  isActive ? "bg-white text-primary" : "bg-red-500 text-white"
                )}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Footer Card */}
      {user && (
        <div className="p-6 lg:p-8 mt-auto bg-slate-50/50 dark:bg-transparent border-t border-gray-50 dark:border-white/5">
          <div className="bg-white dark:bg-slate-800/40 p-5 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden relative border-2 border-white dark:border-slate-800 shadow-md bg-slate-100">
                {user.photoURL ? <Image src={user.photoURL} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><CircleUser size={24} /></div>}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm truncate dark:text-white">{user.name}</p>
                <div className="flex items-center gap-1 text-amber-500">
                  <Star size={12} fill="currentColor" />
                  <span className="text-[10px] font-black">{user.points || 0} {t('points')}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                className="flex-1 h-10 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold gap-2 text-xs" 
                onClick={logout}
              >
                <LogOut size={14} /> {t('logout').split(' ')[0]}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1 h-10 rounded-xl font-bold text-xs" 
                onClick={() => setActiveTab('profile')}
              >
                {t('profile')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
