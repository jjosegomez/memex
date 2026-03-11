import type Database from 'better-sqlite3';
import type { SessionEvent } from '../types.js';
import { extractHeuristics } from './heuristics.js';
import { extractWithLlm, getLlmConfig } from './llm.js';
import type { HeuristicResults } from './heuristics.js';
import type { LlmExtractionResults } from './llm.js';
import { encryptContent } from '../crypto/encryption.js';
import { hashContent } from '../crypto/hash.js';
import { ulid } from '../lib/ulid.js';
import { insertMemory, findByHash } from '../db/queries.js';
import { updateSessionEnd } from '../db/session-queries.js';

/**
 * Full extraction result combining heuristics + optional LLM output.
 */
export interface ExtractionResult {
  heuristics: HeuristicResults;
  llm: LlmExtractionResults | null;
  /** Number of new memories saved */
  memories_saved: number;
  /** Number of duplicate memories skipped */
  memories_skipped: number;
  /** Whether LLM extraction was used */
  llm_used: boolean;
}

/**
 * Run the full extraction pipeline on a completed session.
 *
 * 1. Run heuristics (always, free)
 * 2. Run LLM extraction (if API key configured)
 * 3. Save extracted memories (deduped)
 * 4. Update session with summary and tags
 */
export async function runExtraction(
  db: Database.Database,
  key: Buffer,
  sessionId: string,
  project: string,
  events: SessionEvent[],
): Promise<ExtractionResult> {
  // Step 1: Heuristics (always runs)
  const heuristics = extractHeuristics(events);

  // Step 2: LLM extraction (if configured)
  let llm: LlmExtractionResults | null = null;
  const llmConfig = getLlmConfig();
  let llmUsed = false;

  if (llmConfig && events.length > 2) {
    try {
      llm = await extractWithLlm(events, heuristics, llmConfig);
      llmUsed = true;
    } catch (err) {
      // LLM failure is non-fatal — heuristics still apply
      console.error(
        `LLM extraction failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // Step 3: Save extracted memories
  let memoriesSaved = 0;
  let memoriesSkipped = 0;

  if (llm?.memories) {
    for (const memory of llm.memories) {
      // Prefix with session context
      const content = `[Session ${sessionId.slice(0, 14)}] ${memory.content}`;
      const contentHash = hashContent(content);

      // Dedup check
      const existing = findByHash(db, contentHash, project);
      if (existing) {
        memoriesSkipped++;
        continue;
      }

      const { iv, ciphertext, authTag } = encryptContent(content, key);
      const tags = [...new Set([...memory.tags, 'auto-extracted', heuristics.activity_type])];

      insertMemory(db, {
        id: ulid(),
        project,
        contentEnc: ciphertext,
        iv,
        authTag,
        tags,
        contentHash,
        content,
      });

      memoriesSaved++;
    }
  }

  // Step 4: Update session with summary and auto-tags
  const summary = llm?.summary ?? buildHeuristicSummary(heuristics);
  const { iv: sIv, ciphertext: sCiphertext, authTag: sAuthTag } = encryptContent(summary, key);

  // Merge heuristic tags with any existing tags
  const autoTags = [...new Set(heuristics.suggested_tags)];

  updateSessionEnd(db, {
    id: sessionId,
    summaryEnc: sCiphertext,
    summaryIv: sIv,
    summaryAuthTag: sAuthTag,
    tags: autoTags,
    ended_at: new Date().toISOString(),
    event_count: events.length,
  });

  return {
    heuristics,
    llm,
    memories_saved: memoriesSaved,
    memories_skipped: memoriesSkipped,
    llm_used: llmUsed,
  };
}

/**
 * Build a basic summary from heuristics alone (when LLM is unavailable).
 */
function buildHeuristicSummary(h: HeuristicResults): string {
  const parts: string[] = [];

  parts.push(`${h.activity_type} session (${h.duration_minutes ?? '?'} min)`);

  if (h.files_changed.length > 0) {
    const fileList = h.files_changed.length <= 3
      ? h.files_changed.map((f) => f.split('/').pop()).join(', ')
      : `${h.files_changed.length} files`;
    parts.push(`Modified: ${fileList}`);
  }

  if (h.tools_used.length > 0) {
    parts.push(`Tools: ${h.tools_used.join(', ')}`);
  }

  if (h.metrics.errors > 0) {
    parts.push(`${h.metrics.errors} error(s) encountered`);
  }

  return parts.join('. ') + '.';
}
