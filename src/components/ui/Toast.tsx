"use client";

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

export interface Toast {
  id: string;
  type: "success" | "warning" | "error" | "info";
  title: string;
  message?: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
}

interface ToastContextValue {
  toast: (toast: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2, 9);
    const newToast: Toast = { ...t, id };
    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (typeof window === "undefined") return null;

  const container = document.createElement("div");
  container.className = "toast-container fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none max-w-sm sm:max-w-md";

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green" />,
    warning: <AlertCircle className="w-5 h-5 text-warning" />,
    error: <AlertCircle className="w-5 h-5 text-danger" />,
    info: <Info className="w-5 h-5 text-green" />,
  };

  const borderColors = {
    success: "border-l-4 border-green",
    warning: "border-l-4 border-warning",
    error: "border-l-4 border-danger",
    info: "border-l-4 border-green",
  };

  return createPortal(
    <div className="toast-container fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none max-w-sm sm:max-w-md">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg bg-white shadow-xl border ${borderColors[t.type]} animate-slide-in`}
          role="alert"
          aria-live="polite"
        >
          <div className="flex-shrink-0 mt-0.5">{icons[t.type]}</div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-ink">{t.title}</p>
            {t.message && <p className="text-sm text-ink-muted mt-1">{t.message}</p>}
            {t.action && (
              <button
                onClick={() => {
                  t.action!.onClick();
                  onDismiss(t.id);
                }}
                className="mt-2 text-sm font-medium text-green hover:underline"
              >
                {t.action.label}
              </button>
            )}
          </div>
          <button
            onClick={() => onDismiss(t.id)}
            className="flex-shrink-0 p-1 text-ink-muted hover:text-ink rounded transition-colors"
            aria-label="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>,
    container
  );
}

// Auto-dismiss hook
export function useAutoDismiss(id: string | undefined, duration = 5000) {
  const { dismiss } = useToast();
  useEffect(() => {
    if (!id) return;
    const timer = setTimeout(() => dismiss(id), duration);
    return () => clearTimeout(timer);
  }, [id, dismiss, duration]);
}