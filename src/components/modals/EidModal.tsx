
"use client";

import React, { useEffect } from 'react';
import { Moon, Star, Zap } from 'lucide-react';

/**
 * EidModal Component
 *
 * A festive popup for Eid Al-Adha promotions.
 * Matches the Google Stitch design reference pixel-for-pixel.
 */

interface EidModalProps {
  onClose: () => void;
}

export default function EidModal({ onClose }: EidModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="relative w-full max-w-[360px] sm:max-w-[420px] md:max-w-[460px] flex flex-col items-center animate-in zoom-in-95 duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Top Icons (Moon & Lamp) */}
        <div className="flex items-center gap-8 mb-6 text-[#FFD700]/70">
           <Moon size={36} strokeWidth={1.5} />
           <div className="relative">
              <div className="w-10 h-12 border-2 border-current rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                 <div className="w-4 h-4 bg-current rounded-full animate-pulse shadow-[0_0_10px_rgba(255,215,0,0.8)]" />
              </div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-3 w-0.5 h-3 bg-current" />
           </div>
        </div>

        {/* Modal Card */}
        <div className="w-full bg-[#131C2D] rounded-[2.5rem] p-8 md:p-10 shadow-[0_30px_100px_rgba(0,0,0,0.6)] border border-white/5 flex flex-col items-center text-center relative overflow-hidden">
           {/* Background Glow */}
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/5 rounded-full blur-[60px] -z-10" />

           {/* Sheep Avatar */}
           <div className="w-24 h-24 md:w-32 md:h-32 bg-white/5 rounded-full border-4 border-white/10 flex items-center justify-center mb-8 relative shadow-inner">
              <span className="text-6xl md:text-7xl drop-shadow-lg">🐑</span>
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 rounded-full" />
           </div>

           {/* Header Section */}
           <h2 className="text-2xl md:text-3xl font-headline font-bold text-[#FFD700] mb-2 tracking-tight">Ciid Wanaagsan! 🥳</h2>
           <p className="text-[10px] font-black text-[#FFD700]/50 uppercase tracking-[0.4em] mb-8">OskarShop</p>

           {/* Divider with Star */}
           <div className="w-full flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-white/10" />
              <Star size={14} className="text-[#FFD700] fill-[#FFD700]" />
              <div className="h-px flex-1 bg-white/10" />
           </div>

           {/* Description Body */}
           <p className="text-sm md:text-base text-white/90 leading-relaxed font-medium mb-10 px-2">
              Munaasabada Ciidul Adxa owgeed dhamaan adeegyada Free Fire iyo Blood Strike waxan kusameynay qiimo dhimis, ka faa'ideeyso inta aysan dhamaan.
           </p>

           {/* Game Badges */}
           <div className="flex flex-wrap justify-center gap-3 mb-10">
              <div className="px-5 py-2 bg-[#2D3748]/50 rounded-full border border-white/10 flex items-center gap-2 backdrop-blur-md">
                 <span className="text-sm">🔥</span>
                 <span className="text-[10px] font-bold text-white uppercase tracking-widest">Free Fire</span>
              </div>
              <div className="px-5 py-2 bg-[#2D3748]/50 rounded-full border border-white/10 flex items-center gap-2 backdrop-blur-md">
                 <Zap size={14} className="text-[#60A5FA] fill-[#60A5FA]" />
                 <span className="text-[10px] font-bold text-white uppercase tracking-widest">Blood Strike</span>
              </div>
           </div>

           {/* Main CTA Button */}
           <button 
             onClick={onClose}
             className="w-full h-14 md:h-16 bg-[#F59E0B] hover:bg-[#D97706] text-white font-black text-sm md:text-lg rounded-2xl md:rounded-3xl shadow-[0_15px_35px_rgba(245,158,11,0.25)] active:scale-[0.97] transition-all uppercase tracking-widest flex items-center justify-center gap-2 border-b-4 border-[#B45309]"
           >
              OK — Mahadsanid!
           </button>
        </div>
      </div>
    </div>
  );
}
