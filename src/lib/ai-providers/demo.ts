import type { z } from "zod";

// デモモード: APIキーが未設定のとき、実際のAI呼び出しの代わりに
// 決定的なサンプル出力を返す。Supabaseだけ用意すれば、AIキー無しで
// 「登録→分析→パッケージ生成」の一連の流れをクリックして確認できる。
// 出力には【デモ出力】マーカーを付け、本物のAI結果と取り違えないようにする。

const DEMO_ANALYSIS = {
  summary_jp:
    "【デモ出力】海外でAIエージェントに日常業務を丸ごと任せるワークフローが話題です。これはサンプル出力で、GOOGLE_API_KEY(または OPENAI_API_KEY)を設定すると、登録したトレンドごとに本物のAI分析が生成されます。",
  why_viral_overseas: [
    "「AIが自分の代わりに作業する」という具体的な時短デモが刺さっている",
    "ビフォーアフターが数字で見えるので信ぴょう性が高い",
    "誰でも真似できる再現性のある手順になっている",
  ],
  japan_market_fit:
    "日本でもAIツールの実演系は保存されやすく、特に副業・時短・業務効率化の文脈と相性が良い。ただし専門用語を噛み砕いて解説する必要がある。",
  emotional_triggers: ["自分にもできそうという期待", "やらないと乗り遅れるという焦り", "面倒な作業を減らしたい欲求"],
  target_audience: ["副業を始めたい会社員", "個人事業主・小規模事業者", "AIツールに興味がある20〜30代"],
  novelty_in_japan:
    "海外では定番化しつつあるが、日本語で手順を丁寧に解説するコンテンツはまだ少なく、先行者メリットがある。",
  saturation_risk: {
    score: 4,
    reason: "AIツール紹介自体は増えているが、具体的なワークフロー実演はまだ余地がある。",
  },
  series_potential: {
    score: 8,
    series_ideas: ["ツール別の時短ワークフロー", "ビフォーアフター検証シリーズ", "初心者向けセットアップ解説"],
  },
  monetization_fit: {
    score: 7,
    routes: ["ツールのアフィリエイト", "有料テンプレート販売", "セミナー・コンサルへの導線"],
  },
  copyright_risk: {
    score: 2,
    risk_factors: ["元動画の画面をそのまま転載すると権利侵害の恐れがある"],
    safe_reconstruction_advice: [
      "自分の画面で同じ操作を録画し直す",
      "出典元へのリンクを概要に明記する",
      "図解は自作またはAI生成素材で用意する",
    ],
  },
  controversy_risk: {
    score: 2,
    risk_factors: ["AIの効果を誇張すると信頼を失うリスク"],
  },
  brand_safety_notes: ["過度な「簡単に稼げる」訴求は避ける", "AIの限界も正直に伝える"],
  score_breakdown: {
    global_virality: 9,
    japan_fit: 8,
    freshness: 7,
    hook_strength: 8,
    shareability: 7,
    saveability: 9,
    monetization: 7,
    production_feasibility: 8,
    rights_safety: 9,
  },
};

const DEMO_PACKAGE = {
  main_angle: "【デモ出力】海外で話題のAIワークフローを『日本語で3ステップ』に再構成して実演する",
  hook_options: [
    {
      hook: "9割の人がまだ知らないAIの使い方、30秒で説明します",
      reason: "知識の欠落を突いて視聴維持を狙う",
      target_emotion: "好奇心・焦り",
    },
    {
      hook: "この作業、まだ手でやってるの？",
      reason: "現状否定で自分ごと化させる",
      target_emotion: "共感・危機感",
    },
    {
      hook: "海外で話題のこれ、日本語でやってみた",
      reason: "新規性と親近感を両立させる",
      target_emotion: "期待",
    },
  ],
  short_15s_script:
    "①今日のテーマを一言 ②ビフォー(手作業の面倒さ)を見せる ③AIでの解決を画面で実演 ④結果を見せて保存を促す",
  short_30s_script:
    "冒頭フックで「9割が知らないAI活用」と提示 → 従来の手作業の面倒さを10秒で見せる → AIを使った3ステップを画面録画で実演 → ビフォーアフターの結果を比較 → 「保存して後で試してね」で締める。",
  short_60s_script:
    "フック(3秒) → なぜ今この話題なのかを海外の反応とともに紹介(10秒) → 従来の課題を具体例で(10秒) → AIでの解決手順を3ステップで丁寧に実演(25秒) → 注意点と限界を正直に(7秒) → 保存・フォロー・出典明記のCTA(5秒)。",
  narration_text:
    "海外でいま話題になっているのが、AIに面倒な作業を丸ごと任せるワークフローです。今日はこれを日本語で、誰でも真似できる3ステップにまとめました。まず従来のやり方だとこれだけ手間がかかります。ところがAIを使うと、この通り数十秒で終わります。やり方は概要欄にまとめたので、保存して後で試してみてください。",
  subtitle_text: "海外で話題 / AIに丸投げ / 3ステップで解決 / 保存推奨",
  instagram_caption:
    "海外で話題のAIワークフローを日本語で解説📱\n\n手作業でやっていた面倒な作業が、AIを使うと数十秒に。\n保存して後で試してみてください。\n\n出典は概要のリンクに記載しています。\n\n#AIツール #時短術 #業務効率化",
  x_post: "海外で話題のAIワークフロー、日本語で3ステップにまとめました。保存推奨👇(出典はリプ欄)",
  carousel_slides: [
    {
      slide_number: 1,
      title: "海外で話題のAI活用",
      body: "いま海外で伸びているワークフローを日本語で紹介します",
      visual_instruction: "大きめのフック文字＋自作アイコン",
    },
    {
      slide_number: 2,
      title: "ビフォー：手作業の課題",
      body: "従来の面倒な手順を図解で見せる",
      visual_instruction: "ビフォー画面のスクショ、または自作図解",
    },
    {
      slide_number: 3,
      title: "アフター：AIで解決",
      body: "AIを使った手順を3ステップで実演",
      visual_instruction: "自分の画面録画",
    },
    {
      slide_number: 4,
      title: "注意点",
      body: "効果を誇張せず、AIの限界も正直に伝える",
      visual_instruction: "テキスト中心のスライド",
    },
    {
      slide_number: 5,
      title: "保存＆出典",
      body: "保存を促し、出典リンクを明記する",
      visual_instruction: "CTA＋出典クレジット表示",
    },
  ],
  thumbnail_text_options: ["AIに丸投げした結果", "9割が知らないAI活用", "海外で話題のこれ"],
  hashtags: ["AIツール", "時短術", "業務効率化", "副業", "InstagramReels"],
  visual_plan:
    "自分の画面録画をメインに、ビフォーアフターは自作の図解で補完する。元動画の映像は使わず、出典リンクを概要に記載。BGMはフリー素材を使用。編集は35秒以内・大きめ字幕を意識する。",
  cta_options: ["保存して後で試してみてください", "フォローで次のAIツールもチェック", "コメントで使っているツールを教えてください"],
  source_attribution_text:
    "参考: 元投稿(概要欄のリンク先)。本コンテンツは海外で話題の現象を日本語で解説・再構成したものです。元動画の転載は行っていません。",
};

export async function generateStructuredDemo<T extends z.ZodTypeAny>(options: {
  systemPrompt: string;
  userPrompt: string;
  schema: T;
  schemaName: string;
}): Promise<z.infer<T>> {
  const data = options.schemaName === "content_package" ? DEMO_PACKAGE : DEMO_ANALYSIS;
  // 自分のスキーマ定義とサンプルのズレを早期検知するため、必ず検証を通す
  return options.schema.parse(data);
}
