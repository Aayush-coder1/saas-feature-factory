# AGENTS.md — SaaS Feature Factory

High-signal operational guidance for OpenCode sessions on this repo.

## Architecture

```
user → feature_request → SpecAgent → blueprint → CodeGenAgent → code_patch → QAAgent → qa_report → done
```

Three Python agents communicate through a shared `MessageBus`:
- **LocalMessageBus** (file-based, `.band_store/.message_store/`): for demo/dev, no external deps
- **BandMessageBus** (WebSocket to band.ai): for production, needs `band-sdk` and Band credentials

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
| BandMessageBus | `message_bus.py:134` | Hardcodes `AnthropicAdapter` | Check available API keys |
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
| `qa_report` | qa-agent | orchestrator | `feature`, `qa_signed_off`, `passed`, `failed` |

Correlation IDs chain: `feature_request.id → blueprint → code_patch → qa_report`

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
