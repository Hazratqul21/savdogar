"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { checkout } from "@/lib/api-pos";
import { usePosState } from "@/stores/pos-state";
import { AgeVerificationModal } from "@/components/pos/AgeVerificationModal";
import { printReceipt, prepareReceiptData } from "@/utils/receipt-printer";
import { useQuery } from "@tanstack/react-query";
import { getTenantInfo } from "@/lib/api-pos";

/**
 * Checkout hook with business logic
 * Handles age verification for tobacco, metadata, etc.
 */
export function useCheckout() {
  const {
    cart,
    selectedCustomer,
    paymentMethod,
    businessType,
    tenantId,
    getCartTotal,
    clearCart,
  } = usePosState();

  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState<any>(null);
  const queryClient = useQueryClient();

  // Get tenant info for receipt
  const { data: tenantInfo } = useQuery({
    queryKey: ["tenant-info"],
    queryFn: getTenantInfo,
    enabled: !!tenantId,
  });

  const checkoutMutation = useMutation({
    mutationFn: async (checkoutData: any) => {
      return await checkout(checkoutData);
    },
    onSuccess: async (saleData: any) => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products", tenantId] });
      
      // Print receipt after successful checkout
      try {
        const receiptData = prepareReceiptData(
          saleData,
          tenantInfo,
          selectedCustomer
        );
        await printReceipt(receiptData);
      } catch (printError) {
        console.error("Receipt print error:", printError);
        // Don't fail checkout if print fails
      }
      
      clearCart();
      setShowAgeVerification(false);
      setPendingCheckout(null);
    },
    onError: (error: any) => {
      console.error("Checkout error:", error);
      alert(`Xatolik: ${error.message || "To'lovda xatolik yuz berdi"}`);
    },
  });

  const handleCheckout = async (additionalMetadata: Record<string, any> = {}) => {
    if (cart.length === 0) {
      alert("Savat bo'sh!");
      return;
    }

    // Prepare checkout data
    const checkoutData: any = {
      items: cart.map((item) => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
        discount_percent: item.discount_percent,
        serial_number: item.variant?.attributes?.serial_number,
        is_service_item: false,
        linked_variant_id: null,
      })),
      customer_id: selectedCustomer?.id,
      payment_method: paymentMethod,
      debt_amount: paymentMethod === "debt" ? getCartTotal() : undefined,
      metadata: {
        ...additionalMetadata,
      },
    };

    // Business Logic: Tobacco Age Verification
    if (businessType === "tobacco") {
      // Check if age verification is required (from tenant config)
      // For now, always require it for tobacco
      setPendingCheckout(checkoutData);
      setShowAgeVerification(true);
      return;
    }

    // For other business types, proceed directly
    await checkoutMutation.mutateAsync(checkoutData);
  };

  const handleAgeVerification = async (verified: boolean) => {
    setShowAgeVerification(false);

    if (!verified) {
      alert("Yosh tekshiruvi muvaffaqiyatsiz. Sotuv bekor qilindi.");
      setPendingCheckout(null);
      return;
    }

    // Add age verification to metadata
    if (pendingCheckout) {
      const checkoutData = {
        ...pendingCheckout,
        metadata: {
          ...pendingCheckout.metadata,
          age_verified: true,
          age_verified_at: new Date().toISOString(),
        },
      };
      await checkoutMutation.mutateAsync(checkoutData);
    }
  };

  const AgeVerificationModalComponent = showAgeVerification ? (
    <AgeVerificationModal
      isOpen={showAgeVerification}
      onConfirm={handleAgeVerification}
      onCancel={() => {
        setShowAgeVerification(false);
        setPendingCheckout(null);
      }}
    />
  ) : null;

  return {
    handleCheckout,
    handleAgeVerification,
    showAgeVerification,
    isProcessing: checkoutMutation.isPending,
    AgeVerificationModal: AgeVerificationModalComponent,
  };
}
