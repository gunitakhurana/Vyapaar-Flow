import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NeedHelpButton({ userRole, orderId }: { userRole: "retailer" | "wholesaler"; orderId?: string }) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    const { error } = await supabase.from("dispute_tickets").insert({
      description,
      user_role: userRole,
      related_order_id: orderId || null,
    });
    setSubmitting(false);
    if (error) setError(error.message);
    else {
      setSuccess(true);
      setDescription("");
      setOpen(false);
    }
  };

  return (
    <>
      <button
        className="fixed bottom-6 right-6 z-50 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
        onClick={() => setOpen(true)}
        aria-label="Need Help"
      >
        <span className="text-2xl font-bold">?</span>
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl relative">
            <button className="absolute top-2 right-2 text-slate-400 hover:text-slate-700" onClick={() => setOpen(false)}>&times;</button>
            <h2 className="text-lg font-bold mb-3">Submit a Dispute Ticket</h2>
            <form onSubmit={handleSubmit}>
              <textarea
                className="w-full border border-slate-200 rounded-lg p-3 mb-4 text-sm"
                rows={4}
                placeholder="Describe your problem..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg disabled:opacity-60"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
              {error && <div className="mt-2 text-rose-600 text-sm">{error}</div>}
              {success && <div className="mt-2 text-emerald-600 text-sm">Ticket submitted!</div>}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
