/**
 * This script is used to ingest Pokemon TCG rules and judge calls data into a vector store.
 * It reads text files from the data directory, splits them into chunks,
 * converts them to embeddings, and stores them in a FAISS vector store.
 */

import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { FaissStore } from 'langchain/vectorstores/faiss';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import * as fs from 'fs/promises';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

// Check for OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY environment variable is required');
  process.exit(1);
}

async function main() {
  console.log('Starting data ingestion process...');
  
  // Initialize the embeddings model
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'text-embedding-3-small',
  });
  
  // Get the paths to rules and judge calls directories
  const rulesDir = path.resolve(process.cwd(), 'data/rules');
  const judgeCallsDir = path.resolve(process.cwd(), 'data/judge-calls');
  
  // Check if directories exist
  await fs.mkdir(rulesDir, { recursive: true });
  await fs.mkdir(judgeCallsDir, { recursive: true });
  
  // Read files from both directories
  console.log('Reading files from rules and judge calls directories...');
  const ruleFiles = await fs.readdir(rulesDir);
  const judgeCallsFiles = await fs.readdir(judgeCallsDir);
  
  // Check if there are any files to process
  if (ruleFiles.length === 0 && judgeCallsFiles.length === 0) {
    console.warn('No files found in rules or judge calls directories. Add your .txt files there first.');
    return;
  }
  
  // Process all files
  const documents = [];
  
  // Process rules files
  console.log(`Processing ${ruleFiles.length} rules files...`);
  for (const file of ruleFiles) {
    if (file.endsWith('.txt')) {
      const filePath = path.join(rulesDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      console.log(`- Read ${file} (${content.length} characters)`);
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
  console.log(`Processing ${judgeCallsFiles.length} judge calls files...`);
  for (const file of judgeCallsFiles) {
    if (file.endsWith('.txt')) {
      const filePath = path.join(judgeCallsDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      console.log(`- Read ${file} (${content.length} characters)`);
      documents.push({
        content,
        metadata: {
          source: `judge-calls/${file}`,
          type: 'judge-call',
        },
      });
    }
  }
  
  console.log(`Total documents loaded: ${documents.length}`);
  
  // Split the documents into chunks
  console.log('Splitting documents into chunks...');
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1500,
    chunkOverlap: 200,
  });
  
  const splitDocs = [];
  
  for (const doc of documents) {
    const splits = await textSplitter.splitText(doc.content);
    console.log(`- Split ${doc.metadata.source} into ${splits.length} chunks`);
    for (const split of splits) {
      splitDocs.push({
        pageContent: split,
        metadata: doc.metadata,
      });
    }
  }
  
  console.log(`Total chunks created: ${splitDocs.length}`);
  
  // Create the vector store
  console.log('Creating vector store with embeddings...');
  const vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings);
  
  // Save the vector store to disk
  const directory = path.resolve(process.cwd(), 'data/vector-store');
  await fs.mkdir(directory, { recursive: true });
  await vectorStore.save(directory);
  
  console.log(`Vector store saved to ${directory}`);
  console.log('Data ingestion completed successfully!');
}

// Run the main function
main().catch((error) => {
  console.error('Error during data ingestion:', error);
  process.exit(1);
});