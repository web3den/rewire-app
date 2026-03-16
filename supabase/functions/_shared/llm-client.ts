// ============================================================
// LLM Client Abstraction
// Supports Anthropic Claude and OpenAI with automatic fallback
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
}

// Production LLM configuration per operation
export const LLM_CONFIGS: Record<string, { primary: LLMConfig; secondary: LLMConfig }> = {
  guide_conversation: {
    primary: { provider: "anthropic", model: "claude-sonnet-4-20250514", apiKey: Deno.env.get("ANTHROPIC_API_KEY") ?? "" },
    secondary: { provider: "openai", model: "gpt-4o", apiKey: Deno.env.get("OPENAI_API_KEY") ?? "" },
  },
  quest_generation: {
    primary: { provider: "anthropic", model: "claude-haiku-35", apiKey: Deno.env.get("ANTHROPIC_API_KEY") ?? "" },
    secondary: { provider: "openai", model: "gpt-4o-mini", apiKey: Deno.env.get("OPENAI_API_KEY") ?? "" },
  },
  reflection_scoring: {
    primary: { provider: "openai", model: "gpt-4o-mini", apiKey: Deno.env.get("OPENAI_API_KEY") ?? "" },
    secondary: { provider: "anthropic", model: "claude-haiku-35", apiKey: Deno.env.get("ANTHROPIC_API_KEY") ?? "" },
  },
  crisis_classification: {
    primary: { provider: "openai", model: "gpt-4o-mini", apiKey: Deno.env.get("OPENAI_API_KEY") ?? "" },
    secondary: { provider: "anthropic", model: "claude-haiku-35", apiKey: Deno.env.get("ANTHROPIC_API_KEY") ?? "" },
  },
  memory_compression: {
    primary: { provider: "openai", model: "gpt-4o-mini", apiKey: Deno.env.get("OPENAI_API_KEY") ?? "" },
    secondary: { provider: "anthropic", model: "claude-haiku-35", apiKey: Deno.env.get("ANTHROPIC_API_KEY") ?? "" },
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
    console.error(`LLM primary (${configs.primary.provider}) failed for ${operation}:`, e);
  }

  // Try secondary
  try {
    return await callProvider(configs.secondary, request);
  } catch (e) {
    console.error(`LLM secondary (${configs.secondary.provider}) failed for ${operation}:`, e);
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
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.content[0].text,
    inputTokens: data.usage.input_tokens,
    outputTokens: data.usage.output_tokens,
    provider: "anthropic",
    model: config.model,
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
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    inputTokens: data.usage.prompt_tokens,
    outputTokens: data.usage.completion_tokens,
    provider: "openai",
    model: config.model,
  };
}
