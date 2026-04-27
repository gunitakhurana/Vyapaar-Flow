"use client";

import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

type Product = {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
};

type ManualItem = {
  productId: string;
  quantity: number;
};

export default function AddOrderPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"manual" | "bulk">("manual");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Manual Entry State
  // Removed customer name state
  const [manualItems, setManualItems] = useState<ManualItem[]>([{ productId: "", quantity: 1 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualMessage, setManualMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  // Bulk Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<{ productName: string, quantity: number, price: number }[] | null>(null);
  const [uploadMessage, setUploadMessage] = useState<{ type: "success" | "error" | "warning", text: string, details?: string[] } | null>(null);

  useEffect(() => {
    if (!profile) return;
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, price, stock_quantity")
        .eq("wholesaler_id", profile.id)
        .order("name");
      if (data) setProducts(data);
      setLoading(false);
    };
    fetchProducts();
  }, [profile]);

  // --- Manual Entry Logic ---
  const handleAddRow = () => {
    setManualItems([...manualItems, { productId: "", quantity: 1 }]);
  };

  const handleRemoveRow = (index: number) => {
    setManualItems(manualItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ManualItem, value: any) => {
    const newItems = [...manualItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setManualItems(newItems);
  };

  const manualTotalAmount = manualItems.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setManualMessage(null);

    const validItems = manualItems.filter(i => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      setManualMessage({ type: "error", text: "Please add at least one valid product." });
      return;
    }

    // Check stock
    for (const item of validItems) {
      const p = products.find(prod => prod.id === item.productId);
      if (p && item.quantity > p.stock_quantity) {
        setManualMessage({ type: "error", text: `Not enough stock for ${p.name}. Only ${p.stock_quantity} available.` });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Create Order (no customer label)
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          wholesaler_id: profile.id,
          total_amount: manualTotalAmount,
          status: "delivered",
          payment_method: "cash",
          source: "offline"
        })
        .select("id")
        .single();

      if (orderError) throw orderError;

      // Insert Order Items
      const orderItemsToInsert = validItems.map(item => {
        const p = products.find(prod => prod.id === item.productId)!;
        return {
          order_id: order.id,
          product_id: item.productId,
          quantity: item.quantity,
          price_at_time: p.price,
        };
      });

      const { error: itemsError } = await supabase.from("order_items").insert(orderItemsToInsert);
      if (itemsError) throw itemsError;

      // Deduct Stock immediately since status is delivered
      for (const item of orderItemsToInsert) {
        const p = products.find(prod => prod.id === item.product_id)!;
        await supabase
          .from("products")
          .update({ stock_quantity: p.stock_quantity - item.quantity })
          .eq("id", item.product_id);
      }

      // Update local product state
      setProducts(prev => prev.map(p => {
        const insertedItem = orderItemsToInsert.find(i => i.product_id === p.id);
        if (insertedItem) {
          return { ...p, stock_quantity: p.stock_quantity - insertedItem.quantity };
        }
        return p;
      }));

      setManualMessage({ type: "success", text: "Offline transaction recorded successfully." });
      setManualItems([{ productId: "", quantity: 1 }]);
    } catch (error: any) {
      setManualMessage({ type: "error", text: error.message || "Failed to save transaction." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Bulk Upload Logic ---
  const handleDownloadTemplate = () => {
    // Template: All products, user fills quantity
    const ws = XLSX.utils.json_to_sheet(
      products.map(p => ({ "Product Name": p.name, "Quantity": "" }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "vyapaarflow_offline_orders_template.xlsx");
  };

  const handleParseFile = async () => {
    if (!uploadFile) return;
    setUploadMessage(null);
    setPreviewData(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("No data found in file");
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.SheetNames[0];
        const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);

        const extracted: { productName: string, quantity: number, price: number }[] = [];
        const errors: string[] = [];

        rows.forEach((row, index) => {
          const productName = row["Product Name"]?.toString().trim();
          const qty = parseInt(row["Quantity"]);
          if (qty > 0) {
            const product = products.find(p => p.name.toLowerCase() === productName?.toLowerCase());
            if (product) {
              extracted.push({ productName: product.name, quantity: qty, price: product.price });
            } else {
              errors.push(`Row ${index + 2}: Product '${productName}' not found.`);
            }
          }
        });

        if (errors.length > 0) {
          setUploadMessage({ type: "error", text: "Some products were not found.", details: errors });
        } else if (extracted.length === 0) {
          setUploadMessage({ type: "warning", text: "No valid products with quantity > 0 found in the file." });
        } else {
          setPreviewData(extracted);
        }
      } catch (err: any) {
        setUploadMessage({ type: "error", text: "Failed to parse file.", details: [err.message] });
      }
    };
    reader.readAsArrayBuffer(uploadFile);
  };

  const handleConfirmBulkUpload = async () => {
    if (!profile || !previewData) return;
    setIsUploading(true);

    try {
      let totalAmount = previewData.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Check stock
      for (const item of previewData) {
        const p = products.find(prod => prod.name === item.productName);
        if (p && item.quantity > p.stock_quantity) {
          throw new Error(`Not enough stock for ${item.productName}. Available: ${p.stock_quantity}`);
        }
      }

      // Create Order
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          wholesaler_id: profile.id,
          total_amount: totalAmount,
          status: "delivered",
          payment_method: "cash",
          source: "offline"
        })
        .select("id")
        .single();

      if (orderErr) throw orderErr;

      // Insert Items
      const itemsToInsert = previewData.map(item => {
        const p = products.find(prod => prod.name === item.productName)!;
        return {
          order_id: order.id,
          product_id: p.id,
          quantity: item.quantity,
          price_at_time: p.price
        };
      });

      await supabase.from("order_items").insert(itemsToInsert);

      // Deduct Stock
      for (const item of itemsToInsert) {
        const p = products.find(prod => prod.id === item.product_id)!;
        await supabase.from("products").update({ stock_quantity: p.stock_quantity - item.quantity }).eq("id", item.product_id);
      }

      setUploadMessage({ type: "success", text: `Successfully processed offline order with ${previewData.length} items.` });
      setPreviewData(null);
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Update local products
      const { data: freshProducts } = await supabase.from("products").select("id, name, price, stock_quantity").eq("wholesaler_id", profile.id);
      if (freshProducts) setProducts(freshProducts);

    } catch (err: any) {
      setUploadMessage({ type: "error", text: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DashboardLayout role="seller" pageTitle="Add Offline Order">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800">Record Offline Transaction</h2>
          <p className="text-sm text-slate-500 mt-1">Manually log sales made outside of the online portal.</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab("manual")}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "manual" ? "border-indigo-500 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Manual Entry
          </button>
          <button
            onClick={() => setActiveTab("bulk")}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "bulk" ? "border-indigo-500 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Bulk Excel Upload
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : activeTab === "manual" ? (
          /* MANUAL TAB */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            {manualMessage && (
              <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${manualMessage.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                {manualMessage.text}
              </div>
            )}
            
            <form onSubmit={handleManualSubmit}>


              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-medium text-slate-700">Products</label>
                  <button type="button" onClick={handleAddRow} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                    + Add Product
                  </button>
                </div>
                
                {manualItems.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex-1">
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemChange(index, "productId", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                        required
                      >
                        <option value="">Select a product...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id} disabled={p.stock_quantity === 0}>
                            {p.name} (₹{p.price}) - {p.stock_quantity} in stock
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-32">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                        required
                      />
                    </div>
                    {manualItems.length > 1 && (
                      <button type="button" onClick={() => handleRemoveRow(index)} className="p-2.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-5 flex justify-between items-center">
                <div>
                  <span className="text-sm text-slate-500">Total Amount: </span>
                  <span className="text-xl font-bold text-slate-800">₹{manualTotalAmount.toLocaleString()}</span>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-70 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
                >
                  {isSubmitting ? "Saving..." : "Save Transaction"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* BULK TAB */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            
            {uploadMessage && (
              <div className={`mb-6 p-4 rounded-xl text-sm border ${
                uploadMessage.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                uploadMessage.type === "error" ? "bg-rose-50 text-rose-700 border-rose-200" :
                "bg-amber-50 text-amber-800 border-amber-200"
              }`}>
                <p className="font-semibold">{uploadMessage.text}</p>
                {uploadMessage.details && uploadMessage.details.length > 0 && (
                  <ul className="mt-2 list-disc list-inside text-xs space-y-1 opacity-90 max-h-32 overflow-y-auto">
                    {uploadMessage.details.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                )}
              </div>
            )}

            <div className="mb-6 flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">Download Template</h3>
                <p className="text-xs text-slate-500 mt-0.5">Use our predefined Excel format to ensure smooth imports.</p>
              </div>
              <button onClick={handleDownloadTemplate} className="px-4 py-2 bg-white border border-slate-200 text-indigo-600 text-sm font-semibold rounded-lg hover:bg-indigo-50 transition-colors shadow-sm">
                Download .xlsx
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors bg-slate-50/50">
              <svg className="w-10 h-10 text-indigo-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Upload Excel File</h3>
              <p className="text-xs text-slate-500 mb-4">Supports .xlsx and .csv files.</p>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                ref={fileInputRef}
                onChange={(e) => {
                  setUploadFile(e.target.files?.[0] || null);
                  setPreviewData(null);
                }}
                className="hidden"
                id="excel-upload"
              />
              <label htmlFor="excel-upload" className="cursor-pointer inline-block px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 font-semibold text-sm rounded-lg hover:bg-indigo-100 transition-colors">
                Select File
              </label>
              {uploadFile && <p className="mt-3 text-sm font-medium text-emerald-600 break-all">{uploadFile.name}</p>}
            </div>

            {previewData && (
              <div className="mt-8 border-t border-slate-100 pt-6 animate-fade-in">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Preview Extracted Info
                </h3>
                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden mb-6">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-2">Product Name</th>
                        <th className="px-4 py-2">Qty</th>
                        <th className="px-4 py-2 text-right">Unit Price</th>
                        <th className="px-4 py-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {previewData.map((item, i) => (
                        <tr key={i} className="text-slate-700">
                          <td className="px-4 py-2.5 font-medium">{item.productName}</td>
                          <td className="px-4 py-2.5">{item.quantity}</td>
                          <td className="px-4 py-2.5 text-right text-slate-500">₹{item.price}</td>
                          <td className="px-4 py-2.5 text-right font-semibold">₹{(item.price * item.quantity).toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr className="bg-indigo-50/50">
                        <td colSpan={3} className="px-4 py-3 font-bold text-slate-800 text-right">Total Estimated Amount:</td>
                        <td className="px-4 py-3 font-bold text-indigo-600 text-right text-lg">
                          ₹{previewData.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setPreviewData(null)} className="px-4 py-2 text-slate-500 font-semibold text-sm hover:text-slate-700 transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmBulkUpload}
                    disabled={isUploading}
                    className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-sm shadow-md hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-70"
                  >
                    {isUploading ? "Processing..." : "Confirm & Affect Stock"}
                  </button>
                </div>
              </div>
            )}

            {!previewData && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleParseFile}
                  disabled={!uploadFile}
                  className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-70 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
                >
                  Analyze File
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
