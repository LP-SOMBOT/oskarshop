
"use client";

import { House, ShoppingBag, ShieldCheck, Package, User } from "lucide-react";
import { useApp } from "@/lib/context";
import { cn, formatWhatsAppNumber } from "@/lib/utils";

export default function BottomNav() {
  const { activeTab, setActiveTab, storeSettings, t, language } = useApp();

  const navItems = [
    { id: "home", label: t('home'), icon: House },
    { id: "games", label: t('games'), icon: ShoppingBag },
    { id: "accounts", label: t('accounts'), icon: ShieldCheck },
    { id: "orders", label: t('orders'), icon: Package },
    { id: "profile", label: t('profile'), icon: User },
  ];

  const handleWhatsApp = () => {
    const num = formatWhatsAppNumber(storeSettings?.helpLinks?.whatsappNumber || "252613982172");
    window.open(`https://wa.me/${num}`, '_blank');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden pointer-events-none">
      {/* WhatsApp Floating Button */}
      <div className="absolute -top-20 right-6 pointer-events-auto">
        <button
          onClick={handleWhatsApp}
          className="w-14 h-14 bg-[#00D95F] text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(0,217,95,0.4)] active:scale-90 transition-transform"
          aria-label="Contact on WhatsApp"
        >
          <svg 
            viewBox="0 0 24 24" 
            width="30" 
            height="30" 
            fill="currentColor" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.405.015 12.039c0 2.118.553 4.185 1.607 6.037L0 24l6.15-1.613a11.893 11.893 0 005.891 1.549h.005c6.635 0 12.032-5.412 12.035-12.046a11.83 11.83 0 00-3.669-8.521z" />
          </svg>
        </button>
      </div>

      <nav className="w-full h-[75px] bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-white/5 flex items-center justify-around px-1 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] pointer-events-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center justify-center flex-1 h-full relative group"
            >
              <div className={cn(
                "transition-all duration-300 transform",
                isActive 
                  ? "text-primary scale-110" 
                  : "text-slate-400 dark:text-slate-500 group-active:scale-90"
              )}>
                <Icon size={24} className={isActive ? "stroke-[2.5px]" : "stroke-[2px]"} />
              </div>
              <span className={cn(
                "text-[10px] sm:text-[11px] font-bold mt-1 transition-all uppercase tracking-tight",
                isActive ? "text-primary" : "text-slate-400 dark:text-slate-500"
              )}>
                {item.id === 'games' && language === 'so' ? 'top up' : item.id === 'accounts' && language === 'so' ? 'ciwaanada' : item.id === 'orders' && language === 'so' ? 'dalabyada' : item.label}
              </span>
              
              {isActive && (
                <div className="absolute bottom-1 w-1.5 h-1.5 bg-primary rounded-full animate-in fade-in zoom-in duration-300 shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
