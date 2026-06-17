"""
Abstract message bus for agent-to-agent communication.

Two implementations:
- LocalMessageBus: file-based message passing for demo/dev
- BandMessageBus: real Band SDK integration for production
"""

import json
import time
import uuid
import asyncio
from pathlib import Path
from abc import ABC, abstractmethod
from typing import Callable
from dataclasses import dataclass, field, asdict

@dataclass
class Message:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    sender: str = ""
    receiver: str = ""
    msg_type: str = ""
    content: dict = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)
    correlation_id: str = ""

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict) -> "Message":
        return cls(**d)


class MessageBus(ABC):
    @abstractmethod
    async def publish(self, message: Message, channel: str = "default"):
        pass

    @abstractmethod
    async def subscribe(self, channel: str, callback: Callable):
        pass

    @abstractmethod
    async def start(self):
        pass

    @abstractmethod
    async def stop(self):
        pass


class LocalMessageBus(MessageBus):
    """File-based message passing for local demo mode."""

    def __init__(self, base_path: Path):
        self.base_path = base_path / ".message_store"
        self.base_path.mkdir(parents=True, exist_ok=True)
        self._callbacks: dict[str, list[Callable]] = {}
        self._running = False
        self._seen: set[str] = set()

    def _channel_path(self, channel: str) -> Path:
        p = self.base_path / channel
        p.mkdir(parents=True, exist_ok=True)
        return p

    async def publish(self, message: Message, channel: str = "default"):
        msg_file = self._channel_path(channel) / f"{message.id}.json"
        msg_file.write_text(json.dumps(message.to_dict(), indent=2))

    async def subscribe(self, channel: str, callback: Callable):
        if channel not in self._callbacks:
            self._callbacks[channel] = []
        self._callbacks[channel].append(callback)

    async def start(self):
        self._running = True
        while self._running:
            for channel, callbacks in self._callbacks.items():
                channel_path = self._channel_path(channel)
                if not channel_path.exists():
                    continue
                for msg_file in sorted(channel_path.iterdir(), key=lambda f: f.stat().st_mtime):
                    if msg_file.suffix != ".json":
                        continue
                    if msg_file.name in self._seen:
                        continue
                    self._seen.add(msg_file.name)
                    try:
                        data = json.loads(msg_file.read_text())
                        message = Message.from_dict(data)
                        for cb in callbacks:
                            await cb(message)
                    except (json.JSONDecodeError, KeyError, TypeError) as e:
                        print(f"[MessageBus] Error reading {msg_file.name}: {e}")
            await asyncio.sleep(0.5)

    async def stop(self):
        self._running = False


class BandMessageBus(MessageBus):
    """Real Band SDK integration for production."""

    def __init__(self, agent_id: str, api_key: str, ws_url: str, rest_url: str):
        self.agent_id = agent_id
        self.api_key = api_key
        self.ws_url = ws_url
        self.rest_url = rest_url
        self._agent = None
        self._callbacks: dict[str, list[Callable]] = {}

    async def publish(self, message: Message, channel: str = "default"):
        if self._agent:
            await self._agent.send_message(
                room_id=channel,
                content=json.dumps(message.to_dict()),
            )

    async def subscribe(self, channel: str, callback: Callable):
        if channel not in self._callbacks:
            self._callbacks[channel] = []
        self._callbacks[channel].append(callback)

    async def start(self):
        try:
            from band import Agent
            from band.adapters import AnthropicAdapter, OpenaiAdapter
        except ImportError:
            print("[BandMessageBus] band-sdk not installed. Install with: pip install band-sdk[anthropic]")
            raise

        from ..core.config import config
        if config.anthropic_api_key:
            adapter = AnthropicAdapter()
        elif config.openai_api_key:
            adapter = OpenaiAdapter()
        else:
            print("[BandMessageBus] No API key configured for any LLM adapter")
            raise ValueError("No LLM API key configured")

        self._agent = Agent.create(
            adapter=adapter,
            agent_id=self.agent_id,
            api_key=self.api_key,
            ws_url=self.ws_url,
            rest_url=self.rest_url,
        )
        await self._agent.run()

    async def stop(self):
        if self._agent:
            await self._agent.stop()



