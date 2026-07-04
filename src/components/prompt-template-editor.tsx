"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Badge, Button, Card, CardBody, CardHeader, Spinner, Textarea } from "@/components/ui";
import { formatDateTime } from "@/lib/labels";
import type { PromptTemplate } from "@/lib/types";

export function PromptTemplateEditor({ template }: { template: PromptTemplate }) {
  const router = useRouter();
  const [text, setText] = useState(template.template);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const dirty = text !== template.template;

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const { error } = await createClient()
      .from("prompt_templates")
      .update({ template: text, version: template.version + 1 })
      .eq("id", template.id);
    setSaving(false);
    if (error) {
      setMessage(`保存に失敗しました: ${error.message}`);
      return;
    }
    setMessage("保存しました");
    router.refresh();
  };

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            {template.name}
            <Badge color={template.is_active ? "green" : "zinc"}>
              {template.is_active ? "有効" : "無効"}
            </Badge>
            <Badge color="zinc">v{template.version}</Badge>
          </span>
        }
        action={
          <span className="text-xs text-zinc-400">更新: {formatDateTime(template.updated_at)}</span>
        }
      />
      <CardBody className="space-y-3">
        {template.description && <p className="text-sm text-zinc-500">{template.description}</p>}
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-64 font-mono text-xs"
        />
        <p className="text-xs text-zinc-400">
          使用できるプレースホルダ: {"{{TREND_JSON}}"}
          {template.name === "generate_content_package" && <> / {"{{ANALYSIS_JSON}}"}</>}
        </p>
        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={saving || !dirty}>
            {saving && <Spinner />}
            保存(バージョンを上げる)
          </Button>
          {dirty && (
            <Button variant="secondary" onClick={() => setText(template.template)}>
              変更を破棄
            </Button>
          )}
          {message && <p className="text-sm text-zinc-500">{message}</p>}
        </div>
      </CardBody>
    </Card>
  );
}
