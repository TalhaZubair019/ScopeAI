"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { PlusCircle, ArrowRight, Lock, Loader2, AlertCircle, Eye, EyeOff, CheckCircle2, ShieldCheck } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams?.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass1, setShowPass1] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Password Criteria Validations
  const satisfiesLength = password.length >= 8;
  const satisfiesUppercase = /[A-Z]/.test(password);
  const satisfiesNumber = /[0-9]/.test(password);
  const satisfiesSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = satisfiesLength && satisfiesUppercase && satisfiesNumber && satisfiesSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isPasswordValid) {
      setError("Please meet all password validation criteria.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update password. Please try again.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#080808]/80 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl shadow-black/50">
      {success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center space-y-4 py-2"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white">Password Updated</h2>
            <p className="text-slate-400 text-sm font-light leading-relaxed">
              Your password has been successfully changed. You can now log in with your new credentials.
            </p>
          </div>
          <a
            href="/login"
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-slate-200 transition-all active:scale-[0.98]"
          >
            <span>Proceed to Log In</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      ) : (
        <>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3 text-red-400 text-sm leading-snug"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Password Field */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-1">
                Create New Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  required
                  type={showPass1 ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/2 border border-white/10 hover:border-white/20 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white placeholder-slate-600 text-sm rounded-xl pl-11 pr-12 py-3.5 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass1(!showPass1)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPass1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Dynamic Requirement Checklist */}
              <div className="mt-3 space-y-2 px-2 py-1 border-b border-white/5 pb-4 mb-2">
                {[
                  { l: "At least 8 characters", m: satisfiesLength },
                  { l: "One uppercase letter", m: satisfiesUppercase },
                  { l: "One number", m: satisfiesNumber },
                  { l: "One special character", m: satisfiesSpecial },
                ].map((c, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 transition-all duration-300">
                    <div 
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        c.m ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-slate-700"
                      }`} 
                    />
                    <span className={`text-[11px] font-medium tracking-wide transition-all duration-300 ${
                      c.m ? "text-emerald-400/90" : "text-slate-500"
                    }`}>
                      {c.l}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-1">
                Confirm Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  required
                  type={showPass2 ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/2 border border-white/10 hover:border-white/20 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white placeholder-slate-600 text-sm rounded-xl pl-11 pr-12 py-3.5 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass2(!showPass2)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPass2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-slate-200 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Resetting Password...</span>
                </>
              ) : (
                <>
                  <span>Reset Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const email = searchParams?.get("email") || "";

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 relative font-outfit overflow-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Auth Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-[1400px] bg-[radial-gradient(circle_at_50%_-20%,rgba(120,119,198,0.2),rgba(255,255,255,0))] blur-[80px]" />
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] left-[5%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(#ffffff 0.5px, transparent 0.5px)`,
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        {/* Branding */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-4">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            New Password
          </h1>
          {email && (
            <p className="text-slate-500 text-xs font-light">
              Setting a new credential for <span className="text-indigo-400 font-medium">{email}</span>
            </p>
          )}
        </div>

        <ResetPasswordForm />
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
