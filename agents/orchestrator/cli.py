"""
CLI entrypoint for the SaaS Feature Factory.
Runs the multi-agent system either in local demo mode or connected to Band.
"""

import asyncio
import sys
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from agents.core.config import config
from agents.orchestrator.demo_mode import DemoOrchestrator, load_demo_features


async def cmd_demo(args):
    orch = DemoOrchestrator()
    features = load_demo_features()
    state = await orch.run_workflow(features)
    completed = len(state["completed_features"])
    total = len(state["feature_requests"])
    print(f"\nDemo complete! {completed}/{total} features processed successfully.")
    if completed < total:
        print("Some features had QA failures. Check the workflow log above.")
    else:
        print("All features passed QA and are ready for deployment!")


async def cmd_request(args):
    orch = DemoOrchestrator()
    features = [{"title": args.title, "request": args.request}]
    state = await orch.run_workflow(features)
    completed = len(state["completed_features"])
    print(f"\nFeature '{args.title}': {'PASSED' if completed > 0 else 'FAILED'}")


async def cmd_band(args):
    print("[CLI] Starting Band mode - connecting agents to Band platform...")

    if not config.has_band_agents:
        print("[CLI] ERROR: Missing agent credentials in .env.")
        print("[CLI] Required: SPEC_AGENT_ID, SPEC_AGENT_API_KEY, CODE_GEN_AGENT_ID, etc.")
        return

    from band import Agent
    from band.core.types import AdapterFeatures
    from agents.core.band_adapter import BandAgentAdapter
    from agents.spec_agent.agent import SpecAgent
    from agents.code_gen_agent.agent import CodeGenAgent
    from agents.qa_agent.agent import QAAgent
    from agents.deploy_agent.agent import DeployAgent
    from agents.docs_agent.agent import DocsAgent

    agent_instances = [
        SpecAgent(),
        CodeGenAgent(),
        QAAgent(),
        DeployAgent(),
        DocsAgent(),
    ]

    # Set up the feature-factory room via REST
    room_id = ""
    try:
        from thenvoi_rest import RestClient
        from thenvoi_rest.types.chat_room_request import ChatRoomRequest
        from thenvoi_rest.types.participant_request import ParticipantRequest

        first = config.get_agent_credentials("spec-agent")
        rest = RestClient(
            base_url=config.band_rest_url.rstrip("/"),
            api_key=first["api_key"],
        )
        room_resp = rest.agent_api_chats.create_agent_chat(
            chat=ChatRoomRequest(task_id=None),
        )
        room_id = room_resp.data.id
        print(f"[CLI] Created room: {room_id}")
        for name, inst in [("spec-agent", agent_instances[0]),
                            ("code-gen-agent", agent_instances[1]),
                            ("qa-agent", agent_instances[2]),
                            ("deploy-agent", agent_instances[3]),
                            ("docs-agent", agent_instances[4])]:
            creds = config.get_agent_credentials(name)
            rest.agent_api_participants.add_agent_chat_participant(
                chat_id=room_id,
                participant=ParticipantRequest(
                    participant_id=creds["agent_id"],
                    role="member",
                ),
            )
            print(f"[CLI] Added {name} to room")
    except Exception as e:
        print(f"[CLI] Room setup warning: {e}")
        print("[CLI] Continuing — agents will connect but room must exist")

    # Launch each agent as a Band agent with custom adapter
    band_agents = []
    tasks = []
    for inst in agent_instances:
        name = inst.name
        creds = config.get_agent_credentials(name)
        if not creds:
            print(f"[CLI] WARNING: No credentials for {name}, skipping")
            continue
        adapter = BandAgentAdapter(inst)
        band_agent = Agent.create(
            adapter=adapter,
            agent_id=creds["agent_id"],
            api_key=creds["api_key"],
            ws_url=config.band_ws_url,
            rest_url=config.band_rest_url,
        )
        inst._band_adapter = adapter
        inst._band_agent = band_agent
        band_agents.append(band_agent)
        tasks.append(asyncio.create_task(band_agent.run()))
        print(f"[CLI] {name} connecting to Band...")

    print(f"[CLI] {len(band_agents)} agents connected. Room: {room_id or config.band_project_id or 'feature-factory'}")
    print("[CLI] Submit feature requests via Band dashboard.")
    try:
        await asyncio.gather(*tasks)
    except asyncio.CancelledError:
        print("[CLI] Shutting down...")
        for ba in band_agents:
            await ba.stop()


def main():
    parser = argparse.ArgumentParser(
        description="SaaS Feature Factory - Multi-Agent System via Band"
    )
    sub = parser.add_subparsers(dest="command")

    demo_parser = sub.add_parser("demo", help="Run local demo with simulated Band rooms")
    req_parser = sub.add_parser("request", help="Run a single feature request through the pipeline")
    req_parser.add_argument("title", help="Feature title")
    req_parser.add_argument("request", nargs="?", default="", help="Feature description")
    band_parser = sub.add_parser("band", help="Connect to real Band platform")

    args = parser.parse_args()

    if args.command == "demo":
        asyncio.run(cmd_demo(args))
    elif args.command == "request":
        asyncio.run(cmd_request(args))
    elif args.command == "band":
        asyncio.run(cmd_band(args))
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
