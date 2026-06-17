"""
Demo Mode - Orchestrates the full workflow in local mode,
showing agent-to-agent collaboration through simulated Band rooms.
"""

import asyncio
import json
import shutil
from pathlib import Path
from ..core.message_bus import Message, LocalMessageBus
from ..core.config import config, PROJECT_ROOT
from ..spec_agent.agent import SpecAgent
from ..code_gen_agent.agent import CodeGenAgent
from ..qa_agent.agent import QAAgent
from ..deploy_agent.agent import DeployAgent
from ..docs_agent.agent import DocsAgent
from .room_manager import RoomManager

STEP_DIR = PROJECT_ROOT / ".demo_state"


def _write_step(data: dict):
    STEP_DIR.mkdir(parents=True, exist_ok=True)
    (STEP_DIR / "step.json").write_text(json.dumps(data, indent=2))


def _clear_step():
    f = STEP_DIR / "step.json"
    if f.exists():
        f.unlink()


class DemoOrchestrator:
    def __init__(self):
        self.room = RoomManager()
        self.store_path = PROJECT_ROOT / ".band_store"
        if self.store_path.exists():
            shutil.rmtree(self.store_path)
        shared_bus = LocalMessageBus(base_path=self.store_path)
        self.spec_agent = SpecAgent(bus=shared_bus)
        self.code_gen_agent = CodeGenAgent(bus=shared_bus)
        self.qa_agent = QAAgent(bus=shared_bus)
        self.deploy_agent = DeployAgent(bus=shared_bus)
        self.docs_agent = DocsAgent(bus=shared_bus)
        self.agents = [self.spec_agent, self.code_gen_agent, self.qa_agent, self.docs_agent, self.deploy_agent]
        self.bus = shared_bus
        self.pending_features: asyncio.Queue = asyncio.Queue()
        self.completion_event = asyncio.Event()
        self._current_feature = 0
        self._total_features = 0

    async def _global_listener(self, message: Message):
        self.room.add_message(message)
        if message.msg_type == "qa_report":
            self.completion_event.set()
        if message.msg_type == "code_patch":
            _write_step({
                "feature": self._features[self._current_feature]["title"] if self._features else "",
                "feature_index": self._current_feature,
                "total_features": self._total_features,
                "agent": "code-gen-agent",
                "stage": "coding",
                "status": message.content.get("status", "generated"),
            })
        elif message.msg_type == "blueprint":
            _write_step({
                "feature": self._features[self._current_feature]["title"] if self._features else "",
                "feature_index": self._current_feature,
                "total_features": self._total_features,
                "agent": "spec-agent",
                "stage": "spec",
                "status": "done",
            })
        elif message.msg_type == "qa_report":
            _write_step({
                "feature": self._features[self._current_feature]["title"] if self._features else "",
                "feature_index": self._current_feature,
                "total_features": self._total_features,
                "agent": "qa-agent",
                "stage": "qa",
                "status": "passed" if message.content.get("qa_signed_off") else "failed",
            })

    async def submit_feature(self, title: str, request: str):
        msg = Message(
            sender="user",
            msg_type="feature_request",
            content={"title": title, "request": request},
        )
        await self.bus.publish(msg, channel="feature-factory")
        print(f"\n[User] Submitted feature: {title}")

    async def run_workflow(self, features: list[dict]):
        self._features = features
        self._total_features = len(features)

        print(f"\n{'#' * 60}")
        print(f"# SAAS FEATURE FACTORY - DEMO MODE")
        print(f"# Multi-Agent System via Band Collaboration Layer")
        print(f"{'#' * 60}\n")

        for agent in self.agents:
            await self.bus.subscribe("feature-factory", agent.on_message)
        await self.bus.subscribe("feature-factory", self._global_listener)

        listener_task = asyncio.create_task(self.bus.start())
        await asyncio.sleep(1)

        for idx, feature in enumerate(features):
            self._current_feature = idx
            self.completion_event.clear()
            _write_step({
                "feature": feature["title"],
                "feature_index": idx,
                "total_features": len(features),
                "agent": "orchestrator",
                "stage": "submitted",
                "status": "pending",
            })
            await self.submit_feature(feature["title"], feature["request"])
            try:
                await asyncio.wait_for(self.completion_event.wait(), timeout=30)
            except asyncio.TimeoutError:
                print(f"[Demo] Timeout waiting for feature: {feature['title']}")
            _write_step({
                "feature": feature["title"],
                "feature_index": idx,
                "total_features": len(features),
                "agent": "deploy-agent",
                "stage": "deploy",
                "status": "deploying",
            })
            await asyncio.sleep(1)

        await asyncio.sleep(1)
        listener_task.cancel()
        try:
            await listener_task
        except asyncio.CancelledError:
            pass

        _clear_step()
        self.room.print_workflow()
        return self.room.get_workflow_state()


def load_demo_features():
    """Load feature requests from the demo/request-examples directory."""
    examples_dir = PROJECT_ROOT / "demo" / "request-examples"
    features = []
    for f in sorted(examples_dir.glob("*.json")):
        data = json.loads(f.read_text())
        features.append(data)
    if not features:
        features = [
            {"title": "Add Pagination Support", "request": "Add pagination to the tasks list endpoint. Users should be able to specify page and limit query params."},
            {"title": "Add Label Filtering", "request": "Add ability to filter tasks by label/category. Tasks can have labels, and we should be able to query by them."},
            {"title": "Add CSV Export", "request": "Add a CSV export endpoint so users can download all their tasks as a CSV file."},
        ]
    return features
