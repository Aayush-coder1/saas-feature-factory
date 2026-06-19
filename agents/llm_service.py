"""LLM service that calls any OpenAI-compatible endpoint (Groq, OpenAI, etc.)."""

import json
import re
import httpx
from .core.config import config


def _is_configured() -> bool:
    return bool(config.openai_api_key)


def _clean_json(text: str):
    """Strip markdown fences and fix common LLM JSON issues."""
    stripped = text.strip()
    if stripped.startswith("```"):
        lines = stripped.splitlines()
        start = 0
        for i, line in enumerate(lines):
            if line.startswith("```"):
                start = i + 1
                break
        end = len(lines)
        for i in range(len(lines) - 1, start - 1, -1):
            if lines[i].strip().startswith("```"):
                end = i
                break
        stripped = "\n".join(lines[start:end]).strip()
    # Fix unescaped control characters (common Llama issue)
    stripped = re.sub(r'[\x00-\x1f]', '', stripped)
    return stripped


async def generate_blueprint(request: str, feature_title: str, codebase_tree: str) -> dict | None:
    """Generate a blueprint using an OpenAI-compatible LLM (Groq, OpenAI, etc)."""
    if not _is_configured():
        return None

    prompt = f"""You are a product spec agent for a SaaS application. Given a feature request and the codebase structure, produce a detailed implementation blueprint in JSON format.

Feature Title: {feature_title}
Feature Request: {request}

Codebase Structure:
{codebase_tree}

Respond with ONLY a JSON object with these fields:
- feature: the feature name
- summary: brief description of what to implement
- complexity: "low", "medium", or "high"
- files_to_create: list of file paths to create (relative to src/)
- files_to_modify: list of file paths to modify
- api_endpoints: list of {{method, path, description, request_body, response_shape}}
- data_changes: description of any data schema changes
- test_scenarios: list of test case descriptions"""

    messages = [{"role": "user", "content": prompt}]

    try:
        return await _call_llm(messages)
    except Exception as e:
        print(f"[LLM Service] Blueprint call failed: {e}")
        print(f"[LLM Service] Falling back to template-based generation (no impact on demo)")
        return None


async def generate_code(blueprint: dict, files_content: dict[str, str]) -> list[dict] | None:
    """Generate code using an OpenAI-compatible LLM (Groq, OpenAI, etc)."""
    if not _is_configured():
        return None

    prompt = f"""You are a code generation agent for a TypeScript + Express SaaS application. Given a feature blueprint and current file contents, produce the exact code changes needed.

Blueprint:
{json.dumps(blueprint, indent=2)}

Current file contents:
{json.dumps(files_content, indent=2)}

Respond with ONLY a JSON array of {{action: "create"|"modify", path: "<relative path>", content: "<full file content>"}} objects.
- For "create" actions, provide the complete new file content.
- For "modify" actions, provide the complete modified file content.
- Do NOT use placeholders or comments like "// ... rest stays same".
- Escape all backslashes, newlines, and quotes properly in the JSON content field."""

    messages = [{"role": "user", "content": prompt}]

    try:
        result = await _call_llm(messages)
        if isinstance(result, list) and all("action" in c and "path" in c for c in result):
            return result
        print(f"[LLM Service] Code result missing required fields, falling back to templates")
        return None
    except Exception as e:
        print(f"[LLM Service] Code generation call failed: {e}")
        print(f"[LLM Service] Falling back to template-based generation (no impact on demo)")
        return None


async def _call_llm(messages: list) -> dict | list:
    """Call any OpenAI-compatible /chat/completions endpoint."""
    base_url = config.openai_api_base.rstrip("/")
    model = config.model_name
    api_key = config.openai_api_key

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            f"{base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "content-type": "application/json",
            },
            json={
                "model": model,
                "max_tokens": 4096,
                "messages": messages,
            },
        )
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]
        cleaned = _clean_json(content)
        return json.loads(cleaned)
