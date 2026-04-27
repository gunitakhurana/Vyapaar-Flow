"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OTP flow state
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [enteredOtp, setEnteredOtp] = useState("");

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError("Please enter a valid phone number.");
      return;
    }
    setError(null);
    
    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (enteredOtp !== generatedOtp) {
      setError("Incorrect OTP. Please try again.");
      setLoading(false);
      return;
    }

    // Convert phone number to the dummy email and password format
    const cleanPhone = phone.replace(/\D/g, "");
    const dummyEmail = `+${cleanPhone}@vyapaarflow.local`;
    const dummyPassword = `VF@${cleanPhone}!2026`;

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: dummyEmail,
        password: dummyPassword,
      });

      if (authError || !data.user) {
        // If sign in fails, it likely means they haven't registered this phone number yet
        if (authError?.message.includes("Invalid login credentials")) {
          setError("Account not found. Please create an account first.");
        } else {
          setError(authError?.message ?? "Login failed. Please try again.");
        }
        setLoading(false);
        return;
      }

      // Fetch the actual role from the database profile
      const { data: dbProfile } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      const userRole = dbProfile?.role || data.user.user_metadata?.role;

      if (userRole === "admin") {
        router.push("/admin/disputes");
      } else if (userRole === "wholesaler") {
        router.push("/seller/dashboard");
      } else {
        router.push("/retailer/dashboard");
      }
    } catch (err: any) {
      console.error("Sign-in exception:", err);
      if (err.message === "Failed to fetch") {
        setError("Network error: Could not reach the authentication server. If you are using an ad-blocker (like Brave Shields), please disable it for this site.");
      } else {
        setError(err.message ?? "An unexpected error occurred during login.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md flex items-center justify-center bg-white border border-slate-100">
            <img src="/logo.png" alt="VyapaarFlow Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-2xl font-black text-slate-800 tracking-tight">VyapaarFlow</span>
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          {step === 2 ? (
            /* ── Step 2: Enter OTP ─────────────────────────── */
            <div>
              <div className="flex flex-col items-center py-2 text-center mb-6">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-1">Verify Phone</h2>
                <p className="text-sm text-slate-500">
                  Enter the OTP sent to <span className="font-semibold text-slate-700">{phone}</span>
                </p>
                
                {/* MOCK OTP ALERT - ONLY FOR DEMO PURPOSES */}
                <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl w-full text-left">
                  <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wider mb-1">Test Mode Active</p>
                  <p className="text-sm text-indigo-900">Your mock OTP is: <span className="font-bold text-lg">{generatedOtp}</span></p>
                </div>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleStep2Submit} className="space-y-4">
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-slate-700 mb-1.5 text-center">
                    6-Digit OTP
                  </label>
                  <input
                    id="otp"
                    type="text"
                    maxLength={6}
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center text-xl tracking-[0.5em] text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || enteredOtp.length !== 6}
                  className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors mt-2"
                >
                  {loading ? "Verifying..." : "Verify & Sign In"}
                </button>
              </form>
              
              <button 
                onClick={() => setStep(1)} 
                className="w-full mt-4 text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                Change Phone Number
              </button>
            </div>
          ) : (
            /* ── Step 1: Login form ──────────────────────────────────────────── */
            <>
              <h1 className="text-xl font-bold text-slate-800 mb-1">Welcome back</h1>
              <p className="text-sm text-slate-500 mb-6">Sign in to your account to continue</p>

              {error && (
                <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleStep1Submit} className="space-y-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
                  />
                </div>

                <button
                  id="login-btn"
                  type="submit"
                  className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl text-sm transition-colors mt-2"
                >
                  Send OTP
                </button>
              </form>

              <p className="text-sm text-center text-slate-500 mt-5">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-indigo-600 font-semibold hover:underline">
                  Create one
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
