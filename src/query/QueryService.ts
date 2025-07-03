import { BedrockService } from "../aws/BedrockService";
import { PostgresService } from "../db/PostgresService";
import { JSONLoader } from "../utils/jsonUtils";
import prompts from "../prompts/prompts.json";
import localPrompts from "../prompts/prompts.json";
export class QueryService {
    private bedrock: BedrockService;
    private postgres: PostgresService;
    private prompts: any = null;

    constructor() {
        this.bedrock = new BedrockService();
        this.postgres = new PostgresService();
        this.prompts = localPrompts;
    }

    async initalize() {
        console.log("trying the inialize in queryservice");
        await this.postgres.connect();
        try {
            await this.loadPromptsFromS3();
        } catch (error) {
            console.log("Could not load prompts from S3, using local prompts:", error);
            // We already initialized with local prompts, so no action needed
        }
        
        console.log("done inialize in queryservice");
    }

private async loadPromptsFromS3() {
    const bucket = process.env.CONFIG_BUCKET || 'database-agent-configs';
    
    // Update this path - the file is directly in the data/ folder, not in data/data/
    const key = 'data/prompts.json';
    
    console.log(`Attempting to load prompts from S3: ${bucket}/${key}`);
    
    try {
        const s3Prompts = await JSONLoader.loadFromS3(bucket, key);
        
        // Only update prompts if S3 load was successful
        if (s3Prompts) {
            this.prompts = s3Prompts;
            console.log("Successfully loaded prompts from S3");
        }
    } catch (error) {
        console.error(`Failed to load prompts from S3 at ${bucket}/${key}:`, error);
        // Don't throw - we'll use the fallback prompts
    }
}

    async handleSchemaAndQuery(schema: string, query: string): Promise<{sql: string, result: any[]}>  {
        
        console.log("In QueryService.. handleSchemaAndQuery");
        const schemaEmbedding = await this.bedrock.getEmbedding(schema);
        console.log("In QueryService.. this is schemaEmbedding : ", schemaEmbedding);
        await this.postgres.storeSchemaEmbedding(schema, schemaEmbedding);
        console.log("In QueryService.. storeSchemaEmbedding Successful");
        const queryEmbedding = await this.bedrock.getEmbedding(query);
        console.log("In QueryService.. this is queryEmbedding: ",queryEmbedding);
        const matchedSchema = await this.postgres.findMatchingSchema(queryEmbedding);
        console.log("In QueryService.. this is matchedSchema: ",matchedSchema);
       
        
        const promptTemplate = this.prompts.prompt;
        const prompt = promptTemplate
            .replace("{{schema}}", matchedSchema)
            .replace("{{question}}", query);
        console.log("In QueryService... this is final prompt:", prompt);
        const sql = await this.bedrock.getClaudeResponse(prompt);
         console.log("Executing generated SQL query");
        
        const result = await this.postgres.executeQuery(sql);
        console.log("SQL execution complete, returning results");
        
        return { sql, result };
    }
}