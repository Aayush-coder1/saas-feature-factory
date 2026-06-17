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

    grok_api_key: str = os.getenv("GROK_API_KEY", "")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")

    @property
    def is_band_mode(self) -> bool:
        return self.agent_mode.lower() == "band" and bool(self.band_api_key)

    @property
    def is_local_mode(self) -> bool:
        return not self.is_band_mode


config = Config()
