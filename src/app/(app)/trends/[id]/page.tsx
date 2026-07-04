import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader, EmptyState, PageHeader, StatRow } from "@/components/ui";
import {
  PlatformBadge,
  RecommendationBadge,
  RiskScoreBadge,
  ScorePill,
  StatusBadge,
} from "@/components/badges";
import { AnalyzeButton, GeneratePackageButton, StatusSelect } from "@/components/trend-actions";
import {
  CATEGORY_LABELS,
  POST_PLATFORM_LABELS,
  POST_STATUS_LABELS,
  formatCount,
  formatDate,
  formatDateTime,
} from "@/lib/labels";
import type { ContentPackage, Post, TrendAnalysis, TrendItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TrendDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: trend } = await supabase
    .from("trend_items")
    .select("*")
    .eq("id", id)
    .maybeSingle<TrendItem>();

  if (!trend) notFound();

  const [{ data: analyses }, { data: packages }, { data: posts }] = await Promise.all([
    supabase
      .from("trend_analyses")
      .select("*")
      .eq("trend_item_id", id)
      .order("created_at", { ascending: false })
      .returns<TrendAnalysis[]>(),
    supabase
      .from("content_packages")
      .select("*")
      .eq("trend_item_id", id)
      .order("created_at", { ascending: false })
      .returns<ContentPackage[]>(),
    supabase
      .from("posts")
      .select("*")
      .eq("trend_item_id", id)
      .order("created_at", { ascending: false })
      .returns<Post[]>(),
  ]);

  const latestAnalysis = analyses?.[0] ?? null;

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={trend.original_title}
        description={`発見日: ${formatDate(trend.discovered_at)}`}
        action={<StatusSelect trendId={trend.id} currentStatus={trend.status} />}
      />

      {/* 元情報 */}
      <Card className="mb-6">
        <CardHeader
          title="元コンテンツ情報"
          action={
            <span className="flex items-center gap-2">
              <PlatformBadge platform={trend.source_platform} />
              <StatusBadge status={trend.status} />
            </span>
          }
        />
        <CardBody>
          <div className="grid gap-x-8 sm:grid-cols-2">
            <div>
              <StatRow label="URL">
                <a
                  href={trend.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-indigo-600 hover:underline"
                >
                  {trend.source_url}
                </a>
              </StatRow>
              <StatRow label="カテゴリ">{CATEGORY_LABELS[trend.category]}</StatRow>
              <StatRow label="クリエイター">{trend.creator_name ?? "—"}</StatRow>
              <StatRow label="国 / 言語">
                {trend.source_country ?? "—"} / {trend.source_language ?? "—"}
              </StatRow>
              <StatRow label="元投稿日">{formatDate(trend.published_at)}</StatRow>
            </div>
            <div>
              <StatRow label="再生数">{formatCount(trend.views_count)}</StatRow>
              <StatRow label="いいね">{formatCount(trend.likes_count)}</StatRow>
              <StatRow label="コメント">{formatCount(trend.comments_count)}</StatRow>
              <StatRow label="シェア">{formatCount(trend.shares_count)}</StatRow>
              <StatRow label="保存">{formatCount(trend.saves_count)}</StatRow>
            </div>
          </div>
          {trend.original_description && (
            <p className="mt-3 border-t border-zinc-100 pt-3 text-sm whitespace-pre-wrap text-zinc-600">
              {trend.original_description}
            </p>
          )}
          {trend.user_memo && (
            <div className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
              📝 {trend.user_memo}
            </div>
          )}
        </CardBody>
      </Card>

      {/* AI分析 */}
      <Card className="mb-6">
        <CardHeader
          title="AI分析"
          action={<AnalyzeButton trendId={trend.id} hasAnalysis={!!latestAnalysis} />}
        />
        <CardBody>
          {!latestAnalysis ? (
            <EmptyState
              title="まだ分析されていません"
              description="「AI分析を実行」を押すと、バズ理由・日本市場フィット・権利リスクなどをAIが評価します。"
            />
          ) : (
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <ScorePill score={latestAnalysis.total_score} />
                <RecommendationBadge recommendation={latestAnalysis.recommendation} />
                <RiskScoreBadge
                  label="著作権リスク"
                  score={latestAnalysis.copyright_risk.score}
                />
                <RiskScoreBadge
                  label="炎上リスク"
                  score={latestAnalysis.controversy_risk.score}
                />
                <span className="text-xs text-zinc-400">
                  {formatDateTime(latestAnalysis.created_at)}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap text-zinc-700">
                {latestAnalysis.summary_jp}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link
                  href={`/analyses/${latestAnalysis.id}`}
                  className="text-sm font-medium text-indigo-600 hover:underline"
                >
                  分析の詳細を見る →
                </Link>
                <GeneratePackageButton trendId={trend.id} analysisId={latestAnalysis.id} />
              </div>
              {analyses && analyses.length > 1 && (
                <div className="mt-4 border-t border-zinc-100 pt-3">
                  <p className="mb-2 text-xs text-zinc-500">過去の分析</p>
                  <ul className="space-y-1">
                    {analyses.slice(1).map((a) => (
                      <li key={a.id}>
                        <Link
                          href={`/analyses/${a.id}`}
                          className="flex items-center gap-2 text-sm text-zinc-600 hover:text-indigo-600"
                        >
                          <ScorePill score={a.total_score} />
                          <RecommendationBadge recommendation={a.recommendation} />
                          <span className="text-xs text-zinc-400">
                            {formatDateTime(a.created_at)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* コンテンツパッケージ */}
      <Card className="mb-6">
        <CardHeader title="コンテンツパッケージ" />
        <CardBody>
          {!packages || packages.length === 0 ? (
            <EmptyState
              title="コンテンツパッケージがありません"
              description="AI分析の実行後、「コンテンツパッケージを生成」から日本向けの台本・キャプション一式を生成できます。"
            />
          ) : (
            <ul className="divide-y divide-zinc-100">
              {packages.map((pkg) => (
                <li key={pkg.id} className="py-3 first:pt-0 last:pb-0">
                  <Link href={`/packages/${pkg.id}`} className="group block">
                    <p className="text-sm font-medium text-zinc-800 group-hover:text-indigo-600">
                      {pkg.main_angle}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {formatDateTime(pkg.created_at)} ・ フック{" "}
                      {Array.isArray(pkg.hook_options) ? pkg.hook_options.length : 0}案 ・ カルーセル{" "}
                      {Array.isArray(pkg.carousel_slides) ? pkg.carousel_slides.length : 0}枚
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* 投稿・パフォーマンス */}
      <Card>
        <CardHeader
          title="投稿記録"
          action={
            <Link
              href="/performance"
              className="text-xs font-medium text-indigo-600 hover:underline"
            >
              パフォーマンストラッカーへ →
            </Link>
          }
        />
        <CardBody>
          {!posts || posts.length === 0 ? (
            <EmptyState
              title="このトレンドの投稿はまだ記録されていません"
              description="実際に投稿したら、パフォーマンストラッカーから投稿を記録して数値を入力しましょう。"
            />
          ) : (
            <ul className="divide-y divide-zinc-100">
              {posts.map((post) => (
                <li key={post.id} className="py-3 first:pt-0 last:pb-0">
                  <Link
                    href={`/performance/${post.id}`}
                    className="flex items-center justify-between gap-3 hover:text-indigo-600"
                  >
                    <span className="text-sm">
                      {POST_PLATFORM_LABELS[post.platform]} —{" "}
                      {POST_STATUS_LABELS[post.post_status]}
                    </span>
                    <span className="text-xs text-zinc-400">{formatDate(post.posted_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
