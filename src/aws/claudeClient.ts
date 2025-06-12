import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import dotenv from "dotenv";
dotenv.config();

const bedrockClient = new BedrockRuntimeClient({region: process.env.AWS_REGION});

export async function getClaudeResponse(prompt: string): Promise<string> {
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
    console.log("this is the invokemodel response i.e command:", command);
    try {
        console.log("this is in try for bedrockClient.send");
        const response = await bedrockClient.send(command);
        console.log("this is after try for bedrockClient.send");
        const result = JSON.parse(Buffer.from(response.body).toString("utf8"));
        console.log("This is the entire response: ",result);
        return result.completion;
    } catch (err) {
        console.error("error", err);
        return "Error occured";
    }
    
}