"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useApp } from "@/lib/context";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Play, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HeroSlider() {
  const { banners, storeSettings, isInitialLoading } = useApp();
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const slides = useMemo(() => {
    const list = (banners || []).filter(b => b.active).map(b => ({
      id: b.id,
      image: b.imageUrl,
      link: b.linkTo,
      title: b.title || "Flash Sale!",
      description: b.description || "Limited time offer. Don't miss out!"
    }));

    // Inject Tutorial slide if active
    const helpLinks = storeSettings?.helpLinks;
    if (helpLinks?.tutorialBannerActive && helpLinks?.tutorialThumbnail) {
      list.unshift({
        id: 'tutorial-slide',
        image: helpLinks.tutorialThumbnail,
        link: helpLinks.tutorialUrl,
        title: "Sida loo isticmaalo website ka oskarshop",
        description: "daawo video ga"
      });
    }

    return list;
  }, [banners, storeSettings]);

  useEffect(() => {
    if (slides.length <= 1 || !isAutoPlaying) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length, isAutoPlaying]);

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsAutoPlaying(false);
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsAutoPlaying(false);
    setCurrent((prev) => (prev > 0 ? prev - 1 : slides.length - 1));
  };

  const handleSlideClick = (link?: string) => {
    if (!link) return;
    if (link.startsWith('http')) {
      window.open(link, '_blank');
    } else {
      // Assuming internal hash link
      window.location.hash = link;
    }
  };

  if (isInitialLoading) {
    return <Skeleton className="w-full aspect-[21/9] md:aspect-[3/1] max-h-[460px] rounded-[1.5rem] md:rounded-[2.5rem] animate-shimmer" />;
  }

  if (slides.length === 0) {
    return (
      <div className="w-full aspect-[21/9] md:aspect-[3/1] max-h-[460px] bg-slate-100 dark:bg-slate-900/40 rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center text-slate-400 italic text-xs font-bold border-2 border-dashed border-slate-200 dark:border-white/5">
        No active promotions.
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[21/9] md:aspect-[3/1] max-h-[460px] overflow-hidden rounded-[1.5rem] md:rounded-[2.5rem] group shadow-2xl">
      {/* Slides Container */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={cn(
            "absolute inset-0 transition-all duration-1000 ease-in-out cursor-pointer",
            index === current ? "opacity-100 scale-100 z-10" : "opacity-0 scale-110 z-0"
          )}
          onClick={() => handleSlideClick(slide.link)}
        >
          {/* Main Image */}
          <div className="relative w-full h-full">
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-cover transition-transform duration-[10000ms] ease-linear transform scale-100 group-hover:scale-110"
              priority={index === 0}
              unoptimized
            />
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent md:bg-gradient-to-r md:from-black/60 md:to-transparent" />
            
            {/* Content Overlay */}
            <div className="absolute bottom-6 left-6 right-6 md:bottom-12 md:left-12 max-w-xl animate-in fade-in slide-in-from-bottom-6 duration-700">
               <div className={cn(
                 "space-y-2 md:space-y-4 transition-all duration-500",
                 slide.id === 'tutorial-slide' 
                   ? "bg-transparent border-none shadow-none" 
                   : "glass p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-white/20 shadow-2xl"
               )}>
                  <div className="flex items-center gap-2">
                     <Badge className="bg-primary text-white border-none rounded-full px-3 py-0.5 md:py-1 font-bold text-[8px] md:text-[10px] uppercase tracking-[0.2em]">
                        {slide.id === 'tutorial-slide' ? 'App Guide' : 'Promotion'}
                     </Badge>
                     {slide.id === 'tutorial-slide' && (
                       <Badge variant="outline" className="text-white border-white/40 text-[8px] md:text-[10px] font-black uppercase">Video</Badge>
                     )}
                  </div>
                  
                  <h2 className="text-lg md:text-4xl lg:text-5xl font-headline font-bold text-white leading-tight drop-shadow-lg">
                    {slide.title}
                  </h2>
                  
                  <p className="text-[10px] md:text-lg text-white/80 font-medium line-clamp-2 max-w-sm md:max-w-none drop-shadow-md">
                    {slide.description}
                  </p>
                  
                  <button className="flex items-center gap-2 text-white font-black text-[9px] md:text-sm uppercase tracking-widest pt-2 group/btn">
                    {slide.id === 'tutorial-slide' ? (
                      <><div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover/btn:scale-110 transition-transform"><Play size={14} fill="white" className="md:size-5" /></div> Watch Guide</>
                    ) : (
                      <><div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-primary flex items-center justify-center shadow-lg group-hover/btn:scale-110 transition-transform"><Info size={14} className="md:size-5" /></div> Learn More</>
                    )}
                  </button>
               </div>
            </div>
          </div>
        </div>
      ))}
      
      {/* Navigation Arrows (Desktop Only Hover) */}
      <div className="hidden md:block">
        <button 
          onClick={handlePrev}
          className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20 hover:bg-black/40 active:scale-90"
        >
          <ChevronLeft size={32} />
        </button>
        <button 
          onClick={handleNext}
          className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20 hover:bg-black/40 active:scale-90"
        >
          <ChevronRight size={32} />
        </button>
      </div>

      {/* Progress Bars (Modern Indicators) */}
      <div className="absolute bottom-6 md:bottom-10 right-6 md:right-12 left-6 md:left-auto flex items-center gap-2 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => { setIsAutoPlaying(false); setCurrent(i); }}
            className="relative h-1.5 transition-all duration-300 overflow-hidden rounded-full bg-white/20"
            style={{ width: i === current ? '40px' : '10px' }}
          >
             {i === current && (
               <div 
                 className="absolute inset-y-0 left-0 bg-primary shadow-[0_0_10px_rgba(14,165,233,0.8)] transition-all duration-[6000ms] ease-linear"
                 style={{ width: isAutoPlaying ? '100%' : '100%' }}
               />
             )}
          </button>
        ))}
      </div>
    </div>
  );
}
