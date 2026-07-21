import { Router, type IRouter } from "express";
import { ListModelsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const AVAILABLE_MODELS = [
  {
    id: "Qwen/Qwen2.5-Coder-7B-Instruct",
    name: "Qwen2.5 Coder 7B",
    description: "Specialized for code generation and correction. Excellent for front-end and back-end fixes.",
    category: "Code",
  },
  {
    id: "Qwen/Qwen2.5-Coder-32B-Instruct",
    name: "Qwen2.5 Coder 32B",
    description: "Larger code model with deeper reasoning for complex refactoring tasks.",
    category: "Code",
  },
  {
    id: "microsoft/Phi-3.5-mini-instruct",
    name: "Phi-3.5 Mini",
    description: "Compact and fast. Good for quick corrections and language improvements.",
    category: "General",
  },
  {
    id: "mistralai/Mistral-7B-Instruct-v0.3",
    name: "Mistral 7B Instruct",
    description: "Well-rounded model for code review, language correction, and documentation.",
    category: "General",
  },
  {
    id: "meta-llama/Llama-3.1-8B-Instruct",
    name: "Llama 3.1 8B",
    description: "Strong general-purpose model for code analysis and multi-language support.",
    category: "General",
  },
  {
    id: "deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct",
    name: "DeepSeek Coder V2 Lite",
    description: "Purpose-built for coding tasks with multi-language support and debugging.",
    category: "Code",
  },
  {
    id: "bigcode/starcoder2-7b",
    name: "StarCoder2 7B",
    description: "Trained on a massive corpus of code. Ideal for completion and bug fixing.",
    category: "Code",
  },
  {
    id: "HuggingFaceH4/zephyr-7b-beta",
    name: "Zephyr 7B Beta",
    description: "Fast and responsive for code reviews and natural language instructions.",
    category: "General",
  },
];

router.get("/models", async (_req, res): Promise<void> => {
  const result = ListModelsResponse.parse(AVAILABLE_MODELS);
  res.json(result);
});

export default router;
