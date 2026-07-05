import type { SupabaseClient } from "@supabase/supabase-js";
import { generateStructured } from "@/lib/openai";
import { trendAnalysisAiSchema } from "@/lib/schemas";
import { computeTotalScore, decideRecommendation } from "@/lib/scoring";
import { DEFAULT_ANALYZE_PROMPT, renderTemplate } from "@/lib/prompts";
import type { TrendAnalysis, TrendItem } from "@/lib/types";

/**
 * トレンド1件をAI分析して trend_analyses に保存する。
 * /api/analyze-trend(手動実行)と自動取り込み(ingest)の両方から使う共通処理。
 */
export async function runTrendAnalysis(
  admin: SupabaseClient,
  trend: TrendItem,
): Promise<TrendAnalysis> {
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
    userPrompt: "上記のトレンドを分析し、指定されたJSONスキーマに従って日本語で出力してください。",
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
    .single<TrendAnalysis>();

  if (insertError || !analysis) {
    throw new Error(`分析結果の保存に失敗しました: ${insertError?.message ?? "不明なエラー"}`);
  }

  // inbox のトレンドは「分析済み・判断待ち」を示す analyzing に進める
  if (trend.status === "inbox") {
    await admin.from("trend_items").update({ status: "analyzing" }).eq("id", trend.id);
  }

  return analysis;
}
