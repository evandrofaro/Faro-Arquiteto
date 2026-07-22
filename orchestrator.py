import os
from dotenv import load_dotenv
from groq import Groq
from github import Github

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

# --- CONEXÃO COM GITHUB ---

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
    """Cria ou atualiza um arquivo diretamente no repositório do GitHub."""
    g = obter_cliente_github()
    repo = g.get_repo(repo_fullname)
    try:
        file_content = repo.get_contents(caminho)
        repo.update_file(file_content.path, mensagem_commit, novo_conteudo, file_content.sha, branch="main")
        return f"✅ Arquivo `{caminho}` atualizado no GitHub com sucesso!"
    except Exception:
        repo.create_file(caminho, mensagem_commit, novo_conteudo, branch="main")
        return f"✅ Arquivo `{caminho}` criado no GitHub com sucesso!"

# --- LÓGICA DO AGENTE ORQUESTRADOR (CHAT OTIMIZADO) ---

def processar_chat_agente(historico: list, repo_fullname: str, modelo: str = "llama-3.1-8b-instant"):
    """Lógica do Agente Conversacional Otimizada para evitar estouro de limite de tokens (Rate Limit)."""
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY não configurada nas variáveis de ambiente ou Secrets!")

    client = Groq(api_key=GROQ_API_KEY)
    
    # Mapeia arquivos limitando para economizar tokens na requisição
    try:
        lista_arquivos = listar_arquivos_repositorio(repo_fullname)
        lista_resumida = lista_arquivos[:25]  # Pega os 25 primeiros arquivos principais
        contexto_projeto = f"Arquivos principais no repositório '{repo_fullname}': {', '.join(lista_resumida)}."
    except Exception as e:
        contexto_projeto = f"Não foi possível listar arquivos do GitHub: {e}"

    # Mantém apenas as últimas 4 mensagens do histórico para poupar o limite da Groq
    mensagens_recentes = historico[-4:] if len(historico) > 4 else historico.copy()

    prompt_sistema = {
        "role": "system",
        "content": (
            f"Você é o Arquiteto Faro, engenheiro especialista em Python e bots de trading.\n"
            f"Contexto do Projeto: {contexto_projeto}\n"
            "Responda de forma direta, técnica e concisa. Se for fornecer alterações de código, traga apenas o trecho refatorado necessário."
        )
    }

    # Garante que o prompt de sistema vá na frente
    mensagens_enviadas = [prompt_sistema] + [m for m in mensagens_recentes if m["role"] != "system"]

    response = client.chat.completions.create(
        model=modelo,
        messages=mensagens_enviadas,
        temperature=0.2,
        max_tokens=2048
    )

    return response.choices[0].message.content

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