"""Documentation Agent - Auto-generates API docs and changelogs."""

from ..core.base_agent import BaseAgent
from ..core.message_bus import Message
from ..core.config import config
from ..common.state_reporter import report_state


class DocsAgent(BaseAgent):
    def __init__(self, **kwargs):
        super().__init__(name="docs-agent", **kwargs)
        self.docs_dir = config.sample_app_dir / "docs"
        self.docs_dir.mkdir(parents=True, exist_ok=True)

    def _update_changelog(self, feature: str, files: list):
        changelog_path = self.docs_dir / "CHANGELOG.md"
        entry = f"- **{__import__('datetime').datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}**: {feature} — modified {len(files)} file(s)"
        if changelog_path.exists():
            content = changelog_path.read_text()
            prefix = "# Changelog\n\n"
            if content.startswith("# Changelog"):
                content = content[len(prefix):]
            content = f"{prefix}{entry}\n{content}"
        else:
            content = f"# Changelog\n\n{entry}\n"
        changelog_path.write_text(content)
        print(f"[Docs Agent] Updated changelog")

    def _update_api_docs(self, blueprint: dict):
        api_docs_path = self.docs_dir / "API.md"
        endpoints = blueprint.get("api_endpoints", [])
        if not endpoints:
            return
        lines = ["# API Documentation\n"]
        for ep in endpoints:
            method = ep.get("method", "GET")
            path = ep.get("path", "/")
            desc = ep.get("description", "")
            lines.append(f"## {method} {path}\n\n{desc}\n")
            req = ep.get("request_body", {})
            if req:
                lines.append(f"**Request Body:**\n```json\n{__import__('json').dumps(req, indent=2)}\n```\n")
            resp = ep.get("response_shape", {})
            if resp:
                lines.append(f"**Response:**\n```json\n{__import__('json').dumps(resp, indent=2)}\n```\n")
        api_docs_path.write_text("\n".join(lines))
        print(f"[Docs Agent] Updated API docs ({len(endpoints)} endpoints)")

    async def handle_message(self, message: Message):
        if message.msg_type == "code_patch":
            feature = message.content.get("feature", "Unknown")
            files = message.content.get("changed_files", [])
            self._update_changelog(feature, files)
            await report_state("docs-agent", "done", message.correlation_id, "docs_updated", {
                "feature": feature, "files_updated": len(files),
            })
            await self.send(
                content={"feature": feature, "changelog_updated": True},
                msg_type="docs_updated",
                correlation_id=message.correlation_id,
            )

        elif message.msg_type == "blueprint":
            blueprint = message.content.get("blueprint", {})
            self._update_api_docs(blueprint)
