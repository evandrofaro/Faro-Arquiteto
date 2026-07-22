import streamlit as st
import importlib
import orchestrator

importlib.reload(orchestrator)

st.set_page_config(page_title="Arquiteto Faro - Centro de Comando Trade", layout="wide", page_icon="📈")

st.title("📈 Arquiteto Faro — Orquestrador do Bot de Trade")
st.caption("Interaja com a IA para ler, auditar, refatorar e aplicar correções diretamente no seu repositório de Trading (Estilo Replit Agent).")

# --- SIDEBAR: Configuração do Projeto Alvo ---
st.sidebar.header("⚙️ Repositório Alvo (Trade)")

# Informe o caminho exato do seu repositório de trade no GitHub:
repo_alvo = st.sidebar.text_input("Repositório do Bot:", "evandrofaro/FaroBot")

modelo_selecionado = st.sidebar.selectbox(
    "Modelo de IA:",
    ["llama-3.3-70b-versatile", "qwen-2.5-32b", "deepseek-r1-distill-llama-70b"]
)

if st.sidebar.button("📂 Mapear Projeto de Trade"):
    with st.spinner(f"Lendo arquivos de {repo_alvo}..."):
        try:
            arquivos = orchestrator.listar_arquivos_repositorio(repo_alvo)
            st.sidebar.success(f"Encontrados {len(arquivos)} arquivos no Bot!")
            st.sidebar.json(arquivos)
        except Exception as e:
            st.sidebar.error(f"Erro ao conectar com {repo_alvo}: {e}")

# --- HISTÓRICO DO CHAT ---
if "messages" not in st.session_state:
    st.session_state.messages = [
        {
            "role": "system",
            "content": (
                f"Você é o Arquiteto Faro, um engenheiro especialista em Python, bots de trading, "
                f"integrações de APIs financeiras e arquitetura de software. "
                f"Seu objetivo é analisar, orquestrar e sugerir/aplicar correções e melhorias "
                f"no repositório do Bot de Trade ('{repo_alvo}')."
            )
        },
        {
            "role": "assistant",
            "content": f"Olá Evandro! Estou pronto para gerenciar e auditar o projeto **{repo_alvo}**. Qual módulo, estratégia ou correção no bot vamos analisar agora?"
        }
    ]

# Exibe histórico
for msg in st.session_state.messages:
    if msg["role"] != "system":
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

# --- INPUT DO USUÁRIO ---
if user_input := st.chat_input("Ex: 'Analise os scripts do bot', 'Refatore o gerenciamento de risco', 'Corrija o erro de import do numpy'"):
    st.session_state.messages.append({"role": "user", "content": user_input})
    with st.chat_message("user"):
        st.markdown(user_input)

    with st.chat_message("assistant"):
        with st.spinner(f"Analisando repositório {repo_alvo} e processando resposta..."):
            try:
                resposta = orchestrator.processar_chat_agente(
                    historico=st.session_state.messages,
                    repo_fullname=repo_alvo,
                    modelo=modelo_selecionado
                )
                st.markdown(resposta)
                st.session_state.messages.append({"role": "assistant", "content": resposta})
            except Exception as e:
                st.error(f"Erro ao processar: {e}")