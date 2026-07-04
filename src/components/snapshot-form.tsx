"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { snapshotFormSchema, type SnapshotFormInput } from "@/lib/schemas";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  FieldError,
  Input,
  Label,
  Spinner,
  Textarea,
} from "@/components/ui";

const COUNT_FIELDS = [
  ["views_count", "再生数"],
  ["likes_count", "いいね"],
  ["comments_count", "コメント"],
  ["shares_count", "シェア"],
  ["saves_count", "保存"],
  ["follows_count", "フォロー増"],
  ["profile_clicks", "プロフィール遷移"],
  ["link_clicks", "リンククリック"],
] as const;

export function SnapshotForm({ postId }: { postId: string }) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SnapshotFormInput>({
    resolver: zodResolver(snapshotFormSchema),
    defaultValues: { post_id: postId },
  });

  const onSubmit = async (values: SnapshotFormInput) => {
    setSubmitError(null);
    const supabase = createClient();

    const { error } = await supabase.from("performance_snapshots").insert({
      post_id: postId,
      captured_at: values.captured_at ? new Date(values.captured_at).toISOString() : new Date().toISOString(),
      views_count: values.views_count,
      likes_count: values.likes_count,
      comments_count: values.comments_count,
      shares_count: values.shares_count,
      saves_count: values.saves_count,
      follows_count: values.follows_count,
      profile_clicks: values.profile_clicks,
      link_clicks: values.link_clicks,
      notes: values.notes || null,
    });

    if (error) {
      setSubmitError(`保存に失敗しました: ${error.message}`);
      return;
    }

    reset({ post_id: postId });
    router.refresh();
  };

  return (
    <Card>
      <CardHeader title="数値を記録(スナップショット追加)" />
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="captured_at">計測日時(未入力なら現在時刻)</Label>
            <Input id="captured_at" type="datetime-local" {...register("captured_at")} />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {COUNT_FIELDS.map(([field, label]) => (
              <div key={field}>
                <Label htmlFor={field}>{label}</Label>
                <Input
                  id={field}
                  type="number"
                  min={0}
                  placeholder="0"
                  {...register(field, {
                    setValueAs: (v) => (v === "" || v === null ? 0 : Number(v)),
                  })}
                />
                <FieldError message={errors[field]?.message} />
              </div>
            ))}
          </div>

          <div>
            <Label htmlFor="notes">メモ</Label>
            <Textarea
              id="notes"
              placeholder="気づき(伸びた理由の仮説、コメント欄の反応など)"
              {...register("notes")}
            />
          </div>

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner />}
            記録する
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
