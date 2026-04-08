import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderLock,
  Calendar,
  ArrowUpRight,
  Trash2,
  ExternalLink,
  Layers,
} from "lucide-react";
import { Project } from "@/lib/types";

interface RecentProjectsProps {
  onSelectProject: (project: Project) => void;
  refreshTrigger: number;
}

const RecentProjects: React.FC<RecentProjectsProps> = ({
  onSelectProject,
  refreshTrigger,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, [refreshTrigger]);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/projects?id=${id}`, {
        method: "DELETE",
      });
      if (response.ok) fetchProjects();
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[200px] rounded-3xl bg-white/5 animate-pulse border border-white/5"
          />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 rounded-3xl bg-white/2 border border-dashed border-white/10">
        <FolderLock className="w-12 h-12 text-slate-700 mb-4" />
        <p className="text-slate-500 font-light max-w-xs text-center">
          No project artifacts archived yet. Start a new plan to begin your
          collection.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence mode="popLayout">
        {projects.map((project, i) => (
          <motion.div
            key={project._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            layout
            onClick={() => onSelectProject(project)}
            className="group relative cursor-pointer"
          >
            {/* Background Decor */}
            <div className="absolute inset-0 bg-linear-to-br from-indigo-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative h-full p-8 rounded-3xl bg-white/3 backdrop-blur-md border border-white/5 hover:border-white/20 transition-all shadow-xl group-hover:shadow-indigo-500/10 flex flex-col justify-between overflow-hidden">
              {/* Corner Icon */}
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/30 transition-all duration-700" />

              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-indigo-500 group-hover:border-indigo-400 group-hover:text-white text-slate-400 transition-all">
                    <Layers className="w-5 h-5" />
                  </div>

                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={(e) => deleteProject(e, project._id)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="p-2 rounded-lg bg-white/10 text-white hover:bg-white hover:text-black transition-all shadow-lg">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-amber-200 transition-colors line-clamp-2 leading-snug">
                  {project.prompt}
                </h3>

                <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mb-6">
                  {project.tasks.length} Modules Architecturalized
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-4">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(project.createdAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                    hour12: true,
                  })}
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-indigo-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all">
                  Load Blueprint <ArrowUpRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default RecentProjects;
