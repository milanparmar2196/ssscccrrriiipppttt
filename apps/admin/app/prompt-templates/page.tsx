"use client";

import RecordLibrary from "../../components/RecordLibrary";

export default function PromptTemplatesPage() {
  return (
    <RecordLibrary
      title="Prompt Templates"
      description="One prompt template per pipeline generation stage (topics, research, bible draft, outline, script, scenes, audit areas, fix/revision, package text, optional modules 16/17, performance insights). Templates are versioned; publishing is a super-admin action and runs snapshot the version they used (Generator Profile). Named variables are validated against packages/shared — an unknown variable blocks publish at the API."
      basePath="/admin/prompt-templates"
      keyField="stage"
      columns={["stage", "name", "modelId", "status", "_version"]}
      newTemplate={{ name: "", systemPrompt: "", userPromptTemplate: "" }}
      note="Secrets and API keys are never shown or edited here — keys live only in the API server's .env. This page edits prompt text and versions only."
    />
  );
}
