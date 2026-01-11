"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
    Clock,
    PlayCircle,
    StopCircle,
    DollarSign,
    CreditCard,
    Banknote,
    TrendingUp,
    TrendingDown,
    Loader2,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    FileText,
    ArrowDownCircle,
    ArrowUpCircle,
    X,
    Printer
} from "lucide-react";
import { getAuthHeaders, getApiBaseUrl } from "@/lib/api";

// Toast component
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100]"
        >
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border ${
                type === 'success' ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
            }`}>
                {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                <span className="font-medium text-sm">{message}</span>
            </div>
        </motion.div>
    );
}

// API functions
const apiUrl = () => getApiBaseUrl();

async function getActiveShift() {
    const response = await fetch(`${apiUrl()}/api/v1/shifts/active`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch active shift");
    return response.json();
}

async function openShift(data: { opening_cash: number; notes?: string }) {
    const response = await fetch(`${apiUrl()}/api/v1/shifts/open`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || "Smenani ochishda xatolik");
    }
    return response.json();
}

async function closeShift(data: { actual_cash: number; notes?: string }) {
    const response = await fetch(`${apiUrl()}/api/v1/shifts/close`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || "Smenani yopishda xatolik");
    }
    return response.json();
}

async function createCashMovement(data: { movement_type: string; amount: number; reason?: string }) {
    const response = await fetch(`${apiUrl()}/api/v1/shifts/cash-movement`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || "Xatolik");
    }
    return response.json();
}

async function getShiftHistory() {
    const response = await fetch(`${apiUrl()}/api/v1/shifts/history?limit=20`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch shift history");
    return response.json();
}

// Format currency
function formatCurrency(value: number): string {
    return value.toLocaleString('uz-UZ') + " so'm";
}

// Format duration
function formatDuration(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h} soat ${m} daqiqa`;
}

export default function ShiftPage() {
    const queryClient = useQueryClient();
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    // Modals
    const [showOpenModal, setShowOpenModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [showCashMovementModal, setShowCashMovementModal] = useState(false);
    const [showZReport, setShowZReport] = useState(false);
    const [zReportData, setZReportData] = useState<any>(null);
    
    // Form states
    const [openingCash, setOpeningCash] = useState("");
    const [openingNotes, setOpeningNotes] = useState("");
    const [actualCash, setActualCash] = useState("");
    const [closingNotes, setClosingNotes] = useState("");
    const [movementType, setMovementType] = useState<"in" | "out">("out");
    const [movementAmount, setMovementAmount] = useState("");
    const [movementReason, setMovementReason] = useState("");

    // Fetch active shift
    const { data: activeShift, isLoading: shiftLoading, refetch: refetchShift } = useQuery({
        queryKey: ["active-shift"],
        queryFn: getActiveShift,
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    // Fetch shift history
    const { data: shiftHistory = [] } = useQuery({
        queryKey: ["shift-history"],
        queryFn: getShiftHistory,
    });

    // Open shift mutation
    const openMutation = useMutation({
        mutationFn: openShift,
        onSuccess: () => {
            setToast({ message: "Smena ochildi ✓", type: "success" });
            setShowOpenModal(false);
            setOpeningCash("");
            setOpeningNotes("");
            queryClient.invalidateQueries({ queryKey: ["active-shift"] });
            queryClient.invalidateQueries({ queryKey: ["shift-history"] });
        },
        onError: (error: Error) => {
            setToast({ message: error.message, type: "error" });
        },
    });

    // Close shift mutation
    const closeMutation = useMutation({
        mutationFn: closeShift,
        onSuccess: (data) => {
            setToast({ message: "Smena yopildi ✓", type: "success" });
            setShowCloseModal(false);
            setActualCash("");
            setClosingNotes("");
            setZReportData(data);
            setShowZReport(true);
            queryClient.invalidateQueries({ queryKey: ["active-shift"] });
            queryClient.invalidateQueries({ queryKey: ["shift-history"] });
        },
        onError: (error: Error) => {
            setToast({ message: error.message, type: "error" });
        },
    });

    // Cash movement mutation
    const movementMutation = useMutation({
        mutationFn: createCashMovement,
        onSuccess: () => {
            setToast({ message: movementType === "out" ? "Inkassatsiya qilindi ✓" : "Pul qo'shildi ✓", type: "success" });
            setShowCashMovementModal(false);
            setMovementAmount("");
            setMovementReason("");
            refetchShift();
        },
        onError: (error: Error) => {
            setToast({ message: error.message, type: "error" });
        },
    });

    const handleOpenShift = () => {
        const cash = parseFloat(openingCash) || 0;
        openMutation.mutate({ opening_cash: cash, notes: openingNotes || undefined });
    };

    const handleCloseShift = () => {
        const cash = parseFloat(actualCash) || 0;
        closeMutation.mutate({ actual_cash: cash, notes: closingNotes || undefined });
    };

    const handleCashMovement = () => {
        const amount = parseFloat(movementAmount) || 0;
        if (amount <= 0) {
            setToast({ message: "Summa kiriting", type: "error" });
            return;
        }
        movementMutation.mutate({
            movement_type: movementType,
            amount,
            reason: movementReason || undefined,
        });
    };

    const hasActiveShift = activeShift?.has_active_shift;

    return (
        <div className="space-y-6">
            {/* Toast */}
            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Smena boshqaruvi</h1>
                    <p className="text-gray-500 text-sm mt-1">Kassa smenasi va Z-Report</p>
                </div>
            </div>

            {shiftLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : (
                <>
                    {/* Active Shift Status */}
                    <div className={`p-6 rounded-2xl border-2 ${
                        hasActiveShift 
                            ? "bg-green-50 border-green-200" 
                            : "bg-gray-50 border-gray-200"
                    }`}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${
                                    hasActiveShift ? "bg-green-100" : "bg-gray-200"
                                }`}>
                                    <Clock className={`w-8 h-8 ${
                                        hasActiveShift ? "text-green-600" : "text-gray-500"
                                    }`} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        {hasActiveShift ? "Smena ochiq" : "Smena yopiq"}
                                    </h2>
                                    {hasActiveShift && (
                                        <p className="text-sm text-gray-600">
                                            Boshlangan: {new Date(activeShift.opened_at).toLocaleString('uz-UZ')}
                                        </p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                {hasActiveShift ? (
                                    <>
                                        <button
                                            onClick={() => setShowCashMovementModal(true)}
                                            className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                                        >
                                            <ArrowDownCircle className="w-4 h-4" />
                                            Inkassatsiya
                                        </button>
                                        <button
                                            onClick={() => setShowCloseModal(true)}
                                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                        >
                                            <StopCircle className="w-4 h-4" />
                                            Smenani yopish
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setShowOpenModal(true)}
                                        className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                                    >
                                        <PlayCircle className="w-5 h-5" />
                                        Smenani ochish
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Active Shift Stats */}
                        {hasActiveShift && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                                <div className="bg-white p-4 rounded-xl">
                                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                        <Banknote className="w-4 h-4" />
                                        Boshlang'ich
                                    </div>
                                    <p className="text-lg font-bold text-gray-900">
                                        {formatCurrency(activeShift.opening_cash || 0)}
                                    </p>
                                </div>
                                <div className="bg-white p-4 rounded-xl">
                                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                        <TrendingUp className="w-4 h-4" />
                                        Jami sotuv
                                    </div>
                                    <p className="text-lg font-bold text-green-600">
                                        {formatCurrency(activeShift.current_sales || 0)}
                                    </p>
                                </div>
                                <div className="bg-white p-4 rounded-xl">
                                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                        <FileText className="w-4 h-4" />
                                        Tranzaksiyalar
                                    </div>
                                    <p className="text-lg font-bold text-gray-900">
                                        {activeShift.transaction_count || 0}
                                    </p>
                                </div>
                                <div className="bg-white p-4 rounded-xl">
                                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                        <Clock className="w-4 h-4" />
                                        Davomiylik
                                    </div>
                                    <p className="text-lg font-bold text-gray-900">
                                        {activeShift.opened_at ? 
                                            formatDuration((Date.now() - new Date(activeShift.opened_at).getTime()) / 3600000) 
                                            : "-"
                                        }
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Shift History */}
                    <div className="bg-white rounded-2xl border shadow-sm">
                        <div className="p-4 border-b">
                            <h2 className="text-lg font-semibold text-gray-900">Smenalar tarixi</h2>
                        </div>
                        
                        {shiftHistory.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sana</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kassir</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sotuv</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tranz.</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Farq</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Holat</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {shiftHistory.map((shift: any) => (
                                            <tr key={shift.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {new Date(shift.opened_at).toLocaleDateString('uz-UZ')}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(shift.opened_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                                        {shift.closed_at && ` - ${new Date(shift.closed_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}`}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {shift.cashier_name}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                                                    {formatCurrency(shift.total_sales)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-700">
                                                    {shift.total_transactions}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right">
                                                    <span className={`font-medium ${
                                                        shift.cash_difference === 0 ? "text-gray-500" :
                                                        shift.cash_difference > 0 ? "text-green-600" : "text-red-600"
                                                    }`}>
                                                        {shift.cash_difference > 0 ? "+" : ""}{formatCurrency(shift.cash_difference)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                        shift.status === "open" 
                                                            ? "bg-green-100 text-green-700" 
                                                            : "bg-gray-100 text-gray-700"
                                                    }`}>
                                                        {shift.status === "open" ? "Ochiq" : "Yopiq"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Clock className="w-12 h-12 text-gray-300 mb-4" />
                                <p className="text-gray-500">Smenalar tarixi yo'q</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Open Shift Modal */}
            {showOpenModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl w-full max-w-md"
                    >
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold text-gray-900">Smenani ochish</h2>
                            <button onClick={() => setShowOpenModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Kassadagi boshlang'ich pul *
                                </label>
                                <input
                                    type="number"
                                    value={openingCash}
                                    onChange={(e) => setOpeningCash(e.target.value)}
                                    placeholder="0"
                                    className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Eslatma (ixtiyoriy)
                                </label>
                                <textarea
                                    value={openingNotes}
                                    onChange={(e) => setOpeningNotes(e.target.value)}
                                    placeholder="..."
                                    rows={2}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 p-4 border-t">
                            <button
                                onClick={() => setShowOpenModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Bekor qilish
                            </button>
                            <button
                                onClick={handleOpenShift}
                                disabled={openMutation.isPending}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {openMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                                Ochish
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Close Shift Modal */}
            {showCloseModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl w-full max-w-md"
                    >
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold text-gray-900">Smenani yopish</h2>
                            <button onClick={() => setShowCloseModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-4 space-y-4">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-yellow-700">
                                    <AlertTriangle className="w-5 h-5" />
                                    <span className="font-medium">Kassadagi pulni sanab, miqdorini kiriting</span>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Kassadagi haqiqiy pul *
                                </label>
                                <input
                                    type="number"
                                    value={actualCash}
                                    onChange={(e) => setActualCash(e.target.value)}
                                    placeholder="0"
                                    className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Eslatma (ixtiyoriy)
                                </label>
                                <textarea
                                    value={closingNotes}
                                    onChange={(e) => setClosingNotes(e.target.value)}
                                    placeholder="..."
                                    rows={2}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 p-4 border-t">
                            <button
                                onClick={() => setShowCloseModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Bekor qilish
                            </button>
                            <button
                                onClick={handleCloseShift}
                                disabled={closeMutation.isPending || !actualCash}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {closeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <StopCircle className="w-4 h-4" />}
                                Yopish
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Cash Movement Modal */}
            {showCashMovementModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl w-full max-w-md"
                    >
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold text-gray-900">Kassa harakati</h2>
                            <button onClick={() => setShowCashMovementModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-4 space-y-4">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setMovementType("out")}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-colors ${
                                        movementType === "out" 
                                            ? "border-yellow-500 bg-yellow-50 text-yellow-700" 
                                            : "border-gray-200 text-gray-600"
                                    }`}
                                >
                                    <ArrowDownCircle className="w-5 h-5" />
                                    Inkassatsiya
                                </button>
                                <button
                                    onClick={() => setMovementType("in")}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-colors ${
                                        movementType === "in" 
                                            ? "border-green-500 bg-green-50 text-green-700" 
                                            : "border-gray-200 text-gray-600"
                                    }`}
                                >
                                    <ArrowUpCircle className="w-5 h-5" />
                                    Pul qo'shish
                                </button>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Summa *
                                </label>
                                <input
                                    type="number"
                                    value={movementAmount}
                                    onChange={(e) => setMovementAmount(e.target.value)}
                                    placeholder="0"
                                    className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sabab (ixtiyoriy)
                                </label>
                                <input
                                    type="text"
                                    value={movementReason}
                                    onChange={(e) => setMovementReason(e.target.value)}
                                    placeholder="Masalan: Kunlik inkassatsiya"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 p-4 border-t">
                            <button
                                onClick={() => setShowCashMovementModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Bekor qilish
                            </button>
                            <button
                                onClick={handleCashMovement}
                                disabled={movementMutation.isPending || !movementAmount}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                                    movementType === "out" ? "bg-yellow-600 hover:bg-yellow-700" : "bg-green-600 hover:bg-green-700"
                                }`}
                            >
                                {movementMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                Tasdiqlash
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Z-Report Modal */}
            {showZReport && zReportData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl w-full max-w-lg my-8"
                    >
                        <div className="flex items-center justify-between p-4 border-b bg-gray-900 text-white rounded-t-2xl">
                            <div>
                                <h2 className="text-lg font-bold">Z-REPORT</h2>
                                <p className="text-sm text-gray-300">{zReportData.shift_number}</p>
                            </div>
                            <button onClick={() => setShowZReport(false)} className="p-2 hover:bg-gray-700 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-4 space-y-4 font-mono text-sm">
                            {/* Header Info */}
                            <div className="border-b pb-3">
                                <p><span className="text-gray-500">Kassir:</span> {zReportData.cashier_name}</p>
                                <p><span className="text-gray-500">Ochilgan:</span> {new Date(zReportData.opened_at).toLocaleString('uz-UZ')}</p>
                                <p><span className="text-gray-500">Yopilgan:</span> {new Date(zReportData.closed_at).toLocaleString('uz-UZ')}</p>
                                <p><span className="text-gray-500">Davomiylik:</span> {formatDuration(zReportData.duration_hours)}</p>
                            </div>
                            
                            {/* Sales Summary */}
                            <div className="border-b pb-3">
                                <h3 className="font-bold mb-2 text-gray-900">SAVDOLAR</h3>
                                <div className="flex justify-between">
                                    <span>Jami sotuv:</span>
                                    <span className="font-bold text-green-600">{formatCurrency(zReportData.total_sales)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Tranzaksiyalar:</span>
                                    <span>{zReportData.total_transactions}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>O'rtacha chek:</span>
                                    <span>{formatCurrency(zReportData.average_sale)}</span>
                                </div>
                            </div>
                            
                            {/* Payment Methods */}
                            <div className="border-b pb-3">
                                <h3 className="font-bold mb-2 text-gray-900">TO'LOV USULLARI</h3>
                                <div className="flex justify-between">
                                    <span>💵 Naqd:</span>
                                    <span>{formatCurrency(zReportData.cash_sales)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>💳 Karta:</span>
                                    <span>{formatCurrency(zReportData.card_sales)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>📲 O'tkazma:</span>
                                    <span>{formatCurrency(zReportData.transfer_sales)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>📋 Nasiya:</span>
                                    <span>{formatCurrency(zReportData.debt_sales)}</span>
                                </div>
                            </div>
                            
                            {/* Cash Summary */}
                            <div className="border-b pb-3">
                                <h3 className="font-bold mb-2 text-gray-900">KASSA</h3>
                                <div className="flex justify-between">
                                    <span>Boshlang'ich:</span>
                                    <span>{formatCurrency(zReportData.opening_cash)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Kutilgan:</span>
                                    <span>{formatCurrency(zReportData.expected_cash)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Haqiqiy:</span>
                                    <span>{formatCurrency(zReportData.actual_cash)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Inkassatsiya:</span>
                                    <span>{formatCurrency(zReportData.cash_withdrawn)}</span>
                                </div>
                                <div className={`flex justify-between font-bold ${
                                    zReportData.cash_difference === 0 ? "text-gray-900" :
                                    zReportData.cash_difference > 0 ? "text-green-600" : "text-red-600"
                                }`}>
                                    <span>Farq:</span>
                                    <span>{zReportData.cash_difference > 0 ? "+" : ""}{formatCurrency(zReportData.cash_difference)}</span>
                                </div>
                            </div>
                            
                            {/* Status */}
                            <div className={`p-3 rounded-lg text-center font-bold ${
                                zReportData.status === "balanced" ? "bg-green-100 text-green-700" :
                                zReportData.status === "shortage" ? "bg-red-100 text-red-700" :
                                "bg-yellow-100 text-yellow-700"
                            }`}>
                                {zReportData.status === "balanced" && "✅ KASSA TO'G'RI"}
                                {zReportData.status === "shortage" && "⚠️ KASSA KAM"}
                                {zReportData.status === "overage" && "⚠️ KASSA ORTIQ"}
                            </div>
                        </div>

                        <div className="flex gap-3 p-4 border-t">
                            <button
                                onClick={() => setShowZReport(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Yopish
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                            >
                                <Printer className="w-4 h-4" />
                                Chop etish
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
