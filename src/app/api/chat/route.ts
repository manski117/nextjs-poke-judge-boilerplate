import { NextResponse } from 'next/server';
import { createAgent } from '../../lib/langchain/agent' //'../../lib/langchain/tools/rules-search'
import { AgentExecutor } from 'langchain/agents';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    // Create the agent executor
    const agent = await createAgent();
    
    // Extract the user's latest message
    const userMessage = messages[messages.length - 1].content;
    
    // Execute the agent with the user's message
    const result = await agent.invoke({
      input: userMessage,
      chat_history: messages.slice(0, -1),
    });
    
    // Extract any card results if present
    let cardResults = [];
    if (result.intermediateSteps) {
      for (const step of result.intermediateSteps) {
        if (step.tool === 'card-search' && step.toolOutput) {
          try {
            const parsedOutput = JSON.parse(step.toolOutput);
            if (Array.isArray(parsedOutput)) {
              cardResults = parsedOutput;
            }
          } catch (e) {
            console.error('Failed to parse card results:', e);
          }
        }
      }
    }
    
    return NextResponse.json({
      response: result.output,
      cardResults,
    });
  } catch (error: any) {
    console.error('Error in chat endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during the request' },
      { status: 500 }
    );
  }
}