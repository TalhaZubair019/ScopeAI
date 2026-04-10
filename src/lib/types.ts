export interface Task {
  task_name: string;
  description: string;
  due_date: string;
  duration: string;
}

export interface Project {
  _id: string;
  prompt: string;
  tasks: Task[];
  flowchart?: string;
  createdAt: string | Date;
}

export interface GenerateTasksResponse {
  tasks: Task[];
  error?: string;
}

export interface ChatAttachment {
  name: string;
  type: string;
  url: string; // base64 or URL
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: ChatAttachment[];
  customRules?: string;
}

export interface ChatResponse {
  message: ChatMessage;
  chatId?: string;
  error?: string;
}

export interface ChatSession {
  _id?: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface CodeAuditSession {
  _id?: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string | Date;
  updatedAt: string | Date;
}
