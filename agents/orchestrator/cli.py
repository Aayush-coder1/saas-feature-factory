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
    print("[CLI] This requires valid Band credentials in .env")
    print("[CLI] See .env.example for configuration details.")

    if not config.band_api_key:
        print("[CLI] ERROR: BAND_API_KEY not set. Configure .env file.")
        print("[CLI] Copy .env.example to .env and fill in your Band credentials.")
        return

    from agents.spec_agent.agent import SpecAgent
    from agents.code_gen_agent.agent import CodeGenAgent
    from agents.qa_agent.agent import QAAgent
    from agents.deploy_agent.agent import DeployAgent
    from agents.docs_agent.agent import DocsAgent

    agents = [
        SpecAgent(),
        CodeGenAgent(),
        QAAgent(),
        DeployAgent(),
        DocsAgent(),
    ]

    tasks = [asyncio.create_task(agent.run()) for agent in agents]
    print(f"[CLI] {len(agents)} agents connected to Band. Listening for feature requests...")
    print(f"[CLI] Room: feature-factory | Project: {config.band_project_id or 'default'}")
    print("[CLI] Submit feature requests via the Band dashboard.")
    await asyncio.gather(*tasks)


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
