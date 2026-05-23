"use client"

import * as React from "react"

/**
 * High-Fidelity Toast State Manager
 * Handles the creation, de-duplication, and automatic lifecycle of notifications.
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  type: ToastType;
  open: boolean;
}

type ToastAction = 
  | { type: 'ADD_TOAST'; toast: Toast }
  | { type: 'REMOVE_TOAST'; id: string }
  | { type: 'DISMISS_TOAST'; id: string };

const TOAST_LIMIT = 3;
const TOAST_DURATION = 3000;

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return `toast-${count}-${Date.now()}`;
}

const listeners: Array<(state: Toast[]) => void> = [];
let memoryState: Toast[] = [];

/**
 * Global Dispatcher
 * Controls the internal state of all active toasts.
 */
function dispatch(action: ToastAction) {
  switch (action.type) {
    case 'ADD_TOAST':
      // ANTI-DUPLICATION: Check if exactly the same toast is already active
      const isDuplicate = memoryState.some(
        (t) => t.title === action.toast.title && t.description === action.toast.description && t.open
      );
      
      if (isDuplicate) return;

      memoryState = [action.toast, ...memoryState].slice(0, TOAST_LIMIT);
      break;
      
    case 'DISMISS_TOAST':
      memoryState = memoryState.map((t) =>
        t.id === action.id ? { ...t, open: false } : t
      );
      break;
      
    case 'REMOVE_TOAST':
      memoryState = memoryState.filter((t) => t.id !== action.id);
      break;
  }
  
  // Notify all subscribed useToast hooks
  listeners.forEach((listener) => listener([...memoryState]));
}

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'warning' | 'success';
}

/**
 * Primary Toast Trigger
 * Can be called from anywhere (even outside React components).
 */
export function toast({ title, description, variant = 'default' }: ToastOptions) {
  const id = genId();

  // Map semantic types
  let type: ToastType = 'success';
  if (variant === 'destructive') type = 'error';
  else if (variant === 'warning') type = 'warning';
  else if (variant === 'default' && (title?.toLowerCase().includes('fail') || title?.toLowerCase().includes('error'))) type = 'error';

  const newToast: Toast = {
    id,
    title,
    description,
    type,
    open: true,
  };

  dispatch({ type: 'ADD_TOAST', toast: newToast });

  // Auto-dismiss logic
  const dismissTimer = setTimeout(() => {
    dispatch({ type: 'DISMISS_TOAST', id });
    
    // Physical removal from DOM after animation completes
    setTimeout(() => {
      dispatch({ type: 'REMOVE_TOAST', id });
    }, 500); 
  }, TOAST_DURATION);

  return {
    id,
    dismiss: () => {
      clearTimeout(dismissTimer);
      dispatch({ type: 'DISMISS_TOAST', id });
      setTimeout(() => {
        dispatch({ type: 'REMOVE_TOAST', id });
      }, 500);
    },
  };
}

/**
 * useToast Hook
 * Connects React components to the global toast dispatcher.
 */
export function useToast() {
  const [state, setState] = React.useState<Toast[]>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return {
    toasts: state,
    toast,
    dismiss: (id: string) => dispatch({ type: 'DISMISS_TOAST', id }),
  };
}
