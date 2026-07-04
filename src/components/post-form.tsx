"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { postFormSchema, type PostFormInput } from "@/lib/schemas";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  FieldError,
  Input,
  Label,
  Select,
  Spinner,
} from "@/components/ui";
import { POST_PLATFORM_LABELS, POST_STATUS_LABELS } from "@/lib/labels";

interface TrendOption {
  id: string;
  original_title: string;
}

interface PackageOption {
  id: string;
  trend_item_id: string;
  main_angle: string;
}

export function PostForm({
  trends,
  packages,
}: {
  trends: TrendOption[];
  packages: PackageOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PostFormInput>({
    resolver: zodResolver(postFormSchema),
    defaultValues: { platform: "instagram", post_status: "posted" },
  });

  const selectedTrendId = watch("trend_item_id");
  const availablePackages = packages.filter((p) => p.trend_item_id === selectedTrendId);

  const onSubmit = async (values: PostFormInput) => {
    setSubmitError(null);
    const supabase = createClient();

    const { error } = await supabase.from("posts").insert({
      trend_item_id: values.trend_item_id,
      content_package_id: values.content_package_id || null,
      platform: values.platform,
      post_url: values.post_url || null,
      posted_at: values.posted_at ? new Date(values.posted_at).toISOString() : null,
      post_status: values.post_status,
      hook_used: values.hook_used || null,
      format_used: values.format_used || null,
    });

    if (error) {
      setSubmitError(`保存に失敗しました: ${error.message}`);
      return;
    }

    // 投稿記録されたトレンドはステータスを posted に進める
    if (values.post_status === "posted") {
      await supabase
        .from("trend_items")
        .update({ status: "posted" })
        .eq("id", values.trend_item_id)
        .in("status", ["scripted", "editing", "approved", "analyzing", "inbox"]);
    }

    reset();
    setOpen(false);
    router.refresh();
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} disabled={trends.length === 0}>
        ＋ 投稿を記録
      </Button>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader title="投稿を記録" />
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="trend_item_id" required>
                トレンド
              </Label>
              <Select id="trend_item_id" {...register("trend_item_id")}>
                <option value="">選択してください</option>
                {trends.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.original_title}
                  </option>
                ))}
              </Select>
              <FieldError message={errors.trend_item_id?.message} />
            </div>
            <div>
              <Label htmlFor="content_package_id">コンテンツパッケージ(任意)</Label>
              <Select id="content_package_id" {...register("content_package_id")}>
                <option value="">未指定</option>
                {availablePackages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.main_angle}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="platform" required>
                投稿先
              </Label>
              <Select id="platform" {...register("platform")}>
                {Object.entries(POST_PLATFORM_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="post_status" required>
                状態
              </Label>
              <Select id="post_status" {...register("post_status")}>
                {Object.entries(POST_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="posted_at">投稿日時</Label>
              <Input id="posted_at" type="datetime-local" {...register("posted_at")} />
            </div>
          </div>

          <div>
            <Label htmlFor="post_url">投稿URL</Label>
            <Input id="post_url" placeholder="https://..." {...register("post_url")} />
            <FieldError message={errors.post_url?.message} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="hook_used">使用したフック</Label>
              <Input
                id="hook_used"
                placeholder="実際に使った冒頭フック"
                {...register("hook_used")}
              />
            </div>
            <div>
              <Label htmlFor="format_used">使用フォーマット</Label>
              <Input
                id="format_used"
                placeholder="例: 30秒解説 / カルーセル"
                {...register("format_used")}
              />
            </div>
          </div>

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner />}
              保存する
            </Button>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              閉じる
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
