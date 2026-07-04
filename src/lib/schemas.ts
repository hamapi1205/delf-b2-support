import { z } from "zod";

// ---------------------------------------------------------------------------
// AI出力スキーマ(OpenAI Structured Outputs に渡す)
// スコアは全て0〜10。total_score / recommendation はAIに出させず、
// scoring.ts でサーバー側が決定的に算出する。
// ---------------------------------------------------------------------------

const score10 = z.number().int().min(0).max(10);

export const trendAnalysisAiSchema = z.object({
  summary_jp: z.string().describe("このトレンドの日本語での要約(2〜4文)"),
  why_viral_overseas: z.array(z.string()).describe("海外でバズった理由"),
  japan_market_fit: z.string().describe("日本市場との相性の分析"),
  emotional_triggers: z.array(z.string()).describe("視聴者の感情トリガー"),
  target_audience: z.array(z.string()).describe("日本での想定ターゲット層"),
  novelty_in_japan: z.string().describe("日本での新規性"),
  saturation_risk: z.object({
    score: score10.describe("飽和リスク 0=低 10=高"),
    reason: z.string(),
  }),
  series_potential: z.object({
    score: score10.describe("シリーズ化ポテンシャル 0=低 10=高"),
    series_ideas: z.array(z.string()),
  }),
  monetization_fit: z.object({
    score: score10.describe("マネタイズ適性 0=低 10=高"),
    routes: z.array(z.string()),
  }),
  copyright_risk: z.object({
    score: score10.describe("著作権リスク 0=低 10=高"),
    risk_factors: z.array(z.string()),
    safe_reconstruction_advice: z.array(z.string()),
  }),
  controversy_risk: z.object({
    score: score10.describe("炎上リスク 0=低 10=高"),
    risk_factors: z.array(z.string()),
  }),
  brand_safety_notes: z.array(z.string()),
  score_breakdown: z.object({
    global_virality: score10,
    japan_fit: score10,
    freshness: score10,
    hook_strength: score10,
    shareability: score10,
    saveability: score10,
    monetization: score10,
    production_feasibility: score10,
    rights_safety: score10.describe("権利面の安全性 0=危険 10=安全"),
  }),
});

export type TrendAnalysisAi = z.infer<typeof trendAnalysisAiSchema>;

export const contentPackageAiSchema = z.object({
  main_angle: z.string().describe("日本向けのメイン切り口"),
  hook_options: z
    .array(
      z.object({
        hook: z.string(),
        reason: z.string(),
        target_emotion: z.string(),
      }),
    )
    .describe("冒頭3秒のフック候補(3〜5個)"),
  short_15s_script: z.string(),
  short_30s_script: z.string(),
  short_60s_script: z.string(),
  narration_text: z.string(),
  subtitle_text: z.string(),
  instagram_caption: z.string(),
  x_post: z.string().describe("X向け投稿文(140字目安)"),
  carousel_slides: z.array(
    z.object({
      slide_number: z.number().int(),
      title: z.string(),
      body: z.string(),
      visual_instruction: z.string(),
    }),
  ),
  thumbnail_text_options: z.array(z.string()),
  hashtags: z.array(z.string()),
  visual_plan: z.string().describe("自作素材・AI素材・画面録画での映像プラン"),
  cta_options: z.array(z.string()),
  source_attribution_text: z.string().describe("出典クレジット文(必須)"),
});

export type ContentPackageAi = z.infer<typeof contentPackageAiSchema>;

// ---------------------------------------------------------------------------
// フォーム入力スキーマ(React Hook Form + zodResolver)
// ---------------------------------------------------------------------------

// フォーム側で setValueAs による "" → null 変換を行う前提の数値スキーマ
const optionalNumber = z.number().int().min(0).nullish();

export const trendIntakeSchema = z.object({
  source_url: z.string().url("URLの形式が正しくありません"),
  source_platform: z.enum([
    "tiktok",
    "instagram",
    "youtube",
    "reddit",
    "x",
    "producthunt",
    "hackernews",
    "other",
  ]),
  source_country: z.string().optional(),
  source_language: z.string().optional(),
  original_title: z.string().min(1, "タイトルは必須です"),
  original_description: z.string().optional(),
  creator_name: z.string().optional(),
  published_at: z.string().optional(),
  views_count: optionalNumber,
  likes_count: optionalNumber,
  comments_count: optionalNumber,
  shares_count: optionalNumber,
  saves_count: optionalNumber,
  category: z.enum([
    "ai",
    "app",
    "creator",
    "business",
    "lifestyle",
    "gadget",
    "marketing",
    "meme",
    "other",
  ]),
  user_memo: z.string().optional(),
});

export type TrendIntakeInput = z.infer<typeof trendIntakeSchema>;

export const postFormSchema = z.object({
  trend_item_id: z.string().uuid("トレンドを選択してください"),
  content_package_id: z.string().uuid().optional().or(z.literal("")),
  platform: z.enum(["instagram", "tiktok", "youtube", "x", "threads"]),
  post_url: z.string().url("URLの形式が正しくありません").optional().or(z.literal("")),
  posted_at: z.string().optional(),
  post_status: z.enum(["draft", "scheduled", "posted", "analyzed"]),
  hook_used: z.string().optional(),
  format_used: z.string().optional(),
});

export type PostFormInput = z.infer<typeof postFormSchema>;

// フォーム側で setValueAs による "" → 0 変換を行う前提の数値スキーマ
const requiredNumber = z.number().int().min(0);

export const snapshotFormSchema = z.object({
  post_id: z.string().uuid(),
  captured_at: z.string().optional(),
  views_count: requiredNumber,
  likes_count: requiredNumber,
  comments_count: requiredNumber,
  shares_count: requiredNumber,
  saves_count: requiredNumber,
  follows_count: requiredNumber,
  profile_clicks: requiredNumber,
  link_clicks: requiredNumber,
  notes: z.string().optional(),
});

export type SnapshotFormInput = z.infer<typeof snapshotFormSchema>;

// API Route 入力
export const analyzeTrendRequestSchema = z.object({
  trend_item_id: z.string().uuid(),
});

export const generatePackageRequestSchema = z.object({
  trend_item_id: z.string().uuid(),
  analysis_id: z.string().uuid(),
});
