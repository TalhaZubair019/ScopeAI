"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AIProjectPlanner from "./components/AIProjectPlanner";
import RecentProjects from "./components/RecentProjects";
import ChatInterface from "./components/ChatInterface";
import CodeAnalysis from "./components/CodeAnalysis";
import { Project } from "@/lib/types";
import {
  PlusCircle,
  History,
  LayoutGrid,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type TabType = "planner" | "analysis" | "chat";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("planner");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleProjectSaved = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setActiveTab("planner");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="relative font-outfit">
      {/* Header / Nav Decor */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#030303]/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <PlusCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-white to-white/60">
              ScopeAI
            </span>
          </div>

          {/* New Tab Switcher */}
          <div className="hidden md:flex items-center p-1 bg-white/5 border border-white/5 rounded-full">
            <button
              onClick={() => setActiveTab("planner")}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-bold transition-all relative flex items-center gap-2",
                activeTab === "planner"
                  ? "text-black"
                  : "text-slate-400 hover:text-white",
              )}
            >
              {activeTab === "planner" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white rounded-full z-0"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <LayoutGrid className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Architect</span>
            </button>
            <button
              onClick={() => setActiveTab("analysis")}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-bold transition-all relative flex items-center gap-2",
                activeTab === "analysis"
                  ? "text-black"
                  : "text-slate-400 hover:text-white",
              )}
            >
              {activeTab === "analysis" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white rounded-full z-0"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <ShieldCheck className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Analysis</span>
            </button>
            {/* <button
              onClick={() => setActiveTab("chat")}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-bold transition-all relative flex items-center gap-2",
                activeTab === "chat"
                  ? "text-black"
                  : "text-slate-400 hover:text-white",
              )}
            >
              {activeTab === "chat" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white rounded-full z-0"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <MessageSquareText className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Chat</span>
            </button> */}
          </div>
        </div>
      </nav>

      <main
        className={cn(
          "relative z-10 flex flex-col items-center",
          activeTab === "planner" ? "pt-8 md:pt-16 pb-24" : "pt-0 pb-0",
        )}
      >
        {/* Main Content Area with Transitions */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            {activeTab === "planner" ? (
              <motion.div
                key="planner"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
                className="w-full flex flex-col items-center"
              >
                <AIProjectPlanner
                  initialProject={selectedProject}
                  onProjectSaved={handleProjectSaved}
                />

                <div className="w-full max-w-7xl px-6 my-16">
                  <div className="flex items-center gap-3 mb-8">
                    <History className="w-5 h-5 text-indigo-400" />
                    <h2 className="text-2xl font-bold text-white">
                      Recent Artifacts
                    </h2>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>

                  <RecentProjects
                    onSelectProject={handleSelectProject}
                    refreshTrigger={refreshTrigger}
                  />
                </div>
              </motion.div>
            ) : activeTab === "analysis" ? (
              <motion.div
                key="analysis"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                <CodeAnalysis />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                <ChatInterface />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {activeTab === "planner" && (
        <footer className="relative z-10 py-12 border-t border-white/5 text-center">
          <div className="max-w-7xl mx-auto px-6 h-full flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-slate-500 text-sm">
              &copy; 2026 ScopeAI. Crafted with precision for builders.
            </div>
            <div className="flex items-center gap-6 text-slate-500 text-sm">
              <span className="flex items-center gap-1">
                Powered by{" "}
                <span className="text-slate-300 font-semibold tracking-tighter">
                  GROQ
                </span>
              </span>
              <span className="flex items-center gap-1">
                Built with{" "}
                <span className="text-slate-300 font-semibold tracking-tighter">
                  NEXT.JS
                </span>
              </span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
