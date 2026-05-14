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

      setSuccessMessage("Project saved successfully.");
      if (onProjectSaved) onProjectSaved();
    } catch (err: any) {
      setSaveError(err.message || "Failed to save project. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto pt-4 pb-8 px-6">
      {/* Minimal Hero Section */}
      <div className="text-center mb-8 space-y-2.5">
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-white">
          Plan your next project
        </h1>

        <p className="text-neutral-400 text-sm md:text-base max-w-xl mx-auto font-normal">
          Describe your product goal and instantly map out a complete, actionable development plan.
        </p>
      </div>

      {/* Streamlined Command Bar */}
      <form onSubmit={handleGenerate} className="w-full max-w-2xl">
        <div className="relative bg-neutral-900/40 border border-neutral-800 rounded-2xl overflow-hidden transition-all duration-300 focus-within:border-neutral-700 focus-within:bg-neutral-900/60 shadow-[0_2px_20px_rgba(0,0,0,0.3)]">
          {/* Clean Options Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-neutral-800 bg-neutral-950/30">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
                  Start Date:
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-xs text-indigo-400 hover:text-indigo-300 outline-none cursor-pointer transition-colors"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSkipWeekends(!skipWeekends)}
              className={cn(
                "flex items-center gap-2 px-2.5 py-1 rounded-md border text-[10px] font-medium uppercase tracking-wider transition-all duration-200",
                skipWeekends
                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                  : "bg-neutral-800/50 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300",
              )}
            >
              <div
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  skipWeekends ? "bg-indigo-400" : "bg-neutral-600",
                )}
              />
              Skip Weekends
            </button>
          </div>

          {/* Prompt Input */}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What are you building? (e.g. A modern SaaS dashboard with dark mode and Stripe integrations)"
            className="w-full bg-transparent px-6 py-5 text-white placeholder-neutral-600 outline-none focus:ring-0 text-base min-h-[120px] resize-none font-normal leading-relaxed"
            disabled={isLoading}
          />

          {/* Action Footer */}
          <div className="flex items-center justify-between p-4 px-6 border-t border-neutral-800 bg-neutral-950/20">
            <div className="text-[11px] text-neutral-500 flex items-center gap-1.5">
              <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isLoading ? "bg-indigo-500" : "bg-neutral-700")} />
              {isLoading ? "Analyzing goals..." : "Ready to map"}
            </div>

            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className={cn(
                "px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
                isLoading
                  ? "bg-neutral-800 text-neutral-500"
                  : "bg-white text-black hover:bg-neutral-200 active:scale-98",
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  <span>Planning...</span>
                </>
              ) : (
                <>
                  <span>Generate Plan</span>
                  <ArrowRight className="w-4 h-4" />
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
                    Generated
                  </div>
                </div>
                <p className="text-slate-500 text-lg font-light">
                  Your technical roadmap is ready.
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
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Project</span>
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
                    Project Map
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
                      Diagram Pending
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
