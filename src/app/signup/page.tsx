"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { User, Lock, Mail, Phone, Loader2, ArrowLeft, Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * @fileOverview Signup Page with Somali language default and responsive UI.
 */

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup, user, isGlobalLoading, authError } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signup(email, password, name, phone);
      toast({
        title: "Account-ka waa la sameeyey!",
        description: "Ku soo dhawoow Oskar Shop.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Wuu ku guul darraystay",
        description: error.message || "Waxbaa khaldamay.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#7C3AED] overflow-x-hidden page-transition">
      <div className="pt-8 pb-4 sm:pt-16 sm:pb-12 px-6 sm:px-10 shrink-0">
        <Link href="/login" className="inline-flex items-center gap-2 text-white/80 font-bold hover:text-white mb-4 sm:mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Dib u Noqo
        </Link>
        <h1 className="text-3xl sm:text-4xl font-headline font-bold text-white leading-tight mt-1 sm:mt-6">
          Ku soo biir <br /> Oskar Shop
        </h1>
        <p className="text-xl sm:text-2xl font-headline text-white/80 mt-1 font-medium">
          Is diwaangeli
        </p>
      </div>

      <div className="flex-1 bg-white rounded-t-[3rem] sm:rounded-t-[3.5rem] p-6 sm:p-10 shadow-2xl relative">
        {(isGlobalLoading || user) && (
          <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm rounded-t-[3rem] sm:rounded-t-[3.5rem] flex flex-col items-center justify-center gap-4 text-center p-8">
             <Loader2 className="w-12 h-12 animate-spin text-[#7C3AED]" />
             <p className="text-sm font-bold text-[#7C3AED] animate-pulse">
                {user ? "Xaqiijinta galitaanka..." : "Isku xirka..."}
             </p>
          </div>
        )}

        <div className="max-w-md mx-auto h-full flex flex-col">
          <h2 className="text-2xl sm:text-3xl font-headline font-bold mb-6 sm:mb-8 text-gray-900">
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

          <form onSubmit={handleSignup} className="space-y-4 sm:space-y-5">
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#7C3AED] z-10">
                <User className="w-5 h-5" />
              </div>
              <Input 
                id="name" 
                type="text" 
                placeholder="Magacaaga oo buuxa" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-14 sm:h-16 pl-14 rounded-full border-gray-200 bg-gray-50 focus:bg-white focus:border-[#7C3AED] focus-visible:ring-[#7C3AED] text-sm sm:text-base font-bold text-gray-900 placeholder:text-gray-400 transition-all"
              />
            </div>

            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#7C3AED] z-10">
                <Mail className="w-5 h-5" />
              </div>
              <Input 
                id="email" 
                type="email" 
                placeholder="Email-kaaga" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 sm:h-16 pl-14 rounded-full border-gray-200 bg-gray-50 focus:bg-white focus:border-[#7C3AED] focus-visible:ring-[#7C3AED] text-sm sm:text-base font-bold text-gray-900 placeholder:text-gray-400 transition-all"
              />
            </div>

            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#7C3AED] z-10">
                <Phone className="w-5 h-5" />
              </div>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="Lambarkaaga" 
                required 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-14 sm:h-16 pl-14 rounded-full border-gray-200 bg-gray-50 focus:bg-white focus:border-[#7C3AED] focus-visible:ring-[#7C3AED] text-sm sm:text-base font-bold text-gray-900 placeholder:text-gray-400 transition-all"
              />
            </div>

            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#7C3AED] z-10">
                <Lock className="w-5 h-5" />
              </div>
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                placeholder="Password-ka (ugu yaraan 6 xaraf)" 
                required 
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 sm:h-16 pl-14 pr-14 rounded-full border-gray-200 bg-gray-50 focus:bg-white focus:border-[#7C3AED] focus-visible:ring-[#7C3AED] text-sm sm:text-base font-bold text-gray-900 placeholder:text-gray-400 transition-all"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#7C3AED] transition-colors p-1"
              >
                {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting || isGlobalLoading}
              className="w-full h-14 sm:h-16 rounded-full text-base sm:text-lg font-bold bg-[#7C3AED] hover:bg-[#6D28D9] shadow-xl shadow-[#7C3AED]/20 transition-all active:scale-95 text-white mt-1"
            >
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "SAMEEY ACCOUNT"}
            </Button>

            <div className="text-center pt-2 pb-10">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">
                Horey ma u lahayd account? <Link href="/login" className="text-[#7C3AED] font-bold hover:underline ml-1">Soo gal</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}