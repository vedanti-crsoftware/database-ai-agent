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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTitanEmbedding = getTitanEmbedding;
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const bedrockClient = new client_bedrock_runtime_1.BedrockRuntimeClient({ region: process.env.AWS_REGION });
function getTitanEmbedding(text) {
    return __awaiter(this, void 0, void 0, function* () {
        const input = {
            "modelId": "amazon.titan-embed-text-v2:0",
            "contentType": "application/json",
            "accept": "*/*",
            "body": JSON.stringify({ inputText: text }),
        };
        const command = new client_bedrock_runtime_1.InvokeModelCommand(input);
        const response = yield bedrockClient.send(command);
        const result = JSON.parse(Buffer.from(response.body).toString("utf8"));
        return result.embedding;
    });
}
