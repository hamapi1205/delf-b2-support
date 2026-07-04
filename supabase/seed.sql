-- TrendBridge AI — seed data
-- Run after migrations via Supabase SQL Editor or `supabase db reset` (which applies seed.sql).

-- ---------------------------------------------------------------------------
-- Prompt templates(API Routeが is_active=true のものを読み込む)
-- プレースホルダ: {{TREND_JSON}} / {{ANALYSIS_JSON}}
-- ---------------------------------------------------------------------------
insert into prompt_templates (name, description, template, version, is_active) values
(
  'analyze_trend',
  'トレンド分析用のシステムプロンプト',
  'あなたは日本向けショート動画メディアの編集長です。
海外で話題のネタを、単なる翻訳ではなく、日本人が反応しやすい切り口に再構成する前提で分析してください。
元動画や元投稿の創作表現をコピーする提案はしないでください。
日本の視聴者にとって「なぜ今見るべきか」が3秒で伝わるかを重視してください。
炎上・著作権・誤情報・過剰煽りのリスクを必ず評価してください。
必要に応じて「投稿しない(reject相当の厳しい評価)」判断もしてください。

スコアは全て0〜10の整数で、10が最良(リスク系スコアは10が最も危険)です。
score_breakdown の各項目も0〜10で採点してください。合計点はシステム側で計算するため出力不要です。

分析対象のトレンド情報:
{{TREND_JSON}}',
  1,
  true
),
(
  'generate_content_package',
  'コンテンツパッケージ生成用のシステムプロンプト',
  'あなたは日本向けショート動画メディアの編集長です。
以下の海外トレンドとその分析結果をもとに、日本人向けの投稿コンテンツ一式を生成してください。

必ず守ること:
- 元動画・元投稿の創作表現(セリフ、構成、映像演出)をコピーしない
- 「海外でこういう現象が話題」という解説・要約・再構成として作る
- 自作図解、AI生成素材、ストック素材、自分で録画した画面で制作できる構成にする
- 出典として元ネタへのリンク・クレジットを必ず入れる(source_attribution_text)
- 冒頭3秒で「なぜ今見るべきか」が伝わるフックにする
- 誤情報・過剰煽り・断定しすぎを避ける

トレンド情報:
{{TREND_JSON}}

分析結果:
{{ANALYSIS_JSON}}',
  1,
  true
);

-- ---------------------------------------------------------------------------
-- デモ用トレンド(README通りに動作確認するためのサンプル)
-- ---------------------------------------------------------------------------
insert into trend_items (
  id, source_url, source_platform, source_country, source_language,
  original_title, original_description, creator_name, published_at,
  views_count, likes_count, comments_count, shares_count, saves_count,
  category, user_memo, status
) values
(
  '11111111-1111-1111-1111-111111111111',
  'https://www.tiktok.com/@example/video/000000001',
  'tiktok', 'US', 'en',
  'I automated my entire morning routine with AI agents',
  'Creator shows how they chained AI agents to plan their day, draft emails and summarize news before breakfast.',
  '@aihustler', '2026-06-20T09:00:00Z',
  4200000, 512000, 8300, 41000, 96000,
  'ai', 'エージェント系は日本でまだ薄い。図解+画面録画で再構成できそう', 'inbox'
),
(
  '22222222-2222-2222-2222-222222222222',
  'https://www.producthunt.com/posts/example-focus-app',
  'producthunt', 'US', 'en',
  'Focus app that locks your phone until you finish one task',
  'Product Hunt #1 of the day. App physically blocks all notifications until the current task is marked done.',
  'FocusLab', '2026-06-25T00:00:00Z',
  null, 3200, 450, null, null,
  'app', '日本の受験生・資格勉強勢に刺さる可能性', 'inbox'
),
(
  '33333333-3333-3333-3333-333333333333',
  'https://www.youtube.com/shorts/000000003',
  'youtube', 'UK', 'en',
  'This $30 gadget replaced my $500 standing desk setup',
  'Short review of a cheap laptop riser going viral among remote workers.',
  'DeskSetupDaily', '2026-06-15T12:00:00Z',
  1800000, 210000, 3900, 12000, 54000,
  'gadget', 'Amazon楽天で同等品があるか要確認。アフィリエイト向き', 'inbox'
);
