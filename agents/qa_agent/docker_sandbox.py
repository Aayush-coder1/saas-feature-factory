"""
Manages Docker-based sandbox for isolated test execution.
"""

import asyncio
import subprocess
import sys
import json
from pathlib import Path
from ..core.config import config


class DockerSandbox:
    def __init__(self):
        self.container_name = "saas-factory-test-runner"
        self.app_dir = config.sample_app_dir

    def _run_docker(self, cmd: list[str]) -> subprocess.CompletedProcess:
        return subprocess.run(cmd, capture_output=True, text=True, timeout=120)

    def build_test_image(self) -> bool:
        print("[DockerSandbox] Building test image...")
        result = self._run_docker([
            "docker", "build",
            "-f", "Dockerfile.test",
            "-t", "saas-factory-tests",
            ".",
        ])
        if result.returncode != 0:
            print(f"[DockerSandbox] Build failed:\n{result.stderr}")
            return False
        return True

    def run_tests(self) -> dict:
        print("[DockerSandbox] Running tests in isolated container...")
        result = self._run_docker([
            "docker", "run", "--rm",
            "--name", self.container_name,
            "-v", f"{self.app_dir}:/app",
            "-w", "/app",
            "node:22-alpine",
            "npx", "vitest", "run", "--reporter=json",
        ])
        output = result.stdout
        try:
            test_results = json.loads(output)
        except json.JSONDecodeError:
            test_results = {
                "stdout": output,
                "stderr": result.stderr,
                "exit_code": result.returncode,
            }
        return {
            "success": result.returncode == 0,
            "output": output,
            "error": result.stderr,
            "exit_code": result.returncode,
            "parsed": test_results,
        }

    async def run_tests_local_async(self) -> dict:
        """Run tests directly (without Docker) using async subprocess."""
        print("[DockerSandbox] Running tests locally (async)...")
        npx = "npx.cmd" if sys.platform.startswith("win") else "npx"
        process = await asyncio.create_subprocess_exec(
            npx, "vitest", "run", "--reporter=json",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=self.app_dir,
        )
        try:
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=60)
            out = stdout.decode() if stdout else ""
            err = stderr.decode() if stderr else ""
        except asyncio.TimeoutError:
            process.kill()
            return {
                "success": False,
                "output": "",
                "error": "Test execution timed out after 60s",
                "exit_code": -1,
                "parsed": {},
            }
        try:
            test_results = json.loads(out) if out.strip() else {}
        except json.JSONDecodeError:
            if "Tests" in out or "passed" in out or "failed" in out:
                test_results = {"raw_output": out}
            else:
                test_results = {}
        return {
            "success": process.returncode == 0 if process.returncode is not None else False,
            "output": out,
            "error": err,
            "exit_code": process.returncode if process.returncode is not None else -1,
            "parsed": test_results,
        }

    def run_tests_local(self) -> dict:
        """Run tests directly (without Docker) for local mode."""
        print("[DockerSandbox] Running tests locally...")
        result = subprocess.run(
            ["npx", "vitest", "run", "--reporter=json"],
            capture_output=True, text=True, timeout=60,
            cwd=self.app_dir,
        )
        try:
            test_results = json.loads(result.stdout) if result.stdout.strip() else {}
        except json.JSONDecodeError:
            test_results = {}
        return {
            "success": result.returncode == 0,
            "output": result.stdout,
            "error": result.stderr,
            "exit_code": result.returncode,
            "parsed": test_results,
        }

    def cleanup(self):
        subprocess.run(
            ["docker", "rm", "-f", self.container_name],
            capture_output=True,
        )
