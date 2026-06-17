"""Deployment Agent - Deploys successfully tested features to staging."""

import subprocess
import time
from ..core.base_agent import BaseAgent
from ..core.message_bus import Message
from ..core.config import config
from ..common.state_reporter import report_state


class DeployAgent(BaseAgent):
    def __init__(self, **kwargs):
        super().__init__(name="deploy-agent", **kwargs)
        self._process = None

    def _start_sample_app(self) -> bool:
        """Start the sample app via Node.js for smoke testing."""
        try:
            app_dir = config.sample_app_dir
            self._process = subprocess.Popen(
                ["npx", "tsx", "src/index.ts"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                cwd=app_dir,
            )
            time.sleep(3)
            return True
        except Exception as e:
            print(f"[Deploy Agent] Start failed: {e}")
            return False

    def _smoke_test(self) -> bool:
        """Hit the health endpoint to verify the app is running."""
        import httpx
        try:
            resp = httpx.get("http://localhost:3001/health", timeout=5)
            return resp.status_code == 200
        except Exception:
            return False

    async def handle_message(self, message: Message):
        if message.msg_type != "qa_report":
            return

        report = message.content
        feature = report.get("feature", "Unknown")
        signed_off = report.get("qa_signed_off", False)

        if not signed_off:
            print(f"\n[Deploy Agent] Skipping deploy for {feature} — QA did not pass")
            return

        print(f"\n{'='*60}")
        print(f"[Deploy Agent] Deploying: {feature}")

        success = self._start_sample_app()
        smoke_ok = self._smoke_test() if success else False

        status = "deployed" if smoke_ok else "failed"
        print(f"[Deploy Agent] Result: {status}")

        await report_state("deploy-agent", status, message.correlation_id, "deployment_result", {
            "feature": feature, "smoke_test": smoke_ok,
        })
        await self.send(
            content={"feature": feature, "status": status, "smoke_test": smoke_ok},
            msg_type="deployment_result",
            correlation_id=message.correlation_id,
        )
