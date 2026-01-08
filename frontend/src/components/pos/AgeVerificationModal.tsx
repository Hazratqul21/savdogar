"use client";

import { useEffect, useRef } from "react";
import { X, CheckCircle, XCircle } from "lucide-react";

interface AgeVerificationModalProps {
  isOpen: boolean;
  onConfirm: (verified: boolean) => void;
  onCancel: () => void;
}

/**
 * Age Verification Modal for Tobacco Sales
 * Required before payment completion (compliance)
 */
export function AgeVerificationModal({
  isOpen,
  onConfirm,
  onCancel,
}: AgeVerificationModalProps) {
  const yesButtonRef = useRef<HTMLButtonElement>(null);
  const noButtonRef = useRef<HTMLButtonElement>(null);

  // Keyboard shortcuts: Enter = Yes, Esc = Cancel
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onConfirm(true);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      } else if (e.key === "y" || e.key === "Y") {
        e.preventDefault();
        onConfirm(true);
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        onConfirm(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    
    // Auto-focus Yes button
    setTimeout(() => yesButtonRef.current?.focus(), 100);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Yosh Tekshiruvi
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Yopish"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-red-50 rounded-full p-4">
              <XCircle size={48} className="text-red-600" />
            </div>
          </div>
          <p className="text-lg text-gray-700 text-center mb-2">
            Mijoz <strong>20 yoshdan katta</strong> ekanligini tasdiqlaysizmi?
          </p>
          <p className="text-sm text-gray-500 text-center">
            Tamaki mahsulotlarini faqat 20+ yoshli mijozlarga sotish mumkin
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            ref={noButtonRef}
            onClick={() => onConfirm(false)}
            className="flex-1 px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-lg flex items-center justify-center gap-2"
          >
            <XCircle size={24} />
            Yo'q (Esc)
          </button>
          <button
            ref={yesButtonRef}
            onClick={() => onConfirm(true)}
            className="flex-1 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg flex items-center justify-center gap-2"
            autoFocus
          >
            <CheckCircle size={24} />
            Ha (Enter)
          </button>
        </div>

        {/* Keyboard hint */}
        <p className="text-xs text-gray-400 text-center mt-4">
          Enter = Ha | Esc = Bekor qilish
        </p>
      </div>
    </div>
  );
}
