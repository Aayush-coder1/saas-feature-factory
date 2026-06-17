"""
Band Room Manager - Handles the shared collaboration room
where agents communicate and share context.
"""

from ..core.message_bus import Message


class RoomManager:
    def __init__(self):
        self.channel = "feature-factory"
        self.messages: list[Message] = []

    def add_message(self, message: Message):
        self.messages.append(message)
        if len(self.messages) > 1000:
            self.messages = self.messages[-1000:]

    def get_workflow_state(self) -> dict:
        state = {
            "channel": self.channel,
            "total_messages": len(self.messages),
            "feature_requests": [],
            "blueprints": [],
            "code_patches": [],
            "qa_reports": [],
            "completed_features": [],
        }
        for msg in self.messages:
            if msg.msg_type == "feature_request":
                state["feature_requests"].append({
                    "id": msg.id,
                    "title": msg.content.get("title", ""),
                    "request": msg.content.get("request", ""),
                })
            elif msg.msg_type == "blueprint":
                state["blueprints"].append({
                    "id": msg.id,
                    "feature": msg.content.get("blueprint", {}).get("feature", ""),
                    "complexity": msg.content.get("blueprint", {}).get("complexity", ""),
                })
            elif msg.msg_type == "code_patch":
                state["code_patches"].append({
                    "id": msg.id,
                    "feature": msg.content.get("feature", ""),
                    "files": len(msg.content.get("changed_files", [])),
                    "status": msg.content.get("status", ""),
                })
            elif msg.msg_type == "qa_report":
                report = msg.content
                feature = report.get("feature", "")
                signed_off = report.get("qa_signed_off", False)
                state["qa_reports"].append({
                    "id": msg.id,
                    "feature": feature,
                    "signed_off": signed_off,
                })
                if signed_off:
                    state["completed_features"].append(feature)
        return state

    def print_workflow(self):
        state = self.get_workflow_state()
        print(f"\n{'='*60}")
        print(f"WORKFLOW STATE - {len(state['completed_features'])} features completed")
        print(f"{'='*60}")
        for req in state["feature_requests"]:
            print(f"\n  FEATURE: {req['title']}")
            print(f"    Request ID: {req['id']}")
            bps = [b for b in state["blueprints"] if b["id"].startswith(req["id"][:8])]
            if bps:
                bp = bps[0]
                print(f"    Blueprint: {bp['feature']} ({bp['complexity']})")
            patches = [p for p in state["code_patches"] if p["feature"] == req["title"]]
            if patches:
                p = patches[0]
                print(f"    Code: {p['files']} files ({p['status']})")
            reports = [r for r in state["qa_reports"] if r["feature"] == req["title"]]
            if reports:
                r = reports[0]
                status = "PASSED" if r["signed_off"] else "FAILED"
                print(f"    QA: {status}")
        print(f"\n{'='*60}\n")
