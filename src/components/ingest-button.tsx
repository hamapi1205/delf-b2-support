"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Spinner } from "@/components/ui";
import type { IngestResult } from "@/lib/ingest";

export function IngestButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/ingest-trends", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "取得に失敗しました");
      const r = json.result as IngestResult;
      setMessage(
        `取得 ${r.fetched}件 / 新規 ${r.inserted}件 / 重複スキップ ${r.skipped_duplicates}件 / AI分析済み ${r.analyzed}件` +
          (r.analyze_errors.length > 0 ? `(分析エラー ${r.analyze_errors.length}件)` : ""),
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="secondary" onClick={run} disabled={loading}>
        {loading && <Spinner />}
        {loading ? "取得・分析中…(1〜2分かかります)" : "🔄 海外トレンドを自動取得"}
      </Button>
      {message && <p className="text-xs text-zinc-500">{message}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
