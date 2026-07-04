import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { z } from "zod";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY が設定されていません(.env.local を確認してください)");
  }
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export function getModel(): string {
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
}

/**
 * Structured Outputs でJSON Schemaに沿った出力を得る。
 * zodスキーマでパースまで行い、型安全な結果を返す。
 */
export async function generateStructured<T extends z.ZodTypeAny>(options: {
  systemPrompt: string;
  userPrompt: string;
  schema: T;
  schemaName: string;
}): Promise<z.infer<T>> {
  const completion = await getClient().beta.chat.completions.parse({
    model: getModel(),
    messages: [
      { role: "system", content: options.systemPrompt },
      { role: "user", content: options.userPrompt },
    ],
    response_format: zodResponseFormat(options.schema, options.schemaName),
  });

  const message = completion.choices[0]?.message;
  if (message?.refusal) {
    throw new Error(`AIが出力を拒否しました: ${message.refusal}`);
  }
  if (!message?.parsed) {
    throw new Error("AIから構造化された出力を取得できませんでした");
  }
  return message.parsed;
}
