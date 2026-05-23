"use client"

import * as React from "react"

/**
 * High-Fidelity Toast State Manager
 * Handles the creation, lifecycle, and auto-dismissal of notifications.
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
  return count.toString();
}

const listeners: Array<(state: Toast[]) => void> = [];
let memoryState: Toast[] = [];

function dispatch(action: ToastAction) {
  switch (action.type) {
    case 'ADD_TOAST':
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
  listeners.forEach((listener) => listener(memoryState));
}

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'warning' | 'success';
}

export function toast({ title, description, variant = 'default' }: ToastOptions) {
  const id = genId();

  // Map shadcn variants to our semantic types
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

  // Auto dismiss logic
  setTimeout(() => {
    dispatch({ type: 'DISMISS_TOAST', id });
    setTimeout(() => {
      dispatch({ type: 'REMOVE_TOAST', id });
    }, 400); // Wait for exit animation
  }, TOAST_DURATION);

  return {
    id,
    dismiss: () => dispatch({ type: 'DISMISS_TOAST', id }),
  };
}

export function useToast() {
  const [state, setState] = React.useState<Toast[]>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, [state]);

  return {
    toasts: state,
    toast,
    dismiss: (id: string) => dispatch({ type: 'DISMISS_TOAST', id }),
  };
}
