import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, CardBody, CardHeader, EmptyState, PageHeader, StatRow } from "@/components/ui";
import { SnapshotForm } from "@/components/snapshot-form";
import {
  POST_PLATFORM_LABELS,
  POST_STATUS_LABELS,
  formatCount,
  formatDateTime,
} from "@/lib/labels";
import { computeRates, formatRate } from "@/lib/scoring";
import type { PerformanceSnapshot, Post, TrendItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PostPerformancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("*, trend_items(id, original_title)")
    .eq("id", id)
    .maybeSingle<Post & { trend_items: Pick<TrendItem, "id" | "original_title"> | null }>();

  if (!post) notFound();

  const { data: snapshots } = await supabase
    .from("performance_snapshots")
    .select("*")
    .eq("post_id", id)
    .order("captured_at", { ascending: false })
    .returns<PerformanceSnapshot[]>();

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={post.trend_items?.original_title ?? "投稿パフォーマンス"}
        description={`${POST_PLATFORM_LABELS[post.platform]} ・ ${POST_STATUS_LABELS[post.post_status]}`}
      />

      <p className="mb-4 text-sm">
        <Link href="/performance" className="text-indigo-600 hover:underline">
          ← パフォーマンストラッカーに戻る
        </Link>
      </p>

      <Card className="mb-6">
        <CardHeader title="投稿情報" />
        <CardBody>
          <div className="grid gap-x-8 sm:grid-cols-2">
            <div>
              <StatRow label="投稿URL">
                {post.post_url ? (
                  <a
                    href={post.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-indigo-600 hover:underline"
                  >
                    {post.post_url}
                  </a>
                ) : (
                  "—"
                )}
              </StatRow>
              <StatRow label="投稿日時">{formatDateTime(post.posted_at)}</StatRow>
              {post.trend_items && (
                <StatRow label="トレンド">
                  <Link
                    href={`/trends/${post.trend_items.id}`}
                    className="text-indigo-600 hover:underline"
                  >
                    詳細を見る
                  </Link>
                </StatRow>
              )}
            </div>
            <div>
              <StatRow label="使用フック">{post.hook_used ?? "—"}</StatRow>
              <StatRow label="フォーマット">{post.format_used ?? "—"}</StatRow>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="mb-6">
        <SnapshotForm postId={post.id} />
      </div>

      <Card>
        <CardHeader title="計測履歴" />
        <CardBody className="overflow-x-auto p-0">
          {!snapshots || snapshots.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="まだ計測データがありません"
                description="上のフォームから数値を記録すると、保存率・シェア率・フォロー転換率を自動計算して表示します。"
              />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs text-zinc-500">
                  <th className="px-5 py-3 font-medium">計測日時</th>
                  <th className="px-3 py-3 text-right font-medium">再生</th>
                  <th className="px-3 py-3 text-right font-medium">いいね率</th>
                  <th className="px-3 py-3 text-right font-medium">コメント率</th>
                  <th className="px-3 py-3 text-right font-medium">シェア率</th>
                  <th className="px-3 py-3 text-right font-medium">保存率</th>
                  <th className="px-3 py-3 text-right font-medium">フォロー率</th>
                  <th className="px-3 py-3 text-right font-medium">プロフ率</th>
                  <th className="px-5 py-3 font-medium">メモ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {snapshots.map((s) => {
                  const rates = computeRates(s);
                  return (
                    <tr key={s.id}>
                      <td className="px-5 py-3 text-xs whitespace-nowrap text-zinc-500">
                        {formatDateTime(s.captured_at)}
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-zinc-800">
                        {formatCount(s.views_count)}
                      </td>
                      <td className="px-3 py-3 text-right text-zinc-600">
                        {formatRate(rates.like_rate)}
                      </td>
                      <td className="px-3 py-3 text-right text-zinc-600">
                        {formatRate(rates.comment_rate)}
                      </td>
                      <td className="px-3 py-3 text-right text-zinc-600">
                        {formatRate(rates.share_rate)}
                      </td>
                      <td className="px-3 py-3 text-right text-zinc-600">
                        {formatRate(rates.save_rate)}
                      </td>
                      <td className="px-3 py-3 text-right text-zinc-600">
                        {formatRate(rates.follow_rate)}
                      </td>
                      <td className="px-3 py-3 text-right text-zinc-600">
                        {formatRate(rates.profile_click_rate)}
                      </td>
                      <td className="max-w-40 truncate px-5 py-3 text-xs text-zinc-500">
                        {s.notes ?? ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {snapshots && snapshots.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge color="zinc">保存率 = 保存 ÷ 再生</Badge>
          <Badge color="zinc">シェア率 = シェア ÷ 再生</Badge>
          <Badge color="zinc">フォロー率 = フォロー増 ÷ 再生</Badge>
        </div>
      )}
    </div>
  );
}
