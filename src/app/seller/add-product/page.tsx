"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

const UNITS = ["kg", "g", "pcs", "litre", "ml", "box", "dozen", "bag", "bundle"];

export default function AddProductPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) {
      setError("User profile not found. Please try refreshing the page or logging in again.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const product = {
      wholesaler_id: profile.id,
      name: formData.get("name") as string,
      price: Number(formData.get("price")),
      stock_quantity: Number(formData.get("stock")),
      gst_percent: Number(formData.get("gst_percent")),
    };

    setLoading(true);
    setError(null);

    const { error: insertError } = await supabase.from("products").insert(product);

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setSubmitted(true);
    setTimeout(() => router.push("/seller/products"), 1500);
  };

  return (
    <DashboardLayout role="seller" pageTitle="Add Product">
      <div className="max-w-xl">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-800">Add New Product</h2>
          <p className="text-sm text-slate-500 mt-0.5">Fill in the details to list a new product in your catalog.</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          {submitted ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">Product added!</h3>
              <p className="text-sm text-slate-500">Redirecting to your products list...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-600">
                  {error}
                </div>
              )}

              {/* Product Name */}
              <div>
                <label htmlFor="product-name" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="product-name"
                  name="name"
                  type="text"
                  placeholder="e.g. Basmati Rice Premium"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
                />
              </div>

              {/* Price + Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="product-price" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Price (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="product-price"
                    name="price"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="e.g. 250.00"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="product-gst" className="block text-sm font-medium text-slate-700 mb-1.5">
                    GST % <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="product-gst"
                    name="gst_percent"
                    required
                    defaultValue=""
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors bg-white"
                  >
                    <option value="" disabled>Select GST</option>
                    {[0, 5, 12, 18, 28].map((g) => (
                      <option key={g} value={g}>{g}%</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stock */}
              <div>
                <label htmlFor="product-stock" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Stock Quantity <span className="text-rose-500">*</span>
                </label>
                <input
                  id="product-stock"
                  name="stock"
                  type="number"
                  min={0}
                  placeholder="e.g. 500"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="submit-product-btn"
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors"
                >
                  {loading ? "Adding..." : "Add Product"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
