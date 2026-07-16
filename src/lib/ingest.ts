import type { SupabaseClient } from "@supabase/supabase-js";
import { RedditAdapter, parseSubredditConfig } from "@/lib/adapters/reddit";
import { HackerNewsAdapter } from "@/lib/adapters/hackernews";
import type { DiscoveredTrend, TrendSourceAdapter } from "@/lib/adapters/trend-source-adapter";
import { runTrendAnalysis } from "@/lib/analyze";
import type { TrendItem } from "@/lib/types";

export interface IngestResult {
  fetched: number;
  inserted: number;
  skipped_duplicates: number;
  analyzed: number;
  analyze_errors: string[];
  /** 取得元ごとの取得件数(例: { hackernews: 12, reddit: 0 }) */
  source_counts: Record<string, number>;
  /** 取得に失敗した取得元とその理由(0件のとき原因を分かるようにする) */
  source_errors: string[];
}

/**
 * 海外トレンドを自動取得して trend_items に取り込み、
 * upvote/point上位の新規アイテムを自動でAI分析まで進める。
 *
 * 取得元:
 * - Hacker News(Algolia公開API、認証不要・クラウドIPでも確実に動作)
 * - Reddit(REDDIT_SUBREDDITS 設定。ただしクラウドIPからはブロックされることがある)
 */
export async function ingestTrends(admin: SupabaseClient): Promise<IngestResult> {
  const adapters: TrendSourceAdapter[] = [
    new HackerNewsAdapter({
      minPoints: Number(process.env.HN_MIN_POINTS) || 100,
      withinDays: Number(process.env.HN_WITHIN_DAYS) || 3,
    }),
    new RedditAdapter({
      subreddits: parseSubredditConfig(process.env.REDDIT_SUBREDDITS),
      minScore: Number(process.env.REDDIT_MIN_SCORE) || 200,
    }),
  ];

  const result: IngestResult = {
    fetched: 0,
    inserted: 0,
    skipped_duplicates: 0,
    analyzed: 0,
    analyze_errors: [],
    source_counts: {},
    source_errors: [],
  };

  // 各取得元から並行取得。1つが失敗しても他は続行し、理由を記録する。
  const discovered: DiscoveredTrend[] = [];
  await Promise.all(
    adapters.map(async (adapter) => {
      try {
        const trends = await adapter.fetchTrends({ limit: 20 });
        result.source_counts[adapter.id] = trends.length;
        discovered.push(...trends);
      } catch (error) {
        result.source_counts[adapter.id] = 0;
        const message = error instanceof Error ? error.message : String(error);
        result.source_errors.push(`${adapter.id}: ${message}`);
      }
    }),
  );

  result.fetched = discovered.length;
  if (discovered.length === 0) return result;

  // 取得元内・取得元間のURL重複を除去
  const uniqueByUrl = new Map<string, DiscoveredTrend>();
  for (const d of discovered) {
    if (!uniqueByUrl.has(d.source_url)) uniqueByUrl.set(d.source_url, d);
  }
  const deduped = [...uniqueByUrl.values()];

  // 既存トレンドとの重複を除外
  const urls = deduped.map((d) => d.source_url);
  const { data: existing } = await admin
    .from("trend_items")
    .select("source_url")
    .in("source_url", urls);
  const existingUrls = new Set((existing ?? []).map((e) => e.source_url));

  const fresh = deduped.filter((d) => !existingUrls.has(d.source_url));
  result.skipped_duplicates = discovered.length - fresh.length;

  if (fresh.length === 0) return result;

  const { data: insertedRows, error: insertError } = await admin
    .from("trend_items")
    .insert(
      fresh.map((d) => ({
        ...d,
        user_memo: "自動取得",
        status: "inbox",
      })),
    )
    .select()
    .returns<TrendItem[]>();

  if (insertError || !insertedRows) {
    throw new Error(`トレンドの保存に失敗しました: ${insertError?.message ?? "不明なエラー"}`);
  }
  result.inserted = insertedRows.length;

  // スコア(likes/points)上位から自動分析(コスト管理のため件数上限あり)
  const analyzeLimit = Number(process.env.AUTO_ANALYZE_LIMIT) || 3;
  const toAnalyze = [...insertedRows]
    .sort((a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0))
    .slice(0, analyzeLimit);

  for (const trend of toAnalyze) {
    try {
      await runTrendAnalysis(admin, trend);
      result.analyzed += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.analyze_errors.push(`${trend.original_title}: ${message}`);
    }
  }

  return result;
}
