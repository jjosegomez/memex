import fs from 'node:fs';
import { getDatabase, closeDatabase } from '../db/database.js';
import { getEncryptionKey } from '../crypto/keys.js';
import { encryptContent, decryptContent } from '../crypto/encryption.js';
import { resolveProject } from '../lib/project.js';
import { ulid } from '../lib/ulid.js';
import {
  listSessions,
  getSessionById,
  getSessionEvents,
  getEventCount,
  searchSessionContent,
  getSessionEventById,
  insertSessionBatch,
} from '../db/session-queries.js';
import { ingestSessions } from '../sync/ingest.js';
import type { SessionAdapter } from '../adapters/types.js';

const EVENT_TYPE_LABELS: Record<string, string> = {
  message_user: 'USER',
  message_agent: 'AGENT',
  tool_call: 'TOOL',
  tool_result: 'RESULT',
  error: 'ERROR',
  warning: 'WARN',
  decision: 'DECISION',
};

/**
 * memex sessions list
 */
export async function listSessionsCli(opts: Record<string, string>): Promise<void> {
  const db = getDatabase();
  const key = getEncryptionKey();
  const limit = parseInt(opts['limit'] || '20', 10);

  const rows = listSessions(db, {
    project: opts['project'],
    agent_source: opts['agent'],
    status: (opts['status'] as 'active' | 'ended' | 'all') || 'all',
    limit,
    offset: 0,
  });

  if (rows.length === 0) {
    console.log('No sessions found.');
    closeDatabase();
    return;
  }

  const idW = 14;
  const dateW = 18;
  const agentW = 12;
  const evtW = 6;
  const tagsW = 20;
  const titleW = 30;

  console.log(
    `${'ID'.padEnd(idW)}  ${'Started'.padEnd(dateW)}  ${'Agent'.padEnd(agentW)}  ${'Evts'.padEnd(evtW)}  ${'Tags'.padEnd(tagsW)}  ${'Title'.padEnd(titleW)}`,
  );
  console.log('-'.repeat(idW + dateW + agentW + evtW + tagsW + titleW + 10));

  for (const row of rows) {
    const tags = JSON.parse(row.tags) as string[];
    const tagsStr = tags.join(',').slice(0, tagsW);
    const titleStr = (row.title || '').slice(0, titleW);
    const started = new Date(row.started_at);
    const dateStr = `${started.getFullYear()}-${String(started.getMonth() + 1).padStart(2, '0')}-${String(started.getDate()).padStart(2, '0')} ${String(started.getHours()).padStart(2, '0')}:${String(started.getMinutes()).padStart(2, '0')}`;
    const evtCount = row.ended_at ? String(row.event_count) : String(getEventCount(db, row.id));

    console.log(
      `${row.id.slice(0, idW).padEnd(idW)}  ${dateStr.padEnd(dateW)}  ${row.agent_source.padEnd(agentW)}  ${evtCount.padEnd(evtW)}  ${tagsStr.padEnd(tagsW)}  ${titleStr}`,
    );
  }

  closeDatabase();
}

/**
 * memex sessions search <query>
 */
export async function searchSessionsCli(
  query: string,
  opts: Record<string, string>,
): Promise<void> {
  const db = getDatabase();
  const key = getEncryptionKey();
  const limit = parseInt(opts['limit'] || '10', 10);

  const ftsResults = searchSessionContent(db, {
    query,
    project: opts['project'],
    limit,
  });

  if (ftsResults.length === 0) {
    console.log('No results found.');
    closeDatabase();
    return;
  }

  console.log(`Found ${ftsResults.length} results:\n`);

  for (const hit of ftsResults) {
    const eventRow = getSessionEventById(db, hit.event_id);
    if (!eventRow) continue;

    const content = decryptContent(
      eventRow.content_enc as unknown as Buffer,
      eventRow.iv as unknown as Buffer,
      eventRow.auth_tag as unknown as Buffer,
      key,
    );

    const session = getSessionById(db, hit.session_id);
    const snippet = content.replace(/\n/g, ' ').slice(0, 80);
    const rank = Math.abs(hit.rank).toFixed(2);
    const title = session?.title || '(untitled)';

    console.log(`[${rank}] ${hit.event_id.slice(0, 14)}  ${title.slice(0, 20).padEnd(20)}  ${snippet}`);
  }

  closeDatabase();
}

/**
 * memex sessions show <id>
 */
export async function showSession(
  id: string,
  opts: Record<string, string>,
): Promise<void> {
  const db = getDatabase();
  const key = getEncryptionKey();

  const session = getSessionById(db, id);
  if (!session) {
    console.log(`Session not found: ${id}`);
    closeDatabase();
    return;
  }

  const limit = parseInt(opts['limit'] || '100', 10);
  const eventTypes = opts['type'] ? opts['type'].split(',') : undefined;

  // Header
  console.log(`Session: ${session.id}`);
  console.log(`Project: ${session.project}`);
  console.log(`Agent:   ${session.agent_source}`);
  console.log(`Started: ${session.started_at}`);
  console.log(`Ended:   ${session.ended_at || '(active)'}`);

  const evtCount = session.ended_at ? session.event_count : getEventCount(db, session.id);
  console.log(`Events:  ${evtCount}`);

  const tags = JSON.parse(session.tags) as string[];
  console.log(`Tags:    ${tags.join(', ') || '(none)'}`);

  if (session.summary_enc && session.summary_iv && session.summary_auth_tag) {
    const summary = decryptContent(
      session.summary_enc as unknown as Buffer,
      session.summary_iv as unknown as Buffer,
      session.summary_auth_tag as unknown as Buffer,
      key,
    );
    console.log(`Summary: ${summary}`);
  }

  console.log('');
  console.log('Timeline:');
  console.log('\u2500'.repeat(60));

  const eventRows = getSessionEvents(db, {
    session_id: id,
    event_types: eventTypes,
    limit,
    offset: 0,
  });

  for (const evt of eventRows) {
    const content = decryptContent(
      evt.content_enc as unknown as Buffer,
      evt.iv as unknown as Buffer,
      evt.auth_tag as unknown as Buffer,
      key,
    );

    const time = new Date(evt.timestamp);
    const timeStr = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}:${String(time.getSeconds()).padStart(2, '0')}`;
    const label = (EVENT_TYPE_LABELS[evt.event_type] || evt.event_type).padEnd(8);
    const preview = content.replace(/\n/g, ' ').slice(0, 120);

    console.log(`[${timeStr}] ${label} ${preview}`);
  }

  closeDatabase();
}

/**
 * memex sessions import <file>
 */
export async function importSession(
  file: string,
  opts: Record<string, string>,
): Promise<void> {
  const raw = fs.readFileSync(file, 'utf8');
  const agentSource = opts['agent'] || 'generic';

  let adapter: SessionAdapter;
  if (agentSource === 'claude-code') {
    const { parseClaudeCodeTranscript } = await import('../adapters/claude-code.js');
    adapter = parseClaudeCodeTranscript;
  } else {
    const { parseJsonlTranscript } = await import('../adapters/jsonl.js');
    adapter = parseJsonlTranscript;
  }

  const parsed = adapter(raw);

  const db = getDatabase();
  const key = getEncryptionKey();
  const project = resolveProject();
  const sessionId = ulid();

  const encryptedEvents = parsed.events.map((evt) => {
    const { iv, ciphertext, authTag } = encryptContent(evt.content, key);
    return {
      id: ulid(),
      sequence: evt.sequence,
      event_type: evt.event_type,
      timestamp: evt.timestamp,
      duration_ms: evt.duration_ms,
      contentEnc: ciphertext,
      iv,
      authTag,
      metadata: evt.metadata,
      agent_source: parsed.agent_source,
      content: evt.content,
    };
  });

  let summaryEnc: Buffer | undefined;
  let summaryIv: Buffer | undefined;
  let summaryAuthTag: Buffer | undefined;

  if (parsed.summary) {
    const enc = encryptContent(parsed.summary, key);
    summaryEnc = enc.ciphertext;
    summaryIv = enc.iv;
    summaryAuthTag = enc.authTag;
  }

  insertSessionBatch(
    db,
    {
      id: sessionId,
      project,
      agent_source: parsed.agent_source,
      title: parsed.title,
      tags: parsed.tags,
      started_at: parsed.started_at,
      ended_at: parsed.ended_at,
      summaryEnc,
      summaryIv,
      summaryAuthTag,
    },
    encryptedEvents,
  );

  console.log(`Imported session with ${parsed.events.length} events from ${parsed.agent_source}`);
  console.log(`Session ID: ${sessionId}`);

  closeDatabase();
}

/**
 * memex sessions extract <id>
 */
export async function extractSession(id: string): Promise<void> {
  const db = getDatabase();
  const key = getEncryptionKey();

  const session = getSessionById(db, id);
  if (!session) {
    console.log(`Session not found: ${id}`);
    closeDatabase();
    return;
  }

  // Fetch and decrypt all events
  const eventRows = getSessionEvents(db, {
    session_id: id,
    limit: 1000,
    offset: 0,
  });

  const events = eventRows.map((evt) => {
    const content = decryptContent(
      evt.content_enc as unknown as Buffer,
      evt.iv as unknown as Buffer,
      evt.auth_tag as unknown as Buffer,
      key,
    );
    return {
      id: evt.id,
      session_id: evt.session_id,
      sequence: evt.sequence,
      event_type: evt.event_type as import('../types.js').SessionEventTypeValue,
      timestamp: evt.timestamp,
      duration_ms: evt.duration_ms,
      content,
      metadata: evt.metadata ? JSON.parse(evt.metadata) as Record<string, unknown> : null,
      agent_source: evt.agent_source,
    };
  });

  console.log(`Extracting insights from session ${id.slice(0, 14)}...`);
  console.log(`Events: ${events.length}`);
  console.log('');

  const { runExtraction } = await import('../extraction/pipeline.js');
  const result = await runExtraction(db, key, id, session.project, events);

  // Display heuristics
  console.log('Heuristics:');
  console.log(`  Activity:  ${result.heuristics.activity_type}`);
  console.log(`  Duration:  ${result.heuristics.duration_minutes ?? '?'} min`);
  console.log(`  Files:     ${result.heuristics.files_changed.length > 0 ? result.heuristics.files_changed.map((f) => f.split('/').pop()).join(', ') : '(none)'}`);
  console.log(`  Tools:     ${result.heuristics.tools_used.join(', ') || '(none)'}`);
  console.log(`  Tags:      ${result.heuristics.suggested_tags.join(', ')}`);
  console.log(`  Errors:    ${result.heuristics.metrics.errors}`);
  console.log('');

  // Display LLM results if available
  if (result.llm_used && result.llm) {
    console.log('LLM Extraction:');
    console.log(`  Summary:   ${result.llm.summary}`);
    console.log(`  Memories:  ${result.memories_saved} saved, ${result.memories_skipped} skipped`);
    if (result.llm.handoff) {
      console.log(`  Handoff:   ${result.llm.handoff}`);
    }
    if (result.llm.memories.length > 0) {
      console.log('');
      console.log('  Extracted memories:');
      for (const m of result.llm.memories) {
        console.log(`    - [${m.tags.join(',')}] ${m.content.slice(0, 100)}`);
      }
    }
  } else {
    console.log('LLM: skipped (set ANTHROPIC_API_KEY to enable)');
    console.log(`  Summary:   ${result.heuristics.activity_type} session`);
  }

  closeDatabase();
}

/**
 * memex sessions ingest
 */
export async function ingestSessionsCli(opts: Record<string, string>): Promise<void> {
  const db = getDatabase();
  const key = getEncryptionKey();
  const dryRun = opts['dryRun'] === 'true' || opts['dry-run'] === 'true';

  console.log(dryRun ? 'Dry run — scanning for sessions...' : 'Ingesting sessions...');
  console.log('');

  const result = ingestSessions(db, key, {
    agent: opts['agent'],
    project: opts['project'],
    dry_run: dryRun,
  });

  console.log(`Found:    ${result.found} session files`);
  console.log(`Imported: ${result.imported}`);
  console.log(`Skipped:  ${result.skipped} (already imported)`);
  console.log(`Failed:   ${result.failed}`);

  if (result.sessions.length > 0) {
    console.log('');
    console.log('Imported sessions:');
    for (const s of result.sessions) {
      const fileName = s.file.split('/').pop();
      console.log(`  ${s.session_id.slice(0, 14)}  ${String(s.events).padEnd(4)} events  ${fileName}`);
    }
  }

  if (result.errors.length > 0) {
    console.log('');
    console.log('Errors:');
    for (const e of result.errors) {
      const fileName = e.file.split('/').pop();
      console.log(`  ${fileName}: ${e.error}`);
    }
  }

  closeDatabase();
}

/**
 * memex sessions context
 */
export async function showContext(opts: Record<string, string>): Promise<void> {
  const db = getDatabase();
  const key = getEncryptionKey();

  const { handleGetSessionContext } = await import('../tools/get-session-context.js');
  const limit = parseInt(opts['limit'] || '5', 10);
  const context = handleGetSessionContext(db, key, {
    project: opts['project'],
    limit,
  });

  console.log(`Project: ${context.project}`);
  console.log('');

  if (context.recent_sessions.length === 0) {
    console.log('No recent sessions found. Run "memex sessions ingest" to import agent sessions.');
    closeDatabase();
    return;
  }

  console.log('Recent Sessions:');
  for (const s of context.recent_sessions) {
    const title = s.title ? s.title.slice(0, 50) : '(untitled)';
    const summary = s.summary ? s.summary.slice(0, 80) : '';
    const started = new Date(s.started_at);
    const dateStr = `${started.getFullYear()}-${String(started.getMonth() + 1).padStart(2, '0')}-${String(started.getDate()).padStart(2, '0')}`;
    console.log(`  [${dateStr}] ${s.activity_type.padEnd(10)} ${title}`);
    if (summary) {
      console.log(`             ${summary}`);
    }
    if (s.files_changed.length > 0) {
      console.log(`             Files: ${s.files_changed.map((f) => f.split('/').pop()).join(', ')}`);
    }
  }

  if (context.last_handoff) {
    console.log('');
    console.log('Last Handoff:');
    console.log(`  ${context.last_handoff}`);
  }

  if (context.recently_modified_files.length > 0) {
    console.log('');
    console.log('Recently Modified Files:');
    for (const f of context.recently_modified_files.slice(0, 10)) {
      console.log(`  ${f}`);
    }
  }

  if (context.relevant_memories.length > 0) {
    console.log('');
    console.log('Relevant Memories:');
    for (const m of context.relevant_memories) {
      const tags = m.tags.length > 0 ? `[${m.tags.join(',')}] ` : '';
      console.log(`  ${tags}${m.content.replace(/\n/g, ' ').slice(0, 80)}`);
    }
  }

  closeDatabase();
}
