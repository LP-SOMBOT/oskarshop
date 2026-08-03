"use client";

import { useState, useEffect, useRef } from "react";
import { useApp } from "@/lib/context";
import { 
  Send, 
  Image as ImageIcon, 
  ArrowLeft, 
  Loader2, 
  X,
  User,
  MessageCircle,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function ChatView() {
  const { messages, sendMessage, user, storeSettings, setActiveTab, markMessagesAsRead } = useApp();
  const [inputText, setInputText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    markMessagesAsRead();
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, markMessagesAsRead]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText("");
    await sendMessage(text);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('image', file);
      
      try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=0ac8fec95369164cc41b3474e29b2848`, {
          method: 'POST',
          body: formData,
        });
        
        const result = await response.json();
        if (result.success) {
          await sendMessage(undefined, result.data.url);
          toast({ title: "Screenshot Sent" });
        }
      } catch (error) {
        toast({ title: "Upload Failed", variant: "destructive" });
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-white flex flex-col page-transition">
      {/* Chat Header */}
      <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setActiveTab('home')}>
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 overflow-hidden rounded-full bg-primary/10 border border-primary/20">
              {storeSettings.logo ? (
                <Image src={storeSettings.logo} alt="Oskar Shop" fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary font-bold">O</div>
              )}
            </div>
            <div>
              <h2 className="font-headline font-bold text-base leading-none">Oskar Support</h2>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Always Online</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
              <MessageCircle className="w-10 h-10" />
            </div>
            <p className="text-sm font-medium max-w-[200px]">How can we help you today? Send us a message!</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isOwn = msg.senderId === user?.uid;
          return (
            <div key={i} className={cn(
              "flex flex-col max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300",
              isOwn ? "ml-auto items-end" : "mr-auto items-start"
            )}>
              <div className={cn(
                "rounded-2xl p-3 shadow-sm",
                isOwn 
                  ? "bg-primary text-white rounded-br-none" 
                  : "bg-white text-gray-900 border border-gray-100 rounded-bl-none"
              )}>
                {msg.imageUrl ? (
                  <div className="relative w-48 aspect-video rounded-lg overflow-hidden mb-2">
                    <Image src={msg.imageUrl} alt="Attached" fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1 px-1">
                 <Clock className="w-2.5 h-2.5 text-gray-400" />
                 <span className="text-[9px] font-bold text-gray-400 uppercase">
                    {msg.timestamp ? format(new Date(msg.timestamp), 'HH:mm') : '...'}
                 </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-3 shrink-0 pb-8">
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-primary transition-colors disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-6 h-6" />}
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
          accept="image/*" 
        />
        <div className="flex-1 relative">
          <Input 
            className="h-12 rounded-2xl bg-gray-50 border-none px-4 text-sm font-medium focus-visible:ring-primary"
            placeholder="Type message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
        </div>
        <Button 
          size="icon" 
          onClick={handleSend}
          className="w-12 h-12 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 active:scale-90 transition-transform"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
