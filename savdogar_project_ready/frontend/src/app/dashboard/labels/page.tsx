"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getProducts } from "@/lib/api-pos";
import { usePosState } from "@/stores/pos-state";
import { Loader2, Printer, Search, CheckSquare, Square } from "lucide-react";
import { motion } from "framer-motion";
import { getToken } from "@/lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function downloadLabels(productIds: number[]) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/api/v1/labels/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify({ product_ids: productIds })
  });

  if (!response.ok) throw new Error("Failed to generate labels");
  return response.blob();
}

export default function LabelStudioPage() {
  const { tenantId } = usePosState();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', tenantId],
    queryFn: () => getProducts(tenantId!),
    enabled: !!tenantId,
  });

  const generateMutation = useMutation({
    mutationFn: downloadLabels,
    onSuccess: (data) => {
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'labels.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  });

  const filtered = products.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((p: any) => p.id));
    }
  };

  return (
    <div className="p-6 space-y-6 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Label Studio</h1>
          <p className="text-slate-400">QR kod va narx etiketkalarini chop etish</p>
        </div>
        <button
          onClick={() => generateMutation.mutate(selectedIds)}
          disabled={selectedIds.length === 0 || generateMutation.isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {generateMutation.isPending ? <Loader2 className="animate-spin" /> : <Printer size={20} />}
          Chop etish ({selectedIds.length})
        </button>
      </div>

      {/* Search and Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Mahsulot qidirish..."
          className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-hidden bg-slate-900 rounded-xl border border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center gap-4 bg-slate-800/50 font-medium text-slate-300">
          <button onClick={toggleAll} className="hover:text-white">
            {selectedIds.length === filtered.length && filtered.length > 0 ? <CheckSquare size={20} /> : <Square size={20} />}
          </button>
          <div className="flex-1">Mahsulot</div>
          <div className="w-32">SKU</div>
          <div className="w-32 text-right">Narx</div>
        </div>

        <div className="flex-1 overflow-auto p-2 space-y-1">
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-500" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center p-8 text-slate-500">Mahsulot topilmadi</div>
          ) : (
            filtered.map((product: any) => (
              <motion.div
                key={product.id}
                layoutId={`label-${product.id}`}
                onClick={() => toggleSelect(product.id)}
                className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors border ${selectedIds.includes(product.id) ? 'bg-blue-900/20 border-blue-500/30' : 'hover:bg-slate-800 border-transparent'}`}
              >
                <div className={selectedIds.includes(product.id) ? "text-blue-400" : "text-slate-500"}>
                  {selectedIds.includes(product.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                </div>
                <div className="flex-1 font-medium text-white">{product.name}</div>
                <div className="w-32 text-slate-400 text-sm">{product.sku || '-'}</div>
                <div className="w-32 text-right text-white font-mono">{product.price.toLocaleString()}</div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
