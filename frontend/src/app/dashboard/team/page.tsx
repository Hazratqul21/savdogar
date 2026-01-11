"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Users, 
    Plus, 
    Search,
    Shield,
    ShoppingCart,
    Warehouse,
    Loader2,
    Edit2,
    Trash2,
    User,
    Eye,
    EyeOff,
    X,
    Check,
    AlertCircle,
    CheckCircle2,
    XCircle
} from "lucide-react";
import { getTeamMembers, createTeamMember, updateTeamMember, deleteTeamMember } from "@/lib/api";
import { usePermissions } from "@/hooks/usePermissions";

// Toast component
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 2000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100]"
        >
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border ${
                type === 'success' ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
            }`}>
                {type === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                <span className="font-medium text-sm">{message}</span>
            </div>
        </motion.div>
    );
}

// Role labels and icons
const ROLE_INFO: Record<string, { label: string; icon: any; color: string; description: string }> = {
    manager: { 
        label: "Menejer", 
        icon: Shield, 
        color: "bg-blue-100 text-blue-700",
        description: "Dashboard, hisobotlar, mahsulotlar" 
    },
    cashier: { 
        label: "Kassir", 
        icon: ShoppingCart, 
        color: "bg-green-100 text-green-700",
        description: "Faqat POS terminali" 
    },
    warehouse_manager: { 
        label: "Omborchi", 
        icon: Warehouse, 
        color: "bg-orange-100 text-orange-700",
        description: "Ombor va mahsulotlar" 
    },
};

export default function TeamPage() {
    const queryClient = useQueryClient();
    const permissions = usePermissions();
    const [searchQuery, setSearchQuery] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [editingMember, setEditingMember] = useState<any>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [newMember, setNewMember] = useState({
        username: "",
        password: "",
        full_name: "",
        phone_number: "",
        role: "cashier",
    });

    // Fetch team members
    const { data: teamMembers = [], isLoading, error } = useQuery({
        queryKey: ["team-members"],
        queryFn: getTeamMembers,
        retry: 1,
    });

    // Create member mutation
    const createMutation = useMutation({
        mutationFn: createTeamMember,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team-members"] });
            setShowAddModal(false);
            setNewMember({ username: "", password: "", full_name: "", phone_number: "", role: "cashier" });
            setToast({ message: "Xodim qo'shildi ✓", type: 'success' });
        },
        onError: () => {
            setToast({ message: "Xatolik yuz berdi", type: 'error' });
        },
    });

    // Update member mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => updateTeamMember(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team-members"] });
            setEditingMember(null);
            setToast({ message: "Yangilandi ✓", type: 'success' });
        },
        onError: () => {
            setToast({ message: "Yangilashda xatolik", type: 'error' });
        },
    });

    // Delete member mutation
    const deleteMutation = useMutation({
        mutationFn: deleteTeamMember,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team-members"] });
            setToast({ message: "Xodim o'chirildi", type: 'success' });
        },
        onError: () => {
            setToast({ message: "O'chirishda xatolik", type: 'error' });
        },
    });

    const handleAddMember = () => {
        if (!newMember.username || !newMember.password) return;
        createMutation.mutate(newMember);
    };

    const handleUpdateRole = (memberId: number, newRole: string) => {
        updateMutation.mutate({ id: memberId, data: { role: newRole } });
    };

    const handleToggleActive = (memberId: number, currentStatus: boolean) => {
        updateMutation.mutate({ id: memberId, data: { is_active: !currentStatus } });
    };

    // Filter members
    const filteredMembers = teamMembers.filter((member: any) => {
        const searchLower = searchQuery.toLowerCase();
        return (
            member.username?.toLowerCase().includes(searchLower) ||
            member.full_name?.toLowerCase().includes(searchLower)
        );
    });

    // Stats
    const totalMembers = teamMembers.length;
    const activeMembers = teamMembers.filter((m: any) => m.is_active).length;

    // Check if user can manage team
    if (!permissions.canManageTeam) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Ruxsat yo'q</h2>
                <p className="text-gray-500">Sizda jamoa boshqarish ruxsati yo'q</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
            {/* Toast */}
            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </AnimatePresence>

            {/* Header */}
            <div className="flex items-center justify-between gap-2">
                <div>
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Jamoa</h1>
                    <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Xodimlarni boshqarish</p>
                </div>
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 sm:px-4 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    Yangi xodim
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Jami xodimlar</p>
                            <p className="text-xl font-bold text-gray-900">{totalMembers}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Check className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Faol xodimlar</p>
                            <p className="text-xl font-bold text-gray-900">{activeMembers}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Xodim qidirish..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Team List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <AlertCircle className="w-12 h-12 text-red-300 mb-4" />
                        <p className="text-red-500">Xodimlarni yuklashda xatolik</p>
                    </div>
                ) : filteredMembers.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Xodim</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Login</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Rol</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amallar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredMembers.map((member: any) => {
                                    const roleInfo = ROLE_INFO[member.role] || ROLE_INFO.cashier;
                                    const RoleIcon = roleInfo.icon;
                                    
                                    return (
                                        <tr key={member.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <User className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {member.full_name || member.username}
                                                        </p>
                                                        {member.phone_number && (
                                                            <p className="text-sm text-gray-500">{member.phone_number}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="font-mono text-sm text-gray-600">
                                                    {member.username}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${roleInfo.color}`}>
                                                    <RoleIcon className="w-3 h-3" />
                                                    {roleInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <button
                                                    onClick={() => handleToggleActive(member.id, member.is_active)}
                                                    className={`px-2 py-1 text-xs rounded-full ${
                                                        member.is_active 
                                                            ? 'bg-green-100 text-green-700' 
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}
                                                >
                                                    {member.is_active ? 'Faol' : 'Nofaol'}
                                                </button>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <select
                                                        value={member.role}
                                                        onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                                                        className="text-sm border border-gray-300 rounded px-2 py-1"
                                                    >
                                                        <option value="manager">Menejer</option>
                                                        <option value="cashier">Kassir</option>
                                                        <option value="warehouse_manager">Omborchi</option>
                                                    </select>
                                                    <button 
                                                        onClick={() => deleteMutation.mutate(member.id)}
                                                        className="p-2 hover:bg-red-50 rounded-lg"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-600" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Users className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-gray-500 mb-4">Hali xodimlar yo'q</p>
                        <button 
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4" />
                            Birinchi xodimni qo'shing
                        </button>
                    </div>
                )}
            </div>

            {/* Role Permissions Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Rollar va ruxsatlar</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(ROLE_INFO).map(([key, info]) => {
                        const Icon = info.icon;
                        return (
                            <div key={key} className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`p-2 rounded-lg ${info.color}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <span className="font-medium text-gray-900">{info.label}</span>
                                </div>
                                <p className="text-sm text-gray-600">{info.description}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Add Member Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold text-gray-900">Yangi xodim</h2>
                            <button 
                                onClick={() => setShowAddModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ism familiya
                                </label>
                                <input
                                    type="text"
                                    value={newMember.full_name}
                                    onChange={(e) => setNewMember(prev => ({ ...prev, full_name: e.target.value }))}
                                    placeholder="Ali Valiyev"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Login *
                                </label>
                                <input
                                    type="text"
                                    value={newMember.username}
                                    onChange={(e) => setNewMember(prev => ({ ...prev, username: e.target.value }))}
                                    placeholder="ali_kassir"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Parol *
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={newMember.password}
                                        onChange={(e) => setNewMember(prev => ({ ...prev, password: e.target.value }))}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Rol
                                </label>
                                <select
                                    value={newMember.role}
                                    onChange={(e) => setNewMember(prev => ({ ...prev, role: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="cashier">Kassir</option>
                                    <option value="manager">Menejer</option>
                                    <option value="warehouse_manager">Omborchi</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 p-4 border-t">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Bekor qilish
                            </button>
                            <button
                                onClick={handleAddMember}
                                disabled={createMutation.isPending || !newMember.username || !newMember.password}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {createMutation.isPending ? "Saqlanmoqda..." : "Qo'shish"}
                            </button>
                        </div>

                        {createMutation.isError && (
                            <div className="px-4 pb-4">
                                <p className="text-sm text-red-600">
                                    Xatolik: {(createMutation.error as Error)?.message || "Xodim qo'shishda xatolik"}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
