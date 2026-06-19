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

    def _build_correlation_map(self) -> dict:
        """Build feature_request.id → {blueprint, code_patch, qa_report} chain."""
        corr = {}
        reqs = [m for m in self.messages if m.msg_type == "feature_request"]
        for req in reqs:
            corr[req.id] = {"request": req, "blueprint": None, "code_patch": None, "qa_report": None}
        for m in self.messages:
            if m.correlation_id and m.correlation_id in corr:
                if m.msg_type == "blueprint" and corr[m.correlation_id]["blueprint"] is None:
                    corr[m.correlation_id]["blueprint"] = m
                elif m.msg_type == "code_patch" and corr[m.correlation_id]["code_patch"] is None:
                    corr[m.correlation_id]["code_patch"] = m
                elif m.msg_type == "qa_report" and corr[m.correlation_id]["qa_report"] is None:
                    corr[m.correlation_id]["qa_report"] = m
        return corr

    def print_workflow(self):
        state = self.get_workflow_state()
        corr = self._build_correlation_map()
        print(f"\n{'='*60}")
        print(f"WORKFLOW STATE - {len(state['completed_features'])} features completed")
        print(f"{'='*60}")
        for req in state["feature_requests"]:
            print(f"\n  FEATURE: {req['title']}")
            print(f"    Request ID: {req['id']}")
            chain = corr.get(req["id"], {})
            bp = chain.get("blueprint")
            if bp:
                bp_content = bp.content.get("blueprint", {})
                print(f"    Blueprint: {bp_content.get('feature', '')} ({bp_content.get('complexity', '')})")
                print(f"    Correlation: {bp.correlation_id}")
            patch = chain.get("code_patch")
            if patch:
                pc = patch.content
                print(f"    Code: {len(pc.get('changed_files', []))} files ({pc.get('status', '')})")
                print(f"    Correlation: {patch.correlation_id}")
            qa = chain.get("qa_report")
            if qa:
                qc = qa.content
                status = "PASSED" if qc.get("qa_signed_off") else "FAILED"
                print(f"    QA: {status}")
                print(f"    Correlation: {qa.correlation_id}")
        print(f"\n{'='*60}\n")
