import type { TrendCategory } from "@/lib/types";
import type { DiscoveredTrend, TrendSourceAdapter } from "./trend-source-adapter";

// Hacker News のトレンドを Algolia の公開検索APIから取得する。
// 認証不要・レート制限が緩く、クラウド(Vercel)のIPからも確実に取得できるため、
// Reddit がクラウドIPをブロックするケースの代替・補完として使う。
// AIツール・アプリ・テック系の話題が多く、本プロジェクトのニッチと相性が良い。

interface AlgoliaHit {
  objectID: string;
  title: string | null;
  url: string | null;
  author: string | null;
  points: number | null;
  num_comments: number | null;
  created_at: string | null;
  created_at_i: number | null;
}

// タイトルから大まかにカテゴリを推定する(完璧でなくてよい。AI分析で上書きされる)
function guessCategory(title: string): TrendCategory {
  const t = title.toLowerCase();
  if (/\b(ai|gpt|llm|model|agent|chatbot|ml|neural|openai|anthropic|claude|gemini)\b/.test(t))
    return "ai";
  if (/\b(app|launch|tool|saas|startup|built|show hn)\b/.test(t)) return "app";
  if (/\b(gadget|device|hardware|chip|phone|laptop)\b/.test(t)) return "gadget";
  if (/\b(business|revenue|funding|acquired|ipo|startup)\b/.test(t)) return "business";
  return "other";
}

export class HackerNewsAdapter implements TrendSourceAdapter {
  readonly id = "hackernews";
  readonly platform = "hackernews" as const;

  constructor(
    private readonly config: {
      /** これ未満のポイント(スコア)の記事は取り込まない */
      minPoints?: number;
      /** 何日前までの記事を対象にするか */
      withinDays?: number;
    } = {},
  ) {}

  async fetchTrends(options?: { limit?: number }): Promise<DiscoveredTrend[]> {
    const minPoints = this.config.minPoints ?? 100;
    const withinDays = this.config.withinDays ?? 3;
    const limit = options?.limit ?? 20;

    const cutoff = Math.floor(Date.now() / 1000) - withinDays * 24 * 60 * 60;
    const url =
      `https://hn.algolia.com/api/v1/search_by_date?tags=story` +
      `&numericFilters=points>${minPoints},created_at_i>${cutoff}` +
      `&hitsPerPage=${limit}`;

    const res = await fetch(url, {
      headers: { "User-Agent": "TrendBridgeAI/0.1 (trend research tool)" },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Hacker News API がエラーを返しました: HTTP ${res.status}`);
    }

    const json = (await res.json()) as { hits?: AlgoliaHit[] };
    const hits = json.hits ?? [];

    return hits
      .filter((h) => h.title)
      .map((h) => {
        const title = h.title as string;
        // 外部記事URLがあればそれを、なければHNの議論URLを出典にする
        const sourceUrl = h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`;
        return {
          source_url: sourceUrl,
          source_platform: "hackernews" as const,
          source_country: "US",
          source_language: "en",
          original_title: title,
          original_description: `Hacker News で話題(${h.points ?? 0} points / ${
            h.num_comments ?? 0
          } comments)。議論: https://news.ycombinator.com/item?id=${h.objectID}`,
          creator_name: h.author ? `@${h.author}` : undefined,
          published_at: h.created_at ?? undefined,
          likes_count: h.points ?? undefined,
          comments_count: h.num_comments ?? undefined,
          category: guessCategory(title),
        };
      });
  }
}
