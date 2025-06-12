import { getTitanEmbedding } from "../aws/bedrockClient";
import { pgClient } from "../db/pg";
import { getClaudeResponse } from "../aws/claudeClient";

export async function generateSQLFromQuery(naturalQuery: string): Promise<string> {
    const queryEmbedding = await getTitanEmbedding(naturalQuery);
    console.log("hey we are in generatesql query");
    const formattedEmbedding = `[${queryEmbedding.join(",")}]`;
    try {
        console.log("this is the try for vector similarity search");
        const result = await pgClient.query(
            "SELECT schema_text FROM schema_embeddings ORDER BY embedding <-> $1::vector LIMIT 1;",
            [formattedEmbedding]
        );
        
        console.log("this is the try after pgclient query for vector similarity search");

        const matchedSchema = result.rows[0]?.schema_text;
        console.log("this is matchedSchema",matchedSchema);
        const prompt = `Considering the schema provided: ${matchedSchema}. \n\nAnswer the following question using SQL: Question: "${naturalQuery}" . Your SQL query should retrieve the requested information without any additional characters or spaces. Remove any delimiter if present like \\n or newline character. Please ensure the query is formatted correctly and only includes the necessary components. End with semicolon`;

        console.log("this is before calling the getClaudeResponse");
        const generatedSQL = await getClaudeResponse(prompt);
        
        console.log("this is after calling the getClaudeResponse");
        return generatedSQL;
    } catch(error) {
        console.log("we got error in generateSQLQuery ->", error);
        return "Error !!!!!";
    }
}