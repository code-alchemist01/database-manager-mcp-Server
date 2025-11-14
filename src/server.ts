import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

export class ProjectManagerServer {
  private server: Server;
  private tools: Map<string, any> = new Map();

  constructor() {
    this.server = new Server(
      {
        name: 'mcp-project-manager',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: Array.from(this.tools.values()),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      const tool = this.tools.get(name);
      if (!tool) {
        throw new Error(`Tool ${name} not found`);
      }

      try {
        const handler = tool.handler;
        const result = await handler(args);
        return {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'file://project-structure',
            name: 'Project Structure',
            description: 'Current project structure analysis',
            mimeType: 'application/json',
          },
          {
            uri: 'file://project-metrics',
            name: 'Project Metrics',
            description: 'Project metrics and statistics',
            mimeType: 'application/json',
          },
          {
            uri: 'file://code-analysis',
            name: 'Code Analysis',
            description: 'Code analysis results',
            mimeType: 'application/json',
          },
        ],
      };
    });

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      // For now, return placeholder data
      // This will be populated by the actual analysis tools
      if (uri === 'file://project-structure') {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({ message: 'Project structure will be populated by analysis tools' }, null, 2),
            },
          ],
        };
      }

      if (uri === 'file://project-metrics') {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({ message: 'Project metrics will be populated by analysis tools' }, null, 2),
            },
          ],
        };
      }

      if (uri === 'file://code-analysis') {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({ message: 'Code analysis will be populated by analysis tools' }, null, 2),
            },
          ],
        };
      }

      throw new Error(`Resource ${uri} not found`);
    });
  }

  public registerTool(name: string, description: string, inputSchema: any, handler: (args: any) => Promise<any>) {
    this.tools.set(name, {
      name,
      description,
      inputSchema,
      handler,
    });
  }

  public async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP Project Manager Server started');
  }
}

