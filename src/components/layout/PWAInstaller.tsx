"use client";

import { useState, useEffect } from "react";
import { Download, X, Smartphone, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/context";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function PWAInstaller() {
  const { storeSettings } = useApp();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      const isDismissed = sessionStorage.getItem("pwa_dismissed");
      if (!isDismissed) {
        setTimeout(() => setIsVisible(true), 2000);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", () => {
      setDeferredPrompt(null);
      setIsVisible(false);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      console.log("User accepted the PWA install prompt");
    }
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("pwa_dismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[100] animate-in slide-in-from-bottom-full duration-700 md:bottom-8 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl">
      <div className="flex items-center gap-3 md:gap-5 bg-white dark:bg-slate-900 p-2 md:p-3 pr-4 md:pr-6 rounded-full shadow-[0_15px_50px_-10px_rgba(0,0,0,0.15)] dark:shadow-primary/5 border border-gray-100 dark:border-white/5 relative group transition-all">
        
        {/* App Icon with Gradient */}
        <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-[#6366F1] to-[#A855F7] rounded-[1.25rem] md:rounded-[1.75rem] flex items-center justify-center p-1.5 md:p-2.5 shrink-0 shadow-lg shadow-indigo-500/20">
          <div className="relative w-full h-full rounded-lg md:rounded-xl overflow-hidden bg-white flex items-center justify-center">
            {storeSettings?.logo ? (
              <Image 
                src={storeSettings.logo} 
                alt="Logo" 
                fill 
                className="object-cover" 
                unoptimized 
              />
            ) : (
              <Gamepad2 className="w-6 h-6 text-primary" />
            )}
          </div>
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="font-headline font-bold text-sm md:text-xl text-slate-900 dark:text-white truncate">
            Install Oskar Shop
          </h3>
          <p className="text-[9px] md:text-sm text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
            Add to Home Screen for fast access
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 md:gap-6 shrink-0">
          <Button 
            onClick={handleInstallClick}
            className="rounded-full h-9 md:h-12 px-5 md:px-8 gap-1.5 md:gap-2 font-bold bg-[#6366F1] hover:bg-[#5558E3] text-white shadow-md shadow-indigo-500/20 transition-all active:scale-95 border-none text-xs md:text-base"
          >
            <Download className="w-3.5 h-3.5 md:w-5 md:h-5" strokeWidth={3} /> Install
          </Button>
          
          <button 
            onClick={handleDismiss}
            className="p-1.5 md:p-2 text-slate-300 hover:text-red-500 transition-colors"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
