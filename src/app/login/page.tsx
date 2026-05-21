
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Mail, Lock, EyeOff, Eye, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  
  const { login, forgotPassword, t } = useApp();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
      router.push('/');
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

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    await forgotPassword(forgotEmail);
    setIsForgotModalOpen(false);
    setForgotEmail("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#7C3AED] overflow-x-hidden page-transition">
      <div className="pt-24 pb-16 px-10 shrink-0">
        <h1 className="text-4xl font-headline font-bold text-white leading-tight">
          Welcome to <br /> Oskar Shop
        </h1>
        <p className="text-2xl font-headline text-white/80 mt-2 font-medium">
          Login?
        </p>
      </div>

      <div className="flex-1 bg-white rounded-t-[3.5rem] p-10 shadow-2xl">
        <div className="max-w-md mx-auto h-full flex flex-col">
          <h2 className="text-3xl font-headline font-bold mb-10 text-gray-900">
            Login
          </h2>

          <form onSubmit={handleLogin} className="space-y-6">
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
                className="h-16 pl-14 rounded-full border-gray-200 bg-gray-50 focus:bg-white focus:border-[#7C3AED] focus-visible:ring-[#7C3AED] text-base font-bold text-gray-900 placeholder:text-gray-400 transition-all"
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
                className="h-16 pl-14 pr-14 rounded-full border-gray-200 bg-gray-50 focus:bg-white focus:border-[#7C3AED] focus-visible:ring-[#7C3AED] text-base font-bold text-gray-900 placeholder:text-gray-400 transition-all"
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
                onClick={() => {
                  setForgotEmail(email); // Autofill from login field if present
                  setIsForgotModalOpen(true);
                }}
                className="text-blue-600 text-sm font-bold hover:underline"
              >
                {t('forgot_password')}
              </button>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full h-16 rounded-full text-lg font-bold bg-[#7C3AED] hover:bg-[#6D28D9] shadow-xl shadow-[#7C3AED]/20 transition-all active:scale-95 text-white"
            >
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "LOG IN"}
            </Button>

            <div className="text-center pt-8">
              <p className="text-sm text-gray-500 font-medium">
                Don't have an account? <Link href="/signup" className="text-[#7C3AED] font-bold hover:underline ml-1">Sign Up</Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Dialog open={isForgotModalOpen} onOpenChange={setIsForgotModalOpen}>
        <DialogContent className="max-w-sm rounded-[2.5rem] p-8 border-none shadow-2xl bg-white text-center">
          <DialogHeader>
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-4">
               <Mail size={32} />
            </div>
            <DialogTitle className="text-2xl font-headline font-bold text-gray-900">
               {t('reset_password')}
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-sm mt-2">
               {t('enter_reset_email')}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleForgotSubmit} className="mt-6 space-y-4">
            <Input 
              type="email" 
              placeholder="Email address" 
              required 
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              className="h-14 rounded-full border-gray-100 bg-gray-50 px-6 font-bold"
            />
            <Button 
              type="submit" 
              className="w-full h-14 rounded-full font-bold bg-[#7C3AED] hover:bg-[#6D28D9] shadow-lg shadow-[#7C3AED]/20"
            >
              {t('reset_password')}
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setIsForgotModalOpen(false)}
              className="w-full text-gray-400 font-bold"
            >
              Cancel
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
