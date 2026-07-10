import type { z } from "zod";

export type AIProvider = "openai" | "gemini" | "demo";

/**
 * 選択されたAIプロバイダを解決する。
 * APIキーが未設定の場合はエラーにせず "demo" にフォールバックする。
 * (キーが設定されていても呼び出しが失敗した場合の扱いは generateStructured 側で行う)
 */
export function getAIProvider(): AIProvider {
  const configured = (process.env.AI_PROVIDER || "gemini").toLowerCase();

  if (configured === "demo") return "demo";

  if (configured === "openai") {
    return process.env.OPENAI_API_KEY ? "openai" : "demo";
  }

  return process.env.GOOGLE_API_KEY ? "gemini" : "demo";
}

export function isDemoMode(): boolean {
  return getAIProvider() === "demo";
}

export interface GenerateStructuredResult<T> {
  data: T;
  /** 実際に使われたモード。設定と異なる場合、フォールバックが起きたことを示す */
  usedProvider: AIProvider;
  /** フォールバックが起きた場合の理由(APIキー未設定 / 呼び出し失敗のエラーメッセージ) */
  fallbackReason: string | null;
}

/**
 * 選択されたプロバイダでAI呼び出しを試み、失敗した場合(クォータ超過・認証エラー等)は
 * 例外を投げずにデモ出力へ自動フォールバックする。
 * これにより、Vercelの環境変数設定が中途半端な状態でも、ユーザーには常に
 * 「動くツール」が提示され、詰まった時だけ理由が分かる形になる。
 */
export async function generateStructuredWithFallback<T extends z.ZodTypeAny>(options: {
  systemPrompt: string;
  userPrompt: string;
  schema: T;
  schemaName: string;
}): Promise<GenerateStructuredResult<z.infer<T>>> {
  const provider = getAIProvider();

  if (provider === "demo") {
    const { generateStructuredDemo } = await import("./ai-providers/demo");
    const data = await generateStructuredDemo(options);
    return { data, usedProvider: "demo", fallbackReason: "AIキーが設定されていません" };
  }

  try {
    if (provider === "gemini") {
      const { generateStructuredGemini } = await import("./ai-providers/gemini");
      const data = await generateStructuredGemini(options);
      return { data, usedProvider: "gemini", fallbackReason: null };
    }
    const { generateStructuredOpenAI } = await import("./ai-providers/openai");
    const data = await generateStructuredOpenAI(options);
    return { data, usedProvider: "openai", fallbackReason: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`AI provider "${provider}" failed, falling back to demo output:`, message);
    const { generateStructuredDemo } = await import("./ai-providers/demo");
    const data = await generateStructuredDemo(options);
    return {
      data,
      usedProvider: "demo",
      fallbackReason: summarizeError(message),
    };
  }
}

// UIに出す用に、長いAPIエラーの本文を短く要約する
function summarizeError(message: string): string {
  if (message.includes("429") || message.toLowerCase().includes("quota")) {
    return "AIの利用枠(クォータ)上限に達しました。しばらく待つか、プランをご確認ください。";
  }
  if (message.includes("401") || message.toLowerCase().includes("api key")) {
    return "AIのAPIキーが無効です。キーを確認してください。";
  }
  return `AI呼び出しに失敗しました: ${message.slice(0, 120)}`;
}

/** 互換性のため残す(内部では generateStructuredWithFallback を使う) */
export async function generateStructured<T extends z.ZodTypeAny>(options: {
  systemPrompt: string;
  userPrompt: string;
  schema: T;
  schemaName: string;
}): Promise<z.infer<T>> {
  const result = await generateStructuredWithFallback(options);
  return result.data;
}
