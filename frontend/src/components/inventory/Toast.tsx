"use client";

import { useEffect } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export function ToastComponent({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 5000); // Auto-close after 5 seconds

    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const bgColor =
    toast.type === "success"
      ? "bg-green-50 border-green-200 text-green-800"
      : toast.type === "error"
      ? "bg-red-50 border-red-200 text-red-800"
      : "bg-blue-50 border-blue-200 text-blue-800";

  const iconColor =
    toast.type === "success"
      ? "text-green-600"
      : toast.type === "error"
      ? "text-red-600"
      : "text-blue-600";

  const Icon = toast.type === "success" ? CheckCircle : XCircle;

  return (
    <div
      className={`${bgColor} border rounded-lg p-4 shadow-lg flex items-center gap-3 min-w-[300px] max-w-md`}
    >
      <Icon size={20} className={iconColor} />
      <p className="flex-1 font-medium">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className={`${iconColor} hover:opacity-70 transition-opacity`}
        aria-label="Yopish"
      >
        <X size={18} />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}
