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
  return process.env.GEMINI_MODEL || "gemini-flash-latest";
}

// マークダウンのコードフェンスや前後の余計なテキストを取り除き、JSON本体を取り出す
function extractJson(text: string): string {
  let t = text.trim();
  // ```json ... ``` / ``` ... ``` を除去
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fence) t = fence[1].trim();
  // 最初の { から最後の } までを抜き出す(前後に説明文が付いた場合の保険)
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    t = t.slice(first, last + 1);
  }
  return t;
}

/**
 * Gemini でJSON Schemaに沿った構造化出力を得る。
 * - JSON Schema をプロンプトに埋め込み、responseMimeType でJSON出力を強制
 * - 出力トークン上限を大きめに取り、途中切れによるパース失敗を防ぐ
 * - パース/検証に失敗したら1回だけ、より厳密な指示で再試行する
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
      maxOutputTokens: 8192,
    },
  });

  const basePrompt = `${options.userPrompt}

出力は必ず以下のJSON Schemaに厳密に従った、単一のJSONオブジェクトのみとしてください。
説明文・前置き・マークダウンのコードフェンスは一切含めないでください。
全ての必須フィールドを省略せずに含めてください。

\`\`\`json
${JSON.stringify(jsonSchema, null, 2)}
\`\`\``;

  let lastError = "";

  for (let attempt = 0; attempt < 2; attempt++) {
    const prompt =
      attempt === 0
        ? basePrompt
        : `${basePrompt}\n\n前回の出力はJSONとして不正でした(${lastError})。今度は必ず有効なJSONのみを、途中で切れないように出力してください。`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(extractJson(raw));
    } catch {
      lastError = "JSONとして解析できませんでした";
      continue;
    }

    const validated = options.schema.safeParse(parsedJson);
    if (validated.success) {
      return validated.data;
    }
    lastError = validated.error.issues
      .slice(0, 3)
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(" / ");
  }

  throw new Error(`AIの出力がスキーマに一致しませんでした: ${lastError}`);
}
