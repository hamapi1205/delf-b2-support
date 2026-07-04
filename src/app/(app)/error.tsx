"use client";

import { Button } from "@/components/ui";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-4">
      <p className="text-sm font-medium text-zinc-700">エラーが発生しました</p>
      <p className="max-w-lg text-center text-sm text-zinc-500">{error.message}</p>
      <Button variant="secondary" onClick={reset}>
        再試行
      </Button>
    </div>
  );
}
