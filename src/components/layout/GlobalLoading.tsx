"use client";

import { useApp } from "@/lib/context";
import Image from "next/image";
import { Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GlobalLoading Component
 * 
 * Provides a high-fidelity, app-like loading experience.
 * Features a blurred background with the app logo centered inside 
 * a spinning circular border.
 */
export default function GlobalLoading() {
  const { isGlobalLoading, storeSettings } = useApp();

  if (!isGlobalLoading) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-white/10 dark:bg-black/10 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative flex flex-col items-center">
        {/* Spinning Border */}
        <div className="relative w-24 h-24 sm:w-32 sm:h-32">
          <div className="absolute inset-0 rounded-full border-[3px] border-primary/20" />
          <div className="absolute inset-0 rounded-full border-[3px] border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          
          {/* Logo Container */}
          <div className="absolute inset-2 sm:inset-3 bg-white dark:bg-slate-900 rounded-full shadow-2xl flex items-center justify-center overflow-hidden border border-slate-100 dark:border-white/5">
            {storeSettings?.logo || "/logo.png" ? (
              <div className="relative w-full h-full p-3 sm:p-4">
                <Image 
                  src={storeSettings?.logo || "/logo.png"} 
                  alt="Loading" 
                  fill 
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <Gamepad2 className="w-8 h-8 sm:w-12 sm:h-12 text-primary" />
            )}
          </div>
        </div>
        
        {/* Subtext */}
        <p className="mt-6 text-[10px] sm:text-xs font-black text-primary uppercase tracking-[0.3em] animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  );
}
