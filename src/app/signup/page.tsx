"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<"wholesaler" | "retailer">("wholesaler");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // OTP flow state
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({ name: "", phone: "", gst: "" });
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [enteredOtp, setEnteredOtp] = useState("");

  const handleStep1Submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const data = new FormData(e.currentTarget);
    const phone = data.get("phone") as string;
    
    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    setFormData({
      name: data.get("name") as string,
      phone: phone,
      gst: data.get("gst") as string,
    });
    setGeneratedOtp(otp);
    setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (enteredOtp !== generatedOtp) {
      setError("Incorrect OTP. Please try again.");
      setLoading(false);
      return;
    }

    // Convert phone number to a valid email format for Supabase Auth
    // Strip non-digits from phone for a clean dummy email
    const cleanPhone = formData.phone.replace(/\D/g, "");
    const dummyEmail = `+${cleanPhone}@vyapaarflow.local`;
    const dummyPassword = `VF@${cleanPhone}!2026`;

    // 1. Call our backend API to bypass the 3/hour email signup rate limit on the free tier
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formData.phone,
          role,
          business_name: formData.name,
          gst_number: formData.gst,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Signup failed");
      }

      // 2. The user is now created (or already existed). 
      // Now we just sign them in using the dummy credentials to get a valid session.
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: dummyEmail,
        password: dummyPassword,
      });

      if (signInError || !data.user) {
        setError(signInError?.message ?? "Auto-login failed after signup. Please try logging in manually.");
        setLoading(false);
        return;
      }

      router.push(role === "wholesaler" ? "/seller/dashboard" : "/retailer/dashboard");
    } catch (err: any) {
      setError(err.message ?? "An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
          </div>
          <span className="text-xl font-bold text-slate-800">VyapaarFlow</span>
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
                  Enter the OTP sent to <span className="font-semibold text-slate-700">{formData.phone}</span>
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
                  {loading ? "Verifying..." : "Verify & Create Account"}
                </button>
              </form>
              
              <button 
                onClick={() => setStep(1)} 
                className="w-full mt-4 text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                Back to details
              </button>
            </div>
          ) : (
            /* ── Step 1: Signup form ──────────────────────────────────────────── */
            <>
              <h1 className="text-xl font-bold text-slate-800 mb-1">Create an account</h1>
              <p className="text-sm text-slate-500 mb-6">Join VyapaarFlow to start trading smarter</p>

              {/* Role Selector */}
              <div className="flex rounded-xl border border-slate-200 p-1 mb-6 bg-slate-50">
                {(["wholesaler", "retailer"] as const).map((r) => (
                  <button
                    key={r}
                    id={`signup-role-${r}`}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors capitalize ${
                      role === r
                        ? "bg-white text-slate-800 shadow-sm border border-slate-200"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {r === "wholesaler" ? "Wholesaler" : "Retailer"}
                  </button>
                ))}
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleStep1Submit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Business Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Your business name"
                    defaultValue={formData.name}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="e.g. 9876543210"
                    defaultValue={formData.phone}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="gst" className="block text-sm font-medium text-slate-700 mb-1.5">
                    GST Number
                  </label>
                  <input
                    id="gst"
                    name="gst"
                    type="text"
                    placeholder="e.g. 22AAAAA0000A1Z5"
                    defaultValue={formData.gst}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors uppercase"
                  />
                </div>

                <button
                  id="signup-btn"
                  type="submit"
                  className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl text-sm transition-colors mt-2"
                >
                  Send OTP
                </button>
              </form>

              <p className="text-sm text-center text-slate-500 mt-5">
                Already have an account?{" "}
                <Link href="/login" className="text-indigo-600 font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
