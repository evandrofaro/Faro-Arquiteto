import streamlit as st
import importlib
import orchestrator

# Recarrega o orquestrador para aplicar as novas funções do Supabase
importlib.reload(orchestrator)

st.set_page_config(page_title="Arquiteto Faro - Centro de Comando Trade", layout="wide", page_icon="🧠")

st.title("📈 Arquiteto Faro — Centro de Comando")
st.caption("Memória Persistente (Supabase) + Automação de Commits (GitHub)")

# --- SIDEBAR: Configuração do Projeto Alvo ---
st.sidebar.header("⚙️ Repositório Alvo (Trade)")

repo_alvo = st.sidebar.text_input("Repositório do Bot:", "evandrofaro/Trade-Assistant-Tool")

modelo_selecionado = st.sidebar.selectbox(
    "Modelo de IA:",
    ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "deepseek-r1-distill-llama-70b"]
)

if st.sidebar.button("📂 Mapear Projeto no GitHub"):
    with st.spinner(f"Lendo arquivos de {repo_alvo}..."):
        try:
            arquivos = orchestrator.listar_arquivos_repositorio(repo_alvo)
            st.sidebar.success(f"Encontrados {len(arquivos)} arquivos!")
            st.sidebar.json(arquivos)
        except Exception as e:
            st.sidebar.error(f"Erro ao conectar com {repo_alvo}: {e}")

# --- MEMÓRIA PERSISTENTE DO SUPABASE ---
# Carrega do banco de dados ao iniciar ou trocar de projeto
if "messages" not in st.session_state or st.session_state.get("repo_atual") != repo_alvo:
    st.session_state.repo_atual = repo_alvo
    
    # Busca mensagens anteriores salvas no Supabase
    historico_bd = orchestrator.carregar_historico_bd(repo_alvo)
    
    if historico_bd:
        st.session_state.messages = historico_bd
    else:
        # Apresentação inicial caso o histórico esteja vazio no banco
        st.session_state.messages = [
            {
                "role": "assistant",
                "content": f"Olá! Sou o **Arquiteto Faro**. Conectado ao repositório `{repo_alvo}` e ao banco de dados **Supabase**. Como posso ajudar no projeto hoje?"
            }
        ]

# Exibe o histórico de mensagens salvas
for msg in st.session_state.messages:
    if msg["role"] != "system":
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

# --- ENTRADA DO USUÁRIO ---
if user_input := st.chat_input("Ex: 'Analise os scripts do bot', 'Corrija o erro no arquivo app.py', 'Refatore o risco'"):
    # Grava e exibe a mensagem do usuário no front-end
    st.session_state.messages.append({"role": "user", "content": user_input})
    with st.chat_message("user"):
        st.markdown(user_input)
        
    # Grava no banco de dados Supabase
    orchestrator.salvar_mensagem_bd(repo_alvo, "user", user_input)

    # Processa com o Arquiteto
    with st.chat_message("assistant"):
        with st.spinner(f"Analisando repositório e gravando contexto no Supabase..."):
            try:
                resposta = orchestrator.processar_chat_agente(
                    historico=st.session_state.messages,
                    repo_fullname=repo_alvo,
                    modelo=modelo_selecionado
                )
                st.markdown(resposta)
                st.session_state.messages.append({"role": "assistant", "content": resposta})
            except Exception as e:
                st.error(f"Erro no processamento: {e}")