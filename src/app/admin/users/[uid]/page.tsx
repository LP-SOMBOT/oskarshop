
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useApp } from "@/lib/context";
import { 
  ArrowLeft, 
  User, 
  Smartphone, 
  Mail, 
  Calendar, 
  Star, 
  Trophy, 
  ShoppingBag, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ShieldCheck, 
  Smartphone as PhoneIcon,
  MessageCircle,
  Copy,
  ExternalLink,
  Loader2,
  Bell,
  Activity,
  CreditCard,
  Gamepad2,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import Image from "next/image";
import { cn, formatWhatsAppNumber } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import VerifiedBadge from "@/components/VerifiedBadge";
import { StatusBadge } from "@/app/admin/page";

/**
 * User Inspection Page
 * Deep dive into customer profile, order history, and activity logs.
 */
export default function UserInspectPage() {
  const { uid } = useParams();
  const router = useRouter();
  const { allUsers, allOrders, user: adminUser, loading, setGlobalLoading, notifications } = useApp();
  
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setGlobalLoading(false);
    if (!loading && !adminUser?.isAdmin) {
      router.replace('/');
    } else if (!loading) {
      setIsReady(true);
    }
  }, [adminUser, loading, router, setGlobalLoading]);

  const targetUser = useMemo(() => {
    return allUsers.find(u => u.uid === uid);
  }, [allUsers, uid]);

  const userOrders = useMemo(() => {
    return allOrders.filter(o => o.userId === uid).sort((a, b) => b.createdAt - a.createdAt);
  }, [allOrders, uid]);

  const totalRevenue = useMemo(() => {
    return userOrders
      .filter(o => o.status === 'successful')
      .reduce((acc, o) => acc + (o.total || 0), 0);
  }, [userOrders]);

  const userNotifications = useMemo(() => {
    // Only admins can see system broadcast context, but this view shows user-specific logs
    return notifications.filter(n => !n.isAdminOnly); 
  }, [notifications]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} Copied!` });
  };

  const handleWhatsApp = () => {
    if (!targetUser?.phoneNumber) return;
    const phone = formatWhatsAppNumber(targetUser.phoneNumber);
    const message = `Asc ${targetUser.name}, waxaan kaala soo xariirayaa Oskar Shop...`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (!isReady || !targetUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 space-y-8">
        <Skeleton className="h-10 w-40 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-[400px] lg:col-span-1 rounded-[2.5rem]" />
          <Skeleton className="h-[600px] lg:col-span-2 rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  const lastActive = targetUser.lastActive ? new Date(targetUser.lastActive) : null;
  const isOnline = lastActive && (Date.now() - lastActive.getTime()) < 300000;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b dark:border-white/5 h-16 md:h-20 flex items-center px-4 md:px-10 justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-2xl">
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h1 className="text-lg md:text-2xl font-headline font-bold uppercase tracking-tight">Customer Information</h1>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">Deep-Dive Analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={cn(
            "rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border-none shadow-sm",
            isOnline ? "bg-green-500 text-white animate-pulse" : "bg-slate-100 text-slate-400"
          )}>
            {isOnline ? 'Online Now' : 'Offline'}
          </Badge>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 md:p-8 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Profile Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-8">
            <Card className="rounded-[3rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden sticky top-24">
              <div className="h-32 bg-gradient-to-br from-primary to-indigo-600 relative">
                 <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
              </div>
              <div className="px-8 pb-10">
                <div className="relative -mt-16 mb-6 flex justify-center">
                  <div className="w-32 h-32 rounded-[2.5rem] border-[6px] border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-2xl relative">
                    {targetUser.photoURL ? (
                      <Image src={targetUser.photoURL} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={48} /></div>
                    )}
                  </div>
                  {targetUser.isVerified && (
                    <div className="absolute bottom-2 right-[30%]">
                       <VerifiedBadge className="text-3xl" />
                    </div>
                  )}
                </div>

                <div className="text-center space-y-2 mb-10">
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">{targetUser.name}</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">UID: {targetUser.uid}</p>
                  <div className="flex justify-center gap-2 pt-2">
                    <Badge className={cn(
                      "uppercase text-[9px] font-black tracking-widest px-3 py-1",
                      targetUser.role === 'admin' ? "bg-primary text-white" : "bg-blue-50 text-blue-600"
                    )}>{targetUser.role}</Badge>
                    {targetUser.banned && <Badge className="bg-red-500 text-white uppercase text-[9px] font-black tracking-widest px-3 py-1">Banned</Badge>}
                  </div>
                </div>

                <div className="space-y-4">
                  <InfoItem icon={PhoneIcon} label="Phone" value={targetUser.phoneNumber || "N/A"} onCopy={() => handleCopy(targetUser.phoneNumber || "", "Phone")} />
                  <InfoItem icon={Mail} label="Email" value={targetUser.email || "N/A"} onCopy={() => handleCopy(targetUser.email || "", "Email")} />
                  <InfoItem icon={Calendar} label="Joined" value={targetUser.createdAt ? format(new Date(targetUser.createdAt), 'MMM d, yyyy') : "N/A"} />
                  <InfoItem icon={Activity} label="Last Active" value={lastActive ? format(lastActive, 'MMM d, HH:mm') : "Never"} />
                </div>

                <div className="pt-10 space-y-4">
                   <Button onClick={handleWhatsApp} className="w-full h-14 rounded-2xl bg-green-600 hover:bg-green-700 font-bold gap-2 text-white shadow-xl shadow-green-600/20 active:scale-95 transition-all">
                      <MessageCircle size={20} /> Open WhatsApp Chat
                   </Button>
                   <Button variant="outline" onClick={() => router.push('/admin')} className="w-full h-12 rounded-2xl border-2 font-bold text-slate-500">
                      Back to Dashboard
                   </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Activity Hub (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <AnalyticsCard label="Total Spent" value={`$${totalRevenue.toFixed(2)}`} icon={CreditCard} color="text-green-500" bgColor="bg-green-50 dark:bg-green-500/10" />
              <AnalyticsCard label="Successful Orders" value={userOrders.filter(o => o.status === 'successful').length.toString()} icon={ShoppingBag} color="text-primary" bgColor="bg-blue-50 dark:bg-blue-500/10" />
              <AnalyticsCard label="Reward Balance" value={`${targetUser.points || 0} PTS`} icon={Star} color="text-amber-500" bgColor="bg-amber-50 dark:bg-amber-500/10" />
            </div>

            <Card className="rounded-[3rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
               <Tabs defaultValue="orders" className="w-full">
                  <div className="px-8 pt-8 flex items-center justify-between border-b dark:border-white/5 pb-4">
                    <TabsList className="bg-slate-100 dark:bg-slate-800 rounded-2xl h-12 p-1 gap-1">
                      <TabsTrigger value="orders" className="rounded-xl font-bold uppercase text-[10px] tracking-widest px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">Order History</TabsTrigger>
                      <TabsTrigger value="listings" className="rounded-xl font-bold uppercase text-[10px] tracking-widest px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">Marketplace</TabsTrigger>
                      <TabsTrigger value="security" className="rounded-xl font-bold uppercase text-[10px] tracking-widest px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">Security Log</TabsTrigger>
                    </TabsList>
                    <Badge className="bg-slate-50 dark:bg-slate-800 text-slate-400 border-none px-4 py-1 rounded-full text-[10px] font-black uppercase">{userOrders.length} Records</Badge>
                  </div>

                  <TabsContent value="orders" className="p-0 animate-in fade-in duration-300">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-none bg-slate-50/30 dark:bg-slate-800/20 h-16">
                            <TableHead className="pl-8 font-black uppercase text-[10px] tracking-widest">Reference</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Product</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Amount</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Date</TableHead>
                            <TableHead className="pr-8 text-right font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userOrders.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="h-64 text-center text-slate-300 italic font-black uppercase">No orders found.</TableCell></TableRow>
                          ) : (
                            userOrders.map(order => (
                              <TableRow key={order.id} className="h-20 border-slate-50 dark:border-white/5 hover:bg-slate-50/50 transition-colors">
                                <TableCell className="pl-8 font-headline font-bold text-primary">#{order.id.toUpperCase()}</TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-[200px]">{order.items?.[0]?.title || "Unknown"}</span>
                                    <span className="text-[9px] font-black text-slate-400 uppercase">{order.gameDetails?.category || 'Top-Up'}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="font-black text-slate-900 dark:text-white">${order.total.toFixed(2)}</TableCell>
                                <TableCell className="text-[11px] font-bold text-slate-500">{format(new Date(order.createdAt), 'MMM d, HH:mm')}</TableCell>
                                <TableCell className="pr-8 text-right">
                                  <StatusBadge status={order.status} />
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  <TabsContent value="listings" className="p-8 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {/* This could filter accountPosts specifically for this user if needed globally */}
                       <div className="col-span-full py-20 text-center opacity-20 italic font-black uppercase border-2 border-dashed rounded-3xl">
                          Integrated Marketplace History coming soon
                       </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="security" className="p-8 animate-in fade-in duration-300 space-y-6">
                    <div className="space-y-4">
                       <h4 className="text-[11px] font-black uppercase text-red-500 tracking-widest ml-1">Formal Warnings</h4>
                       {Object.values(targetUser.warnings || {}).length === 0 ? (
                         <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border dark:border-white/5 text-center text-xs font-bold text-slate-400 italic">No warnings issued to this customer.</div>
                       ) : (
                         Object.values(targetUser.warnings || {}).map((w: any) => (
                           <div key={w.id} className="p-5 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/30 flex gap-4">
                              <AlertTriangle className="text-red-500 shrink-0" size={20} />
                              <div className="min-w-0">
                                <p className="font-bold text-sm text-red-700 dark:text-red-400">{w.message}</p>
                                <p className="text-[10px] font-black text-red-600/40 uppercase mt-1">{format(new Date(w.timestamp), 'MMM d, yyyy - HH:mm')}</p>
                              </div>
                           </div>
                         ))
                       )}
                    </div>

                    <div className="space-y-4 pt-6 border-t dark:border-white/5">
                       <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">Account Flags</h4>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
                             <span className="text-xs font-bold">Suspension Status</span>
                             {targetUser.suspendedUntil && targetUser.suspendedUntil > Date.now() ? (
                               <Badge className="bg-red-500 text-white border-none uppercase font-black text-[9px]">Suspended</Badge>
                             ) : (
                               <Badge className="bg-green-100 text-green-700 border-none uppercase font-black text-[9px]">Clear</Badge>
                             )}
                          </div>
                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
                             <span className="text-xs font-bold">Registration Verification</span>
                             {targetUser.isVerified ? (
                               <Badge className="bg-blue-500 text-white border-none uppercase font-black text-[9px]">Verified</Badge>
                             ) : (
                               <Badge className="bg-slate-200 text-slate-500 border-none uppercase font-black text-[9px]">Standard</Badge>
                             )}
                          </div>
                       </div>
                    </div>
                  </TabsContent>
               </Tabs>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value, onCopy }: { icon: any, label: string, value: string, onCopy?: () => void }) {
  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border dark:border-white/5 group relative transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
       <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400 shadow-sm">
             <Icon size={16} />
          </div>
          <div className="min-w-0 flex-1">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
             <p className="text-sm font-bold text-slate-900 dark:text-white truncate pr-6">{value}</p>
          </div>
       </div>
       {onCopy && (
         <button onClick={onCopy} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
            <Copy size={14} />
         </button>
       )}
    </div>
  );
}

function AnalyticsCard({ label, value, icon: Icon, color, bgColor }: { label: string, value: string, icon: any, color: string, bgColor: string }) {
  return (
    <Card className="rounded-[2.5rem] p-6 border-none shadow-xl bg-white dark:bg-slate-900 transition-transform hover:-translate-y-1">
       <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-sm", bgColor, color)}>
          <Icon size={24} />
       </div>
       <h3 className="text-2xl font-headline font-bold text-slate-900 dark:text-white leading-none mb-1">{value}</h3>
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    </Card>
  );
}
