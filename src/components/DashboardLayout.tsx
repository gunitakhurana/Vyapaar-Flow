"use client";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import DisputeModal from "@/components/DisputeModal";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "seller" | "retailer" | "admin";
  pageTitle: string;
  userName?: string;
}

export default function DashboardLayout({
  children,
  role,
  pageTitle,
  userName,
}: DashboardLayoutProps) {
  const { profile } = useAuth();
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const displayName = profile?.business_name || userName || "Demo User";

  // Expose modal trigger to the floating button
  const openDisputeModal = () => setIsDisputeOpen(true);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Topbar title={pageTitle} role={role} userName={displayName} />
        <main className="flex-1 p-4 sm:p-6 relative z-10">{children}</main>
        {role !== "admin" && (
          <div className="fixed bottom-6 right-6 z-50">
            <button 
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all active:scale-95 group font-semibold text-sm"
              onClick={openDisputeModal}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Need Help</span>
            </button>
          </div>
        )}
        <DisputeModal isOpen={isDisputeOpen} onClose={() => setIsDisputeOpen(false)} />
      </div>
    </div>
  );
}
