"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

type OrderStatus = "pending" | "shipped" | "delivered" | "rejected";
type PaymentMethod = "upi" | "cash" | null;

type Order = {
  id: string;
  retailer: { business_name: string } | null;
  order_items: { quantity: number; price_at_time: number; product?: { id: string; name: string } }[];
  total_amount: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  source: string;
  customer_label: string | null;
  created_at: string;
};

const STATUS_FILTERS: { label: string; value: OrderStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Rejected", value: "rejected" },
];

export default function SellerOrdersPage() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<OrderStatus | "all">("all");

  const fetchOrders = async (filter: OrderStatus | "all") => {
    if (!profile) return;
    setLoading(true);

    let query = supabase
      .from("orders")
      .select(
        "id, total_amount, status, payment_method, source, customer_label, created_at, retailer:users!retailer_id(business_name), order_items(quantity, price_at_time, product:products(id, name))"
      )
      .eq("wholesaler_id", profile.id)
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setOrders((data as unknown as Order[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (profile) fetchOrders(activeFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, activeFilter]);

  const handleFilterClick = (filter: OrderStatus | "all") => {
    setActiveFilter(filter);
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const orderToUpdate = orders.find((o) => o.id === orderId);
    const oldStatus = orderToUpdate?.status;

    // Optimistic update
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
    );
    setError(null);

    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to update status:", updateError);
      setError(`Failed to update status: ${updateError.message}`);
      // Revert optimistic update
      fetchOrders(activeFilter);
    } else if (orderToUpdate && oldStatus !== newStatus) {
      // Handle stock adjustment
      const isApproving = oldStatus === "pending" && (newStatus === "shipped" || newStatus === "delivered");
      const isReverting = (oldStatus === "shipped" || oldStatus === "delivered") && (newStatus === "pending" || newStatus === "rejected");

      if (isApproving || isReverting) {
        for (const item of orderToUpdate.order_items) {
          if (!item.product?.id) continue;
          
          const { data: product } = await supabase
            .from("products")
            .select("stock_quantity")
            .eq("id", item.product.id)
            .single();
            
          if (product) {
            const newStock = isApproving 
              ? Math.max(0, product.stock_quantity - item.quantity)
              : product.stock_quantity + item.quantity;
              
            await supabase
              .from("products")
              .update({ stock_quantity: newStock })
              .eq("id", item.product.id);
          }
        }
      }
    }
  };

  // Group orders by retailer
  const groupedOrders = orders.reduce((acc, order) => {
    const retailerName = order.retailer?.business_name || order.customer_label || "Offline Customer";
    if (!acc[retailerName]) {
      acc[retailerName] = [];
    }
    acc[retailerName].push(order);
    return acc;
  }, {} as Record<string, Order[]>);

  return (
    <DashboardLayout role="seller" pageTitle="Orders">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-800">Incoming Orders</h2>
        <p className="text-sm text-slate-500 mt-0.5">Review and manage orders placed by retailers</p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_FILTERS.map(({ label, value }) => (
          <button
            key={value}
            id={`filter-${value}`}
            onClick={() => handleFilterClick(value)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
              activeFilter === value
                ? "bg-indigo-500 text-white border-indigo-500"
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-rose-600">{error}</div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            {Object.entries(groupedOrders).map(([retailerName, retailerOrders]) => (
              <div key={retailerName} className="mb-6 last:mb-0">
                <div className="bg-slate-100 px-5 py-3 border-y border-slate-200">
                  <h3 className="font-semibold text-slate-800">{retailerName}</h3>
                  <p className="text-xs text-slate-500">{retailerOrders.length} order{retailerOrders.length !== 1 && 's'}</p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-white">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Order ID</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Retailer</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Products</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 bg-white">
                    {retailerOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4 font-mono text-xs text-slate-500">{order.id.slice(0, 8)}…</td>
                        <td className="px-5 py-4 font-medium text-slate-800">
                          {order.retailer?.business_name || order.customer_label || "Offline Customer"}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {order.order_items?.map(item => `${item.product?.name ?? 'Unknown'} (x${item.quantity})`).join(', ') || "No items"}
                        </td>
                        <td className="px-5 py-4 text-slate-600">₹{Number(order.total_amount).toLocaleString()}</td>
                        <td className="px-5 py-4 text-slate-500">
                          {new Date(order.created_at).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-5 py-4">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                              order.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                              order.status === 'shipped' ? 'bg-indigo-50 text-indigo-700' :
                              order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                              'bg-rose-50 text-rose-700'
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </td>
                        <td className="px-5 py-4">
                          {order.source === 'offline' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Paid (OFFLINE)
                            </span>
                          ) : order.status === 'pending' || order.status === 'rejected' ? (
                            <span className="text-slate-400 italic text-xs">—</span>
                          ) : order.payment_method ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Paid ({order.payment_method.toUpperCase()})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-medium border border-amber-100">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            title="No orders yet"
            description="Orders placed by retailers will appear here. Make sure your products are listed."
          />
        )}
      </div>
    </DashboardLayout>
  );
}
