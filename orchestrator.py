import os
from dotenv import load_dotenv
from groq import Groq
from github import Github

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

# --- 1. FUNÇÕES PARA MANIPULAÇÃO LOCAL ---

def ler_arquivo_local(caminho_relativo: str) -> str:
    """Lê o código de um arquivo no seu projeto local."""
    if not os.path.exists(caminho_relativo):
        return f"Erro: O arquivo {caminho_relativo} não foi encontrado."
    with open(caminho_relativo, "r", encoding="utf-8") as f:
        return f.read()

def salvar_arquivo_local(caminho_relativo: str, novo_conteudo: str) -> str:
    """Sobrescreve o arquivo local com o novo código gerado."""
    with open(caminho_relativo, "w", encoding="utf-8") as f:
        f.write(novo_conteudo)
    return f"Sucesso: Arquivo {caminho_relativo} atualizado localmente!"

# --- 2. FUNÇÕES PARA MANIPULAÇÃO NO GITHUB ---

def atualizar_arquivo_github(repo_fullname: str, caminho_arquivo: str, novo_conteudo: str, mensagem_commit: str):
    """Envia a alteração diretamente para o GitHub (ex: repo 'evandrofaro/FaroBot')."""
    if not GITHUB_TOKEN:
        raise ValueError("GITHUB_TOKEN não configurada no .env")
        
    g = Github(GITHUB_TOKEN)
    repo = g.get_repo(repo_fullname)
    
    # Obtém o arquivo atual para pegar o SHA necessário para atualização
    contents = repo.get_contents(caminho_arquivo)
    
    # Executa o update direto no GitHub
    repo.update_file(
        path=contents.path,
        message=mensagem_commit,
        content=novo_conteudo,
        sha=contents.sha,
        branch="main"
    )
    return f"Sucesso: Alteração enviada para o repositório {repo_fullname}!"

# --- 3. PROCESSADOR DE IA COM A GROQ ---

def processar_solicitacao_alteracao(caminho_arquivo: str, instrucao: str, modelo: str = "llama-3.3-70b-versatile"):
    """Lê o arquivo, envia para a IA refatorar e aplica a alteração."""
    client = Groq(api_key=GROQ_API_KEY)
    
    # Step 1: Lê o código original
    codigo_atual = ler_arquivo_local(caminho_arquivo)
    if codigo_atual.startswith("Erro:"):
        return codigo_atual

    # Step 2: Monta o prompt para a IA refatorar o código
    prompt_sistema = (
        "Você é o Arquiteto Faro, especialista em refatoração e otimização de código. "
        "Sua tarefa é ler o código fornecido e aplicar as alterações solicitadas. "
        "Retorne APENAS o código Python completo atualizado, sem textos explicativos antes ou depois."
    )
    
    prompt_usuario = f"""
    Instrução de Alteração: {instrucao}
    
    Código Atual ({caminho_arquivo}):
    ```python
    {codigo_atual}
    ```
    """

    response = client.chat.completions.create(
        model=modelo,
        messages=[
            {"role": "system", "content": prompt_sistema},
            {"role": "user", "content": prompt_usuario}
        ],
        temperature=0.1
    )

    novo_codigo = response.choices[0].message.content
    
    # Limpa marcações markdown de bloco de código caso o modelo as retorne
    if novo_codigo.startswith("```python"):
        novo_codigo = novo_codigo.replace("```python", "").rstrip("` \n")
    elif novo_codigo.startswith("```"):
        novo_codigo = novo_codigo.replace("```", "").rstrip("` \n")

    # Step 3: Salva a alteração
    resultado_salvamento = salvar_arquivo_local(caminho_arquivo, novo_codigo)
    return f"--- Código Refatorado e Aplicado ---\n\n{resultado_salvamento}"