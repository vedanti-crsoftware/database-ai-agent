import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ContextManager, ContextItem } from './contextParsers.js';
import { QueryService } from '../query/QueryService.js';
import { BedrockService } from '../aws/BedrockService.js';
import * as path from 'path';

export class DatabaseAIMCPServer {
  private server: Server;
  private contextManager: ContextManager;
  private queryService: QueryService;
  private bedrockService: BedrockService;
  private contextDirectory: string;

  constructor(contextDirectory: string = './context') {
    this.contextDirectory = contextDirectory;
    this.contextManager = new ContextManager();
    this.queryService = new QueryService();
    this.bedrockService = new BedrockService();
    
    this.server = new Server(
      {
        name: 'database-ai-agent',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available resources (context items)
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const contextItems = this.contextManager.getContextItems();
      
      return {
        resources: contextItems.map(item => ({
          uri: `context://${item.id}`,
          name: item.title,
          description: `${item.type.toUpperCase()} context: ${item.title}`,
          mimeType: item.type === 'excel' ? 'application/vnd.ms-excel' : 'text/sql',
        })),
      };
    });

    // Read specific resource content
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const url = new URL(request.params.uri);
      
      if (url.protocol !== 'context:') {
        throw new Error(`Unsupported protocol: ${url.protocol}`);
      }

      const contextId = url.pathname.slice(2); // Remove leading //
      const contextItem = this.contextManager.getContextById(contextId);
      
      if (!contextItem) {
        throw new Error(`Context item not found: ${contextId}`);
      }

      return {
        contents: [
          {
            uri: request.params.uri,
            mimeType: contextItem.type === 'excel' ? 'application/vnd.ms-excel' : 'text/sql',
            text: contextItem.content,
          },
        ],
      };
    });

    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'generate_sql',
            description: 'Generate SQL query from natural language using dynamic context',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Natural language query to convert to SQL',
                },
                context_search: {
                  type: 'string',
                  description: 'Optional search term to find relevant context (table names, columns, etc.)',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'execute_sql',
            description: 'Execute SQL query on the database and return results',
            inputSchema: {
              type: 'object',
              properties: {
                sql: {
                  type: 'string',
                  description: 'SQL query to execute',
                },
              },
              required: ['sql'],
            },
          },
          {
            name: 'search_context',
            description: 'Search available context items (Excel files and SQL schemas)',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search term to find relevant context',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'generate_visualization',
            description: 'Generate chart recommendation for SQL query results',
            inputSchema: {
              type: 'object',
              properties: {
                sql: {
                  type: 'string',
                  description: 'SQL query that was executed',
                },
                data: {
                  type: 'array',
                  description: 'Result data from the SQL query',
                  items: {
                    type: 'object',
                  },
                },
              },
              required: ['sql', 'data'],
            },
          },
          {
            name: 'complete_workflow',
            description: 'Complete end-to-end workflow: generate SQL, execute, and create visualization',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Natural language query to process',
                },
                context_search: {
                  type: 'string',
                  description: 'Optional search term to find relevant context',
                },
              },
              required: ['query'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'generate_sql':
            return await this.handleGenerateSQL(args);
          
          case 'execute_sql':
            return await this.handleExecuteSQL(args);
          
          case 'search_context':
            return await this.handleSearchContext(args);
          
          case 'generate_visualization':
            return await this.handleGenerateVisualization(args);
          
          case 'complete_workflow':
            return await this.handleCompleteWorkflow(args);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async handleGenerateSQL(args: any) {
    const { query, context_search } = args;
    
    // Find relevant context
    let relevantContext = '';
    if (context_search) {
      const contextItems = this.contextManager.searchContext(context_search);
      relevantContext = contextItems
        .slice(0, 3) // Limit to top 3 most relevant items
        .map(item => item.content)
        .join('\n\n---\n\n');
    } else {
      // Use semantic search with embeddings to find relevant context
      const allContextItems = this.contextManager.getContextItems();
      if (allContextItems.length > 0) {
        // For now, use the first SQL context item as default
        const sqlContexts = allContextItems.filter(item => item.type === 'sql');
        if (sqlContexts.length > 0) {
          relevantContext = sqlContexts[0].content;
        }
      }
    }

    if (!relevantContext) {
      throw new Error('No relevant context found. Please ensure Excel files or SQL schema files are available.');
    }

    // Generate SQL using the existing QueryService logic but with dynamic context
    const response = await this.queryService.handleSchemaAndQuery(relevantContext, query);
    
    return {
      content: [
        {
          type: 'text',
          text: `Generated SQL Query:\n\n\`\`\`sql\n${response.sql}\n\`\`\`\n\nContext Used:\n${relevantContext.substring(0, 500)}...`,
        },
      ],
    };
  }

  private async handleExecuteSQL(args: any) {
    const { sql } = args;
    
    try {
      const result = await this.queryService.executeQuery(sql);
      
      return {
        content: [
          {
            type: 'text',
            text: `SQL Execution Results:\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\`\n\nRows returned: ${result.length}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`SQL execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleSearchContext(args: any) {
    const { query } = args;
    
    const contextItems = this.contextManager.searchContext(query);
    
    if (contextItems.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No matching context items found.',
          },
        ],
      };
    }

    const results = contextItems.map(item => ({
      id: item.id,
      title: item.title,
      type: item.type,
      preview: item.content.substring(0, 200) + '...',
      metadata: item.metadata,
    }));

    return {
      content: [
        {
          type: 'text',
          text: `Found ${contextItems.length} matching context items:\n\n${JSON.stringify(results, null, 2)}`,
        },
      ],
    };
  }

  private async handleGenerateVisualization(args: any) {
    const { sql, data } = args;
    
    try {
      const chartRecommendation = await this.queryService.getChartRecommendation(sql, data);
      
      return {
        content: [
          {
            type: 'text',
            text: `Chart Recommendation:\n\n\`\`\`json\n${JSON.stringify(chartRecommendation, null, 2)}\n\`\`\``,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Visualization generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleCompleteWorkflow(args: any) {
    const { query, context_search } = args;
    
    try {
      // Step 1: Generate SQL
      const sqlResult = await this.handleGenerateSQL({ query, context_search });
      
      // Extract SQL from the result
      const sqlMatch = sqlResult.content[0].text.match(/```sql\n([\s\S]*?)\n```/);
      if (!sqlMatch) {
        throw new Error('Failed to extract SQL from generation result');
      }
      const sql = sqlMatch[1];
      
      // Step 2: Execute SQL
      const executeResult = await this.handleExecuteSQL({ sql });
      
      // Extract data from the result
      const dataMatch = executeResult.content[0].text.match(/```json\n([\s\S]*?)\n```/);
      if (!dataMatch) {
        throw new Error('Failed to extract data from execution result');
      }
      const data = JSON.parse(dataMatch[1]);
      
      // Step 3: Generate visualization
      const vizResult = await this.handleGenerateVisualization({ sql, data });
      
      return {
        content: [
          {
            type: 'text',
            text: `Complete Workflow Results:\n\n## Generated SQL:\n\`\`\`sql\n${sql}\n\`\`\`\n\n## Execution Results:\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n\n## Visualization Recommendation:\n${vizResult.content[0].text}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Complete workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async initialize() {
    console.log('Initializing Database AI MCP Server...');
    
    // Initialize services
    await this.queryService.initalize();
    console.log('QueryService initialized');
    
    // Load context from directory
    await this.contextManager.loadContextFromDirectory(this.contextDirectory);
    console.log(`Context loaded from ${this.contextDirectory}`);
    
    console.log('Database AI MCP Server initialized successfully');
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('Database AI MCP Server started');
  }
}

// CLI entry point
if (require.main === module) {
  const contextDir = process.argv[2] || './context';
  const server = new DatabaseAIMCPServer(contextDir);
  
  server.initialize()
    .then(() => server.start())
    .catch((error) => {
      console.error('Failed to start MCP server:', error);
      process.exit(1);
    });
} 