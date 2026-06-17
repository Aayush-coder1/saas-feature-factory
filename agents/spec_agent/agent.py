"""
Product Spec Agent - Reads feature requests, analyzes the codebase,
and produces detailed implementation blueprints.
"""

from ..core.base_agent import BaseAgent
from ..core.message_bus import Message
from ..core.config import config
from ..llm_service import generate_blueprint
from ..common.state_reporter import report_state


class SpecAgent(BaseAgent):
    def __init__(self, **kwargs):
        super().__init__(name="spec-agent", **kwargs)
        self.sample_app_dir = config.sample_app_dir

    def _scan_codebase(self) -> str:
        tree = []
        for p in sorted(self.sample_app_dir.rglob("*")):
            if p.is_file() and p.suffix in (".ts", ".json", ".js") and "node_modules" not in p.parts:
                rel = p.relative_to(self.sample_app_dir)
                tree.append(f"  {rel} ({len(p.read_text().splitlines())} lines)")
        return "\n".join(tree)

    def _read_file_content(self, path: str) -> str:
        full_path = self.sample_app_dir / path
        if full_path.exists():
            return full_path.read_text()
        return ""

    def _build_blueprint_local(self, request: str, feature_title: str) -> dict:
        """Template-based blueprint generation for local/demo mode."""
        feature_lower = feature_title.lower()
        blueprint = {
            "feature": feature_title,
            "summary": f"Implement {feature_title} functionality in the SaaS app",
            "complexity": "medium",
            "files_to_create": [],
            "files_to_modify": [],
            "api_endpoints": [],
            "data_changes": "",
            "test_scenarios": [],
        }

        if "pagination" in feature_lower or "paginate" in feature_lower:
            blueprint.update({
                "summary": "Add pagination support to the tasks list endpoint",
                "complexity": "low",
                "files_to_modify": [
                    "src/routes/tasks.ts",
                    "src/db/memory.ts",
                    "tests/tasks.test.ts",
                ],
                "api_endpoints": [
                    {
                        "method": "GET",
                        "path": "/api/tasks",
                        "description": "List tasks with pagination support",
                        "request_body": {},
                        "response_shape": {
                            "data": "Task[]",
                            "total": "number",
                            "page": "number",
                            "limit": "number",
                            "total_pages": "number",
                        },
                    }
                ],
                "data_changes": "No schema changes. Add pagination query params (page, limit) to GET /api/tasks.",
                "test_scenarios": [
                    "GET /api/tasks?page=1&limit=2 returns 2 tasks",
                    "GET /api/tasks?page=1&limit=2 includes total and total_pages",
                    "GET /api/tasks with no pagination defaults to page=1, limit=20",
                    "GET /api/tasks with page beyond total returns empty data",
                ],
            })
        elif "otp" in feature_lower or "2fa" in feature_lower or "auth" in feature_lower:
            blueprint.update({
                "summary": "Add OTP-based authentication flow",
                "complexity": "high",
                "files_to_create": [
                    "src/routes/auth.ts",
                    "src/middleware/otp.ts",
                    "src/services/otp.ts",
                ],
                "files_to_modify": ["src/app.ts", "tests/tasks.test.ts"],
                "api_endpoints": [
                    {
                        "method": "POST",
                        "path": "/api/auth/request-otp",
                        "description": "Request an OTP code via userId",
                        "request_body": {"userId": "string"},
                        "response_shape": {"message": "string", "expires_in": "number"},
                    },
                    {
                        "method": "POST",
                        "path": "/api/auth/verify-otp",
                        "description": "Verify OTP code and receive session token",
                        "request_body": {"userId": "string", "otp": "string"},
                        "response_shape": {"token": "string", "expires_at": "string"},
                    },
                ],
                "data_changes": "Add OTP store (in-memory) with expiry. Each user gets a temporary OTP code.",
                "test_scenarios": [
                    "POST /api/auth/request-otp returns 200 with expires_in",
                    "POST /api/auth/verify-otp with valid code returns token",
                    "POST /api/auth/verify-otp with invalid code returns 401",
                    "OTP expires after configured TTL",
                ],
            })
        elif "label" in feature_lower or "tag" in feature_lower or "categor" in feature_lower:
            blueprint.update({
                "summary": "Add label/category support to tasks",
                "complexity": "low",
                "files_to_modify": [
                    "src/db/memory.ts",
                    "src/routes/tasks.ts",
                    "tests/tasks.test.ts",
                ],
                "api_endpoints": [
                    {
                        "method": "GET",
                        "path": "/api/tasks?label=:label",
                        "description": "Filter tasks by label",
                        "request_body": {},
                        "response_shape": {"data": "Task[]", "total": "number"},
                    },
                    {
                        "method": "PUT",
                        "path": "/api/tasks/:id",
                        "description": "Update task labels",
                        "request_body": {"labels": "string[]"},
                        "response_shape": {"data": "Task"},
                    },
                ],
                "data_changes": "Tasks already have a 'labels' field. Just add filtering logic to GET /api/tasks.",
                "test_scenarios": [
                    "GET /api/tasks?label=devops returns filtered tasks",
                    "PUT /api/tasks/:id updates labels correctly",
                    "Task with no labels returns empty labels array",
                ],
            })
        elif "export" in feature_lower or "csv" in feature_lower:
            blueprint.update({
                "summary": "Add CSV export endpoint for tasks",
                "complexity": "low",
                "files_to_modify": ["src/routes/tasks.ts", "tests/tasks.test.ts"],
                "files_to_create": ["src/services/exporter.ts"],
                "api_endpoints": [
                    {
                        "method": "GET",
                        "path": "/api/tasks/export/csv",
                        "description": "Export all tasks as CSV",
                        "request_body": {},
                        "response_shape": "text/csv file download",
                    }
                ],
                "data_changes": "No schema changes.",
                "test_scenarios": [
                    "GET /api/tasks/export/csv returns text/csv content type",
                    "CSV contains headers row",
                    "CSV contains all tasks as rows",
                ],
            })
        elif "rate limit" in feature_lower or "throttl" in feature_lower:
            blueprint.update({
                "summary": "Add rate limiting middleware",
                "complexity": "medium",
                "files_to_create": ["src/middleware/rateLimiter.ts"],
                "files_to_modify": ["src/app.ts", "tests/tasks.test.ts"],
                "api_endpoints": [],
                "data_changes": "No schema changes. Add in-memory rate limit tracking.",
                "test_scenarios": [
                    "Rapid requests to /api/tasks return 429 after limit",
                    "Rate limit resets after window expires",
                    "Different users have independent rate limits",
                ],
            })
        elif "search" in feature_lower:
            blueprint.update({
                "summary": "Add full-text search across tasks",
                "complexity": "medium",
                "files_to_modify": ["src/routes/tasks.ts", "src/db/memory.ts", "tests/tasks.test.ts"],
                "api_endpoints": [
                    {
                        "method": "GET",
                        "path": "/api/tasks?q=:search_term",
                        "description": "Search tasks by title and description",
                        "request_body": {},
                        "response_shape": {"data": "Task[]", "total": "number"},
                    }
                ],
                "data_changes": "No schema changes. Add search filtering to GET /api/tasks.",
                "test_scenarios": [
                    "GET /api/tasks?q=pipeline returns matching tasks",
                    "Search is case-insensitive",
                    "Empty query returns all tasks",
                ],
            })
        elif "dark" in feature_lower or "theme" in feature_lower:
            blueprint.update({
                "summary": "Add dark mode / theme toggle API preference",
                "complexity": "low",
                "files_to_create": ["src/routes/preferences.ts"],
                "files_to_modify": ["src/app.ts", "tests/tasks.test.ts"],
                "api_endpoints": [
                    {
                        "method": "GET",
                        "path": "/api/preferences/:userId",
                        "description": "Get user preferences including theme",
                        "request_body": {},
                        "response_shape": {"theme": "light|dark", "userId": "string"},
                    },
                    {
                        "method": "PUT",
                        "path": "/api/preferences/:userId/theme",
                        "description": "Update user theme preference",
                        "request_body": {"theme": "light|dark"},
                        "response_shape": {"theme": "string", "updated": "boolean"},
                    },
                ],
                "data_changes": "Add preferences: Map<string, UserPreferences> with theme field.",
                "test_scenarios": [
                    "GET /api/preferences/:userId returns theme preference",
                    "PUT /api/preferences/:userId/theme updates the theme",
                    "Default theme is 'light'",
                ],
            })
        else:
            blueprint.update({
                "complexity": "medium",
                "files_to_modify": ["src/routes/tasks.ts", "src/db/memory.ts", "tests/tasks.test.ts"],
                "test_scenarios": [
                    f"Feature '{feature_title}' works correctly",
                    "No existing tests break",
                ],
            })

        return blueprint

    async def handle_message(self, message: Message):
        if message.msg_type != "feature_request":
            return

        request = message.content.get("request", "")
        title = message.content.get("title", "Unknown Feature")

        print(f"\n{'='*60}")
        print(f"[Spec Agent] Analyzing: {title}")
        print(f"[Spec Agent] Scanning codebase...")

        codebase_tree = self._scan_codebase()

        blueprint = await generate_blueprint(request, title, codebase_tree)
        if blueprint is None:
            blueprint = self._build_blueprint_local(request, title)
            print(f"[Spec Agent] Using template-based blueprint generation")
        else:
            print(f"[Spec Agent] Using LLM-powered blueprint generation")

        print(f"[Spec Agent] Complexity: {blueprint['complexity']}")
        print(f"[Spec Agent] Files to create: {len(blueprint['files_to_create'])}")
        print(f"[Spec Agent] Files to modify: {len(blueprint['files_to_modify'])}")
        print(f"[Spec Agent] API endpoints: {len(blueprint['api_endpoints'])}")
        print(f"[Spec Agent] Posting blueprint to room...")

        await report_state("spec-agent", "done", message.id, "blueprint", {"feature": title})
        await self.send(
            content={
                "blueprint": blueprint,
                "raw_request": request,
                "codebase_snapshot": codebase_tree,
            },
            msg_type="blueprint",
            correlation_id=message.id,
        )
