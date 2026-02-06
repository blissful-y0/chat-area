import { NextResponse } from "next/server"
import { listProviders } from "@/lib/llm/registry"
import { getRequiredUserId } from "@/lib/auth/session"

const PROVIDER_MODELS: Record<string, Array<{ id: string; name: string; contextLength: number }>> = {
  openai: [
    { id: "gpt-4o", name: "GPT-4o", contextLength: 128000 },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", contextLength: 128000 },
    { id: "gpt-4-turbo", name: "GPT-4 Turbo", contextLength: 128000 },
    { id: "gpt-4", name: "GPT-4", contextLength: 8192 },
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", contextLength: 16385 },
    { id: "o1", name: "o1", contextLength: 200000 },
    { id: "o1-mini", name: "o1 Mini", contextLength: 128000 },
    { id: "o3-mini", name: "o3 Mini", contextLength: 200000 },
  ],
  anthropic: [
    { id: "claude-opus-4-20250514", name: "Claude Opus 4", contextLength: 200000 },
    { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", contextLength: 200000 },
    { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", contextLength: 200000 },
    { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", contextLength: 200000 },
    { id: "claude-3-opus-20240229", name: "Claude 3 Opus", contextLength: 200000 },
  ],
  google: [
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", contextLength: 1048576 },
    { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash Lite", contextLength: 1048576 },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", contextLength: 2097152 },
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", contextLength: 1048576 },
  ],
  ollama: [
    { id: "llama3.3", name: "Llama 3.3", contextLength: 128000 },
    { id: "llama3.1", name: "Llama 3.1", contextLength: 128000 },
    { id: "qwen2.5", name: "Qwen 2.5", contextLength: 128000 },
    { id: "mistral", name: "Mistral", contextLength: 32000 },
    { id: "codestral", name: "Codestral", contextLength: 32000 },
  ],
  openrouter: [
    { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4", contextLength: 200000 },
    { id: "openai/gpt-4o", name: "GPT-4o", contextLength: 128000 },
    { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash", contextLength: 1048576 },
    { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B", contextLength: 128000 },
    { id: "deepseek/deepseek-chat", name: "DeepSeek V3", contextLength: 64000 },
    { id: "deepseek/deepseek-r1", name: "DeepSeek R1", contextLength: 64000 },
  ],
}

export async function GET() {
  try {
    await getRequiredUserId()

    const providers = listProviders().map((p) => ({
      id: p.id,
      name: p.name,
      models: PROVIDER_MODELS[p.id] ?? [],
    }))

    return NextResponse.json({ success: true, data: providers })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch providers" },
      { status: 500 }
    )
  }
}
