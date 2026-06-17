# Demo Script — SaaS Feature Factory

## Overview (1 minute)

> "The SaaS Feature Factory is a multi-agent system where 3 specialized AI agents collaborate through Band to turn feature requests into production-ready code. Instead of a developer manually planning, coding, and testing every feature, these agents work together through a shared Band room."

## The Problem (30 seconds)

> "Enterprise SaaS teams spend 40% of engineering time on coordination — not coding. Feature requests hop between product managers, engineers, QA, and back. Each handoff loses context. We replace that with an automated agent pipeline."

## The Architecture (1 minute)

Show the three agents:

1. **Spec Agent** (Python + band-sdk) — Analyzes requests, scans codebase, produces blueprints
2. **Code Gen Agent** (Python + band-sdk) — Generates actual TypeScript/Express code
3. **QA Tester** (Python + Docker) — Runs full test suite in isolated sandbox, signs off

> "All communication goes through a shared Band room called `feature-factory`. Messages are typed: feature_requests, blueprints, code_patches, qa_reports. Each agent picks up work as it appears."

## Live Demo (3 minutes)

### Setup
```bash
cd saas-feature-factory
pip install -r agents/requirements.txt
cd sample-app && npm install && npm test  # shows baseline tests passing
cd ..
```

### Run Agent Collaboration
```bash
cd agents && python -m agents.orchestrator.cli demo
```

### What the Judge Sees

The terminal shows the full workflow in real-time:

```
############################################################
# SAAS FEATURE FACTORY - DEMO MODE
# Multi-Agent System via Band Collaboration Layer
############################################################

[User] Submitted feature: Add Pagination Support

====================================================================
[Spec Agent] Analyzing: Add Pagination Support
[Spec Agent] Scanning codebase...
[Spec Agent] Complexity: low
[Spec Agent] Files to create: 0
[Spec Agent] Files to modify: 3
[Spec Agent] Posting blueprint to room...

====================================================================
[Code Gen Agent] Implementing: Add Pagination Support
[Code Gen Agent] Files to modify: ['src/routes/tasks.ts', 'src/db/memory.ts', 'tests/tasks.test.ts']
[Code Gen Agent] Generation complete. Posting patch to room...

====================================================================
[QA Agent] Testing feature: Add Pagination Support
[QA Agent] Changed files: 3
[QA Agent] ALL TESTS PASSED! Signing off Add Pagination Support
```

Then 2 more features run automatically (Label Filtering, CSV Export).

### Final Output
```
WORKFLOW STATE - 3 features completed
====================================================================

  FEATURE: Add Pagination Support
    Blueprint: Add Pagination Support (low)
    Code: 3 files (generated)
    QA: PASSED

  FEATURE: Add Label Filtering
    Blueprint: Add Label Filtering (low)
    Code: 1 files (generated)
    QA: PASSED

  FEATURE: Add CSV Export
    Blueprint: Add CSV Export (low)
    Code: 2 files (generated)
    QA: PASSED
```

## Key Talking Points

### Band Integration
- "Every message between agents goes through Band rooms"
- "This is real agent-to-agent collaboration — not a script calling functions"
- "Band's WebSocket-based architecture means agents react in real-time"
- "You can see every message in the room, making the collaboration transparent"

### Cross-Framework
- "Our agents use Python + band-sdk to drive a TypeScript/Node.js repository"
- "Works with any framework Band supports: LangGraph, Anthropic, CrewAI, OpenAI"

### Business Value
- "This replaces 3 separate roles: PM, Engineer, QA"
- "Feature requests go from idea to tested code in under 30 seconds"
- "Every change is tracked, every test is run, nothing slips through"

### Technical Depth
- "Docker isolation for QA — tests run in a clean container every time"
- "Extensible architecture — add new agents, new feature templates"
- "Dual mode: local for demo, Band for production"

## What to Emphasize

1. **Band is the coordination layer** — NOT a thin wrapper. Agents only communicate through Band.
2. **3+ agents** — Spec, Code Gen, and QA all have distinct roles and collaborate.
3. **Real workflow** — Planning, execution, review, decision-making all happen through the pipeline.
4. **Production quality** — TypeScript codebase, Docker isolation, proper test suite.
5. **Extensible** — Add any feature template, connect to real Band with `AGENT_MODE=band`.

## Submission Checklist

- [ ] Public GitHub repository
- [ ] README with architecture diagram
- [ ] Video walkthrough (3-5 minutes)
- [ ] Demo runs end-to-end
- [ ] Band integration documented
- [ ] .env.example with all config options
