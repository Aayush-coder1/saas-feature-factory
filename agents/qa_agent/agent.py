"""
QA Tester Agent - Takes code patches from the Band room,
runs tests in an isolated Docker sandbox, validates no
breaking changes, and signs off on deployment.
"""

from ..core.base_agent import BaseAgent
from ..core.message_bus import Message
from ..core.config import config
from ..common.state_reporter import report_state
from .docker_sandbox import DockerSandbox


class QAAgent(BaseAgent):
    def __init__(self, **kwargs):
        super().__init__(name="qa-agent", **kwargs)
        self.sandbox = DockerSandbox()

    def _format_test_report(self, test_result: dict, feature: str) -> dict:
        parsed = test_result.get("parsed", {})
        total = len(parsed.get("testResults", []))
        passed = sum(
            1 for tr in parsed.get("testResults", [])
            if tr.get("status") == "passed"
        )
        failed = sum(
            1 for tr in parsed.get("testResults", [])
            if tr.get("status") == "failed"
        )

        return {
            "feature": feature,
            "overall_status": "passed" if test_result["success"] else "failed",
            "total_tests": total,
            "passed": passed,
            "failed": failed,
            "output": test_result.get("output", ""),
            "errors": test_result.get("error", ""),
            "exit_code": test_result.get("exit_code", -1),
            "qa_signed_off": test_result["success"],
        }

    async def handle_message(self, message: Message):
        if message.msg_type != "code_patch":
            return

        feature = message.content.get("feature", "Unknown")
        changed_files = message.content.get("changed_files", [])

        print(f"\n{'='*60}")
        print(f"[QA Agent] Testing feature: {feature}")
        print(f"[QA Agent] Changed files: {len(changed_files)}")

        if config.is_local_mode:
            print("[QA Agent] Running tests locally...")
            test_result = await self.sandbox.run_tests_local_async()
        else:
            print("[QA Agent] Building Docker sandbox...")
            if not self.sandbox.build_test_image():
                test_result = {
                    "success": False,
                    "output": "",
                    "error": "Docker build failed",
                    "exit_code": 1,
                    "parsed": {},
                }
            else:
                test_result = self.sandbox.run_tests()

        report = self._format_test_report(test_result, feature)

        if report["qa_signed_off"]:
            print(f"[QA Agent] ALL TESTS PASSED! Signing off {feature}")
        else:
            print(f"[QA Agent] TESTS FAILED: {report['failed']} failures")
            print(f"[QA Agent] Errors: {report['errors'][:500]}")

        await report_state("qa-agent", "done", message.correlation_id, "qa_report", report)
        await self.send(
            content=report,
            msg_type="qa_report",
            correlation_id=message.correlation_id,
        )
