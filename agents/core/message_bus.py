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
import sys
from pathlib import Path
from abc import ABC, abstractmethod
from typing import Any, Callable
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


class BandRoomManager:
    """REST-only room management for Band platform.
    WebSocket event flow handled per-agent via band_adapter.py.

    Usage (sync, for startup only — not for use inside async agents):
        mgr = BandRoomManager(api_key="...", rest_url="...")
        room_id = mgr.create_room()
        mgr.add_participant(room_id, "agent-uuid")
    """

    def __init__(self, api_key: str, rest_url: str = "https://app.band.ai"):
        self.api_key = api_key
        self.rest_url = rest_url.rstrip("/")
        self._rest = None

    def _ensure(self):
        if self._rest is None:
            from thenvoi_rest import RestClient
            self._rest = RestClient(
                api_key=self.api_key,
                base_url=self.rest_url,
            )

    def create_room(self) -> str:
        self._ensure()
        from thenvoi_rest.types.chat_room_request import ChatRoomRequest
        resp = self._rest.agent_api_chats.create_agent_chat(chat=ChatRoomRequest(task_id=None))
        return resp.data.id

    def add_participant(self, room_id: str, participant_id: str):
        self._ensure()
        from thenvoi_rest.types.participant_request import ParticipantRequest
        self._rest.agent_api_participants.add_agent_chat_participant(
            chat_id=room_id,
            participant=ParticipantRequest(participant_id=participant_id, role="member"),
        )


class BandMessageBus:
    """Legacy stub — kept for import compatibility.
    Real Band integration uses BandAgentAdapter per agent.
    """
    pass
