
"use client";

import Image from "next/image";
import { ShoppingCart, Tag } from "lucide-react";
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
  
  const hasValidDiscount = numDiscounted > 0 && numDiscounted < numPrice;
  const displayPrice = hasValidDiscount ? numDiscounted : numPrice;
  const savingsPercent = hasValidDiscount ? Math.round(((numPrice - numDiscounted) / numPrice) * 100) : 0;

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    buyNow({ id, title, price: displayPrice, gameId, thumbnail });
  };

  return (
    <Card className="group overflow-hidden bg-white dark:bg-slate-900 border-gray-100 dark:border-white/5 hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 rounded-[1.5rem] md:rounded-[2rem] flex flex-col h-full relative">
      {hasValidDiscount && (
        <div className="absolute top-2 right-2 md:top-4 md:right-4 z-10 animate-in fade-in zoom-in duration-500">
           <Badge className="bg-red-500 text-white font-black px-2 py-0.5 md:px-3 md:py-1 rounded-full shadow-lg border-2 border-white dark:border-slate-800 uppercase text-[8px] md:text-[10px] tracking-widest">
             {savingsPercent}% OFF
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
        <h3 className="font-headline font-bold text-sm md:text-lg mb-1 line-clamp-1 text-slate-900 dark:text-white uppercase tracking-tight">{title}</h3>
        <p className="text-[10px] md:text-xs text-muted-foreground mb-3 md:mb-4 line-clamp-2 leading-relaxed flex-grow">{description}</p>
        
        <div className="flex flex-col mt-auto">
          {hasValidDiscount ? (
            <div className="space-y-0">
               <span className="text-[10px] md:text-xs text-muted-foreground line-through font-medium opacity-60">${numPrice.toFixed(2)}</span>
               <div className="flex items-center gap-1.5">
                  <span className="text-xl md:text-3xl font-headline font-bold text-primary tracking-tighter">${numDiscounted.toFixed(2)}</span>
                  <Tag size={12} className="text-primary animate-pulse md:w-3.5 md:h-3.5" />
               </div>
            </div>
          ) : (
            <span className="text-xl md:text-3xl font-headline font-bold text-primary tracking-tighter">${numPrice.toFixed(2)}</span>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-3 md:p-5 pt-0">
        <Button onClick={handleBuyNow} className="w-full rounded-xl md:rounded-2xl h-10 md:h-12 gap-1.5 md:gap-2 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95 text-[10px] md:text-sm">
          <ShoppingCart className="w-3.5 h-3.5 md:w-5 md:h-5" /> {user ? t('buy_now') : t('login_to_buy')}
        </Button>
      </CardFooter>
    </Card>
  );
}
