# SaaS Feature Factory

> **Multi-Agent System via Band** — 3 specialized agents collaborate through Band to turn feature requests into production-ready code.

[![Hackathon](https://img.shields.io/badge/Band%20of%20Agents-Hackathon-8B5CF6)](https://lablab.ai/ai-hackathons/band-of-agents-hackathon)
[![Track](https://img.shields.io/badge/Track-2%20%E2%80%93%20Multi--Agent%20Software%20Development-2563EB)]()

## The Problem

Enterprise SaaS teams spend 40% of their engineering time on planning, coordination, and QA handoffs — not writing code. Feature requests bounce between product managers, engineers, and QA teams across Slack threads, Jira tickets, and email. Each handoff loses context.

## The Solution

**The SaaS Feature Factory** replaces this manual pipeline with a multi-agent system where 3 specialized agents collaborate through Band:

| Agent | Role | Responsibility |
|-------|------|---------------|
| **Spec Agent** | Product Technical Planner | Reads feature requests, scans the codebase, produces strict implementation blueprints |
| **Code Gen Agent** | Implementation Engineer | Picks up blueprints, generates production code, writes files to the workspace |
| **QA Tester Agent** | Quality Assurance | Runs tests in an isolated Docker sandbox, validates no regressions, signs off |

## How It Works

```
User Request → [Band Room] → Spec Agent → Blueprint → [Band Room]
                                                              ↓
                                                    Code Gen Agent → Code Patch → [Band Room]
                                                                                          ↓
                                                                                 QA Tester Agent → Test Report → [Band Room]
                                                                                          ↓
                                                                                    DEPLOY (if signed off)
```

1. A feature request is posted to the **Band room** (`feature-factory`)
2. **Spec Agent** analyzes the request + codebase, posts a detailed implementation blueprint
3. **Code Gen Agent** picks up the blueprint, generates actual TypeScript/Node.js code, writes files
4. **QA Tester Agent** runs the full test suite in an isolated Docker container, posts QA report
5. If all tests pass, the feature is **ready for deployment**

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Band Collaboration Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Spec Agent   │  │ Code Gen     │  │ QA Tester        │   │
│  │  (Python)     │  │ Agent        │  │ Agent (Python)   │   │
│  │  band-sdk     │  │ (Python)     │  │ band-sdk         │   │
│  │  Anthropic    │  │ band-sdk     │  │ + Docker         │   │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘   │
│         │                  │                    │             │
└─────────┼──────────────────┼────────────────────┼─────────────┘
          │                  │                    │
     ┌────▼──────────────────▼────────────────────▼──────────┐
     │              Local Workspace + Docker                   │
     │  ┌──────────┐  ┌──────────┐  ┌────────────────────┐   │
     │  │  Source   │  │  Tests   │  │  Docker Sandbox    │   │
     │  │  Code     │  │  Suite   │  │  (isolated test    │   │
     │  │  (TS/Node)│  │  (Vitest) │  │   execution)      │   │
     │  └──────────┘  └──────────┘  └────────────────────┘   │
     └────────────────────────────────────────────────────────┘
```

### Tech Stack

| Component | Technology |
|-----------|-----------|
| **Orchestration** | Band Platform (band.ai) |
| **Agents** | Python + `band-sdk` (Anthropic/LangGraph adapters) |
| **Sample App** | Node.js, Express 5, TypeScript |
| **Testing** | Vitest + Supertest |
| **Isolation** | Docker (test sandbox) |
| **Communication** | Band WebSocket (real-time agent-to-agent) |

## Quick Start

### Prerequisites

- Node.js 22+
- Python 3.11+
- Docker (for sandboxed QA)

### 1. Clone & Install

```bash
git clone <your-repo-url> saas-feature-factory
cd saas-feature-factory
pip install -r agents/requirements.txt
cd sample-app && npm install && cd ..
```

### 2. Run the Demo (Local Mode)

```bash
cd agents && python -m agents.orchestrator.cli demo
```

This runs all 3 agents locally, simulating Band room communication through a local message bus. You'll see:
- Feature requests submitted by the demo
- Spec Agent analyzing and posting blueprints
- Code Gen Agent generating files
- QA Tester running tests and signing off

### 3. Connect to Real Band (Production Mode)

1. Sign up at [band.ai](https://app.band.ai)
2. Create 3 Remote Agents (spec-agent, code-gen-agent, qa-agent)
3. Copy your agent UUIDs and API keys to `.env`
4. Add an LLM provider API key (OpenAI or Anthropic)
5. Set `AGENT_MODE=band` in `.env`
6. Run: `python -m agents.orchestrator.cli band`

## Demo Features

The demo includes 5 pre-configured feature requests:

| Feature | Complexity | Description |
|---------|-----------|-------------|
| Pagination Support | Low | Add page/limit query params to task list |
| Label Filtering | Low | Filter tasks by label/category |
| CSV Export | Low | Download tasks as CSV |
| OTP Authentication | High | Full OTP-based auth flow |
| Dark Mode Theme | Low | User theme preference API |

## Project Structure

```
saas-feature-factory/
├── agents/                   # Multi-agent system
│   ├── core/                 # Shared framework (message bus, base agent, config)
│   ├── spec_agent/           # Product Spec Agent
│   ├── code_gen_agent/       # Code Generation Agent
│   ├── qa_agent/             # QA Tester Agent (Docker sandbox)
│   └── orchestrator/         # CLI, demo mode, room manager
├── sample-app/               # SaaS application (Express + TypeScript)
│   ├── src/                  # Routes, models, middleware, DB
│   ├── tests/                # Vitest test suite
│   └── features/             # Generated features
├── demo/                     # Demo assets & feature requests
├── docker-compose.yml        # Full deployment
└── scripts/                  # Utility scripts
```

## Band Integration

This project uses Band as the **actual collaboration layer** — not just a notification system:

- **Band Rooms**: All agent communication happens through the `feature-factory` room
- **Structured Messages**: Feature requests, blueprints, code patches, and QA reports are typed messages
- **Real-Time Coordination**: Agents react to messages as they arrive via WebSocket
- **Cross-Framework**: Python agents (band-sdk) coordinate on a Node.js/TypeScript codebase
- **State Management**: The room manager tracks workflow state across all messages

## Judging Criteria

| Criterion | How We Address It |
|-----------|------------------|
| **Application of Technology** | Band is the coordination layer. All 3 agents communicate exclusively through Band rooms with structured messages, task handoffs, and shared context. |
| **Presentation** | Clear agent roles, visible message flow, end-to-end demo. Each agent's contribution is logged and displayed. |
| **Business Value** | Solves real enterprise problem: feature delivery pipeline. Reduces manual coordination, automates code generation, catches regressions via automated QA. |
| **Originality** | Agents don't just chat — they plan, implement, test, and hand off. Cross-framework (Python agents on Node.js codebase). Docker-isolated QA sandbox. |

## License

MIT
