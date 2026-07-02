/**
 * タロットルーレット コメント自動DM返信サーバー
 *
 * Instagram公式API(Instagram API with Instagram Login)を直接使い、
 * リールのコメント(カード番号)を検知して、そのカードの鑑定メッセージを
 * Private Reply(コメントへのDM返信)で自動送信します。
 *
 * 外部ライブラリ不要。Node.js 18以上で動作します。
 *   起動: node server.js
 */

const http = require("node:http");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

// ===== 環境変数 =====
const PORT = process.env.PORT || 3000;
// Webhook検証用に自分で決める合言葉(Meta開発者画面に同じ値を入力)
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "";
// Metaアプリの「app secret」(署名検証用)
const APP_SECRET = process.env.APP_SECRET || "";
// Instagramアクセストークン(長期トークン推奨・約60日で要更新)
const ACCESS_TOKEN = process.env.ACCESS_TOKEN || "";
// 自分のInstagramユーザーID(自分のコメントに反応しないための除外にも使用)
const IG_USER_ID = process.env.IG_USER_ID || "";
// Graph APIバージョン(Meta開発者画面の表示に合わせて更新)
const GRAPH_VERSION = process.env.GRAPH_VERSION || "v21.0";
// DMの末尾に毎回付ける文(LINE誘導など)。空なら付けない
const DM_FOOTER =
  process.env.DM_FOOTER ||
  "\n\n──────────\nもっと深く知りたいときは、プロフィールのLINEから「無料1枚引き鑑定」を受け取ってくださいね🕊";
// カード番号が読み取れなかったコメントへの公開返信(空なら何もしない)
const FALLBACK_REPLY =
  process.env.FALLBACK_REPLY ||
  "コメントありがとうございます🔮 止まったカードの「番号」を数字で送ってもらえたら、鑑定メッセージをDMでお届けします!";

const GRAPH_BASE = `https://graph.instagram.com/${GRAPH_VERSION}`;

// ===== カードデータ =====
const cards = JSON.parse(
  fs.readFileSync(path.join(__dirname, "cards.json"), "utf8"),
);

/** コメント本文からカードを特定する(番号優先、なければカード名) */
function matchCard(text) {
  if (!text) return null;
  // 全角数字→半角
  const normalized = text.replace(/[０-９]/g, (d) =>
    String.fromCharCode(d.charCodeAt(0) - 0xfee0),
  );
  const numberMatch = normalized.match(/\d{1,2}/);
  if (numberMatch) {
    const n = parseInt(numberMatch[0], 10);
    const byNumber = cards.find((c) => c.number === n);
    if (byNumber) return byNumber;
  }
  return (
    cards.find(
      (c) =>
        normalized.includes(c.name) ||
        (c.aliases || []).some((a) => normalized.includes(a)),
    ) || null
  );
}

// ===== Graph API呼び出し =====
async function graphPost(pathname, body) {
  const res = await fetch(`${GRAPH_BASE}${pathname}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`Graph API error ${res.status}:`, JSON.stringify(json));
  }
  return json;
}

/** コメントに対するDM返信(Private Reply) */
function sendPrivateReply(commentId, text) {
  return graphPost(`/${IG_USER_ID}/messages`, {
    recipient: { comment_id: commentId },
    message: { text },
  });
}

/** コメントへの公開返信 */
function sendPublicReply(commentId, text) {
  return graphPost(`/${commentId}/replies`, { message: text });
}

// ===== 重複処理防止(同じコメントIDを二度処理しない) =====
const processed = new Set();
function markProcessed(id) {
  processed.add(id);
  if (processed.size > 5000) {
    // メモリ節約のため古いものから半分捨てる
    for (const key of Array.from(processed).slice(0, 2500)) {
      processed.delete(key);
    }
  }
}

// ===== コメントイベント処理 =====
async function handleComment(value) {
  const commentId = value.id;
  const text = value.text || "";
  const fromId = value.from && value.from.id;

  if (!commentId || processed.has(commentId)) return;
  markProcessed(commentId);

  // 自分自身のコメント・自分の返信には反応しない(無限ループ防止)
  if (fromId && IG_USER_ID && String(fromId) === String(IG_USER_ID)) return;

  const card = matchCard(text);
  if (card) {
    console.log(`comment ${commentId}: matched card ${card.number} ${card.name}`);
    await sendPrivateReply(commentId, card.message + (DM_FOOTER || ""));
  } else if (FALLBACK_REPLY) {
    console.log(`comment ${commentId}: no card matched ("${text.slice(0, 30)}")`);
    await sendPublicReply(commentId, FALLBACK_REPLY);
  }
}

// ===== Webhook署名検証 =====
function isValidSignature(rawBody, signatureHeader) {
  if (!APP_SECRET) {
    console.warn("APP_SECRET未設定のため署名検証をスキップします(本番では必ず設定)");
    return true;
  }
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) return false;
  const expected =
    "sha256=" +
    crypto.createHmac("sha256", APP_SECRET).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}

// ===== HTTPサーバー =====
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // 稼働確認用
  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(`縁結びルーレット自動返信サーバー稼働中(カード${cards.length}枚)`);
    return;
  }

  // Webhook検証(Meta開発者画面で「確認」を押すと呼ばれる)
  if (req.method === "GET" && url.pathname === "/webhook") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      res.writeHead(200);
      res.end(challenge);
    } else {
      res.writeHead(403);
      res.end();
    }
    return;
  }

  // イベント受信
  if (req.method === "POST" && url.pathname === "/webhook") {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      // Metaは数秒でタイムアウト再送するため、先に200を返してから処理する
      res.writeHead(200);
      res.end("OK");

      if (!isValidSignature(raw, req.headers["x-hub-signature-256"])) {
        console.warn("署名が一致しないリクエストを破棄しました");
        return;
      }
      let body;
      try {
        body = JSON.parse(raw);
      } catch {
        return;
      }
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === "comments" && change.value) {
            handleComment(change.value).catch((e) =>
              console.error("handleComment failed:", e),
            );
          }
        }
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`listening on :${PORT} (cards: ${cards.length})`);
  for (const name of ["VERIFY_TOKEN", "ACCESS_TOKEN", "IG_USER_ID"]) {
    if (!process.env[name]) console.warn(`環境変数 ${name} が未設定です`);
  }
});
