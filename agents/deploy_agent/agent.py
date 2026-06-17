"""Deployment Agent - Deploys successfully tested features to staging."""

import subprocess
import time
import socket
from ..core.base_agent import BaseAgent
from ..core.message_bus import Message
from ..core.config import config
from ..common.state_reporter import report_state


class DeployAgent(BaseAgent):
    def __init__(self, **kwargs):
        super().__init__(name="deploy-agent", **kwargs)
        self._server_started = False

    def _port_in_use(self, port: int = 3001) -> bool:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            return s.connect_ex(("127.0.0.1", port)) == 0

    def _start_sample_app(self) -> bool:
        if self._port_in_use():
            print("[Deploy Agent] Server already running on port 3001")
            return True
        try:
            app_dir = config.sample_app_dir
            subprocess.Popen(
                ["npx", "tsx", "src/index.ts"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                cwd=app_dir,
            )
            self._server_started = True
            return True
        except Exception as e:
            print(f"[Deploy Agent] Start failed: {e}")
            return False

    def _smoke_test(self) -> bool:
        import httpx
        for attempt in range(5):
            try:
                resp = httpx.get("http://localhost:3001/health", timeout=3)
                return resp.status_code == 200
            except Exception:
                if attempt < 4:
                    time.sleep(2)
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
        if success:
            smoke_ok = self._smoke_test()
        else:
            smoke_ok = False

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
