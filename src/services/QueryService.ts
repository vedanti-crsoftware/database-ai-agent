import { BedrockService } from "../aws/BedrockService";
import { PostgresService } from "../db/PostgresService";
import prompts from "../prompts/prompts.json";

export class QueryService {
    private bedrock: BedrockService;
    private postgres: PostgresService;

    constructor() {
        this.bedrock = new BedrockService();
        this.postgres = new PostgresService();
    }

    async initalize() {
        await this.postgres.connect();
    }
    
    async handleSchemaAndQuery(schema: string, query: string): Promise<string> {
        const schemaEmbedding = await this.bedrock.getEmbedding(schema);
        await this.postgres.storeSchemaEmbedding(schema, schemaEmbedding);

        const queryEmbedding = await this.bedrock.getEmbedding(query);
        const matchedSchema = await this.postgres.findMatchingSchema(queryEmbedding);

        const promptTemplate = prompts.generateSQL;
        const prompt = promptTemplate
            .replace("{{schema}}", matchedSchema)
            .replace("{{question}}", query);
        const sql = await this.bedrock.getClaudeResponse(prompt);
        return sql
    }
}