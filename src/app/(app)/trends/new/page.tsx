"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { trendIntakeSchema, type TrendIntakeInput } from "@/lib/schemas";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  FieldError,
  Input,
  Label,
  PageHeader,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import { CATEGORY_LABELS, PLATFORM_LABELS } from "@/lib/labels";

export default function TrendIntakePage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TrendIntakeInput>({
    resolver: zodResolver(trendIntakeSchema),
    defaultValues: { source_platform: "tiktok", category: "ai" },
  });

  const onSubmit = async (values: TrendIntakeInput) => {
    setSubmitError(null);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("trend_items")
      .insert({
        source_url: values.source_url,
        source_platform: values.source_platform,
        source_country: values.source_country || null,
        source_language: values.source_language || null,
        original_title: values.original_title,
        original_description: values.original_description || null,
        creator_name: values.creator_name || null,
        published_at: values.published_at ? new Date(values.published_at).toISOString() : null,
        views_count: values.views_count ?? null,
        likes_count: values.likes_count ?? null,
        comments_count: values.comments_count ?? null,
        shares_count: values.shares_count ?? null,
        saves_count: values.saves_count ?? null,
        category: values.category,
        user_memo: values.user_memo || null,
      })
      .select("id")
      .single();

    if (error || !data) {
      setSubmitError(`登録に失敗しました: ${error?.message ?? "不明なエラー"}`);
      return;
    }

    router.push(`/trends/${data.id}`);
    router.refresh();
  };

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="トレンド登録"
        description="海外でバズっているネタの情報を手入力で登録します。登録後にAI分析を実行できます。"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader title="元コンテンツ情報" />
          <CardBody className="space-y-4">
            <div>
              <Label htmlFor="source_url" required>
                元URL
              </Label>
              <Input
                id="source_url"
                placeholder="https://www.tiktok.com/@user/video/..."
                {...register("source_url")}
              />
              <FieldError message={errors.source_url?.message} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="source_platform" required>
                  プラットフォーム
                </Label>
                <Select id="source_platform" {...register("source_platform")}>
                  {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="category" required>
                  カテゴリ
                </Label>
                <Select id="category" {...register("category")}>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="original_title" required>
                元タイトル
              </Label>
              <Input
                id="original_title"
                placeholder="元動画・投稿のタイトルや冒頭文"
                {...register("original_title")}
              />
              <FieldError message={errors.original_title?.message} />
            </div>

            <div>
              <Label htmlFor="original_description">元の説明文・内容メモ</Label>
              <Textarea
                id="original_description"
                placeholder="どんな内容か、何が起きているかを日本語または原文でメモ"
                {...register("original_description")}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="creator_name">クリエイター名</Label>
                <Input id="creator_name" placeholder="@creator" {...register("creator_name")} />
              </div>
              <div>
                <Label htmlFor="source_country">国</Label>
                <Input id="source_country" placeholder="US" {...register("source_country")} />
              </div>
              <div>
                <Label htmlFor="source_language">言語</Label>
                <Input id="source_language" placeholder="en" {...register("source_language")} />
              </div>
            </div>

            <div>
              <Label htmlFor="published_at">元投稿日</Label>
              <Input id="published_at" type="date" {...register("published_at")} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="海外での数値(わかる範囲でOK)" />
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-5">
              {(
                [
                  ["views_count", "再生数"],
                  ["likes_count", "いいね"],
                  ["comments_count", "コメント"],
                  ["shares_count", "シェア"],
                  ["saves_count", "保存"],
                ] as const
              ).map(([field, label]) => (
                <div key={field}>
                  <Label htmlFor={field}>{label}</Label>
                  <Input
                    id={field}
                    type="number"
                    min={0}
                    placeholder="0"
                    {...register(field, {
                      setValueAs: (v) =>
                        v === "" || v === null || Number.isNaN(Number(v)) ? null : Number(v),
                    })}
                  />
                  <FieldError message={errors[field]?.message} />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="自分用メモ" />
          <CardBody>
            <Textarea
              placeholder="なぜ気になったか、日本向けの切り口の仮説など"
              {...register("user_memo")}
            />
          </CardBody>
        </Card>

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner />}
            登録する
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            キャンセル
          </Button>
        </div>
      </form>
    </div>
  );
}
