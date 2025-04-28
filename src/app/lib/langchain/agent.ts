import { AgentExecutor } from 'langchain/agents';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { createStructuredChatAgent } from 'langchain/agents';
import { DynamicTool } from "langchain/tools";
import { cardSearchTool } from '../langchain/tools/card-search';
import { rulesSearchTool } from '../langchain/tools/rules-search';
import { ChatPromptTemplate } from 'langchain/prompts';

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

  //Create a prompt template for our agent
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are a helpful Pokemon TCG rules assistant. You can answer questions about the Pokemon Trading Card Game rules, card interactions, and specific cards.
    
      If someone asks about a specific card, use the card-search tool to find information about it.
      If someone asks about game rules or specific rulings, use the rules-search tool to find relevant information.
      
      Always be friendly, accurate, and helpful. If you're not sure about something, it's better to admit that than to give incorrect information.`],
      ["human", "{input}"],
      ["agent", "{agent_scratchpad}"]
  ]);

  // Create the agent
  const agent = await createStructuredChatAgent({
    llm,
    tools,
    prompt,
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