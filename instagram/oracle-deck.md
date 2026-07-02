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
Tarot-style oracle card illustration, 〔COMPOSITION〕, golden age tarot aesthetic,
deep navy and midnight blue background with gold leaf accents, intricate geometric
border pattern in gold and silver, mystical and classical mood, silhouettes or
back views of figures, a glowing red thread of fate woven into the composition,
ornate renaissance-inspired decorative elements, soft luminous lighting, vertical
4:5 card, detailed illustration style, no text, no visible faces
```

〔COMPOSITION〕を下の表から差し替えて生成 → **番号(特大)とカード名をCanvaで後乗せ**します。
文字を後乗せにするのは、誤字防止と「高速回転でもスクショで番号が読める」ため。番号は上部に画面幅の1/3くらいの大きさで。

### 一の章 ご縁(1〜10)

| # | カード | COMPOSITION(英語) |
|---|---|---|
| 1 | 赤い糸 | two women's hands facing each other, connected by a glowing red thread in the center, ornate gold circular mandala frame around them, dark mystical background |
| 2 | 結び目 | a woman's silhouette tying an intricate red thread knot with both hands, elegant gold filigree border, contemplative pose |
| 3 | はじまりの風 | woman's back view, hair flowing in wind, stepping onto a garden path, early spring flowers blooming, soft golden light ahead |
| 4 | 再会 | two silhouettes of women facing each other, reaching hands toward center, gap between them closing, warm golden glow where hands nearly touch |
| 5 | 約束 | two women's hands in pinky promise gesture, red thread weaving through their intertwined fingers, starry background above |
| 6 | 手紙 | woman's hands writing with an ornate pen on aged parchment, red ribbon and wax seal, glowing letters rising from the page |
| 7 | 鈴の音 | woman's hand holding up a golden shrine bell, concentric rings of light emanating outward, mystical golden aura |
| 8 | 橋 | two silhouettes on an ornate arched bridge meeting in center, red thread wrapped along bridge railings, starlit river below |
| 9 | 灯籠 | woman lighting a stone lantern, warm golden light spreading outward in geometric patterns, garden shrine setting |
| 10 | 鳥居 | woman's silhouette walking through a vermilion torii gate, sacred path ahead, spiritual light surrounding the gateway |

### 二の章 月と星(11〜20)

| # | カード | COMPOSITION(英語) |
|---|---|---|
| 11 | 新月 | woman kneeling in prayer pose facing a new moon, moonless sky filled with stars, protective circular aura of light |
| 12 | 三日月 | delicate crescent moon gently cradling a woman's silhouette like a hammock, peaceful sleeping pose |
| 13 | 満月 | woman standing with arms raised toward a luminous full moon, golden rays touching her fingertips, powerful upright stance |
| 14 | 月光 | woman sleeping peacefully on a veranda, moonlight rays falling protectively across her form, serene composition |
| 15 | 流れ星 | woman gazing upward with wonder, bright shooting star streaking across sky, her reaching hand echoing the star's trajectory |
| 16 | 北極星 | woman's silhouette pointing toward one bright polar star, compass rose geometry below, constellations rotating around the center star |
| 17 | 天の川 | two women standing on opposite banks of the Milky Way river, red thread stretching between them across the star-bridge |
| 18 | 夜明け | woman with arms spread wide facing the pre-dawn horizon, transition from deep navy to pale gold, moment of awakening |
| 19 | 朝日 | woman opening her eyes, warm rising sun illuminating her face (back view), golden rays filling the entire composition |
| 20 | 虹 | woman standing with arms open toward a full rainbow, rain still falling, joyful uplifted posture, light rays through clouds |

### 三の章 季節(21〜30)

| # | カード | COMPOSITION(英語) |
|---|---|---|
| 21 | 春風 | woman's back view with long flowing hair in wind, ribbons and petals swirling around her, a knotted red thread unraveling in the breeze |
| 22 | 桜 | woman standing beneath a magnificent cherry tree in full nighttime bloom, illuminated softly by inner light, blossoms falling |
| 23 | 新緑 | woman's hand reaching toward fresh green leaves, morning dew sparkling, red thread woven among sprouting branches |
| 24 | 七夕笹 | woman hanging colorful tanzaku wish papers on bamboo branches, Milky Way visible above, sacred ritual moment |
| 25 | 花火 | woman watching a grand firework burst overhead, reflected in water below, arms raised in joy and wonder |
| 26 | 月見 | woman sitting on a veranda with tsukimi dango, pampas grass beside her, harvest moon visible in frame, meditative pose |
| 27 | 紅葉 | woman's hands catching falling crimson maple leaves, stream flowing below, gold light between the leaves |
| 28 | 初雪 | woman standing on shrine roof watching first snow fall silently, untouched white ground below, peaceful solitude |
| 29 | 椿 | woman's hand gently touching a single deep-red camellia blooming against white snow, delicate strength |
| 30 | 梅 | woman gazing at plum blossoms opening on a branch, snow still visible on ground, promise of spring in her posture |

### 四の章 こころ(31〜40)

| # | カード | COMPOSITION(英語) |
|---|---|---|
| 31 | 深呼吸 | woman in meditation pose with gentle spirals of breath-like light rising from her, centered calm composition, zen temple setting |
| 32 | 涙 | woman's profile as a single luminous teardrop falls from her cheek, transforming into a star mid-fall, poignant beauty |
| 33 | 鏡 | woman holding an ornate mirror, red thread heart visible in the reflection, discovering her own beauty |
| 34 | 手放し | woman's open hands releasing glowing petals and threads upward into wind, liberation gesture, empty hands ready for new things |
| 35 | ゆるし | woman standing in a quiet forest clearing with soft light breaking through clouds above, peaceful acceptance |
| 36 | 微笑み | woman's back view with a warm glowing smile, radiating soft golden light outward, gentle expression |
| 37 | 休息 | woman sleeping peacefully on cushions, warm lamplight glowing, steam from teacup nearby, safe and cozy sanctuary |
| 38 | 勇気 | woman in silhouette taking a leap from a high branch into open sky, moment of brave action, determined posture |
| 39 | 素直 | woman opening like a flower toward light, dew sparkling on her form, vulnerable but radiant honesty |
| 40 | 感謝 | woman's hands gently cradling a glowing golden sphere of light, grateful reverent pose, treasure held in palms |

### 五の章 みらい(41〜50)

| # | カード | COMPOSITION(英語) |
|---|---|---|
| 41 | 種まき | woman's hand scattering glowing seeds into rich dark soil, starlight illuminating the moment, sacred planting ritual |
| 42 | 芽吹き | tiny green sprout breaking through dark soil, woman's hand guiding it, roots glowing below, miracle of growth |
| 43 | 蕾 | woman's hand cradling a plump flower bud about to open, first hint of color at its tip, anticipation in the pose |
| 44 | 泉 | woman kneeling by a clear spring welling up in mossy forest, hands cupping endless flowing water, abundance |
| 45 | 舟 | woman sitting peacefully in a small wooden boat drifting on starlit river, no oars, trusting the current, surrender |
| 46 | 扉 | woman standing before an ornate old door slightly ajar, warm golden light spilling out, moment before entering |
| 47 | 鍵 | woman's hand holding an ornate golden key on a red thread, matching keyhole glowing nearby, power and permission |
| 48 | 誓い | two women's hands with rings connected by a red thread under a starry canopy, eternal promise gesture |
| 49 | 祝福 | woman with arms raised as flower petals and light fall like confetti around her, celebration path of golden light |
| 50 | しあわせ | woman standing in a warm golden landscape at sunset, red thread leading to bright horizon, complete fulfillment |

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
