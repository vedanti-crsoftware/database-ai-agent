import dotenv from 'dotenv';
import  express, { Request, Response } from "express";
import { QueryService } from "./services/QueryService";
import { SchemaRequest } from "./types";
import bodyParser from "body-parser";


dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const  queryService = new QueryService();

(async function init() {
  try {
    console.log("Initializing QueryService...");
    await queryService.initalize();
    console.log("QueryService initialized successfully");
  } catch (err) {
    console.error("Failed to initialize QueryService:", err);
  }
})();


app.use(bodyParser.json());

app.post("/generate-sql", async (req : any, res : any) => {
    const { schema, query } = req.body;
    console.log("Received request to generate SQL");

    if(!schema || !query) {
        console.log("Missing schema or query in request");
        return res.status(400).json({ error: "Missing schema or query"});
    }

    try {
        console.log("Processing schema and query...");
        const result = await queryService.handleSchemaAndQuery(schema, query);
        console.log("SQL generation successful");
        res.json({sql: result});
    } catch (err) {
        console.error("Error generating SQL:", err);
        res.status(500).json({error: "Something went wrong"});
    }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server listening on port ${port} (local development)`);
  });
}

export default app;