import os
import json
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
    except Exception as e:
        try:
            repo.create_file(caminho, mensagem_commit, novo_conteudo, branch="main")
            return f"✅ Arquivo `{caminho}` criado no GitHub com sucesso!"
        except Exception as err:
            return f"❌ Erro ao salvar no GitHub: {err}"

# --- LÓGICA DO AGENTE ORQUESTRADOR QUE EXECUTA ALTERAÇÕES ---

def processar_chat_agente(historico: list, repo_fullname: str, modelo: str = "llama-3.1-8b-instant"):
    """Agente capaz de interagir no chat E aplicar alterações no GitHub automaticamente."""
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY não configurada!")

    client = Groq(api_key=GROQ_API_KEY)
    
    # Mapeia arquivos do projeto
    try:
        lista_arquivos = listar_arquivos_repositorio(repo_fullname)
        lista_resumida = lista_arquivos[:25]
        contexto_projeto = f"Arquivos disponíveis em '{repo_fullname}': {', '.join(lista_resumida)}."
    except Exception as e:
        contexto_projeto = f"Erro ao listar arquivos do GitHub: {e}"

    mensagens_recentes = historico[-4:] if len(historico) > 4 else historico.copy()

    # System prompt ativando capacidade de ação (Tool / Action Mode)
    prompt_sistema = {
        "role": "system",
        "content": (
            f"Você é o Arquiteto Faro, um engenheiro especialista em Python e bots de trading.\n"
            f"Contexto do Projeto: {contexto_projeto}\n\n"
            "VOCÊ TEM PERMISSÃO DE ESCRITA E COMANDOS DE ALTERAÇÃO DIRETA NO GITHUB.\n"
            "Nunca diga que não pode alterar ou acessar arquivos. Você PODE e DEVE alterar se o usuário solicitar.\n\n"
            "Se o usuário pedir para criar, modificar, corrigir ou refatorar um arquivo no repositório, responda EXATAMENTE neste formato JSON para que o sistema aplique a alteração:\n\n"
            "```json\n"
            "{\n"
            '  "acao": "salvar",\n'
            '  "caminho": "nome_do_arquivo.py",\n'
            '  "commit_msg": "Mensagem descritiva do commit",\n'
            '  "conteudo": "CODIGO_COMPLETO_ATUALIZADO_AQUI",\n'
            '  "explicacao": "Explicação breve do que foi feito"\n'
            "}\n"
            "```\n"
            "Se for apenas uma dúvida ou conversa simples sem alteração de arquivo, responda normalmente em texto plano."
        )
    }

    mensagens_enviadas = [prompt_sistema] + [m for m in mensagens_recentes if m["role"] != "system"]

    response = client.chat.completions.create(
        model=modelo,
        messages=mensagens_enviadas,
        temperature=0.1,
        max_tokens=2048
    )

    resposta_texto = response.choices[0].message.content

    # Verifica se a IA solicitou uma alteração em JSON
    if "```json" in resposta_texto and '"acao": "salvar"' in resposta_texto:
        try:
            # Extrai o bloco JSON da resposta
            json_str = resposta_texto.split("```json")[1].split("```")[0].strip()
            dados = json.loads(json_str)
            
            caminho_arquivo = dados.get("caminho")
            conteudo_novo = dados.get("conteudo")
            mensagem_commit = dados.get("commit_msg", "Alteração via Arquiteto Faro")
            explicacao = dados.get("explicacao", "Alteração efetuada.")

            # Executa o commit de verdade no GitHub!
            resultado_github = salvar_arquivo_github(repo_fullname, caminho_arquivo, conteudo_novo, mensagem_commit)
            
            return f"🤖 **Ação de Arquitetura Executada!**\n\n{explicacao}\n\n{resultado_github}"
        except Exception as e:
            return f"⚠️ A IA tentou alterar o arquivo, mas ocorreu um erro na formatação do JSON: {e}\n\nResposta original:\n{resposta_texto}"

    return resposta_texto