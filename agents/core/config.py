import os
from pathlib import Path
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(PROJECT_ROOT / ".env")
SAMPLE_APP_DIR = PROJECT_ROOT / "sample-app"
FEATURES_DIR = SAMPLE_APP_DIR / "features"
AGENTS_DIR = PROJECT_ROOT / "agents"

class Config:
    agent_mode: str = os.getenv("AGENT_MODE", "local")
    sample_app_dir: Path = SAMPLE_APP_DIR
    features_dir: Path = FEATURES_DIR
    agents_dir: Path = AGENTS_DIR

    band_rest_url: str = os.getenv("BAND_REST_URL", "https://app.band.ai/")
    band_ws_url: str = os.getenv("BAND_WS_URL", "wss://app.band.ai/api/v1/socket/websocket")
    band_api_key: str = os.getenv("BAND_API_KEY", "")
    band_project_id: str = os.getenv("BAND_PROJECT_ID", "")

    openai_api_base: str = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    model_name: str = os.getenv("MODEL_NAME", "gpt-4o")
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")

    _agent_creds: dict = {}

    def __init__(self):
        self._load_agent_creds()

    def _load_agent_creds(self):
        for name in ["spec-agent", "code-gen-agent", "qa-agent", "deploy-agent", "docs-agent"]:
            key = name.replace("-", "_").upper()
            agent_id = os.getenv(f"{key}_ID", "")
            api_key = os.getenv(f"{key}_API_KEY", "")
            if agent_id and api_key:
                self._agent_creds[name] = {"agent_id": agent_id, "api_key": api_key}

    def get_agent_credentials(self, name: str) -> dict | None:
        return self._agent_creds.get(name)

    @property
    def has_band_agents(self) -> bool:
        return len(self._agent_creds) >= 5

    @property
    def is_band_mode(self) -> bool:
        return self.agent_mode.lower() == "band" and self.has_band_agents

    @property
    def is_local_mode(self) -> bool:
        return not self.is_band_mode


config = Config()
