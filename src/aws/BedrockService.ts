import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { NodeHttpHandler } from "@aws-sdk/node-http-handler";
import dotenv from "dotenv";
dotenv.config();

export class BedrockService {
    private client: BedrockRuntimeClient;

    constructor() {
        this.client = new BedrockRuntimeClient({ region: process.env.AWS_REGION, requestHandler: new NodeHttpHandler({
                connectionTimeout: 30000,  // 5 seconds to establish connection
                socketTimeout: 60000      // 60 seconds for data transfer
            })
        });
    }

    async getEmbedding(text: string): Promise<number[]> {
        console.log("In BedrockService... this is getEmbedding");
        const input = {
            "modelId": "amazon.titan-embed-text-v2:0",
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
        console.log("Hey we are in the claudeClient");
        const input = {
            "modelId": "anthropic.claude-v2:1",
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