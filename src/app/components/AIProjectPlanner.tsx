import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Save,
  ArrowRight,
  Terminal,
  LayoutGrid,
} from "lucide-react";
import TaskTimeline from "./TaskTimeline";
import Mermaid from "./Mermaid";
import { Task, Project } from "@/lib/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AIProjectPlannerProps {
  initialProject?: Project | null;
  onProjectSaved?: () => void;
}

const AIProjectPlanner: React.FC<AIProjectPlannerProps> = ({
  initialProject,
  onProjectSaved,
}) => {
  const [prompt, setPrompt] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [flowchart, setFlowchart] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [skipWeekends, setSkipWeekends] = useState(false);
  const [totalDays, setTotalDays] = useState(0);

  useEffect(() => {
    if (initialProject) {
      setPrompt(initialProject.prompt);
      setTasks(initialProject.tasks);
      setFlowchart(initialProject.flowchart || "");
      setSuccessMessage(null);
      setError(null);
      setSaveError(null);
    }
  }, [initialProject]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    setTasks([]);
    setFlowchart("");

    try {
      const response = await fetch("/api/generate-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, startDate, skipWeekends }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate tasks");
      }

      const data = await response.json();

      // Handle both { tasks: [], flowchart: "" } and fallback to flat tasks array
      if (Array.isArray(data)) {
        setTasks(data);
        setFlowchart("");
      } else {
        setTasks(data.tasks || []);
        setFlowchart(data.flowchart || "");
        setTotalDays(data.totalDays || 0);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (tasks.length === 0 || !prompt.trim()) return;

    setIsSaving(true);
    setSaveError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/create-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, tasks, flowchart }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save project");
      }

      setSuccessMessage("Project architecture archived successfully.");
      if (onProjectSaved) onProjectSaved();
    } catch (err: any) {
      setSaveError(err.message || "Failed to save project. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-5xl mx-auto py-12 px-6">
      {/* Search Header */}
      <div className="text-center mb-16 space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest"
        >
          <Sparkles className="w-3 h-3" />
          Powered by Intelligence
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight">
          Architect Your <br />
          <span className="bg-clip-text text-transparent bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400">
            Next Big Idea
          </span>
        </h1>

        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-light">
          Elevate your vision from a simple sentence to a comprehensive,
          actionable technical roadmap instantly.
        </p>
      </div>

      {/* Input Section - The Command Center */}
      <form onSubmit={handleGenerate} className="w-full max-w-3xl relative">
        <div className="absolute -inset-0.5 bg-linear-to-r from-indigo-500/30 to-purple-500/30 rounded-3xl blur-xl opacity-50" />
        <div className="relative bg-[#09090b]/80 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-3xl">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5 bg-white/2">
            <Terminal className="w-4 h-4 text-slate-500" />
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              System::OmniScope_v4.0.1
            </span>
            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest hidden md:inline">
                  Start Date::
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-[10px] text-indigo-400 outline-none cursor-pointer font-mono"
                />
              </div>
              <button
                type="button"
                onClick={() => setSkipWeekends(!skipWeekends)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-lg border transition-all",
                  skipWeekends
                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                    : "bg-white/5 border-white/10 text-slate-500 hover:bg-white/10",
                )}
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    skipWeekends
                      ? "bg-indigo-400 shadow-[0_0_8px_#818cf8]"
                      : "bg-slate-700",
                  )}
                />
                <span className="text-[9px] font-bold uppercase tracking-widest leading-none">
                  Skip Weekends
                </span>
              </button>
              <div className="flex gap-1.5 border-l border-white/5 pl-4 ml-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20" />
              </div>
            </div>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your project goal... (e.g., 'A decentralized financial dashboard with real-time analytics and multi-wallet support.')"
            className="w-full bg-transparent px-8 py-6 text-white placeholder-slate-600 outline-none focus:ring-0 text-xl min-h-[160px] resize-none font-light leading-relaxed"
            disabled={isLoading}
          />

          <div className="flex items-center justify-between p-4 px-8 border-t border-white/5 bg-white/2">
            <div className="text-xs text-slate-500 flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              AI Engine Ready
            </div>

            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className={cn(
                "group relative overflow-hidden px-10 py-3 rounded-full font-bold transition-all duration-500 flex items-center gap-2 active:scale-95",
                isLoading
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-white text-black hover:bg-slate-100 shadow-[0_0_20px_rgba(255,255,255,0.1)]",
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <span>Initialize Plan</span>
                  <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute -bottom-14 left-0 right-0 flex justify-center"
            >
              <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-full border border-red-400/20 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Results Section */}
      <AnimatePresence mode="wait">
        {tasks.length > 0 && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="w-full mt-24"
          >
            <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-12 border-b border-white/5 pb-8">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-bold text-white tracking-tight">
                    Project Architecture
                  </h2>
                  <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold tracking-widest">
                    Optimized
                  </div>
                </div>
                <p className="text-slate-500 text-lg font-light">
                  Verification completed. Plan is ready for deployment.
                </p>
              </div>

              <button
                onClick={handleCreateProject}
                disabled={isSaving}
                className={cn(
                  "group relative overflow-hidden px-8 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-3 transform hover:-translate-y-1 active:scale-95",
                  isSaving
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-linear-to-r from-emerald-500 to-teal-600 text-white shadow-2xl shadow-emerald-500/20",
                )}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Archiving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Blueprint</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </>
                )}
              </button>
            </div>

            <TaskTimeline tasks={tasks} totalDays={totalDays} />

            {/* Architecture Flowchart Section */}
            <div className="w-full mt-24">
              <div className="flex items-center gap-3 mb-10 border-b border-white/5 pb-6">
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <LayoutGrid className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold text-white tracking-tight leading-none">
                      Flow Analysis
                    </h3>
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">
                    Architectural Visualization v4.2
                  </p>
                </div>
                <div className="h-px flex-[0.5] bg-white/5 ml-4" />
              </div>

              {flowchart ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                >
                  <Mermaid chart={flowchart} />
                </motion.div>
              ) : (
                <div className="w-full h-48 rounded-2xl border border-dashed border-white/10 flex items-center justify-center bg-white/2 overflow-hidden relative group">
                  <div className="absolute inset-0 bg-linear-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex flex-col items-center gap-3 text-slate-500">
                    <LayoutGrid className="w-8 h-8 animate-pulse text-purple-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      Flow Analysis Pending
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-12 flex flex-col items-center">
              <AnimatePresence>
                {saveError && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-red-400 bg-red-400/5 px-6 py-3 rounded-xl border border-red-400/10 mb-4"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {saveError}
                  </motion.div>
                )}
                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 text-emerald-400 bg-emerald-400/5 px-8 py-4 rounded-2xl border border-emerald-400/10 shadow-2xl shadow-emerald-500/5 font-medium"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                    {successMessage}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State / Instructional */}
      <AnimatePresence>
        {!isLoading && tasks.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-20 flex flex-col items-center gap-8"
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-3xl">
              {[
                { title: "SaaS Platform", desc: "Multi-tenant architecture" },
                { title: "Mobile App", desc: "Cross-platform vision" },
                { title: "E-Commerce", desc: "Secure checkout systems" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-white/2 border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all group cursor-pointer"
                  onClick={() =>
                    setPrompt(
                      `Plan a ${item.title} centered around ${item.desc}`,
                    )
                  }
                >
                  <p className="text-white font-bold mb-1 group-hover:text-indigo-400 transition-colors uppercase text-[10px] tracking-widest">
                    {item.title}
                  </p>
                  <p className="text-slate-500 text-xs font-light">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIProjectPlanner;
