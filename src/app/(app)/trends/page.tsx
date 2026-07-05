import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button, Card, CardBody, EmptyState, PageHeader } from "@/components/ui";
import { IngestButton } from "@/components/ingest-button";
import { PlatformBadge, RecommendationBadge, ScorePill, StatusBadge } from "@/components/badges";
import { CATEGORY_LABELS, formatDate } from "@/lib/labels";
import type { TrendAnalysis, TrendItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TrendsPage() {
  const supabase = await createClient();

  const [{ data: trends, error }, { data: analyses }] = await Promise.all([
    supabase
      .from("trend_items")
      .select("*")
      .order("discovered_at", { ascending: false })
      .returns<TrendItem[]>(),
    supabase
      .from("trend_analyses")
      .select("trend_item_id, total_score, recommendation, created_at")
      .order("created_at", { ascending: false })
      .returns<Pick<TrendAnalysis, "trend_item_id" | "total_score" | "recommendation" | "created_at">[]>(),
  ]);

  if (error) {
    throw new Error(`トレンドの取得に失敗しました: ${error.message}`);
  }

  // トレンドごとの最新分析(created_at降順で最初に出たもの)
  const latestAnalysis = new Map<string, (typeof analyses extends (infer T)[] | null ? T : never)>();
  for (const a of analyses ?? []) {
    if (!latestAnalysis.has(a.trend_item_id)) latestAnalysis.set(a.trend_item_id, a);
  }

  return (
    <div>
      <PageHeader
        title="トレンド一覧"
        description="登録済みの海外トレンドと分析状況"
        action={
          <div className="flex items-start gap-3">
            <IngestButton />
            <Link href="/trends/new">
              <Button>＋ トレンド登録</Button>
            </Link>
          </div>
        }
      />

      {!trends || trends.length === 0 ? (
        <EmptyState
          title="トレンドがまだありません"
          description="海外でバズっているショート動画・ツール・サービスを手入力で登録すると、AIが日本向けの分析を行います。"
          action={
            <Link href="/trends/new">
              <Button>最初のトレンドを登録する</Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <CardBody className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs text-zinc-500">
                  <th className="px-5 py-3 font-medium">タイトル</th>
                  <th className="px-3 py-3 font-medium">プラットフォーム</th>
                  <th className="px-3 py-3 font-medium">カテゴリ</th>
                  <th className="px-3 py-3 font-medium">スコア</th>
                  <th className="px-3 py-3 font-medium">推奨</th>
                  <th className="px-3 py-3 font-medium">ステータス</th>
                  <th className="px-3 py-3 font-medium">発見日</th>
                  <th className="px-5 py-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {trends.map((trend) => {
                  const analysis = latestAnalysis.get(trend.id);
                  return (
                    <tr key={trend.id} className="hover:bg-zinc-50">
                      <td className="max-w-xs px-5 py-3">
                        <Link
                          href={`/trends/${trend.id}`}
                          className="block truncate font-medium text-zinc-800 hover:text-indigo-600"
                        >
                          {trend.original_title}
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <PlatformBadge platform={trend.source_platform} />
                      </td>
                      <td className="px-3 py-3 text-zinc-600">
                        {CATEGORY_LABELS[trend.category]}
                      </td>
                      <td className="px-3 py-3">
                        <ScorePill score={analysis?.total_score} />
                      </td>
                      <td className="px-3 py-3">
                        {analysis ? (
                          <RecommendationBadge recommendation={analysis.recommendation} />
                        ) : (
                          <span className="text-xs text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={trend.status} />
                      </td>
                      <td className="px-3 py-3 text-xs whitespace-nowrap text-zinc-500">
                        {formatDate(trend.discovered_at)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/trends/${trend.id}`}
                          className="text-xs font-medium text-indigo-600 hover:underline"
                        >
                          詳細 →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
