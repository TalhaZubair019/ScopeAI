"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  ArrowRight,
  Loader2,
  AlertCircle,
  Mail,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Track countdown timer for resends
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Autoselect first input box on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (element: HTMLInputElement, index: number) => {
    const value = element.value;
    if (isNaN(Number(value))) return; // only accept numbers

    const newOtp = [...otp];
    // Capture only the last character entered (keeps 1 char limit)
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-advance to next box
    if (newOtp[index] !== "" && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if filled completely, and trigger submit
    if (newOtp.every((char) => char !== "")) {
      handleVerification(newOtp.join(""));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      // If active box is empty, go back one and clear it
      if (otp[index] === "" && index > 0 && inputRefs.current[index - 1]) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text").trim();

    // Check if the pasted block is fully numeric and 6 digits
    if (/^\d{6}$/.test(pastedText)) {
      const digits = pastedText.split("");
      setOtp(digits);
      // Focus last box
      inputRefs.current[5]?.focus();
      // Attempt automated verification
      handleVerification(pastedText);
    }
  };

  const handleVerification = async (finalCode?: string) => {
    const code = finalCode || otp.join("");
    if (code.length !== 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    if (!email) {
      setError("No target email specified. Please register again.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification failed. Please check the code.");
      }

      setSuccess("Welcome aboard! Your email has been verified.");
      
      // Small timer before entry
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
    setResending(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Resend attempt failed.");
      }

      setSuccess("A fresh code has been dispatched to your inbox!");
      setCooldown(30); // 30-second throttle
      
      // Reset inputs
      setOtp(new Array(6).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center space-y-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4"
        >
          <Mail className="w-8 h-8" />
        </motion.div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Check your email
        </h1>
        <p className="text-slate-400 text-sm font-light px-4 leading-relaxed">
          We sent a 6-digit verification code to <br />
          <span className="text-indigo-400 font-semibold break-all">
            {email || "your inbox"}
          </span>
        </p>
      </div>

      <div className="relative bg-[#09090b]/60 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-3xl shadow-3xl overflow-hidden">
        {/* Design Accents */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-8">
          {/* Inputs Block */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest text-center block mb-6">
              ENTER 6-DIGIT CODE
            </label>
            <div className="flex justify-between gap-2 md:gap-3">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  name="otp-field"
                  maxLength={1}
                  value={data}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  onChange={(e) => handleChange(e.target, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={handlePaste}
                  disabled={isLoading}
                  className="w-12 h-14 md:w-14 md:h-16 text-center text-xl font-bold bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                />
              ))}
            </div>
          </div>

          {/* Notifications */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-light"
              >
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-light"
              >
                <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Confirm Button */}
          <button
            type="button"
            onClick={() => handleVerification()}
            disabled={isLoading || otp.some((d) => d === "")}
            className={cn(
              "w-full py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed",
              isLoading
                ? "bg-slate-800 text-slate-500"
                : "bg-white text-black hover:bg-slate-100 shadow-[0_0_30px_rgba(255,255,255,0.05)]"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Verify Code</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          {/* Resend Handler */}
          <div className="text-center space-y-2 pt-2">
            <p className="text-xs text-slate-500 font-light">
              Didn&apos;t receive the email?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || resending}
                className={cn(
                  "font-bold underline transition-colors ml-1",
                  cooldown > 0 || resending
                    ? "text-slate-700 no-underline cursor-not-allowed"
                    : "text-indigo-400 hover:text-indigo-300"
                )}
              >
                {resending
                  ? "Requesting..."
                  : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : "Resend now"}
              </button>
            </p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors font-light"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Registration
        </Link>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen w-full bg-[#020203] flex flex-col justify-center items-center py-12 px-6 overflow-x-hidden relative selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-purple-500/5 blur-[120px]" />
      </div>

      {/* Header Logo */}
      <div className="flex items-center gap-2 mb-8 shrink-0">
        <div className="p-1.5 rounded-xl bg-white/5 border border-white/10">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
        </div>
        <span className="font-mono font-bold text-xs text-white uppercase tracking-[0.3em]">
          ScopeAI
        </span>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        }
      >
        <VerifyForm />
      </Suspense>
    </div>
  );
}
