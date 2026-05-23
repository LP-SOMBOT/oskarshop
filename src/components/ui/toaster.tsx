"use client"

import { useToast } from "@/hooks/use-toast"
import { Toast } from "./toast"

/**
 * Toaster Container
 * Positions notifications at Top-Right on Desktop and Top-Center on Mobile.
 */

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[100006] pointer-events-none flex flex-col items-center sm:items-end p-4 sm:p-6 gap-3 sm:max-w-md sm:ml-auto"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>
  )
}
