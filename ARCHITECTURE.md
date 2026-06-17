# Architecture Guide

## Overview

The SaaS Feature Factory demonstrates a production-grade multi-agent system where specialized agents collaborate through Band's shared interaction layer. The architecture follows clean separation of concerns: each agent has a single responsibility, communicates via typed messages through Band rooms, and operates with full autonomy.

## Core Design Decisions

### Why Band as the Coordination Layer?

Band provides the infrastructure that makes this multi-agent system work:

1. **Shared Rooms**: Agents don't need to know about each other — they just listen to the `feature-factory` room
2. **Structured Messages**: Typed message formats (feature_request, blueprint, code_patch, qa_report) ensure consistent communication
3. **Real-Time WebSocket**: Agents react instantly when new messages arrive
4. **Cross-Framework**: Python agents (using `band-sdk`) can coordinate on a TypeScript/Node.js codebase
5. **State & Traceability**: Every message is recorded, making the full workflow auditable

### Agent Communication Pattern

```
┌─────────┐     blueprint      ┌────────────┐     code_patch      ┌──────────┐
│  Spec   │ ◄──────────────── │  Code Gen  │ ◄────────────────── │    QA    │
│  Agent  │ ────────────────► │  Agent     │ ──────────────────► │  Tester  │
└─────────┘     request        └────────────┘                     └──────────┘
     ▲                                                                    │
     │                        feature-factory (Band Room)                │
     └────────────────────────────────────────────────────────────────────┘
                              User submits feature request
```

### Message Types

| Type | Sender | Receiver | Content |
|------|--------|----------|---------|
| `feature_request` | User | Spec Agent | Feature title, description, priority |
| `blueprint` | Spec Agent | Code Gen Agent | Files to create/modify, API endpoints, data changes, tests |
| `code_patch` | Code Gen Agent | QA Tester | Changed files, diff summary, status |
| `qa_report` | QA Tester | All | Test results, pass/fail, signed-off status |

### Why Local + Band Modes?

Both modes use the same `MessageBus` abstraction:

- **Local mode**: File-based message passing. No Band account needed. Perfect for demo, dev, and CI.
- **Band mode**: Real WebSocket connection to Band platform. Production-grade with full multi-agent room capabilities.

Switching modes is a single config change (`AGENT_MODE=band`).

## Agent Deep Dive

### Spec Agent

- **Input**: Natural language feature request
- **Output**: Structured JSON blueprint
- **Logic**: Scans codebase tree, maps feature keywords to implementation templates
- **LLM Integration**: Local mode uses template matching; Band mode sends to LLM via adapter

### Code Gen Agent

- **Input**: Blueprint JSON
- **Output**: Actual code files + patch summary
- **Logic**: Template-based code generation for common patterns (pagination, auth, export, etc.)
- **Safety**: All changes are trackable via git diff

### QA Tester Agent

- **Input**: Code patch notification
- **Output**: QA report with pass/fail
- **Logic**: Runs full test suite, reports per-test results
- **Isolation**: Docker sandbox for production deployments; local mode runs tests directly

## Message Bus Abstraction

```
                    MessageBus (abstract)
                   /                   \
        LocalMessageBus            BandMessageBus
        (file-based)              (WebSocket to Band)
             │                           │
     - Simple, no deps           - Real-time
     - Great for demo             - Multi-agent rooms
     - Works offline              - Full Band platform features
     - 0 latency                  - Production-ready
```

Both implementations implement the same `publish()`, `subscribe()`, `start()`, `stop()` interface.

## Security & Isolation

1. **QA Sandbox**: Tests run in isolated Docker containers
2. **No Secret Leakage**: `.env` and `agent_config.yaml` are gitignored
3. **Workspace Isolation**: Generated code goes to `sample-app/features/` directory
4. **Audit Trail**: All agent messages are logged with timestamps

## Extending the System

### Adding a New Agent

1. Create `agents/new_agent/agent.py` extending `BaseAgent`
2. Implement the `handle_message()` method
3. Subscribe to the relevant message type
4. Register it in `orchestrator/cli.py`

### Adding a New Feature Template

1. Add the feature detection in `spec_agent/agent.py` (`_build_blueprint_local`)
2. Add the code generation in `code_gen_agent/agent.py`
3. Add test scenarios in the blueprint

## Deployment Modes

| Mode | Command | Requirements |
|------|---------|-------------|
| Local Demo | `python -m agents.orchestrator.cli demo` | Python 3.11+ |
| Band Connected | `python -m agents.orchestrator.cli band` | Band account, API keys |
| Docker Demo | `docker compose run demo-runner` | Docker |
| Full Stack | `docker compose --profile agents up` | Docker, Band account |
