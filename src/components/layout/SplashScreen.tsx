"use client";

import { useApp } from "@/lib/context";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Gamepad2 } from "lucide-react";

/**
 * SplashScreen Component
 * 
 * Provides a branded entry experience for the application.
 * Stays visible while the app is in its initial loading state.
 * 
 * Update: The splash screen now strictly adheres to isInitialLoading,
 * which tracks complete database synchronization across all critical nodes.
 */
export default function SplashScreen() {
  const { isInitialLoading, storeSettings } = useApp();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // When synchronization is complete, we add a tiny aesthetic delay 
    // to allow React to paint the first frame of the hydrated app.
    if (!isInitialLoading) {
      const timer = setTimeout(() => setIsVisible(false), 800);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [isInitialLoading]);

  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white transition-opacity duration-700 ease-in-out",
      !isInitialLoading ? "opacity-0 pointer-events-none" : "opacity-100"
    )}>
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-32 h-32 animate-in zoom-in duration-700 ease-out">
        <div className="relative w-full h-full p-2 bg-white rounded-[2.5rem] shadow-2xl shadow-primary/10 flex items-center justify-center overflow-hidden border border-slate-50">
          <Image 
            src={storeSettings?.logo || "/logo.png"} 
            alt="Oskar Shop" 
            fill 
            className="object-contain p-4"
            priority
            unoptimized
          />
        </div>
      </div>
      
      <div className="mt-10 flex flex-col items-center gap-2 animate-in slide-in-from-bottom-4 duration-1000">
        <h1 className="text-3xl font-headline font-bold tracking-tight text-gray-900">
          <span className="text-red-600">Oskar</span><span className="text-primary">Shop</span>
        </h1>
        
        <div className="flex gap-2 mt-6">
           <div className="w-2.5 h-2.5 bg-primary/30 rounded-full animate-bounce [animation-delay:-0.3s]" />
           <div className="w-2.5 h-2.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
           <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" />
        </div>
        
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-4">
          Adeeg deg deg ah iyo Qiimo jaban
        </p>
      </div>

      <div className="absolute bottom-12 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
        Top up games
      </div>
    </div>
  );
}
