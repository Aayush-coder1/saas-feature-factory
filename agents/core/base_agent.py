"""
Base agent that all specialized agents extend.
Handles message bus connection and message routing.
"""

from abc import ABC, abstractmethod
from pathlib import Path
from .message_bus import MessageBus, LocalMessageBus, Message
from .config import config


class BaseAgent(ABC):
    def __init__(self, name: str, channel: str = "feature-factory", bus: MessageBus = None):
        self.name = name
        self.channel = channel
        self.bus: MessageBus = bus or self._create_bus()
        self._band_adapter = None
        self._band_agent = None

    def _create_bus(self) -> MessageBus:
        return LocalMessageBus(base_path=Path.cwd() / ".band_store")

    @abstractmethod
    async def handle_message(self, message: Message):
        pass

    async def on_message(self, message: Message):
        if message.receiver and message.receiver != self.name:
            return
        await self.handle_message(message)

    async def send(self, content: dict, msg_type: str = "", receiver: str = "", correlation_id: str = ""):
        msg = Message(
            sender=self.name,
            receiver=receiver,
            msg_type=msg_type,
            content=content,
            correlation_id=correlation_id,
        )
        if self._band_adapter:
            tools = self._band_adapter.get_tools()
            if tools:
                await tools.send_message(
                    content=__import__("json").dumps(msg.to_dict()),
                    mentions=None,
                )
                return
        await self.bus.publish(msg, channel=self.channel)

    async def run(self):
        await self.bus.subscribe(self.channel, self.on_message)
        print(f"[{self.name}] Agent started. listening on channel '{self.channel}'")
        await self.bus.start()

    async def stop(self):
        await self.bus.stop()
