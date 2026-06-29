"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Mail, Key, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Smartphone, ShieldCheck } from "lucide-react";
import Link from "next/link";
import emailjs from '@emailjs/browser';
import { toast } from "@/hooks/use-toast";
import { 
  EMAILJS_SERVICE_ID, 
  EMAILJS_TEMPLATE_ID, 
  EMAILJS_PUBLIC_KEY 
} from "@/lib/emailjs-config";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { storeSettings } = useApp();
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [phone, setPhone] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // EmailJS Recovery Config Override
  const recoveryConfig = storeSettings.emailjs || {
    serviceId: EMAILJS_SERVICE_ID,
    templateId: EMAILJS_TEMPLATE_ID,
    publicKey: EMAILJS_PUBLIC_KEY
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const fullPhone = `252${phone.replace(/\D/g, "")}`;
      
      const res = await fetch('/api/generate-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, type: 'reset' }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message);
        setIsLoading(false);
        return;
      }

      setTargetEmail(data.targetEmail);

      // Send OTP via EmailJS (Using Recovery Template)
      await emailjs.send(
        recoveryConfig.serviceId,
        recoveryConfig.templateId,
        {
          from_email: 'no-reply@oskarshop.so',
          to_email: data.targetEmail,
          otp_code: data.otp,
        },
        recoveryConfig.publicKey
      );

      toast({ title: "Code Sent!", description: `Check your email: ${data.targetEmail}` });
      setStep('verify');
    } catch (err: any) {
      console.error('Request OTP Error:', err);
      setError("Wuu ku guul darraystay (Bad Sender Syntax)");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setError("OTP must be 6 digits."); return; }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: targetEmail, 
          otp, 
          newPassword, 
          isReset: true 
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message);
        setIsLoading(false);
        return;
      }

      toast({ title: "Success!", description: "Password updated. Redirecting..." });
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      console.error('Verify OTP Error:', err);
      setError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#7C3AED] items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-headline font-bold text-white uppercase tracking-tight">Oskar Shop</h1>
          <p className="text-white/60 font-bold uppercase text-[10px] tracking-widest mt-1">Recovery Protocol</p>
        </div>

        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white p-6 sm:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5"><Key size={80} /></div>

          {step === 'request' ? (
            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <h2 className="text-2xl font-headline font-bold text-gray-900">Forgot Password?</h2>
                <p className="text-sm text-gray-500 font-medium">Enter your number and we'll send a verification code to your registered email.</p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-xs font-bold animate-in fade-in slide-in-from-top-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" /> 
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-widest">Numbarkaaga</Label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10 pointer-events-none">
                      <Smartphone className="w-4 h-4 text-[#7C3AED]" />
                      <span className="font-bold text-xs text-gray-400 border-r border-gray-200 pr-2">+252</span>
                    </div>
                    <Input 
                      type="tel" 
                      placeholder="613982172" 
                      required 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').substring(0, 9))}
                      className="h-14 pl-24 rounded-full bg-gray-50 border-gray-100 focus:border-[#7C3AED] font-bold"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full h-14 rounded-full bg-[#7C3AED] font-bold text-lg shadow-xl shadow-[#7C3AED]/20">
                  {isLoading ? <Loader2 className="animate-spin" /> : "Send Code to Email"}
                </Button>

                <Link href="/login" className="flex items-center justify-center gap-2 text-[#7C3AED] text-sm font-bold mt-4">
                  <ArrowLeft size={16} /> Back to Login
                </Link>
              </form>
            </div>
          ) : (
            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <h2 className="text-2xl font-headline font-bold text-gray-900">Verify Code</h2>
                <p className="text-sm text-gray-500 font-medium">We sent a 6-digit code to <span className="font-bold text-[#7C3AED] truncate max-w-[200px] inline-block align-bottom">{targetEmail}</span></p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-xs font-bold animate-in fade-in slide-in-from-top-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" /> 
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

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
                    placeholder="Ugu yaraan 8 xaraf" 
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
                    placeholder="Ku celi password-ka" 
                    required 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-14 px-6 rounded-full bg-gray-50 border-gray-100 font-bold"
                  />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full h-14 rounded-full bg-green-600 hover:bg-green-700 font-bold text-lg shadow-xl shadow-green-600/20 uppercase tracking-widest">
                  {isLoading ? <Loader2 className="animate-spin" /> : <><ShieldCheck className="mr-2" /> Reset Password</>}
                </Button>

                <button type="button" onClick={() => setStep('request')} className="w-full text-gray-400 text-xs font-bold hover:text-gray-600">
                  Resend code to email
                </button>
              </form>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
