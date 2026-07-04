import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, CardBody, CardHeader, PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/labels";
import type { ContentPackage, TrendItem } from "@/lib/types";

export const dynamic = "force-dynamic";

function ScriptBlock({ title, text }: { title: string; text: string }) {
  return (
    <Card>
      <CardHeader title={title} />
      <CardBody>
        <p className="text-sm whitespace-pre-wrap text-zinc-700">{text || "—"}</p>
      </CardBody>
    </Card>
  );
}

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: pkg } = await supabase
    .from("content_packages")
    .select("*, trend_items(*)")
    .eq("id", id)
    .maybeSingle<ContentPackage & { trend_items: TrendItem | null }>();

  if (!pkg) notFound();

  const trend = pkg.trend_items;

  return (
    <div className="max-w-4xl">
      <PageHeader title="コンテンツパッケージ" description={pkg.main_angle} />

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        {trend && (
          <Link href={`/trends/${trend.id}`} className="text-indigo-600 hover:underline">
            ← トレンド詳細に戻る
          </Link>
        )}
        <Link href={`/analyses/${pkg.analysis_id}`} className="text-indigo-600 hover:underline">
          元になった分析を見る
        </Link>
        <span className="text-xs text-zinc-400">{formatDateTime(pkg.created_at)}</span>
      </div>

      {/* 出典表記は運用上必須なので最上部に固定表示する */}
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-xs font-medium text-amber-700">出典クレジット(投稿時に必ず記載)</p>
        <p className="mt-1 text-sm whitespace-pre-wrap text-amber-900">
          {pkg.source_attribution_text}
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader title="フック候補(冒頭3秒)" />
          <CardBody>
            <ul className="space-y-3">
              {pkg.hook_options.map((hook, i) => (
                <li key={i} className="rounded-lg bg-zinc-50 px-4 py-3">
                  <p className="text-sm font-medium text-zinc-800">「{hook.hook}」</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {hook.reason} ・ 狙う感情: {hook.target_emotion}
                  </p>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <ScriptBlock title="15秒台本" text={pkg.short_15s_script} />
          <ScriptBlock title="30秒台本" text={pkg.short_30s_script} />
          <ScriptBlock title="60秒台本" text={pkg.short_60s_script} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ScriptBlock title="ナレーション" text={pkg.narration_text} />
          <ScriptBlock title="字幕テキスト" text={pkg.subtitle_text} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ScriptBlock title="Instagramキャプション" text={pkg.instagram_caption} />
          <ScriptBlock title="X投稿文" text={pkg.x_post} />
        </div>

        <Card>
          <CardHeader title="カルーセル構成" />
          <CardBody>
            {pkg.carousel_slides.length === 0 ? (
              <p className="text-sm text-zinc-400">—</p>
            ) : (
              <ol className="space-y-3">
                {pkg.carousel_slides.map((slide) => (
                  <li key={slide.slide_number} className="rounded-lg bg-zinc-50 px-4 py-3">
                    <p className="text-xs font-medium text-zinc-400">
                      スライド {slide.slide_number}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-zinc-800">{slide.title}</p>
                    <p className="mt-1 text-sm whitespace-pre-wrap text-zinc-600">{slide.body}</p>
                    <p className="mt-1 text-xs text-indigo-500">🎨 {slide.visual_instruction}</p>
                  </li>
                ))}
              </ol>
            )}
          </CardBody>
        </Card>

        <ScriptBlock title="映像プラン(自作素材・AI素材・画面録画前提)" text={pkg.visual_plan} />

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="サムネイル文言候補" />
            <CardBody>
              <ul className="space-y-2">
                {pkg.thumbnail_text_options.map((text, i) => (
                  <li key={i} className="rounded-lg bg-zinc-50 px-4 py-2 text-sm text-zinc-800">
                    {text}
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="CTA候補" />
            <CardBody>
              <ul className="space-y-2">
                {pkg.cta_options.map((cta, i) => (
                  <li key={i} className="rounded-lg bg-zinc-50 px-4 py-2 text-sm text-zinc-800">
                    {cta}
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader title="ハッシュタグ" />
          <CardBody>
            <div className="flex flex-wrap gap-2">
              {pkg.hashtags.map((tag, i) => (
                <Badge key={i} color="blue">
                  {tag.startsWith("#") ? tag : `#${tag}`}
                </Badge>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
