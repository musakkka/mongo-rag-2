import { NextRequest, NextResponse } from 'next/server';
import { generateRAGResponse, generateConversationalRAGResponse } from '@/lib/rag';

// ========================================
// RAG STEP 2: RETRIEVAL & GENERATION
// ========================================

/**
 * STEP 2A: Configure search parameters for retrieval
 */
function configureRetrievalOptions(options: any = {}) {
  console.log(`⚙️ STEP 2A: Configuring retrieval parameters`);
  
  const searchConfig = {
    searchLimit: 3,           // Number of documents to retrieve
    searchThreshold: 0.2,     // Similarity threshold (70%+ similarity)
    ...options
  };
  
  console.log(`📊 Search Config: Limit=${searchConfig.searchLimit}, Threshold=${searchConfig.searchThreshold}`);
  return searchConfig;
}

/**
 * STEP 2B: Retrieve relevant documents from vector database
 */
async function retrieveRelevantDocuments(question: string, options: any) {
  console.log(`🔍 STEP 2B: Retrieving relevant documents for: "${question}"`);
  
  // This calls the actual retrieval logic from lib/rag.ts
  // The implementation details are hidden for presentation clarity
  const response = await generateRAGResponse(question, options);
  
  console.log(`📚 Retrieved ${response.sources.length} relevant documents`);
  response.sources.forEach((source, index) => {
    console.log(`  ${index + 1}. ${source.title} (Score: ${source.score?.toFixed(3) || 'N/A'})`);
  });
  
  return response;
}

/**
 * STEP 2C: Generate contextual response using retrieved documents
 */
async function generateContextualResponse(question: string, conversationHistory: any[], options: any) {
  console.log(`🤖 STEP 2C: Generating contextual response`);
  
  if (conversationHistory && conversationHistory.length > 0) {
    console.log(`💬 Using conversational RAG with ${conversationHistory.length} previous messages`);
    return await generateConversationalRAGResponse(question, conversationHistory, options);
  } else {
    console.log(`📝 Using standard RAG for single question`);
    return await generateRAGResponse(question, options);
  }
}

/**
 * STEP 2D: Format response for presentation
 */
function formatRAGResponse(response: any) {
  console.log(`📋 STEP 2D: Formatting response for presentation`);
  
  return {
    answer: response.answer,
    sources: response.sources.map((source: any) => ({
      title: source.title,
      content: source.content,
      score: source.score,
    })),
    usage: response.usage,
    step: "Retrieval & Generation",
    processSteps: [
      "Question received",
      "Vector similarity search performed", 
      "Relevant documents retrieved",
      "Context combined with question",
      "AI response generated"
    ]
  };
}

// ========================================
// MAIN API ENDPOINT
// ========================================

export async function POST(request: NextRequest) {
  try {
    const { question, conversationHistory, options } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    console.log(`\n🚀 STARTING RAG STEP 2: Retrieval & Generation`);
    console.log(`❓ Question: "${question}"`);

    // Execute RAG Step 2: Retrieval & Generation Pipeline
    const searchOptions = configureRetrievalOptions(options);
    const response = await generateContextualResponse(question, conversationHistory, searchOptions);
    const formattedResponse = formatRAGResponse(response);

    console.log(`✅ RAG Step 2 Complete: Generated response with ${response.sources.length} sources`);

    return NextResponse.json(formattedResponse);

  } catch (error) {
    console.error('❌ RAG Step 2 Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate RAG response in Step 2' },
      { status: 500 }
    );
  }
}
