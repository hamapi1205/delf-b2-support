import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ingestTrends } from "@/lib/ingest";

export const maxDuration = 300;

// 手動トリガー用(トレンド一覧の「自動取得」ボタンから呼ばれる)
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const result = await ingestTrends(createAdminClient());
    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "不明なエラーが発生しました";
    console.error("ingest-trends failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
