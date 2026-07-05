import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { analyzeTrendRequestSchema } from "@/lib/schemas";
import { runTrendAnalysis } from "@/lib/analyze";
import type { TrendItem } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    // 認証チェック(APIは Service Role を使うため、必ずセッションを確認する)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = analyzeTrendRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "trend_item_id(UUID)が必要です", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    const { data: trend, error: trendError } = await admin
      .from("trend_items")
      .select("*")
      .eq("id", parsed.data.trend_item_id)
      .single<TrendItem>();

    if (trendError || !trend) {
      return NextResponse.json({ error: "トレンドが見つかりません" }, { status: 404 });
    }

    const analysis = await runTrendAnalysis(admin, trend);

    return NextResponse.json({ analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "不明なエラーが発生しました";
    console.error("analyze-trend failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
