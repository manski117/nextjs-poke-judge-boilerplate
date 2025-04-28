import { AgentExecutor } from 'langchain/agents';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { createStructuredChatAgent } from 'langchain/agents/structured_chat';
import { DynamicTool } from "langchain/tools";
import { cardSearchTool } from '../langchain/tools/card-search';
import { rulesSearchTool } from '../langchain/tools/rules-search';

export async function createAgent() {
  // Initialize the LLM
  const llm = new ChatOpenAI({
    modelName: process.env.LLM_MODEL || 'gpt-4o-mini',
    temperature: 0.2,
  });

  // Define tools
  const tools = [
    cardSearchTool,
    rulesSearchTool,
  ];

  // Create the agent
  const agent = await createStructuredChatAgent({
    llm,
    tools,
  });

  // Create the agent executor
  const agentExecutor = new AgentExecutor({
    agent,
    tools,
    verbose: process.env.DEBUG === 'true',
    returnIntermediateSteps: true,
  });

  return agentExecutor;
}