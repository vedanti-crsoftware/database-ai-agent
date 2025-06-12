import { getTitanEmbedding } from "../aws/bedrockClient";
import { pgClient } from "../db/pg";

export async function storeSchemaEmbedding(schemaText: string) {
    console.log("this is storeSchemaEmbedding");
    console.log("this is schemaText: ", schemaText);
    console.log("schemaText length",schemaText.length);
    console.log("this is type of schemaText",typeof(schemaText));
    
    const embedding = await getTitanEmbedding(schemaText);
    // console.log("this is embedding: ",embedding);
    // console.log("isArray?", Array.isArray(embedding));
    // console.log("embedding length",embedding.length);
    // console.log("type of embedding[0]",typeof embedding[0]);
    
    //console.log("embedding slice: ",embedding.slice(0,5));
    if(!Array.isArray(embedding) || typeof embedding[0] !== "number"){
        throw new Error("Embedding must be array of numbers");
    }
    const vectorLiteral = `[${embedding.join(',')}]`;
  //  console.log("this is vectorLiteral: ",vectorLiteral);
    

        //console.log("in try... pgClient.query");
        await pgClient.query(
            `INSERT INTO schema_embeddings (schema_text, embedding) VALUES ($1, $2::vector)`,
            [schemaText, vectorLiteral]
        );
        console.log("after try... pgClient.query");
    
}