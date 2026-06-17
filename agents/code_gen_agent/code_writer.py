"""
Handles the actual file generation and modification in the workspace.
"""

from pathlib import Path
from ..core.config import config


class CodeWriter:
    def __init__(self):
        self.app_dir = config.sample_app_dir

    def write_file(self, path: str, content: str) -> Path:
        full_path = self.app_dir / path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        full_path.write_text(content)
        print(f"[CodeWriter] Created: {path}")
        return full_path

    def read_file(self, path: str) -> str:
        full_path = self.app_dir / path
        if full_path.exists():
            return full_path.read_text()
        return ""

    def modify_file(self, path: str, search: str, replace: str) -> bool:
        full_path = self.app_dir / path
        if not full_path.exists():
            print(f"[CodeWriter] Error: {path} not found")
            return False
        content = full_path.read_text()
        if search not in content:
            if replace in content:
                return True
            search_lines = [s.strip() for s in search.splitlines()]
            content_lines = content.splitlines(keepends=True)
            for i in range(len(content_lines) - len(search_lines) + 1):
                if all(content_lines[i + j].strip() == search_lines[j] for j in range(len(search_lines))):
                    start = sum(len(content_lines[k]) for k in range(i))
                    end = sum(len(content_lines[k]) for k in range(i + len(search_lines)))
                    content = content[:start] + replace + content[end:]
                    full_path.write_text(content)
                    print(f"[CodeWriter] Modified (fuzzy): {path}")
                    return True
            print(f"[CodeWriter] Warning: search text not found in {path}")
            return False
        content = content.replace(search, replace, 1)
        full_path.write_text(content)
        print(f"[CodeWriter] Modified: {path}")
        return True

    def append_to_file(self, path: str, content: str):
        full_path = self.app_dir / path
        with open(full_path, "a") as f:
            f.write(content)
        print(f"[CodeWriter] Appended to: {path}")

    def file_exists(self, path: str) -> bool:
        return (self.app_dir / path).exists()

    def delete_file(self, path: str) -> bool:
        full_path = self.app_dir / path
        if full_path.exists():
            full_path.unlink()
            print(f"[CodeWriter] Deleted: {path}")
            return True
        return False

    def get_diff(self) -> str:
        """Get git diff of changes made."""
        import subprocess
        try:
            result = subprocess.run(
                ["git", "diff", "--stat"],
                capture_output=True, text=True,
                cwd=self.app_dir,
            )
            return result.stdout
        except Exception:
            return "(git diff not available)"
