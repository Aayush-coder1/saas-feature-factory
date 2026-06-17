"""Lightweight OpenAI adapter for Band SDK."""

import httpx
from band.core.protocols import AgentToolsProtocol
from band.core.simple_adapter import SimpleAdapter
from band.core.types import Capability, Emit, PlatformMessage


class OpenAIAdapter(SimpleAdapter):
    """OpenAI adapter using httpx to call api.openai.com."""

    SUPPORTED_EMIT = frozenset({Emit.EXECUTION, Emit.THOUGHTS})
    SUPPORTED_CAPABILITIES = frozenset({Capability.MEMORY})

    def __init__(self, api_key: str, model: str = "gpt-4o"):
        super().__init__()
        self.api_key = api_key
        self.model = model

    async def on_message(
        self,
        msg: PlatformMessage,
        tools: AgentToolsProtocol,
        history,
        participants_msg: str | None,
        contacts_msg: str | None,
        *,
        is_session_bootstrap: bool,
        room_id: str,
    ):
        user_text = msg.content
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "content-type": "application/json",
                },
                json={
                    "model": self.model,
                    "max_tokens": 4096,
                    "messages": [{"role": "user", "content": user_text}],
                },
            )
            resp.raise_for_status()
            reply = resp.json()["choices"][0]["message"]["content"]
        await tools.send_message(reply)
