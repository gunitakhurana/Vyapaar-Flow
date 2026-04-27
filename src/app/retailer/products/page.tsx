"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  gst_percent: number;
  wholesaler_id: string;
  wholesaler: { business_name: string } | null;
};

type CartItem = {
  product: Product;
  quantity: number;
};

export default function RetailerProductsPage() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "price_asc" | "price_desc">("default");
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error: fetchError } = await supabase
        .from("products")
        .select("id, name, price, stock_quantity, gst_percent, wholesaler_id, wholesaler:users!wholesaler_id(business_name)")
        .gt("stock_quantity", 0)
        .order("name");

      if (fetchError) {
        setError(fetchError.message);
      } else {
        const rows = (data as unknown as Product[]) ?? [];
        setProducts(rows);
        setFiltered(rows);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  // Client-side search and sort filter
  useEffect(() => {
    let result = products;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.wholesaler?.business_name.toLowerCase().includes(q)
      );
    }

    if (sortBy === "price_asc") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    setFiltered(result);
  }, [searchQuery, sortBy, products]);

  const handleQuantityChange = (productId: string, delta: number) => {
    setSelectedQuantities(prev => {
      const current = prev[productId] || 1;
      const newQty = Math.max(1, current + delta);
      return { ...prev, [productId]: newQty };
    });
  };

  const handleAddToCart = (product: Product) => {
    const qty = selectedQuantities[product.id] || 1;
    if (qty > product.stock_quantity) {
      alert(`Only ${product.stock_quantity} items available in stock.`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [...prev, { product, quantity: qty }];
    });
    
    // Reset local quantity back to 1
    setSelectedQuantities(prev => ({ ...prev, [product.id]: 1 }));
    setSuccessMessage(`Added ${qty}x ${product.name} to cart.`);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleCheckout = async () => {
    if (!profile) {
      alert("Error: User profile not loaded. Please refresh the page or log in again.");
      return;
    }
    if (cart.length === 0) return;
    setIsCheckingOut(true);

    // Group cart items by Wholesaler
    const cartByWholesaler = cart.reduce((acc, item) => {
      const wid = item.product.wholesaler_id;
      if (!acc[wid]) acc[wid] = [];
      acc[wid].push(item);
      return acc;
    }, {} as Record<string, CartItem[]>);

    let hasError = false;
    let errorMessage = "";

    // Create a separate order for each wholesaler
    for (const [wholesalerId, items] of Object.entries(cartByWholesaler)) {
      const totalAmount = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

      // 1. Create Order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          wholesaler_id: wholesalerId,
          retailer_id: profile.id,
          total_amount: totalAmount,
          status: "pending",
          source: "online",
        })
        .select("id")
        .single();

      if (orderError || !order) {
        console.error("Order creation failed for wholesaler", wholesalerId, orderError);
        hasError = true;
        errorMessage += `Order Error: ${orderError?.message || "Unknown error"}\n`;
        continue;
      }

      // 2. Insert Order Items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price_at_time: item.product.price,
      }));

      const { error: itemError } = await supabase.from("order_items").insert(orderItems);

      if (itemError) {
        console.error("Order items insertion failed for order", order.id, itemError);
        hasError = true;
        errorMessage += `Item Error: ${itemError.message}\n`;
      }
    }

    setIsCheckingOut(false);
    if (!hasError) {
      setCart([]);
      setIsCartOpen(false);
      setSuccessMessage("All orders placed successfully! View them in 'My Orders'.");
      setTimeout(() => setSuccessMessage(""), 4000);
    } else {
      alert(`There was an error checking out:\n${errorMessage}`);
    }
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Render grouped cart view
  const cartByWholesaler = cart.reduce((acc, item) => {
    const businessName = item.product.wholesaler?.business_name || "Unknown Wholesaler";
    if (!acc[businessName]) acc[businessName] = [];
    acc[businessName].push(item);
    return acc;
  }, {} as Record<string, CartItem[]>);

  const grandTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  return (
    <DashboardLayout role="retailer" pageTitle="Browse Products">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Product Catalog</h2>
          <p className="text-sm text-slate-500 mt-0.5">Browse products from all wholesalers and add to cart</p>
        </div>
        
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Cart
          {totalCartItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
              {totalCartItems}
            </span>
          )}
        </button>
      </div>

      {successMessage && (
        <div className="mb-6 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-medium flex items-center gap-2 animate-fade-in">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMessage}
        </div>
      )}

      {/* Search and Sort bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            id="product-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products or wholesaler..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors bg-white"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "default" | "price_asc" | "price_desc")}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors bg-white cursor-pointer"
        >
          <option value="default">Sort by: Default</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="p-8 text-center text-sm text-rose-600">{error}</div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => {
            const qty = selectedQuantities[product.id] || 1;
            
            return (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col hover:border-emerald-200 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-800 text-sm mb-1">{product.name}</h3>
                <p className="text-xs text-slate-400 mb-3">by {product.wholesaler?.business_name ?? "—"}</p>
                <div className="flex items-center justify-between mb-1 mt-auto">
                  <span className="text-lg font-bold text-slate-800">₹{Number(product.price).toLocaleString()}</span>
                  <span className="text-xs text-slate-400">GST {product.gst_percent}%</span>
                </div>
                <div className="flex items-center mb-4">
                  <span className="text-xs font-medium text-emerald-600">
                    {product.stock_quantity} in stock
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                    <button 
                      onClick={() => handleQuantityChange(product.id, -1)}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold transition-colors"
                    >
                      -
                    </button>
                    <div className="px-3 py-1.5 text-sm font-semibold text-center min-w-[2.5rem]">
                      {qty}
                    </div>
                    <button 
                      onClick={() => handleQuantityChange(product.id, 1)}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  id={`add-to-cart-${product.id}`}
                  onClick={() => handleAddToCart(product)}
                  className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-sm font-semibold rounded-xl transition-colors"
                >
                  Add to Cart
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
              </svg>
            }
            title={searchQuery ? "No matching products" : "No products available"}
            description={
              searchQuery
                ? "Try a different search term."
                : "Wholesalers haven't listed any products yet. Check back later."
            }
          />
        </div>
      )}

      {/* Shopping Cart Drawer / Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
            
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Your Cart
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {cart.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-slate-500 font-medium">Your cart is empty</p>
                  <button onClick={() => setIsCartOpen(false)} className="mt-4 text-emerald-600 text-sm font-semibold hover:underline">
                    Continue browsing
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-amber-50 text-amber-800 text-xs px-3 py-2 rounded-lg border border-amber-200">
                    <strong>Note:</strong> Items from different wholesalers will be processed as separate orders automatically.
                  </div>
                  
                  {Object.entries(cartByWholesaler).map(([wholesalerName, items]) => {
                    const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
                    return (
                      <div key={wholesalerName} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Wholesaler:</span>
                          <span className="ml-2 text-sm font-semibold text-slate-800">{wholesalerName}</span>
                        </div>
                        <ul className="divide-y divide-slate-100">
                          {items.map((item) => (
                            <li key={item.product.id} className="p-4 flex gap-3">
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-slate-800">{item.product.name}</h4>
                                <div className="text-xs text-slate-500 mt-1 flex justify-between">
                                  <span>{item.quantity} x ₹{item.product.price}</span>
                                  <span className="font-semibold text-slate-700">₹{(item.quantity * item.product.price).toLocaleString()}</span>
                                </div>
                              </div>
                              <button onClick={() => handleRemoveFromCart(item.product.id)} className="text-rose-400 hover:text-rose-600 self-center p-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </li>
                          ))}
                        </ul>
                        <div className="bg-slate-50 px-4 py-3 flex justify-between items-center border-t border-slate-100">
                          <span className="text-xs font-semibold text-slate-500">Order Subtotal</span>
                          <span className="text-sm font-bold text-slate-800">₹{subtotal.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-slate-200 p-5 bg-white shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-semibold text-slate-500">Grand Total</span>
                  <span className="text-xl font-bold text-emerald-600">₹{grandTotal.toLocaleString()}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-70 text-white font-bold rounded-xl transition-colors text-sm shadow-sm flex justify-center items-center gap-2"
                >
                  {isCheckingOut ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing Orders...
                    </>
                  ) : (
                    `Checkout All Orders (₹${grandTotal.toLocaleString()})`
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
