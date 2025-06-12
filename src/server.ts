import dotenv from 'dotenv';
import express from "express";
import { QueryService } from "./services/QueryService";
import { SchemaRequest } from "./types";
import bodyParser from "body-parser";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const  queryService = new QueryService();

app.use(bodyParser.json());

app.post("/generate-sql", async (req : any, res : any) => {
    const { schema, query } : SchemaRequest = req.body;

    if(!schema || !query) {
        return res.status(400).json({ error: "Missing schema or query"});
    }

    try {
        const result = await queryService.handleSchemaAndQuery(schema, query);
        res.json({sql: result});
    } catch (err) {
        res.status(500).json({error: "Something went wrong"});
    }
});

app.listen(port, async() => {
    await queryService.initalize();
    console.log(`Server listening on port ${port}`);
});
