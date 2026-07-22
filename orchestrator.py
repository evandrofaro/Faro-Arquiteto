import os
from dotenv import load_dotenv
from groq import Groq
from github import Github

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

def consultar_groq(mensagens, modelo="llama-3.3-70b-versatile"):
    """Envia o histórico de mensagens para a API da Groq e retorna a resposta."""
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY não configurada no arquivo .env")
        
    client = Groq(api_key=GROQ_API_KEY)
    
    chat_completion = client.chat.completions.create(
        messages=mensagens,
        model=modelo,
        temperature=0.2,
    )
    return chat_completion.choices[0].message.content

def obter_repositorio_github(nome_repo):
    """Conecta ao GitHub e retorna o repositório desejado."""
    if not GITHUB_TOKEN:
        raise ValueError("GITHUB_TOKEN não configurada no arquivo .env")
        
    g = Github(GITHUB_TOKEN)
    return g.get_repo(nome_repo)