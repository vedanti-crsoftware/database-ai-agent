import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrockClient = new BedrockRuntimeClient({region: process.env.AWS_REGION});

export async function getTitanEmbedding(text: string): Promise<number[]> {
    const input = {
    "modelId": "amazon.titan-embed-text-v2:0",
    "contentType": "application/json",
    "accept": "*/*",
    "body": JSON.stringify({inputText: text}),
    };

    const command = new InvokeModelCommand(input);
    const response = await bedrockClient.send(command);
    const result = JSON.parse(Buffer.from(response.body).toString("utf8"));
    return result.embedding;
}