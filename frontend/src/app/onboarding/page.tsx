"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, Store, Users, Shield, Package, Loader2 } from "lucide-react";
import StepBusinessType from "@/components/onboarding/step-business-type";
import StepStoreInfo from "@/components/onboarding/step-store-info";
import StepTeamSetup from "@/components/onboarding/step-team-setup";
import StepPermissions from "@/components/onboarding/step-permissions";
import StepFirstProduct from "@/components/onboarding/step-first-product";

const STEPS = [
  { id: 1, title: "Biznes turi", icon: Store },
  { id: 2, title: "Do'kon ma'lumotlari", icon: Store },
  { id: 3, title: "Jamoa", icon: Users },
  { id: 4, title: "Ruxsatlar", icon: Shield },
  { id: 5, title: "Birinchi mahsulot", icon: Package },
];

export interface OnboardingData {
  businessType: string;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  teamMembers: TeamMember[];
}

export interface TeamMember {
  username: string;
  password: string;
  fullName: string;
  role: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    businessType: "retail",
    storeName: "",
    storeAddress: "",
    storePhone: "",
    teamMembers: [],
  });

  // Check if onboarding is already completed
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const { getSettings } = await import("@/lib/api");
        const settings = await getSettings();
        
        if (settings.tenant?.onboarding_completed) {
          router.replace("/dashboard");
          return;
        }
        
        // Resume from last step
        if (settings.tenant?.onboarding_step > 0) {
          setCurrentStep(settings.tenant.onboarding_step);
        }
        
        // Pre-fill data
        if (settings.tenant?.name) {
          setData(prev => ({ ...prev, storeName: settings.tenant.name }));
        }
        if (settings.tenant?.business_type) {
          setData(prev => ({ ...prev, businessType: settings.tenant.business_type }));
        }
      } catch (error) {
        console.error("Failed to check onboarding status:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkOnboarding();
  }, [router]);

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const saveProgress = async (step: number) => {
    try {
      const { updateOnboarding } = await import("@/lib/api");
      await updateOnboarding({
        step,
        business_type: data.businessType,
        store_name: data.storeName,
        store_address: data.storeAddress,
        store_phone: data.storePhone,
      });
    } catch (error) {
      console.error("Failed to save progress:", error);
    }
  };

  const nextStep = async () => {
    await saveProgress(currentStep + 1);
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const completeOnboarding = async () => {
    setSaving(true);
    try {
      const { updateOnboarding } = await import("@/lib/api");
      await updateOnboarding({
        step: 5,
        completed: true,
        business_type: data.businessType,
        store_name: data.storeName,
        store_address: data.storeAddress,
        store_phone: data.storePhone,
      });
      router.replace("/dashboard");
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-lg" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Savdogar</h1>
                <p className="text-sm text-gray-500">Sozlash ustasi</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {currentStep} / {STEPS.length}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full
                    ${isCompleted ? "bg-green-500 text-white" : 
                      isCurrent ? "bg-blue-600 text-white" : 
                      "bg-gray-100 text-gray-400"}
                  `}>
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`
                    ml-2 text-sm font-medium hidden sm:block
                    ${isCurrent ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-400"}
                  `}>
                    {step.title}
                  </span>
                  {index < STEPS.length - 1 && (
                    <ChevronRight className="w-5 h-5 mx-2 text-gray-300" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border p-6 md:p-8">
          {currentStep === 1 && (
            <StepBusinessType
              value={data.businessType}
              onChange={(businessType) => updateData({ businessType })}
              onNext={nextStep}
            />
          )}
          {currentStep === 2 && (
            <StepStoreInfo
              storeName={data.storeName}
              storeAddress={data.storeAddress}
              storePhone={data.storePhone}
              onChange={updateData}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          {currentStep === 3 && (
            <StepTeamSetup
              teamMembers={data.teamMembers}
              onChange={(teamMembers) => updateData({ teamMembers })}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          {currentStep === 4 && (
            <StepPermissions
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          {currentStep === 5 && (
            <StepFirstProduct
              onComplete={completeOnboarding}
              onBack={prevStep}
              onSkip={completeOnboarding}
              saving={saving}
            />
          )}
        </div>
      </div>
    </div>
  );
}
