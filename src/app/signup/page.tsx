"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { User, Lock, Smartphone, Loader2, ArrowLeft, Eye, EyeOff, AlertCircle, Mail, ShieldCheck, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import emailjs from '@emailjs/browser';
import { 
  EMAILJS_SERVICE_ID, 
  EMAILJS_TEMPLATE_ID, 
  EMAILJS_PUBLIC_KEY 
} from "@/lib/emailjs-config";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // OTP States
  const [showOtpOverlay, setShowOtpOverlay] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const { signup, user, isGlobalLoading, authError, language, t, storeSettings } = useApp();
  const router = useRouter();

  // EmailJS Verification Config Override
  const verificationConfig = storeSettings.emailjs_verification || {
    serviceId: EMAILJS_SERVICE_ID,
    templateId: EMAILJS_TEMPLATE_ID,
    publicKey: EMAILJS_PUBLIC_KEY
  };

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: language === 'so' ? "Khalad" : "Error",
        description: language === 'so' ? "Password-yada isma laha." : "Passwords do not match.",
      });
      return;
    }

    if (password.length < 8) {
      toast({ variant: "destructive", title: language === 'so' ? "Khalad" : "Error", description: "Password-ku waa inuu ka koobnaadaa ugu yaraan 8 xaraf." });
      return;
    }

    if (phone.length < 9) {
      toast({ variant: "destructive", title: language === 'so' ? "Khalad" : "Error", description: "Numbarku waa inuu ka koobnaadaa ugu yaraan 9 nambar." });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Generate OTP and check uniqueness via API
      const res = await fetch('/api/generate-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone: "+252" + phone, type: 'signup' }),
      });

      const data = await res.json();

      if (!data.success) {
        toast({ variant: "destructive", title: "Khalad", description: data.message });
        setIsSubmitting(false);
        return;
      }

      // 2. Send OTP via EmailJS (Using Verification Template)
      await emailjs.send(
        verificationConfig.serviceId,
        verificationConfig.templateId,
        {
          to_name: name,
          to_email: email,
          otp_code: data.otp,
        },
        verificationConfig.publicKey
      );

      setShowOtpOverlay(true);
      toast({ title: "Verification code sent!", description: "Check your email." });
    } catch (err: any) {
      console.error("EmailJS Error:", err);
      toast({ variant: "destructive", title: "Failed", description: "Email-ka waa lagu guul darraystay in la diro." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyAndSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);

    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode }),
      });

      const data = await res.json();

      if (!data.success) {
        toast({ variant: "destructive", title: "Khalad", description: data.message });
        setIsVerifying(false);
        return;
      }

      // Final Signup
      await signup("+252" + phone, password, name, email);
      toast({ title: "Account created!", description: "Welcome to Oskar Shop." });
      setShowOtpOverlay(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed", description: "Verification failed." });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#7C3AED] overflow-x-hidden page-transition">
      <div className="pt-8 pb-6 sm:pt-24 sm:pb-16 px-6 sm:px-10 shrink-0">
        <Link href="/login" className="inline-flex items-center gap-2 text-white/80 font-bold hover:text-white mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Dib u Noqo
        </Link>
        <h1 className="text-xl sm:text-3xl font-headline font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">
          Iska diwaan geli OskarShop
        </h1>
      </div>

      <div className="flex-1 bg-white rounded-t-[3.5rem] px-6 py-8 sm:p-10 shadow-2xl relative flex flex-col items-center justify-center">
        {(isGlobalLoading || user) && !showOtpOverlay && (
          <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm rounded-t-[3.5rem] flex flex-col items-center justify-center gap-4 text-center p-8">
             <Loader2 className="w-12 h-12 animate-spin text-[#7C3AED]" />
             <p className="text-sm font-bold text-[#7C3AED] animate-pulse">
                {user ? "Authenticating..." : "Loading..."}
             </p>
          </div>
        )}

        <div className="max-w-md w-full">
          <h2 className="text-xl sm:text-3xl font-headline font-bold mb-6 text-gray-900">
            Sameey Account
          </h2>

          {authError && (
            <Alert variant="destructive" className="mb-6 rounded-2xl animate-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Khalad ayaa dhacay</AlertTitle>
              <AlertDescription className="text-xs font-medium">
                {authError}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleInitialSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-widest">Magaca</Label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#7C3AED] z-10">
                  <User className="w-5 h-5" />
                </div>
                <Input 
                  type="text" 
                  placeholder="Geli magacaaga" 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 sm:h-16 pl-14 rounded-full border-gray-200 bg-gray-50 focus:bg-white focus:border-[#7C3AED] text-sm sm:text-base font-bold text-gray-900 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-widest">Email Address</Label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#7C3AED] z-10">
                  <Mail className="w-5 h-5" />
                </div>
                <Input 
                  type="email" 
                  placeholder="Geli email-kaaga" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 sm:h-16 pl-14 rounded-full border-gray-200 bg-gray-50 focus:bg-white focus:border-[#7C3AED] text-sm sm:text-base font-bold text-gray-900 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-widest">Number</Label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10 pointer-events-none">
                  <Smartphone className="w-5 h-5 text-[#7C3AED]" />
                  <span className="font-bold text-gray-400 border-r border-gray-200 pr-2">+252</span>
                </div>
                <Input 
                  type="tel" 
                  placeholder="613982172" 
                  required 
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    const normalized = val.startsWith('0') ? val.substring(1) : val;
                    setPhone(normalized.substring(0, 9));
                  }}
                  className="h-12 sm:h-16 pl-24 rounded-full border-gray-200 bg-gray-50 focus:bg-white focus:border-[#7C3AED] text-sm sm:text-base font-bold text-gray-900 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-widest">Password</Label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#7C3AED] z-10">
                  <Lock className="w-5 h-5" />
                </div>
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password-ka" 
                  required 
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 sm:h-16 pl-14 pr-14 rounded-full border-gray-200 bg-gray-50 focus:bg-white focus:border-[#7C3AED] text-sm sm:text-base font-bold text-gray-900 transition-all"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 p-1"
                >
                  {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-widest">Repeat</Label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#7C3AED] z-10">
                  <Lock className="w-5 h-5" />
                </div>
                <Input 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="Ku celi password-ka" 
                  required 
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 sm:h-16 pl-14 pr-14 rounded-full border-gray-200 bg-gray-50 focus:bg-white focus:border-[#7C3AED] text-sm sm:text-base font-bold text-gray-900 transition-all"
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 p-1"
                >
                  {showConfirmPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting || isGlobalLoading}
              className="w-full h-12 sm:h-16 rounded-full text-base sm:text-lg font-bold bg-[#7C3AED] hover:bg-[#6D28D9] shadow-xl shadow-[#7C3AED]/20 transition-all active:scale-95 text-white mt-2"
            >
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "SAMEEY ACCOUNT"}
            </Button>

            <div className="text-center pt-2 pb-4">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">
                {language === 'so' ? 'Horey ma u lahayd account?' : 'Already have an account?'} <Link href="/login" className="text-[#7C3AED] font-bold hover:underline ml-1">{language === 'so' ? 'Login' : 'Log in'}</Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* OTP Overlay */}
      {showOtpOverlay && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5"><ShieldCheck size={100} /></div>
            
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-[#7C3AED] mx-auto mb-4">
                <Mail size={32} />
              </div>
              <h3 className="text-2xl font-headline font-bold text-gray-900">Xaqiiji Email-ka</h3>
              <p className="text-sm text-gray-500 font-medium">
                Waxaan code u dirnay: <span className="font-bold text-[#7C3AED]">{email}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyAndSignup} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-widest">6-Digit Code</Label>
                <Input 
                  type="text" 
                  placeholder="000000" 
                  required 
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="h-14 text-center text-3xl tracking-[0.5em] rounded-2xl bg-gray-50 border-gray-100 font-black text-gray-900 focus:border-[#7C3AED]"
                />
              </div>

              <Button type="submit" disabled={isVerifying || otpCode.length !== 6} className="w-full h-14 rounded-full bg-[#7C3AED] font-bold text-lg shadow-xl shadow-[#7C3AED]/20">
                {isVerifying ? <Loader2 className="animate-spin" /> : (language === 'so' ? "Xaqiiji" : "Verify & Complete")}
              </Button>

              <button 
                type="button" 
                onClick={() => setShowOtpOverlay(false)} 
                className="w-full text-gray-400 text-xs font-bold hover:text-gray-600 transition-colors"
              >
                Kansal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
