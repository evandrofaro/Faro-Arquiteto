import os
import sys
import subprocess
import config

def initialize_environment():
    """Garante que as pastas e o ambiente estejam configurados adequadamente."""
    print("🏛️ [Arquitetura Faro] Inicializando ambiente local...")
    print(f"📁 Diretório de Modelos (.gguf): {config.MODELS_DIR}")
    
    # Verifica a presença de arquivos .gguf
    gguf_files = [f for f in os.listdir(config.MODELS_DIR) if f.endswith(".gguf")]
    if gguf_files:
        print(f"✅ Encontrados {len(gguf_files)} modelo(s) .gguf na pasta /models:")
        for model in gguf_files:
            print(f"   - {model}")
    else:
        print("⚠️ Nenhum arquivo .gguf encontrado na pasta /models.")
        print("💡 Dica: Adicione seus modelos .gguf na pasta 'models' para utilizá-los no orquestrador.")

def start_app():
    """Executa a interface Streamlit da Arquitetura Faro."""
    initialize_environment()
    print("\n🚀 Iniciando a estação unificada da Arquitetura Faro...")
    
    cmd = [
        sys.executable, "-m", "streamlit", "run", "app.py",
        "--server.address", config.STREAMLIT_HOST,
        "--server.port", str(config.STREAMLIT_PORT)
    ]
    
    try:
        subprocess.run(cmd, check=True)
    except KeyboardInterrupt:
        print("\n🛑 Servidor encerrado pelo usuário.")
    except Exception as e:
        print(f"❌ Erro ao iniciar a aplicação: {e}")

if __name__ == "__main__":
    start_app()