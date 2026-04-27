"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

type Stats = {
  ordersPlaced: number;
  availableProducts: number;
  pendingDeliveries: number;
};

export default function RetailerDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats>({
    ordersPlaced: 0,
    availableProducts: 0,
    pendingDeliveries: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const fetchStats = async () => {
      const [ordersPlaced, availableProducts, pendingDeliveries] = await Promise.all([
        supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("retailer_id", profile.id),
        supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .gt("stock_quantity", 0),
        supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("retailer_id", profile.id)
          .in("status", ["pending", "processing"]),
      ]);

      setStats({
        ordersPlaced: ordersPlaced.count ?? 0,
        availableProducts: availableProducts.count ?? 0,
        pendingDeliveries: pendingDeliveries.count ?? 0,
      });
      setStatsLoading(false);
    };

    fetchStats();
  }, [profile]);

  const retailerName = profile?.business_name ?? "Retailer";
  const firstName = retailerName.split(" ")[0];

  if (authLoading) {
    return (
      <DashboardLayout role="retailer" pageTitle="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="retailer" pageTitle="Dashboard" userName={retailerName}>
      {/* Welcome */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">
          Welcome, {firstName} 👋
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">Browse wholesale products and manage your orders.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Orders Placed"
          value={statsLoading ? "—" : String(stats.ordersPlaced)}
          color="emerald"
          description="Total orders by you"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatCard
          title="Available Products"
          value={statsLoading ? "—" : String(stats.availableProducts)}
          color="indigo"
          description="From all wholesalers"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
          }
        />
        <StatCard
          title="Pending Deliveries"
          value={statsLoading ? "—" : String(stats.pendingDeliveries)}
          color="amber"
          description="Orders in progress"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/retailer/products"
            id="browse-products-btn"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors group shadow-sm"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Browse Products</p>
              <p className="text-xs text-slate-400">Explore wholesale catalog</p>
            </div>
          </Link>

          <Link
            href="/retailer/orders"
            id="my-orders-btn"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group shadow-sm"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">My Orders</p>
              <p className="text-xs text-slate-400">Track your order history</p>
            </div>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
