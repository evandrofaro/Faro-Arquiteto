import os
import streamlit as st
import pandas as pd
import numpy as np
from orchestrator import FaroBotOrchestrator

st.set_page_config(page_title="Arquitetura Faro — Central de Suporte", layout="wide")
st.title("🏛️ Arquitetura Faro — Estação Unificada Local")

# ---------------------------------------------------------
# FUNÇÕES AUXILIARES DE MAPEAMENTO
# ---------------------------------------------------------
def get_gguf_models(models_dir="./models"):
    """Lista todos os arquivos .gguf encontrados no diretório de modelos."""
    if not os.path.exists(models_dir):
        os.makedirs(models_dir, exist_ok=True)
    
    gguf_files = []
    for root, _, files in os.walk(models_dir):
        for file in files:
            if file.endswith(".gguf"):
                gguf_files.append(os.path.relpath(os.path.join(root, file), models_dir))
    return gguf_files

def get_project_files():
    """Mapeia arquivos do projeto (códigos, configs e documentações)."""
    allowed_extensions = (".py", ".json", ".md", ".txt", ".yaml", ".yml", ".env")
    ignored_dirs = {".git", "__pycache__", "venv", ".venv", "models"}
    
    files_list = []
    for root, dirs, files in os.walk("."):
        # Ignora pastas desnecessárias
        dirs[:] = [d for d in dirs if d not in ignored_dirs]
        for file in files:
            if file.endswith(allowed_extensions) and not file.startswith("."):
                files_list.append(os.path.relpath(os.path.join(root, file), "."))
    return sorted(files_list)

# ---------------------------------------------------------
# PAINEL LATERAL: SELEÇÃO DO MODELO LOCAL (.GGUF)
# ---------------------------------------------------------
st.sidebar.header("⚙️ Configurações da Arquitetura Faro")

available_models = get_gguf_models()
if available_models:
    selected_model = st.sidebar.selectbox("Selecione o Modelo Local (.gguf)", available_models)
    st.sidebar.success(f"Modelo Ativo: `{selected_model}`")
else:
    selected_model = None
    st.sidebar.warning("Nenhum arquivo .gguf encontrado na pasta `/models`.")
    st.sidebar.info("Coloque seus modelos .gguf dentro da pasta `./models` para ativá-los.")

# Inicializa o orquestrador enviando o modelo .gguf selecionado
orchestrator = FaroBotOrchestrator(model_path=os.path.join("./models", selected_model) if selected_model else None)

# ---------------------------------------------------------
# ABAS DE TRABALHO
# ---------------------------------------------------------
tab_dev, tab_bot = st.tabs(["🛠️ Orquestrador & Código (Arquitetura Faro)", "📊 Monitoramento do FaroBot"])

with tab_dev:
    col_left, col_right = st.columns([1, 1])
    
    with col_left:
        st.subheader("💬 Chat do Orquestrador Local")
        
        files_list = get_project_files()
        selected_file = st.selectbox("Escolha o Módulo para Alterar", files_list if files_list else ["main.py"])
        
        user_instruction = st.text_area("O que você deseja corrigir ou incluir neste módulo?", height=150)
        
        if st.button("Executar Alteração na Arquitetura Faro"):
            if not user_instruction.strip():
                st.warning("Por favor, insira uma instrução antes de executar.")
            else:
                with st.spinner("IA Local processando e gravando as alterações no arquivo..."):
                    result = orchestrator.fix_module(selected_file, user_instruction)
                    st.success(result)

    with col_right:
        st.subheader(f"📄 Inspect de Código: {selected_file if 'selected_file' in locals() else ''}")
        if 'selected_file' in locals() and selected_file:
            try:
                code_content = orchestrator.read_file(selected_file)
                # Define linguagem do syntax highlight com base na extensão
                lang = "python" if selected_file.endswith(".py") else "json" if selected_file.endswith(".json") else "text"
                st.code(code_content, language=lang)
            except Exception as e:
                st.error(f"Erro ao ler o arquivo: {e}")

with tab_bot:
    st.subheader("📈 Painel de Controle e Sinais de Suporte")
    prices = [100 + i + (np.random.randn() * 0.5) for i in range(20)]
    st.metric("Preço Atual", f"${prices[-1]:.2f}")
    st.line_chart(pd.DataFrame({"Preço": prices}))