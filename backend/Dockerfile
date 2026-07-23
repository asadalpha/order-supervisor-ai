FROM python:3.12-slim

# Install latest uv (official binary, not pip package)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copy project files
COPY pyproject.toml uv.lock README.md ./
COPY app ./app

# Install dependencies into .venv (uv run auto-discovers it)
RUN uv sync --frozen --no-dev --no-cache

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
