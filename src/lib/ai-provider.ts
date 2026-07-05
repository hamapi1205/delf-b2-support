import type { z } from "zod";

export type AIProvider = "openai" | "gemini" | "demo";

/**
 * 実際に使うAIプロバイダを解決する。
 * 選択したプロバイダのAPIキーが未設定の場合は、エラーにせず "demo"
 * (決定的なサンプル出力)にフォールバックする。これにより、AIキーが無くても
 * Supabaseだけで一連の流れをクリックして確認できる。
 */
export function getAIProvider(): AIProvider {
  const configured = (process.env.AI_PROVIDER || "gemini").toLowerCase();

  if (configured === "demo") return "demo";

  if (configured === "openai") {
    return process.env.OPENAI_API_KEY ? "openai" : "demo";
  }

  // デフォルトは gemini 扱い
  return process.env.GOOGLE_API_KEY ? "gemini" : "demo";
}

export function isDemoMode(): boolean {
  return getAIProvider() === "demo";
}

export async function generateStructured<T extends z.ZodTypeAny>(options: {
  systemPrompt: string;
  userPrompt: string;
  schema: T;
  schemaName: string;
}): Promise<z.infer<T>> {
  const provider = getAIProvider();

  if (provider === "demo") {
    const { generateStructuredDemo } = await import("./ai-providers/demo");
    return generateStructuredDemo(options);
  }

  if (provider === "gemini") {
    const { generateStructuredGemini } = await import("./ai-providers/gemini");
    return generateStructuredGemini(options);
  }

  const { generateStructuredOpenAI } = await import("./ai-providers/openai");
  return generateStructuredOpenAI(options);
}
