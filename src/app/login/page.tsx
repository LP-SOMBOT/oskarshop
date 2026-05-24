"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Mail, Lock, EyeOff, Eye, Loader2, AlertCircle, ArrowLeft, Key, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import emailjs from '@emailjs/browser';

/**
 * @fileOverview Login Page with dynamic Recovery Protocol.
 * Fetches EmailJS credentials from store settings.
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

  const { login, user, isGlobalLoading, authError, t, storeSettings } = useApp();
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
      // 1. Validate EmailJS Config
      const ejConfig = storeSettings?.emailjs;
      if (!ejConfig?.serviceId || !ejConfig?.templateId || !ejConfig?.publicKey) {
        throw new Error("Password reset is temporarily unavailable. Please contact Oskar Shop support.");
      }

      // 2. Call Next.js API to generate OTP
      const res = await fetch('/api/generate-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Reset service encountered an error. Please try again later.");
      }

      const data = await res.json();

      if (!data.success) {
        setServerError(data.message);
        setIsSubmitting(false);
        return;
      }

      // 3. Send Email via EmailJS
      await emailjs.send(
        ejConfig.serviceId,
        ejConfig.templateId,
        { to_email: email, otp_code: data.otp },
        ejConfig.publicKey
      );

      toast({ title: "Code Sent!", description: "Check your email inbox." });
      setView('verify');
    } catch (err: any) {
      console.error('Request OTP Error:', err);
      setServerError(err.message || "Failed to send code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setServerError("OTP must be 6 digits."); return; }
    if (newPassword.length < 8) { setServerError("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setServerError("Passwords do not match."); return; }

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

      toast({ title: "Success!", description: "Password updated. Redirecting..." });
      setTimeout(() => setView('login'), 2000);
    } catch (err: any) {
      console.error('Verify OTP Error:', err);
      setServerError("Verification failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#7C3AED] overflow-x-hidden page-transition">
      <div className="pt-10 pb-6 sm:pt-24 sm:pb-16 px-6 sm:px-10 shrink-0">
        <h1 className="text-3xl sm:text-4xl font-headline font-bold text-white leading-tight">
          OskarShop
        </h1>
        <p className="text-xl sm:text-2xl font-headline text-white/80 mt-2 font-medium">
          {view === 'login' ? 'Login?' : 'Reset Access'}
        </p>
      </div>

      <div className="flex-1 bg-white rounded-t-[3rem] sm:rounded-t-[3.5rem] p-6 sm:p-10 shadow-2xl relative">
        {(isGlobalLoading || user) && (
          <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm rounded-t-[3rem] sm:rounded-t-[3.5rem] flex flex-col items-center justify-center gap-4 text-center p-8">
             <Loader2 className="w-12 h-12 animate-spin text-[#7C3AED]" />
             <p className="text-sm font-bold text-[#7C3AED] animate-pulse">
                {user ? "Authorizing access..." : "Synchronizing..."}
             </p>
          </div>
        )}

        <div className="max-w-md mx-auto h-full flex flex-col">
          {(authError || serverError) && (
             <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-xs font-bold leading-relaxed">{authError || serverError}</p>
             </div>
          )}
          
          {view === 'login' && (
            <div className="space-y-6">
              <h2 className="text-2xl sm:text-3xl font-headline font-bold text-gray-900">Log In</h2>
              <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#7C3AED] z-10"><Mail className="w-5 h-5" /></div>
                  <Input 
                    type="email" 
                    placeholder="Email address" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 sm:h-16 pl-14 rounded-full border-gray-200 bg-gray-50 focus:bg-white focus:border-[#7C3AED] font-bold text-gray-900"
                  />
                </div>

                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#7C3AED] z-10"><Lock className="w-5 h-5" /></div>
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Enter Password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 sm:h-16 pl-14 pr-14 rounded-full border-gray-200 bg-gray-50 focus:bg-white focus:border-[#7C3AED] font-bold text-gray-900"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 p-1">
                    {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                </div>

                <div className="text-right">
                  <button type="button" onClick={() => setView('forgot')} className="text-blue-600 text-xs sm:text-sm font-bold hover:underline">
                    {t('forgot_password')}
                  </button>
                </div>

                <Button type="submit" disabled={isSubmitting || isGlobalLoading} className="w-full h-14 sm:h-16 rounded-full text-base sm:text-lg font-bold bg-[#7C3AED] hover:bg-[#6D28D9] shadow-xl shadow-[#7C3AED]/20">
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "LOG IN"}
                </Button>

                <div className="text-center pt-2 pb-6">
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">
                    Don't have an account? <Link href="/signup" className="text-[#7C3AED] font-bold hover:underline ml-1">Sign Up</Link>
                  </p>
                </div>
              </form>
            </div>
          )}

          {view === 'forgot' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-headline font-bold text-gray-900">Forgot Password?</h2>
                <p className="text-sm text-gray-500 font-medium">Enter your email and we'll send you a 6-digit verification code.</p>
              </div>

              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#7C3AED] z-10"><Mail className="w-5 h-5" /></div>
                  <Input 
                    type="email" 
                    placeholder="user@example.com" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 sm:h-16 pl-14 rounded-full border-gray-200 bg-gray-50 focus:bg-white focus:border-[#7C3AED] font-bold"
                  />
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-full bg-[#7C3AED] font-bold text-lg shadow-xl shadow-[#7C3AED]/20">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Send Code"}
                </Button>

                <button type="button" onClick={() => setView('login')} className="flex items-center justify-center gap-2 text-[#7C3AED] text-sm font-bold mt-4 w-full">
                  <ArrowLeft size={16} /> Back to Login
                </button>
              </form>
            </div>
          )}

          {view === 'verify' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-headline font-bold text-gray-900">Verify Code</h2>
                <p className="text-sm text-gray-500 font-medium">We sent a 6-digit code to <span className="font-bold text-[#7C3AED]">{email}</span></p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-widest">6-Digit Code</Label>
                  <Input 
                    type="text" 
                    placeholder="000000" 
                    required 
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="h-14 text-center text-2xl tracking-[0.5em] rounded-full bg-gray-50 border-gray-100 font-black"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-widest">New Password</Label>
                  <Input 
                    type="password" 
                    placeholder="Min 8 characters" 
                    required 
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-14 px-6 rounded-full bg-gray-50 border-gray-100 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-widest">Confirm Password</Label>
                  <Input 
                    type="password" 
                    placeholder="Repeat password" 
                    required 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-14 px-6 rounded-full bg-gray-50 border-gray-100 font-bold"
                  />
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-full bg-green-600 hover:bg-green-700 font-bold text-lg shadow-xl shadow-green-600/20 uppercase tracking-widest">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <><CheckCircle2 className="mr-2" /> Reset Password</>}
                </Button>

                <button type="button" onClick={() => setView('forgot')} className="w-full text-gray-400 text-xs font-bold hover:text-gray-600">
                  Didn't receive the code? Resend
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
