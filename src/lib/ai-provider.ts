import type { z } from "zod";

export type AIProvider = "openai" | "gemini";

export function getAIProvider(): AIProvider {
  const provider = (process.env.AI_PROVIDER || "gemini") as AIProvider;
  if (!["openai", "gemini"].includes(provider)) {
    throw new Error(`Invalid AI_PROVIDER: ${provider}. Must be "openai" or "gemini".`);
  }
  return provider;
}

export async function generateStructured<T extends z.ZodTypeAny>(options: {
  systemPrompt: string;
  userPrompt: string;
  schema: T;
  schemaName: string;
}): Promise<z.infer<T>> {
  const provider = getAIProvider();

  if (provider === "gemini") {
    const { generateStructuredGemini } = await import("./ai-providers/gemini");
    return generateStructuredGemini(options);
  }

  if (provider === "openai") {
    const { generateStructuredOpenAI } = await import("./ai-providers/openai");
    return generateStructuredOpenAI(options);
  }

  throw new Error(`Unknown AI_PROVIDER: ${provider}`);
}
