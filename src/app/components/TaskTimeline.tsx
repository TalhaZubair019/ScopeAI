import React from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Layout,
  Code2,
  Database,
  Rocket,
  ShieldCheck,
  Cpu,
} from "lucide-react";
import { Task } from "@/lib/types";

interface TaskTimelineProps {
  tasks: Task[];
}

const getTaskIcon = (index: number) => {
  const icons = [
    <Layout className="w-5 h-5 text-indigo-400" />,
    <Code2 className="w-5 h-5 text-purple-400" />,
    <Database className="w-5 h-5 text-blue-400" />,
    <ShieldCheck className="w-5 h-5 text-emerald-400" />,
    <Cpu className="w-5 h-5 text-pink-400" />,
    <Rocket className="w-5 h-5 text-amber-400" />,
  ];
  return icons[index % icons.length];
};

const TaskTimeline: React.FC<TaskTimelineProps> = ({ tasks }) => {
  return (
    <div className="w-full relative py-8">
      {/* Connector Line */}
      <div className="absolute left-[26px] top-4 bottom-4 w-0.5 bg-linear-to-b from-indigo-500/50 via-purple-500/20 to-transparent md:left-1/2 md:-ml-0.5" />

      <div className="space-y-12 relative">
        {tasks.map((task, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`relative flex flex-col md:flex-row items-center gap-8 ${
              index % 2 === 0 ? "md:flex-row-reverse" : ""
            }`}
          >
            {/* Desktop Side Info */}
            <div className="hidden md:block w-1/2 text-right">
              <div
                className={`${index % 2 === 0 ? "text-left" : "text-right"}`}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/2 border border-white/5 text-slate-500 text-[10px] font-bold uppercase tracking-tighter">
                  Phase 0{index + 1}
                </div>
              </div>
            </div>

            {/* Icon Marker */}
            <div className="absolute left-0 md:relative md:left-auto z-20 w-14 h-14 rounded-2xl bg-[#09090b] border border-white/10 flex items-center justify-center shadow-2xl shadow-indigo-500/10 group-hover:border-indigo-500/40 transition-colors">
              <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl blur-lg" />
              {getTaskIcon(index)}

              {/* Vertical Progress Line Overlay */}
              <div className="absolute -bottom-12 left-1/2 -ml-px w-[2px] h-12 bg-white/5 md:hidden" />
            </div>

            {/* Content Card */}
            <div className="w-full pl-16 md:pl-0 md:w-1/2">
              <div className="p-6 rounded-3xl bg-white/3 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all group overflow-hidden relative shadow-2xl">
                {/* Glow Effect */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/5 rounded-full blur-[60px] group-hover:bg-indigo-500/10 transition-all" />

                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors flex items-center gap-3">
                  {task.task_name}
                  {index === 0 && (
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-md border border-indigo-500/20 animate-pulse">
                      CRITICAL
                    </span>
                  )}
                </h3>

                <p className="text-slate-400 text-sm leading-relaxed mb-6 font-light">
                  {task.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs font-medium border-t border-white/5 pt-4">
                  <div className="flex items-center gap-1.5 text-indigo-400/80">
                    <Calendar className="w-4 h-4" />
                    <span>{task.due_date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Clock className="w-4 h-4" />
                    <span>Duration: {task.duration}</span>
                  </div>
                  <div className="ml-auto">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500/40" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* End Node */}
      <motion.div
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        className="mt-20 flex justify-center"
      >
        <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center animate-spin-slow">
          <Circle className="w-4 h-4 text-slate-700" />
        </div>
      </motion.div>
    </div>
  );
};

export default TaskTimeline;
