import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { getDatabase } from './db/database.js';
import { getEncryptionKey } from './crypto/keys.js';
import { handleSaveMemory } from './tools/save-memory.js';
import { handleRecallMemories } from './tools/recall-memories.js';
import { handleSearchMemories } from './tools/search-memories.js';
import { handleDeleteMemory } from './tools/delete-memory.js';
import {
  SaveMemoryInput,
  RecallMemoriesInput,
  SearchMemoriesInput,
  DeleteMemoryInput,
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

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Memex MCP server started');
}
