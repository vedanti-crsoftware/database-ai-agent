"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BedrockService = void 0;
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class BedrockService {
    constructor() {
        this.client = new client_bedrock_runtime_1.BedrockRuntimeClient({ region: process.env.AWS_REGION });
    }
    getEmbedding(text) {
        return __awaiter(this, void 0, void 0, function* () {
            const input = {
                "modelId": "amazon.titan-embed-text-v2:0",
                "contentType": "application/json",
                "accept": "*/*",
                "body": JSON.stringify({ inputText: text }),
            };
            const command = new client_bedrock_runtime_1.InvokeModelCommand(input);
            const response = yield this.client.send(command);
            const result = JSON.parse(Buffer.from(response.body).toString("utf8"));
            return result.embedding;
        });
    }
    getClaudeResponse(prompt) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Hey we are in the claudeClient");
            const input = {
                "modelId": "anthropic.claude-v2:1",
                "contentType": "application/json",
                "accept": "*/*",
                "body": JSON.stringify({
                    prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
                    max_tokens_to_sample: 512,
                    temperature: 0.5,
                }),
            };
            const command = new client_bedrock_runtime_1.InvokeModelCommand(input);
            const response = yield this.client.send(command);
            const result = JSON.parse(Buffer.from(response.body).toString("utf8"));
            console.log("This is the entire response: ", result);
            return result.completion;
        });
    }
}
exports.BedrockService = BedrockService;
