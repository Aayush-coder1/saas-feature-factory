import json
import logging
from band.core.simple_adapter import SimpleAdapter
from band.core.protocols import AgentToolsProtocol
from band.core.types import PlatformMessage
from .message_bus import Message

logger = logging.getLogger(__name__)


class BandAgentAdapter(SimpleAdapter[None]):
    def __init__(self, agent, *, features=None):
        super().__init__(history_converter=None, features=features)
        self._agent = agent
        self._tools: AgentToolsProtocol | None = None

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
    ) -> None:
        self._tools = tools
        if msg.sender_type != "agent":
            return
        try:
            data = json.loads(msg.content)
            internal = Message.from_dict(data)
        except (json.JSONDecodeError, KeyError, TypeError):
            return
        await self._agent.handle_message(internal)

    def get_tools(self) -> AgentToolsProtocol | None:
        return self._tools
