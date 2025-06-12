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
exports.getClaudeResponse = getClaudeResponse;
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const bedrockClient = new client_bedrock_runtime_1.BedrockRuntimeClient({ region: process.env.AWS_REGION });
function getClaudeResponse(prompt) {
    return __awaiter(this, void 0, void 0, function* () {
        const input = {
            "modelId": "anthropic.claude-v2:1",
            "contentType": "application/json",
            "accept": "*/*",
            "body": JSON.stringify({
                prompt,
                max_tokens_to_sample: 512,
                temperature: 0.5,
            }),
        };
        const command = new client_bedrock_runtime_1.InvokeModelCommand(input);
        try {
            const response = yield bedrockClient.send(command);
            const result = JSON.parse(Buffer.from(response.body).toString("utf8"));
            return result.completion;
        }
        catch (err) {
            console.error("error", err);
            return "Error occured";
        }
    });
}
