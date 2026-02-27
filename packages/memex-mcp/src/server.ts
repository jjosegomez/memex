import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

export async function startServer(): Promise<void> {
  const server = new McpServer({
    name: 'memex',
    version: '0.1.0',
  });

  // Tools will be registered here by implementation agents

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Memex MCP server started');
}
