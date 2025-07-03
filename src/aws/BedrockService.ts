import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { NodeHttpHandler } from "@aws-sdk/node-http-handler";
import { JSONLoader } from "../utils/jsonUtils";
import dotenv from "dotenv";
dotenv.config();

export class BedrockService {
    private client: BedrockRuntimeClient;
    private modelConfig: any = null;

    constructor() {
        this.client = new BedrockRuntimeClient({ 
                region: process.env.AWS_REGION, 
                requestHandler: new NodeHttpHandler({
                connectionTimeout: 60000,  
                socketTimeout: 90000      
            })
        });
    }

    async loadModelConfig() {
    if (!this.modelConfig) {
        const bucket = process.env.CONFIG_BUCKET || 'database-agent-configs';
        
        // Update this path to point to config.json in the data/ folder
        const key = 'data/config.json';
        
        try {
            const config = await JSONLoader.loadFromS3(bucket, key);
            this.modelConfig = config;
            console.log("Model configuration loaded successfully");
        } catch (error) {
            console.error("Failed to load model configuration:", error);
            // Set default configuration as fallback
            this.modelConfig = {
                embedding_model: "amazon.titan-embed-text-v2:0",
                models: {
                    model_id: "anthropic.claude-v2:1"
                }
            };
            console.log("Using default model configuration");
        }
    }
}

    async getEmbedding(text: string): Promise<number[]> {
        await this.loadModelConfig();

        console.log("In BedrockService... this is getEmbedding");
        const input = {
            "modelId": this.modelConfig.embedding_model || "amazon.titan-embed-text-v2:0",
            "contentType": "application/json",
            "accept": "*/*",
            "body": JSON.stringify({inputText: text}),
            };
        const command = new InvokeModelCommand(input);
        const response = await this.client.send(command);
        const result = JSON.parse(Buffer.from(response.body).toString("utf8"));
        return result.embedding;        
    }

    async getClaudeResponse(prompt: string): Promise<string> {
        await this.loadModelConfig();
        console.log("Hey we are in the claudeClient");
        const input = {
            "modelId": this.modelConfig.model.model_id || "anthropic.claude-v2:1",
            "contentType": "application/json",
            "accept": "*/*",
            "body": JSON.stringify({
                prompt:`\n\nHuman: ${prompt}\n\nAssistant:`,
                max_tokens_to_sample: 512,
                temperature: 0.5,
                }),
            };
        const command = new InvokeModelCommand(input);
        const response = await this.client.send(command);   
        const result = JSON.parse(Buffer.from(response.body).toString("utf8"));
        console.log("This is the entire response: ",result);
        return result.completion; 
        }
}