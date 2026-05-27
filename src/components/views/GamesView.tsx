
"use client";

import { useState, useMemo, useEffect } from "react";
import GameCard from "@/components/games/GameCard";
import { useApp } from "@/lib/context";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Gamepad2, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import Image from "next/image";

export default function GamesView() {
  const { games, products, isInitialLoading } = useApp();
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  // Sync selection logic with URL Hash to enable browser "back" support
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#games-')) {
        const id = hash.replace('#games-', '');
        setSelectedGameId(id);
      } else {
        setSelectedGameId(null);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleSelectGame = (id: string) => {
    window.location.hash = `#games-${id}`;
  };

  const handleGoBack = () => {
    window.location.hash = '#games';
  };

  const filteredGames = useMemo(() => {
    return (games || []).filter(g => g.category === 'top-up');
  }, [games]);

  const selectedGame = useMemo(() => {
    return games.find(g => g.id === selectedGameId);
  }, [games, selectedGameId]);

  const filteredProducts = useMemo(() => {
    if (!selectedGameId) return [];
    // Filter and sort by orderIndex
    return (products || [])
      .filter(p => p.gameId === selectedGameId)
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  }, [products, selectedGameId]);

  if (isInitialLoading) {
    return (
      <div className="pb-24 px-4 py-8 max-w-[1600px] mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <Skeleton className="h-10 w-48 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <Skeleton key={i} className="h-28 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 page-transition">
      <main className="container mx-auto px-4 py-4 md:py-8 max-w-[1600px]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8 mb-6 md:mb-14">
          <div className="flex items-center gap-3 md:gap-4 lg:gap-8">
            {selectedGameId && (
              <button 
                onClick={handleGoBack}
                className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/10 text-slate-900 dark:text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all shrink-0"
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8" strokeWidth={3} />
              </button>
            )}
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-headline font-bold text-slate-900 dark:text-white leading-tight truncate">
                {selectedGame ? selectedGame.title : "Game Store"}
              </h1>
              <p className="text-muted-foreground font-medium uppercase tracking-widest text-[8px] md:text-xs lg:text-sm">
                {selectedGame ? `Browsing packages` : "Select a game"}
              </p>
            </div>
          </div>
        </div>

        {!selectedGameId ? (
          <div className="flex flex-col gap-3 md:gap-4 w-full">
            {filteredGames.length > 0 ? (
              filteredGames.map((game) => (
                <Card 
                  key={game.id} 
                  onClick={() => handleSelectGame(game.id)}
                  className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 rounded-xl lg:rounded-[2.5rem] p-1 lg:p-1.5 pr-0 flex items-center h-20 lg:h-32 cursor-pointer w-full"
                >
                  <div className="w-16 h-16 lg:w-28 lg:h-28 rounded-lg lg:rounded-3xl overflow-hidden relative shrink-0 m-0.5 bg-slate-50 dark:bg-slate-800 border dark:border-white/5">
                    {game.icon ? (
                      <Image src={game.icon} alt={game.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary font-bold">
                        <Gamepad2 className="w-6 h-6 lg:w-10 lg:h-10" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 px-3 md:px-5 lg:px-12 min-w-0">
                    <h3 className="font-headline font-bold text-sm md:text-lg lg:text-3xl text-slate-900 dark:text-white truncate uppercase tracking-tight group-hover:text-primary transition-colors">
                      {game.title}
                    </h3>
                  </div>
                  <button className="h-full px-6 sm:px-10 lg:px-20 bg-primary text-white font-black text-xs md:text-lg lg:text-3xl flex items-center justify-center transition-all group-hover:bg-primary/90 active:scale-95 uppercase tracking-widest shrink-0 ml-auto">
                    iibso
                  </button>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-20 opacity-30 italic">No games found.</div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-6 lg:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => (
                <GameCard 
                  key={p.id} 
                  {...p} 
                  gameId={selectedGame?.title || 'Game'} 
                />
              ))
            ) : (
              <div className="col-span-full text-center py-24 opacity-30 flex flex-col items-center gap-4">
                 <Search className="w-12 h-12 lg:w-16 lg:h-16 text-slate-300" />
                 <p className="text-sm lg:text-xl font-bold uppercase tracking-widest">No matching packages</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
