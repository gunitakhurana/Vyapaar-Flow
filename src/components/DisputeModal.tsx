"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export default function DisputeModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<{ id: string, created_at: string, total_amount: number }[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  useEffect(() => {
    if (isOpen && profile) {
      const fetchOrders = async () => {
        const { data } = await supabase
          .from("orders")
          .select("id, created_at, total_amount")
          .or(`retailer_id.eq.${profile.id},wholesaler_id.eq.${profile.id}`)
          .order("created_at", { ascending: false })
          .limit(10);
        if (data) setOrders(data);
      };
      fetchOrders();
      setMessage(null);
      setDescription("");
      setSelectedOrderId("");
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSubmitting(true);
    setMessage(null);

    const { error } = await supabase
      .from("dispute_tickets")
      .insert({
        created_by: profile.id,
        user_role: profile.role,
        related_order_id: selectedOrderId || null,
        description,
        status: "open"
      });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Ticket submitted successfully. Our team will review it." });
      setTimeout(() => {
        onClose();
      }, 2000);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How can we help?
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {message && (
            <div className={`p-3.5 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
              {message.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Related Order (Optional)</label>
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            >
              <option value="">General Query (No specific order)</option>
              {orders.map(o => (
                <option key={o.id} value={o.id}>
                  Order #{o.id.slice(0,8)} - ₹{o.total_amount.toLocaleString()} ({new Date(o.created_at).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Describe your issue</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide as much detail as possible..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 resize-none"
            ></textarea>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white font-bold rounded-xl transition-all shadow-md active:scale-[0.98]"
            >
              {isSubmitting ? "Submitting..." : "Submit Ticket"}
            </button>
            <p className="text-center text-[11px] text-slate-400 mt-3 px-4">
              Our support team typically responds within 24 hours. Your role and profile info are automatically attached to this ticket.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
