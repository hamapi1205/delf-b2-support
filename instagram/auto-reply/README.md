# コメント→自動DM返信システム(ManyChat・エルグラム不要)

リールに「7」とコメントが付いたら、【7 恋人】の鑑定メッセージを自動でDM送信するサーバーです。
ManyChatやエルグラムが裏側で使っているのと**同じMeta公式の仕組み(Instagram API)**を直接使うので、月額費用ゼロで、文面も挙動も完全に自分好みにできます。

## 仕組み

```
視聴者がリールに「7」とコメント
  → Metaがこのサーバーに通知(Webhook)
  → cards.json から7番のカードを特定
  → コメントした人にDMを自動送信(Private Reply)
  → 番号が読み取れないコメントには公開返信で案内
```

- コメント本文は**半角/全角数字、カード名(漢字・かな・カタカナ)**のどれでも認識します
- DM末尾に自動でLINE誘導文が付きます(環境変数で変更可)
- 自分自身のコメントには反応しません(無限ループ防止)
- 同じコメントに二重送信しません

## 必要なもの(すべて無料)

1. Instagram**プロアカウント**(すでにお持ちです)
2. [Meta for Developers](https://developers.facebook.com/) のアカウント
3. サーバーの置き場所: [Render](https://render.com/) の無料プランを想定(GitHub連携で自動デプロイ)

## セットアップ手順

### 1. Metaアプリを作る

1. developers.facebook.com → 「アプリを作成」→ ユースケースは **「Instagram」** を選択
2. アプリ内の Instagram 設定で **「Instagram Login」(Business Login)** をセットアップ
3. 自分のInstagramアカウントを接続し、**アクセストークン**を生成
   - 権限は `instagram_business_basic` / `instagram_business_manage_messages` / `instagram_business_manage_comments` を含める
   - **長期トークン(約60日有効)**に交換して控える。ついでに表示される**InstagramユーザーID(数字)**も控える
4. アプリ設定 > ベーシック で **アプリシークレット** を控える

### 2. サーバーをデプロイ(Render)

1. Renderで「New → Web Service」→ このGitHubリポジトリを選択
2. Root Directory: `instagram/auto-reply`、Start Command: `npm start`
3. 環境変数を設定(`.env.example` の項目: VERIFY_TOKEN / APP_SECRET / ACCESS_TOKEN / IG_USER_ID)
4. デプロイ後のURL(例 `https://xxx.onrender.com`)を控える

### 3. Webhookを繋ぐ

1. Metaアプリの Webhooks 設定で:
   - コールバックURL: `https://xxx.onrender.com/webhook`
   - 確認トークン: 環境変数 `VERIFY_TOKEN` と同じ文字列
2. 「確認して保存」→ 成功したら **`comments` フィールドを購読(Subscribe)**

### 4. テスト

1. 自分のリールに、**別アカウント(Metaアプリにテスターとして追加したもの)**から「7」とコメント
2. 数秒でそのアカウントに【7 恋人】のDMが届けば成功
3. Renderのログ画面で `matched card 7 恋人` が出ているか確認

## ⚠️ 公開前に必要なこと(正直な注意点)

- **アプリレビュー(無料)**: 作りたてのMetaアプリは「開発モード」で、**自分とテスターのコメントにしか反応しません**。一般のフォロワーに反応させるには、Metaの画面から上記3権限の「詳細アクセス(Advanced Access)」を申請します。「コメントされたカード番号の占い結果をDMで届ける」という利用目的とデモ動画を提出すれば、通常数日〜2週間で承認されます。ManyChat利用時はこの審査をManyChatが肩代わりしているだけで、自前でも同じことができます。
- **トークン更新**: 長期トークンは約60日で切れます。月1回のカレンダー予定にして更新してください(切れるとDMが止まるだけで、危険はありません)。
- **Renderの無料プランはスリープする**: アクセスがないと停止し、次の通知で起き上がるまで数十秒かかります。Metaは通知を再送するので実用上はほぼ問題ありませんが、確実にしたい場合は [UptimeRobot](https://uptimerobot.com/)(無料)で5分ごとに `https://xxx.onrender.com/` を監視させて起こし続けてください。
- **Metaのルール内で動く安全設計です**: Private Reply(コメントへのDM返信)はMetaが公式に用意している機能で、1コメントにつき1通だけ送れます。スパム扱いされる一括DMとはまったく別物なので、アカウントBANの心配なく使えます。

## 文面のカスタマイズ

- 鑑定メッセージ: `cards.json` を編集(季節限定カードの追加もここ)
- LINE誘導文: 環境変数 `DM_FOOTER`
- 番号なしコメントへの公開返信: 環境変数 `FALLBACK_REPLY`

編集してGitHubにpushすれば、Renderが自動で再デプロイします。
