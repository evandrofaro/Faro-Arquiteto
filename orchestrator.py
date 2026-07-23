import os
import json
import re
from dotenv import load_dotenv
from groq import Groq
from github import Github
from supabase import create_client, Client

load_dotenv()

# --- CONFIGURAÇÕES FIXAS DO PROJETO ---
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

# Supabase (Banco de Dados do Projeto Arquitetura Faro)
SUPABASE_URL = "https://kjklvdityzwkpbkpwljo.supabase.co"
SUPABASE_KEY = "sb_publishable_YaplejleHyeSaFDdAiiKdQ_QNHnjiff"

# Inicializa o cliente Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- CONEXÃO GITHUB ---

def obter_cliente_github():
    if not GITHUB_TOKEN:
        raise ValueError("GITHUB_TOKEN não configurada nas variáveis de ambiente ou Secrets!")
    return Github(GITHUB_TOKEN)

def listar_arquivos_repositorio(repo_fullname: str):
    """Retorna a lista de arquivos do projeto no GitHub."""
    g = obter_cliente_github()
    repo = g.get_repo(repo_fullname)
    contents = repo.get_contents("")
    arquivos = []
    
    while contents:
        file_content = contents.pop(0)
        if file_content.type == "dir":
            if file_content.path not in [".git", "__pycache__", ".streamlit", "venv"]:
                contents.extend(repo.get_contents(file_content.path))
        else:
            if not file_content.path.endswith((".png", ".jpg", ".bin", ".zip", ".pyc")):
                arquivos.append(file_content.path)
    return arquivos

def ler_arquivo_github(repo_fullname: str, caminho: str):
    """Lê o conteúdo textual de um arquivo direto do GitHub."""
    g = obter_cliente_github()
    repo = g.get_repo(repo_fullname)
    file_content = repo.get_contents(caminho)
    return file_content.decoded_content.decode("utf-8")

def salvar_arquivo_github(repo_fullname: str, caminho: str, novo_conteudo: str, mensagem_commit: str):
    """Cria ou atualiza um arquivo diretamente no repositório do GitHub com busca prévia de SHA."""
    try:
        g = obter_cliente_github()
        repo = g.get_repo(repo_fullname)
        
        try:
            file_content = repo.get_contents(caminho)
            repo.update_file(
                path=file_content.path,
                message=mensagem_commit,
                content=novo_conteudo,
                sha=file_content.sha,
                branch="main"
            )
            return f"✅ Arquivo `{caminho}` atualizado no repositório `{repo_fullname}` com sucesso!"
        except Exception:
            repo.create_file(
                path=caminho,
                message=mensagem_commit,
                content=novo_conteudo,
                branch="main"
            )
            return f"✅ Arquivo `{caminho}` criado no repositório `{repo_fullname}` com sucesso!"
            
    except Exception as e:
        return f"❌ Falha ao conectar ao repositório `{repo_fullname}`: {e}"

# --- GESTÃO DE BANCO DE DADOS (SUPABASE) ---

def carregar_historico_bd(repo_fullname: str, limite: int = 20):
    """Busca o histórico persistente gravado no Supabase para o repositório informado."""
    try:
        resposta = supabase.table("chat_history") \
            .select("role, content") \
            .eq("repo_fullname", repo_fullname) \
            .order("created_at", desc=False) \
            .limit(limite) \
            .execute()
        return resposta.data if resposta.data else []
    except Exception as e:
        print(f"Erro ao ler histórico do Supabase: {e}")
        return []

def salvar_mensagem_bd(repo_fullname: str, role: str, content: str):
    """Grava uma nova interação no Supabase."""
    try:
        data = {
            "repo_fullname": repo_fullname,
            "role": role,
            "content": content
        }
        supabase.table("chat_history").insert(data).execute()
    except Exception as e:
        print(f"Erro ao salvar mensagem no Supabase: {e}")

# --- LÓGICA DO AGENTE ORQUESTRADOR ---

def processar_chat_agente(historico: list, repo_fullname: str, modelo: str = "llama-3.1-8b-instant"):
    """Processa o chat utilizando a memória do banco de dados e capacidade de realizar commits."""
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY não configurada!")

    client = Groq(api_key=GROQ_API_KEY)
    
    # Mapeia estrutura do projeto alvo
    try:
        lista_arquivos = listar_arquivos_repositorio(repo_fullname)
        lista_resumida = lista_arquivos[:30]
        contexto_projeto = f"Arquivos mapeados no repositório '{repo_fullname}': {', '.join(lista_resumida)}."
    except Exception as e:
        contexto_projeto = f"Aviso de leitura no GitHub ('{repo_fullname}'): {e}"

    # Pega as mensagens da conversa
    mensagens_dialogo = [m for m in historico if m["role"] != "system"]
    mensagens_memoria = mensagens_dialogo[-10:] if len(mensagens_dialogo) > 10 else mensagens_dialogo

    # Monta uma síntese do histórico para injeção direta no System Prompt
    linhas_historico = []
    for msg in mensagens_memoria:
        papel = "Usuário" if msg["role"] == "user" else "Arquiteto Faro (Você)"
        texto_resumido = msg["content"][:300] + "..." if len(msg["content"]) > 300 else msg["content"]
        linhas_historico.append(f"- {papel}: {texto_resumido}")
    
    resumo_conversa = "\n".join(linhas_historico)

    prompt_sistema = {
        "role": "system",
        "content": (
            f"Você é o Arquiteto Faro, líder técnico e engenheiro de software especialista em Python e bots de trading.\n\n"
            f"ESTRUTURA DO REPOSITÓRIO ALVO:\n{contexto_projeto}\n\n"
            f"HISTÓRICO RECENTE DA CONVERSA (ANÁLISE OBRIGATÓRIA PARA CONTINUIDADE):\n"
            f"{resumo_conversa}\n\n"
            "DIRETRIZES DE ATUAÇÃO E MEMÓRIA:\n"
            "1. Analise obrigatoriamente o histórico recente acima antes de responder. Dê continuidade às decisões, diagnósticos e correções já iniciadas.\n"
            "2. Toda conversa é salva no Supabase. Nunca peça ao usuário para reexplicar pontos já decididos.\n"
            "3. Se o usuário pedir para criar, alterar ou corrigir arquivos no repositório, retorne APENAS o bloco JSON puro a seguir:\n\n"
            "```json\n"
            "{\n"
            '  "acao": "salvar",\n'
            '  "caminho": "nome_do_arquivo.py",\n'
            '  "commit_msg": "Descrição do commit",\n'
            '  "conteudo": "CODIGO_COMPLETO_AQUI",\n'
            '  "explicacao": "Resumo técnico da alteração"\n'
            "}\n"
            "```\n"
            "4. IMPORTANTE: No campo 'conteudo', escape aspas e quebras de linha adequadamente para gerar um JSON válido.\n"
            "5. Se for apenas esclarecimento ou análise, responda em texto plano."
        )
    }

    mensagens_enviadas = [prompt_sistema] + mensagens_memoria[-2:]

    response = client.chat.completions.create(
        model=modelo,
        messages=mensagens_enviadas,
        temperature=0.1,
        max_tokens=2048
    )

    resposta_texto = response.choices[0].message.content

    # Tenta extrair o bloco JSON utilizando regex
    match = re.search(r"```json\s*(\{.*?\})\s*```", resposta_texto, re.DOTALL)
    if not match:
        match = re.search(r"(\{[\s\S]*\"acao\"\s*:\s*\"salvar\"[\s\S]*\})", resposta_texto)

    if match:
        json_raw = match.group(1)
        try:
            dados = json.loads(json_raw, strict=False)
            
            caminho_arquivo = dados.get("caminho")
            conteudo_novo = dados.get("conteudo")
            mensagem_commit = dados.get("commit_msg", "Alteração via Arquiteto Faro")
            explicacao = dados.get("explicacao", "Alteração efetuada com sucesso.")

            if caminho_arquivo and conteudo_novo:
                resultado_github = salvar_arquivo_github(repo_fullname, caminho_arquivo, conteudo_novo, mensagem_commit)
                resposta_final = f"🤖 **Arquiteto Faro — Commit Executado!**\n\n**Resumo:** {explicacao}\n\n{resultado_github}"
                salvar_mensagem_bd(repo_fullname, "assistant", resposta_final)
                return resposta_final
        except Exception as e:
            msg_erro = f"⚠️ O modelo gerou a alteração, mas o formato JSON continha erros: {e}\n\n**Resposta da IA:**\n{resposta_texto}"
            salvar_mensagem_bd(repo_fullname, "assistant", msg_erro)
            return msg_erro

    # Grava resposta normal no BD
    salvar_mensagem_bd(repo_fullname, "assistant", resposta_texto)
    return resposta_texto

# --- FUNÇÕES DE SUPORTE LOCAL ---

def ler_arquivo_local(caminho_relativo: str) -> str:
    if not os.path.exists(caminho_relativo):
        return f"Erro: O arquivo {caminho_relativo} não foi encontrado."
    with open(caminho_relativo, "r", encoding="utf-8") as f:
        return f.read()

def salvar_arquivo_local(caminho_relativo: str, novo_conteudo: str) -> str:
    with open(caminho_relativo, "w", encoding="utf-8") as f:
        f.write(novo_conteudo)
    return f"Sucesso: Arquivo {caminho_relativo} atualizado localmente!"