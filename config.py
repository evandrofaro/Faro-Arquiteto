import os
from dotenv import load_dotenv
from groq import Groq
from github import Github

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

def obter_cliente_github():
    if not GITHUB_TOKEN:
        raise ValueError("GITHUB_TOKEN não configurada no .env ou Secrets!")
    return Github(GITHUB_TOKEN)

def listar_arquivos_repositorio(repo_fullname: str):
    """Retorna a lista de todos os arquivos relevantes do projeto no GitHub."""
    g = obter_cliente_github()
    repo = g.get_repo(repo_fullname)
    contents = repo.get_contents("")
    arquivos = []
    
    while contents:
        file_content = contents.pop(0)
        if file_content.type == "dir":
            if file_content.path not in [".git", "__pycache__", ".streamlit"]:
                contents.extend(repo.get_contents(file_content.path))
        else:
            if not file_content.path.endswith((".png", ".jpg", ".bin", ".zip")):
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

def processar_chat_agente(historico: list, repo_fullname: str, modelo: str = "llama-3.3-70b-versatile"):
    """Lógica central do Agente Orquestrador."""
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY não configurada!")

    client = Groq(api_key=GROQ_API_KEY)
    
    # Mapeia os arquivos atuais do repositório para contextualizar o modelo
    try:
        lista_arquivos = listar_arquivos_repositorio(repo_fullname)
        contexto_projeto = f"Arquivos disponíveis no repositório '{repo_fullname}': {', '.join(lista_arquivos)}."
    except Exception as e:
        contexto_projeto = f"Não foi possível listar arquivos automaticamente: {e}"

    # Adiciona instrução de contexto do projeto para a IA
    mensagens_enviadas = historico.copy()
    mensagens_enviadas.insert(1, {
        "role": "system",
        "content": (
            f"Contexto do Sistema: {contexto_projeto}\n"
            "Se o usuário pedir para fazer uma alteração no código, informe qual arquivo será modificado "
            "e forneça o código final refatorado de forma clara."
        )
    })

    response = client.chat.completions.create(
        model=modelo,
        messages=mensagens_enviadas,
        temperature=0.2
    )

    return response.choices[0].message.content