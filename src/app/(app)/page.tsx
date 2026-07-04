import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader, EmptyState, PageHeader } from "@/components/ui";
import { RecommendationBadge, ScorePill, StatusBadge } from "@/components/badges";
import { POST_PLATFORM_LABELS, formatCount, formatDate } from "@/lib/labels";
import { computeRates, formatRate } from "@/lib/scoring";
import type {
  PerformanceSnapshot,
  Post,
  Recommendation,
  TrendAnalysis,
  TrendItem,
  TrendStatus,
} from "@/lib/types";

export const dynamic = "force-dynamic";

type PostWithRelations = Post & {
  trend_items: Pick<TrendItem, "original_title"> | null;
  performance_snapshots: PerformanceSnapshot[];
};

type AnalysisWithTrend = TrendAnalysis & {
  trend_items: Pick<TrendItem, "id" | "original_title" | "status"> | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: trendCount },
    { data: analyses },
    { count: postsThisWeek },
    { data: postsWithSnapshots },
    { data: topAnalyses },
  ] = await Promise.all([
    supabase.from("trend_items").select("*", { count: "exact", head: true }),
    supabase.from("trend_analyses").select("id, trend_item_id, total_score, recommendation"),
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgo),
    supabase
      .from("posts")
      .select("*, trend_items(original_title), performance_snapshots(*)")
      .in("post_status", ["posted", "analyzed"])
      .returns<PostWithRelations[]>(),
    supabase
      .from("trend_analyses")
      .select("*, trend_items(id, original_title, status)")
      .order("total_score", { ascending: false })
      .limit(50)
      .returns<AnalysisWithTrend[]>(),
  ]);

  const analyzedTrendIds = new Set((analyses ?? []).map((a) => a.trend_item_id));
  const recCounts: Record<Recommendation, number> = { use: 0, maybe: 0, reject: 0 };
  let scoreSum = 0;
  for (const a of analyses ?? []) {
    recCounts[a.recommendation as Recommendation] += 1;
    scoreSum += a.total_score;
  }
  const avgScore = analyses && analyses.length > 0 ? Math.round(scoreSum / analyses.length) : null;

  // 投稿ごとの最新スナップショットで再生数上位を出す
  const topPosts = (postsWithSnapshots ?? [])
    .map((post) => {
      const latest = [...post.performance_snapshots].sort(
        (a, b) => new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime(),
      )[0];
      return { post, latest };
    })
    .filter((p) => p.latest)
    .sort((a, b) => b.latest!.views_count - a.latest!.views_count)
    .slice(0, 5);

  // スコア上位の未投稿ネタ(投稿済み・アーカイブ・不採用は除外)
  const excluded: TrendStatus[] = ["posted", "archived", "rejected"];
  const seen = new Set<string>();
  const topUnposted = (topAnalyses ?? [])
    .filter((a) => {
      const trend = a.trend_items;
      if (!trend || excluded.includes(trend.status) || seen.has(trend.id)) return false;
      seen.add(trend.id);
      return true;
    })
    .slice(0, 5);

  const stats = [
    { label: "登録トレンド", value: trendCount ?? 0 },
    { label: "AI分析済み", value: analyzedTrendIds.size },
    { label: "採用推奨 (use)", value: recCounts.use },
    { label: "要検討 (maybe)", value: recCounts.maybe },
    { label: "非推奨 (reject)", value: recCounts.reject },
    { label: "平均スコア", value: avgScore ?? "—" },
    { label: "今週の投稿数", value: postsThisWeek ?? 0 },
  ];

  return (
    <div>
      <PageHeader
        title="ダッシュボード"
        description="トレンドの登録・分析・投稿成績のサマリー"
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardBody className="px-4 py-3">
              <p className="text-xs text-zinc-500">{s.label}</p>
              <p className="mt-1 text-2xl font-bold text-zinc-900">{s.value}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="スコア上位の未投稿ネタ" />
          <CardBody className="p-0">
            {topUnposted.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="分析済みの未投稿ネタがありません"
                  description="トレンドを登録してAI分析を実行すると、ここにスコア上位が表示されます。"
                />
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {topUnposted.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/trends/${a.trend_items!.id}`}
                      className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-zinc-50"
                    >
                      <span className="truncate text-sm text-zinc-800">
                        {a.trend_items!.original_title}
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <RecommendationBadge recommendation={a.recommendation} />
                        <ScorePill score={a.total_score} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="パフォーマンス上位の投稿" />
          <CardBody className="p-0">
            {topPosts.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="計測済みの投稿がありません"
                  description="投稿を記録し、パフォーマンス数値を入力するとここに表示されます。"
                />
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {topPosts.map(({ post, latest }) => {
                  const rates = computeRates(latest!);
                  return (
                    <li key={post.id}>
                      <Link
                        href={`/performance/${post.id}`}
                        className="block px-5 py-3 hover:bg-zinc-50"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate text-sm text-zinc-800">
                            {post.trend_items?.original_title ?? "(削除されたトレンド)"}
                          </span>
                          <span className="shrink-0 text-xs text-zinc-500">
                            {POST_PLATFORM_LABELS[post.platform]}
                          </span>
                        </div>
                        <div className="mt-1 flex gap-4 text-xs text-zinc-500">
                          <span>再生 {formatCount(latest!.views_count)}</span>
                          <span>保存率 {formatRate(rates.save_rate)}</span>
                          <span>フォロー率 {formatRate(rates.follow_rate)}</span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader title="最近のトレンド" />
          <CardBody className="p-0">
            <RecentTrends />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

async function RecentTrends() {
  const supabase = await createClient();
  const { data: trends } = await supabase
    .from("trend_items")
    .select("id, original_title, status, discovered_at")
    .order("discovered_at", { ascending: false })
    .limit(5)
    .returns<Pick<TrendItem, "id" | "original_title" | "status" | "discovered_at">[]>();

  if (!trends || trends.length === 0) {
    return (
      <div className="p-5">
        <EmptyState
          title="まだトレンドが登録されていません"
          description="「トレンド登録」から海外でバズっているネタを登録しましょう。"
        />
      </div>
    );
  }

  return (
    <ul className="divide-y divide-zinc-100">
      {trends.map((t) => (
        <li key={t.id}>
          <Link
            href={`/trends/${t.id}`}
            className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-zinc-50"
          >
            <span className="truncate text-sm text-zinc-800">{t.original_title}</span>
            <span className="flex shrink-0 items-center gap-3">
              <span className="text-xs text-zinc-400">{formatDate(t.discovered_at)}</span>
              <StatusBadge status={t.status} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
