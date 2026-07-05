import { GoogleGenerativeAI } from "@google/generative-ai";
import type { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY が設定されていません(.env.local を確認してください)");
  }
  if (!client) {
    client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  }
  return client;
}

export function getModel(): string {
  return process.env.GEMINI_MODEL || "gemini-2.0-flash";
}

/**
 * Gemini でJSON Schemaに沿った構造化出力を得る。
 *
 * Gemini SDK の responseSchema 型は zod-to-json-schema の出力と互換性がないため、
 * JSON Schema をプロンプトに埋め込み + responseMimeType: application/json で
 * JSON出力を強制し、最後に zod でパース・検証する方式を取る。
 */
export async function generateStructuredGemini<T extends z.ZodTypeAny>(options: {
  systemPrompt: string;
  userPrompt: string;
  schema: T;
  schemaName: string;
}): Promise<z.infer<T>> {
  const jsonSchema = zodToJsonSchema(options.schema, options.schemaName);

  const model = getClient().getGenerativeModel({
    model: getModel(),
    systemInstruction: options.systemPrompt,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7,
    },
  });

  const prompt = `${options.userPrompt}

出力は必ず以下のJSON Schemaに厳密に従ったJSONオブジェクトのみとしてください。説明文やマークダウンは含めないでください。

\`\`\`json
${JSON.stringify(jsonSchema, null, 2)}
\`\`\``;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(text);
  } catch {
    throw new Error("AIの出力がJSONとしてパースできませんでした。再実行してください。");
  }

  const validated = options.schema.safeParse(parsedJson);
  if (!validated.success) {
    throw new Error(
      `AIの出力がスキーマに一致しませんでした: ${validated.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join(" / ")}。再実行してください。`,
    );
  }
  return validated.data;
}
