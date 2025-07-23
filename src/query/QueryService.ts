import { BedrockService } from "../aws/BedrockService";
import { PostgresService } from "../db/PostgresService";
import { JSONLoader } from "../utils/jsonUtils";
import fs from 'fs';
import path from 'path';
import prompts from "../prompts/prompts.json";
import localPrompts from "../data/prompts.json";
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
    
        const key = 'data/prompts.json';
        
        console.log(`Attempting to load prompts from S3: ${bucket}/${key}`);
        
        try {
            const s3Prompts = await JSONLoader.loadFromS3(bucket, key);
            
           
            if (s3Prompts) {
                this.prompts = s3Prompts;
                console.log("Successfully loaded prompts from S3");
            }
        } catch (error) {
            console.error(`Failed to load prompts from S3 at ${bucket}/${key}:`, error);
            
        }
    }

    async handleSchemaAndQuery(schema: string, query: string): Promise<{sql: string, result: any[], chartRecommendation?: any}>  {
        
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
        
        try {
            const chartRecommendation = await this.getChartRecommendation(sql, result);
            console.log("Chart recommendation generated successfully");
            return { sql, result, chartRecommendation };
        } catch (error) {
            console.error("Error generating chart recommendation:", error);
            return { sql, result };
        }
    }

    async executeQuery(sql: string): Promise<any[]> {
        return await this.postgres.executeQuery(sql);
    }
    
    async getChartRecommendation(sql: string, data: any[]): Promise<any> {
        try {
            
            const promptTemplate = this.prompts.chartRecommendationPrompt;
            
            
            const prompt = promptTemplate
            .replace("{{sql}}", sql)
            .replace("{{data}}", JSON.stringify(data, null, 2));
            
      
            const response = await this.bedrock.getClaudeResponse(prompt);
            
          
            return this.extractJsonFromResponse(response);
        } catch (error) {
            console.error("Failed to generate chart recommendation:", error);
            throw new Error("Failed to generate chart recommendation");
        }
    }

    private extractJsonFromResponse(response: string): any {
        try {
            
            return JSON.parse(response);
        } catch (e) {
            
            const jsonMatch = response.match(/({[\s\S]*})/);
            if (jsonMatch && jsonMatch[0]) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (err) {
                throw new Error("Could not extract valid JSON from response");
            }
            }
            throw new Error("No valid JSON found in response");
        }
    }
}