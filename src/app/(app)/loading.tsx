import { Spinner } from "@/components/ui";

export default function Loading() {
  return (
    <div className="flex h-64 items-center justify-center gap-3 text-zinc-400">
      <Spinner />
      <span className="text-sm">読み込み中…</span>
    </div>
  );
}
