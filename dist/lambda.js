"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const serverless_express_1 = __importDefault(require("@codegenie/serverless-express"));
const server_1 = __importDefault(require("./server"));
exports.handler = (0, serverless_express_1.default)({ app: server_1.default });
