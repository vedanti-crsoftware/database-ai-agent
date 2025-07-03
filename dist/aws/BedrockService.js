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
const node_http_handler_1 = require("@aws-sdk/node-http-handler");
const jsonUtils_1 = require("../utils/jsonUtils");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class BedrockService {
    constructor() {
        this.modelConfig = null;
        this.client = new client_bedrock_runtime_1.BedrockRuntimeClient({
            region: process.env.AWS_REGION,
            requestHandler: new node_http_handler_1.NodeHttpHandler({
                connectionTimeout: 60000,
                socketTimeout: 90000
            })
        });
    }
    loadModelConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.modelConfig) {
                const bucket = process.env.CONFIG_BUCKET || 'database-agent-configs';
                // Update this path to point to config.json in the data/ folder
                const key = 'data/config.json';
                try {
                    const config = yield jsonUtils_1.JSONLoader.loadFromS3(bucket, key);
                    this.modelConfig = config;
                    console.log("Model configuration loaded successfully");
                }
                catch (error) {
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
        });
    }
    getEmbedding(text) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadModelConfig();
            console.log("In BedrockService... this is getEmbedding");
            const input = {
                "modelId": this.modelConfig.embedding_model || "amazon.titan-embed-text-v2:0",
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
            yield this.loadModelConfig();
            console.log("Hey we are in the claudeClient");
            const input = {
                "modelId": this.modelConfig.model.model_id || "anthropic.claude-v2:1",
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
