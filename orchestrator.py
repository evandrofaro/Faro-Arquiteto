import os
from dotenv import load_dotenv
from groq import Groq
from github import Github

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

# --- CONEXÃO GITHUB ---

def obter_cliente_github():
    if not GITHUB_TOKEN:
        raise ValueError("GITHUB_TOKEN não configurada nas variáveis de ambiente!")
    return Github(GITHUB_TOKEN)

def listar_arquivos_repositorio(repo_fullname: str):
    """Retorna a lista de todos os arquivos do projeto no GitHub."""
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

# --- LÓGICA DO AGENTE ORQUESTRADOR DE CHAT ---

def processar_chat_agente(historico: list, repo_fullname: str, modelo: str = "llama-3.3-70b-versatile"):
    """Lógica do Agente Conversacional (Estilo Replit)."""
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY não configurada!")

    client = Groq(api_key=GROQ_API_KEY)
    
    # Tenta mapear os arquivos do projeto para contextualizar a IA
    try:
        lista_arquivos = listar_arquivos_repositorio(repo_fullname)
        contexto_projeto = f"Arquivos no repositório '{repo_fullname}': {', '.join(lista_arquivos)}."
    except Exception as e:
        contexto_projeto = f"Não foi possível listar arquivos automaticamente do GitHub: {e}"

    mensagens_enviadas = historico.copy()
    mensagens_enviadas.insert(1, {
        "role": "system",
        "content": (
            f"Contexto do Projeto: {contexto_projeto}\n"
            "Se o usuário pedir uma análise ou alteração no código, oriente com clareza, "
            "forneça o código refatorado e explique as modificações necessárias."
        )
    })

    response = client.chat.completions.create(
        model=modelo,
        messages=mensagens_enviadas,
        temperature=0.2
    )

    return response.choices[0].message.content

# --- FUNÇÕES DE MANIPULAÇÃO LOCAL / REFATORAÇÃO DIRETA ---

def ler_arquivo_local(caminho_relativo: str) -> str:
    if not os.path.exists(caminho_relativo):
        return f"Erro: O arquivo {caminho_relativo} não foi encontrado."
    with open(caminho_relativo, "r", encoding="utf-8") as f:
        return f.read()

def salvar_arquivo_local(caminho_relativo: str, novo_conteudo: str) -> str:
    with open(caminho_relativo, "w", encoding="utf-8") as f:
        f.write(novo_conteudo)
    return f"Sucesso: Arquivo {caminho_relativo} atualizado localmente!"

def processar_solicitacao_alteracao(caminho_arquivo: str, instrucao: str, modelo: str = "llama-3.3-70b-versatile"):
    client = Groq(api_key=GROQ_API_KEY)
    codigo_atual = ler_arquivo_local(caminho_arquivo)
    if codigo_atual.startswith("Erro:"):
        return codigo_atual

    prompt_sistema = (
        "Você é o Arquiteto Faro, especialista em refatoração e otimização de código. "
        "Sua tarefa é ler o código fornecido e aplicar as alterações solicitadas. "
        "Retorne APENAS o código Python completo atualizado, sem textos explicativos antes ou depois."
    )
    
    prompt_usuario = f"Instrução: {instrucao}\n\nCódigo Atual ({caminho_arquivo}):\n```python\n{codigo_atual}\n```"

    response = client.chat.completions.create(
        model=modelo,
        messages=[
            {"role": "system", "content": prompt_sistema},
            {"role": "user", "content": prompt_usuario}
        ],
        temperature=0.1
    )

    novo_codigo = response.choices[0].message.content
    if novo_codigo.startswith("```python"):
        novo_codigo = novo_codigo.replace("```python", "").rstrip("` \n")
    elif novo_codigo.startswith("```"):
        novo_codigo = novo_codigo.replace("```", "").rstrip("` \n")

    resultado_salvamento = salvar_arquivo_local(caminho_arquivo, novo_codigo)
    return f"--- Código Refatorado e Aplicado ---\n\n{resultado_salvamento}"