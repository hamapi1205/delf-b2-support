"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Select, Spinner } from "@/components/ui";
import { STATUS_LABELS } from "@/lib/labels";
import type { TrendStatus } from "@/lib/types";

export function AnalyzeButton({ trendId, hasAnalysis }: { trendId: string; hasAnalysis: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);

  const run = async () => {
    setLoading(true);
    setError(null);
    setDemo(false);
    try {
      const res = await fetch("/api/analyze-trend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trend_item_id: trendId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "分析に失敗しました");
      if (json.demo) setDemo(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "分析に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={run} disabled={loading}>
        {loading && <Spinner />}
        {loading ? "AI分析中…(30秒ほどかかります)" : hasAnalysis ? "AI分析を再実行" : "AI分析を実行"}
      </Button>
      {demo && (
        <p className="max-w-xs text-right text-xs text-amber-600">
          ⚠ デモモードのサンプル出力です。本物のAI分析には GOOGLE_API_KEY を設定してください。
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function GeneratePackageButton({
  trendId,
  analysisId,
}: {
  trendId: string;
  analysisId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    setWarning(null);
    try {
      const res = await fetch("/api/generate-content-package", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trend_item_id: trendId, analysis_id: analysisId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "生成に失敗しました");
      if (json.demo) {
        setWarning(
          "デモモードのサンプル出力です。本物のAI生成には GOOGLE_API_KEY を設定してください。",
        );
      } else if (json.warning) {
        setWarning(json.warning);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={run} disabled={loading} variant="secondary">
        {loading && <Spinner />}
        {loading ? "生成中…(30秒ほどかかります)" : "コンテンツパッケージを生成"}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {warning && <p className="max-w-sm text-right text-xs text-amber-600">⚠ {warning}</p>}
    </div>
  );
}

export function StatusSelect({
  trendId,
  currentStatus,
}: {
  trendId: string;
  currentStatus: TrendStatus;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value as TrendStatus;
    setSaving(true);
    setError(null);
    const { error: updateError } = await createClient()
      .from("trend_items")
      .update({ status })
      .eq("id", trendId);
    setSaving(false);
    if (updateError) {
      setError(`更新に失敗しました: ${updateError.message}`);
      return;
    }
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        defaultValue={currentStatus}
        onChange={handleChange}
        disabled={saving}
        className="w-40"
      >
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      {saving && <Spinner className="text-zinc-400" />}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
