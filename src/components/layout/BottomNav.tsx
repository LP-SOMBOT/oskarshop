
"use client";

import { House, Gamepad2, CircleUser, ShoppingBag, ShieldCheck } from "lucide-react";
import { useApp } from "@/lib/context";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const { activeTab, setActiveTab, allChatSessions, user, notifications, orders, t } = useApp();

  const unreadChat = user?.isAdmin 
    ? allChatSessions.reduce((acc, s) => acc + (s.unreadCount || 0), 0)
    : (allChatSessions.find(s => s.userId === user?.uid)?.unreadCount || 0);

  const unreadNotifs = (notifications || []).filter(n => !n.read).length;
  const activeOrdersCount = (orders || []).filter(o => o.status === 'pending' || o.status === 'processing').length;

  const navItems = [
    { id: "home", label: t('home'), icon: House },
    { id: "games", label: t('games'), icon: Gamepad2 },
    { id: "accounts", label: t('accounts'), icon: ShieldCheck },
    { id: "orders", label: t('orders'), icon: ShoppingBag, badge: activeOrdersCount },
    { id: "profile", label: t('profile'), icon: CircleUser, badge: unreadNotifs > 0 ? unreadNotifs : unreadChat },
  ];

  return (
    <div className="fixed bottom-5 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none md:hidden">
      <nav className="w-full max-w-[500px] h-16 bg-white dark:bg-slate-900/90 dark:backdrop-blur-xl rounded-[40px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex items-center justify-around px-1 py-2 pointer-events-auto border border-gray-50/50 dark:border-white/5">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="relative flex items-center justify-center transition-all duration-300"
            >
              <div
                className={cn(
                  "flex items-center justify-center gap-1.5 transition-all duration-250 ease-in-out",
                  isActive 
                    ? "bg-primary text-white rounded-[30px] py-[8px] px-3 xs:px-4 shadow-md shadow-primary/20" 
                    : "text-[#9CA3AF] dark:text-gray-500 p-2"
                )}
              >
                <div className="relative">
                  <Icon size={isActive ? 18 : 20} className={cn("transition-all", isActive && "stroke-[2.5px]")} />
                  
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={cn(
                      "absolute -top-1.5 -right-1.5 bg-[#F97316] text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold border border-white dark:border-slate-900",
                      isActive ? "bg-white text-[#F97316] dark:bg-white dark:text-[#F97316]" : ""
                    )}>
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>

                {isActive && (
                  <span className="text-[10px] font-bold uppercase tracking-tight whitespace-nowrap hidden min-[360px]:block">
                    {item.label}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
