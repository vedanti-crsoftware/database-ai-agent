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
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const QueryService_1 = require("./services/QueryService");
const body_parser_1 = __importDefault(require("body-parser"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
const queryService = new QueryService_1.QueryService();
(function init() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("Initializing QueryService...");
            yield queryService.initalize();
            console.log("QueryService initialized successfully");
        }
        catch (err) {
            console.error("Failed to initialize QueryService:", err);
        }
    });
})();
app.use(body_parser_1.default.json());
app.post("/generate-sql", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { schema, query } = req.body;
    console.log("Received request to generate SQL");
    if (!schema || !query) {
        console.log("Missing schema or query in request");
        return res.status(400).json({ error: "Missing schema or query" });
    }
    try {
        console.log("Processing schema and query...");
        const result = yield queryService.handleSchemaAndQuery(schema, query);
        console.log("SQL generation successful");
        res.json({ sql: result });
    }
    catch (err) {
        console.error("Error generating SQL:", err);
        res.status(500).json({ error: "Something went wrong" });
    }
}));
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server listening on port ${port} (local development)`);
    });
}
exports.default = app;
