"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  gst_percent: number;
  created_at: string;
};

export default function SellerProductsPage() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    const fetchProducts = async () => {
      const { data, error: fetchError } = await supabase
        .from("products")
        .select("id, name, price, stock_quantity, gst_percent, created_at")
        .eq("wholesaler_id", profile.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setProducts(data ?? []);
      }
      setLoading(false);
    };

    fetchProducts();
  }, [profile]);

  return (
    <DashboardLayout role="seller" pageTitle="My Products">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Products</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage your product catalog and inventory</p>
        </div>
        <Link
          href="/seller/add-product"
          id="add-product-btn"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-rose-600">{error}</div>
        ) : products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">GST %</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {products.map((product, i) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 text-slate-400 font-mono text-xs">{i + 1}</td>
                    <td className="px-5 py-4 font-medium text-slate-800">{product.name}</td>
                    <td className="px-5 py-4 text-slate-600">₹{Number(product.price).toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <span className={product.stock_quantity < 10 ? "text-rose-600 font-semibold" : "text-slate-600"}>
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{product.gst_percent}%</td>
                    <td className="px-5 py-4">
                      <Link href={`/seller/edit-product/${product.id}`} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">Edit</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
              </svg>
            }
            title="No products yet"
            description="Start building your catalog by adding your first product."
            action={
              <Link
                href="/seller/add-product"
                className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Add First Product
              </Link>
            }
          />
        )}
      </div>
    </DashboardLayout>
  );
}
