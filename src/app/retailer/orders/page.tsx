"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

type OrderStatus = "pending" | "shipped" | "delivered" | "rejected";
type PaymentMethod = "upi" | "cash" | null;

type Order = {
  id: string;
  wholesaler: { business_name: string } | null;
  order_items: { quantity: number; price_at_time: number; product: { name: string } | null }[];
  total_amount: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  created_at: string;
};

const STATUS_FILTERS: { label: string; value: OrderStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Rejected", value: "rejected" },
];

const STATUS_BADGE_MAP: Record<OrderStatus, string> = {
  pending: "Pending",
  shipped: "Shipped",
  delivered: "Delivered",
  rejected: "Rejected",
};

export default function RetailerOrdersPage() {
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
        "id, total_amount, status, payment_method, created_at, wholesaler:users!wholesaler_id(business_name), order_items(quantity, price_at_time, product:products(name))"
      )
      .eq("retailer_id", profile.id)
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

  const updatePaymentMethod = async (orderId: string, method: "upi" | "cash") => {
    // Optimistic update
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, payment_method: method } : order))
    );
    setError(null);

    const { error: updateError } = await supabase
      .from("orders")
      .update({ payment_method: method })
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to update payment method:", updateError);
      setError(`Failed to update payment method: ${updateError.message}`);
      // Revert optimistic update
      fetchOrders(activeFilter);
    }
  };

  return (
    <DashboardLayout role="retailer" pageTitle="My Orders">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">My Orders</h2>
          <p className="text-sm text-slate-500 mt-0.5">Track all orders you have placed with wholesalers</p>
        </div>
        <Link
          href="/retailer/products"
          id="place-new-order-btn"
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Place New Order
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_FILTERS.map(({ label, value }) => (
          <button
            key={value}
            id={`retailer-filter-${value}`}
            onClick={() => setActiveFilter(value)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
              activeFilter === value
                ? "bg-emerald-500 text-white border-emerald-500"
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
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-rose-600">{error}</div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Order ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Wholesaler</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Products</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-slate-500">{order.id.slice(0, 8)}…</td>
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {order.wholesaler?.business_name ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {order.order_items?.map(item => `${item.product?.name ?? 'Unknown'} (x${item.quantity})`).join(', ') || "No items"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">₹{Number(order.total_amount).toLocaleString()}</td>
                    <td className="px-5 py-4 text-slate-500">
                      {new Date(order.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={STATUS_BADGE_MAP[order.status] ?? "Pending"} />
                    </td>
                    <td className="px-5 py-4">
                      {order.status === 'pending' || order.status === 'rejected' ? (
                        <span className="text-slate-400 italic text-xs">—</span>
                      ) : order.payment_method ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Paid ({order.payment_method.toUpperCase()})
                        </span>
                      ) : (
                        <select
                          onChange={(e) => updatePaymentMethod(order.id, e.target.value as "upi" | "cash")}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
                          defaultValue=""
                        >
                          <option value="" disabled>Pay Now</option>
                          <option value="upi">Pay via UPI</option>
                          <option value="cash">Pay via Cash</option>
                        </select>
                      )}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            title="No orders placed yet"
            description="Browse the product catalog and place your first order with a wholesaler."
            action={
              <Link
                href="/retailer/products"
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Browse Products
              </Link>
            }
          />
        )}
      </div>
    </DashboardLayout>
  );
}
