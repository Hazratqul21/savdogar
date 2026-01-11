"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Edit2,
    Trash2,
    Loader2,
    CheckCircle2,
    XCircle,
    X,
    Settings2,
    Coffee,
    ChevronDown,
    ChevronUp,
    DollarSign,
    AlertCircle
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

// API
const apiUrl = () => getApiBaseUrl();

interface ModifierOption {
    id: number;
    group_id: number;
    name: string;
    display_name: string | null;
    price_adjustment: number;
    is_default: boolean;
    sort_order: number;
    is_active: boolean;
}

interface ModifierGroup {
    id: number;
    tenant_id: number;
    name: string;
    display_name: string | null;
    is_required: boolean;
    min_selections: number;
    max_selections: number;
    sort_order: number;
    is_active: boolean;
    options: ModifierOption[];
}

async function getModifierGroups(): Promise<ModifierGroup[]> {
    const response = await fetch(`${apiUrl()}/api/v1/modifiers/groups`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch modifier groups");
    return response.json();
}

async function createModifierGroup(data: any) {
    const response = await fetch(`${apiUrl()}/api/v1/modifiers/groups`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || "Xatolik yuz berdi");
    }
    return response.json();
}

async function updateModifierGroup(id: number, data: any) {
    const response = await fetch(`${apiUrl()}/api/v1/modifiers/groups/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || "Xatolik yuz berdi");
    }
    return response.json();
}

async function deleteModifierGroup(id: number) {
    const response = await fetch(`${apiUrl()}/api/v1/modifiers/groups/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || "Xatolik yuz berdi");
    }
    return response.json();
}

async function addModifierOption(groupId: number, data: any) {
    const response = await fetch(`${apiUrl()}/api/v1/modifiers/groups/${groupId}/options`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || "Xatolik yuz berdi");
    }
    return response.json();
}

// Format currency
function formatCurrency(value: number): string {
    return value.toLocaleString('uz-UZ') + " so'm";
}

export default function ModifiersPage() {
    const queryClient = useQueryClient();
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    // Modals
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [showOptionModal, setShowOptionModal] = useState(false);
    const [editingGroup, setEditingGroup] = useState<ModifierGroup | null>(null);
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    
    // Form states
    const [groupName, setGroupName] = useState("");
    const [groupDisplayName, setGroupDisplayName] = useState("");
    const [isRequired, setIsRequired] = useState(false);
    const [maxSelections, setMaxSelections] = useState(1);
    const [options, setOptions] = useState<Array<{name: string; price_adjustment: number}>>([]);
    
    const [optionName, setOptionName] = useState("");
    const [optionPrice, setOptionPrice] = useState("");
    
    // Expanded groups
    const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

    // Fetch groups
    const { data: groups = [], isLoading } = useQuery({
        queryKey: ["modifier-groups"],
        queryFn: getModifierGroups,
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: createModifierGroup,
        onSuccess: () => {
            setToast({ message: "Modifikator guruhi yaratildi ✓", type: "success" });
            setShowGroupModal(false);
            resetForm();
            queryClient.invalidateQueries({ queryKey: ["modifier-groups"] });
        },
        onError: (error: Error) => {
            setToast({ message: error.message, type: "error" });
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => updateModifierGroup(id, data),
        onSuccess: () => {
            setToast({ message: "Modifikator guruhi yangilandi ✓", type: "success" });
            setShowGroupModal(false);
            setEditingGroup(null);
            resetForm();
            queryClient.invalidateQueries({ queryKey: ["modifier-groups"] });
        },
        onError: (error: Error) => {
            setToast({ message: error.message, type: "error" });
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: deleteModifierGroup,
        onSuccess: () => {
            setToast({ message: "Modifikator guruhi o'chirildi ✓", type: "success" });
            queryClient.invalidateQueries({ queryKey: ["modifier-groups"] });
        },
        onError: (error: Error) => {
            setToast({ message: error.message, type: "error" });
        },
    });

    // Add option mutation
    const addOptionMutation = useMutation({
        mutationFn: ({ groupId, data }: { groupId: number; data: any }) => addModifierOption(groupId, data),
        onSuccess: () => {
            setToast({ message: "Variant qo'shildi ✓", type: "success" });
            setShowOptionModal(false);
            setOptionName("");
            setOptionPrice("");
            queryClient.invalidateQueries({ queryKey: ["modifier-groups"] });
        },
        onError: (error: Error) => {
            setToast({ message: error.message, type: "error" });
        },
    });

    const resetForm = () => {
        setGroupName("");
        setGroupDisplayName("");
        setIsRequired(false);
        setMaxSelections(1);
        setOptions([]);
    };

    const handleOpenGroupModal = (group?: ModifierGroup) => {
        if (group) {
            setEditingGroup(group);
            setGroupName(group.name);
            setGroupDisplayName(group.display_name || "");
            setIsRequired(group.is_required);
            setMaxSelections(group.max_selections);
        } else {
            resetForm();
            setEditingGroup(null);
        }
        setShowGroupModal(true);
    };

    const handleSaveGroup = () => {
        if (!groupName.trim()) {
            setToast({ message: "Guruh nomi kiriting", type: "error" });
            return;
        }

        const data = {
            name: groupName.trim(),
            display_name: groupDisplayName.trim() || groupName.trim(),
            is_required: isRequired,
            min_selections: isRequired ? 1 : 0,
            max_selections: maxSelections,
            options: options.filter(o => o.name.trim()),
        };

        if (editingGroup) {
            updateMutation.mutate({ id: editingGroup.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleAddOption = () => {
        if (!optionName.trim()) {
            setToast({ message: "Variant nomini kiriting", type: "error" });
            return;
        }

        addOptionMutation.mutate({
            groupId: selectedGroupId!,
            data: {
                name: optionName.trim(),
                price_adjustment: parseFloat(optionPrice) || 0,
            },
        });
    };

    const toggleExpand = (groupId: number) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupId)) {
                next.delete(groupId);
            } else {
                next.add(groupId);
            }
            return next;
        });
    };

    const addLocalOption = () => {
        setOptions([...options, { name: "", price_adjustment: 0 }]);
    };

    const updateLocalOption = (index: number, field: string, value: any) => {
        const newOptions = [...options];
        (newOptions[index] as any)[field] = value;
        setOptions(newOptions);
    };

    const removeLocalOption = (index: number) => {
        setOptions(options.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-6">
            {/* Toast */}
            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Modifikatorlar</h1>
                    <p className="text-gray-500 text-sm mt-1">Mahsulot qo'shimchalari (shakar, sut, etc.)</p>
                </div>
                <button
                    onClick={() => handleOpenGroupModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Yangi guruh
                </button>
            </div>

            {/* Info banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <Coffee className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <h3 className="font-medium text-blue-800">Modifikatorlar qanday ishlaydi?</h3>
                        <p className="text-sm text-blue-700 mt-1">
                            Modifikatorlar mahsulotga qo'shimcha tanlovlar qo'shish imkonini beradi.
                            Masalan: "Kofe" mahsulotiga "Shakar miqdori" (Kam, O'rta, Ko'p) modifikatori.
                        </p>
                    </div>
                </div>
            </div>

            {/* Groups List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-2xl border border-dashed">
                    <Settings2 className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">Modifikator guruhlari yo'q</p>
                    <p className="text-gray-400 text-sm mt-1">Yangi guruh yarating</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {groups.map((group) => (
                        <motion.div
                            key={group.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white border rounded-xl overflow-hidden shadow-sm"
                        >
                            {/* Group Header */}
                            <div
                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                                onClick={() => toggleExpand(group.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Settings2 className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{group.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            {group.is_required && (
                                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">Majburiy</span>
                                            )}
                                            <span className="text-xs text-gray-500">
                                                {group.options.length} ta variant
                                            </span>
                                            {group.max_selections > 1 && (
                                                <span className="text-xs text-gray-500">
                                                    • {group.max_selections} tagacha tanlash
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenGroupModal(group);
                                        }}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm("Bu modifikator guruhini o'chirishni xohlaysizmi?")) {
                                                deleteMutation.mutate(group.id);
                                            }
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    {expandedGroups.has(group.id) ? (
                                        <ChevronUp className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    )}
                                </div>
                            </div>

                            {/* Options */}
                            <AnimatePresence>
                                {expandedGroups.has(group.id) && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t bg-gray-50"
                                    >
                                        <div className="p-4 space-y-2">
                                            {group.options.map((option) => (
                                                <div
                                                    key={option.id}
                                                    className="flex items-center justify-between p-3 bg-white rounded-lg border"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                                                        <span className="font-medium text-gray-800">{option.name}</span>
                                                        {option.is_default && (
                                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Default</span>
                                                        )}
                                                    </div>
                                                    {option.price_adjustment > 0 && (
                                                        <span className="text-sm font-medium text-green-600">
                                                            +{formatCurrency(option.price_adjustment)}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                            
                                            {/* Add Option Button */}
                                            <button
                                                onClick={() => {
                                                    setSelectedGroupId(group.id);
                                                    setShowOptionModal(true);
                                                }}
                                                className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Variant qo'shish
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Group Modal */}
            {showGroupModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
                            <h2 className="text-lg font-semibold text-gray-900">
                                {editingGroup ? "Guruhni tahrirlash" : "Yangi guruh yaratish"}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowGroupModal(false);
                                    setEditingGroup(null);
                                    resetForm();
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Guruh nomi *
                                </label>
                                <input
                                    type="text"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    placeholder="Masalan: Shakar miqdori"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ko'rsatiladigan nom (ixtiyoriy)
                                </label>
                                <input
                                    type="text"
                                    value={groupDisplayName}
                                    onChange={(e) => setGroupDisplayName(e.target.value)}
                                    placeholder="Masalan: Shakar"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isRequired}
                                        onChange={(e) => setIsRequired(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <span className="text-sm text-gray-700">Majburiy tanlash</span>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Maksimal tanlash soni
                                </label>
                                <select
                                    value={maxSelections}
                                    onChange={(e) => setMaxSelections(parseInt(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={1}>1 (Radio tugma)</option>
                                    <option value={2}>2 ta</option>
                                    <option value={3}>3 ta</option>
                                    <option value={5}>5 ta</option>
                                    <option value={10}>10 ta</option>
                                </select>
                            </div>

                            {/* Options (only for new groups) */}
                            {!editingGroup && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Variantlar
                                        </label>
                                        <button
                                            onClick={addLocalOption}
                                            className="text-sm text-blue-600 hover:text-blue-700"
                                        >
                                            + Qo'shish
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {options.map((opt, index) => (
                                            <div key={index} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={opt.name}
                                                    onChange={(e) => updateLocalOption(index, "name", e.target.value)}
                                                    placeholder="Variant nomi"
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                />
                                                <input
                                                    type="number"
                                                    value={opt.price_adjustment || ""}
                                                    onChange={(e) => updateLocalOption(index, "price_adjustment", parseFloat(e.target.value) || 0)}
                                                    placeholder="Narx"
                                                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                />
                                                <button
                                                    onClick={() => removeLocalOption(index)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        {options.length === 0 && (
                                            <p className="text-sm text-gray-400 text-center py-2">
                                                Variantlar qo'shing (masalan: Kam, O'rta, Ko'p)
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 p-4 border-t">
                            <button
                                onClick={() => {
                                    setShowGroupModal(false);
                                    setEditingGroup(null);
                                    resetForm();
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Bekor qilish
                            </button>
                            <button
                                onClick={handleSaveGroup}
                                disabled={createMutation.isPending || updateMutation.isPending}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {(createMutation.isPending || updateMutation.isPending) ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4" />
                                )}
                                Saqlash
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Add Option Modal */}
            {showOptionModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl w-full max-w-md"
                    >
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold text-gray-900">Yangi variant</h2>
                            <button
                                onClick={() => {
                                    setShowOptionModal(false);
                                    setOptionName("");
                                    setOptionPrice("");
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Variant nomi *
                                </label>
                                <input
                                    type="text"
                                    value={optionName}
                                    onChange={(e) => setOptionName(e.target.value)}
                                    placeholder="Masalan: Ko'p"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Qo'shimcha narx
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="number"
                                        value={optionPrice}
                                        onChange={(e) => setOptionPrice(e.target.value)}
                                        placeholder="0"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Bu summa mahsulot narxiga qo'shiladi
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 p-4 border-t">
                            <button
                                onClick={() => {
                                    setShowOptionModal(false);
                                    setOptionName("");
                                    setOptionPrice("");
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Bekor qilish
                            </button>
                            <button
                                onClick={handleAddOption}
                                disabled={addOptionMutation.isPending}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {addOptionMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Plus className="w-4 h-4" />
                                )}
                                Qo'shish
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
