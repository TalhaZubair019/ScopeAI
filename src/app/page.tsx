"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type TabType = "planner" | "analysis" | "chat";

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("planner");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  // Rehydrate state on mount
  useEffect(() => {
    // Fetch user info
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
        }
      })
      .catch((err) => console.error("Failed to load user", err));

    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlTab = urlParams.get("tab") as TabType;
      if (urlTab && ["planner", "analysis", "chat"].includes(urlTab)) {
        setActiveTab(urlTab);
      } else {
        const savedTab = localStorage.getItem("scopeai_active_tab") as TabType;
        if (savedTab && ["planner", "analysis", "chat"].includes(savedTab)) {
          setActiveTab(savedTab);
        }
      }
    }
  }, []);

  // Save state to URL and localStorage on change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("scopeai_active_tab", activeTab);
      const url = new URL(window.location.href);
      url.searchParams.set("tab", activeTab);
      
      // Clean up inactive parameters to keep URL sharp and clean
      if (activeTab !== "chat") url.searchParams.delete("chatId");
      if (activeTab !== "analysis") url.searchParams.delete("auditId");
      
      window.history.replaceState(null, "", url.toString());
    }
  }, [activeTab]);

  const handleProjectSaved = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setActiveTab("planner");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <div className="relative font-outfit">
      {/* Header / Nav Decor */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#030303]/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <PlusCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-white to-white/60 hidden md:inline-block">
              ScopeAI
            </span>
          </div>

          {/* New Tab Switcher */}
          <div className="flex items-center p-1 bg-white/5 border border-white/5 rounded-full overflow-x-auto scrollbar-hide max-w-[65vw]">
            <button
              onClick={() => setActiveTab("planner")}
              className={cn(
                "px-3 md:px-6 py-2 rounded-full text-xs md:text-sm font-bold transition-all relative flex items-center gap-1.5 md:gap-2 whitespace-nowrap",
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
                "px-3 md:px-6 py-2 rounded-full text-xs md:text-sm font-bold transition-all relative flex items-center gap-1.5 md:gap-2 whitespace-nowrap",
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
            <button
              onClick={() => setActiveTab("chat")}
              className={cn(
                "px-3 md:px-6 py-2 rounded-full text-xs md:text-sm font-bold transition-all relative flex items-center gap-1.5 md:gap-2 whitespace-nowrap",
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
            </button>
          </div>

          {/* User Profile & Logout Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/2 border border-white/5 rounded-lg">
                <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <UserIcon className="w-3 h-3 text-indigo-400" />
                </div>
                <span className="text-xs font-bold text-slate-300 max-w-[100px] truncate uppercase tracking-widest">
                  {user.name.split(" ")[0]}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Log Out"
              className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-red-500/10 hover:border-red-500/20 text-slate-400 hover:text-red-400 transition-all group"
            >
              <LogOut className="w-4 h-4 group-active:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </nav>

      <main
        className={cn(
          "relative z-10 flex flex-col items-center",
          activeTab === "planner" ? "pt-2 md:pt-4 pb-12" : "pt-0 pb-0",
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

                <div className="w-full max-w-7xl px-6 my-8">
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
