"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Mail, Lock, EyeOff, Eye, Loader2, AlertCircle, ArrowLeft, CheckCircle2, ShieldCheck, KeyRound } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import emailjs from '@emailjs/browser';

/**
 * @fileOverview Login Page with Somali language default and responsive UI.
 * Optimized for small mobile screens to prevent unnecessary scrolling.
 */

export default function LoginPage() {
  const [view, setView] = useState<'login' | 'forgot' | 'verify'>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Forgot Password State
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  const { login, user, isGlobalLoading, authError, storeSettings } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (error: any) {
      console.error("Login Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setServerError(null);

    try {
      const ejConfig = storeSettings?.emailjs;
      if (!ejConfig?.serviceId || !ejConfig?.templateId || !ejConfig?.publicKey) {
        throw new Error("Adeegga dib u habaynta password-ka si ku meel gaadh ah uma shaqaynayo.");
      }

      const res = await fetch('/api/generate-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!data.success) {
        setServerError(data.message);
        setIsSubmitting(false);
        return;
      }

      await emailjs.send(
        ejConfig.serviceId,
        ejConfig.templateId,
        { to_email: email, otp_code: data.otp },
        ejConfig.publicKey
      );

      toast({ title: "Code-ka waa la diray!", description: "Ka eeg email-kaaga." });
      setView('verify');
    } catch (err: any) {
      setServerError(err.message || "Wuu ku guul darraystay diritaanka code-ka.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setServerError("Code-ku waa inuu ka koobnaadaa 6 nambar."); return; }
    if (newPassword.length < 8) { setServerError("Password-ku waa inuu ka koobnaadaa ugu yaraan 8 xaraf."); return; }
    if (newPassword !== confirmPassword) { setServerError("Password-yada isma laha."); return; }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();

      if (!data.success) {
        setServerError(data.message);
        setIsSubmitting(false);
        return;
      }

      toast({ title: "Guul!", description: "Password-ka waa la bedelay." });
      setTimeout(() => setView('login'), 2000);
    } catch (err: any) {
      setServerError("Xaqiijinta waa lagu guul darraystay.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#7C3AED] overflow-x-hidden page-transition">
      <div className="pt-8 pb-6 sm:pt-24 sm:pb-16 px-6 sm:px-10 shrink-0">
        <h1 className="text-xl sm:text-4xl font-headline font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">
          Ku Soo dhawoow OskarShop
        </h1>
        <p className="text-sm sm:text-2xl font-headline text-white/80 mt-1 font-medium">
          {view === 'login' ? 'Soo gal' : view === 'forgot' ? 'Bedel password kaaga' : 'Xaqiijinta Account-ka'}
        </p>
      </div>

      <div className="flex-1 bg-white rounded-t-[3.5rem] px-6 py-8 sm:p-10 shadow-2xl relative flex flex-col items-center justify-center">
        {(isGlobalLoading || user) && (
          <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm rounded-t-[3.5rem] flex flex-col items-center justify-center gap-4 text-center p-8">
             <Loader2 className="w-12 h-12 animate-spin text-[#7C3AED]" />
             <p className="text-sm font-bold text-[#7C3AED] animate-pulse">
                {user ? "Xaqiijinta galitaanka..." : "Isku xirka..."}
             </p>
          </div>
        )}

        <div className="max-w-md w-full">
          {(authError || serverError) && (
             <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-2xl flex gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold leading-relaxed">{authError || serverError}</p>
             </div>
          )}
          
          {view === 'login' && (
            <div className="space-y-6">
              <h2 className="text-xl sm:text-3xl font-headline font-bold text-gray-900">Soo gal</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#7C3AED] z-10"><Mail className="w-5 h-5" /></div>
                  <Input 
                    type="email" 
                    placeholder="Email-kaaga" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 sm:h-16 pl-14 rounded-full border-gray-200 bg-gray-50 focus:bg-white focus:border-[#7C3AED] font-bold text-gray-900 transition-all"
                  />
                </div>

                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#7C3AED] z-10"><Lock className="w-5 h-5" /></div>
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Password-kaaga" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 sm:h-16 pl-14 pr-14 rounded-full border-gray-200 bg-gray-50 focus:bg-white focus:border-[#7C3AED] font-bold text-gray-900 transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 p-1">
                    {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                </div>

                <div className="text-right">
                  <button type="button" onClick={() => setView('forgot')} className="text-blue-600 text-xs font-bold hover:underline">
                    Ma ilaawday password-ka?
                  </button>
                </div>

                <Button type="submit" disabled={isSubmitting || isGlobalLoading} className="w-full h-12 sm:h-16 rounded-full text-base font-bold bg-[#7C3AED] hover:bg-[#6D28D9] shadow-xl shadow-[#7C3AED]/20 transition-all active:scale-95 uppercase">
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "SOO GAL"}
                </Button>

                <div className="text-center pt-2">
                  <Link href="/signup" className="block w-full">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full h-12 sm:h-16 rounded-full text-base font-bold border-2 border-[#7C3AED]/10 text-[#7C3AED] hover:bg-[#7C3AED]/5 hover:border-[#7C3AED]/20 transition-all active:scale-95"
                    >
                      SAMEEY ACCOUNT
                    </Button>
                  </Link>
                </div>
              </form>
            </div>
          )}

          {view === 'forgot' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-3xl font-headline font-bold text-gray-900">Ma ilaawday password-ka?</h2>
                <p className="text-xs sm:text-base text-gray-500 font-medium leading-relaxed">Geli email-kaaga si aan kuugu soo dirno code-ka xaqiijinta ee 6-da nambar ah.</p>
              </div>

              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#7C3AED] z-10"><Mail className="w-5 h-5" /></div>
                  <Input 
                    type="email" 
                    placeholder="Email-kaaga" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 sm:h-16 pl-14 rounded-full border-gray-200 bg-gray-50 focus:bg-white focus:border-[#7C3AED] font-bold transition-all"
                  />
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full h-12 sm:h-16 rounded-full bg-[#7C3AED] font-bold text-lg shadow-xl shadow-[#7C3AED]/20 transition-all active:scale-95 uppercase tracking-wide">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Dir Code-ka"}
                </Button>

                <button type="button" onClick={() => setView('login')} className="flex items-center justify-center gap-2 text-[#7C3AED] text-sm font-bold mt-2 w-full group">
                  <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Dib U noqo
                </button>
              </form>
            </div>
          )}

          {view === 'verify' && (
            <div className="space-y-5 animate-in slide-in-from-right-4 duration-500">
              <div className="space-y-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#7C3AED]">
                  <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h2 className="text-lg sm:text-3xl font-headline font-bold text-gray-900 leading-tight">Xaqiiji Code-ka</h2>
                <p className="text-[10px] sm:text-base text-gray-500 font-medium leading-relaxed">
                  Waxaan code-ka u dirnay <span className="font-bold text-[#7C3AED] block sm:inline truncate max-w-full">{email}</span>
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest">6-Digit Code</Label>
                  <Input 
                    type="text" 
                    placeholder="000000" 
                    required 
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="h-12 sm:h-16 text-center text-xl sm:text-3xl tracking-[0.4em] sm:tracking-[0.6em] rounded-2xl bg-gray-50 border-gray-100 focus:border-[#7C3AED] focus:bg-white font-black text-gray-900 shadow-inner transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest">Password Cusub</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
                      <Input 
                        type="password" 
                        placeholder="Ugu yaraan 8 xaraf" 
                        required 
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-11 sm:h-14 pl-14 rounded-full bg-gray-50 border-gray-100 focus:border-[#7C3AED] font-bold shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest">Xaqiiji Password-ka</Label>
                    <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
                      <Input 
                        type="password" 
                        placeholder="Ku celi password-ka" 
                        required 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-11 sm:h-14 pl-14 rounded-full bg-gray-50 border-gray-100 focus:border-[#7C3AED] font-bold shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 space-y-3">
                  <Button type="submit" disabled={isSubmitting} className="w-full h-12 sm:h-16 rounded-full bg-green-600 hover:bg-green-700 font-bold text-base sm:text-lg shadow-xl shadow-green-600/20 uppercase tracking-widest transition-all active:scale-95 group">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <><CheckCircle2 className="mr-2 w-4 h-4" /> Bedel Password-ka</>}
                  </Button>

                  <div className="flex flex-col gap-2 text-center">
                    <button 
                      type="button" 
                      onClick={() => { setOtp(""); setServerError(null); handleRequestOtp(new Event('submit') as any); }} 
                      className="text-gray-400 text-[10px] sm:text-sm font-bold hover:text-[#7C3AED] transition-colors"
                    >
                      Code-ka ma helin? <span className="underline decoration-dotted">Dib u dir</span>
                    </button>

                    <button type="button" onClick={() => setView('login')} className="flex items-center justify-center gap-2 text-gray-400 text-[10px] sm:text-sm font-bold hover:text-gray-600 transition-colors">
                      <ArrowLeft size={14} /> Dib U noqo
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
