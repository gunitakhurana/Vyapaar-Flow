"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productData, setProductData] = useState<any>(null);

  useEffect(() => {
    if (!profile || !productId) return;

    const fetchProduct = async () => {
      const { data, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .eq("wholesaler_id", profile.id)
        .single();

      if (fetchError) {
        setError("Failed to load product details.");
      } else {
        setProductData(data);
      }
      setInitialLoading(false);
    };

    fetchProduct();
  }, [profile, productId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) {
      setError("User profile not found. Please try refreshing the page or logging in again.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const product = {
      name: formData.get("name") as string,
      price: Number(formData.get("price")),
      stock_quantity: Number(formData.get("stock")),
      gst_percent: Number(formData.get("gst_percent")),
    };

    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("products")
      .update(product)
      .eq("id", productId);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setSubmitted(true);
    setTimeout(() => router.push("/seller/products"), 1500);
  };

  if (initialLoading) {
    return (
      <DashboardLayout role="seller" pageTitle="Edit Product">
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="seller" pageTitle="Edit Product">
      <div className="max-w-xl">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-800">Edit Product</h2>
          <p className="text-sm text-slate-500 mt-0.5">Update the details for your listed product.</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          {submitted ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">Product updated!</h3>
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
                  defaultValue={productData?.name || ""}
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
                    defaultValue={productData?.price || ""}
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
                    defaultValue={productData?.gst_percent ?? ""}
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
                  defaultValue={productData?.stock_quantity || ""}
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
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
