/**
 * AI model client (docs/MODEL_PROVIDERS.md): resolves the stage
 * assignment (Niche Template override -> global), then calls the
 * provider through its adapter. Keys come from server .env ONLY —
 * never from the DB, never logged. When no key/assignment exists the
 * call throws ProviderNotConfigured and the job fails cleanly.
 */
import type { PlatformStore } from "../platform/store.js";
import { getProviderModels, getProviders, getStageAssignments } from "./library.js";

export class ProviderNotConfigured extends Error {
  code = "PROVIDER_NOT_CONFIGURED";
  constructor(message: string) {
    super(message);
  }
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatResult {
  text: string;
  providerKey: string;
  modelId: string;
  tokensIn?: number;
  tokensOut?: number;
  fallbackUsed?: string;
}

type Obj = Record<string, unknown>;

const DEFAULT_BASE_URLS: Record<string, string> = {
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com/v1",
  google: "https://generativelanguage.googleapis.com/v1beta",
  xai: "https://api.x.ai/v1",
  zhipu: "https://open.bigmodel.cn/api/paas/v4",
  moonshot: "https://api.moonshot.cn/v1",
  deepseek: "https://api.deepseek.com",
  alibaba: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  xiaomi: "https://api.xiaomi.com/v1",
  minimax: "https://api.minimax.chat/v1",
};

export async function resolveAssignment(
  platform: PlatformStore,
  stage: string,
): Promise<Obj | undefined> {
  const assignments = await getStageAssignments(platform);
  return assignments.find((a) => a.stage === stage || a.recordKey === stage);
}

async function providerConfig(platform: PlatformStore, providerKey: string) {
  const providers = await getProviders(platform);
  const provider = providers.find((p) => p.key === providerKey);
  if (!provider) throw new ProviderNotConfigured(`Unknown provider: ${providerKey}`);
  const envKeyName = String(provider.envKeyName ?? "");
  const apiKey = envKeyName ? process.env[envKeyName] : undefined;
  if (!apiKey) {
    throw new ProviderNotConfigured(
      `Provider ${providerKey} has no API key configured (set ${envKeyName} in the server .env)`,
    );
  }
  const models = await getProviderModels(platform);
  const known = models.some((m) => m.providerKey === providerKey);
  void known;
  return {
    provider,
    apiKey,
    baseUrl: String(provider.baseUrl ?? DEFAULT_BASE_URLS[providerKey] ?? ""),
  };
}

async function callOpenAiCompatible(
  baseUrl: string,
  apiKey: string,
  modelId: string,
  messages: ChatMessage[],
  params: Obj,
): Promise<{ text: string; tokensIn?: number; tokensOut?: number }> {
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: modelId,
      messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? undefined,
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`Provider HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as Obj;
  const choice = (data.choices as Obj[] | undefined)?.[0];
  const text = String(((choice?.message as Obj | undefined)?.content as string) ?? "");
  const usage = data.usage as Obj | undefined;
  return {
    text,
    tokensIn: usage?.prompt_tokens as number | undefined,
    tokensOut: usage?.completion_tokens as number | undefined,
  };
}

async function callAnthropic(
  baseUrl: string,
  apiKey: string,
  modelId: string,
  messages: ChatMessage[],
  params: Obj,
): Promise<{ text: string; tokensIn?: number; tokensOut?: number }> {
  const system = messages.find((m) => m.role === "system")?.content;
  const rest = messages.filter((m) => m.role !== "system");
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: modelId,
      system,
      messages: rest.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: (params.maxTokens as number) ?? 4096,
      temperature: params.temperature ?? 0.7,
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as Obj;
  const blocks = (data.content as Obj[] | undefined) ?? [];
  const text = blocks.map((b) => String(b.text ?? "")).join("");
  const usage = data.usage as Obj | undefined;
  return {
    text,
    tokensIn: usage?.input_tokens as number | undefined,
    tokensOut: usage?.output_tokens as number | undefined,
  };
}

async function callGoogle(
  baseUrl: string,
  apiKey: string,
  modelId: string,
  messages: ChatMessage[],
  params: Obj,
): Promise<{ text: string; tokensIn?: number; tokensOut?: number }> {
  const system = messages.find((m) => m.role === "system")?.content;
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const res = await fetch(
    `${baseUrl.replace(/\/$/, "")}/models/${modelId}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        contents,
        generationConfig: { temperature: params.temperature ?? 0.7 },
      }),
      signal: AbortSignal.timeout(120_000),
    },
  );
  if (!res.ok) throw new Error(`Google HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as Obj;
  const cand = (data.candidates as Obj[] | undefined)?.[0];
  const parts = ((cand?.content as Obj | undefined)?.parts as Obj[] | undefined) ?? [];
  const usage = data.usageMetadata as Obj | undefined;
  return {
    text: parts.map((p) => String(p.text ?? "")).join(""),
    tokensIn: usage?.promptTokenCount as number | undefined,
    tokensOut: usage?.candidatesTokenCount as number | undefined,
  };
}

async function callOnce(
  platform: PlatformStore,
  providerKey: string,
  modelId: string,
  messages: ChatMessage[],
  params: Obj,
) {
  const { apiKey, baseUrl } = await providerConfig(platform, providerKey);
  if (providerKey === "anthropic") return callAnthropic(baseUrl, apiKey, modelId, messages, params);
  if (providerKey === "google") return callGoogle(baseUrl, apiKey, modelId, messages, params);
  return callOpenAiCompatible(baseUrl, apiKey, modelId, messages, params);
}

/** Chat with the stage assignment + fallback chain (MODEL_PROVIDERS §4). */
export async function chat(
  platform: PlatformStore,
  stage: string,
  messages: ChatMessage[],
  paramsOverride: Obj = {},
): Promise<ChatResult> {
  const assignment = await resolveAssignment(platform, stage);
  if (!assignment) {
    throw new ProviderNotConfigured(`No model assignment configured for stage "${stage}"`);
  }
  const params = { ...((assignment.params as Obj) ?? {}), ...paramsOverride };
  const chain: Array<{ providerKey: string; modelId: string }> = [
    { providerKey: String(assignment.providerKey ?? assignment.providerId), modelId: String(assignment.modelId) },
    ...(((assignment.fallbackChain as Obj[] | undefined) ?? []).map((f) => ({
      providerKey: String(f.providerKey ?? f.providerId),
      modelId: String(f.modelId),
    }))),
  ];
  let lastError: Error | undefined;
  for (const [i, candidate] of chain.entries()) {
    try {
      const out = await callOnce(platform, candidate.providerKey, candidate.modelId, messages, params);
      return {
        ...out,
        providerKey: candidate.providerKey,
        modelId: candidate.modelId,
        fallbackUsed: i > 0 ? `${chain[0]!.providerKey}/${chain[0]!.modelId}` : undefined,
      };
    } catch (err) {
      lastError = err as Error;
      if (err instanceof ProviderNotConfigured) throw err; // config errors don't fall back silently
    }
  }
  throw lastError ?? new Error("All models in the chain failed");
}

/** Parse a JSON object/array out of model output (fences tolerated). */
export function parseJson<T>(text: string): T {
  const cleaned = text.replace(/```(?:json)?/g, "").trim();
  const start = Math.min(
    ...["[", "{"].map((c) => {
      const i = cleaned.indexOf(c);
      return i === -1 ? Number.MAX_SAFE_INTEGER : i;
    }),
  );
  const slice = start === Number.MAX_SAFE_INTEGER ? cleaned : cleaned.slice(start);
  return JSON.parse(slice) as T;
}

export async function chatJson<T>(
  platform: PlatformStore,
  stage: string,
  messages: ChatMessage[],
  paramsOverride: Obj = {},
): Promise<{ data: T; result: ChatResult }> {
  const result = await chat(platform, stage, messages, paramsOverride);
  return { data: parseJson<T>(result.text), result };
}

/** Embeddings via the single embedding assignment (A2). */
export async function embed(
  platform: PlatformStore,
  texts: string[],
): Promise<{ vectors: number[][]; modelId: string; providerKey: string }> {
  const assignments = await getStageAssignments(platform);
  const assignment =
    assignments.find((a) => a.stage === "embedding") ??
    (await seedEmbeddingAssignment(platform));
  if (!assignment) throw new ProviderNotConfigured("No embedding assignment configured");
  const providerKey = String(assignment.providerKey ?? assignment.providerId);
  const modelId = String(assignment.modelId);
  const { apiKey, baseUrl } = await providerConfig(platform, providerKey);
  if (providerKey === "google") {
    const vectors: number[][] = [];
    for (const text of texts) {
      const res = await fetch(
        `${baseUrl.replace(/\/$/, "")}/models/${modelId}:embedContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ content: { parts: [{ text }] } }),
          signal: AbortSignal.timeout(60_000),
        },
      );
      if (!res.ok) throw new Error(`Google embed HTTP ${res.status}`);
      const data = (await res.json()) as Obj;
      vectors.push(((data.embedding as Obj)?.values as number[]) ?? []);
    }
    return { vectors, modelId, providerKey };
  }
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/embeddings`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: modelId, input: texts }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`Embeddings HTTP ${res.status}`);
  const data = (await res.json()) as Obj;
  const rows = ((data.data as Obj[] | undefined) ?? []).sort(
    (a, b) => Number(a.index) - Number(b.index),
  );
  return { vectors: rows.map((r) => (r.embedding as number[]) ?? []), modelId, providerKey };
}

async function seedEmbeddingAssignment(platform: PlatformStore): Promise<Obj | undefined> {
  void platform;
  const { seedData } = await import("./library.js");
  const all = await seedData();
  const rec = all.get("model_providers")?.records.find((r) => r.recordKey === "assignment:embedding");
  return rec?.payload as Obj | undefined;
}

/** Cosine similarity (A2 helpers). */
export function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
