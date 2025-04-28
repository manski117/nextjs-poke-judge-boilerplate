import { NextResponse } from 'next/server';
import { cardSearchTool } from '../../lib/langchain/tools/card-search';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query parameter is required and must be a string' },
        { status: 400 }
      );
    }
    
    const results = await cardSearchTool.call(query);
    
    return NextResponse.json({
      results: JSON.parse(results),
    });
  } catch (error: any) {
    console.error('Error in card search endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during card search' },
      { status: 500 }
    );
  }
}