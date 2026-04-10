import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  X,
  Activity,
  Zap,
  Lock,
  Boxes,
  Check,
  AlertCircle,
  Copy,
  Edit3,
  FileCode,
  Loader2,
  MessageSquare,
  Paperclip,
  Plus,
  Send,
  ShieldCheck,
  Terminal,
  Trash2,
  User,
  History as HistoryIcon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CodeAuditSession, ChatMessage, ChatAttachment } from "@/lib/types";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ScoreBar = ({
  label,
  score,
  icon: Icon,
  color,
}: {
  label: string;
  score: number;
  icon: any;
  color: string;
}) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center px-1">
      <div className="flex items-center gap-2">
        <Icon className={cn("w-3 h-3", color)} />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          {label}
        </span>
      </div>
      <span className={cn("text-[10px] font-mono font-bold", color)}>
        {score} <span className="text-slate-700">/ 25</span>
      </span>
    </div>
    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${(score / 25) * 100}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={cn(
          "h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]",
          score >= 20
            ? "bg-emerald-500"
            : score >= 12
              ? "bg-amber-500"
              : "bg-red-500",
        )}
      />
    </div>
  </div>
);

const CodeBlock = ({
  language,
  content,
  ...props
}: {
  language: string;
  content: string;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <div className="relative group/code mt-2 mb-4 max-w-full overflow-hidden">
      <div className="absolute top-2 right-3 opacity-0 group-hover/code:opacity-100 transition-opacity z-20">
        <button
          onClick={handleCopy}
          className={cn(
            "p-1 rounded-md border transition-all flex items-center gap-1.5",
            copied
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10",
          )}
        >
          {copied ? (
            <Check className="w-3 h-3" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          <span className="text-[8px] font-bold uppercase tracking-widest">
            {copied ? "Copied" : "Copy"}
          </span>
        </button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language || "javascript"}
        PreTag="div"
        className="rounded-lg bg-black/60! border! border-white/10! p-4! m-0! font-mono text-[12px] overflow-x-auto w-full custom-scrollbar"
        {...props}
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
};

const UserMessageContent = ({
  content,
  customRules,
  onEdit,
  isLastMessage,
}: {
  content: string;
  customRules?: string;
  onEdit?: () => void;
  isLastMessage?: boolean;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <div className="space-y-4">
      {customRules && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl space-y-3 relative overflow-hidden group/rules"
        >
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <ShieldCheck className="w-12 h-12 text-emerald-500/20" />
          </div>
          <div className="flex items-center gap-2 text-[9px] font-bold text-emerald-600 uppercase tracking-[0.2em] relative z-10">
            <Edit3 className="w-3 h-3" />
            Applied_Custom_Rules
          </div>
          <div className="pl-4 border-l border-emerald-500/30">
            <p className="text-[12px] font-mono text-emerald-700 leading-relaxed italic relative z-10">
              "{customRules}"
            </p>
          </div>
        </motion.div>
      )}

      <div className="relative flex flex-col items-end gap-3 group/user-content">
        {content && (
          <div className="w-full text-[13px] font-mono leading-relaxed bg-black/3 p-5 rounded-xl border border-black/5 shadow-inner">
            <pre className="whitespace-pre-wrap">{content}</pre>
          </div>
        )}

        <div className="flex gap-2 relative z-20">
          {isLastMessage && onEdit && (
            <button
              onClick={onEdit}
              className="px-3 py-1.5 rounded-lg border border-black/10 bg-black/5 text-black/50 hover:text-black hover:bg-black/10 transition-all flex items-center gap-2 backdrop-blur-md group/edit-btn shadow-xs"
              title="Neural Re-edit"
            >
              <Edit3 className="w-3.5 h-3.5 group-hover/edit-btn:rotate-12 transition-transform" />
              <span className="text-[9px] font-bold uppercase tracking-widest leading-none">
                Edit
              </span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className={cn(
              "px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 backdrop-blur-md shadow-xs",
              copied
                ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-600 font-bold"
                : "bg-black/5 border-black/10 text-black/50 hover:text-black hover:bg-black/10",
            )}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span className="text-[9px] font-bold uppercase tracking-widest leading-none">
              {copied ? "Copied" : "Copy"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default function CodeAnalysis() {
  const [activeSession, setActiveSession] = useState<CodeAuditSession | null>(
    null,
  );
  const [sessions, setSessions] = useState<CodeAuditSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingFiles, setPendingFiles] = useState<ChatAttachment[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen] = useState(true);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [sessionToDelete, setSessionToDelete] =
    useState<CodeAuditSession | null>(null);
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const [customLogic, setCustomLogic] = useState("");
  const [isFixing, setIsFixing] = useState<string | null>(null);
  const [requestedDepPath, setRequestedDepPath] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const depFileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        formRef.current &&
        !formRef.current.contains(event.target as Node) &&
        isInputExpanded
      ) {
        setIsInputExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isInputExpanded]);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAnalyzing]);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/analyze-code/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    }
  };

  const startNewAudit = () => {
    setActiveSession(null);
    setMessages([]);
    setInput("");
    setPendingFiles([]);
    setError(null);
    setIsInputExpanded(false);
    setCustomLogic("");
  };

  const loadSession = (session: CodeAuditSession) => {
    setActiveSession(session);
    setMessages(session.messages || []);
    setInput("");
    setPendingFiles([]);
    setError(null);
    setIsInputExpanded(false);
    setCustomLogic("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (pendingFiles.length + files.length > 10) {
      setError("Maximum 10 files can be uploaded at a time.");
      return;
    }

    files.forEach((file) => {
      if (file.size > 1024 * 1024 * 2) {
        setError(`${file.name} exceeds 2MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setPendingFiles((prev) => [
          ...prev,
          {
            name: file.name,
            url: content,
            type: file.type,
          },
        ]);
        setError(null);
      };
      reader.readAsText(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isInputExpanded) return;
    if (!input.trim() && pendingFiles.length === 0) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      attachments: [...pendingFiles],
      customRules: customLogic.trim() || undefined,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsAnalyzing(true);
    setError(null);
    setInput("");
    setPendingFiles([]);
    setIsInputExpanded(false);

    try {
      const response = await fetch("/api/analyze-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          customLogic,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Analysis failed");
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.analysis,
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      // Save session
      const title =
        activeSession?.title ||
        (userMessage.attachments?.[0]
          ? userMessage.attachments[0].name
          : userMessage.content.split("\n")[0].substring(0, 30)) ||
        "Code Audit";

      const sessionPayload = {
        _id: activeSession?._id,
        title,
        messages: finalMessages,
      };

      const saveRes = await fetch("/api/analyze-code/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionPayload),
      });

      if (saveRes.ok) {
        const savedSession = await saveRes.json();
        setActiveSession(savedSession);
        fetchSessions();
      }
    } catch (err: any) {
      setError(err.message || "Audit engine interrupted.");
      setMessages(updatedMessages);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEditPrompt = (msg: ChatMessage) => {
    // Restore state
    setInput(msg.content);
    setCustomLogic(msg.customRules || "");
    setPendingFiles(msg.attachments || []);
    setIsInputExpanded(true);

    // Find the index of this message and slice the history
    const messageIndex = messages.findIndex((m) => m === msg);
    if (messageIndex !== -1) {
      // Remove this message and everything after it
      setMessages(messages.slice(0, messageIndex));
    }

    // Auto-focus input
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleFixIssue = async (issueDescription: string | string[]) => {
    const originalMessage = messages.find((m) => m.role === "user");
    const originalCode =
      originalMessage?.attachments?.[0]?.url || originalMessage?.content;

    if (!originalCode) {
      setError("Could not locate original code to apply fix.");
      return;
    }

    setIsFixing(
      Array.isArray(issueDescription) ? "ALL_ISSUES" : issueDescription,
    );
    try {
      const response = await fetch("/api/fix-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          issueDescription,
        }),
      });

      if (!response.ok) throw new Error("Fix generation failed");

      const data = await response.json();

      // Append the fixed code as a new assistant message
      const resolutionTitle = Array.isArray(issueDescription)
        ? "Consolidated Architectural Fix"
        : `Resolution for: ${issueDescription}`;

      // Let ReactMarkdown handle the raw content (which now includes multiple labeled blocks)
      const fixedContent = data.fixedCode.trim();

      const fixedMessage: ChatMessage = {
        role: "assistant",
        content: `### 🛠️ ${resolutionTitle}\n\nHere is the corrected implementation:\n\n${fixedContent}`,
      };

      const finalMessages = [...messages, fixedMessage];
      setMessages(finalMessages);

      // Save the updated session to MongoDB
      if (activeSession) {
        await fetch("/api/analyze-code/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            _id: activeSession._id,
            title: activeSession.title,
            messages: finalMessages,
          }),
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate fix.");
    } finally {
      setIsFixing(null);
    }
  };

  const handleDependencyUploadRequest = (path: string) => {
    setRequestedDepPath(path);
    depFileInputRef.current?.click();
  };

  const handleDepFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !requestedDepPath) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;

      const userMessage: ChatMessage = {
        role: "user",
        content: `Here is the missing dependency you requested for deep analysis (${requestedDepPath}):\n\n\`\`\`\n${content}\n\`\`\`\n\nPlease continue your audit incorporating this new context.`,
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setIsAnalyzing(true);
      setError(null);
      setRequestedDepPath(null);

      try {
        const response = await fetch("/api/analyze-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages,
            customLogic,
          }),
        });

        if (!response.ok) throw new Error("Deep Analysis failed");

        const data = await response.json();
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: data.analysis,
        };

        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);

        if (activeSession) {
          await fetch("/api/analyze-code/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              _id: activeSession._id,
              title: activeSession.title,
              messages: finalMessages,
            }),
          });
        }
      } catch (err: any) {
        setError(err.message || "Audit engine interrupted.");
        setMessages(updatedMessages);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsText(file);
    if (depFileInputRef.current) depFileInputRef.current.value = "";
  };

  const renameSession = async (id: string) => {
    if (!editTitle.trim()) return;
    try {
      const res = await fetch(`/api/analyze-code/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle }),
      });
      if (res.ok) {
        setSessions((prev) =>
          prev.map((s) => (s._id === id ? { ...s, title: editTitle } : s)),
        );
        if (activeSession?._id === id) {
          setActiveSession((prev) =>
            prev ? { ...prev, title: editTitle } : null,
          );
        }
        setEditingSessionId(null);
      }
    } catch (err) {
      console.error("Rename failed", err);
    }
  };

  const deleteSession = async (id: string) => {
    try {
      const res = await fetch(`/api/analyze-code/sessions/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s._id !== id));
        if (activeSession?._id === id) startNewAudit();
        setSessionToDelete(null);
      }
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <div className="w-full flex h-[calc(100vh-80px)] overflow-hidden">
      {/* Sidebar */}
      <motion.div
        animate={{ width: isSidebarOpen ? 280 : 0 }}
        className="h-full bg-black/40 border-r border-white/5 flex flex-col overflow-hidden"
      >
        <div className="p-6">
          <button
            onClick={startNewAudit}
            className="w-full py-3.5 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.05)] active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="text-xs">New Audit</span>
          </button>
        </div>

        <div className="px-6 py-2">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
            <HistoryIcon className="w-3 h-3" />
            SESSIONS
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-hide">
          <AnimatePresence mode="popLayout">
            {sessions.map((session) => (
              <motion.div
                key={session._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={() => loadSession(session)}
                className={cn(
                  "group relative p-3 rounded-lg cursor-pointer transition-all flex items-center gap-3",
                  activeSession?._id === session._id
                    ? "bg-white/10 text-white"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5",
                )}
              >
                <div
                  className={cn(
                    "p-1.5 rounded-md",
                    activeSession?._id === session._id
                      ? "bg-white/10"
                      : "bg-white/5",
                  )}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>

                <div className="flex-1 min-w-0 pr-10">
                  {editingSessionId === session._id ? (
                    <input
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => renameSession(session._id!)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && renameSession(session._id!)
                      }
                      className="w-full bg-transparent border-none outline-none text-xs font-medium focus:ring-0 p-0 text-white"
                    />
                  ) : (
                    <p className="text-xs font-medium truncate">
                      {session.title}
                    </p>
                  )}
                </div>

                <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingSessionId(session._id!);
                      setEditTitle(session.title);
                    }}
                    className="p-1 rounded-md hover:bg-white/10 text-slate-500 hover:text-white transition-all"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSessionToDelete(session);
                    }}
                    className="p-1 rounded-md hover:bg-red-500/10 text-slate-500 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="p-6 border-t border-white/5 bg-black/20">
          <div className="flex items-center justify-between text-[9px] font-bold text-slate-600 uppercase tracking-widest">
            <span>Audit Engine</span>
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              Active
            </span>
          </div>
        </div>
      </motion.div>

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col relative bg-[#050505] min-w-0 overflow-hidden">
        {/* Workspace Header */}
        <div className="px-8 py-4 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md relative z-20">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
              <Terminal className="w-3 h-3" />
              Llama_3.3::Synchronized
            </span>
            <div className="h-4 w-px bg-white/10" />
            <span className="text-[10px] font-bold text-slate-400 truncate max-w-[300px] uppercase tracking-tighter">
              {activeSession ? activeSession.title : "New Architectural Review"}
            </span>
          </div>
        </div>

        {/* Global Grid Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.5"
                  strokeOpacity="0.1"
                />
                <circle cx="0" cy="0" r="1" fill="white" fillOpacity="0.2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          <motion.div
            animate={{ y: ["0%", "100%", "0%"] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 left-0 w-full h-[30%] bg-linear-to-b from-emerald-500/5 to-transparent pointer-events-none"
          />
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-12 space-y-8 scrollbar-hide relative z-10">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center space-y-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative shadow-2xl"
              >
                <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl blur-2xl opacity-20" />
                <Bot className="w-8 h-8 text-white/40 relative z-10" />
              </motion.div>
              <div className="text-center space-y-3">
                <h1 className="text-4xl font-bold text-white tracking-tight">
                  Code Audit{" "}
                  <span className="text-slate-600 font-light text-2xl">
                    Forensics
                  </span>
                </h1>
                <p className="text-slate-500 text-sm max-w-sm mx-auto font-light leading-relaxed">
                  Initialize a structural sweep by pasting source code or
                  uploading architectural components.
                </p>
              </div>
            </div>
          )}

          <AnimatePresence>
            {messages.map((message, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-6 min-w-0",
                  message.role === "user" ? "flex-row-reverse" : "flex-row",
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                    message.role === "user"
                      ? "bg-white border-white"
                      : "bg-black border-white/10",
                  )}
                >
                  {message.role === "user" ? (
                    <User className="w-4 h-4 text-black" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  )}
                </div>

                <div
                  className={cn(
                    "flex flex-col max-w-[85%] min-w-0",
                    message.role === "user" ? "items-end" : "items-start",
                  )}
                >
                  <div className="flex items-center gap-2 mb-2 px-1 text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                    {message.role === "user"
                      ? "Requestor::Client"
                      : "Auditor::Llama_3.3_70B"}
                  </div>

                  <div
                    className={cn(
                      "px-6 py-4 rounded-2xl border transition-all max-w-full overflow-hidden",
                      message.role === "user"
                        ? "bg-white text-black border-white rounded-tr-none shadow-xl"
                        : "bg-white/2 text-slate-300 border-white/5 rounded-tl-none shadow-md",
                    )}
                  >
                    {message.role === "user" ? (
                      <div className="space-y-4">
                        {message.attachments &&
                          message.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 pb-4 border-b border-black/5 mb-4">
                              {message.attachments.map((file, idx) => (
                                <motion.div
                                  key={`${file.name}-${idx}`}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="flex items-center gap-2.5 bg-black/3 border border-black/5 px-4 py-2 rounded-xl group/msg-chip"
                                >
                                  <FileCode className="w-4 h-4 text-emerald-600" />
                                  <span className="text-[11px] font-bold text-black uppercase tracking-wider truncate max-w-[180px]">
                                    {file.name}
                                  </span>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        {(message.content || message.customRules) && (
                          <UserMessageContent
                            content={message.content}
                            customRules={message.customRules}
                            isLastMessage={
                              i ===
                              messages.reduce(
                                (lastIdx, m, idx) =>
                                  m.role === "user" ? idx : lastIdx,
                                -1,
                              )
                            }
                            onEdit={() => handleEditPrompt(message)}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="space-y-8 w-full min-w-0 overflow-x-hidden">
                        <div className="prose prose-invert prose-emerald prose-sm max-w-none w-full min-w-0 overflow-x-hidden">
                          <ReactMarkdown
                            components={{
                              h2: ({ ...props }) => (
                                <h2
                                  className="text-lg font-bold text-white first:mt-0 mt-8 mb-4 flex items-center gap-3 border-l-4 border-emerald-500 pl-4 uppercase tracking-wider font-mono"
                                  {...props}
                                />
                              ),
                              h3: ({ ...props }) => (
                                <h3
                                  className="text-md font-bold text-slate-200 first:mt-0 mt-6 mb-3 flex items-center gap-2 opacity-90 border-b border-white/5 pb-2"
                                  {...props}
                                />
                              ),
                              p: ({ ...props }) => (
                                <p
                                  className="text-slate-400 leading-relaxed mb-4 font-light text-[13.5px]"
                                  {...props}
                                />
                              ),
                              ul: ({ ...props }) => (
                                <ul className="space-y-3 mb-6" {...props} />
                              ),
                              li: ({ children, ...props }: any) => {
                                // Extract text correctly from React children
                                const textContent = React.Children.toArray(
                                  children,
                                )
                                  .map((child: any) =>
                                    typeof child === "string"
                                      ? child
                                      : child?.props?.children || "",
                                  )
                                  .join("");

                                // --- Missing Dependency Tag ---
                                const depMatch = textContent.match(
                                  /\[MISSING_DEPENDENCY:(.*?)\]/,
                                );
                                if (depMatch) {
                                  const depPath = depMatch[1].trim();

                                  return (
                                    <li className="flex flex-col items-start gap-2 text-amber-400/90 text-[13px] mb-4 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 w-full shadow-lg shadow-amber-500/5 min-w-0 overflow-hidden">
                                      <div className="flex items-start gap-3 w-full">
                                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
                                        <span className="leading-relaxed font-bold flex-1 uppercase tracking-wider">
                                          Context Required: {depPath}
                                        </span>
                                      </div>
                                      <div className="mt-3 flex items-center justify-between w-full bg-black/40 p-3 rounded-lg border border-white/5 gap-4">
                                        <span className="text-xs font-mono text-slate-300 flex items-center gap-2 truncate">
                                          <FileCode className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                          <span className="truncate">
                                            {depPath}
                                          </span>
                                        </span>
                                        <button
                                          onClick={() =>
                                            handleDependencyUploadRequest(
                                              depPath,
                                            )
                                          }
                                          disabled={isAnalyzing}
                                          className="px-4 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 disabled:opacity-50 shrink-0"
                                        >
                                          <Paperclip className="w-3 h-3" />
                                          Upload Context
                                        </button>
                                      </div>
                                    </li>
                                  );
                                }

                                // --- Fix Action Tag ---
                                const fixMatch =
                                  textContent.match(/\[FIX_ACTION:(.*?)\]/);

                                if (fixMatch) {
                                  const issueDescription = fixMatch[1].trim();
                                  const cleanText = textContent.replace(
                                    /\[FIX_ACTION:.*?\]/,
                                    "",
                                  );

                                  return (
                                    <li className="flex flex-col items-start gap-2 text-slate-400 text-[13px] mb-4 bg-white/5 p-3 rounded-lg border border-white/10">
                                      <div className="flex items-start gap-3 w-full">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                                        <span className="leading-relaxed font-light flex-1">
                                          {cleanText}
                                        </span>
                                      </div>
                                      <button
                                        onClick={() =>
                                          handleFixIssue(issueDescription)
                                        }
                                        disabled={isFixing !== null}
                                        className="ml-4 mt-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 rounded flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                                      >
                                        {isFixing === issueDescription ||
                                        (Array.isArray(issueDescription) &&
                                          isFixing === "ALL_ISSUES") ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <Zap className="w-3 h-3" />
                                        )}
                                        {isFixing === issueDescription ||
                                        (Array.isArray(issueDescription) &&
                                          isFixing === "ALL_ISSUES")
                                          ? "Generating Fix..."
                                          : "Auto-Fix Issue"}
                                      </button>
                                    </li>
                                  );
                                }

                                return (
                                  <li className="flex items-start gap-3 text-slate-400 text-[13px]">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                    <span className="leading-relaxed font-light">
                                      {props.children}
                                    </span>
                                  </li>
                                );
                              },
                              code: ({
                                inline,
                                className,
                                children,
                                ...props
                              }: any) => {
                                const match = /language-(\w+)/.exec(
                                  className || "",
                                );
                                const content = String(children).replace(
                                  /\n$/,
                                  "",
                                );
                                if (!inline && match)
                                  return (
                                    <CodeBlock
                                      language={match[1]}
                                      content={content}
                                      {...props}
                                    />
                                  );
                                return (
                                  <code
                                    className="bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded font-mono text-[11px]"
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                );
                              },
                              pre: ({ children }: any) => <>{children}</>,
                            }}
                          >
                            {message.content.split("[SCORES]:")[0]}
                          </ReactMarkdown>
                        </div>

                        {/* Fix All Button Integration */}
                        {(() => {
                          const fixActions = Array.from(
                            message.content.matchAll(/\[FIX_ACTION:(.*?)\]/g),
                          ).map((m) => m[1].trim());

                          if (fixActions.length > 1) {
                            return (
                              <div className="mt-8 pt-6 border-t border-white/5 flex justify-center">
                                <button
                                  onClick={() => handleFixIssue(fixActions)}
                                  disabled={isFixing !== null}
                                  className="w-full py-4 bg-linear-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 rounded-xl flex items-center justify-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] transition-all group/fixall disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.05)]"
                                >
                                  {isFixing === "FIX_ALL" ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Zap className="w-4 h-4 group-hover/fixall:scale-110 transition-transform" />
                                  )}
                                  {isFixing === "FIX_ALL"
                                    ? "Synthesizing Master Fix..."
                                    : "Fix All Issues Simultaneously"}
                                </button>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Diagnostic Scores Integration */}
                        {message.content.includes("[SCORES]:") && (
                          <div className="mt-12 pt-8 border-t border-white/10 space-y-12">
                            <div className="flex items-center justify-between mb-8">
                              <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <Activity className="w-4 h-4 text-emerald-500" />
                                Diagnostics Verdict
                              </h3>
                              <span className="text-[10px] font-mono text-slate-600">
                                ENGINE_RATING::STABLE
                              </span>
                            </div>

                            {(() => {
                              try {
                                const scoreString = message.content
                                  .split("[SCORES]:")[1]
                                  .trim();
                                const scores = JSON.parse(scoreString);
                                const totalScore = Object.values(scores).reduce(
                                  (a: any, b: any) => a + b,
                                  0,
                                ) as number;

                                return (
                                  <div className="space-y-12">
                                    {/* Total Score Summary */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center bg-white/2 border border-white/5 p-8 rounded-2xl relative overflow-hidden">
                                      <div className="absolute top-0 right-0 p-4 opacity-5">
                                        <ShieldCheck className="w-24 h-24 text-white" />
                                      </div>

                                      <div className="col-span-1 border-r border-white/5 pr-8">
                                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">
                                          Total_Integrity
                                        </p>
                                        <div className="flex items-baseline gap-2">
                                          <span
                                            className={cn(
                                              "text-5xl font-mono font-bold tracking-tighter",
                                              totalScore >= 80
                                                ? "text-emerald-500"
                                                : totalScore >= 50
                                                  ? "text-amber-500"
                                                  : "text-red-500",
                                            )}
                                          >
                                            {totalScore}
                                          </span>
                                          <span className="text-slate-600 font-mono text-sm">
                                            / 100
                                          </span>
                                        </div>
                                      </div>

                                      <div className="col-span-2 pl-4">
                                        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 mb-4">
                                          <motion.div
                                            initial={{ width: 0 }}
                                            animate={{
                                              width: `${totalScore}%`,
                                            }}
                                            transition={{
                                              duration: 1.5,
                                              ease: "circOut",
                                            }}
                                            className={cn(
                                              "h-full rounded-full",
                                              totalScore >= 80
                                                ? "bg-emerald-500 shadow-[0_0_15px_#10b981]"
                                                : totalScore >= 50
                                                  ? "bg-amber-500 shadow-[0_0_15px_#f59e0b]"
                                                  : "bg-red-500 shadow-[0_0_15px_#ef4444]",
                                            )}
                                          />
                                        </div>
                                        <p className="text-[11px] text-slate-500 leading-relaxed font-light">
                                          Structural integrity is currently
                                          rated as{" "}
                                          <span className="text-white font-bold">
                                            {totalScore >= 80
                                              ? "STABLE"
                                              : totalScore >= 50
                                                ? "DEGRADED"
                                                : "CRITICAL"}
                                          </span>
                                          . The diagnostic engine has calculated
                                          this score based on 4 independent
                                          technical metrics.
                                        </p>
                                      </div>
                                    </div>

                                    <div className="space-y-6">
                                      <p className="text-[9px] font-bold text-slate-700 uppercase tracking-[0.2em] mb-4">
                                        Tactical_Decomposition
                                      </p>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                        <ScoreBar
                                          label="Security_Surface"
                                          score={scores.Security}
                                          icon={Lock}
                                          color="text-emerald-500"
                                        />
                                        <ScoreBar
                                          label="Performance_Load"
                                          score={scores.Performance}
                                          icon={Zap}
                                          color="text-cyan-500"
                                        />
                                        <ScoreBar
                                          label="Maintainability"
                                          score={scores.Maintainability}
                                          icon={Boxes}
                                          color="text-purple-500"
                                        />
                                        <ScoreBar
                                          label="Structural_Stability"
                                          score={scores.Reliability}
                                          icon={Activity}
                                          color="text-rose-500"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              } catch (e) {
                                return null;
                              }
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-6"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border bg-black border-white/10">
                  <Bot className="w-4 h-4 text-emerald-500 animate-pulse" />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                    Auditor::Synthesizing
                  </div>
                  <div className="px-6 py-4 rounded-2xl bg-white/2 border border-white/5 rounded-tl-none flex items-center gap-4">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    <span className="text-xs text-slate-400 font-mono italic">
                      Performing code sweep...
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div
            ref={scrollRef}
            className={cn(
              "transition-all duration-300 shrink-0",
              isInputExpanded ? "h-64" : "h-24",
            )}
          />
        </div>

        {/* Floating Chat Input Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-20 pointer-events-none">
          <div
            className={cn(
              "max-w-4xl mx-auto relative group pointer-events-auto",
              !isInputExpanded && "flex justify-end",
            )}
          >
            {isInputExpanded && (
              <div className="absolute -inset-0.5 bg-linear-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            )}

            <form
              ref={formRef}
              onSubmit={handleAnalyze}
              className={cn(
                "relative transition-all duration-300",
                isInputExpanded
                  ? "bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-3xl overflow-hidden w-full"
                  : "w-auto",
              )}
            >
              {pendingFiles.length > 0 && (
                <div className="px-6 py-4 border-b border-white/5 bg-white/2 flex flex-wrap gap-3">
                  {pendingFiles.map((file, idx) => (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={`${file.name}-${idx}`}
                      className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg group/chip shadow-lg shadow-emerald-500/5 rotate-0 hover:-rotate-1 transition-transform"
                    >
                      <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider truncate max-w-[120px]">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePendingFile(idx)}
                        className="p-1 hover:bg-emerald-500/20 rounded-md text-emerald-500/60 hover:text-red-400 transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                  <div className="flex-1 flex items-center justify-end">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                      {pendingFiles.length} / 10 Files Batch
                    </span>
                  </div>
                </div>
              )}

              <div
                className={cn(
                  "flex items-end gap-2",
                  isInputExpanded ? "p-4" : "",
                )}
              >
                {isInputExpanded && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-all border border-transparent hover:border-white/10"
                      title="Upload Architectural Component"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      multiple
                      accept=".ts,.tsx,.js,.jsx,.py,.go,.java,.c,.cpp,.rs"
                    />
                    <input
                      type="file"
                      ref={depFileInputRef}
                      onChange={handleDepFileUpload}
                      className="hidden"
                      accept=".ts,.tsx,.js,.jsx,.py,.go,.java,.c,.cpp,.rs,.json"
                    />
                  </div>
                )}

                {isInputExpanded && (
                  <div className="flex flex-col flex-1 gap-2 pt-1">
                    <div className="flex items-center gap-2 group/logic px-1">
                      <Edit3 className="w-3 h-3 text-amber-500/50 group-focus-within/logic:text-amber-500 transition-colors" />
                      <input
                        type="text"
                        value={customLogic}
                        onChange={(e) => setCustomLogic(e.target.value)}
                        placeholder="Custom Validation Rules (Optional)..."
                        className="w-full bg-transparent border-none outline-none focus:ring-0 text-amber-500/80 placeholder-slate-700 text-xs font-mono py-1"
                        disabled={isAnalyzing}
                      />
                    </div>
                    <div className="h-px bg-linear-to-r from-white/10 via-white/5 to-transparent w-full" />
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAnalyze();
                        }
                      }}
                      placeholder="Paste source code or drop architectural files here..."
                      className="w-full bg-transparent border-none outline-none focus:ring-0 text-slate-300 placeholder-slate-700 text-sm font-mono py-3 resize-none max-h-[200px] min-h-[44px] scrollbar-hide"
                      disabled={isAnalyzing}
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    if (!isInputExpanded) {
                      e.preventDefault();
                      setIsInputExpanded(true);
                      setTimeout(() => textareaRef.current?.focus(), 100);
                    } else {
                      handleAnalyze();
                    }
                  }}
                  disabled={
                    isInputExpanded
                      ? isAnalyzing ||
                        (!input.trim() && pendingFiles.length === 0)
                      : false
                  }
                  className={cn(
                    "p-3 rounded-xl transition-all duration-300 active:scale-90",
                    isInputExpanded &&
                      (input.trim() || pendingFiles.length > 0) &&
                      !isAnalyzing
                      ? "bg-white text-black shadow-lg shadow-white/5"
                      : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
                    !isInputExpanded &&
                      "w-14 h-14 flex items-center justify-center rounded-full",
                  )}
                >
                  <Send
                    className={cn(
                      "transition-all",
                      !isInputExpanded ? "w-6 h-6 ml-1" : "w-5 h-5",
                    )}
                  />
                </button>
              </div>

              {isInputExpanded && (
                <div className="flex items-center gap-4 px-6 py-2 bg-black/40 border-t border-white/5">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-white/10"
                      />
                    ))}
                  </div>
                  <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest flex-1">
                    Ready for Audit
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Errors */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute bottom-32 left-1/2 -translate-x-1/2 flex items-center gap-3 text-red-400 bg-red-400/10 px-6 py-3 rounded-xl border border-red-400/20 text-xs shadow-2xl backdrop-blur-md"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="font-medium tracking-tight">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {sessionToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="max-w-md w-full bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 shadow-3xl text-center space-y-8 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50" />

              <div className="w-16 h-16 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Delete Session?
                </h3>
                <p className="text-sm text-slate-500 font-light leading-relaxed">
                  You are about to delete{" "}
                  <span className="text-slate-300 font-bold">
                    "{sessionToDelete.title}"
                  </span>
                  .
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => deleteSession(sessionToDelete._id!)}
                  className="w-full py-4 rounded-xl bg-red-500 text-white font-bold text-xs uppercase tracking-widest hover:bg-red-600 transition-all shadow-2xl active:scale-95"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setSessionToDelete(null)}
                  className="w-full py-4 rounded-xl bg-white/5 text-slate-400 font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5 active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
