FROM python:3.12-slim

WORKDIR /workspace

RUN pip install --no-cache-dir \
    pydantic \
    python-dotenv \
    pyyaml \
    httpx \
    rich

COPY agents/ ./agents/
COPY .env ./

ENV PYTHONPATH=/workspace

CMD ["python", "-m", "agents.orchestrator.cli", "demo"]
