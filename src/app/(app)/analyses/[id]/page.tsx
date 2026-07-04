import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui";
import { RecommendationBadge, RiskScoreBadge, ScorePill } from "@/components/badges";
import { GeneratePackageButton } from "@/components/trend-actions";
import { formatDateTime } from "@/lib/labels";
import type { ScoreBreakdown, TrendAnalysis, TrendItem } from "@/lib/types";

export const dynamic = "force-dynamic";

const BREAKDOWN_LABELS: Record<keyof ScoreBreakdown, string> = {
  global_virality: "海外でのバズ度",
  japan_fit: "日本市場フィット",
  freshness: "鮮度",
  hook_strength: "フックの強さ",
  shareability: "シェアされやすさ",
  saveability: "保存されやすさ",
  monetization: "マネタイズ適性",
  production_feasibility: "制作しやすさ",
  rights_safety: "権利面の安全性",
};

function BulletList({ items }: { items: string[] }) {
  if (!items || items.length === 0) return <p className="text-sm text-zinc-400">—</p>;
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export default async function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: analysis } = await supabase
    .from("trend_analyses")
    .select("*, trend_items(*)")
    .eq("id", id)
    .maybeSingle<TrendAnalysis & { trend_items: TrendItem | null }>();

  if (!analysis) notFound();

  const trend = analysis.trend_items;

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="AI分析詳細"
        description={trend ? trend.original_title : undefined}
        action={
          trend && <GeneratePackageButton trendId={trend.id} analysisId={analysis.id} />
        }
      />

      {trend && (
        <p className="mb-4 text-sm">
          <Link href={`/trends/${trend.id}`} className="text-indigo-600 hover:underline">
            ← トレンド詳細に戻る
          </Link>
        </p>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <ScorePill score={analysis.total_score} />
        <RecommendationBadge recommendation={analysis.recommendation} />
        <RiskScoreBadge label="著作権リスク" score={analysis.copyright_risk.score} />
        <RiskScoreBadge label="炎上リスク" score={analysis.controversy_risk.score} />
        <RiskScoreBadge label="飽和リスク" score={analysis.saturation_risk.score} />
        <span className="text-xs text-zinc-400">{formatDateTime(analysis.created_at)}</span>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader title="要約" />
          <CardBody>
            <p className="text-sm whitespace-pre-wrap text-zinc-700">{analysis.summary_jp}</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="スコア内訳(0〜10)" />
          <CardBody>
            <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {(Object.keys(BREAKDOWN_LABELS) as (keyof ScoreBreakdown)[]).map((key) => {
                const value = analysis.score_breakdown[key] ?? 0;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-36 shrink-0 text-sm text-zinc-500">
                      {BREAKDOWN_LABELS[key]}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${(value / 10) * 100}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-sm font-medium text-zinc-700">
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-zinc-400">
              合計スコアと推奨判定は、権利・炎上リスクによる減点ルールを含めてシステム側で算出しています。
            </p>
          </CardBody>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="海外でバズった理由" />
            <CardBody>
              <BulletList items={analysis.why_viral_overseas} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="感情トリガー" />
            <CardBody>
              <BulletList items={analysis.emotional_triggers} />
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader title="日本市場フィット" />
          <CardBody className="space-y-3">
            <p className="text-sm whitespace-pre-wrap text-zinc-700">
              {analysis.japan_market_fit}
            </p>
            <div>
              <p className="mb-1 text-xs font-medium text-zinc-500">日本での新規性</p>
              <p className="text-sm whitespace-pre-wrap text-zinc-700">
                {analysis.novelty_in_japan}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-zinc-500">想定ターゲット</p>
              <BulletList items={analysis.target_audience} />
            </div>
          </CardBody>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title={`シリーズ化ポテンシャル(${analysis.series_potential.score}/10)`} />
            <CardBody>
              <BulletList items={analysis.series_potential.series_ideas} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={`マネタイズ適性(${analysis.monetization_fit.score}/10)`} />
            <CardBody>
              <BulletList items={analysis.monetization_fit.routes} />
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader title={`著作権リスク(${analysis.copyright_risk.score}/10)`} />
          <CardBody className="space-y-3">
            <div>
              <p className="mb-1 text-xs font-medium text-zinc-500">リスク要因</p>
              <BulletList items={analysis.copyright_risk.risk_factors} />
            </div>
            <div className="rounded-lg bg-green-50 px-4 py-3">
              <p className="mb-1 text-xs font-medium text-green-700">
                安全に再構成するためのアドバイス
              </p>
              <BulletList items={analysis.copyright_risk.safe_reconstruction_advice} />
            </div>
          </CardBody>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title={`炎上リスク(${analysis.controversy_risk.score}/10)`} />
            <CardBody>
              <BulletList items={analysis.controversy_risk.risk_factors} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={`飽和リスク(${analysis.saturation_risk.score}/10)`} />
            <CardBody>
              <p className="text-sm whitespace-pre-wrap text-zinc-700">
                {analysis.saturation_risk.reason}
              </p>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader title="ブランドセーフティ注意点" />
          <CardBody>
            <BulletList items={analysis.brand_safety_notes} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
