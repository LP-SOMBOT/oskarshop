"use client";

import Link from "next/link";
import Image from "next/image";
import { useApp } from "@/lib/context";
import { Settings, Gamepad2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { user, storeSettings, notifications, setActiveTab } = useApp();

  const unreadNotifs = (notifications || []).filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-gray-100 dark:border-white/5 shadow-sm md:hidden">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div onClick={() => setActiveTab('home')} className="flex items-center gap-2 cursor-pointer">
          <div className="relative w-10 h-10 overflow-hidden rounded-xl">
            {storeSettings?.logo ? (
              <Image 
                src={storeSettings.logo} 
                alt="Oskar Shop Logo" 
                fill 
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-primary flex items-center justify-center text-white font-headline font-bold text-xl">
                O
              </div>
            )}
          </div>
          <span className="font-headline font-bold text-2xl tracking-tight">
            <span className="text-red-600">Oskar</span><span className="text-primary">Shop</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {user?.role === 'admin' || user?.role === 'super_admin' ? (
            <Link href="/admin" className="hidden md:block">
              <Button variant="ghost" size="sm" className="gap-2">
                <Settings className="w-4 h-4" /> Admin
              </Button>
            </Link>
          ) : null}

          {user ? (
            <button 
              onClick={() => setActiveTab('notifications')}
              className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
            >
              <Bell className="w-6 h-6" />
              {unreadNotifs > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
                </span>
              )}
            </button>
          ) : (
            <Link href="/login">
              <Button variant="default" size="sm" className="rounded-full px-5 font-bold h-9">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
