import os
import re
import ollama

class FaroBotOrchestrator:
    def __init__(self, model_path=None, fallback_model="qwen2.5-coder:7b", project_root="."):
        """
        :param model_path: Caminho do arquivo .gguf na pasta ./models (se selecionado no app.py)
        :param fallback_model: Nome do modelo do Ollama caso nenhum .gguf seja passado
        """
        self.project_root = project_root
        self.model = self._resolve_model(model_path, fallback_model)

    def _resolve_model(self, model_path: str, fallback_model: str) -> str:
        """
        Verifica se um arquivo .gguf foi fornecido e o registra/associa no Ollama, 
        ou retorna o modelo padrão registrado.
        """
        if model_path and os.path.exists(model_path) and model_path.endswith(".gguf"):
            # Nome limpo para o modelo no Ollama baseado no arquivo .gguf
            model_name = os.path.basename(model_path).replace(".gguf", "").lower()
            model_name = re.sub(r'[^a-z0-9_.-]', '-', model_name)
            
            try:
                # Cria/atualiza o modelo no Ollama apontando para o .gguf local
                modelfile = f"FROM {os.path.abspath(model_path)}"
                ollama.create(model=model_name, modelfile=modelfile)
                return model_name
            except Exception as e:
                print(f"⚠️ Erro ao registrar .gguf no Ollama: {e}. Usando modelo fallback: {fallback_model}")
                return fallback_model
        
        return fallback_model

    def read_file(self, relative_path: str) -> str:
        """Lê o código ou conteúdo de qualquer arquivo da Arquitetura Faro."""
        full_path = os.path.join(self.project_root, relative_path)
        if os.path.exists(full_path):
            with open(full_path, "r", encoding="utf-8") as f:
                return f.read()
        return f"# O arquivo {relative_path} ainda não foi criado."

    def write_file(self, relative_path: str, content: str):
        """Salva as alterações diretamente no arquivo no disco."""
        full_path = os.path.join(self.project_root, relative_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)

    def fix_module(self, relative_path: str, instructions: str):
        """Usa a IA local para refatorar ou atualizar o arquivo selecionado."""
        original_code = self.read_file(relative_path)
        
        prompt = f"""
        Você é a IA Orquestradora da Arquitetura Faro.
        Sua tarefa é modificar o arquivo local: '{relative_path}'.
        Instruções do usuário: {instructions}

        Conteúdo Atual do Arquivo:
        ```
        {original_code}
        ```
        
        Atenção: Retorne APENAS o conteúdo completo e atualizado do arquivo, sem explicações, saudações ou comentários fora do código.
        """
        
        try:
            response = ollama.generate(model=self.model, prompt=prompt)
            raw_text = response.get('response', '')

            # Limpa as tags de marcação markdown ```python ou ``` json, etc.
            new_code = re.sub(r"^```[a-zA-Z]*\n", "", raw_text.strip(), flags=re.MULTILINE)
            new_code = re.sub(r"\n```$", "", new_code, flags=re.MULTILINE).strip()

            if not new_code:
                return "❌ A IA retornou uma resposta vazia. Nenhuma alteração foi salva."

            self.write_file(relative_path, new_code)
            return f"✅ Módulo {relative_path} atualizado com sucesso usando o modelo [{self.model}]!"

        except Exception as e:
            return f"❌ Erro ao processar alteração com o Ollama: {str(e)}"