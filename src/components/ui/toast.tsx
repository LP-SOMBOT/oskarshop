"use client"

import * as React from "react"
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { type Toast as ToastType } from "@/hooks/use-toast"

/**
 * Individual Toast Component
 * Features semantic icons and color schemes for Success, Error, and Warning.
 */

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

export const Toast = ({ toast, onDismiss }: ToastProps) => {
  const { id, title, description, type, open } = toast;

  const styles = {
    success: {
      container: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/30",
      icon: "text-green-600 dark:text-green-400",
      IconComponent: CheckCircle2,
    },
    error: {
      container: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/30",
      icon: "text-red-600 dark:text-red-400",
      IconComponent: XCircle,
    },
    warning: {
      container: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/30",
      icon: "text-amber-600 dark:text-amber-400",
      IconComponent: AlertTriangle,
    },
    info: {
      container: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/30",
      icon: "text-blue-600 dark:text-blue-400",
      IconComponent: Info,
    }
  }[type];

  const Icon = styles.IconComponent;

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-center gap-4 overflow-hidden rounded-[1.5rem] border p-4 shadow-2xl transition-all duration-300 transform",
        styles.container,
        open 
          ? "animate-in slide-in-from-top-8 fade-in opacity-100 translate-y-0" 
          : "animate-out fade-out opacity-0 -translate-y-4 scale-95"
      )}
    >
      <div className={cn("shrink-0", styles.icon)}>
        <Icon size={24} />
      </div>
      
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight uppercase tracking-tight">
            {title}
          </h3>
        )}
        {description && (
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
            {description}
          </p>
        )}
      </div>

      <button
        onClick={() => onDismiss(id)}
        className="shrink-0 p-1 rounded-full text-slate-300 hover:text-slate-500 dark:hover:text-slate-200 hover:bg-black/5 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  )
}
