"""LLM service that dispatches to OpenAI or Anthropic via httpx."""

import json
import httpx
from .core.config import config


def _available_provider() -> str | None:
    if config.anthropic_api_key:
        return "anthropic"
    if config.openai_api_key:
        return "openai"
    return None


async def generate_blueprint(request: str, feature_title: str, codebase_tree: str) -> dict | None:
    """Generate a blueprint using LLM, or None if no API key is configured."""
    provider = _available_provider()
    if not provider:
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
        if provider == "anthropic":
            return await _call_anthropic(messages, "blueprint")
        else:
            return await _call_openai(messages, "blueprint")
    except Exception as e:
        print(f"[LLM Service] {provider} call failed: {e}")
        return None


async def generate_code(blueprint: dict, files_content: dict[str, str]) -> list[dict] | None:
    """Generate code using LLM, or None if no API key is configured."""
    provider = _available_provider()
    if not provider:
        return None

    prompt = f"""You are a code generation agent for a TypeScript + Express SaaS application. Given a feature blueprint and current file contents, produce the exact code changes needed.

Blueprint:
{json.dumps(blueprint, indent=2)}

Current file contents:
{json.dumps(files_content, indent=2)}

Respond with ONLY a JSON array of {{action: "create"|"modify", path: "<relative path>", content: "<full file content>"}} objects.
- For "create" actions, provide the complete new file content.
- For "modify" actions, provide the complete modified file content.
- Do NOT use placeholders or comments like "// ... rest stays same"."""

    messages = [{"role": "user", "content": prompt}]

    try:
        if provider == "anthropic":
            return await _call_anthropic(messages, "code")
        else:
            return await _call_openai(messages, "code")
    except Exception as e:
        print(f"[LLM Service] {provider} call failed: {e}")
        return None


async def _call_anthropic(messages: list, mode: str) -> dict | list:
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": config.anthropic_api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 4096,
                "messages": messages,
            },
        )
        resp.raise_for_status()
        content = resp.json()["content"][0]["text"]
        return json.loads(content)


async def _call_openai(messages: list, mode: str) -> dict | list:
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {config.openai_api_key}",
                "content-type": "application/json",
            },
            json={
                "model": "gpt-4o",
                "max_tokens": 4096,
                "messages": messages,
            },
        )
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]
        return json.loads(content)
