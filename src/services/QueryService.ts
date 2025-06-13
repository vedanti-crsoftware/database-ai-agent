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
        console.log("trying the inialize in queryservice");
        await this.postgres.connect();
        console.log("done inialize in queryservice");
    }
    
    async handleSchemaAndQuery(schema: string, query: string): Promise<string> {
        console.log("In QueryService.. handleSchemaAndQuery");
        const schemaEmbedding = await this.bedrock.getEmbedding(schema);
        console.log("In QueryService.. this is schemaEmbedding : ", schemaEmbedding);
        await this.postgres.storeSchemaEmbedding(schema, schemaEmbedding);
        console.log("In QueryService.. storeSchemaEmbedding Successful");
        const queryEmbedding = await this.bedrock.getEmbedding(query);
        console.log("In QueryService.. this is queryEmbedding: ",queryEmbedding);
        const matchedSchema = await this.postgres.findMatchingSchema(queryEmbedding);
        console.log("In QueryService.. this is matchedSchema: ",matchedSchema);
       
        
        const promptTemplate = prompts.generateSQL;
        const prompt = promptTemplate
            .replace("{{schema}}", matchedSchema)
            .replace("{{question}}", query);
        console.log("In QueryService... this is final prompt:", prompt);
        const sql = await this.bedrock.getClaudeResponse(prompt);
        return sql
    }
}