import streamlit as st
import orchestrator

st.set_page_config(page_title="Arquitetura Faro", layout="wide")
st.title("🧠 Arquitetura Faro - Orquestrador")

# Sidebar para escolha do modelo
modelo_selecionado = st.sidebar.selectbox(
    "Modelo de IA (Groq Nuvem):",
    [
        "llama-3.3-70b-versatile",
        "qwen-2.5-32b",
        "deepseek-r1-distill-llama-70b",
        "llama-3.1-8b-instant"
    ]
)

# Histórico da sessão
if "messages" not in st.session_state:
    st.session_state.messages = [
        {"role": "system", "content": "Você é o Arquiteto Faro, orquestrador especialista em Python, Streamlit e automações."}
    ]

# Exibe histórico
for msg in st.session_state.messages:
    if msg["role"] != "system":
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

# Entrada do usuário
if prompt := st.chat_input("Digite sua instrução..."):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        with st.spinner("Processando..."):
            try:
                resposta = orchestrator.consultar_groq(
                    st.session_state.messages, 
                    modelo=modelo_selecionado
                )
                st.markdown(resposta)
                st.session_state.messages.append({"role": "assistant", "content": resposta})
            except Exception as e:
                st.error(f"Erro: {e}")