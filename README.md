# ScopeAI

**ScopeAI** is a high-fidelity, multimodal project architect designed for engineers and product builders. It bridge the gap between abstract technical visions and production-ready blueprints through spatial visualization and advanced LLM reasoning.

---

## 🧠 Core Intelligence Modules

### 1. Flow Engine (Architectural Mapping)

- **Ultra-Granular Logic**: Generates deep-dive Mermaid.js maps (LR graph) encompassing API endpoints, specialized database schemas, cache layers (Redis/Memcached), and message queues (Kafka).
- **Human-Technical Balance**: Every logical node is labeled in plain English (e.g., "Check if password matches") to ensure readability without sacrificing architectural depth.
- **Spatial Controls**:
  - **Deep Technical Inspection**: 500% zoom capability.
  - **Fluid Navigation**: Momentum-based drag-to-pan and immersive full-screen mode.
  - **Export Pipeline**: High-fidelity SVG downloading for documentation.

### 2. Multi-Modal Chat

- **Vision-Based Diagnosis**: Upload UI screenshots for instantaneous code generation and architectural analysis.
- **Document Auditing**: Process technical specs (PDF/Text) to identify structural bottlenecks.
- **Re-edit**: Edit previously sent messages to "Overwrite" history, allowing for recursive prompt refinement and precision re-generation.
- **Technical Presentation**: Integrated Syntax Highlighters (VSC Dark Plus) with secure clipboard management.

### 3. Sequential Timeline Scheduler

- **Business-Day Calibration**: A strict "Skip Weekends" engine ensures project milestones never fall on non-working days.
- **Sequential Logic Engine**: Recalculates entire timelines to prevent date overlapping and scheduling hallucinations.
- **Working-Day Aggregation**: Displays the "Progressive Timeline" badge showing only the total business-day effort required.

### 4. Persistence & Artifact Archiving

- **Blueprint Storage**: Archive generated plans (tasks + flowcharts) into a persistent database.
- **Artifact Quick-Recall**: Seamlessly restore historic architectures from the "Recent Artifacts" browser directly into the workspace.

---

## 🛡 System Resilience (The "Healer")

ScopeAI features a multi-layer backend auto-fix system to ensure high-fidelity output:

- **Syntax Self-Repair**: Automatically detects and fixes malformed Mermaid.js markers, redundant graph headers, and unquoted labels.
- **Date Audit Engine**: Intercepts AI-generated math errors to enforce strict calendar compliance.
- **JSON Hardening**: Scrubbing logic for stray markdown literals that often plague LLM-based structured outputs.

---

## 🛠 Tech Stack

- **Architecture**: Next.js 15 (App Router, Turbopack)
- **Core Intelligence**: Groq Llama-3.3-70b-versatile
- **Visualization**: Mermaid.js 11.14.0
- **Animations**: Framer Motion 12+
- **Persistence**: Integrated API routes with MongoDB support
- **Styling**: Tailwind CSS v4 + Vanilla CSS

---

## 🚀 Deployment & Setup

1.  **Clone Repository**
2.  **Dependencies**: `npm install`
3.  **Environment Configuration**:
    Create `.env.local`:
    ```env
    GROQ_API_KEY=your_key_here
    MONGODB_URI=your_mongo_uri_here
    ```
4.  **Launch Workspace**: `npm run dev`

---

_Crafted with precision for builders. Powered by ScopeAI Intelligence._
