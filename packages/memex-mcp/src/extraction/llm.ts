import type { SessionEvent } from '../types.js';
import type { HeuristicResults } from './heuristics.js';

/**
 * LLM extraction results — deeper insights that require language understanding.
 */
export interface LlmExtractionResults {
  /** Concise session summary (what happened, what was achieved) */
  summary: string;
  /** Durable knowledge extracted as standalone memories */
  memories: Array<{
    content: string;
    tags: string[];
  }>;
  /** Handoff note for the next session */
  handoff: string;
}

/**
 * Configuration for the LLM extraction layer.
 */
export interface LlmConfig {
  /** Anthropic API key */
  api_key: string;
  /** Model to use (default: claude-haiku-4-5-20251001) */
  model?: string;
  /** Max tokens for the response */
  max_tokens?: number;
}

/**
 * Get LLM config from environment. Returns null if not configured.
 */
export function getLlmConfig(): LlmConfig | null {
  const apiKey = process.env['ANTHROPIC_API_KEY'] ?? process.env['MEMEX_API_KEY'];
  if (!apiKey) return null;

  return {
    api_key: apiKey,
    model: process.env['MEMEX_MODEL'] ?? 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
  };
}

/**
 * Compress session events into a transcript suitable for LLM input.
 * Keeps it concise to minimize token usage.
 */
function compressEventsForLlm(events: SessionEvent[], maxChars = 15000): string {
  const lines: string[] = [];
  let totalChars = 0;

  for (const event of events) {
    // Skip tool_result events (usually verbose output)
    if (event.event_type === 'tool_result') continue;

    const label = event.event_type.replace('message_', '').toUpperCase();
    let content = event.content.replace(/\n/g, ' ').slice(0, 300);

    // For tool calls, just show tool name + brief input
    if (event.event_type === 'tool_call' && event.metadata?.['tool_name']) {
      const toolName = event.metadata['tool_name'] as string;
      const toolInput = event.metadata['tool_input'] as Record<string, unknown> | undefined;
      const brief = toolInput
        ? Object.entries(toolInput).map(([k, v]) => `${k}=${String(v).slice(0, 80)}`).join(', ')
        : '';
      content = `${toolName}(${brief.slice(0, 200)})`;
    }

    const line = `[${label}] ${content}`;

    if (totalChars + line.length > maxChars) break;
    lines.push(line);
    totalChars += line.length;
  }

  return lines.join('\n');
}

/**
 * Build the extraction prompt.
 */
function buildPrompt(
  transcript: string,
  heuristics: HeuristicResults,
): string {
  return `You are analyzing a coding session transcript. Extract useful information for future reference.

## Session Metadata
- Activity type: ${heuristics.activity_type}
- Duration: ${heuristics.duration_minutes ?? 'unknown'} minutes
- Files changed: ${heuristics.files_changed.join(', ') || 'none'}
- Tools used: ${heuristics.tools_used.join(', ') || 'none'}
- Errors: ${heuristics.metrics.errors}

## Transcript
${transcript}

## Instructions
Respond with valid JSON only (no markdown, no code fences). Use this exact structure:

{
  "summary": "2-3 sentence summary of what happened and what was achieved",
  "memories": [
    {
      "content": "A specific, standalone piece of knowledge worth remembering (architecture decision, bug pattern, API detail, convention established, etc.)",
      "tags": ["relevant", "tags"]
    }
  ],
  "handoff": "Brief note for the next session: what was in progress, any blockers, suggested next steps"
}

Rules for memories:
- Only extract DURABLE knowledge — things useful beyond this session
- Each memory should be self-contained (understandable without the session context)
- Skip trivial observations (e.g., "user asked to build X")
- Focus on: decisions with rationale, patterns discovered, API quirks, architecture choices, bug causes
- 0-5 memories per session (don't force it if there's nothing worth saving)`;
}

/**
 * Call the Anthropic API to extract insights from a session.
 * Uses fetch directly — no SDK dependency.
 */
export async function extractWithLlm(
  events: SessionEvent[],
  heuristics: HeuristicResults,
  config: LlmConfig,
): Promise<LlmExtractionResults> {
  const transcript = compressEventsForLlm(events);
  const prompt = buildPrompt(transcript, heuristics);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.api_key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model ?? 'claude-haiku-4-5-20251001',
      max_tokens: config.max_tokens ?? 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
  }

  const data = await response.json() as {
    content: Array<{ type: string; text?: string }>;
  };

  const textBlock = data.content.find((b) => b.type === 'text');
  if (!textBlock?.text) {
    throw new Error('No text response from Anthropic API');
  }

  // Parse JSON response
  const parsed = JSON.parse(textBlock.text) as {
    summary?: string;
    memories?: Array<{ content?: string; tags?: string[] }>;
    handoff?: string;
  };

  return {
    summary: parsed.summary ?? 'No summary generated.',
    memories: (parsed.memories ?? [])
      .filter((m): m is { content: string; tags: string[] } =>
        typeof m.content === 'string' && m.content.length > 0)
      .map((m) => ({
        content: m.content,
        tags: Array.isArray(m.tags) ? m.tags.filter((t): t is string => typeof t === 'string') : [],
      })),
    handoff: parsed.handoff ?? '',
  };
}
