interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: "indigo" | "emerald" | "amber" | "rose" | "blue" | "violet";
  description?: string;
}

const colorMap: Record<StatCardProps["color"], { bg: string; icon: string; text: string }> = {
  indigo: { bg: "bg-indigo-50", icon: "bg-indigo-100 text-indigo-600", text: "text-indigo-600" },
  emerald: { bg: "bg-emerald-50", icon: "bg-emerald-100 text-emerald-600", text: "text-emerald-600" },
  amber: { bg: "bg-amber-50", icon: "bg-amber-100 text-amber-600", text: "text-amber-600" },
  rose: { bg: "bg-rose-50", icon: "bg-rose-100 text-rose-600", text: "text-rose-600" },
  blue: { bg: "bg-blue-50", icon: "bg-blue-100 text-blue-600", text: "text-blue-600" },
  violet: { bg: "bg-violet-50", icon: "bg-violet-100 text-violet-600", text: "text-violet-600" },
};

export default function StatCard({ title, value, icon, color, description }: StatCardProps) {
  const colors = colorMap[color];
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colors.icon}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
    </div>
  );
}
