import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { getDatabase } from './db/database.js';
import { getEncryptionKey } from './crypto/keys.js';
import { handleSaveMemory } from './tools/save-memory.js';
import { handleRecallMemories } from './tools/recall-memories.js';
import { handleSearchMemories } from './tools/search-memories.js';
import { handleDeleteMemory } from './tools/delete-memory.js';
import { handleStartSession } from './tools/start-session.js';
import { handleEndSession } from './tools/end-session.js';
import { handleRecordSessionEvent } from './tools/record-session-event.js';
import { handleListSessions } from './tools/list-sessions.js';
import { handleSearchSessions } from './tools/search-sessions.js';
import { handleGetSession } from './tools/get-session.js';
import { handleExtractSession } from './tools/extract-session.js';
import {
  SaveMemoryInput,
  RecallMemoriesInput,
  SearchMemoriesInput,
  DeleteMemoryInput,
  StartSessionInput,
  EndSessionInput,
  RecordSessionEventInput,
  ListSessionsInput,
  SearchSessionsInput,
  GetSessionInput,
  ExtractSessionInput,
} from './types.js';

export async function startServer(): Promise<void> {
  // Load encryption key at startup
  let encryptionKey: Buffer;
  try {
    encryptionKey = getEncryptionKey();
  } catch (err) {
    console.error(
      `Failed to load encryption key: ${err instanceof Error ? err.message : String(err)}`,
    );
    console.error("Run 'memex init' to set up encryption.");
    process.exit(1);
  }

  // Initialize database
  const db = getDatabase();

  const server = new McpServer({
    name: 'memex',
    version: '0.1.0',
  });

  // Register save_memory tool
  server.tool(
    'save_memory',
    'Save a memory. Stores encrypted content with optional tags, scoped to the current project.',
    SaveMemoryInput.shape,
    (params) => {
      try {
        const result = handleSaveMemory(db, encryptionKey, params);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result) }],
        };
      } catch (err) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: err instanceof Error ? err.message : String(err),
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Register recall_memories tool
  server.tool(
    'recall_memories',
    'Recall memories for the current project. Supports full-text search with BM25 ranking, tag filtering, and recent-first browsing.',
    RecallMemoriesInput.shape,
    (params) => {
      try {
        const result = handleRecallMemories(db, encryptionKey, params);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result) }],
        };
      } catch (err) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: err instanceof Error ? err.message : String(err),
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Register search_memories tool
  server.tool(
    'search_memories',
    'Search memories across ALL projects. Use this when you need cross-project context.',
    SearchMemoriesInput.shape,
    (params) => {
      try {
        const result = handleSearchMemories(db, encryptionKey, params);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result) }],
        };
      } catch (err) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: err instanceof Error ? err.message : String(err),
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Register delete_memory tool
  server.tool(
    'delete_memory',
    'Delete a memory by ID (soft delete, can be purged later).',
    DeleteMemoryInput.shape,
    (params) => {
      try {
        const result = handleDeleteMemory(db, params);
        if (!result.deleted) {
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(result) }],
            isError: true,
          };
        }
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result) }],
        };
      } catch (err) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: err instanceof Error ? err.message : String(err),
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Register start_session tool
  server.tool(
    'start_session',
    'Start a new session to record agent activity. Returns a session ID for subsequent event recording.',
    StartSessionInput.shape,
    (params) => {
      try {
        const result = handleStartSession(db, encryptionKey, params);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result) }],
        };
      } catch (err) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: err instanceof Error ? err.message : String(err),
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Register end_session tool
  server.tool(
    'end_session',
    'End an active session with optional summary. Finalizes the session and records event count.',
    EndSessionInput.shape,
    (params) => {
      try {
        const result = handleEndSession(db, encryptionKey, params);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result) }],
        };
      } catch (err) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: err instanceof Error ? err.message : String(err),
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Register record_session_event tool
  server.tool(
    'record_session_event',
    'Record a tool call, message, error, or decision to an active session.',
    RecordSessionEventInput.shape,
    (params) => {
      try {
        const result = handleRecordSessionEvent(db, encryptionKey, params);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result) }],
        };
      } catch (err) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: err instanceof Error ? err.message : String(err),
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Register list_sessions tool
  server.tool(
    'list_sessions',
    'List recorded sessions with optional filters for project, agent, status, and tags.',
    ListSessionsInput.shape,
    (params) => {
      try {
        const result = handleListSessions(db, encryptionKey, params);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result) }],
        };
      } catch (err) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: err instanceof Error ? err.message : String(err),
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Register search_sessions tool
  server.tool(
    'search_sessions',
    'Full-text search across session event content. Returns matching events with context.',
    SearchSessionsInput.shape,
    (params) => {
      try {
        const result = handleSearchSessions(db, encryptionKey, params);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result) }],
        };
      } catch (err) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: err instanceof Error ? err.message : String(err),
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Register get_session tool
  server.tool(
    'get_session',
    'Retrieve a session with its events. Supports event type filtering and pagination.',
    GetSessionInput.shape,
    (params) => {
      try {
        const result = handleGetSession(db, encryptionKey, params);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result) }],
        };
      } catch (err) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: err instanceof Error ? err.message : String(err),
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Register extract_session tool
  server.tool(
    'extract_session',
    'Extract insights from a recorded session using heuristics and optional LLM analysis. Saves durable knowledge as memories and generates a session summary.',
    ExtractSessionInput.shape,
    async (params) => {
      try {
        const result = await handleExtractSession(db, encryptionKey, params);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result) }],
        };
      } catch (err) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: err instanceof Error ? err.message : String(err),
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Auto-sync AI tool config files (silent, non-blocking)
  try {
    const { autoSyncConfigs } = await import('./lib/auto-sync.js');
    autoSyncConfigs(db, encryptionKey);
  } catch {
    // Don't block server startup if auto-sync fails
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Memex MCP server started');
}
