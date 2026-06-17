"""Reports agent state changes to the Next.js dashboard API."""

import httpx

DASHBOARD_URL = "http://localhost:3000/api/events"


async def report_state(agent_id: str, status: str, feature_id: str, message_type: str, payload: dict):
    """Fire-and-forget POST to dashboard API. Never blocks or crashes the agent."""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            await client.post(
                DASHBOARD_URL,
                json={
                    "agentId": agent_id,
                    "status": status,
                    "featureId": feature_id,
                    "messageType": message_type,
                    "payload": payload,
                    "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
                },
            )
    except Exception:
        pass
