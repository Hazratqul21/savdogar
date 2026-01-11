"use client";

import { useState } from "react";
import { Users, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import type { TeamMember } from "@/app/onboarding/page";

const ROLES = [
  { id: "manager", label: "Menejer", description: "Dashboard, hisobotlar, mahsulotlar" },
  { id: "cashier", label: "Kassir", description: "Faqat POS terminali" },
  { id: "warehouse_manager", label: "Omborchi", description: "Ombor va mahsulotlar" },
];

interface StepTeamSetupProps {
  teamMembers: TeamMember[];
  onChange: (members: TeamMember[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepTeamSetup({
  teamMembers,
  onChange,
  onNext,
  onBack,
}: StepTeamSetupProps) {
  const [showPassword, setShowPassword] = useState<{ [key: number]: boolean }>({});
  const [saving, setSaving] = useState(false);

  const addMember = () => {
    onChange([
      ...teamMembers,
      { username: "", password: "", fullName: "", role: "cashier" },
    ]);
  };

  const updateMember = (index: number, updates: Partial<TeamMember>) => {
    const newMembers = [...teamMembers];
    newMembers[index] = { ...newMembers[index], ...updates };
    onChange(newMembers);
  };

  const removeMember = (index: number) => {
    onChange(teamMembers.filter((_, i) => i !== index));
  };

  const togglePassword = (index: number) => {
    setShowPassword(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleNext = async () => {
    // Filter out incomplete members
    const validMembers = teamMembers.filter(m => m.username && m.password);
    
    if (validMembers.length > 0) {
      setSaving(true);
      try {
        const { createTeamMember } = await import("@/lib/api");
        
        for (const member of validMembers) {
          await createTeamMember({
            username: member.username,
            password: member.password,
            full_name: member.fullName,
            role: member.role,
          });
        }
      } catch (error) {
        console.error("Failed to create team members:", error);
      } finally {
        setSaving(false);
      }
    }
    
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Jamoa a'zolari</h2>
        <p className="text-gray-500 mt-2">
          Xodimlaringiz uchun hisob yarating (ixtiyoriy)
        </p>
      </div>

      {teamMembers.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Users className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500 mb-4">Hali xodim qo'shilmagan</p>
          <button
            onClick={addMember}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Xodim qo'shish
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {teamMembers.map((member, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">Xodim #{index + 1}</span>
                <button
                  onClick={() => removeMember(index)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={member.fullName}
                  onChange={(e) => updateMember(index, { fullName: e.target.value })}
                  placeholder="Ism familiya"
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={member.username}
                  onChange={(e) => updateMember(index, { username: e.target.value })}
                  placeholder="Login *"
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type={showPassword[index] ? "text" : "password"}
                    value={member.password}
                    onChange={(e) => updateMember(index, { password: e.target.value })}
                    placeholder="Parol *"
                    className="w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => togglePassword(index)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword[index] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <select
                  value={member.role}
                  onChange={(e) => updateMember(index, { role: e.target.value })}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {ROLES.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}

          <button
            onClick={addMember}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Yana xodim qo'shish
          </button>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
        >
          Orqaga
        </button>
        <button
          onClick={handleNext}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? "Saqlanmoqda..." : teamMembers.length === 0 ? "O'tkazib yuborish" : "Davom etish"}
        </button>
      </div>
    </div>
  );
}
