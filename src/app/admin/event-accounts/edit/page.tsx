'use client';

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/lib/context";
import { 
  ArrowLeft, 
  Image as ImageIcon, 
  Loader2, 
  Save, 
  X,
  Plus,
  Gamepad2,
  Trash2,
  Calendar,
  Clock,
  DollarSign,
  ShieldCheck,
  Zap,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { uploadToImgbb } from "@/lib/imgbb";
import { format } from "date-fns";
import Image from "next/image";

function EventAccountEditContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { eventAccounts, saveEventAccount, setGlobalLoading, user, loading } = useApp();

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    gameName: "",
    description: "",
    details: "",
    initialPrice: "",
    tapPrice: "0.50",
    startTime: "",
    endTime: "",
    imageUrls: [] as string[]
  });

  const editingEvent = useMemo(() => {
    return (eventAccounts || []).find(e => e.id === id);
  }, [eventAccounts, id]);

  useEffect(() => {
    if (!loading && !user?.isAdmin) {
      router.replace('/');
      return;
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (editingEvent) {
      setForm({
        title: editingEvent.title,
        gameName: editingEvent.gameName,
        description: editingEvent.description || "",
        details: editingEvent.details || "",
        initialPrice: editingEvent.initialPrice.toString(),
        tapPrice: editingEvent.tapPrice.toString(),
        startTime: format(new Date(editingEvent.startTime), "yyyy-MM-dd'T'HH:mm"),
        endTime: format(new Date(editingEvent.endTime), "yyyy-MM-dd'T'HH:mm"),
        imageUrls: editingEvent.imageUrls || []
      });
    }
  }, [editingEvent]);

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const url = await uploadToImgbb(file);
      setForm(prev => ({ ...prev, imageUrls: [...prev.imageUrls, url] }));
      toast({ title: "Sawirka waa la soo geliyey!" });
    } catch (error) {
      toast({ title: "Upload Failed", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title || !form.gameName || !form.startTime || !form.endTime) {
      toast({ title: "Fadlan buuxi meelaha banaan", variant: "destructive" });
      return;
    }

    const startTs = new Date(form.startTime).getTime();
    const endTs = new Date(form.endTime).getTime();

    if (startTs >= endTs) {
      toast({ 
        title: "Waqtiga waa khalad", 
        description: "Waqtiga dhamaadka waa inuu ka dambeeyaa waqtiga bilaawga.", 
        variant: "destructive" 
      });
      return;
    }

    if (form.imageUrls.length === 0) {
      toast({ title: "Fadlan soo geli ugu yaraan hal sawir", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...form,
        initialPrice: parseFloat(form.initialPrice) || 0,
        tapPrice: parseFloat(form.tapPrice) || 0.50,
        startTime: startTs,
        endTime: endTs,
        id: id || undefined
      };
      await saveEventAccount(payload);
      router.push('/admin');
    } catch (error) {
      toast({ title: "Error saving event", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b dark:border-white/5 h-16 md:h-20 flex items-center px-4 md:px-10 justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="rounded-2xl h-10 w-10 p-0">
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h1 className="text-lg md:text-2xl font-headline font-bold uppercase tracking-tight">
              {id ? 'Edit Auction' : 'New Auction Event'}
            </h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Marketplace Auctions</p>
          </div>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving || isUploading}
          className="rounded-xl px-8 h-12 gap-2 font-black uppercase tracking-widest shadow-xl shadow-primary/20"
        >
          {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
          {isSaving ? 'Saving...' : 'Save Event'}
        </Button>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-10">
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 p-6 md:p-10 space-y-8">
              <div className="space-y-4">
                <Label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">Event Gallery</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {form.imageUrls.map((url, idx) => (
                    <div key={url + idx} className="relative aspect-[4/3] rounded-[1.5rem] overflow-hidden border-4 border-slate-50 dark:border-white/5 group shadow-md">
                      <Image src={url} alt="" fill className="object-cover" unoptimized />
                      <button 
                        type="button" 
                        onClick={() => setForm(f => ({ ...f, imageUrls: f.imageUrls.filter((_, i) => i !== idx) }))}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                      {idx === 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-white text-[8px] font-black uppercase text-center py-1">Main Cover</div>
                      )}
                    </div>
                  ))}
                  <div className="relative aspect-[4/3] rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center group hover:bg-slate-100 transition-colors">
                    <ImageIcon className="text-slate-300 w-10 h-10 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase text-slate-400">Add Media</span>
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase text-slate-400 ml-1">Event Title</Label>
                  <Input 
                    value={form.title} 
                    onChange={e => setForm({...form, title: e.target.value})} 
                    className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold px-6" 
                    placeholder="e.g. Max FF Account" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase text-slate-400 ml-1">Game Name</Label>
                  <Input 
                    value={form.gameName} 
                    onChange={e => setForm({...form, gameName: e.target.value})} 
                    className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold px-6" 
                    placeholder="e.g. Free Fire" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-black uppercase text-slate-400 ml-1">Account Specifications</Label>
                <Textarea 
                  value={form.details} 
                  onChange={e => setForm({...form, details: e.target.value})} 
                  placeholder="Lv 75, Rank Master, 5 Evo Skins, Rare Emotes..." 
                  className="rounded-3xl bg-slate-50 dark:bg-slate-800 border-none min-h-[150px] p-6 font-medium shadow-inner" 
                />
              </div>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 p-6 md:p-8 space-y-6">
              <h3 className="font-headline font-bold text-lg uppercase tracking-tight flex items-center gap-2">
                <DollarSign size={18} className="text-primary" /> Pricing Config
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Initial Price ($)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={form.initialPrice} 
                    onChange={e => setForm({...form, initialPrice: e.target.value})} 
                    className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-black px-6 text-lg" 
                    placeholder="10.00" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Price Per BID ($)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={form.tapPrice} 
                    onChange={e => setForm({...form, tapPrice: e.target.value})} 
                    className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-black px-6 text-lg text-primary" 
                    placeholder="0.50" 
                  />
                </div>
              </div>
            </Card>

            <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 p-6 md:p-8 space-y-6">
              <h3 className="font-headline font-bold text-lg uppercase tracking-tight flex items-center gap-2">
                <Calendar size={18} className="text-primary" /> Schedule
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Start Time</Label>
                  <Input 
                    type="datetime-local" 
                    value={form.startTime} 
                    onChange={e => setForm({...form, startTime: e.target.value})} 
                    className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold px-6" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">End Time</Label>
                  <Input 
                    type="datetime-local" 
                    value={form.endTime} 
                    onChange={e => setForm({...form, endTime: e.target.value})} 
                    className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold px-6" 
                  />
                </div>
                {(form.startTime && form.endTime && new Date(form.startTime) >= new Date(form.endTime)) && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-600 text-[9px] font-bold uppercase tracking-wider">
                     <AlertTriangle size={14} className="shrink-0" />
                     <span>Waqtiga dhamaadka waa inuu ka dambeeyaa waqtiga bilaawga.</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function EventAccountEditPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <EventAccountEditContent />
    </Suspense>
  );
}
