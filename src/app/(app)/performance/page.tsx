import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, CardBody, EmptyState, PageHeader } from "@/components/ui";
import { PostForm } from "@/components/post-form";
import { POST_PLATFORM_LABELS, POST_STATUS_LABELS, formatCount, formatDate } from "@/lib/labels";
import { computeRates, formatRate } from "@/lib/scoring";
import type { PerformanceSnapshot, Post, TrendItem } from "@/lib/types";

export const dynamic = "force-dynamic";

type PostWithRelations = Post & {
  trend_items: Pick<TrendItem, "original_title"> | null;
  performance_snapshots: PerformanceSnapshot[];
};

export default async function PerformancePage() {
  const supabase = await createClient();

  const [{ data: posts }, { data: trends }, { data: packages }] = await Promise.all([
    supabase
      .from("posts")
      .select("*, trend_items(original_title), performance_snapshots(*)")
      .order("created_at", { ascending: false })
      .returns<PostWithRelations[]>(),
    supabase
      .from("trend_items")
      .select("id, original_title")
      .order("discovered_at", { ascending: false }),
    supabase.from("content_packages").select("id, trend_item_id, main_angle"),
  ]);

  return (
    <div>
      <PageHeader
        title="パフォーマンストラッカー"
        description="投稿後の数値を手入力で記録し、保存率・シェア率・フォロー転換率を自動計算します。"
      />

      <div className="mb-6">
        <PostForm trends={trends ?? []} packages={packages ?? []} />
      </div>

      {!posts || posts.length === 0 ? (
        <EmptyState
          title="投稿がまだ記録されていません"
          description="投稿したら「＋ 投稿を記録」から登録し、数値スナップショットを追加していきましょう。24時間後・72時間後・1週間後など複数時点での記録がおすすめです。"
        />
      ) : (
        <Card>
          <CardBody className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs text-zinc-500">
                  <th className="px-5 py-3 font-medium">トレンド</th>
                  <th className="px-3 py-3 font-medium">投稿先</th>
                  <th className="px-3 py-3 font-medium">状態</th>
                  <th className="px-3 py-3 font-medium">投稿日</th>
                  <th className="px-3 py-3 text-right font-medium">再生数</th>
                  <th className="px-3 py-3 text-right font-medium">保存率</th>
                  <th className="px-3 py-3 text-right font-medium">シェア率</th>
                  <th className="px-3 py-3 text-right font-medium">フォロー率</th>
                  <th className="px-5 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {posts.map((post) => {
                  const latest = [...post.performance_snapshots].sort(
                    (a, b) =>
                      new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime(),
                  )[0];
                  const rates = latest ? computeRates(latest) : null;
                  return (
                    <tr key={post.id} className="hover:bg-zinc-50">
                      <td className="max-w-xs px-5 py-3">
                        <Link
                          href={`/performance/${post.id}`}
                          className="block truncate font-medium text-zinc-800 hover:text-indigo-600"
                        >
                          {post.trend_items?.original_title ?? "(削除されたトレンド)"}
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <Badge color="indigo">{POST_PLATFORM_LABELS[post.platform]}</Badge>
                      </td>
                      <td className="px-3 py-3 text-zinc-600">
                        {POST_STATUS_LABELS[post.post_status]}
                      </td>
                      <td className="px-3 py-3 text-xs whitespace-nowrap text-zinc-500">
                        {formatDate(post.posted_at)}
                      </td>
                      <td className="px-3 py-3 text-right text-zinc-700">
                        {latest ? formatCount(latest.views_count) : "—"}
                      </td>
                      <td className="px-3 py-3 text-right text-zinc-700">
                        {rates ? formatRate(rates.save_rate) : "—"}
                      </td>
                      <td className="px-3 py-3 text-right text-zinc-700">
                        {rates ? formatRate(rates.share_rate) : "—"}
                      </td>
                      <td className="px-3 py-3 text-right text-zinc-700">
                        {rates ? formatRate(rates.follow_rate) : "—"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/performance/${post.id}`}
                          className="text-xs font-medium text-indigo-600 hover:underline"
                        >
                          数値入力 →
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
