
"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useApp } from "@/lib/context";
import { Skeleton } from "@/components/ui/skeleton";

export default function HeroSlider() {
  const { banners, isInitialLoading } = useApp();
  const [current, setCurrent] = useState(0);

  const slides = useMemo(() => {
    return (banners || []).filter(b => b.active);
  }, [banners]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (isInitialLoading) {
    return <Skeleton className="w-full aspect-[21/9] md:aspect-[3/1] max-h-[420px] rounded-[2rem] animate-shimmer" />;
  }

  if (slides.length === 0) {
    return (
      <div className="w-full aspect-[21/9] md:aspect-[3/1] max-h-[420px] bg-slate-100 rounded-[2rem] flex items-center justify-center text-slate-400 italic text-xs font-bold border-2 border-dashed border-slate-200">
        No active promotions.
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[21/9] md:aspect-[3/1] max-h-[420px] overflow-hidden rounded-[2rem] group shadow-xl">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === current ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={slide.imageUrl}
            alt="Oskar Shop Promotion"
            fill
            className="object-cover"
            priority={index === 0}
            unoptimized
          />
        </div>
      ))}
      
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 md:w-8 h-2 rounded-full transition-all duration-300 ${
                i === current ? "bg-white w-8 md:w-12 shadow-lg" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
