import { Badge } from "@/components/ui";
import {
  PLATFORM_LABELS,
  RECOMMENDATION_LABELS,
  STATUS_LABELS,
} from "@/lib/labels";
import type { Recommendation, SourcePlatform, TrendStatus } from "@/lib/types";
import { clsx } from "clsx";

export function StatusBadge({ status }: { status: TrendStatus }) {
  const colors: Record<TrendStatus, "zinc" | "green" | "yellow" | "red" | "blue" | "purple"> = {
    inbox: "zinc",
    analyzing: "blue",
    approved: "green",
    rejected: "red",
    scripted: "purple",
    editing: "yellow",
    posted: "green",
    archived: "zinc",
  };
  return <Badge color={colors[status]}>{STATUS_LABELS[status]}</Badge>;
}

export function RecommendationBadge({ recommendation }: { recommendation: Recommendation }) {
  const colors: Record<Recommendation, "green" | "yellow" | "red"> = {
    use: "green",
    maybe: "yellow",
    reject: "red",
  };
  return <Badge color={colors[recommendation]}>{RECOMMENDATION_LABELS[recommendation]}</Badge>;
}

export function PlatformBadge({ platform }: { platform: SourcePlatform }) {
  return <Badge color="indigo">{PLATFORM_LABELS[platform]}</Badge>;
}

export function ScorePill({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined) {
    return <span className="text-sm text-zinc-400">未分析</span>;
  }
  return (
    <span
      className={clsx(
        "inline-flex min-w-10 items-center justify-center rounded-md px-2 py-0.5 text-sm font-bold",
        score >= 75
          ? "bg-green-100 text-green-800"
          : score >= 50
            ? "bg-yellow-100 text-yellow-800"
            : "bg-red-100 text-red-800",
      )}
    >
      {score}
    </span>
  );
}

export function RiskScoreBadge({ label, score }: { label: string; score: number }) {
  return (
    <Badge color={score >= 7 ? "red" : score >= 4 ? "yellow" : "green"}>
      {label}: {score}/10
    </Badge>
  );
}
