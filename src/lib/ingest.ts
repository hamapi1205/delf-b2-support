import type { SupabaseClient } from "@supabase/supabase-js";
import { RedditAdapter, parseSubredditConfig } from "@/lib/adapters/reddit";
import { runTrendAnalysis } from "@/lib/analyze";
import type { TrendItem } from "@/lib/types";

export interface IngestResult {
  fetched: number;
  inserted: number;
  skipped_duplicates: number;
  analyzed: number;
  analyze_errors: string[];
}

/**
 * 海外トレンドを自動取得して trend_items に取り込み、
 * upvote上位の新規アイテムを自動でAI分析まで進める。
 *
 * - 取得元: Reddit(REDDIT_SUBREDDITS で対象subredditを設定)
 * - 重複はsource_urlで除外
 * - 自動分析は AUTO_ANALYZE_LIMIT 件まで(OpenAIコスト暴走を防ぐ)
 */
export async function ingestTrends(admin: SupabaseClient): Promise<IngestResult> {
  const adapter = new RedditAdapter({
    subreddits: parseSubredditConfig(process.env.REDDIT_SUBREDDITS),
    minScore: Number(process.env.REDDIT_MIN_SCORE) || 200,
  });

  const discovered = await adapter.fetchTrends({ limit: 10 });

  const result: IngestResult = {
    fetched: discovered.length,
    inserted: 0,
    skipped_duplicates: 0,
    analyzed: 0,
    analyze_errors: [],
  };

  if (discovered.length === 0) return result;

  // 既存URLとの重複を除外
  const urls = discovered.map((d) => d.source_url);
  const { data: existing } = await admin
    .from("trend_items")
    .select("source_url")
    .in("source_url", urls);
  const existingUrls = new Set((existing ?? []).map((e) => e.source_url));

  const fresh = discovered.filter((d) => !existingUrls.has(d.source_url));
  result.skipped_duplicates = discovered.length - fresh.length;

  if (fresh.length === 0) return result;

  const { data: insertedRows, error: insertError } = await admin
    .from("trend_items")
    .insert(
      fresh.map((d) => ({
        ...d,
        user_memo: "自動取得(Reddit)",
        status: "inbox",
      })),
    )
    .select()
    .returns<TrendItem[]>();

  if (insertError || !insertedRows) {
    throw new Error(`トレンドの保存に失敗しました: ${insertError?.message ?? "不明なエラー"}`);
  }
  result.inserted = insertedRows.length;

  // upvote上位から自動分析(コスト管理のため件数上限あり)
  const analyzeLimit = Number(process.env.AUTO_ANALYZE_LIMIT) || 3;
  const toAnalyze = [...insertedRows]
    .sort((a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0))
    .slice(0, analyzeLimit);

  for (const trend of toAnalyze) {
    try {
      await runTrendAnalysis(admin, trend);
      result.analyzed += 1;
    } catch (error) {
      // 1件の分析失敗で全体を止めない
      const message = error instanceof Error ? error.message : String(error);
      result.analyze_errors.push(`${trend.original_title}: ${message}`);
    }
  }

  return result;
}
