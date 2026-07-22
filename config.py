import os
from pathlib import Path

# Diretórios Base
BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
LOGS_DIR = BASE_DIR / "logs"

# Garante a existência dos diretórios cruciais
MODELS_DIR.mkdir(parents=True, exist_ok=True)
LOGS_DIR.mkdir(parents=True, exist_ok=True)

# Configurações do Orquestrador e IA Local
DEFAULT_FALLBACK_MODEL = "qwen2.5-coder:7b"
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")

# Configurações do Servidor Web / Streamlit
STREAMLIT_HOST = "0.0.0.0"
STREAMLIT_PORT = 8501

# Extensões de arquivos permitidas para leitura e edição
ALLOWED_EXTENSIONS = (".py", ".json", ".md", ".txt", ".yaml", ".yml", ".env", ".ini")
IGNORED_DIRS = {".git", "__pycache__", "venv", ".venv", "models", "logs", ".pytest_cache"}