import { NextResponse } from 'next/server';
import { rulesSearchTool } from '../../lib/langchain/tools/rules-search'

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query parameter is required and must be a string' },
        { status: 400 }
      );
    }
    
    const results = await rulesSearchTool.call(query);
    
    return NextResponse.json({
      results,
    });
  } catch (error: any) {
    console.error('Error in rules search endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during rules search' },
      { status: 500 }
    );
  }
}