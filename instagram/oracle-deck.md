# ハルの縁結びオラクル(全50枚)

ハル専用の完全オリジナルデッキです。タロットと違い著作権の問題が一切なく、
**「このカードは、世界で私しか使っていません」**と言い切れるのが最大の差別化になります。

## デッキのコンセプト

- 全50枚、**不安にさせるカードは1枚もない**(凶札なし)。どこで止めても寄り添いのメッセージ
- 全カードに**赤い糸**のモチーフが入る(ハルのデッキの署名)
- 5つの章 × 各10枚。番号の十の位で章がわかる構造

| 章 | 番号 | テーマ | 答えてくれる問い |
|---|---|---|---|
| 一の章 ご縁 | 1〜10 | 糸・結び・出会い | ふたりの縁は、いまどうなってる? |
| 二の章 月と星 | 11〜20 | とき・タイミング | いつ動けばいい? |
| 三の章 季節 | 21〜30 | めぐり・移ろい | この停滞・変化の意味は? |
| 四の章 こころ | 31〜40 | 心の整え | いま私は何をすればいい? |
| 五の章 みらい | 41〜50 | 実り・結ばれる未来 | この先どうなっていく? |

全50枚の鑑定文(自動DMの文面)は [auto-reply/cards-oracle.json](auto-reply/cards-oracle.json) に執筆済みです。

## カード一覧と画像生成プロンプト

### 共通プロンプト(全カードでこの部分は固定)

```
Oracle card illustration, 〔MOTIF〕, elegant Japanese-inspired art style,
deep navy night sky background with gold accents, a thin glowing red
thread of fate woven through the composition, ornate gold border frame,
soft mystical lighting, warm and reassuring mood, vertical 4:5 card,
clean flat illustration, no text, no people's faces
```

〔MOTIF〕を下の表から差し替えて生成 → **番号(特大)とカード名をCanvaで後乗せ**します。
文字を後乗せにするのは、誤字防止と「高速回転でもスクショで番号が読める」ため。番号は上部に画面幅の1/3くらいの大きさで。

### 一の章 ご縁(1〜10)

| # | カード | MOTIF(英語) |
|---|---|---|
| 1 | 赤い糸 | a single glowing red thread floating across the night sky, connecting two distant points of light |
| 2 | 結び目 | a beautiful decorative Japanese mizuhiki knot tied in red thread, glowing softly |
| 3 | はじまりの風 | cherry blossom petals and a red thread carried by a gentle spring breeze over a path |
| 4 | 再会 | two paper lanterns floating toward each other on a calm night river |
| 5 | 約束 | a pinky-promise gesture made of intertwined red threads under stars |
| 6 | 手紙 | a sealed old-fashioned letter tied with red thread, glowing faintly |
| 7 | 鈴の音 | a small golden shrine bell with a red cord, sound ripples visualized as golden circles |
| 8 | 橋 | an arched wooden bridge over a starry river, red thread following the railing |
| 9 | 灯籠 | a stone lantern glowing warmly in a dark garden, red thread wrapped around its base |
| 10 | 鳥居 | a vermilion torii gate under the night sky, path of light leading through it |

### 二の章 月と星(11〜20)

| # | カード | MOTIF(英語) |
|---|---|---|
| 11 | 新月 | a dark new moon outlined by a thin ring of silver light, stars around it |
| 12 | 三日月 | a delicate crescent moon cradling a small red thread like a hammock |
| 13 | 満月 | a large luminous full moon rising over calm water, golden reflection |
| 14 | 月光 | moonbeams falling through clouds onto a sleeping town, gentle and protective |
| 15 | 流れ星 | a bright shooting star with a red thread tail crossing the sky |
| 16 | 北極星 | one bright polar star above a compass rose, all constellations turning around it |
| 17 | 天の川 | the Milky Way as a river of stars, red thread bridging its two banks |
| 18 | 夜明け | the horizon just before sunrise, deep navy melting into pale gold |
| 19 | 朝日 | a warm rising sun over mountains, rays of gold, morning mist clearing |
| 20 | 虹 | a soft rainbow appearing after rain, raindrops still sparkling |

### 三の章 季節(21〜30)

| # | カード | MOTIF(英語) |
|---|---|---|
| 21 | 春風 | flowing ribbons of warm wind with petals, loosening a knot of red thread |
| 22 | 桜 | a magnificent cherry tree in full bloom at night, illuminated softly |
| 23 | 新緑 | fresh young green leaves with morning dew, red thread as a vine among them |
| 24 | 七夕笹 | bamboo branches with colorful tanzaku wish papers under the Milky Way |
| 25 | 花火 | a grand firework blooming over a summer festival river |
| 26 | 月見 | tsukimi dango and pampas grass on a veranda facing the harvest moon |
| 27 | 紅葉 | crimson maple leaves drifting on a stream, gold light between them |
| 28 | 初雪 | first snow falling silently on a shrine roof, untouched white ground |
| 29 | 椿 | a single deep-red camellia flower blooming against snow |
| 30 | 梅 | plum blossoms opening on a branch while snow still remains, promise of spring |

### 四の章 こころ(31〜40)

| # | カード | MOTIF(英語) |
|---|---|---|
| 31 | 深呼吸 | gentle spirals of breath-like light rising in calm air, tranquil zen mood |
| 32 | 涙 | a single luminous teardrop becoming a small star as it falls |
| 33 | 鏡 | an ornate hand mirror reflecting soft light and a red thread heart |
| 34 | 手放し | open hands releasing glowing petals and threads into the wind |
| 35 | ゆるし | soft light breaking through clouds onto a quiet forest clearing |
| 36 | 微笑み | a warm glowing crescent shape like a gentle smile, radiating soft light |
| 37 | 休息 | a cozy sleeping cat curled on a cushion, steam from a teacup, warm lamplight |
| 38 | 勇気 | a small bird taking its first leap from a branch into the open sky |
| 39 | 素直 | a flower bud opening honestly toward the light, dew sparkling |
| 40 | 感謝 | hands gently holding a small glowing sphere of golden light |

### 五の章 みらい(41〜50)

| # | カード | MOTIF(英語) |
|---|---|---|
| 41 | 種まき | a hand scattering glowing seeds into rich dark soil under stars |
| 42 | 芽吹き | a tiny green sprout breaking through soil, roots visible below glowing |
| 43 | 蕾 | a plump flower bud about to open, first hint of color at its tip |
| 44 | 泉 | a clear spring welling up in a mossy forest, endlessly flowing |
| 45 | 舟 | a small wooden boat drifting peacefully on a starlit river, no oars |
| 46 | 扉 | a beautiful old door slightly ajar with warm light spilling out |
| 47 | 鍵 | an ornate golden key on a red thread, keyhole glowing nearby |
| 48 | 誓い | two rings connected by a red thread under a starry canopy |
| 49 | 祝福 | falling flower petals and light like confetti over a path of light |
| 50 | しあわせ | a warm golden landscape at sunset, red thread leading to a bright horizon |

## 制作の手順(おすすめ)

1. まず**1(赤い糸)・13(満月)・22(桜)・50(しあわせ)**の4枚を生成して、絵柄のトーンを確定させる(気に入るまでこの4枚で調整)
2. トーンが決まったら残り46枚を同じ設定で量産(1日10枚×5日でOK)
3. Canvaで番号・カード名を後乗せ(テンプレートを1つ作って複製)
4. 完成したら「デッキ全50枚お披露目」投稿を1本作る(これ自体がバズ企画になります)

## リールでの使い方

- **毎週のルーレットは50枚全部使わず、「今週の20枚」を章ごとに入れ替える**のがおすすめです。
  動画が長くなりすぎず(20枚×0.12秒×3周≒7秒)、毎週デッキの中身が変わるので飽きられません。
  「今週は"月と星の章"多めです🌙」のような予告がストーリーズのネタにもなります
- 番号が1〜50になるので、リール内テロップは「止まったカードの番号(1〜50)をコメントしてね」に
- 週替わりでも自動DMは50枚分すべて対応済みなので、どの番号が来ても正しく返信されます

## 自動DMをオラクルデッキに切り替える方法

デプロイ先(Render)の環境変数に1行追加するだけです:

```
DECK_FILE=cards-oracle.json
```

タロット20枚に戻す時はこの環境変数を消すだけ。両デッキを行き来できます。

## 将来の展開(フェーズ3以降のマネタイズ素材)

このデッキはそのまま商品になります:
- **紙のカードデッキ化**(印刷所で小ロット制作)→ 物販・鑑定の記念品
- **LINE登録特典**「オラクル1枚引き」の絵柄として使用
- **カード解説ミニブック**(PDF)を有料デジタルコンテンツに
