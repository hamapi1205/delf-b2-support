import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateStructured } from "@/lib/openai";
import { analyzeTrendRequestSchema, trendAnalysisAiSchema } from "@/lib/schemas";
import { computeTotalScore, decideRecommendation } from "@/lib/scoring";
import { DEFAULT_ANALYZE_PROMPT, renderTemplate } from "@/lib/prompts";
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

    // アクティブなプロンプトテンプレートをDBから読む(なければコード内デフォルト)
    const { data: template } = await admin
      .from("prompt_templates")
      .select("template")
      .eq("name", "analyze_trend")
      .eq("is_active", true)
      .maybeSingle();

    const trendJson = JSON.stringify(
      {
        source_url: trend.source_url,
        source_platform: trend.source_platform,
        source_country: trend.source_country,
        source_language: trend.source_language,
        original_title: trend.original_title,
        original_description: trend.original_description,
        creator_name: trend.creator_name,
        published_at: trend.published_at,
        category: trend.category,
        metrics: {
          views: trend.views_count,
          likes: trend.likes_count,
          comments: trend.comments_count,
          shares: trend.shares_count,
          saves: trend.saves_count,
        },
        user_memo: trend.user_memo,
      },
      null,
      2,
    );

    const systemPrompt = renderTemplate(template?.template ?? DEFAULT_ANALYZE_PROMPT, {
      TREND_JSON: trendJson,
    });

    const ai = await generateStructured({
      systemPrompt,
      userPrompt:
        "上記のトレンドを分析し、指定されたJSONスキーマに従って日本語で出力してください。",
      schema: trendAnalysisAiSchema,
      schemaName: "trend_analysis",
    });

    // total_score / recommendation はサーバー側で決定的に計算する
    const risks = {
      copyrightRisk: ai.copyright_risk.score,
      controversyRisk: ai.controversy_risk.score,
    };
    const totalScore = computeTotalScore(ai.score_breakdown, risks);
    const recommendation = decideRecommendation(totalScore, risks);

    const { data: analysis, error: insertError } = await admin
      .from("trend_analyses")
      .insert({
        trend_item_id: trend.id,
        summary_jp: ai.summary_jp,
        why_viral_overseas: ai.why_viral_overseas,
        japan_market_fit: ai.japan_market_fit,
        emotional_triggers: ai.emotional_triggers,
        target_audience: ai.target_audience,
        novelty_in_japan: ai.novelty_in_japan,
        saturation_risk: ai.saturation_risk,
        series_potential: ai.series_potential,
        monetization_fit: ai.monetization_fit,
        copyright_risk: ai.copyright_risk,
        controversy_risk: ai.controversy_risk,
        brand_safety_notes: ai.brand_safety_notes,
        total_score: totalScore,
        score_breakdown: ai.score_breakdown,
        recommendation,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: `分析結果の保存に失敗しました: ${insertError.message}` },
        { status: 500 },
      );
    }

    // inbox のトレンドは「分析済み・判断待ち」を示す analyzing に進める
    if (trend.status === "inbox") {
      await admin.from("trend_items").update({ status: "analyzing" }).eq("id", trend.id);
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "不明なエラーが発生しました";
    console.error("analyze-trend failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
