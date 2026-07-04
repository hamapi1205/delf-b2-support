import type { SourcePlatform, TrendCategory } from "@/lib/types";

// ---------------------------------------------------------------------------
// 将来拡張: トレンド自動取得アダプタ
//
// MVPではユーザーの手入力のみでトレンドを登録するため、これらは未実装。
// 自動取得を追加する際は、このインターフェースを実装したアダプタを作り、
// 取得結果を DiscoveredTrend として trend_items へ流し込む。
// ---------------------------------------------------------------------------

/** アダプタが返す、trend_items に挿入可能な形のトレンド候補 */
export interface DiscoveredTrend {
  source_url: string;
  source_platform: SourcePlatform;
  source_country?: string;
  source_language?: string;
  original_title: string;
  original_description?: string;
  creator_name?: string;
  published_at?: string;
  views_count?: number;
  likes_count?: number;
  comments_count?: number;
  shares_count?: number;
  saves_count?: number;
  category?: TrendCategory;
}

export interface TrendSourceAdapter {
  /** アダプタ識別子(例: "tiktok-creative-center") */
  readonly id: string;
  /** 取得対象プラットフォーム */
  readonly platform: SourcePlatform;
  /** トレンド候補を取得する */
  fetchTrends(options?: { limit?: number; country?: string }): Promise<DiscoveredTrend[]>;
}

/**
 * TikTok Creative Center のトレンドハッシュタグ・動画を取得する(将来実装)。
 * 公式APIが限定的なため、実装時はスクレイピング規約とレート制限に注意。
 */
export class TikTokCreativeCenterAdapter implements TrendSourceAdapter {
  readonly id = "tiktok-creative-center";
  readonly platform = "tiktok" as const;
  fetchTrends(): Promise<DiscoveredTrend[]> {
    throw new Error("Not implemented: MVPでは手入力のみ");
  }
}

/**
 * YouTube Data API のトレンド(mostPopular)を取得する(将来実装)。
 * regionCode で国別トレンドを取得できる。
 */
export class YouTubeTrendsAdapter implements TrendSourceAdapter {
  readonly id = "youtube-trends";
  readonly platform = "youtube" as const;
  fetchTrends(): Promise<DiscoveredTrend[]> {
    throw new Error("Not implemented: MVPでは手入力のみ");
  }
}

/**
 * Google Trends の急上昇ワードからネタ候補を作る(将来実装)。
 * 動画そのものではなく「話題」を拾うためのアダプタ。
 */
export class GoogleTrendsAdapter implements TrendSourceAdapter {
  readonly id = "google-trends";
  readonly platform = "other" as const;
  fetchTrends(): Promise<DiscoveredTrend[]> {
    throw new Error("Not implemented: MVPでは手入力のみ");
  }
}

/**
 * Reddit の急上昇ポストを取得する(将来実装)。
 * 公式APIあり。subreddit単位でのニッチトレンド発見に向く。
 */
export class RedditAdapter implements TrendSourceAdapter {
  readonly id = "reddit";
  readonly platform = "reddit" as const;
  fetchTrends(): Promise<DiscoveredTrend[]> {
    throw new Error("Not implemented: MVPでは手入力のみ");
  }
}

/**
 * Meta Graph API 連携(将来実装)。
 * トレンド取得に加えて、投稿予約・コメント取得/分析・DM自動応答・
 * インサイト取得(performance_snapshots の自動記録)までを想定する。
 */
export class MetaApiAdapter implements TrendSourceAdapter {
  readonly id = "meta-api";
  readonly platform = "instagram" as const;
  fetchTrends(): Promise<DiscoveredTrend[]> {
    throw new Error("Not implemented: MVPでは手入力のみ");
  }
}
