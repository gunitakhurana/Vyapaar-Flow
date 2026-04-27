"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type Ticket = {
  id: string;
  created_at: string;
  user_role: string;
  description: string;
  status: "open" | "investigating" | "resolved" | "rejected" | "closed";
  admin_notes: string | null;
  resolution: string | null;
  related_order_id: string | null;
  created_by: string;
  user_info?: { business_name: string } | { business_name: string }[];
};

type UserStats = {
  totalOrders: number;
  pastDisputes: number;
  business_name: string;
};

export default function AdminDisputesPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Investigation state
  const [retailerStats, setRetailerStats] = useState<UserStats | null>(null);
  const [wholesalerStats, setWholesalerStats] = useState<UserStats | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [resolutionText, setResolutionText] = useState("");

  const fetchTickets = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("dispute_tickets")
      .select("*, user_info:users!created_by(business_name)")
      .order("created_at", { ascending: false });
    if (data) setTickets(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSelectTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setAdminNotes(ticket.admin_notes || "");
    setResolutionText(ticket.resolution || "");
    setRetailerStats(null);
    setWholesalerStats(null);
    
    // Auto-investigate if not already started
    if (ticket.status === "open") {
       updateTicketStatus(ticket.id, "investigating");
    }

    // Gather history (Flowchart: gather info regarding dispute)
    if (ticket.related_order_id) {
       const { data: order } = await supabase
         .from("orders")
         .select("retailer_id, wholesaler_id")
         .eq("id", ticket.related_order_id)
         .single();
       
       if (order) {
         // Gather Retailer stats
         const { count: retOrders } = await supabase.from("orders").select("id", { count: "exact", head: true }).eq("retailer_id", order.retailer_id);
         const { count: retDisputes } = await supabase.from("dispute_tickets").select("id", { count: "exact", head: true }).eq("created_by", order.retailer_id);
         const { data: retUser } = await supabase.from("users").select("business_name").eq("id", order.retailer_id).single();
         
         setRetailerStats({ 
           totalOrders: retOrders || 0, 
           pastDisputes: retDisputes || 0,
           business_name: retUser?.business_name || "Unknown Retailer"
         });

         // Gather Wholesaler stats
         const { count: wholeOrders } = await supabase.from("orders").select("id", { count: "exact", head: true }).eq("wholesaler_id", order.wholesaler_id);
         const { count: wholeDisputes } = await supabase.from("dispute_tickets").select("id", { count: "exact", head: true }).eq("created_by", order.wholesaler_id);
         const { data: wholeUser } = await supabase.from("users").select("business_name").eq("id", order.wholesaler_id).single();

         setWholesalerStats({ 
           totalOrders: wholeOrders || 0, 
           pastDisputes: wholeDisputes || 0,
           business_name: wholeUser?.business_name || "Unknown Wholesaler"
         });
       }
    }
  };

  const updateTicketStatus = async (id: string, status: Ticket["status"]) => {
    const { error } = await supabase.from("dispute_tickets").update({ status }).eq("id", id);
    if (!error) {
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
      if (selectedTicket?.id === id) setSelectedTicket(prev => prev ? { ...prev, status } : null);
    }
  };

  const handleSaveResolution = async (finalStatus: Ticket["status"]) => {
    if (!selectedTicket) return;
    setIsSaving(true);
    const { error } = await supabase
      .from("dispute_tickets")
      .update({ 
        admin_notes: adminNotes,
        resolution: resolutionText,
        status: finalStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", selectedTicket.id);

    if (!error) {
      fetchTickets();
      setSelectedTicket(null);
    }
    setIsSaving(false);
  };

  return (
    <DashboardLayout role="admin" pageTitle="Dispute Management">
      <div className="flex h-[calc(100vh-140px)] gap-6">
        {/* Ticket List */}
        <div className="w-1/3 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-sm">Active Disputes</h3>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {loading ? (
              <div className="p-10 text-center"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
            ) : tickets.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-400 italic">No tickets found.</div>
            ) : tickets.map(ticket => (
              <button
                key={ticket.id}
                onClick={() => handleSelectTicket(ticket)}
                className={`w-full text-left p-4 hover:bg-violet-50 transition-colors ${selectedTicket?.id === ticket.id ? "bg-violet-50/50 border-r-4 border-violet-500" : ""}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-mono text-slate-400">#{ticket.id.slice(0,8)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    ticket.status === 'open' ? 'bg-amber-100 text-amber-700' :
                    ticket.status === 'investigating' ? 'bg-violet-100 text-violet-700' :
                    ticket.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {ticket.status}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-800 mb-1">
                  {(() => {
                    const info = Array.isArray(ticket.user_info) ? ticket.user_info[0] : ticket.user_info;
                    return info?.business_name || "Unknown User";
                  })()}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-2">{ticket.description}</p>
                <div className="mt-2 text-[10px] text-slate-400 uppercase font-medium">
                  {new Date(ticket.created_at).toLocaleString()} • {ticket.user_role}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Investigation Workspace */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
          {!selectedTicket ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-slate-400">
               <svg className="w-16 h-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
               </svg>
               <p className="text-sm">Select a ticket from the left to start investigation</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full">
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold text-slate-800">Investigation: #{selectedTicket.id.slice(0,8)}</h2>
                    <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-bold uppercase">{selectedTicket.status}</span>
                  </div>
                  <p className="text-sm text-slate-500">
                    Submitted by <span className="font-semibold">
                      {(() => {
                        const info = Array.isArray(selectedTicket.user_info) ? selectedTicket.user_info[0] : selectedTicket.user_info;
                        return info?.business_name;
                      })()}
                    </span> ({selectedTicket.user_role})
                  </p>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-slate-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* User Problem */}
                <section>
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">User Problem & Details</h5>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedTicket.description}</p>
                    {selectedTicket.related_order_id && (
                      <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">Related Order:</span>
                        <span className="text-xs font-mono text-violet-600 font-semibold bg-violet-50 px-2 py-0.5 rounded">#{selectedTicket.related_order_id}</span>
                      </div>
                    )}
                  </div>
                </section>

                {/* History Gathering (Flowchart Logic) */}
                <section>
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Investigation History (Auto-Gathered)</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                      <h6 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Retailer Profile
                      </h6>
                      {retailerStats ? (
                        <div className="space-y-2">
                          <p className="text-xs text-slate-600 font-medium">{retailerStats.business_name}</p>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Total Orders:</span>
                            <span className="font-semibold">{retailerStats.totalOrders}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Dispute History:</span>
                            <span className="font-semibold text-rose-500">{retailerStats.pastDisputes} Tickets</span>
                          </div>
                        </div>
                      ) : <div className="text-[10px] text-slate-400">Loading retailer data...</div>}
                    </div>

                    <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                      <h6 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full"></span> Wholesaler Profile
                      </h6>
                      {wholesalerStats ? (
                        <div className="space-y-2">
                          <p className="text-xs text-slate-600 font-medium">{wholesalerStats.business_name}</p>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Total Orders:</span>
                            <span className="font-semibold">{wholesalerStats.totalOrders}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Dispute History:</span>
                            <span className="font-semibold text-rose-500">{wholesalerStats.pastDisputes} Tickets</span>
                          </div>
                        </div>
                      ) : <div className="text-[10px] text-slate-400">Loading wholesaler data...</div>}
                    </div>
                  </div>
                </section>

                {/* Admin Notes */}
                <section>
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Investigation Notes</h5>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Log findings from investigation here... (internal only)"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 h-24"
                  ></textarea>
                </section>

                {/* Resolution */}
                <section>
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Resolution Decision</h5>
                  <textarea
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    placeholder="Describe the final solution or reason for rejection... (visible to user)"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 h-24"
                  ></textarea>
                </section>
              </div>

              {/* Action Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between gap-4">
                <button
                  onClick={() => handleSaveResolution("rejected")}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-white border border-rose-200 text-rose-600 font-bold rounded-xl text-sm hover:bg-rose-50 transition-colors"
                >
                  Reject Complaint
                </button>
                <div className="flex gap-3">
                   <button
                    onClick={() => handleSaveResolution("investigating")}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-50 transition-colors"
                  >
                    Save Draft
                  </button>
                  <button
                    onClick={() => handleSaveResolution("resolved")}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-violet-600 text-white font-bold rounded-xl text-sm hover:bg-violet-700 transition-all shadow-md active:scale-95"
                  >
                    {isSaving ? "Saving..." : "Execute Solution & Close"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
