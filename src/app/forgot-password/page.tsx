"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { PlusCircle, ArrowLeft, Mail, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 relative font-outfit overflow-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Auth Page Background Layers */}
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
            <PlusCircle className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Reset Password
          </h1>
          <p className="text-slate-400 text-sm font-light">
            Enter your email and we'll send instructions to reset your credentials.
          </p>
        </div>

        {/* Form Card */}
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
                <h2 className="text-lg font-bold text-white">Check your email</h2>
                <p className="text-slate-400 text-sm font-light leading-relaxed px-2">
                  A secure password reset link has been successfully sent to <span className="text-white font-medium">{email}</span>. Please check your inbox and click the link to complete the process.
                </p>
              </div>

              <a
                href="/login"
                className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/10 hover:text-white transition-all active:scale-[0.98]"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Log In
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
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-1">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      required
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/2 border border-white/10 hover:border-white/20 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white placeholder-slate-600 text-sm rounded-xl pl-11 pr-4 py-3.5 outline-none transition-all"
                    />
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
                      <span>Sending link...</span>
                    </>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer Links */}
        {!success && (
          <div className="text-center mt-8">
            <a
              href="/login"
              className="text-slate-500 hover:text-slate-300 text-sm font-light inline-flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Log In</span>
            </a>
          </div>
        )}
      </motion.div>
    </div>
  );
}
