// ============================================================
// LLM Client Abstraction
// Supports Anthropic Claude and OpenAI with automatic fallback.
// Includes token counting estimation and cost tracking.
// ============================================================

export interface LLMConfig {
  provider: "anthropic" | "openai";
  model: string;
  apiKey: string;
}

export interface LLMRequest {
  systemPrompt: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens: number;
  temperature?: number;
}

export interface LLMResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  provider: string;
  model: string;
  costUsd: number;
}

// Cost per 1M tokens (input / output) — updated 2026-03
const TOKEN_COSTS: Record<string, { input: number; output: number }> = {
  "claude-haiku-4-5-20251001": { input: 0.80, output: 4.00 },
  "claude-haiku-4-5": { input: 0.80, output: 4.00 },
  "claude-sonnet-4-20250514": { input: 3.00, output: 15.00 },
  "gpt-4o": { input: 2.50, output: 10.00 },
  "gpt-4o-mini": { input: 0.15, output: 0.60 },
};

function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const costs = TOKEN_COSTS[model];
  if (!costs) return 0;
  return (inputTokens * costs.input + outputTokens * costs.output) / 1_000_000;
}

// Rough token count estimation (~4 chars per token for English text)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Production LLM configuration per operation
// Guide conversation uses Haiku for cost control
export const LLM_CONFIGS: Record<string, { primary: LLMConfig; secondary: LLMConfig }> = {
  guide_conversation: {
    primary: { provider: "anthropic", model: "claude-haiku-4-5-20251001", apiKey: Deno.env.get("ANTHROPIC_API_KEY") ?? "" },
    secondary: { provider: "openai", model: "gpt-4o-mini", apiKey: Deno.env.get("OPENAI_API_KEY") ?? "" },
  },
  quest_generation: {
    primary: { provider: "anthropic", model: "claude-haiku-4-5-20251001", apiKey: Deno.env.get("ANTHROPIC_API_KEY") ?? "" },
    secondary: { provider: "openai", model: "gpt-4o-mini", apiKey: Deno.env.get("OPENAI_API_KEY") ?? "" },
  },
  reflection_scoring: {
    primary: { provider: "openai", model: "gpt-4o-mini", apiKey: Deno.env.get("OPENAI_API_KEY") ?? "" },
    secondary: { provider: "anthropic", model: "claude-haiku-4-5-20251001", apiKey: Deno.env.get("ANTHROPIC_API_KEY") ?? "" },
  },
  crisis_classification: {
    primary: { provider: "openai", model: "gpt-4o-mini", apiKey: Deno.env.get("OPENAI_API_KEY") ?? "" },
    secondary: { provider: "anthropic", model: "claude-haiku-4-5-20251001", apiKey: Deno.env.get("ANTHROPIC_API_KEY") ?? "" },
  },
  memory_compression: {
    primary: { provider: "openai", model: "gpt-4o-mini", apiKey: Deno.env.get("OPENAI_API_KEY") ?? "" },
    secondary: { provider: "anthropic", model: "claude-haiku-4-5-20251001", apiKey: Deno.env.get("ANTHROPIC_API_KEY") ?? "" },
  },
};

// Call an LLM provider with automatic primary → secondary fallback
export async function callLLM(
  operation: string,
  request: LLMRequest,
): Promise<LLMResponse> {
  const configs = LLM_CONFIGS[operation];
  if (!configs) throw new Error(`Unknown LLM operation: ${operation}`);

  // Try primary
  try {
    return await callProvider(configs.primary, request);
  } catch (e) {
    console.error(`LLM primary (${configs.primary.provider}/${configs.primary.model}) failed for ${operation}:`, e);
  }

  // Try secondary
  try {
    return await callProvider(configs.secondary, request);
  } catch (e) {
    console.error(`LLM secondary (${configs.secondary.provider}/${configs.secondary.model}) failed for ${operation}:`, e);
    throw new Error(`All LLM providers failed for ${operation}`);
  }
}

async function callProvider(config: LLMConfig, request: LLMRequest): Promise<LLMResponse> {
  if (config.provider === "anthropic") {
    return callAnthropic(config, request);
  } else {
    return callOpenAI(config, request);
  }
}

async function callAnthropic(config: LLMConfig, request: LLMRequest): Promise<LLMResponse> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: request.maxTokens,
      temperature: request.temperature ?? 0.7,
      system: request.systemPrompt,
      messages: request.messages,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Anthropic API error: ${response.status} — ${body}`);
  }

  const data = await response.json();
  const inputTokens = data.usage.input_tokens;
  const outputTokens = data.usage.output_tokens;

  return {
    content: data.content[0].text,
    inputTokens,
    outputTokens,
    provider: "anthropic",
    model: config.model,
    costUsd: estimateCost(config.model, inputTokens, outputTokens),
  };
}

async function callOpenAI(config: LLMConfig, request: LLMRequest): Promise<LLMResponse> {
  const messages = [
    { role: "system" as const, content: request.systemPrompt },
    ...request.messages,
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: request.maxTokens,
      temperature: request.temperature ?? 0.7,
      messages,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI API error: ${response.status} — ${body}`);
  }

  const data = await response.json();
  const inputTokens = data.usage.prompt_tokens;
  const outputTokens = data.usage.completion_tokens;

  return {
    content: data.choices[0].message.content,
    inputTokens,
    outputTokens,
    provider: "openai",
    model: config.model,
    costUsd: estimateCost(config.model, inputTokens, outputTokens),
  };
}

// Log LLM cost to the llm_cost_log table (fire-and-forget)
export async function logLLMCost(
  supabase: { from: (table: string) => any },
  userId: string,
  operation: string,
  response: LLMResponse,
): Promise<void> {
  try {
    await supabase.from("llm_cost_log").insert({
      user_id: userId,
      operation,
      provider: response.provider,
      model: response.model,
      input_tokens: response.inputTokens,
      output_tokens: response.outputTokens,
      cost_usd: response.costUsd,
    });
  } catch (e) {
    // Non-blocking — don't fail the request over logging
    console.error("Failed to log LLM cost:", e);
  }
}
