import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { FaissStore } from 'langchain/vectorstores/faiss';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import * as fs from 'fs/promises';
import * as path from 'path';

let vectorStore: FaissStore | null = null;

export async function getVectorStore() {
  if (vectorStore) {
    return vectorStore;
  }
  
  // Initialize the embeddings model
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
  
  // Attempt to load the vector store from disk
  try {
    const directory = path.resolve(process.cwd(), 'data/vector-store');
    vectorStore = await FaissStore.load(directory, embeddings);
    console.log('Vector store loaded from disk successfully');
    return vectorStore;
  } catch (error) {
    console.warn('Failed to load vector store from disk:', error);
    
    // Create a new vector store if loading fails
    return createNewVectorStore(embeddings);
  }
}

async function createNewVectorStore(embeddings: OpenAIEmbeddings) {
  console.log('Creating new vector store...');
  
  // Get a list of all rules and judge calls documents
  const rulesDir = path.resolve(process.cwd(), 'data/rules');
  const judgeCallsDir = path.resolve(process.cwd(), 'data/judge-calls');
  
  // Read files from both directories
  const ruleFiles = await fs.readdir(rulesDir);
  const judgeCallsFiles = await fs.readdir(judgeCallsDir);
  
  // Process all files
  const documents = [];
  
  // Process rules files
  for (const file of ruleFiles) {
    if (file.endsWith('.txt')) {
      const filePath = path.join(rulesDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      documents.push({
        content,
        metadata: {
          source: `rules/${file}`,
          type: 'rule',
        },
      });
    }
  }
  
  // Process judge calls files
  for (const file of judgeCallsFiles) {
    if (file.endsWith('.txt')) {
      const filePath = path.join(judgeCallsDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      documents.push({
        content,
        metadata: {
          source: `judge-calls/${file}`,
          type: 'judge-call',
        },
      });
    }
  }
  
  // Split the documents into chunks
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1500,
    chunkOverlap: 200,
  });
  
  const splitDocs = [];
  
  for (const doc of documents) {
    const splits = await textSplitter.splitText(doc.content);
    for (const split of splits) {
      splitDocs.push({
        pageContent: split,
        metadata: doc.metadata,
      });
    }
  }
  
  // Create the vector store
  vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings);
  
  // Save the vector store to disk
  const directory = path.resolve(process.cwd(), 'data/vector-store');
  await fs.mkdir(directory, { recursive: true });
  await vectorStore.save(directory);
  
  console.log('Vector store created and saved successfully');
  
  return vectorStore;
}