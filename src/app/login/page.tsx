
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Mail, Lock, EyeOff, Eye, Loader2, AlertCircle, Key, ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type AuthMode = 'login' | 'forgot-request' | 'forgot-verify';

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // OTP Reset State
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const { login, loginWithGoogle, requestPasswordResetCode, verifyAndResetPassword, user, isGlobalLoading, authError, t } = useApp();
  const router = useRouter();

  // Instant Auth Check
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
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Please check your credentials.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const success = await requestPasswordResetCode(email);
    if (success) setMode('forgot-verify');
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || !newPassword) return;
    const success = await verifyAndResetPassword(email, otpCode, newPassword);
    if (success) {
      setMode('login');
      setOtpCode("");
      setNewPassword("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#7C3AED] overflow-x-hidden page-transition">
      <div className="pt-10 pb-6 sm:pt-24 sm:pb-16 px-6 sm:px-10 shrink-0">
        <h1 className="text-3xl sm:text-4xl font-headline font-bold text-white leading-tight">
          {mode === 'login' ? "Welcome to Oskar Shop" : "Reset Your Password"}
        </h1>
        <p className="text-xl sm:text-2xl font-headline text-white/80 mt-2 font-medium">
          {mode === 'login' ? "Login?" : "Authentication Protocol"}
        </p>
      </div>

      <div className="flex-1 bg-white rounded-t-[3rem] sm:rounded-t-[3.5rem] p-6 sm:p-10 shadow-2xl relative">
        {/* Authorizing Overlay for Redirect Results */}
        {(isGlobalLoading || user) && (
          <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm rounded-t-[3rem] sm:rounded-t-[3.5rem] flex flex-col items-center justify-center gap-4 text-center p-8">
             <Loader2 className="w-12 h-12 animate-spin text-[#7C3AED]" />
             <p className="text-sm font-bold text-[#7C3AED] animate-pulse">
                {user ? "Authorizing access..." : "Synchronizing..."}
             </p>
          </div>
        )}

        <div className="max-w-md mx-auto h-full flex flex-col">
          {/* Error Banner */}
          {authError && (
            <Alert variant="destructive" className="mb-6 rounded-2xl animate-in slide-in-from-top-2 border-2 shadow-lg">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle className="font-bold">Error Detected</AlertTitle>
              <AlertDescription className="text-xs font-medium">
                {authError}
              </AlertDescription>
            </Alert>
          )}

          {mode === 'login' && (
            <div className="space-y-6">
              <h2 className="text-2xl sm:text-3xl font-headline font-bold text-gray-900">
                Log In
              </h2>
              <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#7C3AED] z-10">
                    <Mail className="w-5 h-5" />
                  </div>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Email address" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 sm:h-16 pl-14 rounded-full border-gray-200 bg-gray-50 focus:bg-white focus:border-[#7C3AED] focus-visible:ring-[#7C3AED] text-sm sm:text-base font-bold text-gray-900"
                  />
                </div>

                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#7C3AED] z-10">
                    <Lock className="w-5 h-5" />
                  </div>
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Enter Password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 sm:h-16 pl-14 pr-14 rounded-full border-gray-200 bg-gray-50 focus:bg-white focus:border-[#7C3AED] focus-visible:ring-[#7C3AED] text-sm sm:text-base font-bold text-gray-900"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#7C3AED] transition-colors p-1"
                  >
                    {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                </div>

                <div className="text-right">
                  <button 
                    type="button"
                    onClick={() => setMode('forgot-request')}
                    className="text-blue-600 text-xs sm:text-sm font-bold hover:underline"
                  >
                    {t('forgot_password')}
                  </button>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting || isGlobalLoading}
                  className="w-full h-14 sm:h-16 rounded-full text-base sm:text-lg font-bold bg-[#7C3AED] hover:bg-[#6D28D9] shadow-xl shadow-[#7C3AED]/20"
                >
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "LOG IN"}
                </Button>

                <div className="relative py-1 sm:py-4">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-100" /></div>
                  <div className="relative flex justify-center text-[10px] sm:text-xs uppercase"><span className="bg-white px-2 text-gray-400 font-black tracking-widest">Or login with</span></div>
                </div>

                <Button 
                  type="button"
                  variant="outline"
                  onClick={loginWithGoogle}
                  disabled={isGlobalLoading}
                  className="w-full h-14 sm:h-16 rounded-full text-sm sm:text-base font-bold flex items-center justify-center gap-3 border-gray-200 hover:bg-gray-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.61z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>

                <div className="text-center pt-2 pb-6">
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">
                    Don't have an account? <Link href="/signup" className="text-[#7C3AED] font-bold hover:underline ml-1">Sign Up</Link>
                  </p>
                </div>
              </form>
            </div>
          )}

          {mode === 'forgot-request' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <button onClick={() => setMode('login')} className="flex items-center gap-2 text-[#7C3AED] font-bold text-sm">
                <ArrowLeft size={16} /> Back to Login
              </button>
              <div className="space-y-4">
                <h2 className="text-2xl sm:text-3xl font-headline font-bold text-gray-900">Request Reset Code</h2>
                <p className="text-sm text-muted-foreground">Enter your registered email address. We'll send a 6-digit verification code to your Gmail inbox.</p>
              </div>
              <form onSubmit={handleSendCode} className="space-y-6">
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-[#7C3AED] w-5 h-5 z-10" />
                  <Input 
                    type="email" 
                    placeholder="Email address" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 sm:h-16 pl-14 rounded-full border-gray-200 bg-gray-50 focus:bg-white font-bold"
                  />
                </div>
                <Button type="submit" disabled={isGlobalLoading} className="w-full h-14 sm:h-16 rounded-full bg-[#7C3AED] font-bold text-lg shadow-xl shadow-[#7C3AED]/20">
                  {isGlobalLoading ? <Loader2 className="animate-spin" /> : "Send Verification Code"}
                </Button>
              </form>
            </div>
          )}

          {mode === 'forgot-verify' && (
            <div className="space-y-8 animate-in zoom-in-95 duration-300">
              <div className="space-y-4">
                <h2 className="text-2xl sm:text-3xl font-headline font-bold text-gray-900">Verify & Reset</h2>
                <p className="text-sm text-muted-foreground">Check your inbox. We've sent a 6-digit code to <span className="font-bold text-gray-900">{email}</span>.</p>
              </div>
              <form onSubmit={handleVerifyAndReset} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-5 tracking-widest">6-Digit OTP Code</Label>
                  <div className="relative">
                    <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-[#7C3AED] w-5 h-5 z-10" />
                    <Input 
                      placeholder="e.g. 123456" 
                      required 
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="h-14 sm:h-16 pl-14 rounded-full border-gray-200 bg-gray-50 focus:bg-white font-mono text-2xl tracking-[0.6em] font-black"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-5 tracking-widest">Create New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-[#7C3AED] w-5 h-5 z-10" />
                    <Input 
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 6 characters" 
                      required 
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-14 sm:h-16 pl-14 rounded-full border-gray-200 bg-gray-50 focus:bg-white font-bold"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isGlobalLoading} className="w-full h-14 sm:h-16 rounded-full bg-green-600 hover:bg-green-700 font-bold text-lg shadow-xl shadow-green-600/20">
                  {isGlobalLoading ? <Loader2 className="animate-spin" /> : <><CheckCircle2 className="mr-2" /> Confirm New Password</>}
                </Button>

                <button type="button" onClick={() => setMode('forgot-request')} className="w-full text-gray-400 text-xs font-bold hover:text-gray-600">
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
