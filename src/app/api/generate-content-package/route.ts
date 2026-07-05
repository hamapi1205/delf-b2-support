import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateStructured } from "@/lib/openai";
import { contentPackageAiSchema, generatePackageRequestSchema } from "@/lib/schemas";
import { DEFAULT_GENERATE_PROMPT, renderTemplate } from "@/lib/prompts";
import { isDemoMode } from "@/lib/ai-provider";
import type { TrendAnalysis, TrendItem } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = generatePackageRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "trend_item_id と analysis_id(UUID)が必要です", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    const [{ data: trend }, { data: analysis }] = await Promise.all([
      admin
        .from("trend_items")
        .select("*")
        .eq("id", parsed.data.trend_item_id)
        .single<TrendItem>(),
      admin
        .from("trend_analyses")
        .select("*")
        .eq("id", parsed.data.analysis_id)
        .single<TrendAnalysis>(),
    ]);

    if (!trend) {
      return NextResponse.json({ error: "トレンドが見つかりません" }, { status: 404 });
    }
    if (!analysis || analysis.trend_item_id !== trend.id) {
      return NextResponse.json(
        { error: "分析結果が見つからないか、指定したトレンドのものではありません" },
        { status: 404 },
      );
    }

    const { data: template } = await admin
      .from("prompt_templates")
      .select("template")
      .eq("name", "generate_content_package")
      .eq("is_active", true)
      .maybeSingle();

    const trendJson = JSON.stringify(
      {
        source_url: trend.source_url,
        source_platform: trend.source_platform,
        original_title: trend.original_title,
        original_description: trend.original_description,
        creator_name: trend.creator_name,
        category: trend.category,
        user_memo: trend.user_memo,
      },
      null,
      2,
    );

    const analysisJson = JSON.stringify(
      {
        summary_jp: analysis.summary_jp,
        why_viral_overseas: analysis.why_viral_overseas,
        japan_market_fit: analysis.japan_market_fit,
        emotional_triggers: analysis.emotional_triggers,
        target_audience: analysis.target_audience,
        novelty_in_japan: analysis.novelty_in_japan,
        copyright_risk: analysis.copyright_risk,
        controversy_risk: analysis.controversy_risk,
        brand_safety_notes: analysis.brand_safety_notes,
        total_score: analysis.total_score,
        recommendation: analysis.recommendation,
      },
      null,
      2,
    );

    const systemPrompt = renderTemplate(template?.template ?? DEFAULT_GENERATE_PROMPT, {
      TREND_JSON: trendJson,
      ANALYSIS_JSON: analysisJson,
    });

    const ai = await generateStructured({
      systemPrompt,
      userPrompt:
        "上記のトレンドと分析結果をもとに、指定されたJSONスキーマに従って日本語のコンテンツパッケージを出力してください。copyright_risk の safe_reconstruction_advice を必ず反映してください。",
      schema: contentPackageAiSchema,
      schemaName: "content_package",
    });

    const { data: contentPackage, error: insertError } = await admin
      .from("content_packages")
      .insert({
        trend_item_id: trend.id,
        analysis_id: analysis.id,
        main_angle: ai.main_angle,
        hook_options: ai.hook_options,
        short_15s_script: ai.short_15s_script,
        short_30s_script: ai.short_30s_script,
        short_60s_script: ai.short_60s_script,
        narration_text: ai.narration_text,
        subtitle_text: ai.subtitle_text,
        instagram_caption: ai.instagram_caption,
        x_post: ai.x_post,
        carousel_slides: ai.carousel_slides,
        thumbnail_text_options: ai.thumbnail_text_options,
        hashtags: ai.hashtags,
        visual_plan: ai.visual_plan,
        cta_options: ai.cta_options,
        source_attribution_text: ai.source_attribution_text,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: `コンテンツパッケージの保存に失敗しました: ${insertError.message}` },
        { status: 500 },
      );
    }

    // 台本まで進んだのでステータスを scripted に進める(posted以降は触らない)
    if (["inbox", "analyzing", "approved"].includes(trend.status)) {
      await admin.from("trend_items").update({ status: "scripted" }).eq("id", trend.id);
    }

    // 権利リスクが高い分析からの生成には警告を付ける(生成自体はブロックしない)
    const copyrightScore = analysis.copyright_risk?.score ?? 0;
    const warning =
      analysis.recommendation === "reject"
        ? "この分析は reject 判定です。投稿は推奨されません。"
        : copyrightScore >= 7
          ? "著作権リスクが高い評価です。safe_reconstruction_advice を確認し、引用範囲と出典表記を必ず守ってください。"
          : null;

    return NextResponse.json({ content_package: contentPackage, warning, demo: isDemoMode() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "不明なエラーが発生しました";
    console.error("generate-content-package failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
