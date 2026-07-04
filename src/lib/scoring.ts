import type { Recommendation, ScoreBreakdown } from "./types";

// total_score と recommendation はAI出力に依存させず、ここで決定的に計算する。
// 理由: LLMの自己採点は実行ごとにブレるうえ、権利リスクによる減点ルールを
// プロンプト任せにすると担保できないため。ルールを変えたいときはここだけ直す。

// 各項目は0〜10。重みの合計は100(=満点100点)。
const WEIGHTS: Record<keyof ScoreBreakdown, number> = {
  global_virality: 10,
  japan_fit: 15,
  freshness: 10,
  hook_strength: 10,
  shareability: 10,
  saveability: 10,
  monetization: 10,
  production_feasibility: 10,
  rights_safety: 15,
};

export interface RiskScores {
  copyrightRisk: number; // 0=低 10=高
  controversyRisk: number; // 0=低 10=高
}

export function computeTotalScore(breakdown: ScoreBreakdown, risks: RiskScores): number {
  let total = 0;
  for (const key of Object.keys(WEIGHTS) as (keyof ScoreBreakdown)[]) {
    const score = Math.max(0, Math.min(10, breakdown[key] ?? 0));
    total += (score / 10) * WEIGHTS[key];
  }

  // リスクが「中央値超え」の分だけ追加減点する
  const copyrightPenalty = Math.max(0, risks.copyrightRisk - 5) * 4;
  const controversyPenalty = Math.max(0, risks.controversyRisk - 5) * 3;

  return Math.round(Math.max(0, Math.min(100, total - copyrightPenalty - controversyPenalty)));
}

export function decideRecommendation(totalScore: number, risks: RiskScores): Recommendation {
  const highRights = risks.copyrightRisk >= 8 || risks.controversyRisk >= 8;
  if (totalScore <= 49 || highRights) return "reject";

  const lowRights = risks.copyrightRisk <= 4 && risks.controversyRisk <= 5;
  if (totalScore >= 75 && lowRights) return "use";

  return "maybe";
}

// ---------------------------------------------------------------------------
// Performance Tracker の派生指標(DBには保存しない)
// ---------------------------------------------------------------------------

export interface SnapshotCounts {
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  saves_count: number;
  follows_count: number;
  profile_clicks: number;
}

export interface DerivedRates {
  like_rate: number | null;
  comment_rate: number | null;
  share_rate: number | null;
  save_rate: number | null;
  follow_rate: number | null;
  profile_click_rate: number | null;
}

export function computeRates(s: SnapshotCounts): DerivedRates {
  const div = (n: number) => (s.views_count > 0 ? n / s.views_count : null);
  return {
    like_rate: div(s.likes_count),
    comment_rate: div(s.comments_count),
    share_rate: div(s.shares_count),
    save_rate: div(s.saves_count),
    follow_rate: div(s.follows_count),
    profile_click_rate: div(s.profile_clicks),
  };
}

export function formatRate(rate: number | null): string {
  if (rate === null) return "—";
  return `${(rate * 100).toFixed(2)}%`;
}
