interface BadgeProps {
  status: "Pending" | "Accepted" | "Rejected" | "Delivered" | "Processing" | "Shipped";
}

const statusStyles: Record<BadgeProps["status"], string> = {
  Pending: "bg-amber-50 text-amber-600 border-amber-200",
  Accepted: "bg-emerald-50 text-emerald-600 border-emerald-200",
  Processing: "bg-blue-50 text-blue-600 border-blue-200",
  Shipped: "bg-indigo-50 text-indigo-600 border-indigo-200",
  Rejected: "bg-rose-50 text-rose-600 border-rose-200",
  Delivered: "bg-slate-50 text-slate-600 border-slate-200",
};

export default function StatusBadge({ status }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyles[status]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
