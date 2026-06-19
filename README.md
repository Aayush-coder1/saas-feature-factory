# SaaS Feature Factory

**Live Production Demo:** https://saas-feature-factory.vercel.app/

> **Multi-Agent System via Band** — 5 specialized agents collaborate through Band to turn one text prompt into production-ready, tested, documented, and deployed code.

[![Hackathon](https://img.shields.io/badge/Band%20of%20Agents-Hackathon-8B5CF6)](https://lablab.ai/ai-hackathons/band-of-agents-hackathon)
[![Track](https://img.shields.io/badge/Track-2%20%E2%80%93%20Multi--Agent%20Software%20Development-2563EB)]()

## The Problem

Enterprise SaaS teams spend 40% of their engineering time on planning, coordination, and QA handoffs — not writing code. Feature requests bounce between product managers, engineers, and QA teams across Slack threads, Jira tickets, and email. Each handoff loses context.

LLM-only code generation introduces its own problems: hallucinated imports, invalid JSON, brittle one-shot patches.

## The Solution

SaaS Feature Factory replaces this manual pipeline with 5 specialized agents collaborating through Band WebSocket, with correlation IDs preserved end-to-end for a complete audit trail:

| Agent | Role | Responsibility |
|-------|------|---------------|
| **Spec Agent** | Technical Planner | Reads feature requests, scans codebase, produces structured implementation blueprints |
| **Code Gen Agent** | Implementation Engineer | Picks up blueprints, generates deterministic TypeScript patches using 7 template generators |
| **QA Agent** | Quality Assurance | Runs Vitest test suite, validates no regressions, produces signed-off QA report |
| **Deploy Agent** | Deployment Engineer | Applies validated patches to the running sample app |
| **Docs Agent** | Technical Writer | Generates changelog entries and API documentation updates |

## How It Works

```
User Request → Spec Agent → Blueprint → Code Gen Agent → Code Patch
                                                              │
                                                              ▼
                                                         QA Agent
                                                              │
                                                  ┌───────────┴───────────┐
                                                  ▼                       ▼
                                            Deploy Agent           (report failure)
                                                  │
                                                  ▼
                                             Docs Agent
                                                  │
                                                  ▼
                                          ✓ Feature Deployed
```

1. A feature request is submitted via the dashboard or CLI
2. **Spec Agent** analyzes the request + codebase, posts a blueprint with files to create/modify
3. **Code Gen Agent** picks up the blueprint, generates deterministic code using one of 7 template generators (pagination, search, CSV export, OTP auth, dark mode, label filtering, preferences)
4. **QA Agent** runs the full Vitest suite, validates the patch, signs off
5. **Deploy Agent** applies the patch to the running Express application
6. **Docs Agent** updates the changelog and API documentation

Correlation IDs chain through every handoff: `feature_request.id → blueprint → code_patch → qa_report → deployment_result`

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     Band Collaboration Layer                       │
│  ┌───────────┐ ┌───────────┐ ┌───────┐ ┌──────────┐ ┌────────┐ │
│  │ Spec      │ │ Code Gen  │ │ QA    │ │ Deploy   │ │ Docs   │ │
│  │ Agent     │ │ Agent     │ │ Agent │ │ Agent    │ │ Agent  │ │
│  │ (Python)  │ │ (Python)  │ │(Python)│ │ (Python) │ │(Python)│ │
│  │ Simple    │ │ Simple    │ │ Simple│ │ Simple   │ │ Simple │ │
│  │ Adapter   │ │ Adapter   │ │Adapter│ │ Adapter  │ │Adapter │ │
│  └─────┬─────┘ └─────┬─────┘ └───┬───┘ └────┬─────┘ └───┬────┘ │
│        │              │           │          │            │       │
└────────┼──────────────┼───────────┼──────────┼────────────┼───────┘
         │              │           │          │            │
    ┌────▼──────────────▼───────────▼──────────▼────────────▼──────┐
    │                   Express 5 + TypeScript App                   │
    │  ┌──────────┐  ┌──────────┐  ┌────────────────────────────┐  │
    │  │  Routes  │  │  Tests   │  │  7 Template Generators     │  │
    │  │  (CRUD)  │  │ (Vitest) │  │  (deterministic code gen)  │  │
    │  └──────────┘  └──────────┘  └────────────────────────────┘  │
    └──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    Next.js 15 Dashboard                            │
│  Bento Grid UI  ·  Agent Status Cards  ·  Live Feed  ·  Pipeline │
└──────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Component | Technology |
|-----------|-----------|
| **Agent Orchestration** | Band Platform (WebSocket + REST API) |
| **Agent Framework** | Python + `BandAgentAdapter` (extends `SimpleAdapter`) |
| **LLM** | Groq (llama-3.3-70b-versatile, free tier) + Ollama fallback |
| **Dashboard** | Next.js 15, React 19, Tailwind CSS v4 |
| **Sample App** | Express 5, TypeScript |
| **Testing** | Vitest + Supertest (11 tests) |
| **Design System** | Custom Linear-inspired theme (`#080710` canvas, `#5e6ad2` accent) |

## Quick Start

### Prerequisites

- Node.js 22+
- Python 3.12+ (band-sdk works on 3.14)
- npm or pnpm

### 1. Clone & Install

```bash
git clone https://github.com/Aayush-coder1/saas-feature-factory.git
cd saas-feature-factory
pip install band-sdk python-dotenv httpx rich pyyaml pydantic
cd sample-app && npm install && cd ..
cd dashboard && npm install && cd ..
```

### 2. Run the Demo (Local Mode)

CLI:
```bash
cd agents && python -m agents.orchestrator.cli demo
```

Dashboard:
```bash
cd dashboard && npm run dev
# Open http://localhost:3000
```

This runs all 5 agents via the local message bus. You'll see:
- 5 feature requests processed sequentially
- Spec Agent producing blueprints with LLM (Groq) or template fallback
- Code Gen Agent generating deterministic TypeScript patches
- QA Agent running Vitest and signing off
- Deploy Agent applying patches to the sample app
- Docs Agent updating changelog and API docs

### 3. Connect to Real Band (Production Mode)

1. Sign up at [app.band.ai](https://app.band.ai)
2. Create 5 Remote Agents: spec-agent, code-gen-agent, qa-agent, deploy-agent, docs-agent
3. Copy their UUIDs and API keys to `.env`:
   ```
   SPEC_AGENT_ID=<uuid>
   SPEC_AGENT_API_KEY=<key>
   CODE_GEN_AGENT_ID=<uuid>
   CODE_GEN_AGENT_API_KEY=<key>
   QA_AGENT_ID=<uuid>
   QA_AGENT_API_KEY=<key>
   DEPLOY_AGENT_ID=<uuid>
   DEPLOY_AGENT_API_KEY=<key>
   DOCS_AGENT_ID=<uuid>
   DOCS_AGENT_API_KEY=<key>
   ```
4. Run:
   ```powershell
   $env:AGENT_MODE="band"
   python -m agents.orchestrator.cli band
   ```

### 4. Run Tests

```bash
cd sample-app && npm test
```

## Demo Features

The demo includes 5 pre-configured feature requests:

| Feature | Generator | Description |
|---------|-----------|-------------|
| CSV Export | `_generate_export_csv()` | Download tasks as CSV via new endpoint |
| Dark Mode | `_generate_preferences()` | User theme preference API with dark mode toggle |
| Label Filtering | `_generate_label_filtering()` | Filter tasks by label/category |
| OTP Authentication | `_generate_otp_auth()` | Full OTP-based two-factor auth flow |
| Pagination Support | `_generate_pagination_support()` | Page and limit query params for task list |

## Project Structure

```
saas-feature-factory/
├── agents/                    # Multi-agent system
│   ├── core/                  # Shared framework
│   │   ├── band_adapter.py    # SimpleAdapter bridging Band WebSocket → handle_message
│   │   ├── base_agent.py      # Abstract base agent with Band mode routing
│   │   ├── message_bus.py     # Message dataclass, LocalMessageBus, BandRoomManager
│   │   ├── config.py          # Config, env loading, agent credential management
│   │   └── llm_service.py     # Groq/OpenAI-compatible LLM client (httpx)
│   ├── spec_agent/            # Technical Planner Agent
│   ├── code_gen_agent/        # Code Generation Agent (7 template generators)
│   ├── qa_agent/              # QA Agent (Vitest test runner)
│   ├── deploy_agent/          # Deployment Agent
│   ├── docs_agent/            # Documentation Agent
│   └── orchestrator/          # CLI entrypoint, demo mode, room manager
├── dashboard/                 # Next.js 15 + Tailwind CSS v4 Bento Grid UI
│   ├── app/                   # Pages, API routes, layout
│   ├── components/            # AgentCard, PipelineTimeline, LiveFeed, etc.
│   ├── lib/                   # Shared state, Prisma client
│   └── tailwind.config.ts     # design.md token palette
├── sample-app/                # Express 5 + TypeScript target application
│   ├── src/                   # Routes, models, middleware, in-memory DB
│   ├── tests/                 # Vitest suite (11 tests)
│   └── features/              # Generated feature output
├── demo/                      # Demo feature request JSON files
├── design.md                  # Design system specification (Linear-inspired)
└── .env                       # Credentials (API keys, agent IDs)
```

## Band Integration

This project uses Band as the **actual collaboration layer** — not just a notification system:

- **Per-Agent Credentials**: Each of the 5 agents connects to Band with its own UUID and API key from `.env`
- **BandAgentAdapter**: Extends `SimpleAdapter` from `band-sdk` — bridges `PlatformMessage` WebSocket protocol to the internal `handle_message` method
- **BandRoomManager**: REST-based room creation and participant management at startup using `thenvoi_rest.RestClient`
- **Correlation ID Chain**: Every handoff preserves the same correlation UUID across all 5 agents — full audit trail
- **Dual Mode**: `AGENT_MODE=local` for development (file-based message bus), `AGENT_MODE=band` for production (WebSocket)
- **Dashboard Feedback**: API routes push agent events to the dashboard in real-time for visual pipeline tracking

## Key Differentiator: Template-First Code Generation

Most AI coding tools rely on LLMs to write code from scratch — brittle, hallucinates, fails QA.

SaaS Feature Factory uses **7 deterministic template generators** for the critical code path:
- Each generator is a hand-authored Python function that produces production-quality TypeScript
- The LLM handles only the blueprint/spec stage where creativity matters and failure is safe
- Result: predictable, testable, QA-passing output every time, zero hallucination risk

LLM fallback strategy: Groq free tier (llama-3.3-70b-versatile) as primary, Ollama as local fallback when rate-limited.

## Live Dashboard

The Next.js dashboard (`https://saas-feature-factory.vercel.app/`) features:
- **Bento Grid layout** — 12-column responsive grid per design.md
- **Agent Status Cards** — Click to expand showing event history and stage progress
- **Pipeline Flow** — Agent filter tabs, click events for payload inspector
- **Live Event Feed** — Search bar, agent/status filters, auto-scroll toggle
- **Feature Queue** — Expandable step breakdown per feature with progress bars
- **Keyboard Shortcuts** — `R` run demo, `1-5` select agents, `Esc` clear
- **Linear-inspired Dark Theme** — `#080710` canvas, `#5e6ad2` accent, no gradients/glow/glass

## Judging Criteria

| Criterion | How We Address It |
|-----------|------------------|
| **Application of Technology** | Band is the coordination layer. All 5 agents communicate through Band WebSocket with per-agent credentials, structured messages, and correlation IDs. |
| **Presentation** | Clickable dashboard with live feed, pipeline timeline, expandable event details. Everything visible in real-time. |
| **Business Value** | Solves real enterprise problem: automates the feature delivery pipeline from spec to deployment. Reduces manual coordination overhead. |
| **Originality** | Template-first code generation eliminates LLM hallucination from the critical path. Cross-framework (Python agents on Node.js/TypeScript codebase). 5-agent correlation chain. |

## License

MIT
