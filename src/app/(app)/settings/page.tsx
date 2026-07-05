import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader, EmptyState, PageHeader, StatRow } from "@/components/ui";
import { PromptTemplateEditor } from "@/components/prompt-template-editor";
import type { PromptTemplate } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();

  const [{ data: templates }, { data: userData }] = await Promise.all([
    supabase
      .from("prompt_templates")
      .select("*")
      .order("name")
      .returns<PromptTemplate[]>(),
    supabase.auth.getUser(),
  ]);

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="設定"
        description="AIプロンプトテンプレートとアカウント情報"
      />

      <Card className="mb-6">
        <CardHeader title="アカウント・AI設定" />
        <CardBody>
          <StatRow label="ログイン中のユーザー">{userData.user?.email ?? "—"}</StatRow>
          <StatRow label="AIプロバイダ">
            {process.env.AI_PROVIDER === "openai" ? "OpenAI" : "Google Gemini(デフォルト)"}
          </StatRow>
          <StatRow label="モデル">
            {process.env.AI_PROVIDER === "openai"
              ? process.env.OPENAI_MODEL || "gpt-4o-mini(デフォルト)"
              : process.env.GEMINI_MODEL || "gemini-2.0-flash(デフォルト)"}
          </StatRow>
          <p className="mt-2 text-xs text-zinc-400">
            プロバイダは環境変数 AI_PROVIDER(gemini / openai)、モデルは GEMINI_MODEL / OPENAI_MODEL
            で変更できます。APIキーはサーバー側でのみ使用され、ブラウザには送信されません。
          </p>
        </CardBody>
      </Card>

      <div className="space-y-6">
        <h2 className="text-sm font-semibold text-zinc-700">プロンプトテンプレート</h2>
        <p className="-mt-4 text-sm text-zinc-500">
          AI分析とコンテンツ生成のプロンプトはここで編集できます。編集内容は次回のAI実行から反映されます。
        </p>
        {!templates || templates.length === 0 ? (
          <EmptyState
            title="プロンプトテンプレートがありません"
            description="supabase/seed.sql を実行するとデフォルトのテンプレートが登録されます。テンプレートが無い場合はコード内のデフォルトプロンプトが使われます。"
          />
        ) : (
          templates.map((t) => <PromptTemplateEditor key={t.id} template={t} />)
        )}
      </div>
    </div>
  );
}
