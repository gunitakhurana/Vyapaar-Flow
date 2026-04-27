"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

type Stats = {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  lowStockItems: number;
  pendingPayments: Record<string, number>;
};

export default function SellerDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    lowStockItems: 0,
    pendingPayments: {},
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const fetchStats = async () => {
      const [products, orders, pendingOrders, lowStock, pendingPaymentsData] = await Promise.all([
        supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("wholesaler_id", profile.id),
        supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("wholesaler_id", profile.id),
        supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("wholesaler_id", profile.id)
          .eq("status", "pending"),
        supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("wholesaler_id", profile.id)
          .lt("stock_quantity", 10),
        supabase
          .from("orders")
          .select("total_amount, status, payment_method, source, retailer:users!retailer_id(business_name)")
          .eq("wholesaler_id", profile.id)
          .is("payment_method", null)
          .neq("source", "offline")
      ]);

      const pendingPaymentOrders = pendingPaymentsData.data?.filter(
        (o: any) => o.status !== 'pending' && o.status !== 'rejected' && o.status !== 'cancelled' && o.source !== 'offline'
      ) || [];

      const pendingByRetailer = pendingPaymentOrders.reduce((acc, order) => {
        // Handle cases where Supabase might return an array for joined fields in TS
        const retailer = Array.isArray(order.retailer) ? order.retailer[0] : order.retailer;
        const name = retailer?.business_name || "Unknown Retailer";
        acc[name] = (acc[name] || 0) + Number(order.total_amount);
        return acc;
      }, {} as Record<string, number>);

      setStats({
        totalProducts: products.count ?? 0,
        totalOrders: orders.count ?? 0,
        pendingOrders: pendingOrders.count ?? 0,
        lowStockItems: lowStock.count ?? 0,
        pendingPayments: pendingByRetailer,
      });
      setStatsLoading(false);
    };

    fetchStats();
  }, [profile]);

  const sellerName = profile?.business_name ?? "Wholesaler";
  const firstName = sellerName.split(" ")[0];

  if (authLoading) {
    return (
      <DashboardLayout role="seller" pageTitle="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="seller" pageTitle="Dashboard" userName={sellerName}>
      {/* Welcome */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">
          Good morning, {firstName} 👋
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">Here&apos;s your business overview for today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Products"
          value={statsLoading ? "—" : String(stats.totalProducts)}
          color="indigo"
          description="Listed in catalog"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
          }
        />
        <StatCard
          title="Total Orders"
          value={statsLoading ? "—" : String(stats.totalOrders)}
          color="emerald"
          description="Received so far"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatCard
          title="Pending Orders"
          value={statsLoading ? "—" : String(stats.pendingOrders)}
          color="amber"
          description="Awaiting your action"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Low Stock Items"
          value={statsLoading ? "—" : String(stats.lowStockItems)}
          color="rose"
          description="Below 10 units"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/seller/add-product"
            id="quick-add-product"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group shadow-sm"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Add Product</p>
              <p className="text-xs text-slate-400">Add to your catalog</p>
            </div>
          </Link>

          <Link
            href="/seller/products"
            id="quick-view-products"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group shadow-sm"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">View Products</p>
              <p className="text-xs text-slate-400">Manage your inventory</p>
            </div>
          </Link>

          <Link
            href="/seller/orders"
            id="quick-view-orders"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors group shadow-sm"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">View Orders</p>
              <p className="text-xs text-slate-400">Track incoming orders</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Pending Payments Section */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Pending Payments by Retailer</h3>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {statsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : Object.keys(stats.pendingPayments).length > 0 ? (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-50">
                {Object.entries(stats.pendingPayments)
                  .sort(([, a], [, b]) => b - a)
                  .map(([retailerName, amount]) => (
                  <tr key={retailerName} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-slate-800">{retailerName}</td>
                    <td className="px-5 py-4 text-right text-rose-600 font-semibold">₹{amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center">
              <div className="mx-auto w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-slate-600 font-medium">All caught up!</p>
              <p className="text-sm text-slate-400 mt-1">There are no pending payments from your retailers.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
