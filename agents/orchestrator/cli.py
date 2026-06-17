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


async def cmd_band(args):
    print("[CLI] Starting Band mode - connecting agents to Band platform...")
    print("[CLI] This requires valid Band credentials in .env")
    print("[CLI] See .env.example for configuration details.")
    from agents.spec_agent.agent import SpecAgent
    from agents.code_gen_agent.agent import CodeGenAgent
    from agents.qa_agent.agent import QAAgent

    agents = [
        SpecAgent(),
        CodeGenAgent(),
        QAAgent(),
    ]

    tasks = [asyncio.create_task(agent.run()) for agent in agents]
    print(f"[CLI] {len(agents)} agents connected to Band. Listening for feature requests...")
    print("[CLI] Submit requests via Band UI or API.")
    await asyncio.gather(*tasks)


def main():
    parser = argparse.ArgumentParser(
        description="SaaS Feature Factory - Multi-Agent System via Band"
    )
    sub = parser.add_subparsers(dest="command")

    demo_parser = sub.add_parser("demo", help="Run local demo with simulated Band rooms")
    band_parser = sub.add_parser("band", help="Connect to real Band platform")

    args = parser.parse_args()

    if args.command == "demo":
        asyncio.run(cmd_demo(args))
    elif args.command == "band":
        asyncio.run(cmd_band(args))
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
