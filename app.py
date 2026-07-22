import streamlit as st
import orchestrator

st.set_page_config(page_title="Arquiteto Faro - Agent", layout="wide", page_icon="🧠")

st.title("🧠 Arquiteto Faro (Agente Orquestrador)")
st.caption("Interaja com a IA para ler, planejar, refatorar e aplicar alterações diretamente no seu projeto no GitHub (Estilo Replit).")

# --- SIDEBAR: Configurações do Agente ---
st.sidebar.header("⚙️ Painel de Controle do Agente")
modelo_selecionado = st.sidebar.selectbox(
    "Modelo de IA:",
    ["llama-3.3-70b-versatile", "qwen-2.5-32b", "deepseek-r1-distill-llama-70b"]
)

repo_alvo = st.sidebar.text_input("Repositório Alvo (GitHub):", "evandrofaro/Faro-Arquiteto")

if st.sidebar.button("📂 Mapear Estrutura do Projeto"):
    with st.spinner("Lendo árvore de arquivos no GitHub..."):
        try:
            arquivos = orchestrator.listar_arquivos_repositorio(repo_alvo)
            st.sidebar.success(f"Encontrados {len(arquivos)} arquivos!")
            st.sidebar.json(arquivos)
        except Exception as e:
            st.sidebar.error(f"Erro ao acessar GitHub: {e}")

# --- CHAT CONVERSACIONAL ---
if "messages" not in st.session_state:
    st.session_state.messages = [
        {
            "role": "system",
            "content": (
                "Você é o Arquiteto Faro, um agente orquestrador especialista em Python, Streamlit, "
                "arquitetura de software e automações. Você pode ler arquivos do repositório, analisar a estrutura "
                "e propor ou aplicar alterações diretamente nos arquivos."
            )
        },
        {
            "role": "assistant",
            "content": "Olá Evandro! Sou o Arquiteto Faro. O repositório está conectado. Como posso ajudar na estrutura, front-end ou back-end hoje?"
        }
    ]

# Exibe histórico do Chat
for msg in st.session_state.messages:
    if msg["role"] != "system":
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

# Entradas do Usuário (Chat Input estilo Replit)
if user_input := st.chat_input("Digite suas instruções (ex: 'Analise o projeto', 'Altere a cor da barra do Streamlit', etc.)"):
    # Registra mensagem do usuário
    st.session_state.messages.append({"role": "user", "content": user_input})
    with st.chat_message("user"):
        st.markdown(user_input)

    # Resposta do Orquestrador
    with st.chat_message("assistant"):
        with st.spinner("O Arquiteto está analisando o projeto e processando..."):
            try:
                resposta = orchestrator.processar_chat_agente(
                    historico=st.session_state.messages,
                    repo_fullname=repo_alvo,
                    modelo=modelo_selecionado
                )
                st.markdown(resposta)
                st.session_state.messages.append({"role": "assistant", "content": resposta})
            except Exception as e:
                st.error(f"Erro no processamento do agente: {e}")