// DB row types — supabase/migrations/0001_init.sql と対応させて手書きで管理する。
// スキーマ変更時は migration と同時にここも更新すること。

export type SourcePlatform =
  | "tiktok"
  | "instagram"
  | "youtube"
  | "reddit"
  | "x"
  | "producthunt"
  | "hackernews"
  | "other";

export type TrendCategory =
  | "ai"
  | "app"
  | "creator"
  | "business"
  | "lifestyle"
  | "gadget"
  | "marketing"
  | "meme"
  | "other";

export type TrendStatus =
  | "inbox"
  | "analyzing"
  | "approved"
  | "rejected"
  | "scripted"
  | "editing"
  | "posted"
  | "archived";

export type Recommendation = "use" | "maybe" | "reject";

export type PostPlatform = "instagram" | "tiktok" | "youtube" | "x" | "threads";

export type PostStatus = "draft" | "scheduled" | "posted" | "analyzed";

export interface TrendItem {
  id: string;
  source_url: string;
  source_platform: SourcePlatform;
  source_country: string | null;
  source_language: string | null;
  original_title: string;
  original_description: string | null;
  creator_name: string | null;
  published_at: string | null;
  discovered_at: string;
  views_count: number | null;
  likes_count: number | null;
  comments_count: number | null;
  shares_count: number | null;
  saves_count: number | null;
  category: TrendCategory;
  user_memo: string | null;
  status: TrendStatus;
  created_at: string;
  updated_at: string;
}

export interface ScoredRisk {
  score: number;
  reason?: string;
  risk_factors?: string[];
  safe_reconstruction_advice?: string[];
}

export interface ScoreBreakdown {
  global_virality: number;
  japan_fit: number;
  freshness: number;
  hook_strength: number;
  shareability: number;
  saveability: number;
  monetization: number;
  production_feasibility: number;
  rights_safety: number;
}

export interface TrendAnalysis {
  id: string;
  trend_item_id: string;
  summary_jp: string;
  why_viral_overseas: string[];
  japan_market_fit: string;
  emotional_triggers: string[];
  target_audience: string[];
  novelty_in_japan: string;
  saturation_risk: { score: number; reason: string };
  series_potential: { score: number; series_ideas: string[] };
  monetization_fit: { score: number; routes: string[] };
  copyright_risk: {
    score: number;
    risk_factors: string[];
    safe_reconstruction_advice: string[];
  };
  controversy_risk: { score: number; risk_factors: string[] };
  brand_safety_notes: string[];
  total_score: number;
  score_breakdown: ScoreBreakdown;
  recommendation: Recommendation;
  created_at: string;
}

export interface HookOption {
  hook: string;
  reason: string;
  target_emotion: string;
}

export interface CarouselSlide {
  slide_number: number;
  title: string;
  body: string;
  visual_instruction: string;
}

export interface ContentPackage {
  id: string;
  trend_item_id: string;
  analysis_id: string;
  main_angle: string;
  hook_options: HookOption[];
  short_15s_script: string;
  short_30s_script: string;
  short_60s_script: string;
  narration_text: string;
  subtitle_text: string;
  instagram_caption: string;
  x_post: string;
  carousel_slides: CarouselSlide[];
  thumbnail_text_options: string[];
  hashtags: string[];
  visual_plan: string;
  cta_options: string[];
  source_attribution_text: string;
  created_at: string;
}

export interface Post {
  id: string;
  trend_item_id: string;
  content_package_id: string | null;
  platform: PostPlatform;
  post_url: string | null;
  posted_at: string | null;
  post_status: PostStatus;
  hook_used: string | null;
  format_used: string | null;
  created_at: string;
  updated_at: string;
}

export interface PerformanceSnapshot {
  id: string;
  post_id: string;
  captured_at: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  saves_count: number;
  follows_count: number;
  profile_clicks: number;
  link_clicks: number;
  notes: string | null;
  created_at: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string | null;
  template: string;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
