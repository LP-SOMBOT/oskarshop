
"use client";

import Image from "next/image";
import { ShoppingCart, Tag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/lib/context";
import { cn } from "@/lib/utils";

type GameCardProps = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  price: number | string;
  discountedPrice?: number | string;
  gameId: string;
  imageHint?: string;
};

export default function GameCard({ id, title, description, thumbnail, price, discountedPrice, gameId, imageHint }: GameCardProps) {
  const { buyNow, user, t } = useApp();

  const numPrice = Number(price);
  const numDiscounted = discountedPrice ? Number(discountedPrice) : 0;
  
  const hasStoreDiscount = numDiscounted > 0 && numDiscounted < numPrice;
  let currentPrice = hasStoreDiscount ? numDiscounted : numPrice;

  // Apply Leaderboard Discount if applicable
  const rankDiscount = user?.leaderboardDiscount || 0;
  const hasRankDiscount = rankDiscount > 0;
  
  if (hasRankDiscount) {
    currentPrice = currentPrice - (currentPrice * rankDiscount / 100);
  }

  const savingsPercent = hasStoreDiscount ? Math.round(((numPrice - numDiscounted) / numPrice) * 100) : 0;

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    buyNow({ id, title, price: currentPrice, gameId, thumbnail });
  };

  const RankIcon = user?.leaderboardRank === 1 ? "🥇" : user?.leaderboardRank === 2 ? "🥈" : "🥉";

  return (
    <Card className="group overflow-hidden bg-white dark:bg-slate-900 border-gray-100 dark:border-white/5 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 rounded-[1.5rem] md:rounded-[2rem] flex flex-col h-full relative">
      {/* Top Percentage Off Label */}
      {hasStoreDiscount && (
        <div className="absolute top-2 right-2 md:top-4 md:right-4 z-10 animate-in fade-in zoom-in duration-500">
           <Badge className="bg-red-500 text-white font-black px-2 py-1 md:px-3 md:py-1.5 rounded-xl shadow-xl border-2 border-white dark:border-slate-800 uppercase text-[8px] md:text-[10px] tracking-widest flex items-center gap-1">
             <Sparkles size={10} className="md:w-3 md:h-3" /> {savingsPercent}% OFF
           </Badge>
        </div>
      )}

      {/* Rank Reward Badge */}
      {hasRankDiscount && (
        <div className="absolute top-2 left-2 md:top-4 md:left-4 z-10 animate-in fade-in slide-in-from-left-2 duration-500">
           <Badge className="bg-primary text-white font-black px-2 py-1 md:px-3 md:py-1.5 rounded-xl shadow-xl border-2 border-white dark:border-slate-800 uppercase text-[8px] md:text-[10px] tracking-widest flex items-center gap-1.5">
             {RankIcon} -{rankDiscount}%
           </Badge>
        </div>
      )}

      <div className="relative aspect-square w-full overflow-hidden bg-gray-50 dark:bg-slate-800">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
            data-ai-hint={imageHint || "gaming"}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-primary font-bold opacity-20">
            {gameId.substring(0,2).toUpperCase()}
          </div>
        )}
      </div>
      
      <CardContent className="p-3 md:p-5 flex flex-col flex-grow">
        <div className="mb-2 md:mb-4">
           <h3 className="font-headline font-bold text-sm md:text-lg lg:text-xl line-clamp-1 text-slate-900 dark:text-white uppercase tracking-tight">{title}</h3>
           <p className="text-[9px] md:text-xs text-muted-foreground line-clamp-2 leading-relaxed opacity-70">{description}</p>
        </div>
        
        <div className="flex flex-col mt-auto bg-slate-50 dark:bg-slate-800/50 p-2 md:p-4 rounded-xl border border-slate-100 dark:border-white/5 shadow-inner">
          <div className="flex flex-col items-center justify-center">
             {(hasStoreDiscount || hasRankDiscount) && (
               <span className="text-[10px] md:text-sm text-muted-foreground line-through opacity-60 mb-0.5">
                 ${numPrice.toFixed(2)}
               </span>
             )}
             <span className={cn(
               "text-xl md:text-3xl font-headline font-bold tracking-tighter",
               (hasStoreDiscount || hasRankDiscount) ? "text-primary" : "text-slate-900 dark:text-white"
             )}>
               ${currentPrice.toFixed(2)}
             </span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-3 md:p-5 pt-0">
        <Button 
          onClick={handleBuyNow} 
          className="w-full rounded-xl md:rounded-2xl h-10 md:h-14 gap-1.5 md:gap-2 font-black shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95 text-[8px] xs:text-[10px] md:text-sm uppercase tracking-tight md:tracking-widest"
        >
          <ShoppingCart className="w-3.5 h-3.5 md:w-5 md:h-5" /> {user ? t('buy_now') : t('login_to_buy')}
        </Button>
      </CardFooter>
    </Card>
  );
}
