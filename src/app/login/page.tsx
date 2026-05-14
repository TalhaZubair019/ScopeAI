"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { PlusCircle, ArrowRight, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load remembered email and password on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("scopeai_remembered_email");
      const savedPassword = localStorage.getItem("scopeai_remembered_password");
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
      if (savedPassword) {
        setPassword(savedPassword);
      }
    }
  }, []);

  // Active Real-time Sync for Remember Me (Guarantees inputs are locked into storage immediately)
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (rememberMe) {
        if (email) localStorage.setItem("scopeai_remembered_email", email);
        if (password) localStorage.setItem("scopeai_remembered_password", password);
      } else {
        localStorage.removeItem("scopeai_remembered_email");
        localStorage.removeItem("scopeai_remembered_password");
      }
    }
  }, [email, password, rememberMe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.unverified) {
          router.push(`/verify?email=${encodeURIComponent(data.email)}`);
          return;
        }
        throw new Error(data.error || "Authentication failed");
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 relative font-outfit overflow-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Auth Page Background Layers (Copied from root layout for unified aesthetics) */}
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
            ScopeAI
          </h1>
          <p className="text-slate-400 text-sm font-light">
            Log in to access your workspace and continue building.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-[#080808]/80 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl shadow-black/50">
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

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/2 border border-white/10 hover:border-white/20 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white placeholder-slate-600 text-sm rounded-xl pl-11 pr-12 py-3.5 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors active:scale-95"
                  tabIndex={-1}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1 pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer transition-all group-hover:border-white/40"
                />
                <span className="text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors font-normal">
                  Remember me
                </span>
              </label>

              <a
                href="/forgot-password"
                className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 underline-offset-4 hover:underline transition-colors"
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-slate-200 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Log In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Links */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-slate-500 text-sm font-light">
            New to ScopeAI?{" "}
            <Link
              href="/register"
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors hover:underline underline-offset-4"
            >
              Create an account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
