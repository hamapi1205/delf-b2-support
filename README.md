# TrendBridge AI

海外でバズっているショート動画・SNS投稿・AIツール・便利サービスを、**日本向けのショート動画/投稿に再構成する**ためのAI編集部ツールです。

単なる翻訳ツールではなく、以下を一気通貫で管理します。

1. 海外でバズった理由の分析
2. 日本で伸びる可能性の評価(スコアリング)
3. 日本人向けの切り口への再構成
4. 複数の投稿フォーマット生成(15/30/60秒台本、カルーセル、キャプション等)
5. 著作権・炎上リスクのチェック
6. 投稿後の数値記録と改善(保存率・シェア率・フォロー転換率の自動計算)

> **重要な設計思想**: 元動画をコピー・転載するツールではありません。海外で話題の「現象」を、自作図解・AI生成素材・ストック素材・自分で録画した画面・最小限の引用・出典リンクを使って**解説・要約・再構成**する前提で設計されています。

## 技術スタック

- Next.js (App Router) / TypeScript / Tailwind CSS
- Supabase (DB + Auth)
- OpenAI API (Structured Outputs)
- Zod / React Hook Form
- ESLint / Prettier

## セットアップ方法

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabase プロジェクトの作成

1. [supabase.com](https://supabase.com) で新規プロジェクトを作成
2. **SQL Editor** を開き、`supabase/migrations/0001_init.sql` の内容を実行(テーブル・enum・RLSが作成されます)
3. 続けて `supabase/seed.sql` を実行(プロンプトテンプレートとデモ用トレンド3件が入ります)

Supabase CLI を使う場合:

```bash
supabase link --project-ref <your-project-ref>
supabase db push          # migrations を適用
# seed は SQL Editor で supabase/seed.sql を実行するか、
# ローカル開発なら `supabase db reset` で自動適用されます
```

4. **Authentication > Providers** で Email を有効にする(デフォルトで有効)
   - 開発中は **Authentication > Settings** で「Confirm email」をオフにすると、確認メール無しでログインできて楽です

### 3. 環境変数の設定

```bash
cp .env.example .env.local
```

| 変数 | 説明 | 取得場所 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトURL | Project Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 匿名キー(ブラウザ用) | Project Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Roleキー(**サーバー専用・秘密**) | Project Settings > API |
| `OPENAI_API_KEY` | OpenAI APIキー | platform.openai.com |
| `OPENAI_MODEL` | 使用モデル(省略時 `gpt-4o-mini`) | 任意 |

### 4. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 を開くとログイン画面が表示されます。「アカウントを新規作成する」からメール+パスワードでアカウントを作成してログインしてください。

### 5. 動作確認の流れ

1. **トレンド一覧** — seedで入ったデモトレンド3件が見えます
2. トレンド詳細を開き **「AI分析を実行」** → 分析結果がDBに保存され、スコアと推奨判定が表示されます
3. 分析結果から **「コンテンツパッケージを生成」** → 台本・キャプション一式が生成されます
4. **パフォーマンストラッカー** で投稿を記録し、数値を入力すると保存率などが自動計算されます
5. **ダッシュボード** にスコア上位の未投稿ネタと成績上位の投稿が表示されます

## DB migration 方法

- 新しいマイグレーションは `supabase/migrations/` に連番のSQLファイルとして追加します(例: `0002_add_xxx.sql`)
- Supabase CLI なら `supabase db push`、管理画面なら SQL Editor で実行します
- テーブル型は `src/lib/types.ts` に手書きで対応させているため、スキーマ変更時は同時に更新してください

## 主要機能

| 画面 | パス | 内容 |
| --- | --- | --- |
| ダッシュボード | `/` | 登録数・分析数・use/maybe/reject件数・平均スコア・今週の投稿数・上位ネタ/投稿 |
| トレンド登録 | `/trends/new` | 海外ネタの手入力登録(URL・タイトル・数値など) |
| トレンド一覧 | `/trends` | スコア・推奨・ステータス付き一覧 |
| トレンド詳細 | `/trends/[id]` | 元情報・AI分析・パッケージ・投稿記録・ステータス変更 |
| AI分析詳細 | `/analyses/[id]` | スコア内訳・リスク評価・再構成アドバイスの全文 |
| パッケージ詳細 | `/packages/[id]` | フック候補・台本・カルーセル・ハッシュタグ・出典クレジット |
| パフォーマンス | `/performance` | 投稿記録と数値スナップショット入力、各種レート自動計算 |
| 設定 | `/settings` | AIプロンプトテンプレートの編集(DBで管理・バージョン付き) |

### API Routes

- `POST /api/analyze-trend` — `{ trend_item_id }` を受け取り、OpenAI Structured Outputs でJSON Schemaに沿った分析を生成して `trend_analyses` に保存
- `POST /api/generate-content-package` — `{ trend_item_id, analysis_id }` を受け取り、投稿フォーマット一式を生成して `content_packages` に保存

### スコアリングの仕組み

AIには **0〜10の項目別スコアとリスク評価のみ**を出させ、`total_score`(0〜100)と `recommendation`(use / maybe / reject)は `src/lib/scoring.ts` でサーバー側が決定的に計算します。

- 重み付け合計(japan_fit と rights_safety を重めに設定)
- 著作権リスク・炎上リスクがスコア5を超えた分だけ追加減点
- use: 75点以上かつ権利・炎上リスクが低い / reject: 49点以下または高リスク / それ以外: maybe

LLMの自己採点のブレを避け、判定基準をコードで管理・変更できるようにするための設計です。

## 今後の拡張案

- **トレンド自動取得**: `src/lib/adapters/trend-source-adapter.ts` にアダプタインターフェースと将来実装のスタブ(TikTok Creative Center / YouTube Trends / Google Trends / Reddit / Meta API)を用意済み
- **Meta API連携**: 投稿予約・コメント取得/分析・DM自動応答・インサイト自動取得(`performance_snapshots` の自動記録)
- **学習ループの強化**: 過去の投稿成績(どのフック・フォーマットが伸びたか)をAI分析プロンプトに注入し、分析精度を上げる
- **マルチテナント化**: 現在のRLSは「ログイン済みユーザー全許可」のシングルテナント設計。チーム利用する場合は各テーブルに `user_id` / `team_id` を追加し、ownerベースのポリシーに移行する
- **A/Bテスト管理**: 同一パッケージから複数フックで投稿し、成績を比較する機能

## 著作権リスクを避ける運用方針

このツールは以下の運用を前提としています。

1. **元動画・元投稿の転載・コピーをしない** — 映像・音声・字幕の複製、構成の丸写しはNG
2. **「現象の解説」として作る** — 「海外で〇〇が話題になっている」という事実の紹介・分析・考察として再構成する
3. **素材は権利的に安全なものだけ使う** — 自作図解、AI生成素材、ライセンス済みストック素材、自分で録画した画面
4. **引用は最小限・要件を満たす形で** — 引用する場合は主従関係・出所明示・改変禁止などの引用要件(著作権法32条)を守る
5. **出典を必ず表記する** — 生成される `source_attribution_text` を投稿に必ず含める(パッケージ詳細画面の最上部に固定表示されます)
6. **AIのリスク評価を尊重する** — `copyright_risk` が高い、または `reject` 判定のネタは投稿しない。`safe_reconstruction_advice` に従って作り直す
7. **人物・ブランドの扱いに注意** — 個人への誹謗中傷になりうる切り口、商標・肖像権に触れる使い方をしない

> AIのリスク評価は参考情報であり、法的判断の代替にはなりません。判断に迷うケースは弁護士等の専門家に確認してください。
