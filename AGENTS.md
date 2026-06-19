# AGENTS.md — SaaS Feature Factory

High-signal operational guidance for OpenCode sessions on this repo.

## Architecture

```
user → feature_request → SpecAgent → blueprint → CodeGenAgent → code_patch → QAAgent → qa_report → done
```

Five Python agents communicate through a shared `MessageBus`:
- **LocalMessageBus** (file-based, `.band_store/.message_store/`): for demo/dev, no external deps
- **BandAgentAdapter** (WebSocket via `band.Agent` + `SimpleAdapter`): per-agent connection to app.band.ai, per-agent credentials from `.env`
- **BandRoomManager** (sync REST client): room creation + participant management at startup only

Entrypoint: `python -m agents.orchestrator.cli demo|band` (from `agents/` dir)

## CRITICAL: PYTHONPATH

`cli.py` does `sys.path.insert(0, ...)` at line 11 but child processes (e.g., QA agent running vitest) need the env var set:

```powershell
$env:PYTHONPATH="<project-root>"
```

If you see `ModuleNotFoundError: No module named 'agents'`, PYTHONPATH is missing.

## Known Quirks & Bugs (read before editing)

| Issue | Location | Symptom | Fix |
|-------|----------|---------|-----|
| npx platform lock | `docker_sandbox.py:64` | `npx.cmd` breaks on Linux/macOS | CHECK `sys.platform` |
| CodeWriter brittle | `code_writer.py:32` | `modify_file()` silently skips if whitespace differs | Fallback to stripped-line matching |
| Label/search routing | `code_gen_agent/agent.py:296-299` | Routes label/search to pagination generator | Route to dedicated generators |
| Feature ordering | all generators | Modifications fail if prior generator changed target strings | Process features: pagination → search → label → rest |
| Test isolation | `tasks.test.ts` | Shared mutable `Map` with no reset — order-dependent | Use `beforeEach` with `db.tasks.reset()` |
| Demo orchestrator wait | `demo_mode.py:132` | `completion_event` set by wrong feature's QA report in concurrent bus | Track completion by correlation_id instead of generic Event |
| Grok API key | `config.py:24` | `gsk_*` keys may not have access to latest models | Get new key from console.x.ai |
| LLM keys unused | `config.py:23-24` | `OPENAI_API_KEY`/`ANTHROPIC_API_KEY` never consumed | Wire into LLM service |
| Docker compose | `docker-compose.demo.yml:5` | `node:22-alpine` has no Python | Use `nikolaik/python-nodejs:python3.12-nodejs22-slim` |
| Room memory | `room_manager.py:16` | Messages grow unbounded | Prune after 1000 |

## Agent Message Flow

| Message Type | Sender | Receiver(s) | Content Key Fields |
|---|---|---|---|
| `feature_request` | user | SpecAgent | `title`, `request` |
| `blueprint` | spec-agent | CodeGenAgent | `blueprint.feature`, `blueprint.files_to_create`, `blueprint.files_to_modify` |
| `code_patch` | code-gen-agent | QAAgent | `feature`, `changed_files`, `diff_summary`, `status` |
| `qa_report` | qa-agent | deploy-agent | `feature`, `qa_signed_off`, `passed`, `failed` |
| `docs_update` | docs-agent | orchestrator | `feature`, `docs_changed` |
| `deployment_result` | deploy-agent | orchestrator | `feature`, `status` |

Correlation IDs chain: `feature_request.id → blueprint → code_patch → qa_report` (same UUID flows through all 5 agents)

## Band Mode Architecture

```
Band Platform (WebSocket + REST)
  │
  ├── spec-agent  ─── BandAgentAdapter(SimpleAdapter) ──→ SpecAgent.handle_message()
  ├── code-gen-agent ─ BandAgentAdapter(SimpleAdapter) ──→ CodeGenAgent.handle_message()
  ├── qa-agent     ─── BandAgentAdapter(SimpleAdapter) ──→ QAAgent.handle_message()
  ├── deploy-agent ─── BandAgentAdapter(SimpleAdapter) ──→ DeployAgent.handle_message()
  └── docs-agent   ─── BandAgentAdapter(SimpleAdapter) ──→ DocsAgent.handle_message()
```

Per-agent credentials from `.env`:
- `SPEC_AGENT_ID`, `SPEC_AGENT_API_KEY`
- `CODE_GEN_AGENT_ID`, `CODE_GEN_AGENT_API_KEY`
- `QA_AGENT_ID`, `QA_AGENT_API_KEY`
- `DEPLOY_AGENT_ID`, `DEPLOY_AGENT_API_KEY`
- `DOCS_AGENT_ID`, `DOCS_AGENT_API_KEY`

Room created via REST (`thenvoi_rest.RestClient`) before WebSocket connections.

## Commands

```powershell
# Test sample app
cd sample-app; npm install; npx vitest run

# Run agent demo (local mode, no Band)
cd <project-root>; python -m agents.orchestrator.cli demo

# Run agents connected to Band
$env:AGENT_MODE="band"; python -m agents.orchestrator.cli band

# Full pipeline
cd <project-root>; npm run demo

# Docker
docker compose --profile test run test-runner
docker compose --profile demo run demo-runner
```

## Windows vs POSIX

- `create_subprocess_exec("npx.cmd", ...)` on Windows needs `.cmd` suffix
- `subprocess.run(["npx", ...])` works without `.cmd` on both
- Paths use `Path` objects, never hardcoded `/` or `\`
- `sys.platform.startswith("win")` for platform detection

## Code Gen Generators

| Feature Keyword | Generator Method | Files Modified |
|---|---|---|
| paginat, paginate | `_generate_pagination_support()` | `memory.ts`, `tasks.ts` |
| export, csv | `_generate_export_csv()` | `tasks.ts` (creates `exporter.ts`) |
| rate limit, throttl | `_generate_rate_limiter()` | (creates `rateLimiter.ts`) |
| otp, 2fa, auth | `_generate_otp_auth()` | `app.ts` (creates `otp.ts`, `auth.ts`) |
| theme, dark | `_generate_preferences()` | `app.ts` (creates `preferences.ts`) |
| label, tag, categor | `_generate_label_filtering()` | `memory.ts`, `tasks.ts` |
| search | `_generate_search()` | `memory.ts`, `tasks.ts` |

## State Reporting

After Phase 2, agents POST state changes to Next.js `/api/events`:
```json
{"agent_id": "spec-agent", "status": "done", "feature_id": "...", "message_type": "blueprint", "payload": {...}}
```

## GSD Planning

Project planning lives in `../.planning/` (root workspace level):

| Artifact | Location |
|----------|----------|
| Project | `../.planning/PROJECT.md` |
| Config | `../.planning/config.json` |
| Codebase Map | `../.planning/codebase/` (7 docs) |
| Requirements | `../.planning/REQUIREMENTS.md` |
| Roadmap | `../.planning/ROADMAP.md` |
| State | `../.planning/STATE.md` |

**Current phase:** Phase 1 — Band WebSocket Integration (critical for hackathon judging)
**Mode:** YOLO (auto-approve, just execute)
**Deadline:** June 19, 2026

**Commands:**
- `/gsd-plan-phase 1` — plan Phase 1 execution
- `/gsd-execute-phase 1` — execute Phase 1
