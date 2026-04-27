import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
          </svg>
        </div>
        <span className="text-3xl font-bold text-white tracking-tight">VyapaarFlow</span>
      </div>

      {/* Tagline */}
      <p className="text-slate-300 text-lg text-center mb-12 max-w-md">
        Connecting wholesalers and retailers for seamless order management.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/login"
          className="px-8 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl text-center transition-colors shadow-lg"
        >
          Login
        </Link>
        <Link
          href="/signup"
          className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl text-center transition-colors"
        >
          Create Account
        </Link>
      </div>

      {/* Feature pills */}
      <div className="flex flex-wrap justify-center gap-3 mt-16">
        {["Seller Dashboard", "Retailer Portal", "Product Management", "Order Tracking"].map((f) => (
          <span key={f} className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-slate-300 text-sm">
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}
