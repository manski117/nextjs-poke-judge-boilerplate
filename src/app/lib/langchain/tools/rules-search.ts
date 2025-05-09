import { StructuredTool } from 'langchain/tools';
import { z } from 'zod';
import { getVectorStore } from '../../../lib/vector-store/store';

export class RulesSearchTool extends StructuredTool {
  name = 'rules-search';
  description = `Search through the Pokemon TCG rules and judge calls database. 
This tool takes a string query and performs a semantic search on the vector embeddings of rules documents.
Use this tool when the user asks about game rules, card interactions, tournament rulings, or judge calls.`;
  schema = z.object({
    query: z.string().describe('The search query about Pokemon TCG rules or rulings'),
  });

  constructor() {
    super();
  }

  async _call({ query }: z.infer<typeof this.schema>) {
    try {
      // Get the vector store
      const vectorStore = await getVectorStore();
      
      // Perform a similarity search
      const results = await vectorStore.similaritySearch(query, 5);
      
      // Format the results
      const formattedResults = results.map(doc => ({
        content: doc.pageContent,
        source: doc.metadata.source,
        // Add any other relevant metadata
      }));
      
      return JSON.stringify({
        query,
        results: formattedResults,
      });
    } catch (error: any) {
      console.error('Error in rules search tool:', error);
      return JSON.stringify({
        query,
        results: [],
        error: error.message,
      });
    }
  }
}

export const rulesSearchTool = new RulesSearchTool();