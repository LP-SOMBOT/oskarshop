
"use client";

import { useApp } from "@/lib/context";
import { ArrowLeft, ScrollText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function TermsPage() {
  const { storeSettings, language, t } = useApp();
  const router = useRouter();

  const termsText = language === 'so' 
    ? storeSettings?.termsAndConditions?.so 
    : storeSettings?.termsAndConditions?.en;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b dark:border-white/5 h-16 md:h-20 flex items-center px-4 md:px-10 justify-between">
         <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
               <ArrowLeft size={24} />
            </Button>
            <h1 className="text-xl md:text-2xl font-headline font-bold uppercase tracking-tight">{t('terms_of_service')}</h1>
         </div>
         <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <ScrollText size={24} />
         </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-10 space-y-8">
         <Card className="rounded-[2rem] md:rounded-[3rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
            <div className="p-8 md:p-12 space-y-8">
               <div className="flex items-center gap-3 text-primary mb-6">
                  <ShieldCheck size={28} />
                  <span className="text-sm font-black uppercase tracking-[0.3em]">Official Agreement</span>
               </div>

               <div className="prose prose-slate dark:prose-invert max-w-none">
                  {termsText ? (
                    <div className="text-slate-700 dark:text-slate-300 leading-loose whitespace-pre-wrap font-medium text-base md:text-lg">
                       {termsText}
                    </div>
                  ) : (
                    <div className="py-20 text-center opacity-30 italic flex flex-col items-center gap-4">
                       <ScrollText size={48} className="text-slate-300" />
                       <p className="text-lg font-bold uppercase tracking-widest">Terms are currently being updated.</p>
                    </div>
                  )}
               </div>
            </div>
         </Card>

         <div className="text-center space-y-4">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Oskar Shop © 2026 - All Rights Reserved</p>
            <Button variant="ghost" onClick={() => router.back()} className="text-primary font-bold">Back to Profile</Button>
         </div>
      </main>
    </div>
  );
}
