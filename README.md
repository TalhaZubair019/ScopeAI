# ScopeAI: Neural Workspace & Financial Audit Engine

**ScopeAI** is a high-fidelity, multimodal project architect and senior-level code auditor. It transforms abstract technical visions into production-ready blueprints while ruthlessly hunting for logical failures, race conditions, and financial math errors.

---

## 🧠 Neural Intelligence Modules

### 1. Neural Code Auditor (Senior-Lead Reasoning)
- **4-Point Diagnostic Scoring**: Every audit is scored on a 0-100 scale across **Security**, **Performance**, **Maintainability**, and **Reliability**.
- **Context-Aware Auditing**: The engine automatically detects the scope of your code—praising simple scripts for minimalism while unleashing enterprise-level rigor on payment and database persistence logic.
- **Architectural Refinement**: Concludes every session with a "Proposed Architectural Refinement"—a full, production-hardened version of your code.
- **Custom Validation Logic**: Inject your own ad-hoc rules (e.g., "Must be heavily commented") directly into the AI's validation loop.

### 2. Financial Integrity Invariants
The engine is hardcoded to enforce high-precision engineering standards:
- **Atomicity Invariant**: Flags JavaScript-level math on shared state; enforces database-level atomic updates (`SET x = x + y`).
- **Precision Invariant**: Strictly prohibits floating-point math for currency; enforces integers or specialized decimal libraries.
- **Transactional Guard**: Mandates `BEGIN/COMMIT/ROLLBACK` blocks for multi-step operations to prevent partial failures.
- **Leakage Prevention**: Scrubs sensitive server contexts and stack traces (`err.stack`) from being returned to the client.

### 3. Flow Engine (Architectural Mapping)
- **Deep Technical Inspection**: Generates Mermaid.js maps for API endpoints, database schemas, cache layers, and message queues.
- **Immersive Navigation**: 500% zoom capability with momentum-based dragging and fluid full-screen mode.
- **Export Pipeline**: High-fidelity SVG downloading for architectural documentation.

### 4. Sequential Timeline Scheduler
- **Business-Day Calibration**: A strict "Skip Weekends" engine ensures project milestones follow real-world working days.
- **Conflict Resolution**: Recalculates entire timelines to prevent date overlapping and scheduling hallucinations.

---

## 🎨 Professional UX Flow

- **Stealth Input System**: A minimalistic, context-aware input bar that expands on demand and automatically collapses when clicking outside to maximize focus.
- **Persistent Multimodal Chat**: Support for vision-based diagnosis, document auditing, and historical "Re-edit" functionality.
- **Global Clipboard Management**: Integrated "Copy" functionality for both user prompts and suggested auditor optimizations.
- **Diagnostic Dashboard**: Visual integrity markers and status badges inspired by industrial diagnostic tools.

---

## 🛠 Tech Stack

- **Architecture**: Next.js 15 (App Router, Turbopack)
- **Core Reasoning**: Groq Llama-3.3-70b-versatile
- **Persistence**: MongoDB for Audit Sessions and Architectural Artifacts
- **Resilience**: Dual-Key Failover (Automatic backup API switching on 429 Rate Limits)
- **Visualization**: Mermaid.js 11.4 + Framer Motion 12
- **Styling**: Tailwind CSS v4 + Vanilla CSS

---

## 🚀 Deployment & Setup

1.  **Clone Repository**
2.  **Dependencies**: `npm install`
3.  **Environment Configuration**:
    Create `.env`:
    ```env
    GROQ_API_KEY=primary_key_here
    GROQ_API_KEY_2=backup_key_here (optional failover)
    MONGODB_URI=your_mongo_uri_here
    ```
4.  **Launch Workspace**: `npm run dev`

---

_Crafted with precision for builders. Powered by ScopeAI Intelligence._
