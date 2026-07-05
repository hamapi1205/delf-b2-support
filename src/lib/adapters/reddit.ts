import type { TrendCategory } from "@/lib/types";
import type { DiscoveredTrend, TrendSourceAdapter } from "./trend-source-adapter";

// Reddit の公開JSONエンドポイント(認証不要・読み取り専用)からトレンドを取得する。
// 公式に許可された read-only エンドポイントだが、レート制限(目安: 10req/分)が
// あるため、取得は1日1〜数回のバッチ実行を前提とする。

const VALID_CATEGORIES: TrendCategory[] = [
  "ai",
  "app",
  "creator",
  "business",
  "lifestyle",
  "gadget",
  "marketing",
  "meme",
  "other",
];

export interface SubredditConfig {
  subreddit: string;
  category: TrendCategory;
}

/**
 * REDDIT_SUBREDDITS 環境変数をパースする。
 * 形式: "ChatGPT:ai,SideProject:app,InternetIsBeautiful"(カテゴリ省略時は other)
 */
export function parseSubredditConfig(raw: string | undefined): SubredditConfig[] {
  const fallback: SubredditConfig[] = [
    { subreddit: "ChatGPT", category: "ai" },
    { subreddit: "artificial", category: "ai" },
    { subreddit: "InternetIsBeautiful", category: "app" },
  ];
  if (!raw?.trim()) return fallback;

  const configs: SubredditConfig[] = [];
  for (const entry of raw.split(",")) {
    const [subreddit, category] = entry.trim().split(":");
    if (!subreddit) continue;
    configs.push({
      subreddit,
      category: VALID_CATEGORIES.includes(category as TrendCategory)
        ? (category as TrendCategory)
        : "other",
    });
  }
  return configs.length > 0 ? configs : fallback;
}

interface RedditPost {
  title: string;
  permalink: string;
  ups: number;
  num_comments: number;
  created_utc: number;
  author: string;
  selftext: string;
  subreddit: string;
  over_18: boolean;
  stickied: boolean;
}

export class RedditAdapter implements TrendSourceAdapter {
  readonly id = "reddit";
  readonly platform = "reddit" as const;

  constructor(
    private readonly config: {
      subreddits: SubredditConfig[];
      /** これ未満のupvote数の投稿は取り込まない */
      minScore?: number;
    },
  ) {}

  async fetchTrends(options?: { limit?: number }): Promise<DiscoveredTrend[]> {
    const perSubreddit = options?.limit ?? 10;
    const minScore = this.config.minScore ?? 200;
    const results: DiscoveredTrend[] = [];

    for (const { subreddit, category } of this.config.subreddits) {
      try {
        const res = await fetch(
          `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/top.json?t=day&limit=${perSubreddit}&raw_json=1`,
          {
            headers: { "User-Agent": "TrendBridgeAI/0.1 (trend research tool)" },
            cache: "no-store",
          },
        );
        if (!res.ok) {
          console.error(`Reddit fetch failed for r/${subreddit}: HTTP ${res.status}`);
          continue;
        }
        const json = (await res.json()) as {
          data?: { children?: { data: RedditPost }[] };
        };

        for (const child of json.data?.children ?? []) {
          const post = child.data;
          if (post.over_18 || post.stickied || post.ups < minScore) continue;
          results.push({
            source_url: `https://www.reddit.com${post.permalink}`,
            source_platform: "reddit",
            source_country: "US",
            source_language: "en",
            original_title: post.title,
            original_description: post.selftext
              ? post.selftext.slice(0, 1000)
              : `r/${post.subreddit} の投稿`,
            creator_name: `u/${post.author}`,
            published_at: new Date(post.created_utc * 1000).toISOString(),
            likes_count: post.ups,
            comments_count: post.num_comments,
            category,
          });
        }
      } catch (error) {
        // 1つのsubredditが失敗しても他は続行する
        console.error(`Reddit fetch failed for r/${subreddit}:`, error);
      }
    }

    return results;
  }
}
