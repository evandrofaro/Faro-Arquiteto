import streamlit as st
import orchestrator

st.set_page_config(page_title="Arquitetura Faro - Orquestrador", layout="wide")
st.title("🛠️ Centro de Alterações de Código")

# Aba ou Bloco para Refatoração Automática
st.subheader("Alteração Automática de Arquivos")

caminho_alvo = st.text_input("Caminho do Arquivo (ex: app.py ou orchestrator.py):", "app.py")
instrucao = st.text_area("O que você deseja alterar ou corrigir no código?", "")

if st.button("🚀 Executar Alteração"):
    if not instrucao:
        st.warning("Por favor, digite a instrução da alteração.")
    else:
        with st.spinner("Lendo arquivo, gerando alterações e atualizando..."):
            try:
                res = orchestrator.processar_solicitacao_alteracao(caminho_alvo, instrucao)
                st.success(res)
            except Exception as e:
                st.error(f"Erro durante a alteração: {e}")