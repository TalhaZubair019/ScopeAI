import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  User,
  Loader2,
  Sparkles,
  Trash2,
  Plus,
  MessageSquare,
  History,
  Paperclip,
  Image as ImageIcon,
  FileText,
  X,
  ChevronRight,
  Download,
  Edit2,
  Check,
  Copy,
} from "lucide-react";
import { ChatMessage, ChatSession, ChatAttachment } from "@/lib/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(content);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = content;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand("copy");
        } catch (err) {
          console.error("Fallback copy failed", err);
        }
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <div className="relative group/code mt-4 mb-6">
      <div className="absolute top-3 right-4 opacity-0 group-hover/code:opacity-100 transition-opacity z-20">
        <button
          onClick={handleCopy}
          className={cn(
            "p-1.5 rounded-md border transition-all flex items-center gap-2",
            copied
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10",
          )}
          title="Copy Code"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          <span className="text-[9px] font-bold uppercase tracking-widest">
            {copied ? "Copied" : "Copy"}
          </span>
        </button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language}
        PreTag="div"
        className="rounded-xl bg-black/60! border! border-white/5! p-6! m-0! font-mono text-[13px] scrollbar-hide"
        {...props}
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
};

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<ChatAttachment[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Edit State (Messages)
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  // Session Edit State
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [sessionEditTitle, setSessionEditTitle] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setIsSessionsLoading(true);
      const res = await fetch("/api/chat");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    } finally {
      setIsSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Restore active session on mount
  useEffect(() => {
    if (sessions.length > 0 && !activeChatId && messages.length === 0) {
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const urlChatId = urlParams.get("chatId");
        const savedChatId = urlChatId || localStorage.getItem("scopeai_active_chat");
        
        if (savedChatId) {
          const sessionToRestore = sessions.find((s) => s._id === savedChatId);
          if (sessionToRestore) {
            loadSession(sessionToRestore);
          }
        }
      }
    }
  }, [sessions, activeChatId, messages.length]);

  // Save active session to localStorage and URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (activeChatId) {
        localStorage.setItem("scopeai_active_chat", activeChatId);
        url.searchParams.set("chatId", activeChatId);
      } else {
        localStorage.removeItem("scopeai_active_chat");
        url.searchParams.delete("chatId");
      }
      window.history.replaceState(null, "", url.toString());
    }
  }, [activeChatId]);

  const adjustHeight = (ref: React.RefObject<HTMLTextAreaElement | null>) => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${Math.min(ref.current.scrollHeight, 180)}px`;
    }
  };

  useEffect(() => {
    adjustHeight(textareaRef);
  }, [input]);

  useEffect(() => {
    if (editingIndex !== null) {
      adjustHeight(editRef);
    }
  }, [editContent, editingIndex]);

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    processFiles(Array.from(files));
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const processFiles = (files: File[]) => {
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setPendingFiles((prev) => [
          ...prev,
          {
            name: file.name || "pasted-image.png",
            type: file.type,
            url: base64,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const syncMessage = async (targetMessages: ChatMessage[]) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: targetMessages,
          chatId: activeChatId,
        }),
      });

      if (!response.ok) throw new Error("Request failed");

      const data = await response.json();
      setMessages((prev) => [...prev, data.message]);

      if (!activeChatId && data.chatId) {
        setActiveChatId(data.chatId);
        fetchSessions();
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "system", content: "Failed to connect. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => adjustHeight(textareaRef), 0);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && pendingFiles.length === 0) || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      attachments: pendingFiles,
    };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput("");
    setPendingFiles([]);
    await syncMessage(currentMessages);
  };

  const startEditing = (index: number, content: string) => {
    setEditingIndex(index);
    setEditContent(content);
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditContent("");
  };

  const saveEdit = async () => {
    if (editingIndex === null || !editContent.trim()) return;

    // Truncate messages to the edited one
    const updatedMessages = messages.slice(0, editingIndex);
    const editedMessage: ChatMessage = {
      ...messages[editingIndex],
      content: editContent,
    };

    const finalMessages = [...updatedMessages, editedMessage];
    setMessages(finalMessages);
    setEditingIndex(null);
    setEditContent("");

    await syncMessage(finalMessages);
  };

  const handleKeyDown = (e: React.KeyboardEvent, onConfirm: () => void) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onConfirm();
    }
    if (e.key === "Escape") {
      cancelEditing();
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setActiveChatId(null);
    setInput("");
    setPendingFiles([]);
    setEditingIndex(null);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsMobileSidebarOpen(false);
    }
  };

  const loadSession = async (session: ChatSession) => {
    if (session._id === activeChatId) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/chat?id=${session._id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        setActiveChatId(session._id as string);
        setEditingIndex(null);
        if (typeof window !== "undefined" && window.innerWidth < 1024) {
          setIsMobileSidebarOpen(false);
        }
      }
    } catch (err) {
      console.error("Failed to load session", err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/chat?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s._id !== id));
        if (activeChatId === id) startNewChat();
      }
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  // Logic to find if this is the latest USER message
  const findLastUserIndex = () => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") return i;
    }
    return -1;
  };

  const lastUserIndex = findLastUserIndex();

  const startEditingSession = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingSessionId(session._id as string);
    setSessionEditTitle(session.title);
  };

  const cancelEditingSession = () => {
    setEditingSessionId(null);
    setSessionEditTitle("");
  };

  const saveSessionTitle = async (id: string) => {
    if (!sessionEditTitle.trim()) return;
    try {
      const res = await fetch("/api/chat", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, title: sessionEditTitle }),
      });
      if (res.ok) {
        setSessions((prev) =>
          prev.map((s) =>
            s._id === id ? { ...s, title: sessionEditTitle } : s,
          ),
        );
        setEditingSessionId(null);
        setSessionEditTitle("");
      }
    } catch (err) {
      console.error("Failed to save session title", err);
    }
  };

  return (
    <div className="w-full flex h-[calc(100dvh-64px)] overflow-hidden relative">
      {/* Sidebar */}
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col fixed inset-y-0 left-0 z-50 lg:relative w-72 h-full border-r border-white/5 bg-black/20 p-6 space-y-6 transition-transform duration-300",
          isMobileSidebarOpen
            ? "translate-x-0 pointer-events-auto"
            : "-translate-x-full lg:translate-x-0 pointer-events-none lg:pointer-events-auto",
        )}
      >
        <div className="space-y-4">
          <button
            onClick={startNewChat}
            className="w-full py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-200 font-medium flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide pt-4">
          <div className="flex items-center gap-2 px-2 mb-4">
            <History className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Sessions
            </span>
          </div>

          <AnimatePresence>
            {sessions.map((session) => (
              <motion.div
                key={session._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={() => loadSession(session)}
                className={cn(
                  "group flex items-center justify-between gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all border",
                  activeChatId === session._id
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-transparent border-transparent text-slate-500 hover:bg-white/5 hover:text-slate-300",
                )}
              >
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                  <MessageSquare
                    className={cn(
                      "w-3.5 h-3.5 shrink-0",
                      activeChatId === session._id
                        ? "text-indigo-400"
                        : "text-slate-600",
                    )}
                  />
                  {editingSessionId === session._id ? (
                    <input
                      autoFocus
                      value={sessionEditTitle}
                      onChange={(e) => setSessionEditTitle(e.target.value)}
                      onBlur={() => saveSessionTitle(session._id as string)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          saveSessionTitle(session._id as string);
                        if (e.key === "Escape") cancelEditingSession();
                        e.stopPropagation();
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-transparent text-xs text-white outline-none w-full border-b border-indigo-500/50 pb-0.5"
                    />
                  ) : (
                    <span className="text-xs truncate font-medium">
                      {session.title}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => startEditingSession(e, session)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-white/5 text-slate-600 hover:text-indigo-400 transition-all"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => deleteSession(session._id as string, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-500/10 text-slate-600 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isSessionsLoading && sessions.length === 0 && (
            <div className="p-4 text-center">
              <Loader2 className="w-4 h-4 animate-spin mx-auto text-slate-600" />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col relative bg-[#030303] min-w-0 overflow-hidden">
        <div className="px-6 py-3.5 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-md relative z-20">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {sessions.find((s) => s._id === activeChatId)?.title ||
                "Chat Workspace"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="lg:hidden">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-2 rounded-lg bg-white/5 border border-white/5 text-slate-400"
                title="History"
              >
                <History className="w-4 h-4" />
              </button>
            </div>
            <div className="lg:hidden">
              <button
                onClick={startNewChat}
                className="p-2 rounded-lg bg-white/5 border border-white/5 text-slate-400"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {activeChatId && (
              <button
                onClick={startNewChat}
                className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all flex items-center gap-2"
                title="Close Session"
              >
                <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest">
                  Close
                </span>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-5 md:px-12 space-y-6 scrollbar-hide relative z-10">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="w-12 h-12 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-center shadow-sm">
                <MessageSquare className="w-5 h-5 text-neutral-400" />
              </div>

              <div className="space-y-2 text-center">
                <h1 className="text-2xl font-medium text-white tracking-tight">
                  Chat Workspace
                </h1>
                <p className="text-neutral-500 text-sm max-w-sm mx-auto font-normal leading-relaxed">
                  Ask anything or provide documentation to explore your project.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg pt-4">
                {[
                  {
                    t: "Analyze Screenshot",
                    d: "Upload an image and let's review the code.",
                  },
                  {
                    t: "Analyze Document",
                    d: "Ask questions about your technical spec PDFs.",
                  },
                ].map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(s.d)}
                    className="px-5 py-4 rounded-xl bg-neutral-900/40 border border-neutral-800 text-left group hover:bg-neutral-800/50 hover:border-neutral-700 transition-all active:scale-[0.99]"
                  >
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 group-hover:text-neutral-200 transition-colors">
                      {s.t}
                    </p>
                    <p className="text-neutral-500 text-xs leading-relaxed font-normal">
                      {s.d}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className={cn(
                  "flex w-full gap-6 group/msg",
                  message.role === "user" ? "flex-row-reverse" : "flex-row",
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                    message.role === "user"
                      ? "bg-white border-white shadow-md"
                      : "bg-black border-white/10",
                  )}
                >
                  {message.role === "user" ? (
                    <User className="w-4 h-4 text-black" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  )}
                </div>

                <div
                  className={cn(
                    "flex flex-col max-w-[85%] md:max-w-[75%]",
                    message.role === "user" ? "items-end" : "items-start",
                  )}
                >
                  <div className="flex items-center gap-3 mb-2 px-1">
                    <div
                      className={cn(
                        "text-[9px] font-bold text-slate-600 uppercase tracking-widest",
                        message.role === "user" ? "text-right" : "text-left",
                      )}
                    >
                      {message.role === "user" ? "You" : "ScopeAI"}
                    </div>
                    {message.role === "user" &&
                      index === lastUserIndex &&
                      !isLoading &&
                      editingIndex !== index && (
                        <button
                          onClick={() => startEditing(index, message.content)}
                          className="opacity-0 group-hover/msg:opacity-100 p-1 hover:bg-white/5 rounded text-slate-600 hover:text-indigo-400 transition-all"
                          title="Edit Message"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                  </div>

                  <div
                    className={cn(
                      "flex flex-col gap-3",
                      message.role === "user" ? "items-end" : "items-start",
                    )}
                  >
                    {message.attachments && message.attachments.length > 0 && (
                      <div
                        className={cn(
                          "flex flex-wrap gap-2 mb-1",
                          message.role === "user"
                            ? "justify-end"
                            : "justify-start",
                        )}
                      >
                        {message.attachments.map((file, i) => (
                          <div
                            key={i}
                            className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-2"
                          >
                            {file.type.startsWith("image/") ? (
                              <img
                                src={file.url}
                                alt={file.name}
                                className="max-w-[120px] max-h-[120px] object-cover rounded-lg"
                              />
                            ) : (
                              <div className="flex items-center gap-2 px-3 py-2 min-w-[120px]">
                                <FileText className="w-4 h-4 text-indigo-400" />
                                <span className="text-[10px] text-slate-400 truncate max-w-[80px]">
                                  {file.name}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div
                      className={cn(
                        "px-6 py-4 rounded-2xl text-[14px] leading-relaxed relative border wrap-break-word overflow-hidden transition-all duration-300",
                        message.role === "user"
                          ? "bg-white text-black border-white shadow-xl rounded-tr-none max-w-full wrap-break-word"
                          : message.role === "system"
                            ? "bg-red-400/5 text-red-400 border-red-400/10 italic text-xs"
                            : "bg-white/2 text-slate-300 border-white/5 rounded-tl-none shadow-md",
                        editingIndex === index &&
                          "ring-2 ring-indigo-500/50 border-indigo-500/50",
                      )}
                    >
                      {editingIndex === index ? (
                        <div className="flex flex-col gap-4 min-w-[300px]">
                          <textarea
                            ref={editRef}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, saveEdit)}
                            className="w-full bg-transparent text-black outline-none resize-none font-light leading-relaxed min-h-[60px]"
                            autoFocus
                          />
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5">
                            <button
                              onClick={cancelEditing}
                              className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-black/5 transition-all"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={saveEdit}
                              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all"
                            >
                              <Check className="w-3 h-3" />
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`prose prose-invert prose-sm max-w-none 
                                prose-p:leading-relaxed prose-pre:bg-white/2 prose-pre:border prose-pre:border-white/5
                                prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight
                                prose-code:text-indigo-300 prose-ul:list-disc`}
                        >
                          <ReactMarkdown
                            components={{
                              h3: ({ ...props }) => (
                                <h3
                                  className="text-lg font-bold mt-6 mb-3 first:mt-0"
                                  {...props}
                                />
                              ),
                              h4: ({ ...props }) => (
                                <h4
                                  className="text-md font-bold mt-4 mb-2 first:mt-0"
                                  {...props}
                                />
                              ),
                              p: ({ ...props }) => (
                                <p
                                  className={cn(
                                    "mb-3 last:mb-0 shadow-none",
                                    message.role === "user"
                                      ? "text-black"
                                      : "text-slate-400",
                                  )}
                                  {...props}
                                />
                              ),
                              ul: ({ ...props }) => (
                                <ul
                                  className="pl-4 space-y-1.5 my-3"
                                  {...props}
                                />
                              ),
                              li: ({ ...props }) => (
                                <li className="pl-1" {...props} />
                              ),
                              code: ({
                                inline,
                                className,
                                children,
                                ...props
                              }: any) => {
                                const match = /language-(\w+)/.exec(
                                  className || "",
                                );
                                const codeContent = String(children).replace(
                                  /\n$/,
                                  "",
                                );

                                if (!inline && match) {
                                  return (
                                    <CodeBlock
                                      language={match[1]}
                                      content={codeContent}
                                      {...props}
                                    />
                                  );
                                }

                                return (
                                  <code
                                    className="bg-white/10 px-1.5 py-0.5 rounded text-indigo-200 font-mono text-[11px]"
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                );
                              },
                              pre: ({ children }: any) => <>{children}</>,
                              a: ({ ...props }) => (
                                <a
                                  className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 transition-colors"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  {...props}
                                />
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#0a0a0a] border border-white/10 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-white/20" />
              </div>
              <div className="flex gap-1.5 px-4 py-3 rounded-2xl bg-white/2 border border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Grounded Chat Input Bar */}
        <div className="p-4 md:py-4 md:px-6 shrink-0 bg-[#030303] border-t border-white/5">
          <div className="max-w-4xl mx-auto">
            <form
              onSubmit={handleSend}
              className="relative bg-neutral-900/40 border border-neutral-800 rounded-xl shadow-xl overflow-hidden w-full focus-within:border-neutral-700 transition-all duration-300"
            >
              <AnimatePresence>
                {pendingFiles.length > 0 && (
                  <div className="px-4 py-3 border-b border-neutral-800 bg-black/20 flex flex-wrap gap-2.5">
                    {pendingFiles.map((file, i) => (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        key={`${file.name}-${i}`}
                        className="flex items-center gap-2 bg-neutral-800 border border-neutral-700 px-2.5 py-1 rounded-lg"
                      >
                        {file.type.startsWith("image/") ? (
                          <div className="w-4 h-4 rounded overflow-hidden border border-white/10">
                            <img
                              src={file.url}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-neutral-400" />
                        )}
                        <span className="text-[10px] font-medium text-white truncate max-w-[120px]">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removePendingFile(i)}
                          className="p-0.5 hover:bg-neutral-700 rounded text-neutral-500 hover:text-neutral-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>

              <div className="flex items-end gap-3 p-3">
                <div className="flex flex-col justify-end pb-0.5 shrink-0">
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,.pdf,.txt,.md,.ts,.js"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 transition-all active:scale-95"
                    title="Upload Files"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                </div>

                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, handleSend)}
                  onPaste={handlePaste}
                  placeholder="Ask something or describe details..."
                  className="w-full bg-transparent border-none outline-none focus:ring-0 text-neutral-300 placeholder-neutral-600 text-sm py-1.5 resize-none max-h-[180px] min-h-[36px] scrollbar-hide font-normal shadow-none"
                  rows={1}
                  disabled={isLoading}
                />

                <button
                  type="submit"
                  disabled={
                    (!input.trim() && pendingFiles.length === 0) || isLoading
                  }
                  className={cn(
                    "p-2 rounded-lg transition-all active:scale-95 flex items-center gap-1.5 shrink-0 mb-0.5",
                    (input.trim() || pendingFiles.length > 0) && !isLoading
                      ? "bg-white text-black hover:bg-slate-200 shadow-md"
                      : "text-neutral-500 bg-transparent hover:bg-white/5",
                  )}
                >
                  <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest px-1">
                    {isLoading ? "Sending" : "Send"}
                  </span>
                  <Send
                    className={cn("w-3.5 h-3.5", isLoading && "animate-pulse")}
                  />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
