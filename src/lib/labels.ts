import type {
  PostPlatform,
  PostStatus,
  Recommendation,
  SourcePlatform,
  TrendCategory,
  TrendStatus,
} from "./types";

export const PLATFORM_LABELS: Record<SourcePlatform, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  reddit: "Reddit",
  x: "X",
  producthunt: "Product Hunt",
  hackernews: "Hacker News",
  other: "その他",
};

export const CATEGORY_LABELS: Record<TrendCategory, string> = {
  ai: "AI",
  app: "アプリ",
  creator: "クリエイター",
  business: "ビジネス",
  lifestyle: "ライフスタイル",
  gadget: "ガジェット",
  marketing: "マーケティング",
  meme: "ミーム",
  other: "その他",
};

export const STATUS_LABELS: Record<TrendStatus, string> = {
  inbox: "受信箱",
  analyzing: "分析済み",
  approved: "採用",
  rejected: "不採用",
  scripted: "台本済み",
  editing: "編集中",
  posted: "投稿済み",
  archived: "アーカイブ",
};

export const RECOMMENDATION_LABELS: Record<Recommendation, string> = {
  use: "採用推奨",
  maybe: "要検討",
  reject: "非推奨",
};

export const POST_PLATFORM_LABELS: Record<PostPlatform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  x: "X",
  threads: "Threads",
};

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  draft: "下書き",
  scheduled: "予約済み",
  posted: "投稿済み",
  analyzed: "分析済み",
};

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}
