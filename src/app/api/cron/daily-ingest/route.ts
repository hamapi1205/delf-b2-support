import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ingestTrends } from "@/lib/ingest";

export const maxDuration = 300;

// Vercel Cron 用エンドポイント(vercel.json 参照)。
// Vercel は CRON_SECRET 環境変数が設定されていると
// `Authorization: Bearer <CRON_SECRET>` を付けてGETしてくる。
export async function GET(request: Request) {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "CRON_SECRET が設定されていません。自動実行を有効にするには環境変数を設定してください。" },
        { status: 500 },
      );
    }
    if (request.headers.get("authorization") !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const result = await ingestTrends(createAdminClient());
    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "不明なエラーが発生しました";
    console.error("daily-ingest failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
